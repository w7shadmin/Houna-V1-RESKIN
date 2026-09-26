import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isCrisisQuery } from './crisisIntent.ts';

test('English crisis searches, typos included', () => {
  for (const q of ['suicide', 'Suicidal thoughts', 'sucide', 'I want to die', 'kill myself', 'self-harm', 'self harm', 'selfharm', 'hurting myself', "don't want to live", 'crisis line', 'emergency', 'I wanna di']) {
    assert.ok(isCrisisQuery(q), q);
  }
});

test('Arabic and Arabizi crisis searches', () => {
  for (const q of ['انتحار', 'الانتحار', 'أفكار انتحارية', 'أبي أموت', 'ابي اموت', 'أريد أن أموت', 'إيذاء النفس', 'ايذاء نفسي', 'أقتل نفسي', 'طوارئ', 'entehar', 'abi amoot']) {
    assert.ok(isCrisisQuery(q), q);
  }
});

test('ordinary searches are not crisis searches', () => {
  for (const q of ['anxiety', 'depression', 'sleep', 'Sarah Almarzooqi', 'قلق', 'اكتئاب', 'children', 'dietitian', 'die hard', 'self esteem', '']) {
    assert.ok(!isCrisisQuery(q), q);
  }
});
