---
title: "Why My Trading Agent Can't Trade"
publishedDate: 2026-07-18
tags: [ai-agents, trading, agent-design, sovereignty]
description: "I built an AI agent that watches the market all day, briefs me, and proposes trades against a locked plan. It has never placed an order — and it structurally cannot. Here's why that constraint is the whole point."
status: published
tier: signal
---

I run an AI agent called [Sterling](/projects/sterling). It reads the market open to close, tracks a live trading floor, watches price against a plan I locked before the session, and messages me over Telegram the moment something crosses a level I care about. It is proactive and high-agency — it briefs me in the morning without being asked, enriches my focus list, and alerts me intraday on its own initiative.

It has never placed a trade. It cannot place a trade. There is no code path in the entire system that reaches a broker.

Most people's first reaction is that I've built the boring 90% and stopped before the interesting part. I think it's the opposite. The constraint is the interesting part, and I want to explain why.

## The pressure to close the loop

Every agent demo pushes toward autonomy, because autonomy is what looks impressive. An agent that *proposes* a trade is a research tool. An agent that *places* the trade is the future. The whole cultural gravity of the field pulls toward closing the loop.

But think about where that loop closes: on an irreversible action, at machine speed, in a domain where being wrong is expensive. An agent that can execute will, eventually, execute wrongly — on a hallucinated level, a misparsed alert, a stale price, or a prompt injection riding in on a piece of market commentary it read. And it will do it faster than I can react.

The standard answer is a permission flag: let the agent execute, but gate it behind a config setting you can turn off. I don't trust that answer, and neither should you. A flag that *disables* execution is one config drift, one override, one "just this once" away from being a flag that doesn't. I've [watched a drifted config quietly re-expose a service I thought was locked down](/blog). Behavioral controls fail open.

## Structural, not behavioral

So Sterling's boundary isn't a setting. It's the architecture. The system has no broker integration at all — no API keys, no order endpoint, no execution module sitting dormant behind a flag. Asking Sterling to place a trade is like asking a calculator to send an email. The capability doesn't exist to be misused. Execution lives entirely in my broker platform, operated by me.

That's a pattern I've come to think of as the [advisory-only agent](/architecture/advisory-only-agents): in any high-stakes domain, make the dangerous action *structurally impossible* rather than administratively forbidden. Constrain the irreversible thing; leave everything else high-agency.

And Sterling is high-agency everywhere else. Advisory doesn't mean passive — it means the human holds the trigger, not that the agent waits to be asked. Sterling initiates. It just can't pull the trigger, because there is no trigger wired to it.

## The constraint made the rest of the design better

Here's what I didn't expect: designing around the advisory boundary forced better engineering everywhere.

Because Sterling can't act on a bad number, I could be ruthless about *never letting a language model produce a number*. The model lives [at the edges](/architecture/llm-at-the-edges) — extracting structure from messy inputs, writing the prose of a briefing — and deterministic code does everything in between. Anything arithmetic is code, never the model.

Because every proposal is reviewed by a human, I could make risk checks *annotate* rather than *suppress*. A risky idea shows up flagged, not deleted — because I'm the filter, and a filter that silently drops things is where an agent's mistakes hide.

Because I need to reconstruct why Sterling said what it said, its memory is an [append-only, hash-chained event log](/architecture/event-log-as-system-of-record) — the system of record, with every brief and alert a replayable projection over it.

And because I don't want my trading intent transiting someone else's servers, it all runs [local-first](/architecture/local-first-model-routing) on my own hardware, [credential-isolated](/architecture/credential-isolation-for-agents) behind a vending proxy and an egress firewall, on the assumption that the agent will eventually be manipulated and shouldn't be able to leak what it never held.

None of that is trading-specific. It's what building a *trustworthy* agent looks like when you start from "this thing will be wrong sometimes" instead of "this thing will be smart enough."

## The generalization

The advisory-only pattern isn't about trading. It's about any domain where an agent operates and mistakes are costly and hard to reverse — money, production infrastructure, anything medical or legal. The move is the same: let the agent analyze, propose, and alert with full initiative, and make the irreversible action something only a human can take, enforced below the model where the guarantee actually holds.

We're going to spend the next few years watching people wire agents directly to the things that hurt when they're wrong, discovering the failure modes in production. I'd rather design the boundary in from the start. My trading agent can't trade. That's not the unfinished part. That's the design.
