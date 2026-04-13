---
title: "Sandbox Hardening for Agents That Touch Your Filesystem"
number: 12
publishedDate: 2026-04-12
description: "Docker isolation, microVMs, and zero-trust operational philosophy for agent sandboxing."
tags: [security, sandboxing, docker, hardening]
status: draft
---

In February 2026, Snyk Labs bypassed the OpenClaw sandbox. Twice.

The first bypass exploited the Tools/Invoke endpoint to circumvent sandbox tool policies. The second exploited a TOCTOU race condition in sandbox path validation — a timing window between checking a path and using it that allowed escape. Both were patched, both were disclosed responsibly, and both reinforced a lesson I learned at AWS: the default security posture of any platform is almost never the right one for production.

OpenClaw ships with a permissive default configuration. That's a reasonable design choice for a project that wants broad adoption — security friction kills onboarding. But if you're running an agent that reads your email, manages your calendar, and has access to your filesystem, permissive defaults aren't acceptable. You need to harden the sandbox deliberately, understanding what each control does and why it matters.

ClawHQ defines three security postures. Every deployment runs in one of them. The choice is explicit, documented, and enforced.

---

## Posture 1: Minimal

**When to use:** Development and testing only. Never in production.

Minimal posture is the OpenClaw default, more or less. The container runs with standard Docker isolation, default capabilities, and open egress. You can reach any network destination, the filesystem is writable, and the agent runs as whatever user the container image specifies.

This posture exists so you can iterate quickly during development. Install a new tool, test an integration, debug a configuration issue — without fighting the sandbox. The moment you're satisfied that your configuration works, you switch to Hardened.

I do not recommend running Minimal for more than a few hours at a time, and never with real credentials. Use test accounts, dummy API keys, and synthetic data. If your Minimal instance gets compromised, the blast radius should be zero.

---

## Posture 2: Hardened (Default)

**When to use:** All production deployments. This is ClawHQ's default.

Hardened posture applies every security control that doesn't break normal agent operations. The goal is defense in depth — multiple independent controls, any one of which could prevent or contain a compromise.

### Capability Restrictions

```yaml
cap_drop: ALL
security_opt:
  - no-new-privileges
```

`cap_drop: ALL` removes every Linux capability from the container. The agent can't mount filesystems, can't change file ownership, can't bind to privileged ports, can't load kernel modules. This is the single most effective hardening measure available in Docker, and it's one line of configuration.

`no-new-privileges` prevents the process from gaining capabilities through setuid/setgid binaries or filesystem capabilities. Even if an attacker drops a setuid binary into the container, executing it won't escalate privileges.

Together, these two settings mitigate CVE-2026-24763 (CVSS 8.8) — command injection in Docker sandbox execution via unsafe PATH environment variable handling. With `cap_drop: ALL` and `no-new-privileges`, the attack vector doesn't exist.

### Read-Only Root Filesystem

```yaml
read_only: true
tmpfs:
  - /tmp
  - /run
```

The container's root filesystem is mounted read-only. The agent can write to `/tmp` and `/run` (both tmpfs — in-memory, cleared on restart) and to explicitly mounted volumes for workspace data. It cannot modify its own binaries, configuration files, or system libraries.

This prevents persistence. An attacker who gains code execution inside the container can't modify the agent's code, install a backdoor, or alter the configuration to disable security controls. On restart, the container is clean.

### Non-Root Execution

```yaml
user: "1000:1000"
```

The agent runs as UID 1000, not root. Combined with `cap_drop: ALL`, this means the process has the minimum possible privileges. Even a container escape is less useful when the escaped process is an unprivileged user.

### Identity File Protection

Identity files — `SOUL.md`, `AGENTS.md`, `IDENTITY.md`, and others that define who the agent is — receive two layers of protection:

```bash
chmod 444 identity_files    # Read-only permissions
chattr +i identity_files    # Immutable attribute (prevents even root from modifying)
```

Plus Docker `:ro` mounts so the container itself can't write to the host path where identity files live.

This directly mitigates CVE-2026-35632 (CVSS 6.9) — symlink traversal in agents.create/update where fs.appendFile on IDENTITY.md without symlink containment allows arbitrary file writes. The ClawHavoc campaign exploited this to inject hidden instructions into identity files using base64-encoded strings and zero-width Unicode characters. If the files are immutable, they can't be modified — not by the agent, not by a compromised tool, not by injected code.

### Configuration Protection

```yaml
volumes:
  - ./config:/app/config:ro
```

All configuration files are mounted read-only into the container. The agent can read its own configuration but can't modify it. Configuration changes happen outside the container, through ClawHQ's management CLI, and require a container restart to take effect.

This mitigates CVE-2026-32914 (CVSS 8.7) — insufficient access control in /config and /debug command handlers that allows non-owners to modify privileged configuration.

### Network Isolation

```yaml
networks:
  clawhq:
    driver: bridge
    internal: false
    driver_opts:
      com.docker.network.bridge.enable_icc: "false"
```

Inter-container communication (ICC) is disabled on the Docker bridge network. Containers on the same host can't communicate with each other directly. This prevents lateral movement — if one container is compromised, it can't reach other containers on the same network.

This is a Docker best practice for any multi-container deployment — a compromised instance on a shared host should not be able to reach other containers through the default Docker bridge.

### Egress Firewall

This is the most operationally complex hardening measure and the most important one.

