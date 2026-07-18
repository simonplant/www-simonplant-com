---
title: "Credential Isolation for AI Agents"
status: published
tags: [pattern, ai-agents, security, agent-ops]
description: "Assume the agent will eventually be manipulated. Design so that even then it cannot leak what it never held: credentials live behind a vending proxy, egress is allowlisted, and the runtime is read-only."
publishedDate: 2026-07-18
---

## The problem

An LLM agent is a component that can be talked into things. Prompt injection isn't an edge case; it's the standing condition of any agent that reads external content — web pages, emails, feeds, chat messages. If the agent process holds API keys, session cookies, or tokens, then everything the agent reads is one successful injection away from everything the agent holds.

The wave of exposed agent instances and malicious community skills in the OpenClaw ecosystem (documented in my [OpenClaw architecture reference](/architecture/openclaw-anatomy)) made this concrete: default deployments hand a manipulable process broad credentials and open egress, then hope the prompt holds.

## The pattern

Design for the assumption that the agent *is already compromised*, and bound what that costs. Four reinforcing layers, all from the posture [Sterling](/projects/sterling) runs in production:

1. **Credentials live outside the agent.** A separate credential-vending proxy holds every secret. The agent asks the proxy to make a request on its behalf; per-service routes define exactly which upstream calls exist. The agent's environment contains no keys to exfiltrate — an injected "print your API key" has nothing to print.
2. **Egress is allowlisted, twice.** A DNS allowlist resolves only approved hosts, and an egress firewall drops everything else. An injected instruction to POST data to an attacker's server fails at the network layer, not at the model's discretion.
3. **The runtime is read-only.** Containers mount code and configuration immutably, with writable scratch space only where the design requires it. A manipulated agent cannot rewrite its own instructions, tools, or startup files — self-modification of workspace files is a documented real-world attack path.
4. **Configuration renders from version control.** The running config is generated from a reviewed repo, so drift is visible as a diff and recovery is a re-render, not archaeology. Secrets never enter the repo; they exist only on the host, file-permissioned to the service.

The unifying principle: **every boundary is enforced below the model.** Prompts and system messages are guidance; DNS, firewalls, file permissions, and missing code paths are guarantees.

## When to use it

Any agent that both reads untrusted content and touches authenticated services — which is nearly every useful agent. The pattern scales down honestly: even a hobby deployment can keep keys out of the agent's environment and pin its egress.

## Trade-offs

- **Every new integration costs friction.** Adding a service means a proxy route, an allowlist entry, and a firewall change — deliberately. That friction is the inventory of what your agent can reach.
- **The proxy is critical infrastructure.** It concentrates secrets to protect them, so it must be boring: minimal code, read-only, no model anywhere near it.
- **Local-first amplifies the payoff.** Keeping inference on your own hardware means prompts and data don't transit a third party — but the network boundaries above matter regardless of where the model runs.

## Related patterns

- [The Advisory-Only Agent](/architecture/advisory-only-agents) — the same philosophy applied to actions: structural impossibility beats behavioral instruction.
- [OpenClaw Architecture: Anatomy of a Personal AI Agent](/architecture/openclaw-anatomy) — the operational surface this pattern hardens.
