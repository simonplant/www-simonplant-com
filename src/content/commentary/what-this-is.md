---
title: "What This Is"
publishedDate: 2026-04-12
tags: [meta, introduction]
description: "What I'm building, why I'm writing about it, and what to expect here."
status: published
tier: signal
pinned: true
---

I'm Simon Plant. I've spent thirty years in infrastructure — IBM, Capgemini, RightScale, AWS, a startup I co-founded and exited, Rackspace, Redapt, and now my own fractional CTO practice. Most of that time was spent on the same problem: making powerful platforms operatable.

Now I'm building software again, and writing about what I'm learning.

## What I'm building

**ClawHQ** — a management layer for OpenClaw, the open-source AI agent framework. Configuration governance, lifecycle management, security hardening. The operational tooling that the framework doesn't ship.

**Clawdius** — my personal OpenClaw agent, deployed via ClawHQ. Handles email, calendar, research, daily briefings. The test bed where I feel the consequences of my own design decisions.

**AIShore** — autonomous sprint orchestration for Claude Code. The tool I use to make AI-assisted development actually produce working, wired-up code instead of isolated fragments.

**Markdown** — a cross-platform markdown editor built with Rust and Tauri. Because markdown needs to be free and ubiquitous in the AI era, and the good editors are all proprietary or Electron.

## Why I'm writing

I keep hitting problems nobody has documented yet. How to manage an agent whose configuration spans a dozen files. What happens when upstream framework updates break your customizations. Why the security defaults in the most popular agent framework ship wide open. How to get an AI coding agent to produce code that actually runs instead of code that looks plausible.

I've been in infrastructure long enough to recognize when I'm watching the same patterns I saw in cloud ten years ago. Writing is how I think through them.

## What to expect

Build logs, not thought leadership. Real decisions with real tradeoffs. When something breaks, what happened and what fixed it.

Here's an example: [Don't Blame Your Layers](/blog/dont-blame-your-layers). An upstream OpenClaw update broke my agent's Telegram integration. I almost ripped out my entire security stack to diagnose it. The update pipeline saved me. That's the kind of thing I write about — specific, grounded, useful to someone building the same thing.

I don't have a posting schedule. I write when I hit something worth documenting.
