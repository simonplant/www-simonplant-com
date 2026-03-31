# SITE_PLAN.md

**Personal site for Simon — AI infrastructure architect, builder, and writer.**

---

## Mission

Build a personal site that establishes me as a leading voice in AI agent infrastructure — the lifecycle management, operations, security, and tooling layer that sits between raw AI models and production agent deployments. The site is the public surface of work I'm already doing. It attracts collaboration, advisory opportunities, and community engagement by demonstrating depth, not by marketing.

---

## Positioning

AI agent infrastructure is going through the same maturation arc that cloud infrastructure did a decade ago. The same patterns apply — lifecycle management, operational tooling, security hardening, configuration governance. Nobody owns this narrative. I do, because I'm building the tooling (ClawHQ, AIShore, Clawdius) and I have the historical lens (RightScale/AWS/OpenStack era) to see where it's heading.

The site speaks to AI engineers deploying agents in production, platform teams evaluating agent orchestration, technical founders navigating the ops layer, and indie builders in the OpenClaw ecosystem.

The voice is direct, opinionated, systems-oriented, and historically grounded. Not academic, not corporate, not tutorial-mill. A practitioner-architect documenting real decisions as they happen.

---

## Content Tracks

The site has three distinct content tracks.

### The Flagship Series

A named, numbered series of 20-30 installments walking through the AI agent infrastructure maturation pattern. Each installment leads with the industry-level problem, then grounds it in a concrete implementation using ClawHQ as the worked example.

This is the primary publishing commitment — what people subscribe for. Each installment is 1,500-3,000 words, published weekly to biweekly. The arc maps to the full agent lifecycle surface: provisioning, configuration, hardening, identity and personality, orchestration, observability, lifecycle management, and evolution. Framed as industry patterns, not product documentation.

Where appropriate, installments ship with a companion artifact — a checklist, template, comparison matrix, or decision framework — hosted on GitHub as a reusable resource.

Production is agent-assisted. The series arc is planned upfront with per-installment briefs. A content agent drafts from structured inputs (architecture decision records, project notes, research). I review, refine, inject opinion, and approve. This prevents the "publish 15 and fade" pattern by maintaining production through deep-work sprints.

### Commentary

Short-form, opinionated takes on AI infrastructure developments. Externally triggered by releases, security disclosures, architectural decisions, papers, or bad takes worth correcting. 300-800 words, tagged by topic. Published as events warrant, roughly 2-4 times per month.

This track keeps the site alive between series installments and provides social media surface area.

### Architecture Knowledge Base

A personal repository of solutions, patterns, use cases, and fit-for-purpose matching. Written for my own retrieval, public by default. Not articles — structured records with a consistent format:

- Pattern name and status (draft / working / stable)
- Problem it solves
- When to use and when not to use
- How it works
- Trade-offs
- Related patterns and cross-links
- Source and evidence

Browsable by concern (deployment, configuration, security, orchestration, identity, observability, lifecycle, methodology), by pattern type (reference architecture, design pattern, anti-pattern, decision framework, comparison), and by fit-for-purpose matching.

No publishing schedule. Updated when I learn something, build something, or change my mind. Grows organically — categories emerge from accumulated entries, not from a pre-declared taxonomy.

### How They Connect

The series provides narrative depth. The architecture KB provides lookup-optimized reference. Commentary provides fresh topicality. Tags work across all three. A tag like `agent-security` connects a series installment, several commentary posts, and the relevant KB entries. The series and KB cross-link — the series installment is the essay version, the KB entry is the terse record, covering overlapping ground for different purposes.

---

## Site Structure

### Home ( / )

Thesis statement, latest series installment, latest commentary, subscribe CTA. One screen. Answers who I am, what I believe, and why it matters.

### Start Here ( /start-here )

Curated entry point for first-time visitors. Organized by interest area — if you care about agent security, start here; if you care about orchestration, start there; if you want the full thesis, read the series from #1. Updated quarterly as content accumulates.

### Series ( /series )

Landing page showing the full arc with all installments. Each installment is its own page with clear title, number, reading time, the content, companion artifact links, related KB entries, previous/next navigation, and subscribe CTA.

### Commentary ( /commentary )

Reverse-chronological feed, tagged, filterable.

### Architecture ( /architecture )

Overview page with a growing collection of structured entries, browsable by concern, pattern type, or fit-for-purpose. Each entry follows the standard record template.

### Projects ( /projects )

One page per active project — ClawHQ, AIShore, Clawdius. Each includes what it is, what problem it solves, current status, architecture context, links to relevant series installments and KB entries, companion artifacts, and GitHub link.

### Talks ( /talks )

Minimal at launch. Grows as speaking opportunities emerge. The series installments are natural talk proposals.

