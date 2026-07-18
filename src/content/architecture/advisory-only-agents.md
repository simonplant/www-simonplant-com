---
title: "The Advisory-Only Agent: A Structural Boundary for High-Stakes Domains"
status: review
tags: [pattern, ai-agents, safety, agent-design]
description: "When an AI agent operates in a domain where mistakes are expensive and irreversible, make execution structurally impossible — not a config flag. The agent proposes, briefs, and alerts; a human pulls every trigger."
publishedDate: 2026-07-18
---

## The problem

The pressure to let an agent execute is highest exactly where judgment matters most. A trading agent that watches the market all day *could* place the order it just proposed. An ops agent that diagnosed the incident *could* apply the fix. Every demo pushes toward closing the loop, because closing the loop is impressive.

But in high-stakes domains — money, production infrastructure, anything medical or legal — an agent that can execute will eventually execute wrongly, at machine speed, in your name. And a permission flag that *disables* execution is one config drift, one prompt injection, or one "temporary" override away from being a flag that doesn't.

## The pattern

Make execution **structurally impossible**, not administratively forbidden. The agent's runtime contains no code path that reaches the execution system. Execution lives in a separate tool with its own authentication, operated by a human.

My reference implementation is [Sterling](/projects/sterling), my trading assistant. Sterling analyzes, proposes trades, monitors price against a locked plan, and alerts — proactively, on its own schedule. It has never placed an order, and it cannot: there is no broker integration in the system at all. The boundary isn't policy; it's architecture.

Two supporting decisions make the boundary useful rather than crippling:

- **High agency everywhere else.** Advisory-only does not mean passive. Sterling initiates briefs, enriches watchlists, and fires alerts without being asked. Constrain the *irreversible* action, not the initiative.
- **Risk annotates; it never suppresses.** Risk checks mark a proposal as concerning rather than silently deleting it. A human reviewing an annotated list makes better decisions than a human reviewing a filtered one — and the filter is where an agent's mistakes hide.

## When to use it

- The action is irreversible or expensive to reverse (trades, deletes, sends, deploys).
- The cost of a wrong action exceeds the cost of a human confirming a right one.
- You cannot fully enumerate the failure modes in advance — which is most LLM-driven systems.

When the action is cheap and reversible (drafting, tagging, summarizing), this pattern is overhead; let the agent act.

## Trade-offs

- **The human is the throughput limit.** Every action waits for a person. In domains where latency is alpha, that costs something real — the pattern bets that avoided catastrophes are worth more.
- **It demands honesty about scope creep.** The pattern dies by a thousand "just this one automation." The discipline is binary: either the execution path doesn't exist, or you're running a different (riskier) architecture and should say so.
- **Advisory quality is harder to measure.** An executing agent's P&L is legible. An advisor's value shows up in decision quality, which you have to instrument deliberately (log proposals and outcomes — see the event-log pattern).

## Related patterns

- [Event Log as System of Record](/architecture/event-log-as-system-of-record) — makes the propose/decide/act loop auditable.
- [LLM at the Edges](/architecture/llm-at-the-edges) — keeps the reasoning that produces proposals inspectable.
- [Credential Isolation for AI Agents](/architecture/credential-isolation-for-agents) — the complementary boundary: even the data-gathering side never holds raw credentials.
