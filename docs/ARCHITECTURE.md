# Architecture — www.simonplant.com

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Astro 6** | Static output (`output: 'static'`), no SSR |
| Styling | **Tailwind CSS v4** | Via `@tailwindcss/vite` plugin, CSS-based config (`@theme`), no `tailwind.config.js` |
| Language | **TypeScript** | Strict mode (extends `astro/tsconfigs/strict`) |
| Analytics | **PostHog** | Consent-gated, GDPR-compliant, lazy-loaded via dynamic `import()` |
| Fonts | **DM Serif Display** (serif headings), **Geist Sans** (body) | Google Fonts, preconnected |
| JS Frameworks | **None** | Pure Astro components + vanilla `<script>` tags only |

### Why These Choices

- **Astro** — content-heavy site with zero client JS by default. Islands architecture available if interactive components are ever needed, but the design principle is no JS required to read.
- **Tailwind v4** — CSS-native configuration via `@theme` blocks. No build-time config file. Collocates design tokens with the stylesheet.
- **No frameworks** — every framework byte is a tax on a site whose job is to serve text. Vanilla `<script>` for the rare interactive element (cookie consent, copy buttons, search).
- **Static output** — content changes at publish time, not request time. Deploy anywhere (CDN, S3, Netlify, Vercel). Maximum cache-ability.

## Project Structure

```
├── src/
│   ├── content/           # Content collections (series, commentary, architecture, products)
│   └── content.config.ts  # Collection schemas (Zod-validated, Astro 6 root-level)
│   ├── components/        # Reusable Astro components
│   │   └── CookieConsent.astro
│   ├── layouts/
│   │   └── Base.astro     # Root HTML layout (all pages)
│   ├── pages/             # File-based routing
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── series/        # Landing + [slug] detail pages
│   │   ├── commentary/    # Feed + [slug] detail pages
│   │   ├── architecture/  # KB landing + [slug] entries
│   │   ├── products/      # Ecosystem + [slug] product pages
│   │   └── ...
│   └── styles/
│       └── global.css     # Tailwind v4 @theme config (colors, fonts)
├── docs/
│   ├── ARCHITECTURE.md    # This file
│   └── SITE_PLAN.md       # Product strategy and content plan
├── backlog/               # Aishore sprint backlog
│   ├── backlog.json       # Feature items
│   ├── bugs.json          # Bug/tech debt items
│   └── archive/           # Sprint history and regression suite
├── .aishore/              # Sprint orchestration tooling
└── astro.config.mjs       # Astro config (Tailwind as Vite plugin)
```

## Content Architecture

The site has four content tracks, each as an Astro content collection:

### Series
Flagship numbered series on AI agent infrastructure maturation. 1,500–3,000 words per installment, published weekly to biweekly. Each may ship with companion artifacts (checklists, templates, decision frameworks).

### Commentary
Short-form opinionated takes (300–800 words), externally triggered. Reverse-chronological feed, tagged, filterable.

### Architecture Knowledge Base
Structured pattern records — not articles. Each entry follows a standard template: pattern name, status (draft/working/stable), problem, when to use, how it works, trade-offs, related patterns, source. Browsable by concern and pattern type.

### Products
Data-driven product pages for the ecosystem: ClawHQ, AIShore, Easy Markdown, Clawdius. Each with problem statement, architecture context, status, and GitHub link. Overview page shows how they fit together in the agent infrastructure lifecycle.

### Cross-Cutting
- **Tags** span all tracks — a tag like `agent-security` connects series installments, commentary, and KB entries
- **Search** indexes all tracks via client-side full-text search (build-time index)
- **RSS** covers series and commentary

## Key Design Decisions

