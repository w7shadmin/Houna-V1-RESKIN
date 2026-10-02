/**
 * Houna's own directory filters (the professionals list's, since 1 Oct 2026, instead of houna.org's):
 * worked out on the phone from what the lists and each professional's page already say. Pure, so
 * `npm test` covers them. Roles are free text on houna.org (153 different ones for 286 people), so
 * professions are grouped by the words in them, English and Arabic.
 */

export type ProfessionGroup = 'psychologist' | 'psychiatrist' | 'therapist' | 'development';
export const PROFESSION_GROUPS: readonly ProfessionGroup[] = ['psychologist', 'psychiatrist', 'therapist', 'development'];

export type AgeGroup = 'children' | 'adolescents' | 'adults';
export const AGE_GROUPS: readonly AgeGroup[] = ['children', 'adolescents', 'adults'];

const low = (s: string | null | undefined) => (s ?? '').toLowerCase();

/** Arabic spelling variants folded (hamzas, final ya, ta marbuta), so one pattern matches all. */
const fold = (s: string) => s.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

/**
 * Which group a role belongs to; null when it doesn't say (blank, "Consultant", "Clinical Supervisor") or
 * isn't a mental-health role (physiotherapy, exercise therapy, nutrition, neurology): those stay out of
 * "Therapists", where someone looking for talking therapy would otherwise find them. Order matters.
 */
export function professionGroup(role: string | null | undefined): ProfessionGroup | null {
  const r = fold(role ?? '');
  if (!r.trim()) return null;
  if (/psychiatr|طبيب نفسي|طبيبه نفسيه|الطب النفسي|طب نفسي/.test(r)) return 'psychiatrist';
  // Children's development: speech, behaviour, occupational and psychomotor therapy, special education.
  if (/speech|language patholog|\bslp\b|behavio|occupational|psychomotor|\baba\b|special education|نطق|تخاطب|سلوك|وظيفي|حركي|تربيه خاصه/.test(r)) return 'development';
  if (/psycholog|psychometric|نفسي|نفسيه|علم نفس|علم النفس|نفساني/.test(r)) return 'psychologist';
  if (/physio|physical (medicine|therap)|exercise|dietit|nutrition|neurolog|osteopath|علاج طبيعي|فيزيائي|بالتمارين|تغذي|اعصاب|عظمي|قاع الحوض/.test(r)) return null;
  if (/therap|counsel|coach|clinician|practitioner|mental health|social work|grief|addiction|ادمان|معالج|علاج|مستشار|مرشد|ارشاد|اجتماعي|الصحه النفسيه|الصحه العقليه/.test(r)) return 'therapist';
  return null;
}

/** The countries in a location line ("Iraq & United Kingdom", "الكويت, عمان"), each once. */
export function countriesIn(location: string | null | undefined): string[] {
  return [...new Set(low(location) ? (location as string).split(/\s*(?:,|،|&|\band\b|\sو\s)\s*/).map((c) => c.trim()).filter(Boolean) : [])];
}

/** Who someone works with, from their "Work with" line. */
export function ageGroupsIn(workWith: string | null | undefined): AgeGroup[] {
  const w = low(workWith);
  const out: AgeGroup[] = [];
  if (/child|kid|infant|toddler|طفل|أطفال|الأطفال|اطفال/.test(w)) out.push('children');
  if (/adolescen|teen|youth|young|مراهق|المراهقين|الشباب/.test(w)) out.push('adolescents');
  if (/adult|couple|famil|elder|بالغ|الكبار|كبار|أزواج|الأزواج|عائل|أسر/.test(w)) out.push('adults');
  return out;
}

/** Every country named across the list, most professionals first, each with how many. */
export function countryOptions(locations: (string | null | undefined)[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const loc of locations) for (const c of countriesIn(loc)) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** houna.org's spellings fixed where its tags (split from a summary) get them wrong. */
const TAG_FIXES: [RegExp, string][] = [
  [/\bpilate\b/gi, 'Pilates'],
];

/**
 * A wellness center's service tags, tidied: houna.org builds them by splitting the summary at commas,
 * so they arrive with full stops, odd capitals, repeats and the odd misspelling ("Pilate").
 */
export function cleanServiceTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    let t = raw.replace(/\s+/g, ' ').replace(/[\s.,;:]+$/, '').trim();
    if (!t) continue;
    for (const [re, fix] of TAG_FIXES) t = t.replace(re, fix);
    t = t.charAt(0).toUpperCase() + t.slice(1);
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
