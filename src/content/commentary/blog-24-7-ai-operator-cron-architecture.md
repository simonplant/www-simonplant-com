---
title: "Structuring a 24/7 AI Operator: The Cron Architecture That Actually Works"
description: "How I structure cron jobs for a persistent AI operator — the patterns that work, the ones that fail, and why task isolation matters more than scheduling."
publishedDate: 2026-03-22
tags: ["ai-agents", "openclaw", "architecture", "production"]
tier: architecture
status: review
---

**Tool:** ClawHQ  
**Queue entry:** up-007

---

Running an AI assistant on a cron job is easy. Running one that doesn't hallucinate tasks, generate unwanted deliverables, or burn $50/day on useless loops is significantly harder.

After six months of running a persistent AI operator — one that handles email, calendar, trading research, meal planning, and project management autonomously — here's the architecture that actually keeps it under control.

## Why Naive Cron AI Fails

The obvious approach: set up a cron job, have your AI run every 10 minutes, let it "do stuff."

This fails for a predictable reason: without scope constraints, your AI will generate output proportional to its autonomy. Ask it to "improve the content pipeline" and it will produce a 3,000-word strategy document you didn't ask for, three blog post drafts, and a new skill file. You asked it to check in. It built a content agency.

The failure mode isn't malice — it's undefined scope. The model will always fill silence with work. The architecture has to define what kind of work is appropriate at each moment.

## The Three-Layer Solution

### Layer 1: Role-Mapped Cron Jobs

Instead of one "do things" cron, use separate cron jobs for distinct operational modes:

| Job | Role | What it does |
|-----|------|-------------|
| `heartbeat` | Executive Assistant | Recon only: inbox, calendar, mentions. Flag what matters. |
| `work-session` | Task Executor | One task from the queue, fully executed. |
| `morning-brief` | EA + Briefer | Compile overnight + day-ahead summary. |
| `eod-review` | Trader | End-of-day market levels vs. watch list. |
| `meal-plan-propose` | Nutritional Coach | Weekly meal proposal against clinical targets. |

Each cron has a defined scope. `heartbeat` doesn't execute tasks — it only identifies them. `work-session` doesn't triage inbox — it picks one task and finishes it. The role separation prevents scope creep at the architecture level.

### Layer 2: The Scope Check

Before a work-session AI agent picks up any task, it runs a scope check based on a simple test:

> Has the human shaped this outcome?

The check works like this: read the task description. If it's specific and bounded ("fix the broken cron expression in heartbeat") → execute. If it's open-ended ("improve the content pipeline") → the outcome isn't shaped yet. Propose what you'd do, wait for go-ahead.

This prevents the common failure where an AI interprets "build content for X" as a mandate to generate twelve blog posts and auto-queue them all.

The test is applied before any work starts, every session. It's not a guideline — it's a gate.

### Layer 3: Task-Cache (The Re-Assessment Loop)

Even with good task selection, AI agents will revisit completed work if there's no state tracking. Task-cache solves this:

```json
{
  "task_id": "abc123",
  "assessment": "Full hotel research done for Vegas Apr 19-25 with Meadow.",
  "next_action": "Simon calls NoMad to book — no Clawdius action possible.",
  "resume_conditions": [{"type": "always"}],
  "next_review_at": "2026-03-25T06:00:00Z"
}
```

Each completed or blocked task gets a cache entry with:
- What was done
- What comes next (and who does it)
- When to re-check (time-based or condition-based)

The work-session cron reads the cache first. Tasks in the NOT READY list are skipped. This stops the agent from re-running research it already completed or adding duplicate comments to already-addressed issues.

## The Result: Bounded Autonomy

With this architecture, the AI runs 24/7 but its behavior at any moment is predictable:

- `heartbeat` (every 10 min, waking hours): scans inbox and calendar, surfaces anything urgent, stays quiet if nothing new
- `work-session` (every 30 min, waking hours): picks one real task, completes it fully, caches the result
- Specialized crons: fire at scheduled times, run constrained roles, produce expected output

Total spend stays proportional to actual work done, not to how many times the cron fired.

## What This Looks Like in Practice

[ClawHQ](https://claw-hq.com) implements this architecture out of the box. The `work-session` cron passes the full scope check protocol to the agent before each run. The task-cache layer persists across sessions. Role-mapped crons are preconfigured with appropriate system prompts for each operational mode.

The agent that runs my inbox, calendar, trading research, and project queue has been running on this architecture for months. It surfaces what matters, executes what it's asked to, and stops when the scope is unclear. That last behavior — stopping and asking rather than guessing and producing — is the hardest thing to get right and the most valuable when you do.

## Takeaway

The right question isn't "how do I make my AI do more?" It's "how do I make sure my AI only does what I've shaped?" Scope checks + role separation + task-cache will get you there faster than any prompt engineering.

---

*ClawHQ is an open-source persistent AI operator framework built on Claude. [claw-hq.com →](https://claw-hq.com)*
