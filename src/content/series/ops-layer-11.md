---
title: "Agent Observability: What to Log and Why"
number: 11
publishedDate: 2026-04-12
description: "Decision logging, tool tracing, cost accounting, error classification. Actionable, not comprehensive."
tags: [observability, logging, operations, debugging]
status: review
---

In January 2026, OpenClaw shipped a feature called `ENABLE_AUDIT_STDOUT`. The name is self-explanatory: turn it on, and your agent's audit trail gets written to standard output where you can pipe it to whatever log aggregator you want. Straightforward. Useful. Exactly the kind of observability primitive that operators need.

It was broken from v0.8.6 through v0.8.8. Three releases. Roughly six weeks.

During that window, operators who had enabled audit logging believed their agents were being monitored. The config flag was set. The documentation said it worked. But the actual stdout pipeline was silently disconnected — no audit events were being generated. Not malformed events, not partial events. Zero events.

This is CVE-2026-25245. It's not a dramatic exploit. Nobody got hacked because of it. But it's the most operationally dangerous class of bug: a monitoring system that reports healthy while it's completely dead. Your agent is running, your dashboard shows green, and your audit trail is empty. You don't know what your agent did for six weeks, and you can't reconstruct it.

I found out about this the same way I find out about most OpenClaw issues — by auditing the upstream changelog against my deployment. ClawHQ's response was to build an independent audit trail that doesn't depend on upstream's implementation. If the framework's logging breaks, my logging keeps working.

That experience crystalized my thinking about agent observability. The goal isn't comprehensive logging. It's actionable logging — an audit trail that helps you at 2am when something is wrong, not one that satisfies a compliance checkbox while you're awake.

---

## The Four Dimensions

Agent observability breaks down into four dimensions. Each answers a different question, and each has different retention, format, and access requirements.

### 1. Decision Logging

**Question:** Why did the agent do what it did?

This is the dimension most people skip, and it's the most valuable. Tool execution logs tell you what happened. Decision logs tell you why.

A decision log entry captures:
- The user's request (or the cron trigger that initiated the action)
- The agent's reasoning about which tools to use
- Alternative approaches the agent considered and rejected
- Confidence indicators from the model
- The final action plan before execution

When your agent sends an email it shouldn't have, the tool execution log tells you "email.send was called at 14:32 with these parameters." The decision log tells you "the agent interpreted the user's request 'handle this' as an instruction to reply to the email with an acceptance, chose email.send over todoist.create because the request seemed time-sensitive, and did not flag it for approval because the delegation policy covers routine replies."

That second narrative is what you need to fix the problem. Maybe the delegation policy is too broad. Maybe the agent's interpretation of "handle this" needs guardrails. Maybe the request should have been flagged for approval because it involved a commitment. You can't diagnose any of this from a tool execution log.

ClawHQ captures decision logs as structured JSON with a reasoning chain — not the raw model output (which is enormous and mostly noise), but a compressed summary of the decision path that led to the action. Typical entry: 200-400 tokens. Retained for 30 days. Indexed by action type and tool name.

### 2. Tool Execution Tracing

**Question:** What happened when the tool ran?

This is the standard observability dimension — the one most logging systems cover. For each tool invocation:

- Tool name and version
- Input parameters (with sensitive fields redacted)
- Execution duration
- Response status (success, failure, timeout, rate-limited)
- Output summary (truncated to avoid log bloat)
- Upstream API response code and latency

The key design decision is granularity. Log too little and you can't debug. Log too much and your log volume becomes its own operational problem. ClawHQ logs every tool invocation at the summary level (tool, status, duration, response code) and logs full request/response bodies only for failed invocations. Success cases get a one-line summary. Failure cases get the full trace.

This asymmetric logging is critical for cost management. A healthy agent might invoke 200-500 tools per day. At summary level, that's a few kilobytes. At full-trace level, that's megabytes — especially for tools that return large payloads like web search results or email bodies. You don't need the full trace for successful operations. You need it for failures.

### 3. Cost Accounting

**Question:** How much is this costing, and where is the money going?

Agent operations have three cost dimensions: model tokens, API calls, and compute time. Most operators track none of them.

