---
title: "ClawHQ Demo — Try OpenClaw in 60 Seconds on DigitalOcean"
description: "A guided demo of deploying a configured OpenClaw agent stack using ClawHQ on DigitalOcean — from zero to running agent in under a minute."
publishedDate: 2026-03-23
tags: ["openclaw", "clawhq", "digitalocean", "deployment"]
tier: signal
status: review
---

Most demos lie. "Try it in 60 seconds" usually means signing up for a waitlist, waiting for a Loom link, and watching someone else's screen. This one doesn't.

Here's how to spin up a real, running OpenClaw instance on DigitalOcean with ClawHQ pre-installed — no local dependencies, no config marathon, no waiting. If you move fast, you're watching your agent work before your coffee finishes brewing.

---

## What You'll End Up With

A personal AI assistant that runs 24/7, visible via Telegram, with:

- **Morning Brief** — daily digest of email, calendar, tasks, and weather
- **ClawWall** — inbound content sanitization (blocks prompt injection)
- **Memory system** — daily logs, task tracking, curated notes
- **Secure-by-default config** — gateway bound to loopback, no home directory mount, approval-gated write actions

This is a live, working agent on real infrastructure. Not a sandbox. Not a fake. You can disconnect and it keeps running.

---

## Prerequisites (2 minutes)

You need three things before you start:

