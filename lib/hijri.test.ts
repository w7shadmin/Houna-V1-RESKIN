import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, currentHijri, formatHijri, hijriDay, hijriMonthDays, tabularHijri } from './hijri.ts';

const MONTHS = ['Muharram', 'Safar', 'Rabiʻ I', 'Rabiʻ II', 'Jumada I', 'Jumada II', 'Rajab', 'Shaʻban', 'Ramadan', 'Shawwal', 'Dhuʻl-Qiʻdah', 'Dhuʻl-Hijjah'];

test('names a known day in the Umm al-Qura calendar', () => {
  const day = new Date('2026-09-27T12:00:00');
  assert.deepEqual(hijriDay(day), { year: 1448, month: 4, day: 16 });
  assert.equal(formatHijri(hijriDay(day), MONTHS), '16 Rabiʻ II');
});

test('a new month starts on its first day', () => {
  // 1 Ramadan 1447 in Umm al-Qura is 18 February 2026.
  assert.deepEqual(hijriDay(new Date('2026-02-18T12:00:00')), { year: 1447, month: 9, day: 1 });
});

test('the tabular fallback stays within two days of Umm al-Qura', () => {
  // Days since the Hijri epoch, counted the tabular way (months of 30 and 29, leap years of 355).
  const toDays = (h: { year: number; month: number; day: number }) =>
    354 * (h.year - 1) + Math.floor((11 * h.year + 3) / 30) + 30 * (h.month - 1) - Math.floor((h.month - 1) / 2) + h.day;
  let d = new Date('2025-01-01T12:00:00');
  for (let i = 0; i < 800; i++, d = addDays(d, 1)) {
    const u = hijriDay(d), t = tabularHijri(d);
    assert.ok(Math.abs(toDays(u) - toDays(t)) <= 2, `${d.toDateString()}: ${JSON.stringify(u)} vs ${JSON.stringify(t)}`);
  }
});

test('the Hijri day turns at sunset (6 pm)', () => {
  const afternoon = currentHijri(new Date('2026-09-27T17:59:00'));
  const evening = currentHijri(new Date('2026-09-27T18:00:00'));
  assert.equal(afternoon.hijri.day, 16);
  assert.equal(afternoon.evening, false);
  assert.equal(evening.hijri.day, 17);
  assert.equal(evening.evening, true);
});

test('a month runs from its 1st for 29 or 30 days', () => {
  const days = hijriMonthDays(new Date('2026-09-27T12:00:00'));
  assert.equal(days[0].hijri.day, 1);
  assert.ok(days.length === 29 || days.length === 30);
  days.forEach((d, i) => assert.equal(d.hijri.day, i + 1));
  assert.equal(days[15].date.getDate(), 27);
});
