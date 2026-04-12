---
title: "Mission Profiles: Scoping What Your Agent Can Touch"
number: 9
publishedDate: 2026-04-12
description: "Ten a-la-carte profiles with tool ownership boundaries. Predictable, debuggable agent behavior."
tags: [mission-profiles, permissions, architecture, security]
status: published
---

The single most common failure mode I see in agent deployments isn't a security breach or a model hallucination. It's scope confusion. The agent has access to email, calendar, a task manager, web search, a stock quote API, and a home automation system — and nobody defined which tools belong to which workflows.

The result is predictable: the agent tries to send an email when it should be creating a task. It queries your stock portfolio when you asked about a calendar conflict. It has 40 tools loaded into its context window, burning tokens on tool descriptions for capabilities it won't use in the current interaction. Every tool in the context window is a loaded gun pointed at your token budget and your operational sanity.

ClawHQ solves this with mission profiles — ten a-la-carte capability packages, each with clean, non-overlapping tool ownership. You compose your agent from profiles. Two profiles should never fight over who owns a tool.

---

## The Ten Profiles

### 1. LifeOps — The Universal Base

Email (himalaya), calendar (khal/vdirsyncer), tasks (Todoist), weather, meal planning, morning and evening briefings.

Everyone starts here. LifeOps is the base profile because these are the tools that every agent operator eventually needs regardless of what else their agent does. Your agent reads your email, checks your calendar, manages your task list, and gives you a morning brief. This is the minimum viable personal agent.

### 2. Dev

GitHub/GitLab integration, git operations, CI/CD pipeline management, Sentry error tracking, Linear/Jira ticket management, PR reviews, repo monitoring.

This is where I live professionally. The Dev profile gives your agent the ability to monitor repositories, triage issues, review pull requests, and manage your development workflow. The critical boundary: Dev owns CI/CD and issue tracking. LifeOps owns task management. A Jira ticket and a Todoist task are not the same thing, and your agent needs to understand which system is the source of truth for which type of work.

### 3. Research

Web search (Tavily/Brave/SearXNG), synthesis, knowledge base management (Obsidian/Notion), literature review.

Research is the capability that makes agents genuinely useful beyond notification management. The profile owns web search and knowledge synthesis — taking raw search results and turning them into structured findings. The boundary with Dev: if you're searching for how to fix a bug, that's Dev (it goes through repo search and documentation). If you're searching for market analysis, competitive landscape, or general knowledge, that's Research.

### 4. Markets

Yahoo Finance, Alpha Vantage, Polygon.io, portfolio tracking, TradingView chart analysis, SEC filings, broker integration (Alpaca, IBKR).

Financial data and portfolio management. This profile does not execute trades by default — broker integration requires explicit delegation for write operations. The read path (quotes, portfolio snapshots, filings) is open. The write path (orders) requires human approval.

### 5. Sales

HubSpot, Salesforce, Pipedrive — CRM integration, lead tracking, outreach drafting, deal stage management.

Sales owns the pipeline. It can draft outreach emails, but sending goes through LifeOps (which owns email transport). This is the first example of cross-profile signaling: Sales prepares the content, LifeOps handles the delivery. Neither profile needs to understand the other's internals.

### 6. Marketing

Social media management, content calendar, newsletter orchestration, SEO analysis, analytics dashboards, content repurposing.

Marketing owns content distribution. The boundary with Sales: Marketing handles inbound (content, SEO, social), Sales handles outbound (direct outreach, pipeline management). The boundary with SiteOps: Marketing decides what content to publish, SiteOps handles the deployment mechanics.

### 7. SiteOps

Website updates, deployment pipelines, uptime monitoring, SSL/domain management, CMS integration, broken link detection.

