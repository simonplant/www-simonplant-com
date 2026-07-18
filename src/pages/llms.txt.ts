import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedCollection } from '../content/_helpers';

export async function GET(context: APIContext) {
  const site = context.site?.toString().replace(/\/$/, '') ?? 'https://www.simonplant.com';

  const [commentary, architecture, security, products] = await Promise.all([
    getPublishedCollection('commentary'),
    getPublishedCollection('architecture'),
    getPublishedCollection('security'),
    getCollection('products'),
  ]);

  const lines: string[] = [
    '# Simon Plant',
    '',
    '> Chief architect turned fractional CTO. Thirty years designing and delivering the systems each new platform makes possible — web, cloud, DevOps, now AI. Hands-on in the code, and at the leadership table.',
    '',
  ];

  // Key pages
  lines.push('## Key Pages', '');
  lines.push(`- [Home](${site}/): Main landing page`);
  lines.push(`- [About](${site}/about/): About Simon Plant`);
  lines.push(`- [Architecture](${site}/architecture/): AI architecture patterns and reference material`);
  lines.push(`- [Security](${site}/security/): AI security techniques, hardening, and advisories`);
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

  // Security
  if (security.length > 0) {
    lines.push('## Security', '');
    for (const entry of security) {
      lines.push(`- [${entry.data.title}](${site}/security/${entry.id}/): ${entry.data.description}`);
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
