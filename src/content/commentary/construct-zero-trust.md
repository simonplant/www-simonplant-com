---
title: "Zero Trust for AI Skills: Why I Cloned The Construct"
description: "Why safe capability acquisition requires zero-trust principles — and how I built a hardened version of the Construct pattern for Clawdius."
publishedDate: 2026-03-24
tags: ["security", "ai-agents", "openclaw", "zero-trust"]
tier: architecture
status: review
---

OpenClaw ships with a skill called The Construct. It's elegant: a four-phase cycle (Assess → Propose → Build → Deploy) that lets an always-on AI agent identify its own capability gaps and fill them autonomously. The idea is genuinely good.

I won't run it.

Not the official version, anyway. Instead, I built my own clone of it, from scratch, inside my own infrastructure. This is the story of why — and why you should probably do the same if you're running serious personal AI infrastructure.

---

## The Problem With Party Skills

"Party skills" is my term for skills acquired from an external source and installed directly into your agent. The OpenClaw skill marketplace (if one existed), third-party GitHub repos, blog posts with copy-paste SKILL.md files, community Discord drops — all of it is party skill territory.

The value proposition is obvious: someone already built something useful, why reinvent it?

Here's the thing: my agent has access to my email, my files, my calendar, my brokerage accounts, my trading data, my health records. It runs 24/7 with no human in the loop for most operations. A compromised skill in that environment isn't a minor inconvenience. It's catastrophic.

The classic supply chain attack model applies directly here:
- You find a "weather skill" on GitHub
- It does exactly what it says it does (initially)
- It also makes an outbound HTTP call with sanitized data from your workspace
- Or it introduces a prompt injection vector into your sanitize pipeline
- Or it simply has a subtle bug that, under the right conditions, escalates permissions

Party skills solve a convenience problem while introducing a trust problem. That tradeoff isn't worth it when the blast radius is your entire digital life.

---

## Zero Trust, Applied to Capabilities

Zero trust, in network security, means: don't assume that anything inside the perimeter is safe just because it's inside. Verify everything. Least privilege everywhere. Explicit allowlists over implicit trust.

The same principle applies to AI agent capabilities.

**Default state:** no new capability is trusted, regardless of where it came from.

**What that means in practice:**
- Skills downloaded from external sources don't run — they're read and understood
- External code is input to understanding, not something that executes
- New capabilities are rebuilt from scratch, inside the controlled environment, by the agent you already trust
- The external source is the teacher; the agent's own code is the lesson learned

This isn't paranoia. It's the right security posture for infrastructure that has privileged access.

---

## What The Construct Pattern Actually Does

The Construct is valuable as a *pattern*, not as a *package*. The core insight:

> An always-on agent runs its own failures. It sees repeated manual work. It knows its gaps better than you do. Give it a structured way to identify, propose, and build new capabilities — with security constraints built in — and it will compound on itself.

The four phases:

**Assess.** Read recent memory files, session logs, failure notes. Find gaps with evidence. "I tried this three times and failed" qualifies. "It would be nice to have X" does not.

**Propose.** Design concrete skill proposals with explicit tradeoffs: what it does, why it matters (evidence-referenced), how to build it, effort estimate. Filter duplicates. Filter unresolvable dependencies.

**Build.** This is the security-critical phase. Read relevant docs/specs to understand the approach. Then write the implementation from scratch — every line authored by the agent you already trust, using only dependencies already in the environment, tested before deployment. External code never executes. It only informs.

**Deploy.** Commit to your private toolkit repo. Audit trail. Everything tracked.

The official Construct skill implements this well. The issue isn't the design — it's that the implementation itself is a party skill.

---

## Building Your Own Clone

My clone (`real-clawdius-maximus/toolkit/skills/construct`) does the same thing. The difference: every line of it was written by Clawdius, inside my environment, grounded in my understanding of the design.

Here's what that required:

**1. Read the spec, don't copy it.** I had Clawdius read the SKILL.md, understand the state machine, and describe the approach in its own words before writing a single line. This forced comprehension instead of copy-paste.

**2. Build the state manager from scratch.** The original uses `scripts/state.py` as a state management CLI. My version implements the same interface using only Python stdlib — no external packages, fully auditable, tested interactively.

**3. Write the SKILL.md fresh.** The instructions in my SKILL.md describe how my version works, with my security constraints, my memory paths, my toolkit repo structure. It's not a fork; it's an independent implementation of the same pattern.

**4. Test it on real gaps.** First run assessed the memory from the previous week, found three genuine capability gaps (eod-review wasn't running, substack auth was stale, content queue was empty), proposed two buildable skills, built one. Deployed, committed, live.

Total time: about four hours for the first version. It's been running nightly since.

---

## What It's Built Since

Four skills deployed via my Construct clone in the past six weeks:

**eod-review** — end-of-day market review against morning's Mancini/T3Live levels. Runs automatically at 4:15pm ET on trading days.

**content-seed** — mines session memory for blog/tweet/video ideas, adds them to the task queue. (Meta: this post was seeded by it.)

**meal-planner** — weekly meal proposals against a MASLD Mediterranean diet protocol. Built because I kept skipping meals without a plan.

**morning-brief** — compiles inbox, calendar, trading setup, and task queue into a single 8am Telegram message. Built because I was assembling this manually.

None of these were in the initial design. All of them came from Construct watching Clawdius fail at something, repeatedly, and doing something about it.

---

## The Deeper Point

Most people approach AI customization through prompting: write better system prompts, add more context, chain more carefully. That's useful at small scales.

Always-on infrastructure needs a different model. Your agent runs when you're asleep. It encounters situations you didn't anticipate. It bumps into capability walls. Prompting doesn't fix that — capability does.

The Construct pattern is how you grow capability continuously, without giving up security. The zero-trust constraint is what makes it safe to run continuously, without supervision.

Build it yourself, from your own understanding, using your own code. Make it yours. Then let it compound.

That's the thing party skills can't give you.

---

## Implementation Notes (If You're Building Your Own)

A few things I got wrong the first time:

**Don't assess too broadly.** The first run proposed 11 skills. Eight were either duplicates of things that existed or too vague to build. Sharpen the evidence threshold — if you can't point to a specific failure log, it's not a real gap.

**The symlink for discovery matters.** Skills need to be symlinked into the `skills/` directory that the agent's system prompt scans. Without this, a built skill exists but is invisible.

**State persistence is the whole game.** Without Construct tracking what it's assessed and built, it repeats assessments on already-fixed gaps. The state file is what makes it compound instead of spin.

**Hard stops before every build.** Certain skill categories should never be buildable: spam, unauthorized access, data exfiltration, social engineering. Put these in a SOUL.md for the skill, check them before every build phase. This is the constraint that keeps autonomous capability growth from becoming a problem.

---

*Simon Plant is a fractional CTO and builder of Clawdius, an always-on AI agent running on OpenClaw. Find him at simonplant.com.*

---

**Tags:** AI, agents, zero trust, security, personal infrastructure, OpenClaw, Construct
