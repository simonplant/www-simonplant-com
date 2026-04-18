---
title: "Seven Bugs, Zero Model Problems"
publishedDate: 2026-04-15
tags: [agent-ops, debugging, local-inference, deployment, day-2-operations]
description: "After a ClawHQ rebuild, Clawdius was completely unresponsive. Seven distinct bugs. Every one was a platform failure — config drift, firewall chain reactions, GPU defaults that didn't match real workloads. The model was fine the whole time."
status: published
tier: signal
---

Clawdius went dead again. Not the upstream deadlock from [last week](/commentary/dont-blame-your-layers) — this time, after a full ClawHQ rebuild, the agent was completely unresponsive. Telegram commands went into the void. No errors, no crashes I could see. Just silence.

My first assumption: the model. Maybe Gemma 4 26B couldn't handle the workload. Maybe the quantization was wrong. Maybe local inference just wasn't ready for a real agent.

I was wrong seven times over.

## The kill chain

The first bug was a firewall chain reaction. ClawHQ's egress firewall creates an iptables chain that allowlists specific domains for outbound traffic. But ipset wasn't installed on the host, so domain-based rules couldn't be created. The allowlist.yaml used a legacy format the loader couldn't parse. And when the allowlist appeared empty, the firewall code created a DNS-only chain instead of skipping gracefully. Result: HTTPS blocked, 3,000+ packets dropped, every Telegram API call timing out.

Three independent failures producing one symptom. No single bug was the cause.

The second bug was config drift. The engine config — what the container actually reads — had `ollama/llama3:8b`, a model that wasn't even installed. The golden config had the correct `ollama/gemma4:26b`. The deploy flow never synced golden to engine. Silent divergence.

The third was GPU resource exhaustion. Simple "hello" prompts worked fine, which is why I initially cleared the model. But OpenClaw sends real prompts — 59 tool definitions, workspace identity files, full system prompt, thousands of tokens. With the default 512K context window, fp16 KV cache, and two parallel slots, the GPU ran out of memory and the llama runner terminated. The model was loading 2 of 31 layers to GPU with flash attention disabled.

The fourth was the read-only rootfs fighting the agent at every turn. OpenClaw writes exec-approval temp files, creates runtime directories, manages plugin state — all in its home directory. Each missing writable path was a new EROFS crash. I played whack-a-mole adding volume mounts for twenty minutes before stepping back and asking what I was actually doing.

The fifth: a device-pair plugin requiring WebSocket pairing for localhost connections, blocking sub-agent spawning inside the container. The sixth: `docker compose restart` instead of full down/up leaving zombie polling processes, causing 409 Conflict errors. The seventh: the allowlist format itself, which compounded the firewall issue.

Seven bugs. Every one a deployment gap — config drift, missing host dependencies, format mismatches, aggressive defaults, runtime assumptions. Zero model capability problems.

## What I should have had

Here's what's hard to admit: every one of these was preventable with a pre-flight check. Does the configured model exist in Ollama? Does the engine config match the golden config? Is ipset installed? Can the container reach the Telegram API? Does the agent have writable paths for runtime state?

These checks didn't exist because I hadn't needed them yet. The system had worked before, so I assumed the deployment path was sound. It wasn't — it was just untested. The ClawHQ rebuild was the first time the full deploy sequence ran from scratch, and it hit every gap simultaneously.

I spent the first hour chasing the model. Checking quantization settings, reading Ollama GitHub issues, wondering if 26B was too large for the workload. The model was fine the entire time. It ran perfectly once I tuned Ollama to 16K context, flash attention, q8_0 KV cache, and a single parallel slot — 31/31 GPU layers, 3.1 GiB KV cache, 10 GiB VRAM headroom.

The instinct to blame the model is strong because model capability is the most legible variable. You can benchmark it, compare it, swap it out. Platform failures are invisible until you specifically hunt them. The firewall doesn't announce it's dropping packets. The config doesn't warn you it drifted.

## The fix that matters

Every bug is now a code fix or a doctor check. `deploy.ts` syncs golden to engine before compose-up. `firewall.ts` checks ipset availability and skips gracefully when the allowlist is empty. `compose.ts` uses tmpfs for runtime state so read-only rootfs and writable agent coexist. Two new doctor checks — `ollama-model-available` and `config-sync` — catch the silent failures before they compound.

The next `clawhq up` handles all seven automatically. That's the actual output of a triage session: not just fixes, but checks that prevent the next operator from losing the same hour I did.

None of these were model problems. Gemma 4 26B runs fine once the platform stops sabotaging it.

Three days later I found a bigger version of the same class — [a drifted systemd override that had been exposing an unauthenticated LLM endpoint to the public internet for an unknown period](/commentary/the-fix-was-the-speedup). The platform kept being the problem.
