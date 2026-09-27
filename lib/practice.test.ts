import { test } from 'node:test';
import assert from 'node:assert/strict';
import { minutesByGroup, practiceByDay, practiceGroup, weekBounds } from './practice.ts';
import type { LoggedSession } from './sessionLog.ts';

const at = (d: number, h: number) => new Date(2026, 8, d, h).getTime();
const s = (kind: 'breathing' | 'meditation', exercise: string, startedAt: number, durationSeconds: number): LoggedSession => ({
  id: `${exercise}-${startedAt}`,
  kind,
  exercise,
  startedAt,
  durationSeconds,
});

test('sessions fall into their parts: exercises, meditation, and Home’s sky visits as Tanafas', () => {
  assert.equal(practiceGroup(s('breathing', 'steady-mind', 0, 60)), 'steadyMind');
  assert.equal(practiceGroup(s('meditation', 'rain', 0, 60)), 'meditation');
  for (const scene of ['starfield', 'sunrise', 'dusk', 'sky']) assert.equal(practiceGroup(s('breathing', scene, 0, 60)), 'tanafas');
});

test('minutes add up seconds before rounding, per part', () => {
  const m = minutesByGroup([s('breathing', 'anxiety-relief', 0, 50), s('breathing', 'anxiety-relief', 0, 50), s('meditation', 'fire', 0, 600)]);
  assert.equal(m.anxietyRelief, 2);
  assert.equal(m.meditation, 10);
  assert.equal(m.tanafas, 0);
});

test('the week runs Monday to Monday, with the week before it', () => {
  const { from, to, lastFrom } = weekBounds(new Date(2026, 8, 27, 15)); // a Sunday
  assert.deepEqual(from, new Date(2026, 8, 21));
  assert.deepEqual(to, new Date(2026, 8, 28));
  assert.deepEqual(lastFrom, new Date(2026, 8, 14));
  assert.deepEqual(weekBounds(new Date(2026, 8, 21, 0, 5)).from, new Date(2026, 8, 21));
});

test('each day practised has its minutes and what it mostly was; quiet days are absent', () => {
  const days = practiceByDay([
    s('breathing', 'steady-mind', at(15, 8), 240),
    s('meditation', 'rain', at(15, 21), 600),
    s('breathing', 'panic-relief', at(16, 9), 20),
  ]);
  assert.deepEqual(days.get('2026-09-15'), { minutes: 14, mostly: 'meditation' });
  assert.deepEqual(days.get('2026-09-16'), { minutes: 1, mostly: 'panicRelief' });
  assert.equal(days.has('2026-09-17'), false);
});

test('the month: its bounds and each day’s minutes by part', async () => {
  const { monthBounds, minutesByDayAndGroup } = await import('./practice.ts');
  const { from, to, days } = monthBounds(new Date(2026, 8, 27, 20));
  assert.equal(days, 30);
  assert.equal(from.getDate(), 1);
  assert.equal(to.getMonth(), 9);
  const at = (d: number, h = 9) => new Date(2026, 8, d, h).getTime();
  const log = [
    { id: 'a', kind: 'breathing' as const, exercise: 'steady-mind', startedAt: at(1), durationSeconds: 90 },
    { id: 'b', kind: 'breathing' as const, exercise: 'steady-mind', startedAt: at(1, 22), durationSeconds: 30 },
    { id: 'c', kind: 'meditation' as const, exercise: 'fire', startedAt: at(27), durationSeconds: 600 },
    { id: 'd', kind: 'meditation' as const, exercise: 'fire', startedAt: new Date(2026, 9, 1, 9).getTime(), durationSeconds: 600 },
  ];
  const byDay = minutesByDayAndGroup(log, from, days);
  assert.equal(byDay.length, 30);
  assert.equal(byDay[0].steadyMind, 2);
  assert.equal(byDay[26].meditation, 10);
  assert.equal(byDay.reduce((a, d) => a + d.meditation, 0), 10);
});

test('smoothing stops at today', async () => {
  const { smoothed } = await import('./practice.ts');
  const out = smoothed([7, 0, 0, 0, 0, 0, 0, 7, 7], 7, 3);
  assert.equal(out[0], 3.5);
  assert.equal(out[7], 3.5);
  assert.equal(out[8], 0);
});
