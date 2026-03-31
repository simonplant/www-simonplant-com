# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal website for Simon Plant — www.simonplant.com.

## Tech Stack

- **Astro 6** — static output (`output: 'static'`), no SSR
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin (CSS-based config, not JS)
- **TypeScript** — strict mode (extends `astro/tsconfigs/strict`)
- **PostHog analytics** — consent-gated, GDPR-compliant (loads only after user accepts)
- **Zero JS frameworks** — pure Astro components + vanilla `<script>` tags only

## Commands

```sh
npm run dev       # Dev server on localhost:4321
npm run build     # Type-check (astro check) then build to dist/
npm run preview   # Preview production build locally
```

## Architecture

- `src/layouts/Base.astro` — root HTML layout used by all pages; accepts `title` and optional `description` props; imports global CSS and renders `CookieConsent` at end of body
- `src/pages/` — file-based routing (each `.astro` file = one route)
- `src/components/` — reusable Astro components
- `src/styles/global.css` — Tailwind v4 `@theme` config: custom `primary` color scale (#b86b3a), DM Serif Display (serif) + Geist Sans (sans) fonts
- `astro.config.mjs` — Tailwind is wired as a Vite plugin, not an Astro integration

## Key Conventions

- Tailwind v4 uses `@theme` blocks in CSS for customization — there is no `tailwind.config.js`
- PostHog is lazy-loaded via dynamic `import()` in `CookieConsent.astro` — it never loads without consent
- Environment variables: `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST` (see `.env.example`)
- PostHog auto-disables capturing in dev mode
- All new pages must use `Base.astro` layout and pass a `title` prop

## Content Pipeline

Content lives in `src/content/` with a status-based editorial workflow:

| Status | Meaning | Builds in prod? | Who can set |
|--------|---------|-----------------|-------------|
| `idea` | Placeholder | No | Anyone |
| `draft` | Being written | No | Anyone |
| `review` | Ready for Simon's editorial pass | No | Anyone |
| `published` | Live on site | Yes | Simon only |

### Content Agent Rules (Clawdius)

Clawdius is the primary content producer. He operates under strict constraints:

**CAN do:**
- Create/edit files in `src/content/commentary/`, `src/content/series/`, `src/content/architecture/`
- Set status to: `idea`, `draft`, `review`
- Create branches named `content/<description>`
- Open PRs with max 3 content pieces

**CANNOT do:**
- Push to main
- Touch any file outside `src/content/`
- Set `status: published`
- Open a PR while another content PR is unreviewed
- Merge his own PRs

**Content quality bar:**
- Write as Simon — direct, opinionated, historically grounded, systems-oriented
- Every piece must be grounded in real work, real decisions, real code
- No generic "AI is transforming..." filler
- No fabricated benchmarks, dates, or project details
- If unsure about a fact, flag it with `[VERIFY]` inline
- Commentary: 300-800 words, externally triggered, tagged
- Series: 1,500-3,000 words, follows the planned arc, ships with companion artifacts where appropriate
- Architecture KB: structured record template (problem, when to use, how it works, trade-offs, related patterns)

### CI Enforcement

The `content-validation` workflow enforces:
- Scope restriction: content PRs can only touch `src/content/`
- Publishing gate: only `simonplant` can set `status: published`
- Batch limit: max 3 new content pieces per PR
- Frontmatter validation: required fields (title, description, status, tags) and valid status values

## Sprint Orchestration (aishore)

Iterative intent-based development with evals. Backlog lives in `backlog/`, tool lives in `.aishore/`. Run `.aishore/aishore help` for full usage.

```bash
.aishore/aishore run [N|ID]         # Run sprints (branch, commit, merge, push per item)
.aishore/aishore groom [--backlog]  # Groom bugs or features
.aishore/aishore review             # Architecture review
.aishore/aishore status             # Backlog overview
```
