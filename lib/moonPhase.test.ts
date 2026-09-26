import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moonPhase, terminatorBreath } from './moonPhase.ts';

// Published 2026 new and full moons (UTC).
const NEW_MOONS = ['2026-01-18T19:52Z', '2026-05-16T20:01Z', '2026-08-12T17:37Z', '2026-10-10T15:50Z', '2026-12-09T00:52Z'];
const FULL_MOONS = ['2026-01-03T10:03Z', '2026-03-03T11:38Z', '2026-06-29T23:57Z', '2026-09-26T16:49Z', '2026-12-24T01:28Z'];

test('new moons are dark', () => {
  for (const at of NEW_MOONS) {
    const p = moonPhase(new Date(at));
    assert.equal(p.name, 'new', at);
    assert.ok(p.fraction < 0.02, `${at}: ${p.fraction}`);
    assert.ok(p.crescent && p.terminator > 0.98, at);
  }
});

test('full moons are fully lit', () => {
  for (const at of FULL_MOONS) {
    const p = moonPhase(new Date(at));
    assert.equal(p.name, 'full', at);
    assert.ok(p.fraction > 0.98, `${at}: ${p.fraction}`);
    assert.ok(!p.crescent && p.terminator > 0.98, at);
  }
});

test('quarters are half lit, on the right side', () => {
  const first = moonPhase(new Date('2026-10-18T16:13Z'));
  assert.equal(first.name, 'firstQuarter');
  assert.ok(first.waxing);
  assert.ok(Math.abs(first.fraction - 0.5) < 0.08, String(first.fraction));
  const last = moonPhase(new Date('2026-10-03T13:25Z'));
  assert.equal(last.name, 'lastQuarter');
  assert.ok(!last.waxing);
  assert.ok(Math.abs(last.fraction - 0.5) < 0.08, String(last.fraction));
});

test('crescents and gibbous moons either side of full', () => {
  assert.equal(moonPhase(new Date('2026-10-13T20:00Z')).name, 'waxingCrescent');
  assert.equal(moonPhase(new Date('2026-09-22T20:00Z')).name, 'waxingGibbous');
  assert.equal(moonPhase(new Date('2026-09-30T20:00Z')).name, 'waningGibbous');
  assert.equal(moonPhase(new Date('2026-10-07T20:00Z')).name, 'waningCrescent');
});

test('dates before the epoch still land in the cycle', () => {
  const p = moonPhase(new Date('1999-12-22T17:31Z')); // a full moon
  assert.ok(p.age >= 0 && p.fraction > 0.97, String(p.fraction));
});

test('the breath swells the lit part without crossing the quarter line', () => {
  const crescent = moonPhase(new Date('2026-10-13T20:00Z'));
  const [c0, c1] = terminatorBreath(crescent);
  assert.equal(c0, crescent.terminator);
  assert.ok(c1 < c0 && c1 >= 0);
  const gibbous = moonPhase(new Date('2026-09-22T20:00Z'));
  const [g0, g1] = terminatorBreath(gibbous);
  assert.ok(g1 > g0 && g1 <= 1);
  const [f0, f1] = terminatorBreath(moonPhase(new Date('2026-09-26T16:49Z')));
  assert.ok(f1 - f0 < 0.001, 'a full moon cannot grow');
  const nearQuarter = { ...crescent, terminator: 0.05 };
  assert.equal(terminatorBreath(nearQuarter)[1], 0);
});
