import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedCollection } from '../content/_helpers';

export async function GET(context: APIContext) {
  const allPosts = await getPublishedCollection('commentary');

  const items = allPosts
    .map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedDate,
      link: `/blog/${entry.id}/`,
    }))
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Simon Plant',
    description:
      'What it actually takes to run AI agents in production — infrastructure patterns, security decisions, and operational lessons.',
    site: context.site?.toString() ?? 'https://www.simonplant.com',
    items,
  });
}