1. **DigitalOcean account** — free to create, credit card required  
   → [digitalocean.com](https://www.digitalocean.com) (referral link gets you $200 credit for 60 days)

2. **Telegram account** + a Telegram bot token  
   → Open [@BotFather](https://t.me/botfather) in Telegram → `/newbot` → copy the token

3. **An API key** for at least one LLM provider:  
   - Anthropic (Claude): [console.anthropic.com](https://console.anthropic.com)  
   - OpenAI: [platform.openai.com](https://platform.openai.com)  
   - Or any OpenAI-compatible endpoint

That's the full list. No email verification loops, no phone calls, no hidden dependencies.

---

## Step 1 — Create a Droplet (< 2 min)

ClawHQ runs comfortably on a $6/mo Droplet. Here's the fastest path:

1. Log into DigitalOcean → **Create** → **Droplets**
2. Choose **Ubuntu 24.04 LTS** (x64)
3. Select **Basic** → **Regular** → **$6/mo** (1 vCPU, 1GB RAM)
4. Pick the datacenter closest to you
5. Add your SSH key (or use password — you can switch later)
6. **Hostname:** `clawhq-demo` (optional but helps)
7. Click **Create Droplet**

While it provisions (~45 seconds), grab your Droplet's IP from the dashboard. You'll need it in step 3.

---

## Step 2 — SSH In and Run the Installer (< 3 min)

```bash
ssh root@YOUR_DROPLET_IP
```

Then run the ClawHQ one-command installer:

```bash
curl -fsSL https://clawhq.com/install.sh | bash
```

This script does exactly one thing: installs Docker, pulls the OpenClaw image, and drops `clawhq.yaml` in `/etc/clawhq/`. Nothing else. No telemetry. No phone-home. The script is readable at that URL if you want to check it first — and you should.

When it finishes, you'll see:

```
✓ Docker installed
✓ OpenClaw image pulled
✓ clawhq.yaml written to /etc/clawhq/
✓ Run 'clawhq init' to configure your agent
```

---

## Step 3 — Configure in 60 Seconds (`clawhq init`)

```bash
clawhq init
```

The interactive setup asks five questions:

```
? Your name: Simon
? Telegram bot token: (paste from BotFather)
? Your Telegram user ID: (send /start to @userinfobot to get this)
? LLM provider [anthropic/openai]: anthropic
? API key: sk-ant-...
```

That's it. When you hit enter on the last field:

```
✓ Config written to /etc/clawhq/openclaw.json
✓ Gateway bound to loopback (secure default)
✓ ClawWall enabled
✓ Morning Brief blueprint loaded
Starting agent...
✓ OpenClaw running as system service
```

Open Telegram. Send your bot a message. You'll get a response in seconds.

---

## What Happens Next

Your agent is now running as a systemd service — it restarts automatically on reboot and recovers from crashes. You can disconnect your terminal and it keeps going.

**Day 1:** The agent has memory but no context about you yet. Send it a message introducing yourself. It'll remember.

**Day 2:** You get your first Morning Brief at 8am local time — email, weather, and any tasks you've added.

**Week 1:** You'll start noticing the compounding effect. The agent builds context over time. By Friday, it knows your patterns.

---

## Blueprints — Extend What Your Agent Does

ClawHQ includes 14 pre-built skill blueprints. After setup, you can add them one at a time:

```bash
clawhq add morning-brief     # Daily digest (already included)
clawhq add email-triage      # Inbox classification, flags, drafts
clawhq add market-scan       # Pre-market levels and setups (stocks/futures)
clawhq add meal-plan         # Nutrition-aware weekly meal planner
clawhq add news-scanner      # Interest-based news, deduplicated, signal-first
clawhq add auto-reply        # Replies in your voice, approval-gated
```

Each blueprint installs the relevant SKILL.md, cron jobs, and config defaults. Nothing executes without your confirmation.

---

## Security — What ClawHQ Does by Default

This is the part most one-click demos skip. ClawHQ ships with security defaults that OpenClaw doesn't:

**Gateway bound to loopback.** The default OpenClaw install binds to `0.0.0.0` — all interfaces. Researchers found 135,000 exposed instances this way. ClawHQ binds to `127.0.0.1` only. Remote access goes through Tailscale (recommended) or an SSH tunnel.

**ClawWall on all inbound content.** Every external input — web pages, emails, news, pasted text — passes through ClawWall before the agent sees it. It blocks prompt injection, `curl | bash` patterns, base64-encoded payloads, and eval tricks. You can see the logs at `~/.openclaw/clawwall/quarantine.log`.

**Approval gates on writes.** The agent reads autonomously and acts on clear instructions. Sending emails, deleting files, pushing code? Always requires your confirmation. The approval gate is not configurable away.

**No home directory mount.** The default Docker setup in OpenClaw documentation mounts `~` as a volume. ClawHQ mounts only `~/.openclaw/workspace`. Your SSH keys, `.env` files, and credentials stay outside the container.

---

## Cost — What Does This Actually Run?

The Droplet: **$6/month** (DigitalOcean Basic, 1GB RAM). For most personal use cases, this is plenty.

The LLM calls: depends on usage, but a typical day with morning brief + 15-20 messages runs about **$0.50–$1.50/day** on Claude Sonnet or GPT-4o. Heavier use with research and email triage runs **$3–5/day**. Set spend limits in your API dashboard to stay in control.

Total for a solo power user: **~$50–100/month** at the high end. Less if you're light on queries.

Compare that to: Superhuman ($30/mo, email only) + Notion AI ($20/mo, notes only) + various other tools for what this one agent does. The math works out fast.

---

## Cleaning Up (If You're Just Kicking the Tires)

Don't want to keep the Droplet? Destroy it in < 30 seconds:

1. DigitalOcean Dashboard → Your Droplet → **Destroy** → confirm
2. In BotFather: `/deletebot` → select your bot

No subscription. No cancellation flow. Just gone.

---

## What ClawHQ Is

ClawHQ is a blueprint layer on top of OpenClaw. It doesn't change what OpenClaw is — it gives you a pre-configured, security-hardened starting point so you skip the config marathon and go straight to having a working agent.

The repo is open source. The blueprints are readable files. If you want to understand exactly what your agent is doing, everything is documented.

Repo: [github.com/simonplant/clawhq](https://github.com/simonplant/clawhq)

---

## Troubleshooting

**"No response from my bot"**  
→ Check the agent is running: `systemctl status openclaw`  
→ Verify your Telegram user ID matches what's in the config: `cat /etc/clawhq/openclaw.json | grep allowedUsers`  

**"Got a response but it seems confused"**  
→ First run is always a blank slate. Send a message: "My name is [Name], I live in [City], and I'm using this agent for [use case]."  

**"I want to add a skill but clawhq add fails"**  
→ Run `clawhq update` first — the blueprint list updates periodically  

**"Out of memory on the 1GB Droplet"**  
→ Upgrade to the $12/mo 2GB Droplet. Most users don't need to, but heavier research workloads can push the limit.

---

*Questions? Open an issue at [github.com/simonplant/clawhq](https://github.com/simonplant/clawhq) or ping me on X [@simonplant](https://x.com/simonplant).*
