---
title: "Your Agent's Memory Is a Liability"
number: 7
publishedDate: 2026-04-12
description: "Unbounded state growth degrades everything. Retention policies, tiered storage, and git-backed snapshots."
tags: [memory, retention, architecture, operations]
status: review
---

Every database you've ever operated has retention policies. Every log pipeline has rotation. Every cache has eviction. But agent memory? Agent memory is a append-only text file that grows until something breaks, and when it breaks, it breaks silently.

I learned this the hard way with Clawdius. Three days of active use — email triage, calendar management, research tasks, content drafts — and the memory directory had grown to 360KB. That's 120KB per day of raw operational state: tool results, conversation fragments, decision rationale, extracted facts, daily logs. None of it pruned. None of it prioritized. All of it competing for space in a context window that doesn't care about your feelings.

The problem isn't that memory grows. The problem is what happens when it hits the ceiling.

---

## The Silent Truncation Problem

OpenClaw's memory system stores everything in files. Daily logs capture what the agent did. MEMORY.md captures what the agent knows. Both are loaded at conversation start through the bootstrap system, which has two hard limits: `bootstrapMaxChars` at 20,000 characters per file, and `bootstrapTotalMaxChars` at 150,000 characters aggregate across all bootstrapped files.

Those limits sound generous until you do the arithmetic. At 120KB per day, you blow past the per-file limit in under a week of active logging. The aggregate limit gives you more runway, but memory isn't the only thing competing for bootstrap space — identity files, project context, skill definitions, and configuration all draw from the same 150K budget.

Here's what happens when a file exceeds `bootstrapMaxChars`: it gets silently truncated. No error. No warning. No indication to the agent or the user that content was dropped. The agent simply starts a new conversation without the context that was supposed to be there. Yesterday's decisions, last week's research findings, the user preferences it extracted from three conversations ago — all still on disk, all invisible to the agent.

This is the operational equivalent of a database that silently drops rows when a table gets too large. You'd never accept that in a production system. But it's the default behavior for every OpenClaw agent running today.

---

## Context Is the Real Constraint

Memory at rest is one problem. Memory in flight is worse.

Every message in a conversation adds to the context window. Tool results are particularly expensive — a single file read or search result can consume thousands of tokens. Without intervention, a 35-message conversation can balloon to 208K tokens. At that point, the model either refuses to respond or starts producing degraded output. I've seen both. The degraded output is worse because you don't always notice it.

OpenClaw has a mitigation for this: context pruning, configured as `mode: "cache-ttl"` in the model settings. It trims old tool results as the conversation grows, keeping recent context fresh while evicting stale results. Reasonable approach. One problem: it's off by default for non-Anthropic model profiles. If you're running Claude through a custom provider configuration — which most serious users are — you have to know to enable it. Most don't.

There's also a pre-compaction memory flush. Before the system compresses the conversation context, it runs a silent agentic turn to save important information to memory files. This is genuinely clever engineering — it means the agent can recover key facts even after aggressive context pruning. But it's also invisible to the user. Your agent is making decisions about what to remember and what to forget, and you have no visibility into those decisions unless you go read the memory files after each conversation.

This is the fundamental tension: memory management is critical infrastructure, but it's implemented as an invisible background process with no observability, no alerting, and no user-facing controls.

---

## Identity Drift Is a Memory Problem

I talked in installment 5 about how personality is three paragraphs in SOUL.md. What I didn't cover is what happens when those three paragraphs stop fitting in context.

Identity files — SOUL.md, IDENTITY.md, and the `identity` fields in openclaw.json — drift in four predictable ways: bloat, staleness, contradiction, and scope creep.

**Bloat** is the most insidious. Identity files grow because it's always easier to add a rule than to remove one. "Don't use emojis." "Don't open with greetings." "When handling calendar conflicts, prefer the earlier commitment." Each rule is individually reasonable. Collectively, they expand the file until it crosses the `bootstrapMaxChars` threshold. At that point, the file is truncated, and the agent loses whichever personality traits happened to be at the bottom of the file. Your agent doesn't change personality dramatically — it just becomes subtly inconsistent in ways that are hard to diagnose.

**Staleness** compounds the problem. Rules that made sense three months ago — "Always CC the project manager on status updates" — persist because nobody reviews identity files on a schedule. The project manager left. The agent keeps CCing them. Or worse, the truncation drops the stale rules and keeps them, creating an agent that follows outdated instructions in some conversations and ignores them in others, depending on whether the file was truncated.

**Contradiction** is inevitable in any file that multiple sources can modify. SOUL.md says "be terse." A skill definition says "provide detailed explanations for calendar conflicts." The `identity` field in openclaw.json says "always explain your reasoning." Three sources, three conflicting instructions, no resolution mechanism. The agent picks whichever instruction happens to be closest to the query in context, which means behavior varies by conversation length and topic ordering.

**Scope creep** is when identity files start encoding operational rules that belong in skills or AGENTS.md. "When you see an email from the bank, flag it as urgent" isn't a personality trait. It's an operational rule. But it ends up in SOUL.md because that's the file people know how to edit, and it works — until the file gets too large and the rule is silently dropped.

These four failure modes interact. A bloated file gets truncated, which removes some contradictions but introduces staleness because the surviving rules weren't curated. The user adds new rules to fix the behavior, which increases bloat. The cycle repeats.

