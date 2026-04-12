---
title: "The Human-Agent Interface"
number: 13
publishedDate: 2026-04-12
description: "Separation of concerns: human tools, agent workspace files, and a thin sync layer between them."
tags: [interface, design, todoist, architecture]
status: review
---

The hardest design problem in agent operations isn't security or observability or tool management. It's the interface between the human and the agent. Not the UI — the conceptual interface. Where does the human's world end and the agent's world begin? What does the human see? What does the agent manage privately? How do they stay in sync without stepping on each other?

Get this wrong and you have two options, both terrible. Either the human is constantly checking the agent's internal state — reading workspace files, auditing tool logs, micromanaging every action — which defeats the purpose of having an agent. Or the human trusts the agent completely and stops checking, which works until the agent does something wrong and the human has no idea what happened or why.

The answer is a clean separation of concerns with a thin sync layer in the middle. The human operates in their own tools. The agent operates in its own workspace. A minimal set of shared systems keeps them aligned. Neither side needs to understand the other's internals.

Here's how this works in practice with Clawdius, my production agent.

---

## The Human's World

These are the tools I use directly, as a human, regardless of whether the agent exists:

**Todoist** — my task manager. I create tasks, organize them into projects, set priorities and due dates, and mark them complete. This is the system I open every morning to understand what needs to happen today.

**Email** — I read my inbox directly. The agent triages it, but I still read the important messages myself. Email is a shared space — both the human and the agent interact with it, but through different interfaces (I use a mail client, the agent uses himalaya).

**Calendar** — I check my calendar in the native app. The agent reads it too (via CalDAV) to avoid scheduling conflicts and include upcoming events in morning briefs.

These three tools are the human-facing truth. If I want to know the state of my world, I look at Todoist, my inbox, and my calendar. I don't look at the agent's workspace files. I don't read HEARTBEAT.md or MEMORY.md. Those are the agent's concern, not mine.

---

## The Agent's World

These are the files and systems the agent manages privately:

**HEARTBEAT.md** — the agent's operational status file. Last run time, current task, health status, any errors or warnings. This is the equivalent of a process's `/proc/self/status` — internal state that the agent maintains for its own operational continuity.

**MEMORY.md** — the agent's persistent memory. Facts it's learned, preferences it's observed, context it wants to retain across sessions. When the agent restarts, MEMORY.md is how it knows what happened before.

**TOOLS.md** — the agent's tool inventory. Which tools are available, how to use them, what credentials they need. This is the reference document the agent consults when deciding how to accomplish a task.

**AGENTS.md** — configuration for multi-agent scenarios. Which other agents exist, what they can do, how to delegate to them.

**SOUL.md** — the agent's identity and persona definition. Voice, tone, behavioral constraints, ethical guardrails.

The human never touches these files. I don't edit Clawdius's MEMORY.md. I don't update his HEARTBEAT.md. I don't modify his SOUL.md after initial setup. These files belong to the agent the same way my notes app belongs to me — it's private workspace that serves the owner's operational needs.

This separation is intentional and load-bearing. If the human is editing the agent's memory file, you don't have an agent — you have a chatbot with a manual knowledge base. If the agent is editing the human's task list without permission, you don't have an assistant — you have a rogue process.

---

## The Thin Sync Layer

Between the human's world and the agent's world sits a thin layer of CLI tools that translate between them. Each tool produces structured JSON output — no free-form text, no ambiguous formatting, no parsing guesswork.

**`email`** — wraps himalaya. Read, search, compose, reply, forward. The agent calls `email list --unread --json` and gets a structured array of message objects. No screen-scraping, no HTML parsing, no natural language interpretation of inbox contents.

**`ical`** — wraps CalDAV operations. `ical today --json` returns today's events as structured objects with start time, end time, title, location, and attendees. The agent doesn't need to understand my calendar app's UI — it gets the same data through a clean API.

**`todoist`** — wraps the Todoist API. `todoist list --json` returns tasks. `todoist add --title "Review Q2 report" --due tomorrow --priority 2` creates a task. The agent interacts with the same Todoist that I interact with, but through a programmatic interface rather than a visual one.

**`tasks`** — the agent's private work queue. This is not Todoist. This is a local task list that only the agent uses. `tasks add "Check email at 2pm"`, `tasks list`, `tasks next`, `tasks done`. When the agent needs to remember to do something later, it adds it to its own task list — not to Todoist.

The distinction between `todoist` and `tasks` is the most important architectural decision in the human-agent interface. Todoist is shared truth — both the human and the agent can see it, and tasks in Todoist represent commitments that the human cares about. The `tasks` tool is private truth — only the agent sees it, and tasks in the local queue represent operational steps that the human doesn't need to know about.

When I ask the agent to "research competitors and summarize findings," the agent might:
1. Add a task to its private `tasks` queue: "Search for competitor analysis"
2. Execute the research using the `tavily` tool
3. Synthesize the findings
4. Add a task to Todoist: "Review competitor summary from Clawdius" with the summary attached
5. Mark its private task as done

