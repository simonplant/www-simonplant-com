/**
 * Cloudflare Pages Function — PostHog reverse proxy.
 *
 * Proxies /ingest/* requests to us.i.posthog.com so analytics traffic
 * routes through the site's own domain, avoiding ad-blocker interference.
 *
 * Handles: /ingest/e/ (events), /ingest/decide/ (feature flags),
 *          /ingest/array/* (JS bundle), /ingest/engage/ (surveys).
 */

const POSTHOG_HOST = 'https://us.i.posthog.com';

interface CFContext {
  request: Request;
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const url = new URL(context.request.url);

  // Strip the /ingest prefix to get the original PostHog path
  const posthogPath = url.pathname.replace(/^\/ingest/, '') || '/';
  const target = new URL(posthogPath + url.search, POSTHOG_HOST);

  const headers = new Headers(context.request.headers);
  headers.set('Host', new URL(POSTHOG_HOST).host);
  // Remove Cloudflare-specific headers that PostHog doesn't need
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
