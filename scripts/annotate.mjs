#!/usr/bin/env node
/**
 * Drop a timeline annotation on PostHog so traffic spikes have context
 * ("Published X", "Posted to HN"). Annotations show on every insight's time
 * axis, turning a mystery bump into an explained one.
 *
 * Usage:
 *   npm run annotate -- "Published: The cPanel Moment"
 *   npm run annotate -- "Posted clawhq to HN"
 *   DRY_RUN=1 npm run annotate -- "test"
 *
 * Env: POSTHOG_PERSONAL_API_KEY (scope: annotation:write), POSTHOG_API_HOST,
 *      POSTHOG_PROJECT_ID (optional). Loaded from .env.local via npm script.
 */

const API_HOST = (process.env.POSTHOG_API_HOST || 'https://us.posthog.com').replace(/\/$/, '');
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const DRY = process.env.DRY_RUN === '1';

if (!KEY) {
  console.error('POSTHOG_PERSONAL_API_KEY required (scope: annotation:write).');
  process.exit(1);
}

const content = process.argv.slice(2).join(' ').trim();
if (!content) {
  console.error('Usage: npm run annotate -- "Published: The cPanel Moment"');
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(`${API_HOST}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

(async () => {
  const projectId = process.env.POSTHOG_PROJECT_ID || (await api('/api/projects/')).results[0].id;
  if (DRY) {
    console.log(`~ would annotate (project ${projectId}): "${content}"`);
    return;
  }
  const a = await api(`/api/projects/${projectId}/annotations/`, {
    method: 'POST',
    body: JSON.stringify({ content, date_marker: new Date().toISOString(), scope: 'project' }),
  });
  console.log(`✓ annotated "${content}" @ ${a.date_marker}`);
})().catch((err) => {
  if (/-> 403/.test(err.message)) {
    console.error('Failed: key lacks annotation:write scope. Add it at https://us.posthog.com/settings/user-api-keys');
  } else {
    console.error('Failed:', err.message);
  }
  process.exit(1);
});