I see step 4 — a clear, actionable task in my task manager with the deliverable attached. I don't see steps 1-3. I don't need to. The agent's internal workflow is its own concern. The deliverable in my system is what matters.

---

## The Key Insight

From ClawHQ's PRODUCT.md: messaging channels, file storage, and voice I/O are "infrastructure layers, not profiles."

This captures something important about the human-agent interface. The interface isn't a product feature that you design once and ship. It's an infrastructure layer that adapts to the human's existing habits.

The human doesn't learn the agent's interface. The agent learns the human's.

If the human uses Todoist, the agent writes to Todoist. If the human uses Apple Reminders, the agent writes to Apple Reminders. If the human uses a paper notebook and takes photos of it — well, we're not there yet, but the principle holds. The agent's job is to put information where the human already looks, not to create a new place for the human to look.

This is why Clawdius sends notifications through Telegram. Not because Telegram is the best messaging platform, but because it's where I already am. The agent doesn't ask me to install a custom app, check a dashboard, or visit a web interface. It drops messages into the same notification stream I'm already monitoring.

The same principle applies to every output channel. Morning briefs arrive in my inbox because I check my inbox every morning. Task assignments appear in Todoist because I check Todoist every morning. Calendar events appear in my calendar because I check my calendar every morning. The agent is invisible — not because it's doing nothing, but because its outputs arrive through channels I'm already watching.

---

## Authorization Boundaries

The separation of concerns needs clear authorization rules. Who can do what to which system?

**Human to agent:** The human can give the agent instructions through any input channel (messaging, email, voice, direct prompt). The human can modify the agent's configuration through ClawHQ's management CLI. The human does not modify agent workspace files directly.

**Agent to human systems:** The agent can read from all shared systems (email, calendar, Todoist) without permission. The agent can write to shared systems only with authorization — either explicit (human approves the specific action) or delegated (human has pre-approved a category of actions). The authorization model is the high-stakes tool controls from [installment #10](/series/ops-layer-10).

**Agent to agent workspace:** The agent has full read-write access to its own workspace files. HEARTBEAT.md, MEMORY.md, and the local tasks queue are the agent's private domain.

**Human to agent workspace:** The human can read agent workspace files for debugging but should not write to them during normal operation. If you find yourself editing MEMORY.md to correct the agent's understanding, the right fix is to tell the agent the correct information through the normal input channel and let it update its own memory.

This last point is subtle but important. Agent workspace files are like database tables — you don't edit them directly in production. You modify them through the application layer (the agent itself) so that the application's state management logic stays consistent. If you edit MEMORY.md manually and the agent's memory management code doesn't know about the change, you've introduced a state inconsistency that will cause confusing behavior.

---

## Failure Modes

When the interface breaks down, it's usually in one of three ways:

**Over-sharing:** The agent puts too much information into human-facing systems. Every internal step becomes a Todoist task. Every intermediate finding becomes an email. The human is overwhelmed with operational noise and starts ignoring the agent's outputs entirely — which means they also miss the important ones.

The fix is aggressive filtering. The agent should only surface deliverables, decisions that need approval, and exceptions that need attention. Internal operational steps stay in the private task queue. Intermediate findings stay in workspace files. Only the final output reaches the human.

**Under-sharing:** The agent does things without telling the human. It sends emails, modifies calendar events, completes tasks — all without notification. The human discovers three days later that meetings were rescheduled or emails were sent that shouldn't have been.

The fix is the approval model. High-stakes actions require explicit approval. Delegated actions produce audit notifications (brief messages confirming what was done). Only low-stakes, read-only operations happen silently.

**Boundary violation:** The human starts treating agent workspace files as a shared system, or the agent starts treating human systems as private workspace. The human reads HEARTBEAT.md every morning to check agent health (this should be a notification, not a manual check). The agent creates Todoist tasks for its own operational tracking (this should use the private tasks queue).

The fix is discipline. Define the boundary, enforce it, and resist the temptation to blur it "just this once." Every boundary violation that becomes habitual degrades the interface from a clean separation into a tangled mess.

---

## The Design Principle

The human-agent interface should be invisible during normal operation. The human uses their own tools. The agent uses its own workspace. Deliverables, approvals, and exceptions flow through channels the human already monitors. The internal mechanics — workspace files, private task queues, tool execution, memory management — are the agent's concern.

Build the interface around the human's habits, not the agent's capabilities. Put information where the human already looks. Ask for approval through channels the human already monitors. And maintain the separation — because the moment the human needs to understand the agent's internal state to trust its outputs, the interface has failed.

---

*Next: [Agent Evolution Without Regression](/series/ops-layer-14) — version management, breaking changes, and why agent updates should be treated as deployments, not experiments.*
