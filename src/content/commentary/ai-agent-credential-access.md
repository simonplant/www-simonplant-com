---
title: "How to Give Your AI Agent Credential Access Without Giving It Everything"
description: "The two-vault pattern for AI agent credentials — 1Password service account model giving the agent exactly what it needs, nothing more."
publishedDate: 2026-03-26
tags: ["security", "credentials", "1password", "ai-agents"]
tier: architecture
status: review
---

You set up an always-on AI agent. Now it needs to check your email, fetch market data, maybe post to Slack. That means credentials.

The naive approach: paste the API keys into your config file and move on. The problem: your agent now has access to everything, all the time, with no audit trail. If the agent gets prompt-injected — or if you just want to see what it accessed last Tuesday — you have nothing.

Here's the credential pattern that works.

---

## The Problem With Giving an Agent "Access to Your Vault"

Most developer password managers (Bitwarden, KeePassXC, even Hashicorp Vault) offer all-or-nothing agent access. There's no concept of "the agent can read the FastMail password but not my bank login."

Concretely: if you use `bw serve` (Bitwarden's local API) and inject the session token into your agent's Docker container, your agent can call `bw get password` on any item in any collection. One bad prompt injection later, it's exfiltrated your entire vault.

The blast radius needs to be scoped.

---

## The Two-Vault Pattern

The solution is to stop treating agent access like a user access problem. Your agent doesn't need your full vault — it needs a curated subset. Build that isolation into the vault structure itself.

```
Your main vault: All 100+ logins, autofill on iOS/macOS, your normal daily use
    └── "Agent" vault: 10-20 credentials the agent actually needs
            └── Service account token (read-only) → Docker env var
```

The service account only has read-only access to the Agent vault. It cannot read your main vault. It cannot write anything. It can be revoked instantly without touching your main credentials.

---

## Why 1Password Is The Right Tool

I evaluated six options for my own agent setup:

| Manager | Per-Vault Scoping | Human iOS/Mac UX | Agent CLI | Apple CSV Import |
|---|---|---|---|---|
| **1Password** | ✅ | ⭐⭐⭐⭐⭐ | `op` CLI + SDK | ✅ |
| Bitwarden / Vaultwarden | ⚠️ All-or-nothing | ⭐⭐⭐⭐ | `bw serve` | ✅ |
| KeePassXC | ❌ | ⭐⭐⭐ | `keepassxc-cli` | ✅ with mapping |
| HashiCorp Vault | ✅ | ❌ No consumer UX | API | ❌ |

1Password wins because it's the only one that solves all three constraints simultaneously:

1. **Per-vault scoping** — service accounts scope to specific vaults, read-only
2. **Best human UX** — you're not going to stop using autofill to accommodate the agent
3. **Purpose-built agent CLI** — `op` CLI with a URI scheme (`op://vault/item/field`) that's clean to use in scripts

They also published their own Claude + Python SDK integration tutorial, which tells you this is a supported use case they intend to keep working.

---

## The Setup

**Step 1: Import your existing credentials**

If you're on Apple Passwords (previously iCloud Keychain):

```
Settings → Passwords → Export → Download CSV
```

Then in 1Password: Import → CSV → map fields. Delete the CSV immediately after.

**Step 2: Create the Agent vault**

In 1Password web UI: Vaults → New Vault → name it "Agent". Copy over only the credentials your agent will actually use. For a typical personal agent this is 5-15 items: email account, maybe an API key or two, a social platform token.

**Step 3: Create the service account**

1Password Settings → Service Accounts → New Service Account. Give it read-only access to the Agent vault only. Copy the token.

**Step 4: Inject into Docker**

```yaml
# docker-compose.yml
environment:
  OP_SERVICE_ACCOUNT_TOKEN: "${OP_SERVICE_ACCOUNT_TOKEN}"
```

```bash
# .env (not committed)
OP_SERVICE_ACCOUNT_TOKEN=ops_...
```

**Step 5: Use in your agent**

```bash
# Fetch at moment of use, not at startup
EMAIL_PASSWORD=$(op read "op://Agent/FastMail/password")
```

The URI scheme is: `op://vault-name/item-name/field-name`. Field names are the 1Password field labels. Common fields: `password`, `username`, `api key`.

---

## The Access Discipline

A few rules that matter in practice:

**Fetch at moment of use, not at startup.** Don't load credentials into memory at agent boot and pass them through context. Each tool call that needs a credential fetches it fresh. This limits the window where a credential is in memory.

**Never log credentials.** If your agent keeps action logs (it should), make sure the logging layer strips secrets before writing. The 1Password CLI doesn't echo secrets in its output — keep it that way end-to-end.

**Review the usage report monthly.** 1Password logs every `op read` call with timestamp and item name. Takes 2 minutes to check. You're looking for: unexpected items accessed, unusual access times, anything the agent shouldn't have touched.

**Rotate the service account token periodically.** 3-6 months is reasonable for a low-risk personal setup. In 1Password: delete the old service account, create a new one, update the Docker secret. 10 minutes.

---

## What About Vaultwarden?

Vaultwarden (self-hosted Bitwarden) is the right choice if you want $0 cost and data sovereignty. It uses the official Bitwarden iOS/macOS apps, so human UX is good. The limitation: no per-vault scoping for agent access without creating a separate Vaultwarden user account for the agent — which is workable but adds friction.

If you're running your agent on a home server already, Vaultwarden alongside it makes sense. If you're paying for a VPS or cloud instance, 1Password at $36/year is noise.

---

## The Version Without Infrastructure

If this feels like too much setup, there's a simpler version: create a dedicated `.secrets` directory in your agent's Docker volume, chmod 600, and manually maintain the 5-10 API keys your agent needs as plain files. Read them with `cat` at moment of use. No audit trail, no rotation workflow, but zero setup.

The 1Password version is better in every dimension that matters once you're serious about the setup. But don't let perfect be the enemy of functional.

---

Your agent shouldn't have access to everything in your life. Neither should any other tool you run 24/7. Scoped credentials, read-only service accounts, and usage audit trails aren't paranoia — they're the same hygiene you'd want for any production system that runs while you're not watching.

The credential vault structure is a 2-3 hour setup. The peace of mind is indefinite.

---

*I use this pattern with [ClawHQ](https://claw-hq.com) — a hardened OpenClaw configuration that includes this setup out of the box. If you're running your own AI agent, the ClawHQ blueprints handle the credential architecture for you.*
