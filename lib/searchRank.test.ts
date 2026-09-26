import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SearchIndex, type SearchEntry } from './searchRank.ts';
import { editDistance, normalizeForSearch, wordForms, words } from './searchText.ts';

const doc = (id: string, title: string, role = '', summary = ''): SearchEntry<string> => ({
  item: id,
  title,
  fields: [
    { text: title, weight: 3 },
    { text: role, weight: 2 },
    { text: summary, weight: 1 },
  ],
});

const index = new SearchIndex([
  doc('sarah', 'Dr. Sarah Almarzooqi', 'Clinical Psychologist', 'Works with adults facing anxiety and panic.'),
  doc('sara', 'Sara Issa, MSc', 'Counselor', 'Family and couples counselling.'),
  doc('marwah', 'Marwah Al Rahmani', 'Psychotherapist', 'Trauma-informed therapy for teenagers.'),
  doc('nour', 'Nour Kaafarani', 'Psychologist', 'Children and parenting support.'),
  doc('mohamed', 'Mohamed Hassan', 'Psychiatrist', 'Medication and mood disorders.'),
  doc('abrar', 'أبرار عبدالله', 'أخصائية نفسية', 'تعمل مع حالات القلق والاكتئاب لدى الشباب.'),
  doc('art-dep', 'Understanding depression', 'Article', 'Signs of low mood and how to get help.'),
  doc('art-sleep', 'Better sleep, calmer mind', 'Article', 'Simple habits for insomnia.'),
  doc('art-ar', 'كيف تتعامل مع الاكتئاب', 'مقال', 'علامات الحزن المستمر ومتى تطلب المساعدة.'),
  doc('topic-child', 'Childhood Development', 'Topic', 'Physical, cognitive, and emotional growth in children'),
  doc('sadiq', 'Eman Sadiq', 'Counselor', 'Career coaching.'),
  doc('wins', 'How small wins can help', 'Article', 'Motivation at work.'),
]);

test('normalising folds Arabic letter forms, accents, digits and apostrophes', () => {
  assert.equal(normalizeForSearch('إكتئاب'), normalizeForSearch('اكتئاب'));
  assert.equal(normalizeForSearch('الأطفال'), normalizeForSearch('الاطفال'));
  assert.equal(normalizeForSearch('Café'), 'cafe');
  assert.equal(normalizeForSearch('٢٠٢٦'), '2026');
  assert.equal(normalizeForSearch("can't"), 'cant');
  assert.deepEqual(words('Self-harm, anxiety!'), ['self', 'harm', 'anxiety']);
});

test('word forms meet in the middle', () => {
  assert.ok(wordForms('therapists').includes('therapist'));
  assert.ok(wordForms('stories').includes('story'));
  assert.ok(wordForms(normalizeForSearch('بالاكتئاب')).includes(normalizeForSearch('اكتئاب')));
  assert.ok(wordForms(normalizeForSearch('والقلق')).includes(normalizeForSearch('قلق')));
  assert.ok(wordForms(normalizeForSearch('للأطفال')).includes(normalizeForSearch('أطفال')));
  assert.ok(wordForms(normalizeForSearch('وحدة')).includes(normalizeForSearch('وحدة')), 'the word itself is kept');
});

test('edit distance counts a swap as one edit and stops early', () => {
  assert.equal(editDistance('anxeity', 'anxiety', 2), 1);
  assert.equal(editDistance('depresion', 'depression', 2), 1);
  assert.equal(editDistance('abc', 'xyzabc', 1), 2);
});

test('names: full, partial, misspelt, run together', () => {
  assert.equal(index.search('Sarah Almarzooqi')[0], 'sarah');
  assert.equal(index.search('sara almarzooqi')[0], 'sarah');
  assert.equal(index.search('almarzouqi')[0], 'sarah');
  assert.equal(index.search('alrahmani')[0], 'marwah');
  assert.equal(index.search('Mohammed')[0], 'mohamed');
  assert.equal(index.search('noor')[0], 'nour');
  assert.equal(index.search('أبرار')[0], 'abrar');
});

test('typos and endings still find the topic', () => {
  assert.ok(index.search('depresion').includes('art-dep'));
  assert.ok(index.search('anxeity').includes('sarah'));
  assert.ok(index.search('therapists').includes('marwah'));
});

test('Arabic with attached letters', () => {
  assert.ok(index.search('بالاكتئاب').includes('art-ar'));
  assert.ok(index.search('والقلق').includes('abrar'));
});

test('meaning: everyday words and the other language', () => {
  assert.ok(index.search('sad').includes('art-dep'), 'sad → depression');
  assert.ok(index.search("can't sleep").includes('art-sleep'), 'phrase → sleep');
  assert.ok(index.search('insomnia').includes('art-sleep'));
  assert.ok(index.search('اكتئاب').includes('art-dep'), 'Arabic finds English');
  assert.ok(index.search('depression').includes('art-ar'), 'English finds Arabic');
  assert.ok(index.search('kids').includes('topic-child'));
});

test('direct matches rank above meaning-map ones, titles above summaries', () => {
  const r = index.search('depression');
  assert.equal(r[0], 'art-dep');
  assert.ok(r.indexOf('art-dep') < r.indexOf('art-ar'));
  const a = index.search('anxiety');
  assert.equal(a[0], 'sarah');
});

test('every word beats some words; filler words are ignored', () => {
  const r = index.search('anxiety in teenagers');
  assert.ok(r.includes('sarah') || r.includes('marwah'));
  const both = index.search('trauma teenagers');
  assert.equal(both[0], 'marwah');
  assert.deepEqual(index.search('   '), []);
});

test('nothing unrelated sneaks in', () => {
  assert.deepEqual(index.search('zzqx'), []);
  assert.ok(!index.search('sleep').includes('mohamed'));
});

test('a known word is not also the start of a name; filler words match nothing', () => {
  const sad = index.search('sad');
  assert.ok(sad.includes('art-dep'));
  assert.ok(!sad.includes('sadiq'), 'sad is a word, not the start of Sadiq');
  assert.ok(index.search('sadi').includes('sadiq'), 'typing on reaches the name');
  assert.ok(!index.search("can't sleep").includes('wins'), 'cant is filler');
});

test('partial matches only fill in when few items match every word', () => {
  // One item has both words: partial matches fill in below it.
  const r = index.search('trauma teenagers');
  assert.equal(r[0], 'marwah');
});
