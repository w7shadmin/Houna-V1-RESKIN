import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BADGE_ORDER, isBadgeCode, nextStreakBadge, qualifyingBadges, streakDays } from './badges.ts';

const s = (kind: 'breathing' | 'meditation', exercise: string) => ({ kind, exercise });

test('nothing practised earns nothing', () => {
  assert.deepEqual(qualifyingBadges(0, []), []);
});

test('the first session, and streak badges up to the streak', () => {
  assert.deepEqual(qualifyingBadges(8, [s('breathing', 'steady-mind')]), ['first_session', 'streak_3', 'streak_7']);
});

test('every breath needs all five exercises; a sky visit is not one of them', () => {
  const four = ['anxiety-relief', 'steady-mind', 'panic-relief', 'tension-release'].map((e) => s('breathing', e));
  assert.ok(!qualifyingBadges(0, [...four, s('breathing', 'starfield')]).includes('all_breathing'));
  assert.ok(qualifyingBadges(0, [...four, s('breathing', 'physiological-sigh')]).includes('all_breathing'));
});

test('every scene and every sky', () => {
  const scenes = ['fire', 'rain', 'forest', 'ocean'].map((e) => s('meditation', e));
  const skies = ['sunrise', 'dusk', 'starfield'].map((e) => s('breathing', e));
  const got = qualifyingBadges(0, [...scenes, ...skies]);
  assert.ok(got.includes('all_scenes'));
  assert.ok(got.includes('all_skies'));
  // The sky clock isn't one of the three.
  assert.ok(!qualifyingBadges(0, [s('breathing', 'sunrise'), s('breathing', 'dusk'), s('breathing', 'sky')]).includes('all_skies'));
});

test('results keep the shown order', () => {
  const all = qualifyingBadges(100, [
    ...['anxiety-relief', 'steady-mind', 'panic-relief', 'tension-release', 'physiological-sigh', 'sunrise', 'dusk', 'starfield'].map((e) => s('breathing', e)),
    ...['fire', 'rain', 'forest', 'ocean'].map((e) => s('meditation', e)),
  ]);
  assert.deepEqual(all, [...BADGE_ORDER]);
});

test('the next streak badge and the days to go', () => {
  assert.deepEqual(nextStreakBadge(new Set(['streak_3', 'streak_7']), 12), { code: 'streak_14', remaining: 2 });
  assert.deepEqual(nextStreakBadge(new Set(), 0), { code: 'streak_3', remaining: 3 });
  assert.equal(nextStreakBadge(new Set(['streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_100']), 120), null);
});

test('codes', () => {
  assert.equal(streakDays('streak_30'), 30);
  assert.equal(streakDays('all_scenes'), undefined);
  assert.ok(isBadgeCode('all_skies'));
  assert.ok(!isBadgeCode('mood_7'));
});
