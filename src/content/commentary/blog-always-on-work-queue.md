---
title: "Building an Always-On AI Work Queue: The Clawdius Task System"
description: "How I built a persistent work queue that lets my AI operator pick up, execute, and track tasks across sessions without losing context."
publishedDate: 2026-03-19
tags: ["ai-agents", "todoist", "architecture", "openclaw"]
tier: architecture
status: review
---

Most people use AI assistants reactively. You ask, it answers. You prompt, it responds. The relationship is fundamentally pull-based: the AI sits idle until you need it.

I built something different. My AI runs a persistent work queue, executes tasks autonomously every 15 minutes, refills its own queue when it runs dry, and only contacts me when something actually needs my attention. Background work happens constantly — code written, emails processed, market data reviewed, GitHub issues handled — without me thinking about it.

Here's how it works, and why the design choices matter.

---

## The Problem With Traditional AI Workflows

When I started working with Claude as a persistent assistant (I call mine Clawdius), the default pattern was conversational: I'd open a chat, ask something, get an answer, close the chat. The next day, it had no memory of any of it.

This is how most people use these tools. It's fine for one-off questions. It's useless for ongoing operations.

What I actually wanted was an AI that:
- Maintains continuity between sessions (without me recapping every time)
- Executes tasks in the background without my involvement
- Knows when to ask me and when to just handle it
- Has its own sense of priority and urgency
- Can generate its own work when the queue empties

Building that required rethinking the interface from scratch.

---

## The Queue Architecture

The task system is a single JSON file with a clean CLI wrapper (`tasks`). No database, no cloud sync, no dashboard. Just a file the AI can read and write.

Each task has:

```
id: 82d176cf
title: "Blog post: Building an always-on AI work queue"
channel: content
status: open | blocked | done
autonomy: do | do-tell | flag
priority: 1–4
due: optional date
notes: freeform context
```

The **channel** organizes by domain: `developer`, `trader`, `pa`, `health`, `security`, `content`, `finances`, and a few others. It's not a project tracker — it's an execution surface.

The **autonomy** field is the key design decision.

---

## Three Modes of Autonomy

This is the thing that makes the system feel different from a regular to-do list.

**`do` — Execute silently.** The AI does it without reporting back. Routine maintenance, code pushes, file cleanup, background research. I'll see the effects; I don't need the play-by-play.

**`do-tell` — Execute and report.** Do it autonomously, then tell me what happened. Good for things that have meaningful output I'd want to know about — a blog draft, an EOD review summary, a PR created.

**`flag` — Ask first.** The AI surfaces it to me and waits for input. Nothing irreversible, nothing ambiguous, nothing that needs a judgment call from me. External emails to people I haven't configured. Spending decisions. Config changes on production systems.

The `tasks next` command returns only `do` and `do-tell` items — things the AI can actually act on without human input. `flag` items sit in the queue, visible in `tasks list`, but they don't get auto-executed.

This means my AI never spins its wheels on things it can't handle. It also means I never get surprised by something it did that it shouldn't have.

---

## The Execution Loop: 15-Minute Work Sessions

Every 15 minutes during active hours (5am–11pm Pacific), a cron job fires with a simple prompt:

> "You have 1 job: pick the highest-priority task from your local queue and do it. Execute fully. Write code, send emails, push commits, whatever it takes. Mark it done with notes when finished."

That's the entire work session prompt. One task, full execution, no half-measures.

The AI:
1. Runs `tasks next`
2. Reads any relevant context (memory files, GitHub state, etc.)
3. Executes the task — which might mean running shell commands, writing files, calling APIs, pushing commits, or drafting content
4. Marks it `done` with notes: `tasks done <id> --notes "what happened"`
5. If blocked: `tasks block <id> --notes "why"` — or `tasks flag <id>` if it needs me

One task per session. Done well beats done fast. The 15-minute cadence means nothing waits more than 15 minutes to start, and the AI is never trying to juggle multiple things at once.

---

## Self-Healing: work-recon

Here's where it gets interesting.

If `tasks next` returns nothing actionable, the AI doesn't just stop. It runs a script called `work-recon` that actively scans for work that *should* exist but doesn't yet:

```
python3 work-recon.py --min-queue 3
```

work-recon checks:
- **GitHub repos** — open issues across all Simon's and Clawdius's repos. Each unclosed issue becomes a task.
- **Trading logs** — when was the last EOD review? If it's stale, generate a review task.
- **Memory files** — situations I noted that haven't been actioned. Pending follow-ups, open questions, things marked "check on this."
- **Todoist** — Simon's personal task list, scanned for items where Clawdius could research or prepare something.
- **Content pipeline** — ideas that went cold, drafts that need finishing.

The goal: the queue should never be empty. If there's genuinely nothing to do, work-recon finds something. If there's really nothing (rare), the system exits cleanly.

This makes the AI **proactive rather than reactive**. It's not waiting for me to assign tasks. It's actively scanning for what work needs doing and generating its own agenda.

