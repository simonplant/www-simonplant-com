---
title: The Persistent Agent Model
description: How Clawdius maintains continuity across sessions through structured memory files, daily logs, and cron-driven routines — the architecture underlying a 24/7 AI operator.
concern: lifecycle
patternType: design-pattern
publishedDate: 2026-03-31
status: published
tags: ["agent-lifecycle", "memory", "persistence", "cron"]
relatedProjects: [clawhq, clawdius]
---

## The Problem

Most AI assistants have no memory. Every session starts fresh — no context, no history, no awareness of what happened yesterday. For a 24/7 operator, this is a fundamental design constraint that has to be solved in the architecture, not around it.

## The Solution: Structured Memory Files

The persistent agent model uses a layered file system as external memory:

- **Daily logs** (`memory/YYYY-MM-DD.md`): raw session notes, what happened, what was discovered
- **Long-term memory** (`MEMORY.md`): curated lessons and patterns extracted from daily logs
- **Identity files** (`SOUL.md`, `AGENTS.md`): behavioral constitution, loaded on every session startup
- **User context** (`USER.md`): static personal information, updated rarely

On startup, the agent reads today's log (and yesterday's if early in the day), then proceeds. No session state is held in the LLM — all continuity lives in files.

## Cron-Driven Continuity

The other half of the persistence model is the cron loop. Rather than a single long-running session, the agent runs in short bursts triggered by scheduled jobs:

- Every 10 minutes: heartbeat (inbox, calendar, quick wins)
- Every 15 minutes: x-scan (news, market mentions)
- Every 15 minutes: work-session (one task, done fully)
- Daily: morning brief, EOD review, meal planning

This means the "agent" is actually a sequence of isolated sessions with shared file state. The cron architecture makes the system more robust — a crashed session doesn't take down the operator, just that run.

## What This Enables

- **Genuine continuity**: Simon can say "remember X" and it persists, because it gets written to a file immediately
- **Freshness discipline**: stale data is flagged as a first-class risk; every cached value has a verification step
- **Parallel contexts**: main session (Telegram), isolated cron sessions, and sub-agents all share the same memory layer
- **Graceful degradation**: if a session fails, the next one picks up from the last written state
