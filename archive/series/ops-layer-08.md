---
title: "Choosing Your Inference Stack"
number: 8
publishedDate: 2026-04-12
description: "Not a benchmark comparison. A real decision tree: local vs API, fallback chains, cost/privacy/latency trade-offs."
tags: [inference, models, hardware, architecture]
status: draft
---

Every ten minutes, Clawdius runs a heartbeat check. It scans task state, looks for stale items, checks cron health, and reports. In my setup, that's 144 invocations per day, every day, forever. If each one hit a frontier API at $10/MTok input pricing, I'd be optimizing my agent's existence out of my bank account. Instead, those heartbeats run on Gemma 4 27B via Ollama, locally, on my own hardware. Cost per inference: zero marginal. The electricity bill doesn't even register.

That's not a benchmark result. It's an infrastructure decision. And it's the kind of decision that determines whether your agent is a sustainable system or a financial liability.

---

## The Decision Isn't About Capability

The AI community treats model selection as a capability leaderboard. Which model scores highest on MMLU? Which one writes better code? Which one reasons more reliably? Those are interesting questions for researchers. They're the wrong questions for operators.

When you're choosing an inference stack for a production agent, you're making an infrastructure architecture decision. The relevant dimensions are cost, latency, privacy, reliability, and — less discussed but equally real — politics. Capability is one input. It's not the only input, and it's rarely the decisive one.

Here's my actual setup. Clawdius runs every cron job — heartbeat, work-session, morning-brief, schedule-guard — through `ollama/gemma4:27b`. Not because Gemma 4 is the most capable model available. Because it's the right model for these specific tasks at this specific operational cadence.

---

## When to Run Local

Local inference via Ollama is the default in my stack. The reasons are concrete, not ideological.

**Cost at cadence.** Those 144 daily heartbeat calls aren't the only invocations. Add work-session checks, morning briefings, schedule-guard runs, and ad-hoc task execution. You're looking at hundreds of inference calls per day. At frontier API pricing — $3–15 per million tokens depending on provider and model — that's real money compounding daily. Local inference converts that variable cost into a fixed one: hardware acquisition, amortized over years of use. After the first month of heavy operation, the math is obvious.

**Privacy without trust.** Clawdius processes my email content, calendar events, task descriptions, and personal notes. Every API call transmits that data to a third party. Every provider's privacy policy is a legal document, not a technical guarantee. Local inference means my email triage, my calendar conflicts, my task priorities — none of it leaves my machine. Not because I distrust any specific provider. Because trust is a vulnerability, and eliminating it is better than managing it.

**Latency for tight loops.** A heartbeat check that runs every ten minutes needs to complete fast. Network round-trips to API endpoints add latency that's unnecessary for the task. Local inference on a dedicated GPU with sufficient VRAM gives sub-second response times for the kind of structured queries that heartbeat and schedule-guard perform. No network dependency. No rate limiting. No API outages at 3am when your morning briefing is compiling.

**Availability.** My agent doesn't stop working because OpenAI is having an incident, or because Anthropic's API is rate-limiting me, or because my internet connection dropped. Local models are available when the machine is on. That's it. No SLA to monitor, no status page to check.

---

## When to Use APIs

Local models have a capability ceiling, and pretending otherwise is dishonest engineering.

ClawHQ's own product documentation states this plainly: "OpenClaw's tool system requires function calling — small local models are less capable and less robust against prompt injection than frontier models. Blueprints are honest about this tradeoff."

That's not hedge language. It's operational reality. There are tasks where you need a frontier model, and running a smaller local model isn't being principled — it's being negligent.

**Complex reasoning chains.** When Clawdius needs to synthesize a research brief from multiple sources, evaluate conflicting information, or make nuanced judgment calls, the gap between a 27B parameter model and a frontier model matters. Local models handle structured, bounded tasks well. They handle open-ended reasoning less well. The quality difference is measurable and consequential.

**Reliable function calling.** Tool use — structured JSON output that maps to function invocations — is where smaller models get brittle. They hallucinate parameter values. They call the wrong tool. They produce output that's almost valid JSON but not quite. Frontier models are dramatically more reliable at this. If a task requires multi-step tool orchestration, the cost of a failed local inference (retry, error handling, potential data corruption) often exceeds the cost of a single API call.

**Adversarial robustness.** Prompt injection resistance scales with model capability. An agent that processes untrusted input — email content from unknown senders, web pages, third-party API responses — needs a model that can distinguish instructions from data. Local models are more susceptible to injection attacks that manipulate agent behavior. For tasks that handle untrusted content, this isn't a theoretical concern.

OpenClaw supports routing to Anthropic, OpenAI, Google, and OpenRouter. The provider-agnostic design means the decision isn't locked in. You configure which provider handles which task category, and the same CLI interface works regardless.

---

## Fallback Chains: Graceful Degradation

Here's where I have to be honest about a gap in my own setup. Clawdius's cron jobs currently run with no fallback configured. If the local Ollama instance can't handle a task, it fails. No escalation to a cloud provider. No retry with a more capable model. Just failure.

This is a deliberate choice with a known cost. The simplicity benefit — one model, one runtime, no routing logic, no API credentials to manage in the cron context — is real. But it means that when Gemma 4 can't parse a complex email thread or struggles with an ambiguous task description, the failure mode is silent. The heartbeat reports "done" but the output quality degrades without any signal.

The architecture supports better. OpenClaw's model routing can chain providers: try local first, fall back to a cloud API if the local response fails quality checks. The design exists. I haven't wired it into the cron layer yet because the failure rate on my current workloads hasn't justified the complexity.

