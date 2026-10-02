import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageGroupsIn, cleanServiceTags, countriesIn, countryOptions, professionGroup } from './directoryFilters.ts';

test('roles group by the words in them, English and Arabic', () => {
  assert.equal(professionGroup('Consultant Psychiatrist'), 'psychiatrist');
  assert.equal(professionGroup('Child and Adolescent Psychiatrist'), 'psychiatrist');
  assert.equal(professionGroup('Licensed Clinical Psychologist and Psychotherapist'), 'psychologist');
  assert.equal(professionGroup('Counselling Psychologist'), 'psychologist');
  assert.equal(professionGroup('Speech and Language Pathologist'), 'development');
  assert.equal(professionGroup('Behavioural Skills Trainer'), 'development');
  assert.equal(professionGroup('Psychomotor Therapist'), 'development');
  assert.equal(professionGroup('Occupational Therapist'), 'development');
  assert.equal(professionGroup('Psychotherapist'), 'therapist');
  assert.equal(professionGroup('Life Coach'), 'therapist');
  assert.equal(professionGroup('أخصائي نفسي إكلينيكي'), 'psychologist');
  assert.equal(professionGroup('طبيب نفسي'), 'psychiatrist');
  assert.equal(professionGroup('أخصائية نطق وتخاطب'), 'development');
  assert.equal(professionGroup(''), null);
  assert.equal(professionGroup('Consultant'), null);
});

test('countries come out of a location line, each once', () => {
  assert.deepEqual(countriesIn('Iraq & United Kingdom'), ['Iraq', 'United Kingdom']);
  assert.deepEqual(countriesIn('Bahrain, Saudi Arabia & Kuwait'), ['Bahrain', 'Saudi Arabia', 'Kuwait']);
  assert.deepEqual(countriesIn('الكويت, عمان'), ['الكويت', 'عمان']);
  assert.deepEqual(countriesIn(''), []);
  assert.deepEqual(countryOptions(['Kuwait', 'Kuwait & Oman', 'Oman', 'Kuwait'])[0], { name: 'Kuwait', count: 3 });
});

test('who someone works with', () => {
  assert.deepEqual(ageGroupsIn('Children, Adolescents & Adults'), ['children', 'adolescents', 'adults']);
  assert.deepEqual(ageGroupsIn('Children & Adolescents'), ['children', 'adolescents']);
  assert.deepEqual(ageGroupsIn('الأطفال & المراهقين'), ['children', 'adolescents']);
  assert.deepEqual(ageGroupsIn('الكبار'), ['adults']);
  assert.deepEqual(ageGroupsIn('Couples'), ['adults']);
});

test('service tags are tidied: Pilates, no full stops, no repeats', () => {
  assert.deepEqual(cleanServiceTags(['Pilate', 'Private Sessions.', 'Yoga Therapy', 'Yoga therapy', ' yoga', '']), [
    'Pilates',
    'Private Sessions',
    'Yoga Therapy',
    'Yoga',
  ]);
  assert.deepEqual(cleanServiceTags(['Pilates']), ['Pilates']);
});
