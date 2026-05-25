/**
 * Typed analytics helpers around PostHog.
 *
 * PostHog is loaded lazily and only after consent (see CookieConsent.astro),
 * so every call site must be null-safe. `safeCapture` is the single choke point
 * for that. `window.phCapture` mirrors it for `is:inline` scripts that can't
 * import this module (e.g. ScrollDepth.astro).
 */
import type { PostHogInterface } from 'posthog-js';

declare global {
  interface Window {
    __posthog?: PostHogInterface;
    phCapture?: (event: string, properties?: Record<string, unknown>) => void;
  }
}

/** Capture an event if PostHog is loaded; no-op otherwise. */
export function safeCapture(event: string, properties?: Record<string, unknown>): void {
  window.__posthog?.capture(event, properties);
}

/**
 * Wire site-wide listeners once PostHog has initialised. Call from the
 * `loaded` callback of posthog.init(). Idempotent enough for a single page load.
 */
export function initSiteTracking(ph: PostHogInterface): void {
  window.__posthog = ph;
  window.phCapture = safeCapture;

  // Outbound link clicks — autocapture sees the click, but a labelled event
  // makes "where do people leave to" a one-line insight.
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element | null)?.closest?.('a');
      if (!link) return;
      const href = link.getAttribute('href') ?? '';
      if (!href) return;
      let isOutbound = false;
      try {
        isOutbound = new URL(href, location.href).host !== location.host;
      } catch {
        return;
      }
      if (!isOutbound) return;
      safeCapture('outbound_click', {
        href,
        text: (link.textContent ?? '').trim().slice(0, 120),
        location: location.pathname,
      });
    },
    { capture: true },
  );
}
