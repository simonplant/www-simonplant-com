---
title: "Building an AI-Native Markdown Editor"
description: "What building easy-markdown taught me about designing for AI assistance from the start — not as a bolt-on feature."
publishedDate: 2026-03-08
tags: ["ios", "swift", "markdown", "ai-development"]
tier: deep-dive
status: review
---

There's a category error in how most developers think about AI-assisted development.

They reach for AI to autocomplete functions, explain error messages, or generate boilerplate. That's useful, but it's using a rocket engine to light a campfire.

I spent the last few months building [easy-markdown](https://github.com/simonplant/easy-markdown) — a professional markdown editor for iOS and macOS — almost entirely through AI-driven development sprints. Each sprint delivered a production-ready feature. The process was systematic enough that I could maintain it solo without losing coherence across dozens of commits.

Here's what I learned.

---

## Why Another Markdown Editor?

The obvious question first.

Markdown is the native language of AI. Claude, ChatGPT, Cursor, Perplexity — every major AI agent produces it. Developers write in it. Teams collaborate through it. For the vast majority of documents people create, markdown is all you need.

But current markdown editors are organized around vaults and ecosystems, not documents. Obsidian requires a vault. Bear uses proprietary storage. Notion can't go offline. None of them treat markdown as a first-class document format that belongs to you.

The bet with easy-markdown: open any `.md` file from anywhere your device can see it — iCloud Drive, Dropbox, a Git repo — edit it with on-device AI assistance, and render it beautifully. No vault. No lock-in. No sidecar files. The file is the truth.

That's a clean product thesis. It also meant making a series of hard technical choices that AI-driven development helped validate quickly.

---

## The Architecture Decision: Modular SPM from Day One

Before writing a single feature, I spent time with Claude laying out the module structure.

The insight here isn't "AI wrote my architecture" — it's that AI helped me think through dependency boundaries faster than I could have alone. The result was a fully modular Swift Package Manager workspace:

```
Sources/
├── EMCore/         Shared types, errors, typography, theme system
├── EMParser/       Markdown parser (wraps Apple's swift-markdown)
├── EMFormatter/    Auto-formatting rules engine
├── EMDoctor/       Document diagnostics (broken links, structure issues)
├── EMEditor/       TextKit 2 text view, rendering pipeline, AI action bar
├── EMFile/         File coordination, bookmarks, auto-save
├── EMAI/           AI provider protocol, local + cloud inference
├── EMSettings/     Settings model, UserDefaults persistence
└── EMApp/          SwiftUI app shell, navigation, dependency wiring
```

The key rule: **no circular dependencies, compiler-enforced**. EMApp depends on everything. EMCore depends on nothing. Everything else sits in between with explicit, intentional dependency relationships.

This paid dividends immediately. When building the AI action bar (a floating toolbar that appears on text selection), I needed it to live in EMEditor — which could depend on EMAI but not on EMApp. That constraint forced clean interfaces. The AI provider became a protocol, not a concrete type. Swapping local model for cloud inference later became trivial.

---

## The Sprint Method

Here's where the AI-accelerated development part gets concrete.

Every feature followed the same structure:

1. **Feature spec in ARCHITECTURE.md** — what the feature does, which module owns it, acceptance criteria, what doesn't change
2. **Sprint branch** — one branch per feature, always `FEAT-XXX`
3. **AI implements** — I describe the sprint spec; the agent writes the code, runs the build, fixes compile errors, runs tests
4. **Review and merge** — I review the diff, merge the branch, move on

The git log tells the story:

```
a185bef Add app target entry point and BUILDING.md for first device build
0eb847a merge: FEAT-055 sprint branch
ae2386b feat(FEAT-055): implement sprint item
23c4eaf feat(FEAT-055): implement AI Summarize with popover and insert/copy actions
da8418c merge: FEAT-054 sprint branch
...
596bed1 feat(FEAT-051): implement i18n text support (CJK, RTL, Emoji)
```

Fifty-five sprints. Each one a working feature, not a rough draft.

The discipline that made this work: **each sprint had exactly one thing to accomplish**. Not "improve the editor." Not "add AI features." Specific, bounded, testable. FEAT-052 was auto-align table columns on every keystroke. FEAT-054 was the floating AI action bar. FEAT-055 was AI Summarize with popover and insert/copy actions.

When the sprint spec is that precise, the AI has enough context to implement it correctly. When it's vague, you get vague results.

---

## The Hard Technical Parts

### TextKit 2

The core editing engine is built on TextKit 2 — Apple's modern text layout system. The target: <16ms keystroke-to-render latency on every device from iPhone SE (3rd gen) up.

This was genuinely hard. TextKit 2's `NSTextLayoutManager` API is newer and less documented than the TextKit 1 paths most tutorials cover. The AI was helpful for generating the right incantations for `NSTextContentStorage` and custom `NSTextLayoutFragment` subclasses (used for inline image rendering and code block backgrounds), but I had to do real benchmarking to validate the latency claims. AI writes the code; humans measure the perf.

### The AI Provider Protocol

The AI abstraction layer is designed with a specific philosophy: platform-first.

```swift
protocol AIProvider {
    func complete(prompt: String, context: DocumentContext) async throws -> AsyncStream<String>
    func summarize(selection: String) async throws -> String
    var isAvailable: Bool { get }
}
```

Three concrete implementations: `ApplePlatformAIProvider` (stub, for when Apple ships on-device APIs), `LocalModelProvider` (MLX Swift, for A16+/M1+ now), and `CloudAPIProvider` (for Pro subscribers).

The runtime picks in order: platform AI → local model → cloud. The user controls cloud opt-in. This means easy-markdown works fully offline, on-device, for every user who has capable hardware — no subscription required for core AI features.

### Auto-Formatting

FEAT-052 and FEAT-053 were some of the most satisfying sprints: auto-formatting for tables and headings.

The table formatter auto-aligns columns on every keystroke. Type in any cell, and the column widths adjust across the entire table in real time. This required threading carefully through TextKit 2's text mutation APIs without triggering infinite loops (formatting → text change → formatting → ...). The solution was a mutation guard and a formatting queue that debounces rapid-fire keystrokes.

The heading formatter handles whitespace normalization, blank line enforcement above headers, and consistent ATX-style heading syntax. Small details. The kind of polish that makes an editor feel professional.

---

## What AI-Accelerated Development Actually Means

Here's the honest version of this story.

AI didn't remove the need for engineering judgment. It removed the need for me to write boilerplate, look up API signatures, or generate test cases by hand. I still had to:

- Define the architecture before writing code
- Write the feature specs with real acceptance criteria
- Review every diff before merging
- Benchmark performance claims
- Debug the cases where AI got it subtly wrong (and it did, regularly)

What changed: **I could work at the speed of design decisions rather than the speed of typing**. A feature that would have taken me a day of focused implementation took a sprint. A sprint took an hour.

Over fifty-five sprints, that compounds.

---

## Where It's Going

easy-markdown is currently buildable from source on iOS 17+ and macOS 14+. The first device build requires Xcode — you create a thin app target, wire it to the EMApp library, and it compiles clean. Full BUILDING.md in the repo.

Next milestones:
- **First TestFlight build** — get it on real devices for daily use
- **Cloud AI relay** — a lightweight serverless function that proxies Claude/GPT-4 for Pro users
- **Git integration** — open repos directly, commit from the editor (EMGit module, Phase 2)

The repo is at [github.com/simonplant/easy-markdown](https://github.com/simonplant/easy-markdown). It's Apache 2.0. Build it, break it, tell me what you find.

---

*Simon Plant is a fractional CTO and AI-accelerated developer based in Santa Barbara, CA. He builds with Claude, ships with Xcode, and trades ES futures in between.*
