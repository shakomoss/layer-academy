import { getCurrentPrice } from '../../src/lib/cohort';
import type { CourseManifestEntry } from './types';

export type RegistrationType = 'group' | 'mentorship';
export type PreferredContact = 'whatsapp' | 'viber' | 'call' | 'email';

export interface RegistrationInput {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  course?: unknown;
  type?: unknown;
  preferredContact?: unknown;
  comment?: unknown;
  consent?: unknown;
  website?: unknown; // honeypot
  eventId?: unknown;
  pageUrl?: unknown;
  utm?: unknown;
  fbp?: unknown;
  fbc?: unknown;
  turnstileToken?: unknown;
  trackingConsent?: unknown;
}

export interface ValidatedRegistration {
  name: string;
  phone: string;
  email: string;
  courseSlug: string;
  courseTitle: string;
  type: RegistrationType;
  preferredContact: PreferredContact;
  comment: string;
  price: number;
  currency: 'GEL';
  eventId: string;
  pageUrl: string;
  utm: { source: string; medium: string; campaign: string; term: string; content: string };
  fbp: string;
  fbc: string;
  trackingConsent: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

const PREFERRED_CONTACTS: PreferredContact[] = ['whatsapp', 'viber', 'call', 'email'];
const PHONE_PATTERN = /^\+\d{9,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asUtm(value: unknown) {
  const obj = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  return {
    source: asString(obj.source).slice(0, 100),
    medium: asString(obj.medium).slice(0, 100),
    campaign: asString(obj.campaign).slice(0, 100),
    term: asString(obj.term).slice(0, 100),
    content: asString(obj.content).slice(0, 100),
  };
}

/**
 * Validates and normalizes a registration submission, recomputing the price
 * from the course manifest rather than trusting any value sent by the client.
 */
export function validateRegistration(
  input: RegistrationInput,
  courses: CourseManifestEntry[]
): { ok: true; data: ValidatedRegistration } | { ok: false; error: ValidationError } {
  const name = asString(input.name);
  if (name.length < 2 || name.length > 120) {
    return { ok: false, error: { field: 'name', message: 'გთხოვთ, მიუთითოთ სახელი და გვარი.' } };
  }

  const phone = asString(input.phone).replace(/[\s-]/g, '');
  if (!PHONE_PATTERN.test(phone)) {
    return { ok: false, error: { field: 'phone', message: 'გთხოვთ, მიუთითოთ ტელეფონის ნომერი სწორ ფორმატში.' } };
  }

  const email = asString(input.email);
  if (email && !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: { field: 'email', message: 'გთხოვთ, მიუთითოთ ვალიდური ელ-ფოსტა.' } };
  }

  const courseSlug = asString(input.course);
  const course = courses.find((c) => c.slug === courseSlug && c.published);
  if (!course) {
    return { ok: false, error: { field: 'course', message: 'გთხოვთ, აირჩიოთ პროგრამა.' } };
  }

  const type = asString(input.type) as RegistrationType;
  if (type !== 'group' && type !== 'mentorship') {
    return { ok: false, error: { field: 'type', message: 'გთხოვთ, აირჩიოთ ფორმატი.' } };
  }
  if (type === 'group' && !course.group.enabled) {
    return { ok: false, error: { field: 'type', message: 'ამ პროგრამისთვის ჯგუფური ფორმატი მიუწვდომელია.' } };
  }
  if (type === 'mentorship' && !course.mentorship.enabled) {
    return { ok: false, error: { field: 'type', message: 'ამ პროგრამისთვის მენტორინგი მიუწვდომელია.' } };
  }

  const preferredContact = asString(input.preferredContact) as PreferredContact;
  if (!PREFERRED_CONTACTS.includes(preferredContact)) {
    return { ok: false, error: { field: 'preferredContact', message: 'გთხოვთ, აირჩიოთ კონტაქტის მეთოდი.' } };
  }

  if (input.consent !== true) {
    return { ok: false, error: { field: 'consent', message: 'გთხოვთ, დაადასტუროთ წესებთან თანხმობა.' } };
  }

  const comment = asString(input.comment).slice(0, 1000);
  const eventId = asString(input.eventId).slice(0, 100);
  const pageUrl = asString(input.pageUrl).slice(0, 300);
  const utm = asUtm(input.utm);
  const fbp = asString(input.fbp).slice(0, 100);
  const fbc = asString(input.fbc).slice(0, 100);
  const trackingConsent = input.trackingConsent === true;

  const price =
    type === 'group'
      ? getCurrentPrice({
          price: course.group.price,
          earlyBirdPrice: course.group.earlyBirdPrice,
          earlyBirdUntil: course.group.earlyBirdUntil,
        }).currentPrice
      : course.mentorship.monthlyPrice;

  return {
    ok: true,
    data: {
      name,
      phone,
      email,
      courseSlug: course.slug,
      courseTitle: course.title,
      type,
      preferredContact,
      comment,
      price,
      currency: 'GEL',
      eventId,
      pageUrl,
      utm,
      fbp,
      fbc,
      trackingConsent,
    },
  };
}
