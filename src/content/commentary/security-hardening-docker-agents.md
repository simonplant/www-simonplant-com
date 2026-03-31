---
title: "Hardening Before Connecting: Securing an Autonomous Agent Stack From the Ground Up"
description: "The security checklist I use before connecting a new tool or service to an AI agent. Container isolation, egress filtering, zero-trust permissions."
publishedDate: 2026-03-11
tags: ["security", "docker", "ai-agents", "hardening"]
tier: architecture
status: review
---

---

Last week I wrote about [what OpenClaw power users actually build](/blog/openclaw-power-users) — the cron-driven workflows, hardened containers, and CLI wrappers that turn a chatbot framework into autonomous infrastructure. One of the core arguments was that serious operators treat their agent stack like production infrastructure, with all the security rigor that implies.

This week we put that into practice. Before connecting the agent to real services — email, calendars, task management, financial data — we ran a full security audit of the underlying infrastructure. Five Docker Compose stacks, roughly 15 containers, covering everything from Traefik and Prometheus to Ollama and Jupyter.

The logic is simple: if you're about to give an autonomous agent real-world connectivity, the foundation it runs on had better be solid first. You don't plug live data into an unhardened stack any more than you'd wire a building for electricity before finishing the walls.

This is the story of what we found, what we fixed, and why this boring infrastructure work is the prerequisite for everything interesting that comes next.

## The Principle: Foundation Before Features

It's tempting to skip straight to the exciting stuff. Connect the agent to your inbox. Give it calendar access. Let it manage your Todoist. Wire up market data. Every new integration makes the agent more useful — and every one expands the attack surface.

The responsible approach is to harden the stack first, while the blast radius is still small. If a misconfigured container gets compromised before the agent has email access, the attacker gets... a Grafana dashboard with default credentials showing CPU metrics. If it gets compromised *after* you've connected email, they get your inbox.

So before plugging in a single real-world data source, we audited the entire stack across four domains:

1. **Docker and container security** — privileges, capabilities, images, network isolation
2. **Dockerfiles and build scripts** — supply chain integrity, binary verification
3. **Secrets and credentials** — externalization, git history, env management
4. **Network and firewall** — port exposure, reverse proxy routing, authentication

## What We Found

### Secrets Management: Already Solid

The credential story was clean. Every API key and token was externalized to gitignored `.env` files. All config templates used `CHANGE_ME` placeholders. CLI tools enforced required env vars with `${VAR:?required}`. Git history was clean — a prior hardening session had already migrated the last hardcoded credentials to env vars.

This was deliberate. We'd established the pattern early: credentials never touch version control, period. That discipline paid off when we scanned — nothing to remediate.

### Container Hardening: One Service Got It Right

The OpenClaw gateway container had been hardened from the start:

```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
read_only: true
init: true
```

This is textbook: drop all Linux capabilities, prevent privilege escalation via setuid/setgid, make the filesystem read-only, use `init` for proper signal handling and zombie reaping.

The other twelve services had none of this. Not because we were careless — because they'd been deployed incrementally over weeks, each one focused on function ("does Prometheus scrape correctly?") rather than security posture. That's normal for a stack that's evolving. It's also exactly why you audit before connecting real data, rather than after.

### Image Tags: The `:latest` Problem

Ten services were running `:latest`. In development, that means "give me the newest thing." In a stack that runs 24/7, it means "surprise me."

A routine `docker compose pull` could silently upgrade Prometheus from v3.9 to v3.10, change a metrics format, and break monitoring. Worse, `:latest` is a mutable tag — the image it points to today isn't the image from last month. If a maintainer's Docker Hub account is compromised, `:latest` pulls whatever the attacker pushed.

For infrastructure supporting an autonomous agent, "surprise me" is not an acceptable upgrade strategy.

### Network Exposure: More Surface Than Needed

Prometheus, Grafana, Jupyter, Open-WebUI, and Portainer were all routed through Traefik with no authentication. The Traefik dashboard itself was exposed via `api.insecure: true`. Traefik ports 80/443 were bound to `0.0.0.0` — all interfaces.

None of these web UIs were actively used — monitoring data was consumed via API, dev work happened through SSH. They were exposed because the default configuration exposes them, and nobody had revisited that default.

On a LAN-only box behind a consumer router, this is low severity. But "low severity" compounds. If the router enables UPnP, or if a second network interface is added, the entire stack becomes internet-facing. We were one configuration change away from a much bigger problem.

### Build-Time Supply Chain

The dev container Dockerfile piped install scripts directly from the internet:

```dockerfile
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
```

The OpenClaw Dockerfile downloaded five binaries from GitHub Releases with no checksum verification. If any of those upstream sources are compromised during a build, malicious code gets baked directly into the image.

