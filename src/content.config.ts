import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    url: z.url(),
    category: z.string(),
    location: z.string().optional(),
    year: z.coerce.string().optional(),
    summary: z.string(),
    cover: z.string(),
    screenshot: z.string().optional(),
    gallery: z.array(z.object({ src: z.string(), alt: z.string() })).default([]),
    services: z.array(z.string()).default([]),
    accent: z.string().default('#E4572E'),
    order: z.number().default(0),
    published: z.boolean().default(true),
  }),
});

const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
  }),
});

export const collections = { work, legal };
