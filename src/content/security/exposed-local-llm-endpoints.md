---
title: "Advisory: Your Local LLM Endpoint Is Probably Listening Too Widely"
description: "Self-hosted inference servers ship with no authentication and an easy path to binding on all interfaces. Thousands end up reachable from the internet or an untrusted LAN. Five minutes of checking closes it."
status: review
tags: [local-inference, ollama, sovereignty]
kind: advisory
stance: defense
publishedDate: 2026-07-18
---

## The exposure

Self-hosted inference servers — Ollama, llama.cpp's server, vLLM, LM Studio, text-generation-webui — have two properties that combine badly:

1. **No authentication by default.** The API is open; anyone who can reach the port can send prompts, list models, and on some servers pull or delete models. There is no token, no login, nothing.
2. **A one-line path to binding on all interfaces.** The default is usually localhost, but every "let me hit it from my other machine" tutorial tells you to set the host to `0.0.0.0`. That single change turns a private service into a LAN-wide — and, behind the wrong router or a cloud security group, internet-wide — open endpoint.

Internet scans consistently turn up thousands of unauthenticated inference servers listening publicly. The cost to the operator ranges from someone burning your GPU on their workload, to model theft or deletion, to using your box as a laundered LLM for abuse — all with no credential to steal because there was never a credential.

I've written about [the version of this that bit me](/blog): a drifted systemd override had quietly re-exposed an unauthenticated LLM endpoint to the public internet for an unknown period. Nothing was breached that I could find, but "that I could find" is the whole problem with an open, unlogged endpoint.

## Check your own in five minutes

1. **What is it bound to?** On the host running the model:
   `ss -tlnp | grep -E '11434|8080|1234|5000'` (Ollama, common server ports). An address of `127.0.0.1` is private; `0.0.0.0` or `::` or your LAN IP is listening beyond the box.
2. **Is it reachable from another machine?** From a *different* device on your network: `curl http://<host-ip>:11434/api/tags`. If you get JSON back, everything on that network segment can use your model.
3. **Is it reachable from outside?** Check your router/firewall for a forwarded rule to that port, and any cloud security group. Don't port-scan yourself from the internet blind — check the config that would allow it.
4. **Has it drifted?** The dangerous case isn't the setting you chose; it's the one that changed under you — a systemd drop-in, a Docker `--host` flag, a compose file edited months ago. Grep the actual running config, not your memory of it.

## Close it

- **Bind to localhost.** If only local processes need the model, `127.0.0.1` is the whole fix. For Ollama that's `OLLAMA_HOST=127.0.0.1:11434`; other servers have an equivalent host flag. This is the default posture I run and recommend.
- **If other machines genuinely need it, put a boundary in front.** A reverse proxy that adds authentication, or an SSH tunnel / WireGuard link, so the model is reachable *through* an authenticated path and not as an open port. Never expose the inference API directly.
- **Default-deny the firewall inbound**, and add a specific allow only for the specific source that needs it. "Allow the LAN" is not a scope; name the host.
- **Pin the config against drift.** Whatever sets the bind address — env file, systemd unit, compose file — should be version-controlled and the source of truth, so an unexpected change shows up as a diff. This is the [config-from-version-control](/architecture/credential-isolation-for-agents) discipline applied to one very common footgun.

## Why this is an advisory, not a technique

There's nothing clever here to attack — the "exploit" is `curl` against an open port. That's exactly why it's worth an advisory: the failure is entirely on the defender's side, the check takes five minutes, and the base rate of people who've never run it is high. If you operate a local model, run the check today.

## Related

- [Credential Isolation for AI Agents](/architecture/credential-isolation-for-agents) — the broader egress-and-boundary posture this is one instance of.
- [The Agent Workspace Is an Attack Surface](/security/agent-workspace-attack-surface) — the other end of the same box: what an attacker reaches once they're in.
