import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    published: z.boolean().default(true),
    order: z.number().default(0),
    level: z.string().default('დამწყები'),
    group: z.object({
      enabled: z.boolean().default(true),
      price: z.number(),
      earlyBirdPrice: z.number().optional(),
      earlyBirdUntil: z.coerce.date().optional(),
      nextStartDate: z.coerce.date().optional(),
      schedule: z.string().optional(),
      duration: z.string().optional(),
      seatsLeft: z.number().optional(),
    }),
    mentorship: z.object({
      enabled: z.boolean().default(true),
      monthlyPrice: z.number(),
    }),
    goal: z.string().optional(),
    outcome: z.string().optional(),
    syllabus: z
      .object({
        lessons: z
          .array(
            z.object({
              title: z.string(),
              topics: z.array(z.string()),
            })
          )
          .optional(),
        topics: z.array(z.string()).optional(),
      })
      .optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const instructors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/instructors' }),
  schema: z.object({
    // Internal bookkeeping key, stable even if the file is renamed — not
    // required reading anywhere, just a convenience.
    id: z.string(),
    name: z.string(),
    title: z.string(),
    oneLiner: z.string(),
    facts: z.array(z.string()).length(3),
    // Course/mentorship slugs this instructor teaches — the owning direction
    // is instructor -> courses, not the other way around (see
    // getInstructorForCourse in src/lib/instructors.ts).
    courses: z.array(z.string()),
  }),
});

const settings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/settings' }),
  schema: z.object({
    contactPhone: z.string().default(''),
    contactEmail: z.string().default(''),
    whatsappUrl: z.string().default(''),
    messengerUrl: z.string().default(''),
    instagramUrl: z.string().default(''),
    facebookUrl: z.string().default(''),
    notificationEmail: z.string().default(''),
    metaDomainVerification: z.string().default(''),
    announcementText: z.string().default(''),
  }),
});

export const collections = { courses, instructors, settings };
