import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

type ContentCollection = 'commentary' | 'architecture';

/**
 * Returns collection entries filtered by editorial status.
 * Production builds include only published content.
 * Dev server shows all statuses.
 */
export async function getPublishedCollection<T extends ContentCollection>(
  collection: T,
): Promise<CollectionEntry<T>[]> {
  const entries = await getCollection(collection);
  if (import.meta.env.PROD) {
    return entries.filter((entry) => entry.data.status === 'published');
  }
  return entries;
}