---

## What Tiered Memory Actually Looks Like

ClawHQ's answer to this is a three-tier memory lifecycle, implemented in `src/evolve/memory/lifecycle.ts`. It's the architecture I wish OpenClaw shipped by default.

**Hot memory** covers anything from the last seven days, capped at 50KB. This is the tier that loads into every conversation at full fidelity. Daily logs, recent decisions, extracted facts, active project context — all of it available without search. The seven-day window and size cap mean the agent always starts with recent, relevant context without blowing the bootstrap budget.

**Warm memory** covers 7 to 90 days. When memory transitions from hot to warm, an LLM pass extracts key facts and generates a summary. The full text is archived and remains searchable on demand through `memory_search` and `memory_get` tools, but it doesn't load automatically. This is the critical insight: most memory doesn't need to be in every conversation. It needs to be findable when relevant. The difference between "always loaded" and "searchable on demand" is the difference between a 150K bootstrap budget that's constantly overflowing and one that stays comfortably within limits.

**Cold memory** covers anything older than 90 days. Further compression runs, PII is masked, and the content is optimized for long-term storage rather than retrieval speed. You can still search it, but the results are summaries of summaries — useful for "when did I last deal with this vendor?" questions, not for reconstructing detailed decision rationale.

The transitions run automatically on schedule. No user intervention required. No "weekly curation ritual" that nobody actually does.

That last point matters. OpenClaw's recommended mitigation for memory growth is manual curation — the user should periodically review memory files, prune stale content, reorganize facts, and compress verbose entries. The documentation frames this as a "weekly curation ritual." This is SRE work. It's the kind of operational maintenance that production systems automate precisely because humans don't do it reliably. Telling users to manually curate their agent's memory is like telling them to manually rotate their database logs. Some will. Most won't. The system needs to work for the ones who won't.

---

## Context Pruning as Default

One design decision in ClawHQ that I'm particularly firm about: context pruning is enabled by default in every generated configuration. Not opt-in. Not documented-but-disabled. On.

The upstream default — pruning disabled for non-Anthropic profiles — is a reasonable engineering choice if you're building a general-purpose tool and you don't want to surprise users by dropping context. But it's the wrong default for an agent that runs daily, handles real tasks, and accumulates real state. Without pruning, every long conversation is a ticking bomb. Thirty-five messages in, you're at 208K tokens, and the session either dies or degrades. Users blame the model. The model is fine. The context management is absent.

Enabling pruning by default means accepting a trade-off: old tool results will be evicted, and the agent might need to re-fetch information it already retrieved earlier in the conversation. That's a minor efficiency cost. Silent session death is a catastrophic usability cost. The trade-off is obvious.

---

## Identity File Budgets

For the identity drift problem, ClawHQ implements token budgets per identity file. Each file — SOUL.md, IDENTITY.md, any identity section in the configuration — has an allocated budget within the bootstrap limit. The `doctor` command detects oversized files and warns before they hit the truncation threshold.

This is simple tooling. It's not sophisticated. But it converts a silent failure into a visible warning, which is the minimum viable improvement for any operational system. You can't fix what you can't see, and silent truncation is invisible by design.

The broader principle: every piece of memory that loads into context should have an explicit budget, and exceeding that budget should produce a warning, not a silent truncation. This applies to identity files, memory files, skill definitions, and project context. If the total exceeds the bootstrap limit, the user should know which files are competing and which ones are losing.

---

## The Database Analogy Isn't a Metaphor

I keep reaching for database analogies because agent memory *is* a database. It's a persistence layer that stores state across sessions, supports queries (memory search), has consistency requirements (identity shouldn't contradict itself), and degrades under unbounded growth.

The difference is that databases have fifty years of operational wisdom baked into their tooling. Retention policies, tiered storage, compaction, monitoring, alerting, backup and restore, capacity planning. None of this is exotic. All of it is standard.

Agent memory has none of it by default. The state of the art is "append to a text file and hope the context window is big enough." When it isn't, the failure mode is silent degradation — the agent gets subtly worse in ways that are hard to attribute to any specific cause.

The fix isn't complicated. It's the same fix that every other persistence layer has converged on:

**Explicit retention policies.** Every piece of memory should have a defined lifetime. Hot, warm, cold — the specific tiers matter less than the principle that memory expires.

**Tiered storage.** Recent memory loads automatically. Older memory is searchable on demand. Ancient memory is archived. The tiers map to different fidelity levels and different cost profiles.

**Regular pruning.** Automated, not manual. On a schedule, not when the user remembers. With logging, not silently.

**Auditable history.** When memory transitions between tiers, the transition should be logged. When content is compressed, the original should be archived. When identity files change, the diff should be visible.

**Capacity monitoring.** The user should know how much of their bootstrap budget is consumed, by what, and when it's approaching limits.

None of this is novel engineering. It's applying standard operational practices to a new persistence layer. The only reason it doesn't exist yet is that agent memory is young enough that people are still treating it as a feature rather than as infrastructure.

It's infrastructure. Treat it accordingly.

---

*Next: [Securing the Toolbelt](/series/ops-layer-08) — when your agent has API keys, shell access, and the ability to send emails on your behalf, security stops being theoretical.*