---

## Separation of Queues

One mistake I made early: conflating my tasks with the AI's tasks.

They're completely different things.

**Simon's tasks (Todoist):** Things *I* need to decide on, do personally, or delegate to humans. Meetings, personal commitments, things that require my judgment or relationships.

**Clawdius's tasks (local queue):** Things *the AI* executes. Code work, email triage, research, content drafts, market analysis, system maintenance.

The AI reads my Todoist to find opportunities to help. It never writes to it unless I explicitly ask. Its own queue is its execution surface — it owns that completely.

This separation keeps both queues clean. I'm not looking at AI maintenance tasks mixed in with my personal to-dos. The AI isn't constrained by tasks it can't action.

---

## Memory as Continuity

The task queue handles *what to do*. Memory handles *what's happening*.

Every session, the AI reads daily memory files (`memory/2026-03-14.md`) and a curated long-term memory file (`MEMORY.md`). These contain: active situations, patterns observed, decisions made, things to watch.

The AI writes to memory during sessions: new findings, things that need follow-up, context that should survive session restarts.

This is what makes the system feel continuous. Each work session isn't starting cold — it picks up with full context about what's happening across all channels.

---

## Channels and Priority

Channels are domains, not projects. `developer` doesn't mean "the simonplant.com project" — it means "anything that requires code, GitHub, or system work." `trader` is anything market-related. `pa` is personal assistant work.

Priority is 1–4, with 1 being critical. The `tasks next` command sorts by priority first, then due date.

In practice, most autonomous work runs at P3–P4. P1–P2 items are usually `flag` because they're high-stakes enough to want my sign-off. The rhythm is: background work ticks through P3–P4, escalation surfaces P1–P2 to me when needed.

---

## What This Looks Like in Practice

On a typical weekday:

**5:00am PT** — First work session fires. AI checks email queue (heartbeat cron handles this separately), then picks top task. Might be a GitHub issue fix, a content draft, following up on something from yesterday.

**Every 15 minutes after that** — Another task executes. Sometimes it's quick (mark an email read, update a file). Sometimes it's a 10-minute deep work session (write a PR, draft a blog post, run market analysis).

**4:15pm ET weekdays** — EOD review cron fires. AI pulls current market data against the trading brief levels, categorizes what triggered and what's near, formats a summary, delivers it to me.

**8:00am PT daily** — Morning brief: today's calendar, open Todoist items, meal plan, any time-sensitive flags.

I see Clawdius maybe 3–4 times a day — morning brief, something flagged, a do-tell result worth noting, and maybe a question when it's genuinely stuck. Everything else happens without my involvement.

---

## The `flag` / `block` Flow

When the AI can't proceed, it has two options:

**Block** — something external is preventing progress. Waiting on an API key, waiting on a decision, waiting on someone else. The task stays in the queue but is deprioritized. `tasks block 82d176cf --notes "waiting on Namecheap DNS propagation"`

**Flag** — needs human input or judgment. `tasks flag f83e3846 --notes "backup destination decision needed — S3, Backblaze, or local NAS?"`. These surface in my next message from the AI.

The result: the AI never spins on things it can't resolve. It surfaces blockers cleanly and moves on.

---

## What I'd Build Differently

A few things I'd change with hindsight:

**Task dependencies** — The system supports `depends_on` but I rarely use it. More structured dependency tracking would help for multi-step projects.

**Better recon signals** — work-recon is good but somewhat broad. Tighter signals from specific repos/systems would generate better tasks.

**Work session logging** — Right now, session notes live in the task file. A separate execution log would make it easier to audit what actually happened across sessions.

**Cross-session task handoff** — When a task takes longer than one 15-minute session, the handoff is a bit rough. Better state tracking mid-task would help.

---

## The Broader Point

This system took maybe a week to build and iterate. The infrastructure is small — a bash script, a Python script, a cron table, a few JSON files.

What it produces is a fundamentally different relationship with AI tooling. I'm not prompting and waiting. The AI is an entity with its own work queue, its own agenda, its own sense of priority — bounded by my rules and oversight mechanisms, but operating independently within those bounds.

Most people are using AI as a fancy search engine or a writing assistant. Those are valid uses. But the leverage is at least an order of magnitude higher when the AI has persistent context, autonomous execution authority, and a self-replenishing work queue.

The infrastructure to build this is available to anyone with a bit of engineering chops and some patience for prompt iteration. The components are simple. The behavior that emerges from them isn't.

---

*Notes for publication:*
- Target: technical founders, fractional executives, senior engineers exploring AI-native workflows
- Platform: simonplant.com blog (Astro)
- Tone: direct, practitioner-level, minimal hype
- Could pair with: actual `tasks list` terminal screenshot, architecture diagram (heartbeat + work-session + cron flow)
- Related content: "Teaching your AI new skills — the Construct pattern", "AI-powered trading assistant", Twitter thread on the task system
- Estimated read time: ~8 minutes
