import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stopProps } from './svgStop.ts';

test('a translucent rgba colour splits its alpha into stopOpacity', () => {
  assert.deepEqual(stopProps('rgba(111,214,207,0.36)'), { stopColor: 'rgb(111,214,207)', stopOpacity: 0.36 });
});

test('an explicit opacity multiplies the colour’s own alpha', () => {
  assert.deepEqual(stopProps('rgba(111,214,207,0.5)', 0.5), { stopColor: 'rgb(111,214,207)', stopOpacity: 0.25 });
  assert.deepEqual(stopProps('rgba(111,214,207,0.5)', 0), { stopColor: 'rgb(111,214,207)', stopOpacity: 0 });
});

test('opaque colours pass straight through', () => {
  assert.deepEqual(stopProps('#6FD6CF'), { stopColor: '#6FD6CF', stopOpacity: 1 });
  assert.deepEqual(stopProps('rgb(1, 2, 3)', 0.4), { stopColor: 'rgb(1,2,3)', stopOpacity: 0.4 });
});
