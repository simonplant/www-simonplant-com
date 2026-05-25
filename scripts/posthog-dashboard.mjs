#!/usr/bin/env node
/**
 * Provision the "Web Analytics" PostHog dashboard for www.simonplant.com.
 *
 * Idempotent: re-running finds the dashboard and its tiles by name and PATCHes
 * them rather than creating duplicates. Builds insights from both PostHog's
 * standard events ($pageview, $web_vitals) and the site's custom events
 * (outbound_click, article_scroll_depth, read_complete, code_block_copied).
 *
 * Usage:
 *   POSTHOG_PERSONAL_API_KEY=phx_xxx node scripts/posthog-dashboard.mjs
 *   DRY_RUN=1 POSTHOG_PERSONAL_API_KEY=phx_xxx node scripts/posthog-dashboard.mjs
 *
 * Env:
 *   POSTHOG_PERSONAL_API_KEY  (required) personal API key, scopes:
 *                             dashboard:write, insight:write, project:read
 *   POSTHOG_API_HOST          default https://us.posthog.com (EU: https://eu.posthog.com)
 *   POSTHOG_PROJECT_ID        optional; auto-detected if the key sees one project
 *   DRY_RUN=1                 print the plan, make no changes
 *
 * The personal API key is NOT the site's PUBLIC_POSTHOG_KEY — create one at
 * https://us.posthog.com/settings/user-api-keys. Never commit it.
 */

const API_HOST = (process.env.POSTHOG_API_HOST || 'https://us.posthog.com').replace(/\/$/, '');
const KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const DRY = process.env.DRY_RUN === '1';
const DASHBOARD_NAME = 'Web Analytics';

if (!KEY) {
  console.error('Error: POSTHOG_PERSONAL_API_KEY is required.');
  console.error('Create one at https://us.posthog.com/settings/user-api-keys (scopes: dashboard:write, insight:write, project:read).');
  process.exit(1);
}

async function api(path, opts = {}) {
  const res = await fetch(`${API_HOST}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status} ${res.statusText}\n${body}`);
  }
  return res.status === 204 ? null : res.json();
}

// --- query builders (PostHog InsightVizNode schema) -------------------------

const ev = (event, math = 'total', extra = {}) => ({ kind: 'EventsNode', event, name: event, math, ...extra });

const trend = (series, source = {}) => ({
  kind: 'InsightVizNode',
  source: { kind: 'TrendsQuery', series, interval: 'day', dateRange: { date_from: '-30d' }, ...source },
});

const funnel = (series, source = {}) => ({
  kind: 'InsightVizNode',
  source: { kind: 'FunnelsQuery', series, dateRange: { date_from: '-30d' }, ...source },
});

const breakdown = (property, type = 'event') => ({ breakdownFilter: { breakdown: property, breakdown_type: type } });
const table = { trendsFilter: { display: 'ActionsTable' } };
const bar = { trendsFilter: { display: 'ActionsBar' } };

// --- dashboard tile definitions ---------------------------------------------

const INSIGHTS = [
  { name: 'Pageviews (daily)', query: trend([ev('$pageview')]) },
  { name: 'Unique visitors (daily)', query: trend([ev('$pageview', 'dau')]) },
  { name: 'Sessions (daily)', query: trend([ev('$pageview', 'unique_session')]) },
  { name: 'Top pages', query: trend([ev('$pageview')], { ...breakdown('$pathname'), ...table }) },
  { name: 'Top referrers', query: trend([ev('$pageview')], { ...breakdown('$referring_domain'), ...table }) },
  { name: 'Traffic by UTM source', query: trend([ev('$pageview')], { ...breakdown('utm_source'), ...table }) },
  { name: 'Outbound clicks', query: trend([ev('outbound_click')], { ...breakdown('href'), ...table }) },
  { name: 'Scroll depth distribution', query: trend([ev('article_scroll_depth')], { ...breakdown('depth_percent'), ...bar }) },
  { name: 'Reads completed by content type', query: trend([ev('read_complete')], breakdown('content_type')) },
  { name: 'Code blocks copied', query: trend([ev('code_block_copied')], breakdown('slug')) },
  {
    name: 'Core Web Vitals (p75)',
    query: trend([
      ev('$web_vitals', 'p75', { math_property: '$web_vitals_LCP_value', custom_name: 'LCP p75 (ms)' }),
      ev('$web_vitals', 'p75', { math_property: '$web_vitals_INP_value', custom_name: 'INP p75 (ms)' }),
      ev('$web_vitals', 'p75', { math_property: '$web_vitals_CLS_value', custom_name: 'CLS p75' }),
    ]),
  },
  {
    name: 'Funnel: pageview → read complete',
    query: funnel([ev('$pageview', 'total'), ev('read_complete', 'total')]),
  },
];

// --- provisioning -----------------------------------------------------------

async function resolveProjectId() {
  if (process.env.POSTHOG_PROJECT_ID) return process.env.POSTHOG_PROJECT_ID;
  const { results } = await api('/api/projects/');
  if (results.length === 1) return results[0].id;
  console.error('Multiple projects visible to this key — set POSTHOG_PROJECT_ID to one of:');
  for (const p of results) console.error(`  ${p.id}\t${p.name}`);
  process.exit(1);
}

async function findByName(resource, projectId, name) {
  const { results } = await api(`/api/projects/${projectId}/${resource}/?search=${encodeURIComponent(name)}&limit=100`);
  return results.find((r) => r.name === name);
}

async function main() {
  const projectId = await resolveProjectId();
  console.log(`Project ${projectId} @ ${API_HOST}${DRY ? '  [DRY RUN]' : ''}\n`);

  let dashboard = await findByName('dashboards', projectId, DASHBOARD_NAME);
  if (dashboard) {
    console.log(`✓ dashboard "${DASHBOARD_NAME}" exists (id ${dashboard.id})`);
  } else if (DRY) {
    console.log(`+ would create dashboard "${DASHBOARD_NAME}"`);
    dashboard = { id: '<new>' };
  } else {
    dashboard = await api(`/api/projects/${projectId}/dashboards/`, {
      method: 'POST',
      body: JSON.stringify({
        name: DASHBOARD_NAME,
        description: 'Visitor traffic, engagement, and Web Vitals for www.simonplant.com. Provisioned by scripts/posthog-dashboard.mjs.',
        pinned: true,
      }),
    });
    console.log(`+ created dashboard "${DASHBOARD_NAME}" (id ${dashboard.id})`);
  }

  for (const spec of INSIGHTS) {
    const existing = await findByName('insights', projectId, spec.name);
    const body = JSON.stringify({ name: spec.name, query: spec.query, dashboards: [dashboard.id] });
    if (DRY) {
      console.log(`  ${existing ? '~ would update' : '+ would create'} tile "${spec.name}"`);
      continue;
    }
    if (existing) {
      await api(`/api/projects/${projectId}/insights/${existing.id}/`, { method: 'PATCH', body });
      console.log(`  ~ updated tile "${spec.name}"`);
    } else {
      await api(`/api/projects/${projectId}/insights/`, { method: 'POST', body });
      console.log(`  + created tile "${spec.name}"`);
    }
  }

  if (!DRY) {
    console.log(`\nDone. View it: ${API_HOST}/dashboard/${dashboard.id}`);
  }
}

main().catch((err) => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
