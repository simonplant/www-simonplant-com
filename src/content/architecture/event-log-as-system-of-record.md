---
title: "Event Log as System of Record for AI Agents"
status: review
tags: [pattern, ai-agents, data, reliability]
description: "Give the agent one append-only, hash-chained event log as its single source of truth. Briefs, dashboards, and memories become disposable projections — replayable, auditable, and tamper-evident."
publishedDate: 2026-07-18
---

## The problem

Agent systems accumulate state in the worst possible places: conversation context, scratch files, per-tool databases, and model "memory" that mutates invisibly. When the agent says something wrong, you can't reconstruct what it knew at the time. When two subsystems disagree, there's no arbiter. And nothing stops history from being quietly rewritten — by a bug, by compaction, or by the agent itself.

This is the same problem financial systems solved decades ago, and the same solution applies.

## The pattern

One **append-only event log** is the system of record. Every fact the system learns or emits — an extracted plan, a price tick, a fired alert, a human's reply — is an event with a type, a timestamp, a source, and a payload. Everything else the system shows (briefs, focus sheets, reviews, dashboards) is a **projection**: a view computed from the log, freely thrown away and re-rendered.

[Sterling](/projects/sterling) implements this as daily JSONL files with three properties worth copying:

- **Hash-chained.** Each event carries the SHA-256 of its predecessor's canonical form. Any edit, insertion, or deletion in history breaks the chain, and a `verify` command walks the file and surfaces the break. History becomes tamper-evident — including against the agent.
- **Typed, with a closed enum.** Events are a fixed vocabulary (domain events, job lifecycle, heartbeats), not free-form blobs. A closed type set is what makes projections and monitoring writable.
- **Correlated.** Lifecycle events that belong to one story — an alert, the fill that answered it, the review that scored it — share a `correlation_id`. Joins across the story become trivial; decision-quality measurement falls out for free.

The operational payoff: **the same code tails the log live and replays it.** Yesterday's brief can be regenerated exactly; a bug in a projection is fixed by fixing the code and re-rendering, never by editing data.

## When to use it

- The agent runs unattended and you'll need to ask "what did it know, and when?"
- Multiple producers (feeds, extractors, schedulers, humans) contribute state that must merge without a coordinator.
- Decision quality matters enough to measure — proposals and outcomes in one joinable stream.

For a stateless tool or a pure chat assistant, this is machinery without a payoff.

## Trade-offs

- **Projections must stay disposable.** The moment someone hand-edits a rendered brief, you have two sources of truth. The discipline is cultural as much as technical.
- **Append-only means facts are corrected, not erased** — a wrong event is superseded by a later one. That's the audit trail working, but it needs modeling up front.
- **Schema evolution takes care.** A closed event vocabulary resists casual change; plan for versioned payloads.
- Plain JSONL files hit limits at serious scale. At personal-infrastructure volume, files plus a small query CLI are genuinely enough — resist the distributed-log reflex until volume forces it.

## Related patterns

- [LLM at the Edges](/architecture/llm-at-the-edges) — projections are where the model is allowed to write prose; the log is where it isn't.
- [The Advisory-Only Agent](/architecture/advisory-only-agents) — the log is what makes an advisory loop measurable after the fact.
