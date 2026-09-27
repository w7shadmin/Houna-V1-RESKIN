/**
 * Today's date in the Hijri calendar (Umm al-Qura, as Saudi Arabia uses), e.g.
 * "16 Rabiʻ II" or "١٦ ربيع الآخر", from the phone's own Intl support: offline,
 * no permissions. Returns null where the engine can't do the Islamic calendar
 * (it would otherwise print the Gregorian date), so callers simply leave it out.
 */
export function hijriDate(date: Date, language: 'en' | 'ar'): string | null {
  const locale = language === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-GB-u-ca-islamic-umalqura';
  try {
    const format = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
    if (!format.resolvedOptions().calendar.startsWith('islamic')) return null;
    return format.format(date);
  } catch {
    return null;
  }
}
