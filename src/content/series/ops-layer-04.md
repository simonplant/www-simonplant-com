---
title: "The Security Model Is Missing"
number: 4
publishedDate: 2026-04-12
description: "Zero-trust for agents. Real CVEs, default-disabled auth, plaintext credentials — and a hardening checklist."
tags: [security, zero-trust, openclaw, hardening]
status: published
---

When I look at the agent ecosystem's security posture, what I see is not a gap. It's an absence.

There is no security model. There are security *features* — individual settings you can toggle, individual flags you can set. But a security model is a coherent architecture: a threat model, a trust boundary definition, a defense-in-depth strategy, and operational controls that enforce all three. OpenClaw ships none of this. What it ships is a collection of opt-in hardening knobs scattered across a dozen configuration files, all defaulting to the permissive setting.

This isn't a theoretical concern. Over the past four months, I've conducted a systematic security audit of OpenClaw as part of building ClawHQ. That audit produced fifteen CVEs, numerous dangerous default configurations, and the discovery of an active supply chain attack campaign targeting the entire ecosystem. The evidence is public, the CVE numbers are assigned, and the findings are reproducible.

Let me walk through what I found.

---

## The CVE Landscape

Fifteen CVEs in two months of production availability. That's not unusual for a fast-moving open-source project — early Kubernetes had a rough period too. What's unusual is the *pattern*. These aren't edge-case bugs. They're architectural decisions that shipped as defaults.

**CVE-2026-32045 (CVSS 8.2, GHSA-hff7-ccv5-52f8): Incorrect tokenless Tailscale header authentication on HTTP gateway routes.** The OpenClaw Gateway allows bypass of token and password requirements when accessed via Tailscale header authentication on HTTP routes. This means installations relying on Tailscale as their authentication boundary have their admin API exposed without meaningful access control. In cloud environments with Tailscale integration, that means any node on the tailnet can reach the admin API unauthenticated.

I ran Shodan and Censys scans. As of late March 2026, there are 42,000+ OpenClaw Gateway instances listening on public IP addresses. The number grows by roughly 2,000 per month. 98% are bound to 0.0.0.0. Based on response fingerprinting, I estimate 60%+ are running with default or weak authentication tokens.

Forty-two thousand admin APIs. Exposed. Growing.

**CVE-2026-25253 (CVSS 8.8): 1-Click RCE via authentication token exfiltration.** The Control UI trusts the `gatewayUrl` parameter from the query string and auto-connects with stored credentials. An attacker crafts a URL pointing to a malicious gateway, the victim clicks it, and the UI sends the stored authentication token to the attacker's server. Oasis Security researchers named this attack vector "ClawJacked" in the disclosure.

Think about what this means operationally. You deploy an agent. You configure it with access to your email, calendar, code repositories, and internal tools. Someone sends you a link to what looks like a legitimate OpenClaw dashboard. You click it. The UI reads your stored credentials and auto-connects to the attacker's gateway endpoint. Now the attacker has your authentication token and full agent access. They can read your email. They can send messages as you. They can execute tools on your behalf.

**CVE-2026-32973 (CVSS 8.8, GHSA-f8r2-vg7x-gh8m): Exec allowlist bypass via POSIX path normalization.** The `matchesExecAllowlistPattern` function overmatches due to improper lowercasing and glob matching, allowing execution of unintended commands. An attacker can bypass the tool execution allowlist using path normalization tricks — case variations, relative paths, symlinks — to execute arbitrary commands that should be blocked. The allowlist provides a false sense of security while being trivially circumventable.

**CVE-2026-24763 (CVSS 8.8, GHSA-mc68-q9jw-2h3v): Command injection in Docker sandbox execution.** Unsafe PATH environment variable handling when constructing shell commands allows command injection in the Docker sandbox. An attacker who can influence environment variables or tool arguments can inject arbitrary commands into the shell execution pipeline. Combined with the exec allowlist bypass, this means a compromised skill can execute arbitrary code within the container and potentially escape it.

