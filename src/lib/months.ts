// Month names in Georgian, indexed 0 (January) to 11 (December).
// Extracted verbatim from the content brief — do not hand-edit without re-checking against it.

/** Genitive case, used in 'მიღება {month} ნაკადზე' (next cohort intake). */
export const MONTHS_GENITIVE: string[] = ["იანვრის","თებერვლის","მარტის","აპრილის","მაისის","ივნისის","ივლისის","აგვისტოს","სექტემბრის","ოქტომბრის","ნოემბრის","დეკემბრის"];

/** Nominative case, used in 'დაწყების თარიღი: {day} {month}' (explicit start date). */
export const MONTHS_NOMINATIVE: string[] = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];

/**
 * Dative case, used in 'იწყება {day} {month}' ("starts on [date]"). Derived
 * from MONTHS_NOMINATIVE (strip trailing ი, add ს — e.g. ოქტომბერი -> ოქტომბერს;
 * the one nominative ending in ო, აგვისტო, just takes ს directly) rather than
 * hand-typed separately, so there's one source of truth for the month names.
 */
export const MONTHS_DATIVE: string[] = MONTHS_NOMINATIVE.map((month) =>
  month.endsWith('ი') ? `${month.slice(0, -1)}ს` : `${month}ს`
);