### cAdvisor Capabilities

cAdvisor was running with `SYS_ADMIN`, `NET_ADMIN`, `SYS_PTRACE`, and `DAC_READ_SEARCH`. It only needs the last two. `SYS_ADMIN` is essentially root-equivalent — it was there because the default documentation includes it. Default docs optimize for "it works." Security audits optimize for "what can we remove."

## What We Fixed

Every change was non-breaking. No downtime required. The stack came back up cleanly and has been running stable since.

### Hardened Every Container

All 15 services now have:
- `init: true` — proper PID 1 signal handling, zombie process reaping
- `security_opt: [no-new-privileges:true]` — prevents setuid/setgid privilege escalation

Previously only the OpenClaw gateway had full hardening. Now the entire stack has a consistent security baseline.

### Pinned Every Image

| Service | Before | After |
|---------|--------|-------|
| Traefik | `traefik:v3` | `traefik:v3.6` |
| Prometheus | `prom/prometheus:latest` | `prom/prometheus:v3.10.0` |
| Grafana | `grafana/grafana:latest` | `grafana/grafana:12.4.0` |
| node-exporter | `prom/node-exporter:latest` | `prom/node-exporter:v1.10.2` |
| cAdvisor | `gcr.io/cadvisor/cadvisor:latest` | `gcr.io/cadvisor/cadvisor:v0.55.1` |
| Portainer | `portainer/portainer-ce:latest` | `portainer/portainer-ce:2.39.0` |
| Ollama | `ollama/ollama:latest` | `ollama/ollama:0.17.7` |
| code-server | `linuxserver/code-server:latest` | `linuxserver/code-server:4.109.5-ls319` |

Two services — Open-WebUI (`:main`) and Jupyter (`cuda12-latest`) — stayed as-is because they don't publish stable version tags. Everything else updates deliberately now: change the version, review the changelog, deploy. No surprises.

### Added Resource Limits Across the Board

No service had resource limits. A runaway process — or a manipulated agent spawning expensive compute — could OOM the host. We added limits to every service:

| Service | CPU | Memory |
|---------|-----|--------|
| Traefik | 2 | 512M |
| Prometheus | 2 | 2G |
| Grafana | 2 | 1G |
| node-exporter | 1 | 256M |
| cAdvisor | 1 | 512M |
| Ollama | 14 | 48G |
| Jupyter | 8 | 16G |
| OpenClaw gateway | 4 | 4G |

If a service hits its memory limit, Docker kills that container — not the entire machine. For an autonomous agent stack, resource limits aren't just about stability. They're a safety mechanism. They ensure no single process — whether triggered by the agent or by an attacker — can take down the host.

### Eliminated Unnecessary Network Exposure

- Removed Traefik routing from Prometheus, Grafana, Open-WebUI, Jupyter, and Portainer. These services still run for machine-to-machine use — they're just not HTTP-accessible anymore.
- Set `api.insecure: false` on the Traefik dashboard.
- Bound Traefik ports 80/443 to `${HOST_IP}` (the LAN IP from `.env`) instead of `0.0.0.0`.

The result: one service exposed via Traefik (Home Assistant, which requires it), down from six.

### Egress Filtering: Controlling What Gets Out

Hardening isn't just about what can get *in* — it's about what can get *out*. An agent with exec access and internet connectivity is a potential exfiltration vector, whether through compromise or misconfiguration. If the agent can reach any endpoint on the internet, a single prompt injection could send your data anywhere.

We implemented egress filtering at the network level using a dedicated iptables chain applied to the OpenClaw bridge interface:

```bash
iptables -N OPENCLAW_FWD
iptables -A OPENCLAW_FWD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A OPENCLAW_FWD -p udp --dport 53 -j ACCEPT
iptables -A OPENCLAW_FWD -p tcp --dport 53 -j ACCEPT
iptables -A OPENCLAW_FWD -p tcp --dport 443 -j ACCEPT
iptables -A OPENCLAW_FWD -j LOG --log-prefix "OPENCLAW_BLOCKED: " --log-level 4
iptables -A OPENCLAW_FWD -j DROP
```

Default-deny, with exceptions only for DNS resolution and HTTPS. Everything else — HTTP, SSH, SMTP on non-standard ports, raw TCP — is dropped and logged. The `OPENCLAW_BLOCKED` log prefix means we can audit exactly what the agent tried to reach and was denied.

Because Docker recreates bridge interfaces on container restart (which flushes iptables rules targeting the old interface), we run a systemd watcher service that monitors Docker network events and reapplies the firewall rules automatically:

