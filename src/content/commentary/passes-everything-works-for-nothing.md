---
title: "Passes Everything, Works for Nothing"
publishedDate: 2026-07-18
tags: [ai-development, code-quality, aishore, lessons-learned]
description: "An AI agent built me an iOS markdown editor with 100 features. It crashed every time I opened it. I deleted the repo and started over. Then I changed how my tooling works so it can't happen again."
status: published
tier: signal
---

I asked an AI coding agent to build a markdown editor. iOS, Swift, clean architecture. I wrote a detailed product spec — features, UI expectations, the works. The agent ran. What came back: a fully-featured application with live preview, syntax highlighting, multiple export formats, iCloud sync, customizable themes, keyboard shortcuts, document tabs, and dozens of features I hadn't asked for yet.

It crashed every time I opened it.

Not a subtle bug. Not a race condition under load. The app would not launch. I spent over a week — twenty-plus hours — trying to make it work. The code was clean. The tests passed. The architecture looked reasonable. The individual pieces were all there. They didn't compose into something that ran.

I deleted the entire repository.

## What I got wrong

I want to be honest about the failure here, because the easy version of this story blames the agent. The agent did what I asked. I asked wrong.

My spec was a feature list. "Build a markdown editor with live preview, syntax highlighting, export to PDF and HTML, iCloud sync, customizable themes." The agent read that and built features. It never built the thing the features attach to — a core application that opens a blank document, accepts keyboard input, and renders text. I never specified that because I assumed it was obvious. An editor that edits. But nothing is obvious to an agent. It optimized for what I measured, and I measured features.

Thirty years in this industry and I wrote a spec with no acceptance criteria for "the application starts." That's not an AI problem. That's a discipline problem. The agent held up a mirror and I didn't like what I saw: I was so focused on the destination that I skipped the foundation.

## The pattern is everywhere

The industry data is starting to confirm this isn't just me. AI now writes a large and fast-growing share of the code committed to GitHub — and study after study finds that code carries more defects per change, and costs more review time, than the human-written code it displaces. Teams merge more with AI assistance, and spend longer scrutinizing each merge.

Those numbers measure defects — bugs, vulnerabilities, style violations. The failure I'm describing doesn't show up in a PR review because it's not a defect in any individual file. It's the absence of a working system. You can review every file, approve every PR, merge clean code all day, and not have an application that launches. The tests pass because they test the code, not the product. The function works; the system doesn't.

And the volume keeps growing — including the secrets accidentally committed alongside it, a well-documented and worsening problem. The ratio of code-committed to code-that-runs is diverging in a way we've never seen. Repositories fill with architecturally plausible, well-structured, completely non-functional code. The signal-to-noise ratio degrades for everyone who searches public repos for working examples.

## What I changed

After the markdown editor, I rebuilt my development orchestration tool — AIShore — around a principle I should have started with: core before features.

Every backlog item got a track: `core` or `feature`. Before each sprint, AIShore ran a Core Gate — a shell command that verified the application boots and its primary path works. If the Core Gate failed, only `core` items were pickable. Feature work was hard-blocked until the foundation passed.

If a sprint broke the core, AIShore auto-generated a heal item — `track: core`, `priority: must` — and shoved it to the front of the queue. No feature work proceeded until the core was healthy again. The system enforced what my spec should have required from the start: the thing works before we decorate it.

The markdown editor I rebuilt from that lesson started as a walking skeleton — open a document, type, save it back — before a single extra feature landed. That's still how it's built: the core works before anything else gets stacked on top.

## The reflection

The uncomfortable truth: I've spent thirty years telling teams to establish baselines before building features. Define your SLOs. Measure your starting point. Evaluate changes against it. Then I handed a spec to an AI agent and forgot all of it because the agent made it feel like I could skip straight to the interesting parts.

The tool wasn't the problem. My assumptions were the problem. I assumed "build a markdown editor" implied "that opens and runs." I assumed tests meant the system worked. I assumed clean architecture meant a functional product. Every one of those assumptions was a shortcut I wouldn't have accepted from a junior engineer.

The learning I take from this: AI agents don't fail gracefully — they fail impressively. They produce work that looks complete. The hundred-feature app that crashes on launch is more dangerous than a half-finished app with a working core, because the first one looks like it's almost there and the second one is honest about where it stands.

Write the boot spec first. Establish the core. Gate everything else behind it. This is basic engineering discipline, and it's exactly what AI development workflows are designed to let you skip.

Don't skip it.
