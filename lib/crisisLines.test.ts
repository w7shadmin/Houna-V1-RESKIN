import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRISIS_COUNTRIES, CRISIS_LINES, crisisLinesFor, dialString, resolveCrisisCountry } from './crisisLines.ts';

test('only verified lines, except emergency numbers, which may be likely', () => {
  for (const l of CRISIS_LINES) {
    assert.ok(l.confidence === 'verified' || (l.confidence === 'likely' && l.kind === 'emergency'), `${l.country} ${l.name.en}`);
  }
});

test('every line is complete in both languages, with a source and a dialable number', () => {
  for (const l of CRISIS_LINES) {
    const id = `${l.country} ${l.name.en}`;
    assert.ok(l.name.en && l.name.ar, id);
    assert.ok(l.source, id);
    assert.match(dialString(l.phone), /^\+?\d{2,15}$/, id);
    for (const b of [l.hours, l.area, l.extra]) if (b) assert.ok(b.en && b.ar, id);
    assert.ok((CRISIS_COUNTRIES as readonly string[]).includes(l.country), id);
  }
});

test('every country has an emergency number, listed first', () => {
  for (const c of CRISIS_COUNTRIES) {
    const lines = crisisLinesFor(c);
    assert.ok(lines.length > 0, c);
    assert.equal(lines[0].kind, 'emergency', c);
  }
});

test('no number is listed twice in one country', () => {
  for (const c of CRISIS_COUNTRIES) {
    const nums = crisisLinesFor(c).map((l) => `${l.kind}:${dialString(l.phone)}`);
    assert.equal(new Set(nums).size, nums.length, c);
  }
});

test('the chosen country wins, then the profile, then the phone; unknown ones are skipped', () => {
  assert.equal(resolveCrisisCountry('LB', 'AE', 'SA'), 'LB');
  assert.equal(resolveCrisisCountry(null, 'ae', 'SA'), 'AE');
  assert.equal(resolveCrisisCountry(undefined, 'GB', 'om'), 'OM');
  assert.equal(resolveCrisisCountry(null, 'GB', 'US'), null);
  assert.deepEqual(crisisLinesFor(null), []);
});

test('dial strings keep only digits and a leading plus', () => {
  assert.equal(dialString('+974 4494 6000'), '+97444946000');
  assert.equal(dialString('800 725462'), '800725462');
});
