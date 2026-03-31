---
title: "Building a Personal AI Operator: What I Learned Running Claude 24/7"
description: "Eight months of running a 24/7 AI operator on my life — the memory architecture, the cron loops, the security model, and what actually changed."
publishedDate: 2026-03-13
tags: ["ai-agents", "openclaw", "architecture", "production"]
tier: deep-dive
status: review
---

Eight months ago I started an experiment: what if your AI assistant didn't wait for you to open a browser?

What if it ran all the time — monitoring your inbox, tracking your calendar, doing research while you slept, surfacing things before you remembered to ask? Not a chatbot you ping when you need something. An operator that runs your life with you, not for you.

I built that. It's called Clawdius. It runs 24/7 in a Docker container on a remote server, reachable via Telegram. It has access to my email, calendar, Todoist tasks, trading research, pantry inventory, and a growing stack of CLI tools. It wakes up on a schedule and does things I used to do manually or forgot to do entirely.

Here's what I actually learned.

---

## The First Insight: Memory Is the Hard Problem

Every AI session starts fresh. No model ships with persistent memory of your life. Developers typically respond to this by stuffing a giant system prompt with everything the model needs to know — and then wondering why it gets confused or expensive.

The more interesting solution is to treat memory like a software architecture problem.

Clawdius uses a three-tier memory system:
- **USER.md** — static facts about me: family, timezone, health conditions, car, accounts. Changes rarely. Loaded every session.
- **MEMORY.md** — operational learnings and patterns. What works, what doesn't, lessons from the past few weeks. Updated deliberately.
- **Daily logs** (`memory/YYYY-MM-DD.md`) — raw notes from the day. What happened, what got done, what needs follow-up. Written as things happen.

