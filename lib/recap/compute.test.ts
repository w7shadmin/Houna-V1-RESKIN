import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRecap, periodBounds } from './compute.ts';
import type { LoggedSession } from '../sessionLog.ts';
import type { JournalEntry } from '../journal.ts';

const from = new Date(2026, 8, 1);
const to = new Date(2026, 9, 1);

const session = (kind: LoggedSession['kind'], exercise: string, day: number, seconds: number): LoggedSession => ({
  id: `${exercise}-${day}-${seconds}`,
  kind,
  exercise,
  startedAt: new Date(2026, 8, day, 12).getTime(),
  durationSeconds: seconds,
});

const entry = (date: string, mood: JournalEntry['mood'], text = ''): JournalEntry => ({
  id: `${date}-${mood}`,
  date,
  createdAt: 0,
  updatedAt: 0,
  text,
  mood,
});

test('sums minutes per kind and picks the most-used exercise and scene', () => {
  const r = computeRecap(
    [
      session('breathing', 'steady-mind', 2, 180),
      session('breathing', 'steady-mind', 3, 180),
      session('breathing', 'anxiety-relief', 4, 300),
      session('meditation', 'rain', 5, 600),
      session('meditation', 'fire', 6, 90),
    ],
    [],
    from,
    to,
  );
  assert.equal(r.breathingMinutes, 11);
  assert.equal(r.goToExercise, 'steady-mind');
  assert.equal(r.meditationMinutes, 12); // 690s → 11.5 → 12
  assert.equal(r.favouriteScene, 'fire'); // tie on count → most recent
});

test('journal: distinct days, words, and mood counts within the period only', () => {
  const r = computeRecap(
    [],
    [
      entry('2026-09-01', 'calm', 'A good start'),
      entry('2026-09-01', 'tired', ''),
      entry('2026-09-15', 'calm', 'still  here'),
      entry('2026-08-31', 'sad', 'outside the period'),
      entry('2026-10-01', 'sad', 'also outside'),
    ],
    from,
    to,
  );
  assert.equal(r.journalDays, 2);
  assert.equal(r.wordsWritten, 5);
  assert.deepEqual(r.moods, [
    { mood: 'calm', count: 2 },
    { mood: 'tired', count: 1 },
  ]);
});

test('empty period', () => {
  const r = computeRecap([], [], from, to);
  assert.equal(r.breathingMinutes, 0);
  assert.equal(r.goToExercise, null);
  assert.equal(r.journalDays, 0);
  assert.deepEqual(r.moods, []);
});

test('period bounds: calendar month and year', () => {
  const now = new Date(2026, 8, 25, 15);
  assert.deepEqual(periodBounds('month', now), { from: new Date(2026, 8, 1), to: new Date(2026, 9, 1) });
  assert.deepEqual(periodBounds('year', now), { from: new Date(2026, 0, 1), to: new Date(2027, 0, 1) });
  // December rolls into January of the next year.
  assert.deepEqual(periodBounds('month', new Date(2026, 11, 5)).to, new Date(2027, 0, 1));
});
