---
title: ClawHQ
tagline: Privacy-first personal AI agent platform
description: Deploy, configure, and personalize sovereign OpenClaw agents on your own hardware. Blueprints compiled into hardened, running agents. Retired — its operational lessons now live inside Sterling.
status: archived
role: Agent Platform
github: https://github.com/simonplant/clawhq
tags: [openclaw, ai-agents, self-hosted, blueprints, sovereignty]
order: 4
relatedProducts: [aishore, sterling]
---

## What it was

OpenClaw became the fastest-growing open-source agent framework while being nearly impossible to operate correctly: thousands of tokens of configuration across 11+ files, dangerous defaults, memory bloat, and a wave of exposed instances and CVEs. Hosting providers sold convenience — default-config agents on a VPS. Nobody solved sovereignty.

ClawHQ compiled **blueprints** — complete operational designs covering identity, tools, skills, cron, integrations, security, autonomy, memory, and egress — into hardened, running agents on your own hardware. Security hardening was automatic, not opt-in. Underneath sat a platform layer that was the same for every agent: install, harden, launch, ops.

## Why it's retired

ClawHQ was a great experiment, and it did its job: it taught me what operating sovereign agents actually requires. But I was its only serious user, and the generalized platform was more machinery than one operator needs. I now manage my production agent directly, with the hardening patterns applied by hand where they matter.

## What carried forward

Nearly everything. [Sterling](/projects/sterling) — my advisory trading agent — runs on the exact posture ClawHQ was built to produce: read-only containers, credential isolation, DNS allowlisting, egress firewalling, config rendered from version-controlled sources. The [OpenClaw architecture reference](/architecture/openclaw-anatomy) on this site is the distilled operator knowledge.

The repository stays up at its final working snapshot.

[Repository →](https://github.com/simonplant/clawhq)
