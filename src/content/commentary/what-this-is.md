---
title: "What This Is"
publishedDate: 2026-04-12
tags: [meta, introduction]
description: "What I'm building, why I'm writing about it, and what to expect here."
status: published
tier: signal
pinned: true
---

I'm Simon Plant. I've spent thirty years in enterprise technology — IBM, Capgemini, RightScale, AWS, a startup I co-founded and exited, Rackspace, Redapt, and now my own fractional CTO practice. Most of that time in the same seat: chief architect for whatever was new, designing the system and the plan that delivers it. These days the title says CTO; the work is still half code, half counsel.

Now I'm building software again, and writing about what I'm learning.

## What I'm building

**Sterling** — a sovereign, local-first advisory trading agent. It briefs, watches levels against a locked plan, and proposes trades — but never places an order. Local models on my own hardware, deterministic pipelines, a hash-chained event log as the system of record. The place where everything I've learned about operating AI agents in production actually lives.

**Markdown** — a free, open-source markdown editor for iOS. Because markdown needs to be free and ubiquitous in the AI era, and the good editors are all proprietary or Electron.

I've built and retired other tools along the way — [ClawHQ](/projects/clawhq), an OpenClaw management layer; a personal agent; [AIShore](/projects/aishore), a sprint orchestrator for Claude Code. Some were superseded by how fast the underlying platforms improved; all of them taught me something that's now baked into what I run today. That churn is the point: this space moves fast enough that retiring your own tools is a skill.

## Why I'm writing

I keep hitting problems nobody has documented yet. How to manage an agent whose configuration spans a dozen files. What happens when upstream framework updates break your customizations. Why the security defaults in the most popular agent framework ship wide open. How to get an AI coding agent to produce code that actually runs instead of code that looks plausible.

I've been in infrastructure long enough to recognize when I'm watching the same patterns I saw in cloud ten years ago. Writing is how I think through them.

## What to expect

Build logs, not thought leadership. Real decisions with real tradeoffs. When something breaks, what happened and what fixed it.

Here's an example: [OpenClaw Architecture: Anatomy of a Personal AI Agent](/architecture/openclaw-anatomy). A full operator's map of the most widely deployed open-source agent framework — the process model, the workspace files, the config surface, and where the security defaults bite. That's the kind of thing I write: specific, grounded, useful to someone building the same thing.

I don't have a posting schedule. I write when I hit something worth documenting.
