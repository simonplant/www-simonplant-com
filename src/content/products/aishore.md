---
title: AIShore
tagline: Intent-based sprint orchestration
description: A developer tool that turns backlog items into validated, working code through intent-driven sprints. AIShore manages the full cycle — grooming, branching, implementation, acceptance testing, and merge — with AI agents doing the work and evals ensuring quality.
status: active
role: Sprint Orchestration & Delivery
github: https://github.com/simonplant/aishore
tags: [sprint-orchestration, intent-driven, developer-tooling, evals]
order: 2
relatedProducts: [clawhq, clawdius]
---

## Problem

Traditional sprint planning produces tickets that developers interpret loosely. AI coding agents make this worse — they need precise intent, clear acceptance criteria, and automated validation. Without structure, AI-generated code drifts from intent and accumulates regressions across sprints.

## Architecture

AIShore operates as a CLI tool that orchestrates development sprints:

- **Backlog management** — structured items with intent, steps, acceptance criteria, and scope constraints
- **Worktree isolation** — each sprint item runs in a clean git worktree
- **Agent dispatch** — sends developer agents to implement items with full context
- **Validation pipeline** — runs AC verify commands, regression checks, and independent validator agents
- **Merge automation** — only merges code that passes all checks

## Current Status

Active development (v0.5). Powering the development of this site — every feature page you see was implemented through an AIShore sprint.

## Quickstart

```bash
# Within a project that has a backlog/ directory
.aishore/aishore run        # Run next sprint item
.aishore/aishore status     # View backlog overview
.aishore/aishore groom      # Groom and prioritize items
```

## How It Fits

AIShore is the delivery engine. It consumes backlog items and produces validated code. ClawHQ provides the orchestration layer above it. Clawdius uses AIShore's sprint framework to deliver content. The site you're reading was built sprint-by-sprint through AIShore.
