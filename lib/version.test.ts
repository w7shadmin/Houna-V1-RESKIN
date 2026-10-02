import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, isBelowMinimum } from './version.ts';

test('compares part by part, as numbers', () => {
  assert.ok(compareVersions('1.0.10', '1.0.9') > 0);
  assert.ok(compareVersions('1.0.2', '1.0.10') < 0);
  assert.equal(compareVersions('1.0', '1.0.0'), 0);
  assert.ok(compareVersions('2.0.0', '1.99.99') > 0);
});

test('only an older version is below the minimum', () => {
  assert.equal(isBelowMinimum('1.0.1', '1.0.2'), true);
  assert.equal(isBelowMinimum('1.0.2', '1.0.2'), false);
  assert.equal(isBelowMinimum('1.0.3', '1.0.2'), false);
  assert.equal(isBelowMinimum('1.0.2', '0.0.0'), false);
  assert.equal(isBelowMinimum(null, '1.0.2'), false);
  assert.equal(isBelowMinimum('1.0.2', undefined), false);
});
