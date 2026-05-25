#!/usr/bin/env node
/**
 * Build UTM-tagged promotion links with canonical, consistent parameters.
 *
 * Consistency is the whole point: "hn" vs "hackernews" vs "HN" fragment into
 * three rows on the PostHog "Traffic by UTM source" tile. This enforces one
 * spelling per channel and derives the medium automatically.
 *
 * Usage:
 *   node scripts/utm.mjs <url> <source> [campaign]
 *   npm run utm -- https://www.simonplant.com/projects/clawhq hn clawhq-launch
 *
 *   node scripts/utm.mjs --list        # show known sources
 */

// channel -> utm_medium. Add new channels here, never inline a one-off spelling.
const SOURCES = {
  hn: 'social',
  reddit: 'social',
  twitter: 'social',
  x: 'social',
  bluesky: 'social',
  mastodon: 'social',
  linkedin: 'social',
  discord: 'social',
  newsletter: 'email',
  email: 'email',
  github: 'referral',
  producthunt: 'referral',
  devto: 'referral',
  lobsters: 'social',
};

const args = process.argv.slice(2);

if (args[0] === '--list' || args.length === 0) {
  console.log('Known sources (source = utm_source, → utm_medium):\n');
  for (const [s, m] of Object.entries(SOURCES)) console.log(`  ${s.padEnd(12)} → ${m}`);
  console.log('\nUsage: node scripts/utm.mjs <url> <source> [campaign]');
  process.exit(args.length === 0 ? 1 : 0);
}

const [rawUrl, source, campaign] = args;

let url;
try {
  url = new URL(rawUrl);
} catch {
  console.error(`Invalid URL: ${rawUrl}`);
  process.exit(1);
}

const medium = SOURCES[source];
if (!medium) {
  console.error(`Unknown source "${source}". Known: ${Object.keys(SOURCES).join(', ')}`);
  console.error('Add it to SOURCES in scripts/utm.mjs rather than using a one-off spelling.');
  process.exit(1);
}

url.searchParams.set('utm_source', source);
url.searchParams.set('utm_medium', medium);
if (campaign) url.searchParams.set('utm_campaign', campaign);

console.log(url.toString());
