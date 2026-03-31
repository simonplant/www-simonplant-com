---
title: "Why Your Sprint AI Doesn't Learn From Its Own Mistakes"
description: "AI agents that run in isolated sessions don't accumulate institutional memory. The architectural fix — and why most teams skip it."
publishedDate: 2026-03-16
tags: ["ai-agents", "memory", "architecture", "methodology"]
tier: signal
status: review
---

**Tool:** aishore  
**Queue entry:** up-006

---

Your AI coding agent makes the same class of error on sprint 12 that it made on sprint 3. You've been debugging the same failure pattern for weeks and it keeps coming back.

It's not a model problem. It's a feedback problem. Your agent only sees what went wrong.

## Why One-Sided Signal Fails

Most AI coding tools — and most hand-rolled sprint systems — track failures. When a sprint fails, the failure gets logged, fed back to the grooming agent, and becomes "what to avoid." That's reasonable. But it's half the signal.

Grooming agents that only see failures have no model of what *success looks like*. They can avoid the patterns that caused recent crashes. They can't replicate the spec structures that produced clean, first-attempt passes.

The result: your agent is asymmetric. It knows the shape of failure with increasing precision. It has zero positive examples to anchor against.

So spec quality drifts toward "probably won't fail" rather than "structured to pass." It's playing defense, not offense.

## The Fix: Success Feedback Loop

The fix requires two things: tracking successes alongside failures, and feeding both to groom agents.

Here's the pattern, implemented in [aishore](https://github.com/simonplant/aishore):

```bash
# In run_sprint_loop — track successes alongside failures
session_successes=()
session_failures=()

_handle_sprint_success() {
  local item_id="$1" item_title="$2" attempts="$3"
  # ... sprint success handling ...
  
  # Record for groom feedback
  session_successes+=("${item_id}: ${item_title} (${attempts} attempt(s))")
}

# Before calling groom agents — build success feedback
groom_success_feedback=""
if [[ ${#session_successes[@]} -gt 0 ]]; then
  # Last 5 successes from this session
  local recent_count=${#session_successes[@]}
  local start_idx=$(( recent_count > 5 ? recent_count - 5 : 0 ))
  groom_success_feedback="Recent sprint successes (specs that worked):\n"
  for (( i = start_idx; i < recent_count; i++ )); do
    groom_success_feedback+="  - ${session_successes[$i]}\n"
  done
fi
```

Then pull historical examples from the sprint archive:

```bash
# Extract last 10 proven spec patterns from sprints.jsonl
if [[ -f "$SPRINTS_ARCHIVE" ]]; then
  groom_success_feedback+="Proven spec patterns (from archive):\n"
  tail -20 "$SPRINTS_ARCHIVE" | \
    python3 -c "
import sys, json
entries = [json.loads(l) for l in sys.stdin if l.strip()]
completed = [e for e in entries if e.get('status') == 'completed' and e.get('attempts', 0) <= 2]
for e in completed[-10:]:
    item = e.get('item', {})
    ac_count = len(item.get('acceptanceCriteria', []))
    print(f\"  - {item.get('id', '?')}: {item.get('title', '?')[:50]} ({e.get('attempts', 1)} attempt(s), {ac_count} ACs)\")
" 2>/dev/null
fi
```

Pass both `groom_success_feedback` and `groom_failure_feedback` to your tech-lead and product-owner groom agents. When the session is new and no successes exist yet, omit the section entirely.

## Real Example

While building aishore's FEAT-041, the trigger was a recurring pattern: groom agents kept producing specs with vague acceptance criteria that failed at the validator stage. The agent had strong failure signal — `session_failures` showed it exactly which AC patterns caused rejections. But there was no corresponding record of what *good* ACs looked like in practice.

After implementing session_successes, the groom agents started seeing a "Specs That Worked" section alongside the failure list. Specs produced in later auto sessions started converging on the AC patterns that had previously passed — concrete, verifiable, single-concern criteria. First-attempt pass rate improved noticeably on subsequent sessions.

The fix is small: about 30 lines of bash in the sprint loop, plus a few lines added to the groom agent prompt. The impact compounds because every session adds to the positive signal pool.

## One Implementation Note

When the session is early — sprint 1 or 2 of a new auto run — omit the success section entirely rather than showing an empty list. An empty "Specs That Worked" section is noise. A non-empty one is signal. The condition is straightforward:

```bash
if [[ -n "$groom_success_feedback" ]]; then
  groom_prompt+="$groom_success_feedback\n"
fi
```

Don't force positive examples where none exist yet. The historical archive examples fill the gap until session successes accumulate.

## Takeaway

An AI grooming agent without success signal is a one-sided optimizer. Feed it both failure patterns and proven spec structures — and it starts converging on what works rather than just avoiding what doesn't.

---

*aishore is an intent-driven AI sprint tool for solo developers. [Source on GitHub.](https://github.com/simonplant/aishore)*
