---
title: "Cron over Bus: Boring Scheduling for Agent Systems"
status: published
tags: [pattern, ai-agents, operations, reliability]
description: "Agent systems reach for pub-sub buses and orchestration frameworks long before they need them. One host scheduler driving deterministic scripts — with completion flags and typed state for coordination — is easier to reason about, debug, and trust."
publishedDate: 2026-07-18
---

## The problem

The moment an agent system grows a second scheduled job, the architecture conversation turns to message buses, worker queues, and orchestration frameworks. For a personal or small-team agent stack, that machinery inverts the cost-benefit: you now operate a distributed system in order to run a morning report. Failure modes multiply — lost messages, stuck consumers, out-of-order delivery — and every one of them is invisible until it bites.

There's a second, agent-specific trap: letting the agent runtime schedule itself. Native agent heartbeats run with full session context, which means a periodic "anything to do?" check can burn hundreds of thousands of tokens a day doing nothing (I've measured 170–210k input tokens per heartbeat run on a default OpenClaw deployment — see the [OpenClaw architecture reference](/architecture/openclaw-anatomy)).

## The pattern

**One scheduler, and it's the boring one.** Host cron drives deterministic scripts on a fixed calendar. The agent runtime provides tools and a chat gateway; it does not own time.

[Sterling](/projects/sterling) locks this in as a design decision:

- **Host cron is the only scheduler.** Morning brief, intraday monitor, end-of-day review — each is a cron line invoking a deterministic script. `crontab -l` is the complete, inspectable answer to "what runs when."
- **No pub-sub bus.** Producers and consumers coordinate through **completion flags and typed state**: a job writes its output and a done-marker; the next job checks for the marker. Ordering is explicit in the schedule, not emergent from delivery timing.
- **Scheduled LLM work runs in isolated, minimal sessions** — a purpose-built context for the task at hand, not the full interactive history. That's the difference between a cheap scheduled task and a token furnace.
- **A watchdog, not a supervisor tree.** A catchup job under `flock` restarts anything that should be running and isn't. Crash recovery is "the next tick fixes it."

## When to use it

- Single-host or few-host agent deployments — which is most sovereign/local-first setups.
- Workloads that are naturally calendar-shaped: briefs, syncs, monitors, reviews.
- Anywhere you want failure diagnosis to be `grep` over logs rather than distributed tracing.

Genuine high-fanout, low-latency event routing between many services is the honest exception — but confirm you have that problem before building for it.

## Trade-offs

- **Latency floors at the polling interval.** A cron-driven monitor reacts in minutes, not milliseconds. For a human-in-the-loop advisory system that's fine; for execution-speed automation it isn't (and see [The Advisory-Only Agent](/architecture/advisory-only-agents) for why I don't build that).
- **Completion-flag coordination gets awkward past a certain DAG complexity.** If your job graph needs fan-in joins and retries with backoff, you've outgrown the pattern — the win is noticing that honestly rather than encoding a workflow engine in shell.
- **Cron is per-host.** The pattern assumes the deployment fits on a box. That constraint is a feature for sovereignty, a limit for scale.

## Related patterns

- [Event Log as System of Record](/architecture/event-log-as-system-of-record) — jobs read and append to the log; the schedule writes history you can replay.
- [LLM at the Edges](/architecture/llm-at-the-edges) — each cron-driven phase is deterministic with at most one terminal model call.
