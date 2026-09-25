/**
 * Crisis lines by country, shown on the crisis screen (app/crisis.tsx).
 *
 * EMPTY ON PURPOSE. Every entry must come from a verified, current source
 * (the service's own site or a government health authority) and be
 * re-checked before each release — a wrong or dead number here is worse
 * than none. The screen hides this section entirely while the list is
 * empty; the generic emergency guidance above it always shows.
 */
export interface CrisisLine {
  /** ISO 3166-1 alpha-2, matching `profiles.country` and lib/countries.ts. */
  country: string;
  name: { en: string; ar: string };
  /** Dialable, e.g. "+966 ...". Rendered as-is (digits localised on display). */
  phone: string;
  /** Where this number was verified, for the next person who checks it. */
  source: string;
  verifiedOn: string;
}

export const CRISIS_LINES: CrisisLine[] = [];

/** Lines for one country first (if known), then the rest. */
export function crisisLinesFor(country: string | null): CrisisLine[] {
  if (!country) return CRISIS_LINES;
  const mine = CRISIS_LINES.filter((l) => l.country === country);
  return [...mine, ...CRISIS_LINES.filter((l) => l.country !== country)];
}
