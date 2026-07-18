---
title: "LLM at the Edges, Determinism in the Middle"
status: published
tags: [pattern, ai-agents, reliability, llm-ops]
description: "Confine model calls to the system's boundaries — extraction on the way in, prose on the way out — and keep everything between them deterministic code. Anything arithmetic is never the model's job."
publishedDate: 2026-07-18
---

## The problem

The default shape of an "AI-powered" system is a model in the middle: data flows in, the LLM reasons, actions flow out. It demos beautifully and operates terribly. Model-in-the-middle systems are non-reproducible (same input, different output), unauditable (the reasoning is a vibe), and quietly wrong in ways you discover weeks later — a mis-added number, a dropped list item, a confident hallucination in a field nobody eyeballs.

## The pattern

Invert it. The pipeline core is deterministic code — parsing, math, state transitions, rendering — and the LLM is confined to the two places it genuinely earns its keep:

1. **The input edge: extraction.** Turning unstructured sources (transcripts, newsletters, alert streams) into typed, schema-validated records. The model's output here is *data*, so it gets verified — see the trade-offs below.
2. **The output edge: prose.** Turning computed results into human-facing text — a briefing, a review, an alert message.

In [Sterling](/projects/sterling) this is a locked design decision: **at most one terminal LLM call per pipeline phase, and that call produces prose only.** Levels, position sizes, comparisons against a plan — anything arithmetic — is deterministic code. The model never does math, never merges state, never decides what's in the record of truth.

Two corollaries:

- **Typed state between stages.** Extraction produces schema-validated records (dataclasses, explicit enums, forbidden-field rules), not free text passed between prompts. Chained prompts are how errors compound invisibly.
- **The model renders projections; it doesn't own state.** A brief is a re-renderable view over computed data. Throwing a bad brief away costs nothing, because regenerating it is deterministic-in, prose-out.

## When to use it

- Batch and scheduled pipelines: reports, extractions, monitoring, reviews.
- Anywhere outputs feed decisions with real cost — the auditability is the point.
- Systems that must run unattended: determinism is what makes 3 a.m. failures diagnosable.

Interactive chat is the legitimate exception — conversation *is* the model in the middle. The pattern's claim is about pipelines, not dialogue.

## Trade-offs

- **More code, less magic.** You write parsers, schemas, and render functions the demo version skips. That's the cost of knowing why an output is what it is.
- **Extraction is still a model call** — so verify it. Sterling pairs a primary extractor with an independent verifier and diffs their structured outputs; disagreement flags for review, and a verifier can *flag* but never silently *drop*. Verified extraction is what makes it safe to put a model on the input edge at all.
- **Rigid phases fit some domains better than others.** Exploratory workflows chafe against one-call-per-phase. Apply it where the pipeline is a pipeline.

## Related patterns

- [Event Log as System of Record](/architecture/event-log-as-system-of-record) — the deterministic middle needs a durable spine to read and write.
- [The Advisory-Only Agent](/architecture/advisory-only-agents) — pairs naturally: inspectable reasoning, human-held triggers.
