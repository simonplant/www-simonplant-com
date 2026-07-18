---
title: "The Auto-Loaded Context Contract"
status: published
tags: [pattern, ai-agents, agent-design]
description: "Every agent framework loads a fixed set of context at session start — and silently ignores everything else. Treat that set as a contract: design your agent's knowledge around what is guaranteed to be present after any restart or compaction."
publishedDate: 2026-07-18
---

## The problem

Agent operators put critical knowledge in files the agent will never see. It's the most common failure mode I've found in deployed agents, and it's invisible until it hurts: the agent behaves perfectly all afternoon (the file was read into context once), then "forgets" after a restart or a context compaction — because the knowledge lived in `notes.md`, and the framework only auto-loads its own fixed list.

OpenClaw, for example, auto-loads exactly eight filenames at session start; anything else is invisible unless a tool call explicitly reads it (see the [OpenClaw architecture reference](/architecture/openclaw-anatomy)). Claude Code loads `CLAUDE.md` and a memory index. Every framework has some version of this list. Operators who don't know their framework's list are programming an agent whose actual system prompt they haven't read.

## The pattern

Treat the auto-loaded set as a **contract** and design knowledge placement around three tiers:

1. **Guaranteed context** — the auto-loaded files. This is the only knowledge that survives every restart and compaction. Budget it like the scarce resource it is: identity, operating rules, and a *curated* long-term memory. Small, stable, versioned.
2. **Indexed knowledge** — everything the agent should be able to find. It lives in arbitrarily-named files, but the *index* to it lives in guaranteed context: a one-line-per-item catalog that tells the agent what exists and when to read it. The agent pays a tool call to retrieve; the index is what makes retrieval reliable rather than lucky.
3. **On-demand reference** — bulk material (docs, transcripts, archives) that is never loaded wholesale. Reachable through search or explicit paths, referenced from the index when it matters.

Two disciplines keep the contract honest:

- **Right file, right tier.** Persona rules drifting into memory files, environment notes drifting into persona files — misplacement is a behavioral bug that presents as "the agent is being weird." Each guaranteed file has one job; enforce it in review.
- **Assume compaction is coming.** Anything said only in conversation is already lost. If a session produced knowledge worth keeping, the agent's job — explicitly, as an operating rule — is to write it into the indexed tier before the context dies.

## When to use it

Always. This isn't an architectural option; it's a property of every framework that assembles system prompts from files. The only choice is whether you design for it or discover it.

## Trade-offs

- **Curation is unglamorous ongoing work.** Guaranteed context degrades into a junk drawer without periodic pruning. The budget discipline (keep it small enough to read in one sitting) is what makes the tier meaningful.
- **Indexes drift from reality.** A stale index is worse than none — the agent confidently reads the wrong thing. Make index updates part of the same change that adds the knowledge, never a separate chore.
- **Tool-call retrieval costs latency and tokens.** The trade is deliberate: a lean guaranteed tier plus paid retrieval beats a bloated always-loaded prompt that slows and degrades every single turn.

## Related patterns

- [Event Log as System of Record](/architecture/event-log-as-system-of-record) — session-produced facts belong in durable, replayable storage, not conversation memory.
- [OpenClaw Architecture: Anatomy of a Personal AI Agent](/architecture/openclaw-anatomy) — the concrete 8-file instance of this contract, with per-file placement rules.
