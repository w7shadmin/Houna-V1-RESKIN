import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pieces, whyLine } from './searchHighlight.ts';
import { SearchIndex } from './searchRank.ts';

const lit = (...w: string[]) => new Set(w);

test('pieces light matched words and keep the text whole', () => {
  const p = pieces('Understanding Vicarious Trauma, in Responders', lit('trauma'));
  assert.equal(p.map((x) => x.text).join(''), 'Understanding Vicarious Trauma, in Responders');
  assert.deepEqual(p.filter((x) => x.lit).map((x) => x.text), ['Trauma']);
  assert.deepEqual(pieces('Nothing here', new Set()), [{ text: 'Nothing here', lit: false }]);
});

test('Arabic words light through their folded form', () => {
  const p = pieces('تمرين للتغلب على نوبات القلق', lit('القلق'));
  assert.deepEqual(p.filter((x) => x.lit).map((x) => x.text), ['القلق']);
});

const abrar = {
  info: { location: 'Saudi Arabia', languages: 'Arabic & English', 'work with': 'Adults' },
  specialties: '– DBT – Mindfulness – Trauma and trauma based therapy – Sexual abuse – EMDR',
};

test('the why line leads with the specialty that matched', () => {
  assert.equal(whyLine(abrar, lit('trauma')), 'Trauma and trauma based therapy · Saudi Arabia · Arabic & English');
  assert.equal(whyLine(abrar, lit('emdr')), 'EMDR · Saudi Arabia · Arabic & English');
  assert.equal(whyLine({ info: { location: 'Bahrain' }, specialties: 'anxiety, trauma, relationships' }, lit('trauma')), 'trauma · Bahrain');
});

test('who they work with, when that matched', () => {
  assert.equal(whyLine({ info: { location: 'Kuwait', 'work with': 'Children' }, specialties: null }, lit('children')), 'Children · Kuwait');
});

test('location and languages when the match was elsewhere; Arabic labels too', () => {
  assert.equal(whyLine(abrar, lit('abrar')), 'Saudi Arabia · Arabic & English');
  assert.equal(whyLine({ info: { 'الموقع': 'الكويت', 'اللغات': 'إنجليزي & عربي' }, specialties: null }, lit('x')), 'الكويت · إنجليزي & عربي');
  assert.equal(whyLine(undefined, lit('x')), '');
});

test('the index reports matched words and a corrected spelling', () => {
  const idx = new SearchIndex([
    { item: 'a', title: '14 exercises to overcome anxiety attacks', fields: [{ text: '14 exercises to overcome anxiety attacks', weight: 3 }] },
    { item: 'b', title: 'Better sleep', fields: [{ text: 'Better sleep', weight: 3 }] },
  ]);
  const typo = idx.query('anxeity');
  assert.deepEqual(typo.items, ['a']);
  assert.equal(typo.corrected, 'anxiety');
  assert.ok(typo.lit.has('anxiety'));
  const typed = idx.query('anxiety');
  assert.equal(typed.corrected, null);
  assert.deepEqual(idx.query('anxeity', { exact: true }).items, []);
  assert.equal(idx.query('sleep').corrected, null);
});
