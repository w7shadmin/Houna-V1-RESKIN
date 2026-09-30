import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notificationPath } from './pushPath.ts';

test('opens Houna’s own screens', () => {
  assert.equal(notificationPath({ url: '/tanafas' }), '/tanafas');
  assert.equal(notificationPath({ url: '/events/some-event' }), '/events/some-event');
  assert.equal(notificationPath({ url: '/' }), '/');
  assert.equal(notificationPath({ url: '/crisis?country=KW' }), '/crisis?country=KW');
});

test('never an outside address, or a screen not on the list', () => {
  assert.equal(notificationPath({ url: 'https://example.com' }), null);
  assert.equal(notificationPath({ url: '//example.com/x' }), null);
  assert.equal(notificationPath({ url: '/tanafas/../https://x' }), null);
  assert.equal(notificationPath({ url: '/account-delete-trick' }), null);
  assert.equal(notificationPath({ url: '/welcome' }), null);
  assert.equal(notificationPath({ url: 42 }), null);
  assert.equal(notificationPath(null), null);
  assert.equal(notificationPath({}), null);
  assert.equal(notificationPath({ url: '/' + 'a'.repeat(300) }), null);
});
