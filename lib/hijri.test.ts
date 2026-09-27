import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hijriDate } from './hijri.ts';

test('names a known day in the Umm al-Qura calendar, in English and Arabic', () => {
  const day = new Date('2026-09-27T12:00:00');
  assert.equal(hijriDate(day, 'en'), '16 Rabiʻ II');
  assert.equal(hijriDate(day, 'ar'), '١٦ ربيع الآخر');
});

test('a new month starts on its first day', () => {
  // 1 Ramadan 1447 in Umm al-Qura is 18 February 2026.
  assert.match(hijriDate(new Date('2026-02-18T12:00:00'), 'en') ?? '', /^1 Ramadan$/);
});
