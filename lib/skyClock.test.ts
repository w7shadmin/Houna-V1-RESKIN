import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstLight, skyAt, skyTimeline, sunTimes } from './skyClock.ts';

// Whatever the machine's time zone, solar noon is near the clock's noon, so these hold anywhere.
const day = (h: number, m = 0) => new Date(2026, 8, 27, h, m);

test('near the equinox the day is about twelve hours, sunrise before noon, sunset after', () => {
  const { sunrise, sunset } = sunTimes(day(12));
  const hours = (sunset.getTime() - sunrise.getTime()) / 3_600_000;
  assert.ok(hours > 11.6 && hours < 12.6, `day length ${hours}`);
  assert.ok(sunrise.getHours() >= 5 && sunrise.getHours() <= 7);
  assert.ok(sunset.getHours() >= 17 && sunset.getHours() <= 19);
});

test('the parts of the day come round in order', () => {
  assert.equal(skyAt(day(1)).part, 'night');
  assert.equal(skyAt(day(12)).part, 'day');
  assert.equal(skyAt(day(23)).part, 'night');
  const { sunrise, sunset } = sunTimes(day(12));
  assert.equal(skyAt(new Date(sunrise.getTime() - 20 * 60_000)).part, 'dawn');
  assert.equal(skyAt(new Date(sunset.getTime() + 20 * 60_000)).part, 'dusk');
});

test('the sun stands highest at noon, below the hills at night, rising in the east (left)', () => {
  const noon = skyAt(day(12)), morning = skyAt(day(9)), night = skyAt(day(0));
  assert.ok(noon.sun.y < morning.sun.y);
  assert.ok(night.sun.y > 0.68);
  assert.ok(morning.sun.x < 0.5 && skyAt(day(15)).sun.x > 0.5);
});

test('only one twilight shows, and never under full night or full day', () => {
  for (let h = 0; h < 24; h += 0.25) {
    const s = skyAt(new Date(2026, 8, 27, Math.floor(h), (h % 1) * 60));
    assert.ok(s.dawn === 0 || s.dusk === 0);
    for (const v of [s.dawn, s.dusk, s.day, s.night]) assert.ok(v >= 0 && v <= 1);
  }
});

test('first light is before now, and within a day', () => {
  for (const h of [3, 9, 20]) {
    const now = day(h), light = firstLight(now);
    assert.ok(light.getTime() <= now.getTime());
    assert.ok(now.getTime() - light.getTime() < 24 * 3_600_000);
  }
});

test('a timeline samples evenly from its start to its end', () => {
  const tl = skyTimeline(day(6), day(18), 12);
  assert.equal(tl.at.length, 13);
  assert.equal(tl.at[0], 0);
  assert.equal(tl.at[12], 1);
  assert.equal(tl.states[6].part, 'day');
});
