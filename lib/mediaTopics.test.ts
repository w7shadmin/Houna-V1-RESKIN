import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mediaTopics } from './mediaTopics.ts';

test('pieces sort by the words in them, English and Arabic', () => {
  assert.deepEqual(mediaTopics('Helping children with anxiety'), ['anxiety', 'children']);
  assert.deepEqual(mediaTopics('Understanding dyslexia', 'A learning difference'), ['neurodiversity']);
  assert.deepEqual(mediaTopics('Burnout at work'), ['work']);
  assert.deepEqual(mediaTopics('القلق عند الأطفال'), ['anxiety', 'children']);
  assert.deepEqual(mediaTopics('اضطراب طيف التوحد'), ['neurodiversity']);
  assert.deepEqual(mediaTopics('Annual report'), []);
});
