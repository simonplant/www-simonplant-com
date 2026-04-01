import { defineCollection, z } from 'astro:content';

const status = z.enum(['idea', 'draft', 'review', 'published']);

const series = defineCollection({
  type: 'content',
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
          url: z.string(),
        }),
      )
      .optional(),
  }),
});

const commentary = defineCollection({
  type: 'content',
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
  type: 'content',
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

export const collections = { series, commentary, architecture };
