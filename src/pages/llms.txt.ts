import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const site = context.site?.toString().replace(/\/$/, '') ?? 'https://www.simonplant.com';

  const [commentary, architecture, products] = await Promise.all([
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
    '> Fractional CTO. Thirty years building the management layer around new infrastructure — from early AWS to AI agents in production.',
    '',
  ];

  // Key pages
  lines.push('## Key Pages', '');
  lines.push(`- [Home](${site}/): Main landing page`);
  lines.push(`- [About](${site}/about/): About Simon Plant`);
  lines.push(`- [Architecture](${site}/architecture/): AI architecture patterns and reference material`);
  lines.push(`- [Blog](${site}/blog/): Blog posts and technical writing`);
  lines.push(`- [Projects](${site}/projects/): Open-source tools`);
  lines.push('');

  // Architecture
  if (architecture.length > 0) {
    lines.push('## Architecture', '');
    for (const entry of architecture) {
      lines.push(`- [${entry.data.title}](${site}/architecture/${entry.id}/): ${entry.data.description}`);
    }
    lines.push('');
  }

  // Blog
  if (commentary.length > 0) {
    const sorted = commentary.sort(
      (a, b) => b.data.publishedDate.getTime() - a.data.publishedDate.getTime(),
    );
    lines.push('## Blog', '');
    for (const entry of sorted) {
      lines.push(`- [${entry.data.title}](${site}/blog/${entry.id}/): ${entry.data.description}`);
    }
    lines.push('');
  }

  // Projects
  if (products.length > 0) {
    const sorted = products.sort((a, b) => a.data.order - b.data.order);
    lines.push('## Projects', '');
    for (const entry of sorted) {
      lines.push(`- [${entry.data.title}](${site}/projects/${entry.id}/): ${entry.data.tagline}`);
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