ClawHQ tracks token consumption per interaction, broken down by:
- Input tokens (the context sent to the model)
- Output tokens (the model's response)
- Tool description tokens (the tax from loaded tools)
- System prompt tokens (persona, instructions, constraints)

This breakdown matters because the optimization strategies are different. High input token costs mean your context window is bloated — prune tools, compress memory, shorten system prompts. High output token costs mean the model is being verbose — tighten response format constraints. High tool description costs mean you have too many tools loaded — review your mission profiles.

Cost accounting also tracks spend by time window (hourly, daily, weekly), by task type (email triage, research, calendar management), and by model. When you switch from one model to another, cost accounting tells you whether the new model is cheaper per task or just cheaper per token. A model that's 30% cheaper per token but 50% more verbose is actually more expensive.

### 4. Error Classification

**Question:** What went wrong, and whose fault is it?

Not all errors are the same. An agent error taxonomy needs at least four categories:

**Agent errors** — the agent made a bad decision. Wrong tool selected, wrong parameters passed, inappropriate action taken. These are reasoning failures. The fix is usually in the persona, the system prompt, or the delegation policy.

**Tool errors** — the tool failed. API timeout, rate limit exceeded, malformed response, credential expired. These are integration failures. The fix is in the tool configuration, the credential management, or the upstream service.

**Model errors** — the language model produced an invalid output. Malformed JSON, hallucinated tool name, refused a legitimate request, went off-topic. These are inference failures. The fix is usually in the model selection, the temperature setting, or the prompt engineering.

**User errors** — the user's request was ambiguous, contradictory, or impossible. The agent did its best with bad input. The fix is in the user interface — better clarification prompts, confirmation steps, or request validation.

Classifying errors correctly is the difference between fixing the right thing and chasing ghosts. If your agent sends a bad email and you blame the email tool, you'll spend hours debugging a working integration while the actual problem — an overly broad delegation policy — keeps causing failures.

ClawHQ auto-classifies errors using the decision log and tool execution trace. If the tool returned an error code, it's a tool error. If the tool succeeded but the agent's action was inappropriate, it's an agent error. If the model's output couldn't be parsed, it's a model error. Edge cases get flagged for human review.

---

## The Independent Audit Trail

After CVE-2026-25245, I built ClawHQ's audit trail as a completely independent system. It doesn't depend on OpenClaw's `ENABLE_AUDIT_STDOUT`. It doesn't hook into upstream's logging pipeline. It runs in `src/secure/audit/` and captures events at the ClawHQ layer — above the framework, below the user interface.

The audit trail is HMAC-chained. Each entry includes a hash of the previous entry, making the log tamper-evident. You can't delete or modify an entry without breaking the chain. This isn't paranoia — it's a basic integrity guarantee that lets you trust your logs during an incident investigation.

The chain uses HMAC-SHA256 with a key derived from the agent's identity. If someone gains access to your logs, they can read them but can't modify them without the key. If someone gains access to the key, they can forge entries but can't do it retroactively without re-hashing the entire chain (which changes the head hash that you're monitoring).

OWASP-compatible export normalizes the audit data into a standard format covering three event categories:

- **Tool execution events** — what tools were called, with what parameters, and what they returned
- **Data egress events** — what data left the agent's sandbox, through which channel, to which destination
- **Secret lifecycle events** — when credentials were loaded, rotated, expired, or revoked

This normalization matters for compliance. If you need to answer "what data did the agent send outside the organization in the last 30 days," the OWASP export gives you a structured, queryable answer.

---

## What You Need at 2am

The goal of agent observability isn't to log everything. It's to log what you need when something goes wrong at 2am and you're half-awake trying to figure out what your agent did.

At 2am, you need:

1. **Timeline** — what happened, in order, with timestamps. The HMAC-chained audit trail gives you this.
2. **Causation** — why the agent took the action it took. The decision log gives you this.
3. **Blast radius** — what was affected. The tool execution trace tells you which tools were called and what data moved.
4. **Root cause category** — agent, tool, model, or user error. The error classification tells you where to look.

You don't need raw model outputs. You don't need every successful tool invocation's full response body. You don't need token-level attention weights or embedding similarity scores. You need a narrative: what happened, why, what was affected, and whose fault it was.

Build your observability stack around that narrative. Log what serves the investigation. Retain it long enough to be useful (30 days for detailed logs, 90 days for summaries, indefinite for security events). Make it queryable. Make it tamper-evident. And for the love of operational sanity, test that your logging actually works — don't be the operator who discovers their audit trail was empty for six weeks.

---

*Next: [Sandbox Hardening for Agents That Touch Your Filesystem](/series/ops-layer-12) — three security postures, specific CVE mitigations, and zero-trust philosophy for agent sandboxing.*
