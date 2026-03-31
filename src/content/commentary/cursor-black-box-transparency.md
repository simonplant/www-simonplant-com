---
title: "Cursor Lied About Its Model. Why That Matters More Than the Scandal."
description: "The Cursor Composer model attribution mess was an honesty problem. But the deeper issue is engineering: opacity in your AI toolchain is a maintenance liability."
publishedDate: 2026-03-28
tags: ["ai-tools", "cursor", "transparency", "methodology"]
tier: signal
status: review
---

On March 19, Cursor launched "Composer 2." Strong benchmarks (61.7% Terminal-Bench 2.0), positioned as an in-house frontier model, priced at $0.50/M input and $2.50/M output. The messaging implied they'd built something proprietary.

Within 24 hours, developers found the API model ID: `kimi-k2p5-rl-0317-s515-fast`. Moonshot AI's Kimi K2.5. Not a Cursor model at all.

The attribution miss unraveled fast. Moonshot's head of pre-training confirmed it publicly, then deleted the post. A Cursor engineer acknowledged it on X. Cursor clarified they had a commercial license via Fireworks AI — technically legitimate, poorly disclosed.

The developer community treated it as a scandal. Some called it deceptive. Others called it just a PR fumble. I think it's something more interesting: it's a symptom.

---

## The Appearance of Capability

Cursor is a $2.93 billion company. They have 60% enterprise penetration, $2B ARR, and now write 100% of their own code using their own agents. They're genuinely impressive.

And they still felt they couldn't say: "We're using Kimi K2.5 from Moonshot AI, fine-tuned with our own real-time RL pipeline."

That's striking. Because that's actually a great story. Moonshot's Kimi K2.5 is emerging as the open-weight coding model everyone wants — Cloudflare runs it at 84% cheaper than proprietary alternatives. Cursor's real-time RL improvements (+2.28% edit persist, -10.3% latency from live user signal) are genuinely novel engineering work. The actual story was good.

They just couldn't tell it. Because the whole industry has trained itself — trained *us* — to reward the black box. Proprietary is premium. Owned infrastructure is moat. Opacity is competitive advantage.

This is the AI tools problem, and it's deeper than one company's attribution mistake.

---

## What Black Boxes Actually Cost You

I've spent years in this stack. I've watched teams buy AI tools that behave differently in production than in demos, that change behavior after model updates they're never told about, that can't explain why they made a particular suggestion last Tuesday.

The black box problem isn't just about honesty. It's about maintenance.

When you don't know what's inside the system, you can't:
- Diagnose unexpected behavior
- Adapt your workflow when the model changes
- Reason about failure modes before they happen
- Train your team on why it works, not just how to use it

You end up dependent on the vendor's changelog to understand your own workflow. That's a bad position to be in.

---

## Building in the Open Isn't a Principle. It's Engineering.

I build everything in the open. Not as a values statement — as a practice.

The AI operator I run daily (Clawdius, on OpenClaw) has every behavior specified in plain text files: `AGENTS.md` for workflow, `SOUL.md` for persona, `MEMORY.md` for persistent context. Any session, any day, I can open those files and understand exactly what the system is doing and why.

When I build iOS features in 28-feature AI-accelerated sprints, every sprint spec is committed alongside the code. My context files (`BUILDING.md`, `ARCHITECTURE.md`) are first-class artifacts, not post-hoc documentation.

When easy-markdown calls on-device AI, I know which model it's using (Apple Foundation Models, ~3B parameter, isolated in the Foundation framework), what the latency profile is (under 60ms on A18 Pro for short completions), and what it can't do (no server-side inference, no cross-device context). That's not opacity — that's a product decision I can reason about.

This isn't idealism. It's just how you build things that can be debugged, improved, and handed to someone else without a week of archaeology.

---

## What This Means for Teams Buying AI Tools

Cursor's scandal won't matter in six months. They'll disclose base models going forward, ship more improvements, and their enterprise customers — who chose them because of procurement leverage, not model attribution — won't churn over this.

But the underlying question it surfaced is worth keeping: *do you know what's inside the tools running your development workflow?*

Not in a conspiracy sense. In a practical one. When the model changes — and it will — will you know? When behavior shifts — and it will — will you be able to diagnose it? When a new team member joins, can you explain the system, or just hand them credentials and hope?

If you're evaluating AI development tooling right now, the questions I'd ask:
- Can you get the model ID, version, and changelog?
- Does the vendor publish when they swap models under the hood?
- Is your workflow specified in text you own, or locked in their platform?
- Can you reproduce what the agent did yesterday?

These aren't exotic requirements. They're the same questions you'd ask about any dependency.

---

Cursor is still the best editor on the market for most development workflows. I use Claude Code myself. The landscape is genuinely good and getting better.

But the best tool for your team isn't necessarily the one with the best benchmarks. It's the one you can actually see inside.

---

*Simon Plant builds AI-accelerated software and teaches teams how to ship faster with AI. He's available for sprint engagements and fractional CTO work. [simonplant.com](https://simonplant.com)*
