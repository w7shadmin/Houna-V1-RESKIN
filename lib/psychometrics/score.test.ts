// Run with `npm test` (Node's built-in test runner; Node strips the types).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreTest, validateTest } from './score.ts';
import type { TestDefinition } from './types.ts';

const L = (s: string) => ({ en: s, ar: s });

const def: TestDefinition = {
  id: 'fixture',
  version: 1,
  title: L('Fixture'),
  description: L('Fixture'),
  source: { citation: '', licence: '', url: '' },
  scale: { min: 1, max: 5, labels: { en: ['1', '2', '3', '4', '5'], ar: ['1', '2', '3', '4', '5'] } },
  traits: [
    { key: 'a', label: L('A'), description: L('A') },
    { key: 'b', label: L('B'), description: L('B') },
  ],
  items: [
    { id: 'a1', text: L('a1'), trait: 'a', reverse: false },
    { id: 'a2', text: L('a2'), trait: 'a', reverse: true },
    { id: 'b1', text: L('b1'), trait: 'b', reverse: false },
  ],
  scoring: {
    method: 'mean',
    bands: [
      { max: 5, label: L('Higher') },
      { max: 2.5, label: L('Lower') },
      { max: 3.5, label: L('Middle') },
    ],
  },
};

test('means per trait, with reverse-scored items flipped', () => {
  // a: a1=5, a2=1 reversed → 5 → mean 5. b: 2.
  const s = scoreTest(def, { a1: 5, a2: 1, b1: 2 });
  assert.equal(s.a.raw, 5);
  assert.equal(s.b.raw, 2);
});

test('normalises onto 0–1 across the scale', () => {
  const s = scoreTest(def, { a1: 1, a2: 5, b1: 3 });
  assert.equal(s.a.normalised0to1, 0);
  assert.equal(s.b.normalised0to1, 0.5);
});

test('picks the first band the mean does not exceed, regardless of band order', () => {
  assert.equal(scoreTest(def, { b1: 2 }).b.band.en, 'Lower');
  assert.equal(scoreTest(def, { b1: 3 }).b.band.en, 'Middle');
  assert.equal(scoreTest(def, { b1: 4 }).b.band.en, 'Higher');
  // Exactly on a boundary belongs to the lower band.
  assert.equal(scoreTest(def, { a1: 3, a2: 4 }).a.band.en, 'Lower'); // (3 + 2) / 2 = 2.5
});

test('skips unanswered items and omits traits with no answers', () => {
  const s = scoreTest(def, { a1: 4 });
  assert.equal(s.a.raw, 4);
  assert.equal('b' in s, false);
});

test('rejects answers outside the scale', () => {
  assert.throws(() => scoreTest(def, { a1: 6 }), RangeError);
  assert.throws(() => scoreTest(def, { a1: 0 }), RangeError);
});

test('validateTest accepts a well-formed test', () => {
  assert.deepEqual(validateTest(def), []);
});

const screener: TestDefinition = {
  ...def,
  id: 'screener',
  scale: { min: 0, max: 3, labels: { en: ['0', '1', '2', '3'], ar: ['0', '1', '2', '3'] } },
  traits: [{ key: 'total', label: L('Total'), description: L('Total') }],
  items: [
    { id: 's1', text: L('s1'), trait: 'total', reverse: false, threshold: 2 },
    { id: 's2', text: L('s2'), trait: 'total', reverse: false, threshold: 3 },
    { id: 's3', text: L('s3'), trait: 'total', reverse: false, threshold: 2 },
  ],
  scoring: {
    method: 'sum',
    bands: [
      { max: 4, label: L('Low') },
      { max: 9, label: L('High'), description: L('Talk to someone'), concern: true },
    ],
  },
};

test('sum: totals the answers, with the range and the band’s meaning', () => {
  const s = scoreTest(screener, { s1: 3, s2: 3, s3: 1 });
  assert.equal(s.total.raw, 7);
  assert.equal(s.total.max, 9);
  assert.equal(s.total.band.en, 'High');
  assert.equal(s.total.bandDescription?.en, 'Talk to someone');
  assert.equal(s.total.concern, true);
  assert.equal(scoreTest(screener, { s1: 1, s2: 1, s3: 1 }).total.concern, undefined);
});

test('sum: a multiplier scales the total and its range (WHO-5 percentages)', () => {
  const pct = { ...screener, scoring: { ...screener.scoring, multiplier: 4, bands: [{ max: 36, label: L('All') }] } };
  const s = scoreTest(pct, { s1: 3, s2: 3, s3: 3 });
  assert.equal(s.total.raw, 36);
  assert.equal(s.total.max, 36);
  assert.equal(s.total.normalised0to1, 1);
});

test('count: counts items at or above their threshold (ASRS shaded boxes)', () => {
  const counted = { ...screener, scoring: { method: 'count' as const, bands: [{ max: 1, label: L('Few') }, { max: 3, label: L('Many') }] } };
  const s = scoreTest(counted, { s1: 2, s2: 2, s3: 3 });
  assert.equal(s.total.raw, 2); // s1 ≥ 2, s2 < 3, s3 ≥ 2
  assert.equal(s.total.max, 3);
  assert.equal(s.total.band.en, 'Many');
  assert.ok(validateTest({ ...counted, items: [{ ...counted.items[0], threshold: undefined }] }).length > 0);
});

test('validateTest checks bands against the summed range', () => {
  assert.deepEqual(validateTest(screener), []);
  assert.ok(validateTest({ ...screener, scoring: { method: 'sum', bands: [{ max: 3, label: L('x') }] } }).length > 0);
});

test('validateTest allows empty Arabic only while it’s pending', () => {
  const noArabic = { ...screener, items: screener.items.map((i) => ({ ...i, text: { en: i.text.en, ar: '' } })) };
  assert.ok(validateTest(noArabic).length > 0);
  assert.deepEqual(validateTest({ ...noArabic, arabicPending: true }), []);
});

test('validateTest refuses risk-screening tests and broken definitions', () => {
  assert.ok(validateTest({ ...def, screensForRisk: true }).length > 0);
  assert.ok(validateTest({ ...def, items: [{ ...def.items[0], trait: 'nope' }] }).length > 0);
  assert.ok(
    validateTest({ ...def, scale: { ...def.scale, labels: { en: ['1'], ar: ['1'] } } }).length > 0,
  );
  assert.ok(validateTest({ ...def, scoring: { method: 'mean', bands: [{ max: 3, label: L('x') }] } }).length > 0);
});
