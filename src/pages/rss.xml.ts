import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const allSeries = await getCollection('series', ({ data }) =>
    import.meta.env.PROD ? data.status === 'published' : true,
  );
  const allCommentary = await getCollection('commentary', ({ data }) =>
    import.meta.env.PROD ? data.status === 'published' : true,
  );

  const seriesItems = allSeries.map((entry) => ({
    title: entry.data.title,
    description: entry.data.description,
    pubDate: entry.data.publishedDate,
    link: `/series/${entry.id}/`,
  }));

  const commentaryItems = allCommentary.map((entry) => ({
    title: entry.data.title,
    description: entry.data.description,
    pubDate: entry.data.publishedDate,
    link: `/commentary/${entry.id}/`,
  }));

  const items = [...seriesItems, ...commentaryItems].sort(
    (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
  );

  return rss({
    title: 'Simon Plant',
    description:
      'AI agent infrastructure — lifecycle management, security, operational patterns, and the systems layer that makes agents production-ready.',
    site: context.site?.toString() ?? 'https://www.simonplant.com',
    items,
  });
}
