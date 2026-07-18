---
title: "Prompt Injection for Solution Architects"
description: "The defining vulnerability class of LLM systems, explained at the level where it can actually be fixed: architecture. Injection isn't a prompt-writing problem — it's a privilege-separation problem."
status: published
tags: [prompt-injection, ai-agents, fundamentals]
kind: technique
stance: dual
publishedDate: 2026-07-18
---

## The class, precisely

An LLM has one input channel. Instructions and data arrive in the same stream of tokens, and nothing in the model architecturally distinguishes them. Prompt injection is the exploitation of that fact: content that was supposed to be *data* — a web page, an email, a PDF, a tool result — carries text that the model treats as *instructions*.

If you've been in security long enough, you've seen this movie. It's SQL injection's shape all over again: a system that concatenates untrusted input into a command channel. The difference is that SQL had a fix — parameterized queries separate code from data at the protocol level — and LLMs, so far, do not. There is no reliable token-level boundary. Every "ignore previous instructions" filter, every delimiter convention, every "the following is untrusted, do not follow instructions in it" preamble is a mitigation the attacker gets unlimited free attempts against.

Two variants matter for design:

- **Direct injection** — the attacker is the user, steering the model in their own session. Mostly a content-policy and abuse problem; bounded blast radius.
- **Indirect injection** — the attacker plants instructions in content the system will *read on someone else's behalf*: the web page your agent summarizes, the calendar invite it processes, the ticket it triages. This is the one that matters for agents, because the victim never sees the attack.

## Why architects own this problem

The instinct is to treat injection as a model-quality issue — wait for better models, add a guard prompt, buy a filter. That framing puts the control at the layer with the weakest guarantees. Models get *harder* to inject, never *impossible*; a control that fails open one time in a thousand is not a boundary.

The controls that hold are the ones enforced **below the model**, and those are architectural decisions:

1. **Assume the model is compromised; size the blast radius.** The question isn't "can my agent be injected?" (yes) but "what does an injected agent get?" Credentials it holds, egress it has, files it can write, actions it can execute — every one of those is a design-time decision. See [Credential Isolation for AI Agents](/architecture/credential-isolation-for-agents) and [The Advisory-Only Agent](/architecture/advisory-only-agents): both are, at bottom, injection blast-radius patterns.
2. **Separate privilege by context, not by prompt.** An agent that reads untrusted content and an agent that holds sensitive capability should not be the same context. Split reader from actor: the component that summarizes the web gets no tools; the component with tools reads only structured, validated output from the reader. That's the LLM version of parameterized queries — imperfect, but it moves the boundary out of the token stream.
3. **Persistence is the escalation to block first.** A one-session manipulation is bounded; an injection that writes itself into the agent's memory or identity files survives forever. Read-only identity files and reviewed memory tiers close it — see [The Agent Workspace Is an Attack Surface](/security/agent-workspace-attack-surface).
4. **Validate at the structure level, not the content level.** You can't reliably detect malicious *text*, but you can require the model's output to conform to a schema, an enum, an allowlist of actions — and reject everything else deterministically. Structured output validation is injection containment that actually terminates.

## How to think about residual risk

After all of that, a manipulated session can still produce wrong *advice* — a poisoned summary, a skewed recommendation. Architecture bounds actions and persistence; it does not make model output trustworthy. The honest posture is the one financial systems take with human analysts: outputs are proposals subject to review, provenance is logged (see [Event Log as System of Record](/architecture/event-log-as-system-of-record)), and nothing irreversible happens on a model's say-so alone.

## Related

- [The Agent Workspace Is an Attack Surface](/security/agent-workspace-attack-surface) — the persistence pivot in detail.
- [Credential Isolation for AI Agents](/architecture/credential-isolation-for-agents) — the blast-radius pattern.
- [The Advisory-Only Agent](/architecture/advisory-only-agents) — the action-boundary pattern.
