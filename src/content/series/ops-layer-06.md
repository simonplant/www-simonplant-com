---
title: "The Heartbeat Problem"
number: 6
publishedDate: 2026-04-12
description: "Naive cron polling creates cascading problems. Event-driven heartbeats with Todoist as source of truth."
tags: [scheduling, cron, architecture, heartbeat]
status: published
---

Clawdius — my personal OpenClaw agent — runs four cron jobs. Here they are, verbatim from the production config:

```
heartbeat:       */10 * * * *   "Check email for urgent messages, check calendar
                                for upcoming meetings in the next 2 hours, check
                                tasks for overdue items. If nothing urgent,
                                respond HEARTBEAT_OK."

work-session:    */15 * * * *   "Check task queue, pick highest priority item,
                                execute it. If blocked, move to next item."

morning-brief:   30 7 * * *    "Summarize today's calendar, overnight email
                                highlights, top 3 tasks for today, any conflicts
                                or deadlines."

schedule-guard:  */15 * * * *   "Guard the calendar against conflicts."
```

All four run on `ollama/gemma4:26b` — local inference on my own hardware. All four run on session `"main"`. That last detail is the one that broke everything.

The HEARTBEAT.md that governs the heartbeat job is exactly what you'd expect:

> Check email for anything urgent. Check calendar for anything urgent. Check tasks for anything urgent. If nothing needs attention, respond HEARTBEAT_OK.

Simple. Obvious. And the source of six distinct failure modes that took me weeks to untangle.

---

## The Six Failure Modes

### 1. Stale data between polls

A heartbeat fires every 10 minutes. An urgent email arrives at minute 1. It sits unnoticed until minute 10. In a world where the agent is supposed to be "always on," a 10-minute blind spot is an eternity. You can shrink the interval, but that trades latency for compute — and every poll costs tokens, even when there's nothing to find.

### 2. Duplicate actions when polls overlap

The heartbeat fires and surfaces a high-priority task. Two minutes later, the work-session fires and picks up the same task from the queue. Now both are acting on it. No lock. No coordination. Two threads doing the same work, sometimes producing contradictory outputs.

This is the classic distributed systems problem — concurrent access without coordination — except it's happening inside a single agent that presents itself as one entity. Users don't think of cron jobs as concurrent processes competing for shared state. But that's exactly what they are.

### 3. Notification storms after downtime

The machine reboots. Docker restarts. The agent comes back online and all four cron jobs fire simultaneously, catching up on their missed intervals. The heartbeat finds 47 unread emails from the last three hours. The work-session finds a backlog of 12 tasks. The morning brief fires even though it's 2pm. Clawdius spams my notification channel with a wall of messages, none of them prioritized, all of them demanding attention at once.

In operations, this is called a "thundering herd." Every monitoring system has solved this problem. Agent scheduling hasn't.

### 4. Wasted compute on empty polls

I ran Clawdius for two weeks and logged the heartbeat results. Out of roughly 2,016 heartbeat invocations (every 10 minutes, 24 hours a day), approximately 1,800 returned `HEARTBEAT_OK`. Nothing to do. No action taken. But each invocation still loaded context, called three external tools (email, calendar, tasks), waited for responses, reasoned about whether anything was urgent, and produced a verdict.

That's about 89% waste. Not catastrophic when you're running local inference on hardware you already own. Ruinous when you're paying per token to a cloud API. And even on local hardware, those empty polls consume GPU cycles that could be doing real work.

### 5. Context bloat from the native heartbeat

This is the one that surprised me. OpenClaw's native heartbeat — the built-in mechanism, not a cron job you define — consumes tokens from the main session context. Every heartbeat result gets appended to the conversation history. With pruning disabled (which some configurations default to), 35 heartbeat messages can produce 208,000 tokens of context.

That's not a typo. 208K tokens. From heartbeats that mostly said "nothing happening."

Context windows are precious. Filling them with routine health checks is like using your working memory to remember that you're still breathing. The information is true and completely useless.

### 6. Session cross-contamination

All four cron jobs share `session: "main"`. That means the heartbeat's context — its tool calls, its reasoning, its outputs — bleeds into the same conversation that the work-session uses. And the morning brief. And the schedule guard.

When the heartbeat checks email and finds nothing urgent, that reasoning still sits in the session. When the work-session fires next, it has the heartbeat's email analysis in its context. The agent doesn't just do four jobs — it does four jobs while remembering the internal monologue of the other three.

This creates subtle behavioral drift. The work-session starts referencing calendar data it found in the heartbeat's context. The schedule guard considers task priorities it picked up from the work-session. Each cron job is supposed to be independent, but shared session state makes them implicitly coupled.

---

## Why Naive Polling Fails

These six failure modes share a root cause: **the heartbeat is doing too much work for too little signal.**

A cron-based heartbeat is a pull model. Every N minutes, the agent wakes up, loads its full reasoning stack, queries every data source, evaluates urgency, and reports. It does this whether or not anything has changed. It does this in the same context as everything else. It does this with no coordination with other scheduled work.

This is the equivalent of checking your mailbox every 10 minutes by driving to the post office. Most trips are wasted. Occasionally you find something urgent and it's already 9 minutes old. And every trip burns gas regardless of whether there's mail.

The fundamental insight: **heartbeats should be cheap probes, not full reasoning sessions.**

A heartbeat should answer one question: "Has anything changed since the last check?" If yes, trigger a response. If no, cost should approach zero. The reasoning — the actual analysis and decision-making — should happen only when there's something to reason about.

