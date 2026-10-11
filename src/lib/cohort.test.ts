import { describe, expect, it } from 'vitest';
import { formatEarlyBirdUntil, getCohortLabel, getCurrentPrice, isEarlyBirdActive } from './cohort';

// Helper: a UTC instant, used as the "now" passed into the utility. The utility
// itself re-derives the Asia/Tbilisi (UTC+4) calendar date from this instant.
const utc = (iso: string) => new Date(iso);

describe('getCohortLabel — monthly fallback', () => {
  it('shows next month (genitive) when no override date is set, mid-October', () => {
    expect(getCohortLabel({ now: utc('2026-10-15T10:00:00Z') })).toBe('მიღება ნოემბრის ნაკადზე');
  });

  it('shows next month when in November', () => {
    expect(getCohortLabel({ now: utc('2026-11-01T10:00:00Z') })).toBe('მიღება დეკემბრის ნაკადზე');
  });

  it('wraps December → January', () => {
    expect(getCohortLabel({ now: utc('2026-12-20T10:00:00Z') })).toBe('მიღება იანვრის ნაკადზე');
  });

  it('respects the Asia/Tbilisi (UTC+4) calendar day near midnight UTC', () => {
    // 2026-10-31T21:00:00Z is 2026-11-01 01:00 in Tbilisi — already November.
    expect(getCohortLabel({ now: utc('2026-10-31T21:00:00Z') })).toBe('მიღება დეკემბრის ნაკადზე');
    // 2026-10-31T19:00:00Z is 2026-10-31 23:00 in Tbilisi — still October.
    expect(getCohortLabel({ now: utc('2026-10-31T19:00:00Z') })).toBe('მიღება ნოემბრის ნაკადზე');
  });
});

describe('getCohortLabel — nextStartDate override', () => {
  it('shows the override label while the date is still upcoming', () => {
    expect(
      getCohortLabel({ nextStartDate: '2026-10-26', now: utc('2026-10-01T10:00:00Z') })
    ).toBe('დაწყების თარიღი: 26 ოქტომბერი');
  });

  it('still shows the override label on the start date itself', () => {
    expect(
      getCohortLabel({ nextStartDate: '2026-10-26', now: utc('2026-10-26T06:00:00Z') })
    ).toBe('დაწყების თარიღი: 26 ოქტომბერი');
  });

  it('falls back to the monthly rule once the override date has passed', () => {
    expect(
      getCohortLabel({ nextStartDate: '2026-10-26', now: utc('2026-10-27T10:00:00Z') })
    ).toBe('მიღება ნოემბრის ნაკადზე');
  });

  it('ignores an unset override date', () => {
    expect(getCohortLabel({ nextStartDate: undefined, now: utc('2026-10-01T10:00:00Z') })).toBe(
      'მიღება ნოემბრის ნაკადზე'
    );
  });
});

describe('isEarlyBirdActive / getCurrentPrice', () => {
  const earlyBirdPrice = 340;
  const earlyBirdUntil = '2026-10-15';

  it('is active before the expiry date', () => {
    expect(isEarlyBirdActive({ earlyBirdPrice, earlyBirdUntil, now: utc('2026-10-10T10:00:00Z') })).toBe(true);
  });

  it('is still active on the expiry date itself (inclusive)', () => {
    expect(isEarlyBirdActive({ earlyBirdPrice, earlyBirdUntil, now: utc('2026-10-15T18:00:00Z') })).toBe(true);
  });

  it('expires the day after, respecting Tbilisi time', () => {
    expect(isEarlyBirdActive({ earlyBirdPrice, earlyBirdUntil, now: utc('2026-10-16T05:00:00Z') })).toBe(false);
  });

  it('is false with no earlyBirdPrice/earlyBirdUntil set', () => {
    expect(isEarlyBirdActive({ now: utc('2026-10-10T10:00:00Z') })).toBe(false);
  });

  it('getCurrentPrice returns the early-bird price while active', () => {
    const result = getCurrentPrice({ price: 370, earlyBirdPrice, earlyBirdUntil, now: utc('2026-10-10T10:00:00Z') });
    expect(result).toEqual({ currentPrice: 340, regularPrice: 370, isEarlyBird: true });
  });

  it('getCurrentPrice returns the regular price once expired', () => {
    const result = getCurrentPrice({ price: 370, earlyBirdPrice, earlyBirdUntil, now: utc('2026-10-20T10:00:00Z') });
    expect(result).toEqual({ currentPrice: 370, regularPrice: 370, isEarlyBird: false });
  });

  it('getCurrentPrice returns the regular price with no early bird configured', () => {
    const result = getCurrentPrice({ price: 590, now: utc('2026-10-20T10:00:00Z') });
    expect(result).toEqual({ currentPrice: 590, regularPrice: 590, isEarlyBird: false });
  });
});

describe('formatEarlyBirdUntil', () => {
  it('formats as "[day] [month nominative]"', () => {
    expect(formatEarlyBirdUntil('2026-10-15')).toBe('15 ოქტომბერი');
  });
});
