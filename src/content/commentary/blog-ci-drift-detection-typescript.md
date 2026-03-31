---
title: "The CI Check That Prevents Death-by-a-Thousand TypeScript Errors"
description: "A simple CI pattern that catches incremental TypeScript drift before it becomes a refactor event — and how AI agents make it worth running."
publishedDate: 2026-03-16
tags: ["typescript", "ci", "devops", "toolchain"]
tier: signal
status: review
---

**Tool:** aishore  
**Queue entry:** up-002

---

You've seen this before. You run `tsc` locally — clean. You open a PR and CI shows 47 errors. You stare at the diff trying to figure out when any of this happened.

It happened gradually. Over ten PRs, twenty commits, maybe sixty days. Nobody's PR caused it — they just added a few errors each time, and because the count never tripped an absolute threshold, CI kept passing.

This is TypeScript drift, and standard CI doesn't catch it.

## Why Standard CI Fails Here

Most teams configure TypeScript CI as a binary: either `tsc --noEmit` exits 0, or the build fails. That's fine when you start strict and stay strict. It breaks down the moment you're in a refactor, working with a legacy codebase, or moving fast through a prototype phase.

You end up in a gray zone: strict mode would fail the entire build, so you don't enable it. No enforcement means errors accumulate. By the time you try to clean it up, it's a 200-error slog with no clear owner.

The wrong fix is to add a lint step. The right fix is to measure *change*, not *state*.

## The Fix: Delta Drift Detection

Instead of checking whether your error count is zero, check whether it's *higher than main*.

Here's the pattern:

```yaml
# .github/workflows/ci.yml
- name: Check TypeScript drift
  run: |
    BASE_ERRORS=$(git stash && tsc --noEmit 2>&1 | grep -c "error TS" || true && git stash pop)
    HEAD_ERRORS=$(tsc --noEmit 2>&1 | grep -c "error TS" || true)
    echo "Main: $BASE_ERRORS errors | PR: $HEAD_ERRORS errors"
    if [ "$HEAD_ERRORS" -gt "$BASE_ERRORS" ]; then
      echo "❌ TypeScript drift: PR adds errors vs. main. Fix before merging."
      exit 1
    fi
    echo "✅ No TypeScript drift introduced."
```

This job:
- Passes if error count stays flat or decreases
- Fails if a PR *adds* errors — even one
- Ignores pre-existing errors (important during cleanup phases)
- Gives a clear number in the log so you know what you're dealing with

You can tighten this over time: once you get the count to zero, swap in the absolute check. Until then, drift detection stops the bleeding.

## Real Example

While working on [aishore](https://github.com/simonplant/aishore), a routine refactor PR hit CI and showed 42+ type errors. None of the errors were in the changed files — they'd accumulated silently across the previous dozen PRs, each one adding two or three.

The fix was PR #12: add a drift detection job that compares the error delta vs. main. From that point, any PR introducing new type errors fails CI immediately, with a message that tells you exactly how many errors you added.

The existing backlog can still be cleaned up systematically — but it can't get *worse*.

## Takeaway

Measure change, not state. An error count of 42 is a historical problem. An error count increasing from 42 to 45 on your PR is *your* problem — and now CI catches it.

If you're building with AI-accelerated sprints where code volume is high and review bandwidth is limited, drift detection is especially valuable. The model writes fast. The delta check ensures you don't let that speed become debt.

---

*aishore is an open-source AI orchestration layer for TypeScript/Node projects. [GitHub →](https://github.com/simonplant/aishore)*
