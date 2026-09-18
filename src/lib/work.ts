import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/config';

// Portfolio entries live in src/content/work/<locale>/<slug>.md; the same file
// name in each language folder is the same project.

export function workSlug(entry: CollectionEntry<'work'>): string {
  return entry.id.split('/').slice(1).join('/');
}

export async function getWork(locale: Locale): Promise<CollectionEntry<'work'>[]> {
  const entries = await getCollection('work', ({ id, data }) => id.startsWith(`${locale}/`) && data.published);
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/** Static paths for the case-study pages of one locale; "next" wraps around. */
export async function workPaths(locale: Locale) {
  const projects = await getWork(locale);
  return projects.map((project, i) => ({
    params: { slug: workSlug(project) },
    props: { project, next: projects[(i + 1) % projects.length] },
  }));
}
