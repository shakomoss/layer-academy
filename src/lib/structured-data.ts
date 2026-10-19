export function buildEducationalOrganization(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Layer Academy',
    url: siteUrl,
  };
}

export interface CourseJsonLdInput {
  name: string;
  description: string;
  url: string;
  image: string;
  price: number;
  schedule?: string;
  // Instructors are intentionally anonymous — see src/content/instructors
  // and the privacy note in src/lib/instructors.ts. No name field here.
  instructorTitle?: string;
  instructorOneLiner?: string;
}

export function buildCourseJsonLd(input: CourseJsonLdInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Layer Academy',
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      ...(input.schedule ? { courseSchedule: input.schedule } : {}),
      ...(input.instructorTitle
        ? {
            instructor: {
              '@type': 'Person',
              jobTitle: input.instructorTitle,
              ...(input.instructorOneLiner ? { description: input.instructorOneLiner } : {}),
            },
          }
        : {}),
    },
    offers: {
      '@type': 'Offer',
      price: input.price,
      priceCurrency: 'GEL',
      url: input.url,
      availability: 'https://schema.org/InStock',
    },
  };
}

export function buildFaqJsonLd(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
