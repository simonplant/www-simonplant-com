---
title: "I Built 28 iOS Features in a Day — My AI Development Method"
description: "How I shipped 28 production-ready iOS features in a single day using an AI-augmented development process. Not prototypes — working code."
publishedDate: 2026-03-10
tags: ["ai-development", "ios", "swift", "methodology"]
tier: deep-dive
status: review
---

Last month I built 28 production-ready features for an iOS app in a single day.

Not prototypes. Not rough drafts. Not "it compiles if you squint at it." Working features with tests, documentation, and clean git history. A TextKit 2 editor with live markdown rendering. Auto-formatting that re-aligns table columns on every keystroke. An AI action bar that appears on text selection and streams responses inline.

I want to explain how — not to brag, but because the method is repeatable and I keep explaining it one-on-one when people ask.

---

## The Setup

The project is [easy-markdown](https://github.com/simonplant/easy-markdown) — a professional markdown editor for iOS and macOS. Open any `.md` file from anywhere: iCloud Drive, Dropbox, a Git repo. No vault, no lock-in. Edit with on-device AI assistance. The file is the truth.

I started with an architecture session and a clean module structure. Nine Swift Package Manager modules with explicit, compiler-enforced dependency rules. No circular dependencies. Every module with a single responsibility.

That groundwork took about four hours. Everything after that was sprints.

---

## What a Sprint Actually Is

A sprint has four components. All four are required. Skip one and the whole method breaks down.

**1. A spec, not a request**

Every sprint starts with a one-paragraph spec that goes into `ARCHITECTURE.md`. Not "add AI features" — that's a request. A spec looks like this:

> *FEAT-054: Floating AI action bar. Appears when user selects ≥10 characters of text. Shows 4 actions: Summarize, Improve, Fix Grammar, Continue. Actions stream response into a popover attached to the selection rect. Popover has Insert and Copy buttons. Lives in EMEditor module. Uses AIProvider protocol — no direct API calls. Dismisses on tap outside or Escape.*

Specific. Bounded. Testable. When a spec is that precise, the AI has enough context to implement it correctly. When it's vague, you get vague results.

**2. One branch per sprint**

Every sprint gets its own branch: `FEAT-054`, `FEAT-055`, `FEAT-056`. No exceptions. This keeps the git history legible and makes it trivial to revert a feature that turned out wrong.

**3. The AI implements, you review**

I describe the sprint spec. The agent writes the code, runs the build, fixes compile errors, runs tests. I review the diff before merging. This is the step most people try to skip — "the AI seems confident, ship it" — and it's how you end up with a codebase nobody can debug.

On security-sensitive code (auth, input validation, file access), I read more slowly and think adversarially. On boilerplate and rendering logic, I'm looking for obvious errors and correctness against the spec. The review discipline is what separates this method from "AI vibe-coding."

**4. Merge clean, move on**

When the feature works and the review is done, merge to main. Update `ARCHITECTURE.md`. Move to the next sprint. Don't polish beyond the spec — polish is a different sprint.

---

## The Numbers

The git log for easy-markdown shows what this looks like in practice:

```
a185bef feat: Add app target entry point and BUILDING.md
0eb847a merge: FEAT-055 sprint branch
23c4eaf feat(FEAT-055): AI Summarize with popover and insert/copy actions
da8418c merge: FEAT-054 sprint branch
c19a832 feat(FEAT-054): Floating AI action bar with streaming response
1a4f7e9 merge: FEAT-053 sprint branch
f8c3e2b feat(FEAT-053): Heading formatter — whitespace normalization, blank line enforcement
7b29d01 merge: FEAT-052 sprint branch
a0f2e4d feat(FEAT-052): Auto-align table columns on every keystroke
...
```

Fifty-five sprints total. Some days I ran three or four. The day I hit 28, I started at 6am.

The sprint cycle — spec, branch, implement, review, merge — ran about 45 minutes per feature average, including the spec writing and review time. Some were 20 minutes. The TextKit 2 layout work took closer to two hours per sprint because Apple's documentation on `NSTextLayoutManager` is sparse and I had to benchmark against real devices.

But the boilerplate was instant. Scaffolding a new SPM module that would have taken me most of a morning took 15 minutes. When the architecture is clean and the spec is precise, the implementation follows naturally.

---

## What Made It Work

### The architecture is the leverage point

The sprint method requires a coherent architecture before the first sprint. If your modules have messy dependencies, every sprint creates conflict. If your interfaces aren't clean, the AI generates code that technically compiles but architecturally sprawls.

I spent four hours before the first sprint establishing dependency rules and documenting them. Those four hours paid back inside the first day.

### Context files are load-bearing

I maintain an `ARCHITECTURE.md` that describes the full module structure, key design decisions, and what's been built. Every sprint spec goes in there when it's done. The AI reads this at the start of every session.

This is the practical solution to the statelessness problem. The model doesn't remember yesterday's session. The context file does. A well-maintained `ARCHITECTURE.md` means the AI can write code in session 40 that's consistent with session 1, because the decisions are documented.

### The spec removes ambiguity before it costs you

The biggest time sink in AI-assisted development isn't the AI being wrong — it's the back-and-forth of clarifying a vague request until the AI understands what you actually want. A good spec eliminates that round trip.

Writing a spec takes 10 minutes. Clarifying a vague request across three exchanges takes 30. The math is clear.

### The single-thing rule

Every sprint accomplishes exactly one thing. Not "improve the editor." Not "add AI features." One specific, bounded feature.

When a sprint tries to do two things, you get two half-finished things that interact in unpredictable ways. When it does one thing, you get a working feature and a clean diff.

---

## What Doesn't Work

**Accepting code you can't read.** This compounds. By sprint 30, you're debugging behavior in code nobody understands — including the AI that generated it. Read the diff. Every diff.

**Skipping the spec.** "Add a floating toolbar" is not a spec. Write the spec first, even when it feels like overhead. It isn't.

**Running without a context file.** The AI has no persistent memory. If you don't give it the architectural context, it will hallucinate a context from the surrounding code — usually incorrectly on the parts that matter most.

**Building architecture inside sprints.** Architecture decisions are not sprint work. If you find yourself making fundamental module structure decisions during a feature sprint, stop. Make the architectural decision first, document it, then resume.

**Polishing in the same sprint.** Polish is a sprint. Bug fixes are a sprint. The feature sprint is over when the feature works per the spec. Finish it and move on.

---

## The Honest Accounting

28 features in a day sounds like magic. It isn't. Here's what AI actually did, and what I did.

**AI did:**
- Wrote all the boilerplate (module scaffolding, conformances, protocol implementations)
- Generated the TextKit 2 layout code from my architectural descriptions
- Implemented the auto-formatting logic against the spec
- Wrote the test suite for each sprint
- Fixed compile errors from API mismatches
- Generated documentation strings

**I did:**
- Designed the architecture and module structure
- Wrote every sprint spec
- Reviewed every diff before merge
- Benchmarked rendering performance against real devices
- Debugged the non-obvious issues (TextKit 2 mutation guard, threading in the formatter)
- Made every design decision that required business or product judgment

The AI removed the need for me to type boilerplate and look up API signatures. I still had to know what to build, why, and whether the result was correct.

That division of labor — AI handles the mechanical, humans handle the judgment — is the actual method. The 28 features are a consequence of executing it well, not a consequence of AI being magic.

---

## The Transferable Parts

You don't need to be building an iOS app. You don't need to be working in Swift. The method transfers.

**Sprint specs work in any language and any domain.** The precision requirement is the same whether you're writing Python microservices, React components, or Go CLI tools.

**Architectural documentation compounds regardless of stack.** A well-maintained context file improves every session, forever. This is the highest-leverage habit in AI-assisted development.

**The single-thing rule applies everywhere.** Scope creep is a sprint killer. One feature, complete, tested, merged — then the next one.

If you're currently doing AI-assisted development without sprint specs and a maintained context file, those two changes alone will improve your output quality dramatically within a week. I've watched it happen with developers I've coached.

---

## Getting Started

If you want to try this:

1. **Write a context file for your current project.** 15 minutes. What does it do, what are the major components, what decisions have been made. Put it somewhere you'll paste it at the start of sessions.

2. **Pick one feature you've been putting off.** Write a one-paragraph spec for it. Specific, bounded, testable. If you can't write the spec, you're not ready to build the feature — that's useful information.

3. **Create a branch. Run the sprint.** Review the diff. Merge if it's right. Stop if it isn't.

That's the whole thing. Run it five times and you'll have a feel for where the leverage is in your specific context.

The ceiling on AI-assisted development productivity is a lot higher than most developers are currently reaching. The gap between "ask ChatGPT questions when stuck" and "systematic sprint method with maintained context" is substantial. Worth exploring.

---

*Simon Plant is a fractional CTO and AI-accelerated developer. He built easy-markdown, runs an always-on AI operator called Clawdius, and helps technical teams ship faster using structured AI development methods. Based in Santa Barbara, CA.*

---

**Word count:** ~1,600 words  
**Tone:** Method post — direct, specific, practical. Shows how, not just that.  
**Audience:** Developers and founders who've tried AI tools but aren't getting dramatic velocity gains  
**CTA:** Implicit consulting angle — "developers I've coached" signals this is teachable/hireable
