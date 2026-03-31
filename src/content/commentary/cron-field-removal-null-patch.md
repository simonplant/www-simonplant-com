---
title: "Cron Job Fields Aren't Removable With PATCH — And It'll Bite You"
description: "A subtle API bug in OpenClaw's cron scheduler: PATCH doesn't remove fields, it updates them. The workaround, and why idempotent job design matters."
publishedDate: 2026-03-14
tags: ["openclaw", "cron", "api", "debugging"]
tier: signal
status: review
---

**Tool:** ClawHQ  
**Queue entry:** up-011

---

You set a field on a cron job. Later you realize the field was wrong. You PATCH it to `null`. The job starts running. It fails immediately with an error that has nothing to do with what you actually changed.

The `null` patch didn't remove the field. It was silently ignored. The original value is still there.

## Why PATCH Doesn't Remove Fields

In most REST APIs — including the one backing OpenClaw's cron scheduler — a PATCH is a merge operation, not a replace. Sending `{"model": null}` doesn't set `model` to null. It typically means "no change to this field." The server ignores null values in the patch body and leaves the original in place.

This is correct behavior per RFC 7396 (JSON Merge Patch): null explicitly means "remove this key." But not every implementation follows the RFC literally. Many treat null as "I don't care about this field" and skip it.

The result: you think you've cleared a field. The job thinks nothing changed.

## The Specific Failure Mode

I added an explicit `model: claude-sonnet-4-6` to a cron job payload to fix a different issue. Later the error I'd been trying to fix had a different root cause, and the explicit model field was itself causing a new failure — `LiveSessionModelSwitchError` at 80ms on startup.

```
LiveSessionModelSwitchError: Cannot switch model: session initialized 
with claude-opus-4-6, job payload requests claude-sonnet-4-6
```

The fix was obvious: remove the `model` field. So I patched:

```bash
cron update <job-id> '{"payload": {"model": null}}'
```

Job ran. Same error. Model field was still `claude-sonnet-4-6`.

Tried three variations — explicit null, empty string, omitting the key entirely from the patch body. None of them worked. The field stuck.

## The Fix: Delete and Recreate

The only reliable way to remove a field from a cron job configuration is to delete the job and recreate it without the field.

```bash
# Get the current job config
cron list --id <job-id>

# Delete the job
cron remove <job-id>

# Recreate without the offending field
cron add '{
  "name": "meal-plan-propose",
  "schedule": { "kind": "cron", "expr": "0 18 * * 0", "tz": "America/Los_Angeles" },
  "payload": {
    "kind": "agentTurn",
    "message": "..."
    // model field intentionally omitted
  }
}'
```

The job gets a new ID. Update any references.

## Real Example

A `meal-plan-propose` cron had been failing for days with `LiveSessionModelSwitchError`. I'd added `model: claude-sonnet-4-6` to the payload weeks earlier as an attempted fix for a different problem. When that problem was later diagnosed differently, the model field became a liability.

Multiple PATCH attempts to remove it did nothing. Deleted and recreated the job without the field. Next run: clean startup, no error.

The job ran fine with the runtime default (`claude-opus-4-6`) that `model: null` was supposed to restore.

## Takeaway

When working with cron job configs: don't add fields you might want to remove later. PATCH removes very little; delete+recreate removes everything. Treat each cron job as largely immutable — if you need to change its structure, you're rewriting it.

A corollary: before adding a config field "just in case," ask whether you'll ever need to undo it programmatically. If yes, design around not needing it.

---

*ClawHQ is an open-source persistent AI operator framework built on Claude. [claw-hq.com →](https://claw-hq.com)*
