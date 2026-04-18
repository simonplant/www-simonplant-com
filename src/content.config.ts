import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const status = z.enum(['idea', 'draft', 'review', 'published']);

const commentary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/commentary' }),
  schema: z.object({
    title: z.string(),
    publishedDate: z.coerce.date(),
    tags: z.array(z.string()),
    description: z.string(),
    status,
    tier: z.enum(['signal', 'architecture', 'deep-dive']),
    pinned: z.boolean().optional(),
  }),
});

const architecture = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/architecture' }),
  schema: z.object({
    title: z.string(),
    status,
    tags: z.array(z.string()),
    description: z.string(),
    publishedDate: z.coerce.date().optional(),
  }),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    status: z.enum(['active', 'beta', 'planned', 'stable']),
    role: z.string(),
    github: z.url().optional(),
    tags: z.array(z.string()),
    order: z.number().int(),
    relatedProducts: z.array(z.string()).optional(),
  }),
});

export const collections = { commentary, architecture, products };
