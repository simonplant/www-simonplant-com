---
title: Sterling
tagline: A sovereign, local-first advisory trading agent
description: An always-on trading assistant that briefs, watches levels against the plan, and proposes trades — but never places an order. Local models, deterministic pipelines, and a hash-chained event log as the system of record.
status: active
role: Advisory Trading Agent
tags: [trading, ai-agents, local-first, event-sourcing, openclaw]
order: 1
relatedProducts: [clawhq]
---

## What it is

Sterling is my personal trading assistant, reached over Telegram. It is proactive — it runs morning briefs, enriches the day's focus list, monitors price against a locked plan intraday, and reviews at the close — but it operates under one hard line: **advisory only**. It proposes and alerts; a human pulls every trigger. There is no order-placement path in the system at all — execution lives entirely in the broker platform.

The repository is private. What's worth sharing is the architecture, because most of it is the opposite of how AI agents are usually built.

## Architecture patterns

**LLM at the edges, determinism in the middle.** Every pipeline phase is deterministic compute plus a render step, with at most one terminal LLM call per phase — and that call produces prose for humans, never data for machines. Anything arithmetic is code, never a model.

**Event log as the system of record.** An append-only, hash-chained event log is the single source of truth. Briefs, focus sheets, and reviews are all projections over it — freely re-rendered, never authoritative. The same code tails the log live and replays it, and the hash chain makes any edit to history detectable.

**Verified extraction.** Structured data pulled from unstructured sources goes through paired producers — a primary extractor and an independent verifier — with cross-producer diffs. Disagreement flags; it never silently drops.

**Local-first models.** Interactive chat and batch extraction run on a local model on my own GPU. A frontier model is an explicit, opt-in escalation — never a silent default.

**Credential isolation.** Credentials never leave the box: read-only containers, a credential-vending proxy, DNS allowlisting, and an egress firewall around everything.

**Boring scheduling.** One scheduler — host cron driving deterministic scripts. No pub-sub bus, no orchestration framework; coordination is completion flags and typed state.

Sterling runs on the OpenClaw agent runtime and carries forward everything I learned operating agents with ClawHQ and Clawdius — this is where those experiments landed.

## Why advisory-only

Automation pressure is highest exactly when judgment matters most. Sterling exists to surface the next decision *against the plan* so it isn't generated under execution pressure — not to remove the human from the loop. The boundary isn't a config flag; it's structural. The system cannot place an order.
