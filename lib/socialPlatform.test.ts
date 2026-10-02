import { test } from 'node:test';
import assert from 'node:assert/strict';
import { platformOf } from './socialPlatform.ts';

test('recognises platforms from their links', () => {
  assert.equal(platformOf('https://www.instagram.com/etizantherapy/'), 'instagram');
  assert.equal(platformOf('https://www.tiktok.com/@someone'), 'tiktok');
  assert.equal(platformOf('https://www.snapchat.com/add/someone'), 'snapchat');
  assert.equal(platformOf('https://wa.me/96512345678'), 'whatsapp');
  assert.equal(platformOf('https://api.whatsapp.com/send?phone=965'), 'whatsapp');
  assert.equal(platformOf('https://x.com/someone'), 'x');
  assert.equal(platformOf('https://twitter.com/someone'), 'x');
  assert.equal(platformOf('https://m.facebook.com/page'), 'facebook');
  assert.equal(platformOf('https://youtu.be/abc'), 'youtube');
  assert.equal(platformOf('https://www.linkedin.com/in/someone'), 'linkedin');
  assert.equal(platformOf('https://t.me/someone'), 'telegram');
  assert.equal(platformOf('https://www.threads.net/@someone'), 'threads');
});

test('the link wins over a wrong or vague label', () => {
  assert.equal(platformOf('https://www.instagram.com/x', 'facebook'), 'instagram');
  assert.equal(platformOf('https://www.tiktok.com/@a', 'link'), 'tiktok');
});

test('falls back to the label, then to a plain website', () => {
  assert.equal(platformOf('not a url', 'Twitter'), 'x');
  assert.equal(platformOf('https://clinic.example.com'), 'web');
  assert.equal(platformOf('https://clinic.example.com', 'website'), 'web');
});

test('look-alike hosts are not mistaken for platforms', () => {
  assert.equal(platformOf('https://notinstagram.com/a'), 'web');
  assert.equal(platformOf('https://box.com/a'), 'web');
});
