---
title: AIShore
tagline: Autonomous sprint orchestration for Claude Code
description: Write a backlog with commander's intent; AI implements, validates, and merges — item by item, branch by branch, hands-off. Retired once Claude Code's own orchestration caught up.
status: archived
role: Sprint Orchestration
github: https://github.com/simonplant/aishore
tags: [sprint-orchestration, claude-code, intent-driven, developer-tools]
order: 3
relatedProducts: [clawhq, markdown]
---

## What it was

AIShore drained a backlog of work through Claude Code autonomously: `aishore run done` and it implemented, validated, and merged item by item, branch by branch. Every backlog item carried a **commander's intent** field — when steps or acceptance criteria were ambiguous, the agent followed intent instead of guessing.

Its core discipline was **core before features**: a Core Gate verified that the application boots and its primary path works before any feature item became pickable. If a sprint broke the core, AIShore auto-generated a heal item and pushed it to the front of the queue. Working code that's reachable beats tested code that's isolated.

## Why it's retired

Claude Code evolved fast enough to absorb the job. Subagents, task tracking, plan mode, and native multi-agent workflows now cover most of what AIShore bolted on from the outside. The right move when the platform eats your tool is to stop maintaining the tool.

## What carried forward

The ideas outlived the code: intent as the north star, core-gating feature work, prove-it-runs validation. They shaped how I run agent-built projects today — including [Sterling](/projects/sterling) and the [Markdown](/projects/markdown) editor, both built largely by autonomous agents.

The repository stays up at its final working snapshot.

[Repository →](https://github.com/simonplant/aishore)
