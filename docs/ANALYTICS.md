# Analytics

PostHog, full capture, no consent gate. Ingestion is proxied through `/ingest`
(`functions/ingest/[[path]].ts`), which forwards the client IP for geolocation.

- Client config: `src/components/Analytics.astro`
- Capture helper: `src/lib/analytics.ts` (`safeCapture`, `window.phCapture`)
- Provisioning: `scripts/posthog-dashboard.mjs`

## Commands

| Command | Purpose | Required key scope |
|---------|---------|--------------------|
| `npm run posthog:dashboard` | Create/update the Web Analytics dashboard (idempotent) | `insight:write`, `dashboard:write`, `project:write` |
| `npm run annotate -- "<text>"` | Add a timeline annotation | `annotation:write` |
| `npm run utm -- <url> <source> [campaign]` | Generate a UTM-tagged link | none |

Personal API key and config live in `.env.local` (gitignored).

## Dashboard tiles

Pageviews · unique visitors · sessions · top pages · top referrers · traffic by
UTM source · outbound clicks · scroll-depth distribution · reads completed (by
content type and by article) · code copies · Core Web Vitals (p75) · pageview→read
funnel · user paths · tag filters used.

## Custom events

`article_scroll_depth`, `read_complete`, `outbound_click`, `code_block_copied`,
`blog_tag_filter`, `architecture_tag_filter`, `contact_click`,
`project_github_click`.

## Session replay

100% sampling, no minimum duration, network payloads on. Password inputs masked
(rrweb default); other inputs and full URLs captured. Filter recordings by event
(`read_complete`, `outbound_click`, `blog_tag_filter`) in the PostHog UI.

## Notes

- Scheduled email digests require a paid PostHog plan; unavailable on the free tier.
- Capturing is disabled in dev (`import.meta.env.DEV`).
