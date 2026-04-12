---
title: "Agent Configuration as Code"
number: 3
publishedDate: 2026-04-12
description: "~200 configurable fields, no versioning, no diffs. The case for config-as-code discipline for agents."
tags: [configuration, infrastructure-as-code, openclaw]
status: published
---

In 2013, a Terraform plan file was just a novelty. Most infrastructure teams were still clicking through the AWS console, keeping tribal knowledge in their heads, and SSHing into boxes to debug why a deploy had drifted from what they thought they'd configured. The idea that you'd describe your entire infrastructure in declarative text files, version them in git, review changes as diffs, and apply them through a pipeline — that was a discipline most organizations hadn't adopted yet.

By 2016, it was table stakes. If you were still configuring cloud infrastructure by hand, you were doing it wrong. The industry had learned, through expensive outages and unreproducible environments, that configuration is code. Treat it like code or suffer the consequences.

I'm watching agent operators learn this lesson from scratch right now. And it's costing them the same way.

---

## The Configuration Surface Nobody Talks About

When people discuss AI agents, they talk about models, prompts, and capabilities. What they don't talk about is the configuration surface — the total set of knobs, switches, files, and settings that determine how an agent actually behaves in production.

OpenClaw has roughly 200+ configurable fields spread across 19 categories. That's not a typo. Two hundred settings that affect runtime behavior, security posture, tool access, scheduling, identity presentation, memory management, and integration routing.

A working agent requires thousands of tokens of configuration distributed across 11+ files:

- **openclaw.json** — runtime configuration (model selection, temperature, context window, tool policy)
- **docker-compose.yml** — container orchestration (networking, volumes, restart policy, resource limits)
- **Dockerfile** — build layer (base image, dependencies, file permissions)
- **.env** — secrets and environment variables
- **credentials.json** — integration credentials (OAuth tokens, API keys, service accounts)
- **SOUL.md** — behavioral identity (personality, communication style, decision framework)
- **AGENTS.md** — multi-agent coordination rules
- **IDENTITY.md** — workspace metadata
- **HEARTBEAT.md** — health check configuration
- **TOOLS.md** — tool usage documentation and constraints
- **Cron definitions** — scheduled task configurations
- **Skill configs** — per-skill parameter files
- **Egress rules** — network access policy

Roughly 40% of this configuration is universal — the same for every well-configured agent. Docker networking, security headers, restart policies, base model settings. The other 60% is personalized — what the agent does, who it talks to, which integrations it uses, how it presents itself.

Here's the problem: almost nobody manages this configuration with any discipline at all.

---

## The State of Agent Configuration Today

Most OpenClaw operators configure their agents through a combination of the Control UI (a web interface), manual file editing via SSH, and copy-pasting from community templates. Changes aren't versioned. There are no diffs to review. There's no validation before apply. There's no audit trail.

When something breaks — and things break constantly in agent deployments — the debugging process is archaeological. You SSH into the container, read through config files, try to remember what you changed last, compare against a community template that may or may not match your version, and experiment until it works again. Or doesn't.

This is exactly how we managed cloud infrastructure in 2009. And it produced exactly the same failure modes.

**No diffs means no diagnosis.** When your agent starts behaving differently — responding in a different tone, missing scheduled tasks, failing to access an integration — you have no way to correlate the behavioral change with a configuration change. You can't ask "what changed?" because nothing tracks changes.

**No spec means no replication.** Want to spin up a second agent with the same configuration? You can try to manually replicate thousands of tokens of settings across 11 files. Good luck getting it right. Want to share your working configuration with someone else? You'd need to sanitize secrets from multiple files, document the implicit dependencies, and hope nothing was environment-specific.

**No validation means silent failure.** OpenClaw has numerous configuration settings that I call silent landmines. These are settings that, when misconfigured, cause security or operational failures without producing any error message. Your agent keeps running. It just stops doing something, or starts doing something it shouldn't, or exposes something that should be locked down. You don't know until you notice — or until someone else notices for you.

### The Identity Desync Problem

Here's a concrete example that illustrates why unmanaged configuration is dangerous.

In OpenClaw, an agent's identity lives in three separate places that can fall out of sync:

1. **SOUL.md** — the behavioral identity. "You are Clawdius, a digital assistant who..."
2. **IDENTITY.md** — workspace metadata. Agent name, description, workspace identifiers.
3. **identity.\*** fields in openclaw.json** — display name, emoji, avatar URL.

These three surfaces aren't linked. Nothing validates that they agree with each other. If you update the agent's name in SOUL.md but forget to update IDENTITY.md and openclaw.json, your agent will introduce itself as one name while the UI displays another.

This isn't hypothetical. Community members have reported agents introducing themselves by the wrong name — confused and confusing behavior caused entirely by identity surfaces falling out of sync. It's a small thing in isolation. But it's symptomatic of a larger problem: when configuration lives in multiple unlinked files with no cross-surface validation, drift is inevitable.

Now multiply that across 200+ fields and 11+ files. Identity is just the one that's visibly embarrassing. The settings that affect security posture, tool access, and scheduling drift silently.

---

## The Infrastructure-as-Code Discipline

The cloud industry solved this problem. The solution has a name: infrastructure as code. The principles are well-established:

**Versioned in git.** Every configuration change is a commit. Every commit is a diff. Every diff is reviewable. "What changed between yesterday and today?" is a `git log` command, not a forensic investigation.

