/**
 * Event dates arrive from houna.org as "19/05/2026, 19:00 pm" — day-first,
 * 24-hour time with a stray am/pm. Parsed once here and formatted with the
 * app's own month names and numerals.
 */

export interface EventDateParts {
  day: number;
  /** 0–11 */
  month: number;
  year: number;
  hour: number | null;
  minute: number | null;
}

export function parseEventDate(raw: string): EventDateParts | null {
  const d = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!d) return null;
  const t = raw.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  let hour = t ? Number(t[1]) : null;
  // Only trust am/pm when the hour is actually 12-hour ("7:00 pm"); "19:00 pm" is already 24-hour.
  if (hour !== null && t?.[3] && hour <= 12) {
    const pm = t[3].toLowerCase() === 'pm';
    if (pm && hour < 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
  }
  return { day: Number(d[1]), month: Number(d[2]) - 1, year: Number(d[3]), hour, minute: t ? Number(t[2]) : null };
}

/** Sort key (ms); 0 when the date can't be read. */
export function eventTime(raw: string): number {
  const p = parseEventDate(raw);
  return p ? new Date(p.year, p.month, p.day, p.hour ?? 0, p.minute ?? 0).getTime() : 0;
}

interface FormatNames {
  monthsLong: readonly string[];
  am: string;
  pm: string;
}

/** "19 May 2026 · 7:00 PM" (digits passed through `num`, e.g. Arabic-Indic). */
export function formatEventDate(raw: string, names: FormatNames, num: (n: number) => string): string {
  const p = parseEventDate(raw);
  if (!p) return raw;
  const date = `${num(p.day)} ${names.monthsLong[p.month]} ${num(p.year)}`;
  if (p.hour === null || p.minute === null) return date;
  const h12 = p.hour % 12 === 0 ? 12 : p.hour % 12;
  const mm = num(p.minute).padStart(2, num(0));
  return `${date} · ${num(h12)}:${mm} ${p.hour < 12 ? names.am : names.pm}`;
}
