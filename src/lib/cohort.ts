import { MONTHS_GENITIVE, MONTHS_NOMINATIVE } from './months';

const TIMEZONE = 'Asia/Tbilisi';

interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
}

function toDate(value: Date | string): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

/** Calendar date as seen by a viewer in Asia/Tbilisi, regardless of the host's own timezone. */
function tbilisiDateParts(date: Date): DateParts {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

/**
 * Content dates (`group.nextStartDate`, `group.earlyBirdUntil`) are plain calendar
 * dates with no time component. Astro/zod parses the `YYYY-MM-DD` string as UTC
 * midnight, so reading the UTC fields back out recovers the calendar date exactly
 * as the owner typed it, with no further timezone shift.
 */
function contentDateParts(date: Date): DateParts {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function compareDateParts(a: DateParts, b: DateParts): number {
  return (a.year * 10000 + a.month * 100 + a.day) - (b.year * 10000 + b.month * 100 + b.day);
}

export interface CohortLabelInput {
  nextStartDate?: Date | string;
  now?: Date;
}

type ResolvedStart = { override: true; day: number; month1to12: number } | { override: false; month1to12: number };

/**
 * Shared date resolution behind both label formatters below: prefers an
 * explicit, still-upcoming `nextStartDate` override; otherwise resolves to
 * next calendar month. Each formatter picks its own wording/grammatical case
 * from this.
 */
function resolveNextStart({ nextStartDate, now = new Date() }: CohortLabelInput): ResolvedStart {
  const today = tbilisiDateParts(now);

  if (nextStartDate) {
    const overrideParts = contentDateParts(toDate(nextStartDate));
    if (compareDateParts(overrideParts, today) >= 0) {
      return { override: true, day: overrideParts.day, month1to12: overrideParts.month };
    }
  }

  const nextMonth1to12 = today.month === 12 ? 1 : today.month + 1;
  return { override: false, month1to12: nextMonth1to12 };
}

/**
 * The full-sentence label shown for "when can I join". Prefers an explicit,
 * still-upcoming `nextStartDate` override; otherwise falls back to "intake
 * on next month's cohort".
 */
export function getCohortLabel(input: CohortLabelInput): string {
  const resolved = resolveNextStart(input);

  if (resolved.override) {
    const monthName = MONTHS_NOMINATIVE[resolved.month1to12 - 1];
    return `დაწყების თარიღი: ${resolved.day} ${monthName}`;
  }

  const monthName = MONTHS_GENITIVE[resolved.month1to12 - 1];
  return `მიღება ${monthName} ნაკადზე`;
}

/**
 * Short form for compact layouts (e.g. a table row) where the surrounding
 * UI already supplies a "დაწყება" label: "25 ოქტომბერი" when an override
 * date is active, otherwise just the upcoming month's nominative name
 * ("ნოემბერი") — no "მიღება .../ნაკადზე" sentence.
 */
export function getShortCohortLabel(input: CohortLabelInput): string {
  const resolved = resolveNextStart(input);
  const monthName = MONTHS_NOMINATIVE[resolved.month1to12 - 1];
  return resolved.override ? `${resolved.day} ${monthName}` : monthName;
}

export interface EarlyBirdInput {
  earlyBirdPrice?: number;
  earlyBirdUntil?: Date | string;
  now?: Date;
}

/** True while today (Asia/Tbilisi) is on or before `earlyBirdUntil`. */
export function isEarlyBirdActive({ earlyBirdPrice, earlyBirdUntil, now = new Date() }: EarlyBirdInput): boolean {
  if (!earlyBirdPrice || !earlyBirdUntil) return false;
  const today = tbilisiDateParts(now);
  const untilParts = contentDateParts(toDate(earlyBirdUntil));
  return compareDateParts(untilParts, today) >= 0;
}

export interface CurrentPriceInput {
  price: number;
  earlyBirdPrice?: number;
  earlyBirdUntil?: Date | string;
  now?: Date;
}

export interface CurrentPriceResult {
  currentPrice: number;
  regularPrice: number;
  isEarlyBird: boolean;
}

/** The price to actually charge right now, with early-bird expiry already resolved. */
export function getCurrentPrice({ price, earlyBirdPrice, earlyBirdUntil, now }: CurrentPriceInput): CurrentPriceResult {
  const active = isEarlyBirdActive({ earlyBirdPrice, earlyBirdUntil, now });
  return {
    currentPrice: active ? (earlyBirdPrice as number) : price,
    regularPrice: price,
    isEarlyBird: active,
  };
}

/** "[date]-მდე" formatter for "ფასდაკლება [date]-მდე", in Tbilisi calendar terms. */
export function formatEarlyBirdUntil(earlyBirdUntil: Date | string): string {
  const parts = contentDateParts(toDate(earlyBirdUntil));
  const monthName = MONTHS_NOMINATIVE[parts.month - 1];
  return `${parts.day} ${monthName}`;
}