```bash
docker events --filter 'type=network' --filter 'event=connect' \
  --format '{{.Actor.Attributes.name}}' | while read -r name; do
  if [ "$name" = "openclaw_openclaw-net" ]; then
    bash setup-openclaw-firewall.sh
  fi
done
```

This solves a subtle problem: without the watcher, every `docker compose restart` would silently remove the egress rules, leaving the agent unfiltered until someone manually reapplied them. Automating it means the firewall is always on, even after updates and crashes.

The OpenClaw network itself is configured with inter-container communication disabled (`com.docker.network.bridge.enable_icc: "false"`), so containers on the same network can't talk to each other directly. The gateway and CLI containers are isolated even from their neighbors.

**The known gap:** This is port-based filtering, not domain-based. The agent can reach any HTTPS endpoint — `api.anthropic.com` but also `attacker-controlled-server.com:443`. The next step is domain-based allowlisting, likely through DNS-level filtering or a forward proxy with an explicit allowlist of approved endpoints. That's a [tracked issue](https://github.com/simonplant/home-server/issues/35) for the next hardening pass — it becomes higher priority as we connect more real-world integrations where the data inside the container is worth stealing.

### Fixed Build-Time Supply Chain

Replaced `curl | bash` with download-then-execute:

```dockerfile
# Before — attacker-controlled code runs immediately
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# After — download first, then execute (inspectable, cacheable)
RUN curl -LsSf https://astral.sh/uv/install.sh -o /tmp/uv-install.sh && \
    bash /tmp/uv-install.sh && \
    rm /tmp/uv-install.sh
```

Added SHA256 checksum verification for the three GitHub Release binaries that publish checksums (himalaya, GitHub CLI, jq). Ripgrep, ffmpeg, and others don't publish checksums upstream — documented as accepted risk.

### Reduced cAdvisor to Minimum Capabilities

Removed `SYS_ADMIN` and `NET_ADMIN`. Kept `SYS_PTRACE` and `DAC_READ_SEARCH` — the minimum required for container metrics collection.

## What We Deliberately Left Alone

Accepting risk explicitly is better than pretending it doesn't exist.

**Home Assistant runs privileged with host networking.** Required for mDNS device discovery. The real fix is VLAN isolation — an infrastructure project, not a config change. Documented, scheduled for later.

**Docker socket mounts in three containers.** Traefik, Portainer, and the dev container need it for their core function. The Docker socket is root-equivalent host access. The mitigation is container-level isolation and resource limits — if one is compromised, the blast radius is contained.

**Default passwords on internal services.** Grafana and Jupyter still have default credentials. These services are no longer HTTP-accessible, so the exposure is meaningfully reduced. Worth fixing, but not the priority when you're trying to establish a hardened baseline.

## The Scorecard

| Category | Before | After |
|----------|--------|-------|
| Services with `no-new-privileges` | 3 of 15 | 15 of 15 |
| Services with `init: true` | 2 of 15 | 15 of 15 |
| Services with resource limits | 0 of 15 | 15 of 15 |
| Images pinned to version | 5 of 15 | 13 of 15 |
| Services exposed via Traefik | 6 | 1 |
| `curl \| bash` in Dockerfiles | 2 | 0 |
| Binaries with SHA256 verification | 0 of 7 | 3 of 7 |
| Ports on `0.0.0.0` | 2 | 0 |
| Egress filtering | None | Port-based default-deny (443 + DNS only) |
| Inter-container communication | Enabled | Disabled (ICC off) |

Ten files changed. About 154 lines added, 26 removed. No downtime.

## Why This Matters for What Comes Next

With the stack hardened, we can start connecting real services — email, calendar, task management, financial data — with confidence that the infrastructure underneath is solid.

Each new integration will expand the attack surface. That's unavoidable. But the difference between connecting services to a hardened stack and connecting them to an unhardened one is the difference between calculated risk and negligence.

When the agent eventually has access to your inbox, your calendar, and your financial accounts, you want to know that:

- Every container is running with minimal privileges
- No service is exposed that doesn't need to be
- Resource limits prevent any single process from taking down the host
- Images update deliberately, not silently
- Build-time dependencies are verified, not blindly trusted
- Accepted risks are documented, not ignored

The hardening session wasn't glamorous. There's no demo video. Nobody's impressed by `init: true`. But this is what responsible agent infrastructure looks like: doing the boring work first, so the interesting work doesn't become a liability.

The foundation is set. Now we can build on it.

---

*This is the second post in the Responsible Claw Engineering series. The first — [Beyond the Morning Brief: What OpenClaw Power Users Actually Build](/blog/openclaw-power-users) — covers the architectural patterns that power users rely on. Next up: connecting real-world data sources and the permission boundaries that make it safe.*
