import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** An optional link; an empty CMS field counts as not set. */
const optionalUrl = z
  .url()
  .or(z.literal(''))
  .optional()
  .transform((value) => value || undefined);

const image = z.object({ src: z.string(), alt: z.string() });

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
    gallery: z.array(image).default([]),
    /** Native app store listings, for projects that include an iOS or Android app. */
    appStore: optionalUrl,
    googlePlay: optionalUrl,
    /** Phone screenshots of the native app, shown in phone frames. */
    appScreens: z.array(image).default([]),
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
