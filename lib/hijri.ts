/**
 * Hijri dates, offline: the Umm al-Qura calendar through `Intl` where the phone's
 * JavaScript engine has it, and the tabular Islamic calendar (within a day of
 * Umm al-Qura) where it doesn't. Names come from the string catalogue
 * (`t.home.hijri.months`); this only counts.
 */

export interface HijriDay {
  year: number;
  /** 1 (Muharram) to 12 (Dhuʻl-Hijjah). */
  month: number;
  day: number;
}

/** The Hijri day begins at sunset; the app takes that as 6 pm. */
export const MAGHRIB_HOUR = 18;

let umalqura: Intl.DateTimeFormat | null | undefined;
function umalquraFormat() {
  if (umalqura !== undefined) return umalqura;
  try {
    const f = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { year: 'numeric', month: 'numeric', day: 'numeric' });
    umalqura = f.resolvedOptions().calendar.startsWith('islamic') ? f : null;
  } catch {
    umalqura = null;
  }
  return umalqura;
}

/** The Hijri date of a (Gregorian) day. */
export function hijriDay(date: Date): HijriDay {
  const f = umalquraFormat();
  if (f) {
    const parts = f.formatToParts(date);
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const h = { year: get('year'), month: get('month'), day: get('day') };
    if (h.year && h.month && h.day) return h;
  }
  return tabularHijri(date);
}

/** The tabular (arithmetical) Islamic calendar, from the local date's Julian day. */
export function tabularHijri(date: Date): HijriDay {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a, mm = m + 12 * a - 3;
  const jd = d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) + Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  return { year: 30 * n + j - 30, month, day };
}

/** Noon, `n` days on: whole days, whatever the clocks do. */
export function addDays(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n, 12);
}

/**
 * The Hijri day in progress at `now`: from sunset (6 pm) it's already the next.
 * `date` is the Gregorian day that Hijri day belongs to; `evening`, whether it began at sunset today.
 */
export function currentHijri(now: Date): { date: Date; evening: boolean; hijri: HijriDay } {
  const evening = now.getHours() >= MAGHRIB_HOUR;
  const date = addDays(now, evening ? 1 : 0);
  return { date, evening, hijri: hijriDay(date) };
}

/** Every day of the Hijri month that `date` is in, from the 1st, each with its Gregorian day. */
export function hijriMonthDays(date: Date): { date: Date; hijri: HijriDay }[] {
  const start = addDays(date, 1 - hijriDay(date).day);
  const days: { date: Date; hijri: HijriDay }[] = [];
  for (let i = 0; i < 31; i++) {
    const d = addDays(start, i);
    const h = hijriDay(d);
    if (i >= 29 && h.day === 1) break;
    days.push({ date: d, hijri: h });
  }
  return days;
}

/** "16 Rabiʻ II" / "١٦ ربيع الآخر": the day and the month's name. */
export function formatHijri(h: HijriDay, months: readonly string[], num: (n: number) => string = String): string {
  return `${num(h.day)} ${months[h.month - 1]}`;
}
