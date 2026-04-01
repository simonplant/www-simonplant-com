---
title: Clawdius
tagline: AI content production agent
description: An autonomous content agent that produces series installments, commentary, and architecture KB entries. Clawdius writes as Simon — direct, opinionated, grounded in real work — under strict editorial constraints and CI-enforced quality gates.
status: active
role: Content Production Agent
github: https://github.com/simonplant/clawdius
tags: [content-agent, autonomous-writing, editorial-workflow, ci-enforcement]
order: 4
relatedProducts: [clawhq, aishore, easy-markdown]
---

## Problem

Maintaining a content-heavy site alongside active development is unsustainable for a solo operator. But AI-generated content without constraints produces generic, ungrounded filler. The challenge is autonomous content production that maintains a specific voice and quality bar.

## Architecture

Clawdius operates under strict constraints enforced by CI:

- **Scope restriction** — can only touch files in `src/content/`
- **Status limits** — can set idea, draft, or review — never published
- **Batch limits** — max 3 content pieces per PR
- **Voice constraints** — writes as Simon: direct, opinionated, historically grounded
- **Quality gates** — frontmatter validation, required fields, valid status values
- **Approval workflow** — cannot merge own PRs; all content requires Simon's editorial pass

## Current Status

Active. Producing content for this site under the editorial workflow. All output goes through CI validation and manual review before publishing.

## Quickstart

```bash
git clone https://github.com/simonplant/clawdius
cd clawdius
npm install
# Clawdius runs within the content repository context
```

## How It Fits

Clawdius is the content producer in the ecosystem. ClawHQ can manage Clawdius as an agent instance. AIShore provides the sprint framework Clawdius uses for content delivery. Easy Markdown validates the content Clawdius produces. Simon reviews and publishes.
