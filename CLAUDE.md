# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal website for Simon Plant — www.simonplant.com.

## Tech Stack

- **Astro 6** — static output, no SSR
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin (CSS-based config, not JS)
- **TypeScript** — strict mode
- **PostHog analytics** — consent-gated, GDPR-compliant (loads only after user accepts)
- **Zero JS frameworks** — pure Astro components + vanilla `<script>` tags only

## Commands

```sh
npm run dev       # Dev server on localhost:4321
npm run build     # Type-check (astro check) then build to dist/
npm run preview   # Preview production build locally
```

## Architecture

- `src/layouts/Base.astro` — root HTML layout used by all pages; imports global CSS and cookie consent
- `src/pages/` — file-based routing (each `.astro` file = one route)
- `src/components/` — reusable Astro components
- `src/styles/global.css` — Tailwind v4 config: custom `primary` color scale (#b86b3a), DM Serif Display (serif) + Geist Sans (sans) fonts

## Key Conventions

- Tailwind v4 uses `@theme` blocks in CSS for customization — there is no `tailwind.config.js`
- PostHog is lazy-loaded via dynamic `import()` in `CookieConsent.astro` — it never loads without consent
- Environment variables: `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST` (see `.env.example`)
- PostHog auto-disables capturing in dev mode
