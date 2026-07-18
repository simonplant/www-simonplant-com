---
title: "Local-First Model Routing with Explicit Escalation"
status: review
tags: [pattern, ai-agents, llm-ops, sovereignty]
description: "Run the local model as the default for everything, and make frontier-model escalation an explicit, visible decision — never a silent fallback triggered by the presence of an API key."
publishedDate: 2026-07-18
---

## The problem

Multi-model agent stacks drift toward the most capable model by default, because every fallback chain is written in the capable model's favor: if the local model stumbles, retry on the frontier API. Three consequences compound quietly. Cost stops being predictable, because escalation is load-dependent. Privacy stops being a property, because which prompts left the box is now a runtime question. And the local model never gets better at the job, because the system routes around its weaknesses instead of engineering prompts and post-processing that fix them.

The subtlest failure is **key-presence routing**: code that uses the cloud provider *because a key exists in the environment*. Configuration by side effect — nobody decided to send that workload off-box, but there it goes.

## The pattern

**The local model is primary for everything; escalation is explicit, named, and scoped.**

In [Sterling](/projects/sterling), one local model on my own GPU handles both interactive chat and all batch extraction. Three rules keep that honest:

- **Escalation requires an explicit setting.** Batch jobs use a frontier model only when a specific environment variable says so, per invocation. The presence of an API key selects nothing. Reading the config tells you exactly which workloads can leave the box, and everything else provably cannot.
- **Engineer around the local model's weaknesses instead of routing around them.** Per-source prompt addenda encode each input's idioms; anything arithmetic is a deterministic post-pass, never the model (see [LLM at the Edges](/architecture/llm-at-the-edges)). Most "the local model isn't good enough" cases are actually "the task wasn't decomposed enough."
- **Optional model features default off.** Secondary LLM niceties (a summarizer here, a rephrase there) ship behind flags that are off by default. Deterministic rendering is the baseline; model garnish is opt-in.

## When to use it

- Workloads touching data you don't want transiting a third party — trading intent, security findings, personal context.
- Systems that must have predictable, bounded costs.
- Anywhere you own capable hardware and the tasks decompose into extraction, classification, and rendering — which after honest decomposition is more of them than the frontier-first reflex assumes.

The frontier model earns its place on genuinely hard reasoning where quality verifiably differs — as a deliberate choice for that phase, not a fallback.

## Trade-offs

- **You will feel the local model's ceiling** — and pay an engineering tax (prompt work, verification, decomposition) to work within it. The tax buys sovereignty and cost control; whether that's a good trade is domain-specific.
- **Verified extraction becomes mandatory, not optional.** Trusting a smaller model on the input edge only works with an independent check on its structured output.
- **Hardware is now your uptime problem.** The GPU box is a single point of failure that a SaaS API wasn't. Cron-driven watchdogs and boring recovery paths ([Cron over Bus](/architecture/cron-over-bus)) matter more, not less.

## Related patterns

- [LLM at the Edges](/architecture/llm-at-the-edges) — the decomposition that makes a local model sufficient.
- [Credential Isolation for AI Agents](/architecture/credential-isolation-for-agents) — the same sovereignty posture applied to secrets and egress.
