---
title: AIShore
tagline: Autonomous sprint orchestration for Claude Code
description: Drop-in sprint orchestration for Claude Code. Write a backlog with commander's intent; AI implements, validates, and merges — item by item, branch by branch.
status: active
role: Sprint Orchestration
github: https://github.com/simonplant/aishore
tags: [sprint-orchestration, claude-code, intent-driven, developer-tools]
order: 2
relatedProducts: [clawhq, markdown]
---

## What it is

AIShore drains a backlog of work through Claude Code, one item at a time. Each item has three things:

1. **Commander's intent** — a directive, not a description. "Ops must know instantly if the service is alive or dead," not "add health check endpoint." Intent is the north star when the spec is ambiguous and the bar the validator checks against.
2. **Steps and acceptance criteria** — specific enough that an AI developer can implement without guessing.
3. **Executable eval commands** — `--ac-verify` shell commands that prove the AC is actually met. Not grep theater against source files — actual smoke tests against running code.

## How it works

```
Pick → Branch → Preflight → Develop → Validate → Merge/Archive
                                │          │
                                └─ retry ──┘
```

Isolated git worktree per sprint. Preflight runs the full regression suite on an unmodified baseline. Validate runs the AC verify commands, then an independent Validator agent probes against intent. Merge, push, archive.

## Evals compound

Every passing sprint's verify commands are saved. Before every future sprint, the full suite runs as pre-flight. Sprint 51 cannot silently break what sprint 12 proved — and the suite grows automatically from well-written AC, with no manual test maintenance.

## Status

Active. Public. Apache 2.0. Used to build Markdown and this site.

[Repository →](https://github.com/simonplant/aishore)
