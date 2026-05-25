# PostHog post-wizard report

The wizard has completed a deep integration of your project. PostHog was already installed and initialized in `CookieConsent.astro` with consent-gating, session recording, autocapture, and the `initSiteTracking` helper in `src/lib/analytics.ts`. Three new named events were added to the three highest-value interaction points, supplementing the existing `outbound_click`, `article_scroll_depth`, and `read_complete` tracking already in place.

**Environment variables** `PUBLIC_POSTHOG_KEY` and `POSTHOG_HOST` were written to `.env.local`.

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `contact_click` | Visitor clicks the footer email CTA — the primary conversion signal. Fires on every page with `{location: pathname}`. | `src/components/Footer.astro` |
| `blog_tag_filter` | Visitor filters blog posts by tag. Fires with `{tag: 'all' \| '<tag>'}` to reveal content interest patterns. | `src/pages/blog/index.astro` |
| `project_github_click` | Visitor clicks the GitHub link on a project detail page. Fires with `{project, github_url}`. | `src/pages/projects/[slug].astro` |

### Pre-existing events (unchanged)

| Event | Description |
|-------|-------------|
| `outbound_click` | Any outbound link click with `{href, text, location}` |
| `article_scroll_depth` | Scroll milestones (25/50/75/100%) with `{slug, depth_percent, title, content_type}` |
| `read_complete` | Full article read with `{slug, title, content_type, dwell_seconds}` |

## Next steps

We've built a dashboard and five insights to track user behavior based on the events instrumented:

- [Analytics basics dashboard](https://us.posthog.com/project/378382/dashboard/1628618)
- [Contact Intent (30d)](https://us.posthog.com/project/378382/insights/JRM4V4PX) — Bold number showing total contact intent events, the conversion signal
- [Content Read Completions](https://us.posthog.com/project/378382/insights/KC6vrPME) — Daily unique readers who finish articles
- [Outbound Link Clicks](https://us.posthog.com/project/378382/insights/p8kdNHnp) — Where readers go after engaging with content
- [Blog Tag Filter Activity](https://us.posthog.com/project/378382/insights/eFdQc6dV) — Which topics generate the most interest
- [Project GitHub Engagement](https://us.posthog.com/project/378382/insights/p3jqdVwu) — Interest in open-source projects

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
