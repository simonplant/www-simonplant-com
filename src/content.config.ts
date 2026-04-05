import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const status = z.enum(['idea', 'draft', 'review', 'published']);

const series = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    number: z.number().int().positive(),
    publishedDate: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()),
    status,
    companionArtifacts: z
      .array(
        z.object({
          title: z.string(),
          type: z.enum(['checklist', 'template', 'framework', 'matrix']),
          description: z.string(),
          githubUrl: z.string().url(),
        }),
      )
      .optional(),
  }),
});

const commentary = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/commentary' }),
  schema: z.object({
    title: z.string(),
    publishedDate: z.coerce.date(),
    tags: z.array(z.string()),
    description: z.string(),
    status,
    tier: z.enum(['signal', 'architecture', 'deep-dive']),
  }),
});

const architecture = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/architecture' }),
  schema: z.object({
    title: z.string(),
    status,
    concern: z.string(),
    patternType: z.string(),
    tags: z.array(z.string()),
    relatedProjects: z.array(z.string()).optional(),
    description: z.string(),
    updated: z.coerce.date().optional(),
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
    github: z.string().url().optional(),
    tags: z.array(z.string()),
    order: z.number().int(),
    relatedProducts: z.array(z.string()).optional(),
  }),
});

export const collections = { series, commentary, architecture, products };
