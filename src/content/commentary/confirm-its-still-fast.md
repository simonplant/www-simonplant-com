---
title: "Confirm It's Still Fast"
publishedDate: 2026-04-18
tags: [local-inference, ollama, performance, agent-ops, openclaw]
description: "A leftover extra_hosts entry in a generated docker-compose.yml silently routed every local-LLM request through the host gateway for an unknown period. Nothing alerted. A ~200 LOC regression harness is the only thing that would have told me — and the only thing that will tell you when yours breaks next."
status: published
tier: architecture
---

I had a DNS entry in my docker-compose.yml that was silently routing every local-LLM request through the host network stack instead of the container-to-container veth that was sitting right there, unused. I don't know what it cost me. I never measured.

The entry was `extra_hosts: ["ollama:host-gateway"]`. Leftover scaffolding from when Ollama lived on the host, before I moved it into a sidecar container on the same internal Docker network as my agent. `extra_hosts` shadows Docker's internal DNS — when OpenClaw resolved `ollama:11434`, Docker didn't return the sibling container's IP. It returned the host gateway. Traffic went out through the bridge, hit the host's loopback, got UFW-inspected, and eventually arrived back at Ollama, which was now in a container two unnecessary network hops away.

I don't know how long that ran. The agent was responsive. The container was healthy. The logs were quiet. `ollama:11434` resolved and responded. Nothing in the system was going to tell me traffic was taking the long way around.

I caught it because I'd started saving baselines. That's the entire point of this post.

## What was actually broken

The fix is to remove one line. Once Ollama moved into a container on `engine_clawhq_net`, the compose file should have let Docker's internal DNS resolve `ollama` directly to the sibling's IP. The leftover `extra_hosts` forced traffic back through the host gateway even though nothing on the host was listening anymore. The source fix lives in `src/build/docker/compose.ts` at commit `0aae280` — the generated compose now omits the scaffold when Ollama is a sibling container and only emits it when it genuinely needs host-gateway resolution.

Attributing the blast radius of the bug cleanly is hard in hindsight, because the same week I caught it I also bumped Ollama from 0.20.0 to 0.21.0, which has [its own flash-attention effect on gemma4](/commentary/the-fix-was-the-speedup). Two variables moved at once. The honest claim isn't "the DNS shadow halved my throughput." The honest claim is that I couldn't have told you how much it cost me, because I hadn't saved the number before the migration started.

That's the shape of every silent performance regression. By the time you go looking, you've lost the baseline.

## Why you can't feel it

Agent latency end-to-end includes Telegram's API, the WebSocket, the system-prompt fill, tool-call routing, generation, and network hops in between. If generation drops from 195 t/s to 130 t/s, the wall time on a 200-token reply shifts from about a second to about a second and a half. Over a conversation it reads as "maybe a bit slower today." You will not trust that feeling enough to act on it, and you will be right not to.

Prometheus, Grafana, Ollama's own `/api/ps` — none of them give you a comparable baseline against your specific model, your specific config, your specific hardware. They show you state. They don't show you deltas against what-it-was-last-week. Deltas are the only signal that matters when you're debugging *I changed something and I don't know if it regressed*.

## The harness

About 200 lines of Node, no dependencies. It hits Ollama's `/api/generate`, `/api/show`, and `/api/tags`. Lives at `~/bench/bench-regression.mjs` with a bash wrapper at `~/bench/bench`. Baseline persists as `~/bench/baseline.json` on the host via bind-mount; the harness itself runs inside the OpenClaw container because that's the only thing with a route to `ollama:11434`. One invocation takes about two minutes.

It measures four things.

**Single-stream generation at four context sizes.** Prompts of roughly 20, 200, 2K, and 8K tokens each asking for 128 generated tokens. Median of three runs. The first cut of this was embarrassing: I'd get `prompt_eval_duration` of zero on runs two and three, which made the prompt throughput read as 1.9 million tokens per second. Ollama's KV cache was matching on prefix and skipping re-evaluation — real behavior, wrong thing to benchmark. The fix is a seeded PRNG that fills each prompt with unique pseudo-random tokens every run. Every run is a guaranteed cache miss. The 1.9M number disappears; the real number (~9K prompt t/s) shows up. A benchmark that can be gamed by its own runtime is not a benchmark.