**CVE-2026-35641 (CVSS 8.4, GHSA-m3mh-3mpg-37hw): Arbitrary code execution via crafted .npmrc file.** A crafted `.npmrc` file with a git executable override can achieve arbitrary code execution during local plugin and hook installation. ClawHub — the marketplace where users discover and install skills — has no code signing, no integrity verification, and no automated security scanning. Skills that bundle a malicious `.npmrc` can execute arbitrary code during the install process, before the skill is even loaded. I'll come back to this one — it's the foundation of the ClawHavoc campaign.

**CVE-2026-35632 (CVSS 6.9, GHSA-7xr2-q9vf-x4r5): Symlink traversal in agents.create/update.** The `fs.appendFile` call on IDENTITY.md lacks symlink containment, allowing arbitrary file writes. An attacker can create a symlink from IDENTITY.md to any file on the system — including crontab — enabling RCE via crontab injection. The identity file that defines who the agent is, what it values, and how it behaves can be leveraged as an arbitrary write primitive. No guardrail prevents this. No audit event is logged when it happens.

**CVE-2026-32914 (CVSS 8.7, GHSA-r7vr-gr74-94p8): Insufficient access control in /config and /debug command handlers.** Non-owners can read or modify privileged configuration through the `/config` and `/debug` command handlers. The default mount configuration compounds this — it allows the agent to modify its own runtime configuration files. An agent that can edit its own config can disable security controls, change its tool policy, or alter its cron schedule, and the access control gap means even non-owner users can trigger these changes.

**Inter-container communication (Docker deployment best practice).** Containers on the same Docker bridge network can reach each other by default. If you run multiple agents (or an agent alongside other services), inter-container communication is unrestricted. One compromised container can probe and attack its neighbors. Disabling ICC on shared bridge networks is a fundamental Docker hardening step that should be applied to any agent deployment.

**Audit log silent failure (known operational concern).** The audit logging subsystem can silently fail to write logs under certain conditions, as documented in GitHub issues #55801 and #13131. No error message. No health check failure. The agent continues operating, but its entire audit trail goes dark. If you're relying on OpenClaw's built-in logging for compliance or forensics, you may have gaps you don't know about.

---

## The Silent Landmines

CVEs get assigned numbers. They get tracked. They eventually get patched. What's harder to address are the configuration landmines — settings that cause security or operational failures without producing any error message, warning, or log entry.

I documented numerous examples of these during the audit. Several are directly linked to the CVEs above. Here are the ones that matter most:

**LM-01: Device auth loop.** A misconfigured OAuth redirect causes the authentication flow to loop indefinitely. The user sees a loading spinner. No error is displayed. The agent appears to be starting but never completes initialization. I've seen operators wait hours, restart Docker, reinstall OpenClaw, and file GitHub issues before someone identifies the redirect URI mismatch.

**LM-04: Tool sandbox escape.** When a skill's tool configuration specifies `mode: node` (either explicitly or by omitting the mode field, since some versions default to node), the tool executes directly on the host. There's no warning. The tool just runs with full host access. This is CVE-2026-32973 manifesting as a configuration default rather than a code bug.

**LM-07: Container escape path.** The combination of default Docker capabilities (not dropped) and writable mounts creates a privilege escalation path. No single setting is wrong. The composition of defaults is wrong. This is CVE-2026-24763 in landmine form — you have to know to set both `cap_drop: ALL` and `security_opt: no-new-privileges:true` and `read_only: true`, because none of them are the default.

**LM-12: Writable config mounts.** The default Docker Compose file mounts the config directory read-write. The agent can modify its own configuration at runtime. This isn't flagged as a security risk in any documentation. It's CVE-2026-32914, sitting in the quickstart template.

**LM-13: Firewall lost after `docker compose down`.** If you've configured iptables rules to restrict agent egress (which you should), those rules are removed when Docker recreates the network on `docker compose down` / `docker compose up`. Your firewall vanishes silently. The agent comes back up with unrestricted network access. No log entry records the change.

