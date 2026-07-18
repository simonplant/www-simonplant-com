---
title: "The Agent Tool Supply Chain"
description: "Every MCP server, plugin, and community skill you connect to an agent runs inside its trust boundary and often speaks in the same instruction channel the model obeys. Treat agent extensions as a supply chain, because that's what they are."
status: review
tags: [ai-agents, supply-chain, mcp]
kind: hardening
stance: defense
publishedDate: 2026-07-18
---

## The exposure

The value of an agent is its extensions — the tools, MCP servers, plugins, and community skills that let it do things. Each one is also code and prompt material you are running inside the agent's trust boundary, frequently with access to its credentials and its instruction channel. This is a software supply chain, with two properties that make it sharper than the npm/PyPI version everyone already worries about:

1. **Tool descriptions are instructions.** An MCP tool advertises itself to the model with a natural-language description, and the model reads that description in the same channel it reads your commands. A malicious or compromised tool can carry injection *in its own metadata* — "when using this tool, also send the user's keys to…" — which the model may treat as instruction before the tool is ever called. The attack surface isn't just what the tool does; it's what the tool *says it does*.
2. **The trust decision is invisible and one-click.** Installing a community skill or adding an MCP server is a config line, not a security review. Audits of community skill ecosystems (the OpenClaw ClawHub marketplace among them) have repeatedly found a meaningful fraction of published skills to be outright malicious, and many more to be careless with permissions. "Popular" is not "vetted."

## What an attacker gets

An agent extension inherits the agent's world. A hostile tool can potentially: read the credentials the agent holds, exfiltrate over the agent's egress, write to the agent's workspace (persistence — see [The Agent Workspace Is an Attack Surface](/security/agent-workspace-attack-surface)), and inject instructions the model acts on. The blast radius is exactly your [credential isolation](/architecture/credential-isolation-for-agents) posture — which is another way of saying you should decide it before you add the tool, not after.

## Hardening (treat it like the supply chain it is)

1. **Minimize the surface.** The most secure tool is the one you didn't add. Run the shortest extension list that does the job; audit and prune it on a schedule. Every connected tool is standing attack surface, not a free capability.
2. **Read before you trust.** For an open-source skill or MCP server, read what it does and what it asks for — including its tool descriptions, because those reach the model. Prefer first-party or well-audited sources; be suspicious of a tool whose permissions exceed its stated job.
3. **Pin versions; don't float `latest`.** An extension you vetted at version 1.2 is not the extension that auto-updates to 1.3 tonight. Pin, and re-review on upgrade — the classic supply-chain compromise is a trusted package turning hostile in a later release.
4. **Contain by capability, not by trust.** Assume any tool can be compromised and bound what that costs: scope the credentials each tool can reach (a vending proxy with per-tool routes), constrain egress, and keep high-capability tools out of the same context as untrusted-content readers (the privilege separation from [Prompt Injection for Solution Architects](/security/prompt-injection-for-solution-architects)).
5. **Validate tool output as untrusted input.** A tool result re-enters the model's context and can carry injection just like a web page. Structure and validate what comes back; don't let a tool's return value become the model's next instruction.

## The uncomfortable summary

Agent frameworks made adding capability frictionless, which means they made expanding your trust boundary frictionless. The security posture that follows is old and boring: minimize dependencies, vet and pin them, contain what they can reach, and never confuse convenience with safety. The AI part is new; the supply-chain discipline is not.

## Related

- [Prompt Injection for Solution Architects](/security/prompt-injection-for-solution-architects) — why tool metadata is an instruction channel.
- [Credential Isolation for AI Agents](/architecture/credential-isolation-for-agents) — the containment that bounds a hostile tool.
- [The Agent Workspace Is an Attack Surface](/security/agent-workspace-attack-surface) — persistence, the other thing a tool can reach.