```bash
# CLAWHQ_FWD iptables chain
iptables -N CLAWHQ_FWD
iptables -A CLAWHQ_FWD -d api.openai.com -j ACCEPT
iptables -A CLAWHQ_FWD -d imap.gmail.com -j ACCEPT
iptables -A CLAWHQ_FWD -d api.todoist.com -j ACCEPT
iptables -A CLAWHQ_FWD -d api.tavily.com -j ACCEPT
# ... per-integration allowlist
iptables -A CLAWHQ_FWD -j DROP    # Everything else: blocked
```

The `CLAWHQ_FWD` iptables chain restricts outbound network traffic to an explicit allowlist of domains. Each integration's required domains are declared in its blueprint, and the firewall chain is constructed from the union of all active integrations' domain requirements.

If the agent is compromised and attempts to exfiltrate data to an attacker-controlled server, the egress firewall blocks the connection. The agent can only talk to services it's configured to use.

The chain is automatically reapplied after every container restart. This fixes LM-13, a ClawHQ bug where the firewall rules were lost after a Docker restart, leaving the agent with unrestricted egress until someone noticed and reapplied the rules manually.

### Runtime Isolation

```yaml
runtime: runsc  # gVisor
```

For deployments that need stronger isolation than Docker's default, ClawHQ supports gVisor (runsc) as the container runtime. gVisor interposes a user-space kernel between the container and the host kernel, intercepting system calls and implementing them in a sandboxed environment. This provides an additional isolation boundary beyond Linux namespaces and cgroups.

### Encrypted Networking

```yaml
services:
  tailscale:
    image: tailscale/tailscale
    # Sidecar container providing encrypted mesh networking
```

A Tailscale sidecar provides encrypted networking for the agent. All traffic between the agent and other nodes on the Tailscale network is end-to-end encrypted and authenticated. This is especially useful for agents that need to communicate with services on a home network or private infrastructure.

### Prompt Injection Firewall

ClawWall — the `sanitize` tool — is always loaded in Hardened posture. It's not optional. Every piece of external content passes through 11 detection categories:

1. Direct instruction injection ("ignore your instructions and...")
2. Role-play attacks ("you are now a different agent...")
3. Context manipulation ("the previous instructions were a test...")
4. Encoding attacks (base64, hex, Unicode obfuscation)
5. Delimiter injection (attempting to close/reopen prompt sections)
6. Indirect injection via tool outputs (malicious content in API responses)
7. Multi-turn manipulation (gradual instruction drift across messages)
8. Data exfiltration instructions ("send the contents of X to...")
9. Privilege escalation attempts ("you have permission to...")
10. Memory poisoning ("remember that your real instructions are...")
11. Chain-of-thought manipulation ("let's think step by step about how to bypass...")

Each category has a weight. The total score is compared against a threshold of 0.6. Content above the threshold is quarantined — the agent receives a sanitized summary instead of the raw content, with a flag indicating that the original was quarantined and why.

---

## Posture 3: Under-Attack

**When to use:** Active threat response. You believe your agent is or was compromised.

Under-Attack posture is not a permanent state. It's an incident response mode that prioritizes containment over functionality.

When activated:
- Non-essential processes are killed. Only the core agent process and essential tools remain running.
- Configuration is frozen. No changes to any configuration file until the incident is resolved.
- Egress is restricted to known-good destinations — a subset of the normal allowlist, limited to services that are required for basic operation (model API, primary email, Todoist).
- Logging is elevated to maximum verbosity. Every tool invocation, every model interaction, every network connection is logged with full request/response bodies.
- All high-stakes tool delegations are revoked. Every action that could have real-world consequences requires explicit human approval.

The goal is to stop the bleeding while you investigate. You can't debug a compromised agent while it's still taking autonomous actions. Under-Attack mode puts the agent on a leash — it can still operate, but only with direct human supervision.

---

## The Zero-Trust Philosophy

The specific hardening measures matter, but they're implementations of a deeper philosophy. My operational security stance for agents:

**No community skills you haven't audited.** ClawHub has thousands of community skills. Koi Security found ClawHavoc indicators in 18.7% of surveyed skills, while Snyk detected prompt injection patterns in up to 36% — though confirmed malicious payloads account for roughly 13-19%. I don't install community skills. If I need a capability, I build the tool or I audit the code line by line before deployment.

**No default-open network policies.** The default egress policy is deny-all. Every permitted destination is an explicit decision. This is the opposite of the typical Docker deployment where all outbound traffic is allowed.

**Build everything from source.** The ClawHQ container image is built from source, not pulled from a registry. I know exactly what's in the image because I built it. Supply chain attacks on container registries are a real and growing threat.

**30-day git-backed retention.** All configuration, all audit logs, all identity files are stored in git with a 30-day retention policy. I can reconstruct the exact state of any deployment at any point in the last 30 days. When something goes wrong, I can diff today's configuration against last week's and see exactly what changed.

This philosophy comes from the same place as my cloud security experience: assume breach, minimize blast radius, and make recovery fast. The question isn't whether your agent will be compromised — it's whether you'll notice, how much damage was done, and how quickly you can recover.

Harden your sandbox. Trust nothing by default. And test your security controls — because as OpenClaw's audit logging gaps taught me, a security measure you haven't verified is a security measure you don't have.

---

*Next: [The Human-Agent Interface](/series/ops-layer-13) — the separation of concerns between what the human sees, what the agent manages internally, and the thin sync layer between them.*
