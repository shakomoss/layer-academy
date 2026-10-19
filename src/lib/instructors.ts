import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Looks up the instructor for a course/mentorship page by matching the
 * page's slug against that instructor's `courses` list — the ownership
 * direction is instructor -> courses, not a field on the course itself.
 */
export async function getInstructorForCourse(slug: string): Promise<CollectionEntry<'instructors'> | undefined> {
  const instructors = await getCollection('instructors');
  return instructors.find((entry) => entry.data.courses.includes(slug));
}