**Cold start.** Force eviction with `keep_alive: "0s"`, wait, then measure `load_duration` and wall time on the next request. This matters for sporadic-message agents — a Telegram bot that gets a question every forty minutes pays cold-load latency on every reply if `keep_alive` has expired. Ollama's default is five minutes, per request. If your reply pattern is bursty, raise it or pay the 2.2 seconds.

**Concurrency.** One, two, four, eight parallel streams. Tracks aggregate throughput and per-stream throughput. Not a stress test — a shape test. The shape tells you whether Ollama is dynamic-batching your parallel requests or serializing them. Spoiler: serializing.

**Environment snapshot.** Ollama version, model digest and quant, kernel, hostname. Written into the same JSON as the numbers. When a regression shows up, the diff isn't just *throughput dropped 12%* — it's *throughput dropped 12% and Ollama went from 0.21.0 to 0.22.0 and the model digest changed*. Numbers without the environment they were measured in are a worse regression report than no numbers at all: they tell you something changed and give you nothing to correlate against.

## Save, compare, threshold

The workflow is three commands.

```
$ bench save     # Record current numbers as baseline.json
$ bench run      # Run against the current stack, print results
$ bench compare  # Run, diff against baseline, ⚠ on anything >5% slower
```

The 5% threshold isn't arbitrary. Back-to-back runs of the same config show ±4% variance on throughput and ±1.5% on wall time. 5% sits just above the noise floor — tight enough to catch real regressions, loose enough not to cry wolf on a warm container versus a cold one.

That threshold is the whole tool. Without it you have numbers. With it you have a signal. The signal is what converts "I changed something" into "I changed something and here's what it did."

## What the numbers say

For gemma4:26b Q4_K_M on an RTX 5090, inside a sibling container on the same Docker network as the calling agent:

| Metric                                            | Value                 |
| ------------------------------------------------- | --------------------- |
| Generation t/s (20 / 200 / 2K / 8K prompt tokens) | 200 / 195 / 190 / 179 |
| Prompt eval t/s (short / medium / long)           | 6.2K / 8.8K / 9.0K    |
| Cold load                                         | 2,225 ms              |
| First-prompt wall (cold)                          | 2,381 ms              |
| Aggregate t/s (1 / 2 / 4 / 8 parallel)            | 122 / 144 / 155 / 162 |

Three things worth calling out.

Context size degrades generation about 11% from 20-token to 8K-token prompts. Softer than the worst-case synthetic benchmarks suggest. Gemma's attention holds up.

Cold start is 2.2 seconds. If your agent gets messages sporadically and your `keep_alive` has expired, that's what the first reply costs. Plan for it or raise the keep-alive.

Ollama serializes parallel requests on a single GPU. Per-stream throughput stays at 199±1 regardless of concurrency; aggregate climbs from 122 to 162 going from one to eight parallel streams. That's 1.3x aggregate from 8x parallelism. Ollama doesn't dynamic-batch across requests on a single GPU and there's no config that fixes it. If you're building a multi-user agent, that's an architectural constraint you design around, not a knob you tune.

What these numbers don't tell you: multi-turn tool-call stability (a single-turn probe passed 22/22, but gemma4 is flagged elsewhere as loop-prone under agentic use and single-turn doesn't disprove that), performance at contexts above 8K (the configured limit is 262K; I have no measurements beyond 8K), output quality of any kind, and how this compares against qwen2.5:32b or llama3.3:70b. The harness measures throughput. Throughput is necessary. Throughput is not sufficient.

## The honest part

I didn't notice the DNS shadow. The agent worked. The logs were quiet. I shipped a container move, felt good about the cleanup, and would have kept shipping changes on top of the misconfiguration if the first baseline I took hadn't contained a number I wanted to double-check later.

The harness exists because I am not a reliable detector of my own regressions. Neither are the logs. Neither is the feeling that it seems a bit slower today. Save a baseline before your next config change. Compare after. Keep the harness. The numbers are the only part of the stack that will tell you the truth when the rest of it is quietly lying by omission.

My Ollama-bench testing suite is available on Github: [GitHub - simonplant/ollama-bench](https://github.com/simonplant/ollama-bench)

Feedback and PRs welcome!

Best, Simon.