Here's how fallback chains should work in principle:

**Tier 1: Local, fast, cheap.** Ollama with your preferred local model handles the bulk of requests. Heartbeats, status checks, routine task execution, schedule management. These are bounded tasks with predictable input patterns. A 27B model handles them fine.

**Tier 2: Cloud, capable, paid.** When the local model's response fails a quality gate — malformed JSON, low-confidence output, task complexity exceeding a threshold — the request escalates to a frontier API. Anthropic's Claude, OpenAI's GPT series, Google's Gemini. The cost per call is higher but the call volume is lower because Tier 1 absorbs the routine traffic.

**Tier 3: Human escalation.** Some tasks shouldn't be retried with a bigger model. They should be flagged for human review. A purchase decision. A message that could be interpreted multiple ways. A conflict between calendar events that requires judgment about priorities the agent doesn't have. The fallback chain needs an exit ramp, not just bigger models.

The mistake most people make is designing fallback as "try a bigger model." The right design is "try a bigger model, and if that's still not enough, tell me." Agents that retry indefinitely with increasingly expensive models are optimizing for completeness at the expense of trust.

---

## The Provider Politics Nobody Talks About

Model selection has a political dimension that technical architecture documents typically ignore.

Some operators won't use OpenAI on principle — concerns about corporate governance, safety practices, or business ethics. Some exclude Chinese-origin models — DeepSeek, Qwen — over data sovereignty concerns, whether or not those concerns are technically justified for a given deployment. Some organizations mandate specific providers for compliance reasons that have nothing to do with model quality.

ClawHQ addresses this through what the design calls "sovereign mode" — a configuration that swaps cloud-dependent services for self-hosted alternatives across the board. Not just inference: Tavily search becomes SearXNG. OpenAI's Whisper API becomes local Whisper.cpp. Cloud note storage becomes Obsidian. Cloud TTS becomes Piper. It's a comprehensive swap from cloud dependencies to local alternatives.

This isn't paranoia architecture. It's acknowledging that infrastructure decisions are political decisions, and a platform that forces a specific provider set is making political choices on behalf of its operators. The provider-agnostic design — where profiles own tool categories, not specific providers — means the same agent behavior works whether you're all-in on one cloud provider or running everything locally.

The same principle applies to email. OpenClaw's email integration works identically whether the backend is Gmail or ProtonMail. The inbox abstraction doesn't care about the provider. An operator who migrates from Gmail to ProtonMail for privacy reasons doesn't need to reconfigure their agent's email skills. The skill definitions reference "email inbox," not "Gmail API."

This is the difference between provider-agnostic design and provider-tolerant design. Provider-tolerant means you support multiple providers but your abstractions leak. Provider-agnostic means the provider is a configuration detail that doesn't surface in the operational layer.

---

## What It Actually Costs

Let me put real numbers on the local-versus-API decision.

**Local inference (my setup):** Hardware cost is a one-time capital expense — a capable GPU setup runs a few thousand dollars depending on your requirements. After that, the marginal cost per inference is effectively zero — electricity for the GPU under load, which is negligible at the scale of text generation. Hundreds of calls per day, thousands per week, no invoice.

**API inference (hypothetical equivalent):** Assume 200 calls per day averaging 2,000 tokens input and 500 tokens output per call. At $10/MTok input and $30/MTok output for a frontier model, that's roughly $4/day input + $3/day output = $7/day. $210/month. $2,520/year. For one agent. If you're running multiple agents or higher call volumes, multiply accordingly.

The API cost isn't prohibitive for a single user with moderate usage. It becomes prohibitive at cadence. An agent that checks in every 10 minutes, processes email every 15 minutes, and runs scheduled tasks throughout the day generates enough call volume that API costs compound meaningfully. Local inference converts that compounding variable cost into an amortized fixed cost.

The break-even point depends on your hardware and your usage pattern, but for any agent running continuous scheduled tasks, local inference pays for itself within months, not years.

---

## The Decision Framework

After running this stack in production, here's how I'd advise someone making the same choice:

**Default to local for scheduled operations.** Anything that runs on a timer — heartbeats, email checks, calendar syncs, routine task processing — should hit a local model. The volume is too high and the task complexity is too low to justify API costs.

**Use APIs for on-demand complex tasks.** Research synthesis, nuanced communication drafting, multi-step reasoning — these are lower-volume, higher-stakes tasks where frontier model capability justifies the per-call cost.

**Build the fallback chain even if you don't need it yet.** I haven't, and I know I should. The architecture to route between local and cloud based on task complexity or response quality is worth the implementation cost before you need it. Retrofitting graceful degradation during an incident is no fun.

**Make the provider choice reversible.** Don't build your agent's operational logic around a specific provider's API. Abstract at the capability level. When your preferred provider changes pricing, or has an extended outage, or does something that changes your trust relationship, switching should be a configuration change, not a rewrite.

**Acknowledge the political dimension.** If you're building for others, your provider choices are their provider constraints. Design for swappability. If you're building for yourself, make the choice deliberately and revisit it when circumstances change.

Model selection for a production agent isn't a benchmark exercise. It's infrastructure architecture. The right model is the one that balances cost, privacy, latency, reliability, and capability for a specific task at a specific cadence. For Clawdius, that's Gemma 4 locally for everything, with a known gap in fallback coverage that I'll close when the failure rate justifies the complexity. Your answer will be different. The framework for arriving at it shouldn't be.

---

*Next: [Bootstrapping Without Bootstrapping](/series/ops-layer-09) — the cold-start problem: getting an agent operational when it has no context, no memory, and no history to reason over.*