**Validated before apply.** Configuration goes through validation before it reaches production. Terraform has `plan`. CloudFormation has change sets. The idea is the same: catch errors before they cause outages, not after.

**Declarative, not imperative.** You describe what you want, not how to get there. "I want three instances behind a load balancer" rather than "SSH into the provisioner, run this script, edit this config, restart this service." Declarative configuration is idempotent — apply it twice and you get the same result.

**Diffable and reviewable.** Configuration changes go through the same review process as code changes. Pull request, review, approve, merge, apply. The change is documented, the rationale is captured, and the reviewer can catch mistakes before they ship.

**Environment-specific overrides.** Dev, staging, production — same base configuration, different parameters. You don't maintain three completely separate configs. You maintain one config with environment-specific overrides.

**Secrets separation.** Credentials live in separate files with restricted permissions (mode 0600), never inline in configuration. They're injected at runtime, not committed to the repository.

These aren't novel ideas. They're the settled consensus of two decades of infrastructure management. But almost none of this discipline has been applied to agent configuration.

---

## Blueprints: Config-as-Code for Agents

This is the approach I've built into ClawHQ. We call them blueprints — YAML source files that compile to the full agent configuration simultaneously.

Here's the blueprint for Clawdius, my personal agent:

```yaml
version: 0.2.0
composition:
  profile: life-ops
  personality: digital-assistant
  providers:
    email: gmail
    calendar: icloud-cal
    tasks: todoist
    search: tavily
installMethod: cache
security:
  posture: hardened
  egress: allowlist-only
```

Seventeen lines of YAML. That's it.

The blueprint compiler resolves this into the full multi-thousand-token configuration: all 8 workspace files, runtime config, cron schedule, tool policy, and security posture. Every file is generated from a single source of truth. Every file is internally consistent with every other file.

The `profile: life-ops` declaration selects a mission profile — a pre-composed set of skills, cron schedules, tool configurations, and behavioral parameters designed for personal life management. The `personality: digital-assistant` selects a behavioral template that gets compiled into SOUL.md. The `providers` block maps abstract capabilities (email, calendar, tasks) to concrete integrations (Gmail, iCloud Calendar, Todoist) — and the compiler knows which tools, credentials, and permissions each provider requires.

The `security.posture: hardened` declaration applies the full hardening checklist by construction. Not "here are 30 things you should configure" — they're configured. The silent landmines? Prevented. Not documented, not warned about — impossible to produce in the compiled output.

`security.egress: allowlist-only` means the agent can only make outbound network requests to explicitly permitted domains. The compiler generates the egress rules from the provider selections — Gmail needs access to Google APIs, Todoist needs access to Todoist APIs, and nothing else is permitted.

### What the Compiler Does

The blueprint compiler isn't a template engine. It's a resolver. Given a blueprint, it:

1. **Resolves the mission profile** into specific skills, cron schedules, and tool configurations
2. **Resolves the personality** into SOUL.md content, communication parameters, and behavioral constraints
3. **Resolves providers** into credentials requirements, tool policy entries, egress rules, and integration-specific configuration
4. **Applies the security posture** across all generated files — not as a post-processing step, but as a constraint that shapes every output
5. **Validates cross-surface coherence** — does SOUL.md reference tools that are actually enabled? Does the cron schedule invoke skills that are actually loaded? Does the tool policy grant access to integrations that have credentials configured?

That last point is the one that matters most. Cross-surface coherence is the problem that manual configuration can't solve at scale. When your configuration is spread across 11+ files, keeping them all in agreement requires either superhuman attention or automated validation. The blueprint compiler provides the latter.

### The Validator

The compiler catches errors at generation time. But configuration can also drift after deployment — a manual edit through the Control UI, an OpenClaw version update that changes defaults, a credential rotation that wasn't reflected in the config.

The validator (`src/config/validate.ts` in ClawHQ) runs continuously and enforces the same coherence rules:

- Does SOUL.md agree with TOOLS.md?
- Does the cron schedule match the loaded skills?
- Are all referenced credentials present and valid?
- Does the security posture match the declared level?
- Are there identity desyncs across the three identity surfaces?

When drift is detected, the validator flags it. The fix is straightforward: re-compile from the blueprint. The blueprint is the source of truth. Everything else is a derived artifact.

---

## The General Principle

I built blueprints because I needed them. Running Clawdius with manually managed configuration was exactly as painful as running cloud infrastructure with manually managed configuration — which is to say, it worked until it didn't, and when it didn't, debugging was miserable.

But the principle extends beyond ClawHQ and beyond OpenClaw. Any system with a large configuration surface benefits from config-as-code discipline. The specific implementation — YAML blueprints, Terraform-style HCL, JSON schemas, whatever — matters less than the discipline itself:

1. Configuration lives in version control
2. Changes are diffs that humans review
3. Validation happens before deployment
4. A single source of truth compiles to multiple output files
5. Secrets are separated from configuration
6. The system prevents known failure modes by construction, not documentation

The alternative is thousands of tokens of hand-edited configuration with no audit trail, no validation, and numerous silent landmines waiting for you to step on them. We learned this lesson with cloud infrastructure. We learned it with container orchestration. We learned it with CI/CD pipelines.

The agent ecosystem is going to learn it too. The only question is how many incidents happen first.

---

*Next: [The Security Model Is Missing](/series/ops-layer-04) — zero-trust for agents, real CVEs, default-disabled auth, plaintext credentials, and a hardening checklist.*
