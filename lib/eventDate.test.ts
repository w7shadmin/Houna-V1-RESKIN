import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventTime, formatEventDate, parseEventDate } from './eventDate.ts';

const en = {
  monthsLong: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  am: 'AM',
  pm: 'PM',
};
const ar = {
  monthsLong: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  am: 'ص',
  pm: 'م',
};
const arNum = (n: number) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

test('24-hour time with a stray "pm" stays 24-hour', () => {
  assert.equal(formatEventDate('19/05/2026, 19:00 pm', en, String), '19 May 2026 · 7:00 PM');
});

test('real 12-hour times are converted', () => {
  assert.equal(formatEventDate('07/04/2026, 7:30 pm', en, String), '7 April 2026 · 7:30 PM');
  assert.equal(formatEventDate('12/09/2023, 12:05 am', en, String), '12 September 2023 · 12:05 AM');
});

test('Arabic uses Arabic months, numerals and ص/م', () => {
  assert.equal(formatEventDate('19/05/2026, 19:00 pm', ar, arNum), '١٩ مايو ٢٠٢٦ · ٧:٠٠ م');
});

test('date without a time, and unreadable input', () => {
  assert.equal(formatEventDate('03/09/2023', en, String), '3 September 2023');
  assert.equal(formatEventDate('soon', en, String), 'soon');
  assert.equal(parseEventDate('soon'), null);
  assert.equal(eventTime('soon'), 0);
});

test('sort key orders by date', () => {
  assert.ok(eventTime('19/05/2026, 19:00 pm') > eventTime('07/04/2026, 19:00 pm'));
});
