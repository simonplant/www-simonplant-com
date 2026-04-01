# www.simonplant.com

Personal website for Simon Plant — editorial platform for long-form series, commentary, and architecture knowledge base.

## Tech Stack

- [Astro](https://astro.build) 6 — static site generation, zero JS frameworks
- [Tailwind CSS](https://tailwindcss.com) v4 — CSS-based config via `@theme`
- TypeScript — strict mode
- PostHog analytics — consent-gated, GDPR-compliant

## Development

```sh
npm install
npm run dev       # localhost:4321
npm run build     # type-check + build
npm run preview   # preview production build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your PostHog credentials:

```
PUBLIC_POSTHOG_KEY=phc_...
PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Architecture

```
src/
├── components/       # Reusable Astro components
├── content/          # Content collections (series, commentary, architecture)
│   ├── series/       # Long-form installments
│   ├── commentary/   # Short-form posts
│   ├── architecture/ # Structured KB entries
│   └── _helpers.ts   # Build-time content filtering
├── content.config.ts # Zod schemas for content collections
├── layouts/
│   └── Base.astro    # Root layout (fonts, meta, cookie consent)
├── pages/            # File-based routing
└── styles/
    └── global.css    # Tailwind v4 @theme tokens + .prose typography
```

## Design

Dark-first editorial design. Literata serif for prose, DM Serif Display for headings, JetBrains Mono for code. Amber/gold accent color scale. Fonts loaded via Google Fonts.

## Content Workflow

Content uses a status-based editorial pipeline: `idea` → `draft` → `review` → `published`. Only `published` entries build in production. See [CLAUDE.md](CLAUDE.md) for full content agent rules and CI enforcement.

## License

All rights reserved.