SiteOps is the infrastructure profile for web properties. It owns the deployment pipeline for websites specifically — not application deployments generally (that's Dev with CI/CD). The distinction matters: deploying a blog post and deploying a microservice are fundamentally different operations with different risk profiles and different rollback strategies.

### 8. Home

Home Assistant, HomeKit, smart devices, camera monitoring, MQTT message broker, presence-based automation.

Home automation. This profile is the most physically consequential — it controls locks, lights, thermostats, and cameras. Security hardening for this profile is aggressive by default: all write operations require explicit approval, camera access is logged with HMAC-chained audit entries, and the egress allowlist is restricted to your local network and your home automation controller's API.

### 9. Health

WHOOP, Oura Ring, Garmin, Strava, Cronometer, sleep analysis, recovery scoring, supplement reminders.

Wearable and health data aggregation. This profile reads from health APIs and synthesizes trends — sleep quality, HRV, recovery readiness, training load. It does not provide medical advice, and the persona guardrails in ClawHQ explicitly prevent the agent from interpreting health data as diagnostic.

### 10. Media

DALL-E, ComfyUI (image generation), FFmpeg, Sora (video), ElevenLabs, Piper (text-to-speech), ImageMagick, audio processing.

Creative asset generation and media processing. This profile handles the compute-heavy work of generating images, processing video, and producing audio. The boundary with Marketing: Media creates assets, Marketing distributes them.

---

## The Organizing Principle

The rule is simple: two profiles should never fight over who owns a tool.

Email transport belongs to LifeOps. Always. Even when Sales drafts an outreach message or Marketing prepares a newsletter, the actual send operation goes through LifeOps. This means there's exactly one place to audit email egress, exactly one place to enforce rate limits, and exactly one approval checkpoint for high-stakes communications.

When profiles need to collaborate, they use cross-profile signaling — structured messages between profiles that carry data without transferring tool ownership. Health detects that your recovery score is low and signals LifeOps: "suggest lighter meals today." LifeOps adjusts the meal plan. Health never touches the meal planning tool. LifeOps never reads your Oura ring data.

This isn't theoretical. I've watched agent deployments where three different integrations could all send email. When an email goes out that shouldn't have, which integration sent it? Which one do you disable? Which one has the approval gate? If the answer is "all three" or "it depends," you don't have a system — you have a pile of integrations.

---

## Common Stacks

Most operators don't need all ten profiles. ClawHQ ships with recommended stacks for common use cases:

**Developer** — LifeOps + Dev. Morning brief includes open PRs, failing CI runs, and unresolved Sentry issues alongside your calendar and task list.

**Solo Founder** — LifeOps + Dev + Marketing + Sales. The agent manages your development workflow, tracks your pipeline, handles content distribution, and keeps your task list current. This is the default starting point and the most common configuration I've seen.

**Investor** — LifeOps + Markets + Research. Portfolio monitoring, SEC filing analysis, market research synthesis, delivered in morning and evening briefs.

**Smart Home Operator** — LifeOps + Home + Health. Presence automation, energy management, health-informed home adjustments (lights dim when recovery is low, thermostat adjusts based on sleep schedule).

---

## My Stack

From my own `clawhq.yaml`:

```yaml
profile: life-ops
personality: digital-assistant
providers:
  - gmail
  - icloud-cal
  - todoist
  - tavily
security: hardened
egress: allowlist-only
```

I run LifeOps with Research capabilities (Tavily for web search). That's it. Not because the other profiles aren't valuable — I use Dev tooling constantly — but because I operate my development workflow through Claude Code and purpose-built CLI tools, not through my personal agent. The agent handles email triage, calendar management, task orchestration, and research synthesis.

The profile system exists so that operators can make this choice deliberately rather than accidentally. When I say "my agent can search the web and manage my email," that's a statement about my mission profile. When I say "my agent cannot access my GitHub repositories," that's also a statement about my mission profile. Both are load-bearing.

---

## What Profiles Are Not

Four things that look like profiles but are actually infrastructure layers:

**Messaging channels** (Telegram, Signal, Discord) — these are transport, not capability. Any profile can send notifications through any configured messaging channel. The channel is how the agent reaches you, not what the agent can do.

**Files and storage** — shared infrastructure. Any profile can read and write to the agent's workspace. Storage isn't a capability boundary; it's a substrate.

**Voice I/O** — an input modality, not a profile. Voice is how you talk to the agent, not what the agent does with your request.

**Sovereign mode** — a provider-preference overlay that biases the agent toward self-hosted alternatives. It's a policy setting, not a capability set.

Profiles define what tools the agent can touch. Infrastructure layers define how the agent communicates, stores data, accepts input, and selects providers. Conflating the two is how you end up with a "messaging profile" that somehow owns both Telegram notifications and email sending — which violates the entire ownership model.

---

## Why This Matters Operationally

Mission profiles are a governance mechanism disguised as a feature. When something goes wrong — and something always goes wrong — profiles answer the first diagnostic question: which capability domain is involved?

If your agent sent an email it shouldn't have, you look at LifeOps. If it committed code to the wrong branch, you look at Dev. If it executed a trade, you look at Markets. The blast radius of any failure is bounded by the profile boundary.

This is the same principle behind IAM policies in AWS, RBAC in Kubernetes, and service accounts in GCP. Least privilege isn't about preventing attacks (though it does that too). It's about making failures diagnosable. When every component can do everything, a failure could have come from anywhere. When each component has a defined scope, the investigation starts with a bounded search space.

Profiles also solve the token cost problem. An agent with all ten profiles loaded has 40+ tool descriptions in its context window. At 200-500 tokens per tool description, that's 8,000-20,000 tokens burned before the agent does anything. Load only the profiles you use, and that drops to 2,000-5,000 tokens. Over thousands of interactions per month, the savings are material.

Scope your agent deliberately. Two profiles should never fight over who owns a tool. Start with LifeOps and add profiles only when you have a specific operational need — not because the capability sounds interesting.

---

*Next: [The Tool Sprawl Trap](/series/ops-layer-10) — what happens when integrations accumulate faster than governance, and how to keep your tool inventory manageable.*