### Dark-First Design
Dark mode is the only mode. Very dark blue-black backgrounds (#0a0a0f–#111118 range), off-white text, amber/warm gold accent (#d4a853 range) used sparingly for links, CTAs, and code highlights. Light mode is not planned. Rationale: 82% of the target audience uses dark mode, and the restrained palette signals craftsmanship — "forged, not vibed." Avoids electric blue (cybersecurity template), purple gradients (AI startup 2024), and neon green (hacker aesthetic).

### Editorial Typography
Body prose uses Literata (TypeTogether, designed for Google Play Books — optimized for screen readability) — almost no one in AI tooling does this. It signals "this person thinks carefully about what they write." Headings use DM Serif Display. Code uses a monospace (JetBrains Mono or similar). UI elements use Inter or system-ui sans-serif. Three font roles, clearly separated. The homepage reads as an editorial masthead, not a SaaS landing page.

### No Client JS by Default
Every page must be readable with JavaScript disabled. Interactive enhancements (search, copy buttons, cookie consent) are progressive — they add convenience but never gate content. Rationale: fast load, no hero images, no JS required to read text.

### Content Collections Over MDX
Astro content collections with Zod schemas provide type-safe frontmatter validation at build time. Prefer `.md` over `.mdx` unless a specific page needs interactive components. Rationale: simpler toolchain, faster builds, content authors don't need to know JSX.

### Static Over Dynamic
No SSR, no API routes, no database. Content changes at publish time. If dynamic features are ever needed (newsletter signup, comments), they connect to external services via client-side JS or form actions to third-party endpoints. Rationale: maximum performance, zero server costs, deploy-anywhere.

### Products as Data, Not Hardcoded Pages
Product information lives in a content collection or structured data file, rendered through dynamic routes (`[slug].astro`). Adding a product means adding a data entry, not creating a new page. Rationale: maintainability as the ecosystem grows.

### Design Tokens in CSS
All design decisions (colors, fonts, spacing, surfaces) are defined as Tailwind v4 `@theme` tokens in `global.css`. Components reference tokens, never raw values. Rationale: single source of truth, easy to evolve the visual language.

## Conventions

### Pages
- Every page uses `Base.astro` layout and passes a `title` prop
- Navigation and footer render on every page via the layout
- Every page answers within 5 seconds: what will I learn here and is it worth my time

### Components
- Astro components only — no React, Vue, Svelte, or other framework components
- Interactive behavior via vanilla `<script>` tags with `is:inline` or standard module scripts
- No component libraries or UI kits — everything is built from Tailwind utilities

### Styling
- Tailwind v4 utility classes, extended via `@theme` blocks in CSS
- No `tailwind.config.js` — all customization in `global.css`
- Prose/long-form content uses a dedicated prose styling system (not `@tailwindcss/typography` unless it supports v4)

### Analytics
- PostHog loads only after explicit user consent (GDPR)
- Auto-disables capturing in dev mode
- Environment variables: `PUBLIC_POSTHOG_KEY`, `PUBLIC_POSTHOG_HOST`

### Performance
- Target: Lighthouse 95+ on all four categories
- Zero cumulative layout shift
- Sub-100KB page weight for content pages
- No render-blocking resources beyond critical CSS
- Fonts preconnected, display=swap

## Decided

- **Search** — Pagefind (build-time static index, zero JS cost until activated, Cmd/Ctrl+K overlay)
- **Color direction** — Dark-primary (#0a0a0f–#111118) with amber/gold accent (#d4a853 range)
- **Typography** — Editorial serif for prose (Source Serif 4 / Literata / Newsreader), DM Serif Display headings, monospace code, sans-serif UI
- **Font loading** — Geist Sans removed; replaced with reading serif + Inter/system-ui for UI

## Open Technical Decisions

- ~~Reading serif choice~~ — **Literata** (TypeTogether, designed for screen readability, wide and clean on dark backgrounds)
- **Newsletter provider** — external service TBD (buttondown, convertkit, resend)
- **Hosting/deployment** — CDN target not yet chosen (Cloudflare Pages, Netlify, Vercel)
- **Companion artifact hosting** — GitHub repo structure for checklists/templates