The session startup protocol is: load SOUL.md (identity), USER.md (who I'm helping), yesterday and today's daily log (recent context). No MEMORY.md in group chats — information security.

This design has a crucial property: the agent stays coherent across hundreds of sessions without the system prompt growing unbounded. Lessons from last week are in MEMORY.md, not repeated in every prompt. Daily context is in the log, not in the conversation.

The anti-pattern I see everywhere: people try to load everything into the context window. The model pretends to know it. You get subtle inconsistencies and token costs that scale with time rather than task complexity.

---

## What 24/7 Actually Means

Clawdius has eight cron jobs:

| Job | Cadence | What it does |
|-----|---------|------|
| heartbeat | Every 10 min, waking hours | Inbox scan, calendar check, proactive surfacing |
| work-session | Every 15 min, waking hours | Pick a task, execute it fully |
| morning-brief | Daily 8am PT | Overnight email digest + day ahead |
| mancini-pull | Weekdays 5:30pm ET | Fetch trading research, parse levels |
| mancini-fallback | Weekdays 10pm ET | Retry if primary pull failed |
| eod-review | Weekdays 4:15pm ET | End-of-day market review against watch levels |
| content-seed | Sundays 10am PT | Weekly content idea generation |
| construct-daily | 02:00 UTC daily | Self-improvement: assess gaps, build capabilities |

The work-session cron is the most powerful one — and the most counterintuitive. Every 15 minutes, during working hours, Clawdius picks one Todoist task and executes it completely. Research tasks produce files. Code tasks produce commits and pull requests. Writing tasks produce drafts. Each execution leaves a comment on the task so I can see exactly what happened.

I came home from lunch yesterday with three pull requests open, two blog posts drafted, hotel options researched for an April trip, and a competitive analysis saved to my content folder. I did not ask for any of that. I asked for it weeks ago when I created the tasks.

That's what 24/7 actually means. Not "always available." Active.

---

## The Security Architecture You Actually Need

Here's the thing nobody talks about: a personal AI agent with access to your email and financial accounts is a juicy attack target.

Prompt injection — where malicious content in an email or web page hijacks the model into doing something you didn't ask for — is the primary threat. It's not theoretical. It's happening in the wild as more people deploy agents with inbox access.

Clawdius runs everything inbound through ClawWall: a firewall that scrubs external content before the model sees it. Email bodies, web pages, Substack posts, X threads — all sanitized before they reach the agent. The audit log captures everything that triggered.

A few other things that matter:
- **Zero trust on write actions.** Reading is autonomous. Sending emails, posting, or any outbound action requires explicit approval.
- **Minimal egress by default.** Clawdius knows what leaves the machine and flags anything unexpected.
- **Container isolation.** The agent can't touch the host. Docker is the security boundary.
- **Hard-coded limits, not prompts.** "Don't send emails without permission" in a prompt is a suggestion. A function that always routes to an approval queue before sending is a guarantee.

The attack surface isn't theoretical. My setup encountered a coordinated prompt injection campaign (ClawHavoc) targeting SOUL.md — the identity file that defines who the agent is. Someone figured out that if you can rewrite the agent's identity, you can redirect it entirely. The fix: SOUL.md is read-only. Config files that define the agent's core character can't be modified by the agent itself.

---

## The Operational Failure Modes Nobody Warns You About

**Silent credential expiry.** API keys expire. Session cookies expire. Models don't notice — they just fail. Now I have an automated check that surfaces credential age and flags anything approaching expiry. The first time I missed this, Clawdius ran three failed heartbeats in a row before I noticed.

**Memory bloat.** Without pruning, memory files grow to hundreds of kilobytes within days. Models slow down, context windows fill, costs climb. The construct-daily cron does memory hygiene: review recent logs, extract patterns worth keeping, archive the rest.

**Action duplication.** Without a cache that persists between sessions, the agent re-executes work it already did. Work-session has an explicit task cache: every task gets an assessment and a "not ready until" timestamp after execution. No task gets touched twice in the same eight-hour window unless it's explicitly re-queued.

**The "always blocked" category.** Some tasks look executable but always require a human action first. Tesla insurance update: I need to call them. Chase dispute: I need to file it. These tasks don't disappear — they're real obligations — but the agent can't do anything with them. The solution: they stay in the queue, tagged BLOCKED, with clear notes on exactly what Simon needs to do and where. They don't consume agent cycles.

**Silent failures in overnight jobs.** A cron job fails. The agent doesn't notice because the next session doesn't know about the previous one's failure. Fix: explicit job result logging with a status check in the next heartbeat.

---

## The Things That Actually Changed How I Work

**Research is no longer a task I put off.** Before: I'd have a curiosity or a question and it would sit in Todoist for two weeks before I got to it. Now: I add the task, Clawdius works it in the next 15-minute window, and I come back to a compiled research file. The cycle time from question to answer is hours, not weeks.

**My inbox is no longer a source of anxiety.** Two heartbeat runs per waking hour mean nothing sits unnoticed. Urgent things get surfaced. Newsletters stay categorized. I don't open the inbox feeling behind.

**Proactive notifications are different from reactive ones.** A Telegram message that says "You have a calendar event in 90 minutes" is reactive — I asked to be notified. A message that says "You haven't been in contact with Luke in 11 days and his birthday is next week" is proactive — the agent noticed something I didn't ask it to watch. That's a different category of useful.

**The task system compounds.** The longer Clawdius runs against my Todoist, the more context it accumulates about my priorities, blockers, and working style. The task cache is a conversation log about every piece of work. After a few weeks, the agent knows which categories of work I tend to procrastinate on, which I execute quickly, and which consistently block on external factors.

---

## What This Actually Requires

I want to be honest about what running this setup demands.

**Config work upfront.** The agent is only as good as its instructions. Writing good SOUL.md, USER.md, and operational rules took days of iteration. The gaps show up as weird behaviors you have to debug.

**Ongoing maintenance.** Credentials expire. Tools break. The cron schedule needs tuning. Once a month I do an audit: what's running well, what's failing silently, what should be adjusted.

**Discipline about write actions.** The approval-gate discipline is real. I've been tempted to let certain categories auto-send. I've always regretted it when I did. The approval gate isn't bureaucracy — it's the thing that keeps you from having a bad Tuesday when a model hallucinates a detail in an email to an important contact.

**Knowing what AI is bad at.** Requirements. Strategic decisions. Anything where "good" depends on context the agent can't observe. I don't ask Clawdius to decide what to work on — I decide, then Clawdius executes.

---

## Where This Goes

The current setup is already useful. But the compound effect is what interests me most.

At six months, an agent that's been executing against your actual work queue knows your working patterns better than any productivity tool. It knows what you consistently block on. It knows which tasks lead to other tasks. It starts surfacing things before you ask.

At a year, the agent's accumulated memory of your working style is a genuine asset — portable, auditable, yours.

The open-source path here matters enormously. The value I'm describing — accumulated context, learned patterns, operational history — should live on your machine, not in a company's data center. The moment that context becomes leverage for a vendor, the game changes.

That's why I built ClawHQ on top of OpenClaw: to make this setup replicable without requiring months of configuration expertise.

But the experiment of running Claude 24/7 as a personal operator? I'd do it again from day one. The compounding alone justifies the setup cost. Most people who try it don't want to go back.

---

*ClawHQ makes this setup deployable without the configuration marathon. [See the repo →](https://github.com/simonplant/clawhq)*
