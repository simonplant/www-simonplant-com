---
title: "AI-Powered Trading Assistant: From Transcripts to Orders"
description: "How I built a three-source trading synthesis system — Mancini, T3Live, EOD Focus — that merges into a daily brief and tracks levels automatically."
publishedDate: 2026-03-25
tags: ["trading", "ai-agents", "automation", "finance"]
tier: deep-dive
status: review
---

Every serious trader has a system. Levels, setups, rules — usually scattered across a spreadsheet, a notes app, and three browser tabs. The system works when you're at the desk, fresh, with coffee. It falls apart when you're busy, distracted, or just mentally full from a day of actual work.

I'm a part-time trader. That means I have a day job, an AI agent running 24/7, and a strong preference for not losing money because I forgot what I was watching. This is the story of how I connected those three things.

---

## The Problem: The Gap Between Planning and Execution

Good trading is mostly preparation. The idea is simple: before the market opens, you identify your levels — where you'd buy, where you'd sell, what the invalidation is. Then the market opens, price does what it does, and you act (or don't) according to the plan.

The failure mode isn't analysis. It's the gap between the plan and the moment.

By the time a level triggers, you might be in a meeting, cooking dinner, or just not watching. By the time you notice, the setup has come and gone. Or worse: you're watching but you've been staring at a chart for four hours and your plan has blurred into rationalization.

I wanted an agent that knew my levels, watched while I wasn't, and gave me a clear end-of-day account of what happened.

---

## What I Built: A Three-Layer System

The trading system I've landed on has three layers, each built as a separate piece of Clawdius infrastructure:

### Layer 1: The Morning Brief

Every trading day at 8am, Clawdius delivers a morning brief. Part of it is calendar and email. Part of it is a trading brief — the day's active setups in a clean, scannable format.

The source for these briefs is my own voice. I record 5-10 minutes of thinking out loud on the way to my desk — what the market structure looks like, where my levels are, what I'm watching. That audio goes to Whisper (local speech-to-text, no API), gets transcribed, and feeds into the brief.

The result: by 8am, I have a clean markdown document that says "watching SPY 545 as resistance, invalidated above 548, first target 540."

It's my own analysis, just structured. No interpretation, no judgment — just extraction.

### Layer 2: EOD Review

At 4:15pm ET, after the regular session closes, a cron job runs `eod-review`. It reads that morning's brief, pulls current prices for every ticker mentioned using `quote` (Yahoo Finance, ~15 min delay), and produces a terse summary:

```
TRIGGERED:
  SPY — crossed 545 resistance. Moved to 541 intraday. Setup: SHORT bias.
  
NEAR (<2%):
  QQQ — 1.3% from 440 support level.
  
WATCH:
  IWM — held 205. No action.
```

Three categories: things that triggered, things that got close, things that didn't move. That's the whole report.

This cron has saved me from the two worst mistakes I used to make: forgetting what I was watching, and confabulating after the fact. The record is written at 8am before the market opens. The EOD report compares prices against that record, not against my post-hoc memory.

### Layer 3: Level Monitoring (In Progress)

The morning brief and EOD review handle the planning and review loops. What I'm still building is the intraday alerting layer — a price monitor that watches for levels being tested and notifies me in real time.

The design is straightforward: `quote --watch AAPL:200:210` exits with code 2 if price leaves the range. Wrap that in a loop with a 5-minute sleep and a Telegram notification, and you have a basic alert system.

The harder part is making it intelligent. A level being tested isn't automatically actionable — context matters. Is it the first test or the third? Is volume elevated? What's the broader market doing?

I haven't solved that yet. The monitoring layer today is dumb: it alerts when price crosses a level. The goal is for it to check the alert against the morning brief before firing — so I only get pinged when the setup context still applies.

---

## The Whisper Pipeline: Voice to Structure

The most underrated piece of this system is the voice input layer.

Most AI-augmented trading tools start with data: feeds, charting platforms, automated scanners. My starting point is speech. I talk through my analysis out loud, and the system converts that into structured data.

Why voice? Because that's how I actually think about markets. I don't naturally think in tables or code. I think in narratives: "the structure broke down here, now we're at this level, if it holds I'd expect a bounce to the next level, if it breaks I think we go lower." That narrative contains the setup — it just needs to be extracted.

Whisper handles the transcription locally (no API cost, no data leaving the machine). A parsing pass then identifies tickers, levels, and directional bias. The parser is deliberately permissive — it captures what I said, not what it thinks I meant.

The parsing output goes into a standardized trading brief format. Today that's a markdown file. Eventually I want it to feed directly into an order management system — so the morning brief creates the actual orders (with stops), and execution is just approval.

---

## What I Learned About AI and Trading

A few things have surprised me in building this:

**The value is in structure, not intelligence.** I don't want the AI to tell me what to trade. I want it to capture my thinking precisely and hold me accountable to it. The morning brief is valuable not because Clawdius adds insight, but because it forces me to be explicit. You can't have an AI capture your levels if you haven't stated them clearly.

**The audit trail changes behavior.** Knowing that my morning brief is committed to a file before the market opens has made me a better trader. There's no way to pretend after the fact that I "knew" a setup would play out if the brief doesn't say so. The system creates a written record that makes self-deception harder.

**Latency is fine for my use case.** Yahoo Finance data with a 15-minute delay is useless for short-term trading. For swing setups and end-of-day review, it's perfectly adequate and free. Matching your data quality to your actual use case is underrated.

**Voice is an input channel, not a gimmick.** Getting trading thinking into the system via voice rather than typing has made me more consistent about generating briefs in the first place. Friction determines behavior. If writing a brief takes 20 minutes, I'll skip it. If talking for 5 minutes produces the same artifact, I won't.

---

## The Setup

For completeness, here's what's running:

- **Clawdius** — always-on AI agent on OpenClaw
- **Whisper** — local speech-to-text (`openai-whisper` skill, no API)
- **quote** — terminal market quotes (Yahoo Finance, ~15 min delay)
- **eod-review** — custom skill: reads brief, fetches prices, writes review
- **Cron jobs** — morning brief at 8am PT, EOD review at 4:15pm ET

Total running cost beyond the AI inference: zero. No market data subscriptions, no external APIs. The most expensive piece is the Whisper model, which runs locally on the same machine.

---

## What's Next

The three-layer system works. I now have a reliable record of what I planned, what the market did, and how those aligned. That's the foundation.

What I'm working toward:

1. **Intraday alerting** — real-time level notifications that check context before firing
2. **Order generation** — morning brief levels → draft orders in broker API, pending approval
3. **Pattern analysis** — which setups are working, which aren't, based on the EOD review history

Step 3 is the one I'm most interested in. After six months of briefs and EOD reviews, I'll have a dataset of setups and outcomes. The analysis question — "are my levels predictive?" — becomes answerable. Most traders never get a clean answer to that because they don't have clean records. The infrastructure creates the data that makes the question answerable.

That's the compounding benefit of building this properly: the artifact of doing it right is a dataset that makes you better over time.

---

*Simon Plant is a fractional CTO and part-time trader. He runs Clawdius, an always-on AI agent built on OpenClaw. Prior posts: [Teaching Your AI New Skills: The Construct Pattern](/content/blog-construct-pattern).*

---

**Tags:** trading, AI, agents, OpenClaw, whisper, automation, personal infrastructure
