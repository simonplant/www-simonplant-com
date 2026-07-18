import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedCollection } from '../content/_helpers';

export async function GET(context: APIContext) {
  const [commentary, architecture, security] = await Promise.all([
    getPublishedCollection('commentary'),
    getPublishedCollection('architecture'),
    getPublishedCollection('security'),
  ]);

  const items = [
    ...commentary.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedDate,
      link: `/blog/${entry.id}/`,
      categories: ['Blog', ...entry.data.tags],
    })),
    ...architecture.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedDate ?? new Date(0),
      link: `/architecture/${entry.id}/`,
      categories: ['Architecture', ...entry.data.tags],
    })),
    ...security.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      pubDate: entry.data.publishedDate ?? new Date(0),
      link: `/security/${entry.id}/`,
      categories: ['Security', ...entry.data.tags],
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'Simon Plant',
    description:
      'AI architecture patterns, security techniques, and operational lessons from designing and running AI systems in production.',
    site: context.site?.toString() ?? 'https://www.simonplant.com',
    items,
  });
}
