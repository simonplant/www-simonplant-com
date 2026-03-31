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

## Sprint Orchestration (aishore)

Iterative intent-based development with evals. Backlog lives in `backlog/`, tool lives in `.aishore/`. Run `.aishore/aishore help` for full usage.

```bash
.aishore/aishore run [N|ID]         # Run sprints (branch, commit, merge, push per item)
.aishore/aishore groom [--backlog]  # Groom bugs or features
.aishore/aishore review             # Architecture review
.aishore/aishore status             # Backlog overview
```
