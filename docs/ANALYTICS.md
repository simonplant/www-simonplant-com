# Analytics workflow

Full-capture PostHog (no consent gate). Ingestion is proxied through
`/ingest` (a Cloudflare Pages Function that forwards the client IP for geo).
Client config lives in `src/components/Analytics.astro`; the typed capture
helper is `src/lib/analytics.ts`.

## Dashboard

The **Web Analytics** dashboard is provisioned as code — re-run to create or
update it (idempotent):

```sh
npm run posthog:dashboard
```

Tiles: pageviews / unique visitors / sessions, top pages, top referrers,
traffic by UTM source, outbound clicks, scroll-depth distribution, reads
completed (by content type **and** by article), code copies, Core Web Vitals,
the pageview→read funnel, **user paths**, and **tag filters used**.

## Annotate the timeline

Drop a marker so traffic spikes have context (requires `annotation:write` on
the personal API key):

```sh
npm run annotate -- "Published: The cPanel Moment"
npm run annotate -- "Posted clawhq to HN"
```

Annotations appear on every insight's time axis — turning a mystery bump into
an explained one. Run it whenever you publish or promote.

## Promotion links

Always UTM-tag shared links with canonical sources (see `docs/PROMOTION.md`):

```sh
npm run utm -- https://www.simonplant.com/projects/clawhq hn clawhq-launch
```

## Watching replays (no setup — just how to look)

At low traffic, watch the *right* sessions instead of all of them. In PostHog →
Session replay, filter recordings by event:

- `read_complete` → people who actually finished an article
- `outbound_click` → people who left to somewhere (and where)
- `blog_tag_filter` → people exploring by topic

That's where the signal is. Aggregate tiles tell you *what*; replays tell you
*why*.

## Not enabled

- **Scheduled email digests** — a paid PostHog feature; unavailable on the free
  tier. Check the dashboard manually, or upgrade if you want Monday emails.
