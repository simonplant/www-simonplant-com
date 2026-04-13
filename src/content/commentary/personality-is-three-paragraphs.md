---
title: "Personality Is Three Paragraphs"
publishedDate: 2026-04-13
tags: [persona, agent-architecture, product-design, contrarian]
description: "I built a 17-dimension persona schema for AI agents — six psychological frameworks, seven archetypes. Then I scrapped it. For work agents, capabilities are the product. Persona is a settings page."
status: draft
tier: signal
---

I spent six weeks building a 17-dimension persona schema for ClawHQ. Six psychological frameworks — Big Five, HEXACO honesty-humility, Interpersonal Circumplex, Schwartz's Basic Values, Haidt's Moral Foundations, Self-Determination Theory. Seven archetypes: Analyst, Executive Assistant, Senior Engineer, four others. Per-profile pairings so your dev agent ships as a terse engineer and your family agent as something warmer. Real personality science mapped to agent behavioral parameters.

I scrapped it because the feedback was unambiguous. Nobody asked for personality options. What they asked for: make it stop being chatty. Make it stop narrating its own process. Make it stop opening with "Great question!" The demand was for *less personality*, not more options.

What shipped: one default tone (competent, terse, no theatrics), one visible slider (warmth — the single axis that actually varies between work and personal contexts), a free-text override field, and six hidden sliders most users will never find. Seventeen dimensions down to three paragraphs in a config file.

## The wrong layer

The OpenClaw community has produced over 160 SOUL.md templates. Every one defines personality — voice, tone, behavioral style. None include tool configuration, cron schedules, security posture, or credential management. I wrote this during the teardown of the persona system and it still holds: a character sheet for a game nobody set up.

Personality is the attractive nuisance of agent product design. You write a SOUL.md, the agent talks differently, you feel like you shipped something. It's immediately visible, immediately gratifying, and it doesn't drive retention.

What drives retention: the email triage skill that knows your escalation rules. The cron schedule that checks your inbox every fifteen minutes. The integration that sends email on your behalf. The permissions that prevent the agent from doing things it shouldn't. Capability — tools, schedules, integrations, permissions. That's what keeps someone using an agent instead of going back to doing things manually. Nobody stops using an agent because the tone was too formal. People stop because it silently failed at something useful three days ago and they didn't notice.

## What I actually run

Clawdius — my personal OpenClaw instance — manages email, calendar, research, and daily briefings. Its SOUL.md reads: "Reliable, clear, no persona. Gets things done without theatrics." That's it. The operational stack underneath that personality spec is thousands of lines of configuration: skill definitions, cron schedules, tool policies, egress rules, security hardening, credential management.

The 17-dimension schema taught me something useful — which dimensions actually matter (warmth, directness, verbosity) and which are noise for operational agents. I don't regret building it. But the ratio tells the story: three paragraphs of personality configuration, thousands of lines of operational configuration. That's not a design failure. That's the correct proportion.

The [full account](/series/ops-layer-05) has the details. The short version: the operational stack is the product. Personality is a settings page.
