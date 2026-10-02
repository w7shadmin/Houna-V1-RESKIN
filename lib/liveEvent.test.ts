import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIVE_LEAD_MS, liveState, parseLiveEvent } from './liveEvent.ts';

const good = {
  video_id: 'dQw4w9WgXcQ',
  title_en: 'Talking about burnout',
  title_ar: 'حديث عن الاحتراق',
  starts_at: '2026-10-10T16:00:00Z',
  ends_at: '2026-10-10T18:00:00Z',
  event_slug: 'talking-about-burnout',
};

test('a complete setting parses', () => {
  const e = parseLiveEvent(good);
  assert.ok(e);
  assert.equal(e.videoId, 'dQw4w9WgXcQ');
  assert.equal(e.eventSlug, 'talking-about-burnout');
  assert.equal(e.endsAt - e.startsAt, 2 * 60 * 60 * 1000);
});

test('empty, broken or unsafe settings show nothing', () => {
  assert.equal(parseLiveEvent({}), null);
  assert.equal(parseLiveEvent(null), null);
  assert.equal(parseLiveEvent({ ...good, video_id: 'https://evil.example/x' }), null);
  assert.equal(parseLiveEvent({ ...good, ends_at: good.starts_at }), null);
  assert.equal(parseLiveEvent({ ...good, ends_at: '2026-10-12T18:00:00Z' }), null);
  assert.equal(parseLiveEvent({ ...good, title_en: '', title_ar: '' }), null);
  assert.equal(parseLiveEvent({ ...good, event_slug: '../admin' })?.eventSlug, null);
});

test('one title fills in for the other', () => {
  const e = parseLiveEvent({ ...good, title_ar: '' });
  assert.equal(e?.titleAr, 'Talking about burnout');
});

test('soon within the hour before, live until the end, nothing otherwise', () => {
  const e = parseLiveEvent(good)!;
  assert.equal(liveState(e, e.startsAt - LIVE_LEAD_MS - 1), null);
  assert.equal(liveState(e, e.startsAt - LIVE_LEAD_MS), 'soon');
  assert.equal(liveState(e, e.startsAt - 1), 'soon');
  assert.equal(liveState(e, e.startsAt), 'live');
  assert.equal(liveState(e, e.endsAt - 1), 'live');
  assert.equal(liveState(e, e.endsAt), null);
  assert.equal(liveState(null, e.startsAt), null);
});