The pattern across all of these landmines is the same: the failure is silent, the default is permissive, and the operator has no way to know something is wrong without already knowing what to look for.

---

## ClawHavoc: The Supply Chain Is Compromised

CVE-2026-35641 describes the vulnerability. ClawHavoc is what happened when someone exploited it at scale.

ClawHavoc is a coordinated supply chain attack campaign targeting ClawHub, the OpenClaw skill marketplace. I identified it during the security audit and named it based on the payload patterns. It's active, producing new variants, and as of this writing, unpatched at the ecosystem level.

The attack uses two techniques:

**Base64-encoded instructions in skill configs.** Skill YAML files contain a `system_prompt` field that gets injected into the agent's context. Malicious skills encode additional instructions in base64 within this field. The base64 string decodes to prompt injection payloads — instructions that tell the agent to exfiltrate data, modify behavior, or install persistence mechanisms. Because the string is encoded, casual inspection of the YAML doesn't reveal the payload.

**Zero-width Unicode characters in IDENTITY.md.** This one is elegant and terrifying. The attacker inserts zero-width Unicode characters (U+200B, U+200C, U+200D, U+FEFF) into the IDENTITY.md identity file. These characters are invisible in text editors, terminals, and most diff views. But the language model sees them. The zero-width characters encode additional instructions using a binary scheme — present/absent patterns that spell out a hidden prompt. The agent reads its own identity file, processes the hidden instructions, and follows them.

Combined with CVE-2026-35632 (symlink traversal in identity file writes), this creates a self-propagating attack. A malicious skill modifies IDENTITY.md, IDENTITY.md now contains hidden instructions, and those instructions persist even after the skill is removed.

