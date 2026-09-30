import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONSTELLATIONS, constellationById, projectStars } from './constellations.ts';
import { chooseConstellation, litTimes, markComplete, type SkyProgress } from './constellationProgress.ts';

test('every constellation is well formed, easiest first', () => {
  const ids = new Set<string>();
  let last = 0;
  for (const c of CONSTELLATIONS) {
    assert.ok(!ids.has(c.id), c.id);
    ids.add(c.id);
    assert.ok(c.name.en && c.name.ar, c.id);
    assert.ok(c.stars.length >= last, `${c.id} out of order`);
    last = c.stars.length;
    for (const [a, b] of c.lines) assert.ok(a < c.stars.length && b < c.stars.length && a !== b, `${c.id} line ${a}-${b}`);
    // Every star belongs to the figure except where a constellation has a lone star (the Cross's fifth).
    const joined = new Set(c.lines.flat());
    const alone = c.stars.map((_, i) => i).filter((i) => !joined.has(i));
    assert.ok(alone.length <= 1, `${c.id} has loose stars`);
    for (const st of c.stars) assert.ok(st.ra >= 0 && st.ra < 24 && st.dec >= -90 && st.dec <= 90, c.id);
  }
  assert.equal(constellationById('orion')?.stars.length, 8);
  assert.equal(constellationById('nope'), null);
});

test('projection fits the box and looks like the sky', () => {
  for (const c of CONSTELLATIONS) {
    const pts = projectStars(c.stars, 300, 200, 20);
    for (const p of pts) {
      assert.ok(p.x >= 19.99 && p.x <= 280.01 && p.y >= 19.99 && p.y <= 180.01, `${c.id} ${JSON.stringify(p)}`);
    }
  }
  // Orion: Betelgeuse (1) is above Rigel (7), and, looking up, east (Betelgeuse) is to the left of west (Rigel).
  const orion = projectStars(constellationById('orion')!.stars, 300, 300);
  assert.ok(orion[1].y < orion[7].y);
  assert.ok(orion[1].x < orion[7].x);
  // The Little Dipper keeps its shape though Polaris is at the pole: Polaris is at one end, far from Kochab.
  const umi = projectStars(constellationById('ursa-minor')!.stars, 300, 300);
  assert.ok(Math.hypot(umi[0].x - umi[4].x, umi[0].y - umi[4].y) > 150);
});

test('each session after choosing lights the next star, up to all of them', () => {
  assert.deepEqual(litTimes([50, 200, 100, 300, 400], 100, 3), [100, 200, 300]);
  assert.deepEqual(litTimes([10, 20], 100, 5), []);
});

test('finishing is recorded once, and choosing starts afresh', () => {
  let p: SkyProgress = { current: null, completed: [] };
  p = chooseConstellation(p, 'lyra', 1000);
  p = markComplete(p, 2000);
  p = markComplete(p, 3000);
  assert.deepEqual(p.completed, [{ id: 'lyra', at: 2000 }]);
  p = chooseConstellation(p, 'lyra', 4000);
  p = markComplete(p, 5000);
  assert.equal(p.completed.length, 2);
  assert.deepEqual(p.current, { id: 'lyra', startedAt: 4000 });
});