### About ( /about )

One screen. The narrative arc (cloud infrastructure to AI infrastructure), what I'm building and why, "available for advisory and collaboration" with contact details, and a colophon describing how the site is built.

### Newsletter ( /newsletter )

Named newsletter with its own landing page, description of what subscribers receive, and signup form. The newsletter has original editorial context, not just links to recent posts.

### Changelog ( /changelog )

Lightweight dated entries — what shipped, what was published, what changed. Low effort, possibly auto-generated from Git activity.

---

## Distribution

### Months 1-6: Cold Start

No existing audience means distribution must be built deliberately through community contribution and relationship-building.

- Contribute to OpenClaw documentation and community before self-promoting
- Engage thoughtfully with established voices in AI infrastructure — comment on their work, link to them, contribute where useful
- Publish 2-3 pieces specifically designed for community utility — reference guides, comparison matrices, "the missing docs" for OpenClaw features
- Build relationships with 10-15 people who already have audiences in this space
- Submit utility-focused and strong-thesis pieces to HN selectively (1-2 per month)
- On X, engage in existing conversations rather than broadcasting into the void

### Month 6+: Steady State

- Every series installment gets a distilled thread on X
- Strong-thesis installments get submitted to HN
- Commentary goes to X directly
- GitHub READMEs link to relevant site content
- Newsletter grows through content quality and organic discovery
- Cross-reference density across the site builds internal discovery and SEO value

---

## Visitor Journey

### First Visit

Arrives from HN, X, or search. Reads one piece. Every page offers a clear next step: subscribe, explore related content, or visit /start-here for orientation.

### Return Visit

Home page makes it immediately clear what's new since last time. Latest installment, latest commentary, changelog activity.

### Opportunity Path

Someone wants to collaborate or hire. /about has an explicit availability statement and contact details. The depth of the KB and the quality of the series is the pitch — the contact info is just the door.

### What the Site Does Not Do

No pop-up modals, no subscribe gates, no testimonial carousels, no chat widgets, no "services" pages. Nothing that signals marketing to a developer audience.

---

## Design Principles

- Fast load, no hero images, no JavaScript required to read text
- Clean typography, generous line height, readable on mobile
- Dark mode required
- Code blocks with syntax highlighting and copy buttons
- Minimal chrome, maximum content — more typeset document than web application
- No animations, no parallax, no scroll-jacking
- Every page answers within 5 seconds: what will I learn here and is it worth my time

---

## Production Cadence

### Minimum Viable Floor

- Series: 1 installment per week (agent-drafted, I edit)
- Commentary: 2-4 per month (externally triggered)
- Architecture KB: no schedule, updated on discovery
- Changelog: continuous, near-zero effort

Fewer than 2 published pieces of any kind per month is below the viability threshold.

### The Agent Pipeline

The content agent drafts from structured inputs — architecture decision records, GitHub activity, research notes, flagged external events, and the pre-planned series arc. I provide raw material and editorial judgment. The agent handles drafting and structuring. I review, refine, and approve.

The series arc is designed upfront with 20-30 installment briefs, classified by distribution potential. The editorial backlog is front-loaded, not improvised.

---

## Phasing

### Launch (Day 1)

- Home page with thesis
- /about with narrative and contact
- 3-5 published pieces (opening series installments or utility content)
- Clean reading experience, dark mode, mobile-friendly
- Newsletter/RSS signup live
- GitHub profile updated

### Months 1-3

- Series cadence established
- Agent pipeline operational
- Commentary track active
- Cold-start distribution underway
- /start-here created
- First companion artifacts on GitHub

### Months 3-6

- Architecture KB growing (10+ entries)
- KB taxonomy self-organizing from accumulated content
- Newsletter developing its own editorial voice
- First talk proposal submitted
- Social presence growing through engagement

### Month 6+

- Series arc substantially complete
- Architecture KB is a genuine reference (30+ entries)
- Distribution shifts from cold-start to content flywheel
- Inbound advisory and collaboration inquiries
- Quarterly measurement and course correction active

---

## Success Criteria

**At 6 months**: 20+ series installments published. 15+ KB entries. 200+ newsletter subscribers. At least one piece with meaningful visibility (HN front page or equivalent). Organic inbound from people who found the site.

**At 12 months**: Series arc complete or near-complete. 30+ KB entries forming a real reference resource. 500+ newsletter subscribers. At least one talk given. Advisory or collaboration inquiry from site discovery. Recognized as a distinct voice in AI infrastructure discourse.

---

## Open Decisions

- Series name
- Newsletter name
- Series arc: specific installment topics and sequencing
- Technology stack
- Domain name
- Visual design
- Agent pipeline specifics
- Whether to include guest perspectives or interviews over time
