---
title: ClawHQ
tagline: Agent orchestration platform
description: The central control plane for managing, deploying, and monitoring AI agent fleets. ClawHQ coordinates agent lifecycles, enforces policies, and provides observability across the entire agent infrastructure.
status: active
role: Orchestration & Control Plane
github: https://github.com/simonplant/clawhq
tags: [orchestration, agent-management, control-plane, observability]
order: 1
relatedProducts: [aishore, clawdius]
---

## Problem

Running AI agents in production requires more than a prompt and an API key. You need lifecycle management, policy enforcement, resource allocation, and observability — the same operational concerns that drove the evolution from shell scripts to container orchestrators in traditional infrastructure.

## Architecture

ClawHQ sits at the center of the agent infrastructure stack. It provides:

- **Agent registry** — catalog of available agent types, their capabilities, and configuration
- **Lifecycle management** — spawn, monitor, pause, resume, and terminate agent instances
- **Policy engine** — enforce scope restrictions, rate limits, and approval workflows
- **Observability** — structured logging, token usage tracking, and performance metrics

## Current Status

Active development. Core orchestration loop is functional. Policy engine handles basic scope restrictions and approval gates.

## Quickstart

```bash
git clone https://github.com/simonplant/clawhq
cd clawhq
npm install
npm run dev
```

## How It Fits

ClawHQ is the orchestrator — it tells agents what to do and ensures they stay within bounds. AIShore generates the sprint backlogs that ClawHQ executes. Clawdius is one of the agents that ClawHQ manages. Easy Markdown provides the content rendering layer for agent-produced output.
