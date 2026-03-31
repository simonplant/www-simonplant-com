---
title: "On-Device AI for iOS: Benchmarks, Trade-offs, Reality"
description: "Honest benchmark data on running AI models on-device in iOS — latency, quality, battery impact, and when it's actually worth it vs. a cloud call."
publishedDate: 2026-03-09
tags: ["ios", "on-device-ai", "swift", "benchmarks"]
tier: deep-dive
status: review
---

When I started building [easy-markdown](https://github.com/simonplant/easy-markdown), the AI architecture decision looked deceptively simple: on-device or cloud?

After six months of building the `EMAI/` module — the AI provider protocol layer at the heart of easy-markdown — I have a cleaner answer. But it comes with caveats that most benchmark posts don't tell you.

Here's what I actually found.

---

## The Two Worlds

There are two meaningfully different ways to run AI inference in an iOS app right now.

**Apple's Foundation Models framework** — announced at WWDC 2024, opened to developers at WWDC 2025 — gives you direct access to the same ~3B parameter model running Apple Intelligence. It runs entirely on-device, requires no API key, and works offline. On iPhone 15 Pro it hits roughly 0.6ms time-to-first-token per prompt token and generates at about 30 tokens per second.

**MLX via third-party models** (Qwen, Llama, LFM2.5, Gemma, etc.) gives you freedom to choose your model but requires you to handle everything — model download, memory management, loading, and inference. On newer hardware the numbers get genuinely impressive: a 4-bit quantized LFM2.5 1.2B model hits around 60 tokens/sec on an iPhone 17 Pro, and 124 tokens/sec on an iPad Pro M5.

The framing most posts miss: **these aren't competing options. They solve different problems.**

---

## What Apple's On-Device Model Is Actually For

The Foundation Models framework is not a chatbot. Apple's documentation is explicit about this, and the model's behavior confirms it. It doesn't know world knowledge. It isn't designed for complex reasoning. It's a task model: summarize this, extract entities from this, rewrite this, classify this.

That turns out to be exactly what you need for most in-app AI features.

For easy-markdown, the features I care about most are:

- **Improve selection** — rewrite a passage for clarity or tone
- **Summarize document** — generate a TL;DR for long files
- **Document Doctor** — flag broken links, structural issues, formatting inconsistencies
- **Auto-format** — apply consistent markdown conventions throughout a document

All of these are task-shaped. They take structured input and return structured output. The Foundation Models framework handles them cleanly, with zero API cost, zero latency to first byte for prefill, and zero network dependency.

The 30 tokens/sec generation rate on iPhone 15 Pro sounds modest until you remember what it means experientially: for a 200-word "improve this selection" response (roughly 250 tokens), you're looking at about 8 seconds of generation. That's acceptable for a background rewrite. It's too slow for anything that feels conversational or immediate.

**The honest assessment:** Apple's on-device model is fast enough for batch-style AI tasks. It's not fast enough for anything that needs to feel like a conversation.

---

## Real Benchmark Numbers

For more demanding workloads — or when you want to give users a choice of model — MLX with community models is the alternative. Here's what the numbers actually look like on current hardware (iPhone 17 Pro / iPad Pro M5, both with 12GB RAM, 4-bit quantized models, medium-length prompts):

| Model | iPhone TPS | iPad TPS | Model Size |
|-------|-----------|---------|-----------|
| LFM2.5 1.2B (4-bit) | 60 | 124 | 663 MB |
| Llama 3.2 1B (4-bit) | 58 | 118 | 713 MB |
| Qwen3 0.6B (4-bit) | 62 | 86 | 351 MB |
| Qwen3 1.7B (4-bit) | 40 | 62 | 984 MB |
| Gemma 3 1B (QAT) | 37 | 53 | 772 MB |

*Source: Ricky Takkar's Russet benchmark harness, February 2026. Fixed output length, deterministic decoding, 10 measured runs per configuration.*

A few things jump out.

**LFM2.5 1.2B is the anomaly.** It's faster than Qwen3 0.6B despite being twice the size. Its architecture appears unusually well-optimized for the MLX runtime — on iPad Pro M5 it maintains 122-124 tokens/sec across short, medium, and long prompts with almost no context-length degradation.

**iPad Pro M5 is 1.2x–2.2x faster than iPhone 17 Pro.** This gap is memory-bandwidth-driven and widens with context length. For long prompts, the iPad has enough bandwidth that KV-cache pressure barely registers. iPhone degrades significantly as context grows. If you're building a feature that works with long documents, you need to design for iPhone's degradation curve — aggressive context management isn't optional.

**4-bit is the right default.** The 6-bit variant of LFM2.5 is 21–27% slower at decode speed with nearly identical time-to-first-token. Unless you've measured a quality difference that matters for your use case, 4-bit wins on both performance and storage.

**Gemma 3 1B's TTFT is the outlier problem.** It scales poorly with input length — TTFT jumps from ~407ms at 47 tokens to over 1,300ms at 690 tokens. For a text editor working with long documents, this makes Gemma a poor fit despite its reasonable TPS for short prompts.

---

## The Three Real Trade-offs

Once you get past the raw numbers, the decisions become architectural.

### 1. Capability ceiling

Apple's ~3B on-device model is genuinely impressive for its size. Apple's benchmarks (human evaluations, not just academic datasets) show it outperforming larger models like Phi-3-mini, Mistral-7B, and Llama-3-8B on practical task quality.

But it's still a 3B model. Tasks that require nuanced instruction following, long-form generation, or complex reasoning hit the ceiling. For easy-markdown's "Document Doctor" feature — which analyzes document structure and generates specific improvement suggestions — I found the Apple model sufficient for short documents but inconsistent on long or complex ones.

The practical answer for production: **use the Foundation Models framework as your fast, free, always-available baseline**. Route heavier tasks — or tasks where users have opted into a better model — through a cloud provider. The `EMAI/` protocol layer in easy-markdown handles this as a pluggable abstraction, so the rest of the app doesn't know or care which backend is executing.

### 2. Memory pressure is real

On iPhone, your app budget for on-device model memory is roughly 50–67% of total device RAM before jetsam (the OS memory killer) starts terminating your app. On a 6GB iPhone 15 Pro, that's 3-4GB total including your app's working set.

A 663MB 4-bit LFM2.5 model leaves plenty of headroom on modern devices. A 3.7B model at 4-bit (~2.1GB) gets tighter. If your app also holds significant document state or uses TextKit 2's rendering pipeline aggressively, you need to budget carefully.

Apple's Foundation Models framework has a significant advantage here: the model is already loaded by the OS as part of Apple Intelligence. Your app doesn't pay the memory cost. For most apps, this is the strongest practical argument for the Foundation Models framework over self-loaded MLX models.

### 3. Offline and privacy

This is the value proposition that actually moves users.

"Your AI runs on your device. Nothing leaves your phone." is a genuinely differentiating feature for a markdown editor that might contain sensitive notes, private writing, or confidential documents. Every API call to a cloud AI provider is a data transfer that users increasingly don't want.

Apple's Foundation Models framework delivers this by design. MLX models deliver it too, but at the cost of model management complexity and storage.

The point of the `EMAI/` provider protocol is to let users choose. Some users will prefer the best available response and not care about cloud APIs. Others will toggle to on-device and accept lower quality for the privacy guarantee. Building the choice in at the architecture layer — rather than bolting it on later — is the right call.

---

## What 2025 Changed

When I started building easy-markdown in late 2024, on-device AI for iOS was theoretically possible but practically painful. Core ML required significant conversion tooling. Model quality was unimpressive at the sizes that fit in phone memory.

WWDC 2025 changed two things:

**The Foundation Models framework** turned on-device AI from a research project into a production API. Writing a summarizer in Swift now looks like this:

```swift
let session = LanguageModelSession()
let summary = try await session.respond(to: "Summarize: \(document.text)")
```

That's it. The model, the quantization, the hardware scheduling — Apple handles all of it.

**Apple Silicon performance** crossed a threshold where consumer hardware can run useful language models at usable speeds. 30 tokens/sec on iPhone 15 Pro, 60 tokens/sec on iPhone 17 Pro, 124 tokens/sec on iPad Pro M5 — these are numbers that enable real product features, not demos.

The 3B model size ceiling will stay. On-device inference on a phone will always be weaker than a frontier model in a data center. But for the specific shape of tasks an AI-native productivity app needs to do, the current on-device capabilities are sufficient — and the tradeoffs (privacy, cost, latency, offline) are legitimately compelling.

---

## The Bottom Line for iOS Developers

If you're building an AI feature in an iOS app and you haven't looked at the Foundation Models framework, start there. It's free, fast enough for task-shaped AI (rewrites, summaries, extraction, classification), privacy-preserving by default, and requires zero infrastructure.

For more demanding use cases, 4-bit MLX models (LFM2.5 1.2B or Llama 3.2 1B) running on-device are viable on modern hardware. Design around iPhone's context-length degradation curve. Budget memory carefully. Don't use Gemma with long inputs.

For anything requiring frontier-model quality — complex reasoning, knowledge retrieval, long-form generation — you still need cloud. Build your AI provider layer as a protocol so you can route different task types to different backends.

The on-device story for iOS is real. It just isn't the whole story.

---

*easy-markdown is an iOS markdown editor built around file-native storage, TextKit 2 rendering, and on-device AI assistance. Source: [github.com/simonplant/easy-markdown](https://github.com/simonplant/easy-markdown)*
