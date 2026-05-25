/**
 * Cloudflare Pages Function — PostHog reverse proxy.
 *
 * Proxies /ingest/* requests to us.i.posthog.com so analytics traffic
 * routes through the site's own domain, avoiding ad-blocker interference.
 *
 * Handles: /ingest/e/ (events), /ingest/decide/ (feature flags),
 *          /ingest/array/* (JS bundle), /ingest/engage/ (surveys).
 */

const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';

interface CFContext {
  request: Request;
  env?: { POSTHOG_HOST?: string };
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const POSTHOG_HOST = context.env?.POSTHOG_HOST || DEFAULT_POSTHOG_HOST;
  const url = new URL(context.request.url);

  // Strip the /ingest prefix to get the original PostHog path
  const posthogPath = url.pathname.replace(/^\/ingest/, '') || '/';
  const target = new URL(posthogPath + url.search, POSTHOG_HOST);

  const headers = new Headers(context.request.headers);
  headers.set('Host', new URL(POSTHOG_HOST).host);
  // Forward the real client IP so PostHog geo-locates visitors correctly.
  // Without this, every event appears to originate from a Cloudflare
  // datacenter and all location analytics are useless.
  const clientIp = context.request.headers.get('cf-connecting-ip');
  if (clientIp) headers.set('X-Forwarded-For', clientIp);
  // Remove Cloudflare-specific headers that PostHog doesn't need.
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');

  const response = await fetch(target.toString(), {
    method: context.request.method,
    headers,
    body: context.request.method !== 'GET' ? context.request.body : undefined,
  });

  // Return the proxied response with CORS headers for the JS bundle
  const responseHeaders = new Headers(response.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};
