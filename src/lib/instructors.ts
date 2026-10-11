import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * `course.instructor` is a free-text id written either by hand (bare slug,
 * e.g. "giorgi-mamaladze") or by the Pages CMS admin panel, which may store
 * a path with a folder prefix and/or a .md extension. Normalize both forms
 * before matching against the instructors collection.
 */
function normalizeId(id: string): string {
  const lastSegment = id.split('/').pop() ?? id;
  return lastSegment.replace(/\.md$/, '');
}

export async function resolveInstructor(id: string): Promise<CollectionEntry<'instructors'> | undefined> {
  const instructors = await getCollection('instructors');
  const target = normalizeId(id);
  return instructors.find((entry) => normalizeId(entry.id) === target);
}