---

## The Resolution

I rebuilt Clawdius's scheduling architecture around three principles:

**Principle 1: Separate the probe from the response.**

The heartbeat becomes a lightweight check — did new email arrive? Did the calendar change? Did a task become overdue? These are boolean questions with cheap answers. You don't need an LLM to count unread emails. A shell script calling `himalaya` (my email CLI) can answer "any new mail?" in under a second with zero tokens.

When the probe detects a change, *then* it triggers a full reasoning session. The agent wakes up because something happened, not because the clock ticked. Event-driven, not poll-driven.

**Principle 2: Isolate session contexts.**

Each cron job gets its own session. The heartbeat's context doesn't bleed into the work-session. The schedule guard doesn't inherit the morning brief's reasoning. Session isolation eliminates cross-contamination and keeps each job's context window focused on its actual task.

ClawHQ implements this by overriding the `session` field per cron entry instead of defaulting everything to `"main"`. It sounds trivial. It eliminates an entire class of bugs.

**Principle 3: Use a human-facing source of truth.**

Todoist is the canonical task list — not the agent's internal queue, not a workspace file, not a database the agent controls. Todoist is where I see tasks, prioritize them, and mark them complete. The agent reads from Todoist and writes results back. If Clawdius vanishes tomorrow, my task list is still intact and legible.

Workspace files serve as the agent's working memory — scratch space for in-progress reasoning, cached results, intermediate state. But the durable record lives in systems I control and can read without the agent's help.

---

## The Tool Chain

The rebuilt architecture uses five tools, each chosen for a specific property:

- **himalaya** — email CLI. Queries IMAP directly. Can answer "how many unread messages?" without loading message bodies. Fast, scriptable, no tokens required for the probe.
- **khal + vdirsyncer** — calendar CLI with CalDAV sync. Reads `.ics` files locally after sync. The probe is a filesystem check, not an API call.
- **todoist CLI** — task management. Human-facing source of truth. Agent reads priorities, writes completions. Both the agent and I see the same list.
- **tasks** — OpenClaw's local work queue. Short-lived, agent-internal. For work items that don't need to survive an agent restart.
- **sanitize (ClawWall)** — prompt injection firewall. Every inbound content source — email bodies, calendar descriptions, task notes — passes through sanitization before the agent reasons about it. This isn't optional. If your agent reads untrusted text and reasons about it, you need a content firewall. Full stop.

The sanitize layer deserves emphasis. When your heartbeat checks email, it's reading content authored by anyone on the internet. That content will be injected directly into the agent's prompt. Without sanitization, a carefully crafted email can hijack the agent's next action. ClawWall strips known injection patterns — base64-encoded instructions, zero-width Unicode sequences, instruction-override patterns — before the content reaches the LLM.

---

## The General Pattern

This isn't an OpenClaw-specific problem. Any agent scheduling architecture faces the same trade-offs:

**Poll vs. event.** Polling is simple to implement and expensive to operate. Events are complex to implement and cheap to operate. The right answer is almost always a hybrid: poll infrequently as a fallback, but react to events as the primary trigger.

**Shared vs. isolated context.** Shared sessions save memory but create coupling. Isolated sessions use more resources but prevent cross-contamination. For production agents, isolation wins. The bugs from shared context are subtle, hard to diagnose, and impossible to predict.

**Agent-controlled vs. human-readable state.** If the only record of what your agent has done lives inside the agent's context, you've lost control. Durable state must live in systems you can inspect without the agent running. Todoist. A git repo. A database with a query tool. Anything the agent can write to and you can read independently.

**Cheap probes, expensive reasoning.** The probe should cost effectively nothing. A filesystem check. An API call that returns a count. A cache lookup. The reasoning — the part that actually uses LLM tokens — fires only when the probe says something changed.

After the rebuild, Clawdius's daily token consumption for scheduling dropped by roughly 80%. Not because the agent does less work — it does the same work. It just stopped doing the same non-work 1,800 times a day.

---

## What I Got Wrong Initially

I want to be honest about the assumption that led me here: I thought the heartbeat was a simple problem. Check some stuff, report back, done. The HEARTBEAT.md file is four sentences. How hard could it be?

The answer is that scheduling is never simple in distributed systems, and an agent with multiple cron jobs *is* a distributed system. The jobs are concurrent processes. The session is shared mutable state. The external services are dependencies with their own failure modes. Every lesson from distributed systems engineering applies — isolation, idempotency, backpressure, circuit breaking — and most agent frameworks ignore all of them because the abstraction hides the complexity behind a friendly cron syntax.

`*/10 * * * *` looks simple. What it actually means is: "Wake up a reasoning engine, load hundreds of thousands of tokens of context, call three external services, evaluate urgency, and report back — in a process that shares state with three other concurrent processes doing the same thing on overlapping schedules." That's not a cron job. That's an incident waiting to happen.

The fix isn't complicated. Isolate sessions. Separate probes from reasoning. Use external systems as the source of truth. Make heartbeats cheap.

But you have to see the problem first. And the problem is invisible when everything works — which is most of the time. The failures are intermittent, subtle, and look like "the agent just did something weird." That's the worst kind of bug: one that looks like nondeterminism in a system you already expect to be nondeterministic.

---

*Next: [Memory Is a Liability](/series/ops-layer-07) — agent memory bloats to unusable sizes within days. The memory management architecture that actually works in production.*
