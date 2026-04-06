import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const site = context.site?.toString().replace(/\/$/, '') ?? 'https://www.simonplant.com';

  const [series, commentary, architecture, products] = await Promise.all([
    getCollection('series', ({ data }) =>
      import.meta.env.PROD ? data.status === 'published' : true,
    ),
    getCollection('commentary', ({ data }) =>
      import.meta.env.PROD ? data.status === 'published' : true,
    ),
    getCollection('architecture', ({ data }) =>
      import.meta.env.PROD ? data.status === 'published' : true,
    ),
    getCollection('products'),
  ]);

  const lines: string[] = [
    '# Simon Plant',
    '',
    '> AI agent infrastructure — lifecycle management, security, operational patterns, and the systems layer that makes agents production-ready. Written by Simon Plant.',
    '',
  ];

  // Key pages
  lines.push('## Key Pages', '');
  lines.push(`- [Home](${site}/): Main landing page`);
  lines.push(`- [About](${site}/about/): About Simon Plant`);
  lines.push(`- [Series](${site}/series/): Long-form AI agent infrastructure series`);
  lines.push(`- [Commentary](${site}/commentary/): Short-form opinionated takes`);
  lines.push(`- [Architecture KB](${site}/architecture/): Structured pattern records`);
  lines.push(`- [Products](${site}/products/): AI tooling ecosystem`);
  lines.push('');

  // Series
  if (series.length > 0) {
    const sorted = series.sort((a, b) => a.data.number - b.data.number);
    lines.push('## Series', '');
    for (const entry of sorted) {
      lines.push(`- [${entry.data.title}](${site}/series/${entry.id}/): ${entry.data.description}`);
    }
    lines.push('');
  }

  // Commentary
  if (commentary.length > 0) {
    const sorted = commentary.sort(
      (a, b) => b.data.publishedDate.getTime() - a.data.publishedDate.getTime(),
    );
    lines.push('## Commentary', '');
    for (const entry of sorted) {
      lines.push(`- [${entry.data.title}](${site}/commentary/${entry.id}/): ${entry.data.description}`);
    }
    lines.push('');
  }

  // Architecture KB
  if (architecture.length > 0) {
    lines.push('## Architecture Knowledge Base', '');
    for (const entry of architecture) {
      lines.push(`- [${entry.data.title}](${site}/architecture/${entry.id}/): ${entry.data.description}`);
    }
    lines.push('');
  }

  // Products
  if (products.length > 0) {
    const sorted = products.sort((a, b) => a.data.order - b.data.order);
    lines.push('## Products', '');
    for (const entry of sorted) {
      lines.push(`- [${entry.data.title}](${site}/products/${entry.id}/): ${entry.data.tagline}`);
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
