# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal website for Simon Plant — www.simonplant.com.

## Tech Stack

- **Astro 6** — static output (`output: 'static'`), no SSR
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin (CSS-based config, not JS)
- **TypeScript** — strict mode (extends `astro/tsconfigs/strict`)
- **PostHog analytics** — full capture, no consent gate (loads on every page load; capturing disabled only in dev)
- **Zero JS frameworks** — pure Astro components + vanilla `<script>` tags only

## Commands

```sh
npm run dev       # Dev server on localhost:4321
npm run build     # Type-check (astro check) then build to dist/
npm run preview   # Preview production build locally
```

## Architecture

- `src/layouts/Base.astro` — root HTML layout; accepts `title` and optional `description` props; loads Google Fonts (DM Serif Display, Literata, JetBrains Mono), imports global CSS, renders `Analytics`
- `src/pages/` — file-based routing (each `.astro` file = one route)
- `src/components/` — reusable Astro components
- `src/styles/global.css` — Tailwind v4 `@theme` tokens and `.prose` typography system
- `src/content/` — content collections (series, commentary, architecture) with Zod schemas in `src/content.config.ts`
- `src/content/_helpers.ts` — build-time content filtering (excludes non-published in production)
- `astro.config.mjs` — Tailwind is wired as a Vite plugin, not an Astro integration

## Design System

- **Body surface:** `--color-surface-bg` (#0a0a0f) dark background via `bg-surface-bg`, `gray-200` text, Inter sans-serif UI font
- **Prose typography:** Literata serif at 17px, line-height 1.75, max-width 720px (`.prose` class)
- **Headings:** DM Serif Display (h1–h4), weight 400, tight line-height
- **Code:** JetBrains Mono — inline code on raised surface, code blocks on `#16161e` elevated dark surface
- **Accent color:** primary amber/gold scale (#d4a853 base) — used for links, blockquote borders, inline code
- **Fonts loaded via Google Fonts** in `Base.astro` `<head>`, not npm packages

### Theme Tokens (`global.css`)

```
--font-serif        DM Serif Display (headings)
--font-sans         Inter (UI)
--font-prose        Literata (body reading)
--font-mono         JetBrains Mono (code)
--color-primary     amber/gold scale (50–900, base #d4a853)
--color-surface-*   dark surface hierarchy (bg, card, elevated)
--color-text-*      text hierarchy (primary, secondary, muted)
--color-border-*    border treatments (subtle, default)
```

## Key Conventions

- Tailwind v4 uses `@theme` blocks in CSS for customization — there is no `tailwind.config.js`
- PostHog is lazy-loaded via dynamic `import()` in `Analytics.astro` on every page load (full capture; no consent gate — capturing disabled only in dev)
- Environment variables: `PUBLIC_POSTHOG_KEY` (client, bundled) and `POSTHOG_HOST` (server-only `/ingest` proxy target, optional) — see `.env.example`
- PostHog auto-disables capturing in dev mode
- All new pages must use `Base.astro` layout and pass a `title` prop
- Long-form content pages should wrap body content in a `<div class="prose">` container

## Git Workflow

**Everyone commits directly to `main`. The publishing gate is the real guardrail.**

This is a solo personal website. The load-bearing control is the `status: published` frontmatter field — only `simonplant` can set it, and the `content-validation` CI workflow enforces that. Nothing reaches production until that flag flips, so PR ceremony doesn't add safety. Agents (Clawdius, aishore sprint agents, any Claude Code session) can commit and push directly to `main` just like the owner. PRs remain available when they're genuinely useful (large structural changes, visual review), but they're not required for routine content work.

**Hard rules for everyone:**

- Never force-push `main`
- Never commit secrets (use `.env`, which is gitignored)
- Never bypass pre-commit hooks with `--no-verify`
- Never set `status: published` unless you are `simonplant` — this is the approval gate

## Content Pipeline

Content lives in `src/content/` with collections defined in `src/content.config.ts`:

- **series** — long-form installments (number, title, tags, companion artifacts)
- **commentary** — short-form posts (title, date, tags, description)
- **architecture** — structured KB entries (concern, pattern type, tags, description)

### Editorial Workflow

| Status      | Meaning                          | Builds in prod? | Who can set |
| ----------- | -------------------------------- | --------------- | ----------- |
| `idea`      | Placeholder                      | No              | Anyone      |
| `draft`     | Being written                    | No              | Anyone      |
| `review`    | Ready for Simon's editorial pass | No              | Anyone      |
| `published` | Live on site                     | Yes             | Simon only  |

Use `getPublishedEntries()` from `src/content/_helpers.ts` to filter content at build time.

### Content Agent Rules (Clawdius)

Clawdius is the primary content producer. He operates under strict constraints:

**CAN do:**

- Create/edit files in `src/content/commentary/`, `src/content/series/`, `src/content/architecture/`
- Set status to: `idea`, `draft`, `review`
- Commit and push directly to `main`
- Open PRs when useful (optional — for visual review of large drafts, not required)

**CANNOT do:**

- Touch any file outside `src/content/`
- Set `status: published` — only `simonplant` can promote to production

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

<!-- This section is managed by aishore and will be overwritten on `aishore update`. -->

<!-- Customizations here will be lost. Add project-specific instructions above this section. -->

<!-- This section is managed by aishore and will be overwritten on `aishore update`. -->

<!-- Customizations here will be lost. Add project-specific instructions above this section. -->

<!-- This section is managed by aishore and will be overwritten on `aishore update`. -->

<!-- Customizations here will be lost. Add project-specific instructions above this section. -->

<!-- This section is managed by aishore and will be overwritten on `aishore update`. -->

<!-- Customizations here will be lost. Add project-specific instructions above this section. -->

<!-- This section is managed by aishore and will be overwritten on `aishore update`. -->

<!-- Customizations here will be lost. Add project-specific instructions above this section. -->

<!-- This section is managed by aishore and will be overwritten on `aishore update`. -->

<!-- Customizations here will be lost. Add project-specific instructions above this section. -->

## Sprint Orchestration (aishore)

This project uses aishore for autonomous sprint execution. Backlog lives in `backlog/`, tool lives in `.aishore/`.

**Agent rules (mandatory):**

- **Core before features.** The working core — the primary end-to-end path — must pass before feature work proceeds. Check the item's `track` field: `core` items build the foundation; `feature` items decorate it.
- **Intent is the north star.** Every item has a commander's intent field. When steps or AC are ambiguous, follow intent.
- **Prove it runs.** Wire code to real entry points. If the build command exists, run it. If a verify command exists, execute it. Working code that's reachable beats tested code that's isolated.
- **No mocks or stubs** in production code unless the item explicitly requests them.
- **Stay in scope.** Implement only the assigned item. Don't fix unrelated code, add unrequested features, or refactor surrounding code.
- **Commit before signaling.** Always commit with a meaningful message before writing result.json.

**Typical flow:** `init` → `refine` (fill PRODUCT.md) → `backlog populate` → `groom` → `run`

```bash
.aishore/aishore run [N|ID|scope]    # Run sprints (scope: done, p0, p1, p2)
.aishore/aishore groom              # Groom backlog items (AI adds steps, AC, priority)
.aishore/aishore scaffold           # Establish working core, detect fragment risk
.aishore/aishore review             # Architecture review
.aishore/aishore status             # Backlog overview
```