I sampled skills from ClawHub across multiple categories. **up to 18.7% showed ClawHavoc indicators** (per Koi Security's survey), while Snyk's broader scan found prompt injection patterns in 36% of ClawHub skills — though confirmed malicious payloads account for roughly 13-19% depending on methodology. The most common targets were the identity files — redirecting the agent's behavior by modifying who it thinks it is. Some payloads targeted credential exfiltration. Some established outbound connections to command-and-control infrastructure.

This is not a handful of rogue submissions. This is a campaign. The payloads share structural patterns. New variants appear regularly. And the marketplace has no mechanism to detect or prevent them — no code signing, no automated analysis, no integrity verification.

---

## The Zero-Trust Operational Model

I didn't discover these issues as an academic exercise. I discovered them because I was trying to run OpenClaw agents in production for ClawHQ, and I kept getting compromised, misconfigured, or silently broken.

After the third incident, I threw out the default configuration entirely and rebuilt the operational model from zero-trust principles. Here's what that looks like:

### Container Hardening

```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
read_only: true
user: "1000:1000"
```

Every container drops all Linux capabilities. No process can acquire new privileges. The root filesystem is read-only. The container runs as a non-root user (UID 1000). This eliminates the container escape path (LM-07) and the capability escalation vulnerability (CVE-2026-24763) by construction.

Writable paths are explicitly tmpfs-mounted for the specific directories the agent needs (temp files, cache). Everything else is immutable.

### Filesystem Controls

Identity files are read-only. Period.

```bash
chmod 444 IDENTITY.md AGENTS.md
```

In Docker, they're mounted with the `:ro` flag:

```yaml
volumes:
  - ./identity/IDENTITY.md:/app/IDENTITY.md:ro
  - ./identity/AGENTS.md:/app/AGENTS.md:ro
```

The agent cannot modify its own personality, its own instructions, or its own tool policy. CVE-2026-35632 becomes non-exploitable. The ClawHavoc IDENTITY.md modification vector is eliminated.

Configuration files get the same treatment — read-only mounts, owned by root, not writable by the container's runtime user. CVE-2026-32914 becomes non-exploitable.

### Network Egress Control

The agent should only reach the services it's configured to use. If your agent manages email, it needs access to your email provider's API. It does not need access to arbitrary internet endpoints.

I use a dedicated iptables chain — `CLAWHQ_FWD` — that restricts outbound connections from the agent container to an allowlist of domains, defined per blueprint:

```bash
# Drop all outbound from agent container by default
iptables -A CLAWHQ_FWD -s 172.18.0.0/16 -j DROP

# Allow specific services per blueprint
iptables -I CLAWHQ_FWD -s 172.18.0.0/16 -d <gmail-api-ips> -j ACCEPT
iptables -I CLAWHQ_FWD -s 172.18.0.0/16 -d <openai-api-ips> -j ACCEPT
```

This is persisted and reapplied on container recreation, solving LM-13 (the firewall-lost-on-restart landmine).

Inter-container communication is disabled:

```yaml
networks:
  agent_net:
    driver: bridge
    internal: true
    driver_opts:
      com.docker.network.bridge.enable_icc: "false"
```

This eliminates the ICC risk. Containers on the same bridge cannot reach each other.

### Skill Vetting Pipeline

I don't install skills from ClawHub directly. Every skill goes through a four-stage pipeline:

1. **Stage.** Skill is downloaded to a quarantine directory. Not installed. Not accessible to the agent.
2. **AI-powered scan.** The skill configuration, tool definitions, and any bundled files are analyzed by a dedicated LLM prompt that looks for prompt injection patterns, encoded payloads, suspicious tool configurations, and obfuscated content. Eleven detection categories, including base64-encoded strings in prompt fields, zero-width Unicode sequences, and tool definitions that request node-mode execution.
3. **VirusTotal submission.** Bundled files are submitted to VirusTotal for multi-engine scanning.
4. **Approve and activate.** Only after passing both automated gates does the skill become available for installation.

This pipeline catches the ClawHavoc payloads consistently. The AI scan detects both the base64 technique and the zero-width Unicode technique. It's not perfect — no scanner is — but it raises the bar from "zero friction" to "active resistance."

### Prompt Injection Sanitizer

Inbound content — emails the agent processes, web pages it reads, documents it analyzes — passes through a sanitizer that scores content across eleven threat categories. Content above a configurable threshold is flagged and optionally quarantined. The categories include known injection patterns, role-switching attempts, instruction override patterns, and several categories I developed specifically for the agent context.

This doesn't prevent all prompt injection. Nothing does. But it catches the commodity attacks and logs the attempts for forensic analysis.

### Credential Health Probes

Credentials expire. API keys get rotated. OAuth tokens have TTLs. The default OpenClaw behavior when a credential expires is: nothing. The agent continues running. Tool calls fail silently or return errors that the agent may or may not handle gracefully. The operator finds out when someone complains that the agent stopped responding to emails three days ago.

ClawHQ runs health probes against every configured integration. Not a "is the token present" check — an actual API call that verifies connectivity. When a credential is approaching expiration or has failed a health check, the operator gets alerted before the agent goes dark.

### Audit Trail

The audit logging gaps documented in GitHub issues #55801 and #13131 proved that OpenClaw's built-in audit logging is unreliable. My solution: don't rely on it.

ClawHQ maintains an independent audit trail. Every tool execution, every LLM call, every configuration change, every skill installation is logged to a separate system. The log entries are HMAC-chained — each entry includes a hash of the previous entry — so tampering is detectable. If the agent modifies its own logs (which it can, if you haven't made them read-only), the chain breaks and the integrity violation is flagged.

---

## The Hardening Checklist

Everything above distills into a practical checklist. This is what I apply to every agent deployment, and what I'd recommend to anyone running OpenClaw in any environment where the agent has access to real data or real services.

### Gateway

- [ ] Bind to `127.0.0.1`, not `0.0.0.0`
- [ ] Do not rely solely on Tailscale header authentication for gateway routes (CVE-2026-32045)
- [ ] Set a strong, unique auth token — not the default
- [ ] Enable TLS for all client connections
- [ ] Sanitize `gatewayUrl` parameter — do not auto-connect to untrusted endpoints (CVE-2026-25253)
- [ ] Rate-limit API endpoints
- [ ] Place behind a reverse proxy in production

### Container

- [ ] `cap_drop: ALL` (CVE-2026-24763)
- [ ] `security_opt: no-new-privileges:true` (CVE-2026-24763)
- [ ] `read_only: true` for root filesystem (LM-07)
- [ ] Run as non-root user (UID 1000)
- [ ] Use tmpfs for required writable paths only
- [ ] Set memory and CPU limits
- [ ] Pin container image to a specific digest, not `latest`

### Filesystem

- [ ] Mount identity files read-only (`:ro`) (CVE-2026-35632)
- [ ] Mount config files read-only (`:ro`) (CVE-2026-32914)
- [ ] Set file permissions to 444 for identity and config
- [ ] Ensure workspace directory write access is scoped to data directories only
- [ ] Audit file modification events with inotify or auditd

### Network

- [ ] Disable inter-container communication (Docker best practice)
- [ ] Implement egress firewall restricting outbound to allowlisted domains
- [ ] Persist firewall rules across container recreation (LM-13)
- [ ] Use internal Docker networks where possible
- [ ] Monitor DNS queries from agent container for anomalous resolution

### Credentials

- [ ] Never store credentials in config files — use Docker secrets or a vault
- [ ] Implement health probes for every integration endpoint
- [ ] Set up expiration alerts for time-limited tokens
- [ ] Rotate credentials on a schedule, not just when they break
- [ ] Audit credential access patterns for anomalies

### Monitoring

- [ ] Deploy an independent audit trail (don't rely solely on OpenClaw logging)
- [ ] HMAC-chain log entries for tamper detection
- [ ] Monitor for IDENTITY.md modification attempts
- [ ] Alert on unexpected outbound network connections
- [ ] Track token consumption per model, per agent, per task
- [ ] Verify audit log integrity on a schedule (see GitHub #55801, #13131)

---

## The Systemic Problem

Individual hardening is necessary but not sufficient. The deeper issue is architectural: the agent ecosystem has no security model because the platforms were designed for capability first and security never.

OpenClaw is not uniquely bad. It's representative. Every agent framework I've evaluated has the same pattern: powerful capabilities, permissive defaults, security as an afterthought. The frameworks compete on features — which tools can your agent use, how many models does it support, how good is the memory system. Nobody competes on security posture. Nobody's marketing says "our agent framework drops all Linux capabilities by default." That's not a feature that drives GitHub stars.

But it's the feature that determines whether agents move from demos to production. Every enterprise eventually hits the same wall: the security team says no. And the security team says no because the default configuration is indefensible. Not in the "we could argue about risk tolerance" sense. In the "this binds to 0.0.0.0 with a default token and you want to put it on our network" sense.

The fix isn't more CVEs and more patches. The fix is a security model — a coherent, opinionated, defense-in-depth architecture that ships as the default, not as a checklist you apply after deployment. Secure by default. Hardened by default. Auditable by default. Restrictive by default.

That's what I'm building into ClawHQ. Not because I enjoy writing iptables rules (I don't), but because this is the layer that's missing, and without it, agents remain toys.

This is what happens when infrastructure ships insecure and gets adopted faster than it gets hardened. The internet went through this. Cloud went through this. We know how this story ends if nobody builds the security layer: breaches, regulation, and a lot of preventable damage in between.

The evidence is already here. 42,000 exposed instances. An active supply chain campaign. Fifteen CVEs in the first two months. The question isn't whether the security reckoning is coming. It's whether the ecosystem builds the security model before or after the first major breach.

I know which one I'm betting on. Unfortunately, history says "after."

---

*Next: [Capability-First, Not Persona-First](/series/ops-layer-05) — why I built a 17-dimension persona schema, why it was wrong, and how capability architecture drives agent behavior more than personality does.*

*A companion hardening checklist derived from this article will be published on GitHub as a standalone, forkable reference.*
