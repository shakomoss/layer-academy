import { describe, expect, it } from 'vitest';
import type { CourseManifestEntry } from './types';
import { validateRegistration } from './validate';

const course = (slug: string, admissionsPaused: boolean): CourseManifestEntry => ({
  slug,
  title: slug,
  published: true,
  admissionsPaused,
  group: { enabled: true, price: 550 },
  mentorship: { enabled: true, price: 590 },
});

const courses = [course('archicad', false), course('revit', true)];

const input = (slug: string, type = 'group') => ({
  name: 'Test Person',
  phone: '+995500000000',
  course: slug,
  type,
  preferredContact: 'email',
  consent: true,
  earlyStartConsent: true,
});

describe('validateRegistration with paused admissions', () => {
  it('accepts an open course', () => {
    expect(validateRegistration(input('archicad'), courses).ok).toBe(true);
  });

  it('rejects a paused course for group registration', () => {
    const result = validateRegistration(input('revit'), courses);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('course');
  });

  it('rejects a paused course for mentorship registration too', () => {
    expect(validateRegistration(input('revit', 'mentorship'), courses).ok).toBe(false);
  });

  it('still requires the early-start agreement', () => {
    const result = validateRegistration({ ...input('archicad'), earlyStartConsent: false }, courses);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('earlyStartConsent');
  });
});
