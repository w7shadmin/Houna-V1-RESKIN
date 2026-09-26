import { editDistance, normalizeForSearch, wordForms, words } from './searchText.ts';

/**
 * Whether a directory search sounds like someone in crisis (thinking of
 * suicide, of hurting themselves, or asking for emergency help), so the search
 * puts a crisis card first, above every result. CLAUDE.md: crisis resources
 * must never be buried.
 *
 * Deliberately generous: showing the card to someone researching the topic
 * costs little; missing someone who needs it costs a great deal. Never logged
 * or sent anywhere; this runs on the device.
 *
 * DRAFT: the word lists need review by a clinician fluent in Gulf Arabic
 * before release, as crisisStrings.ts does.
 */

/** Single words, matched as a word's start (so "suicid" covers suicide, suicidal) or with one typo. */
const WORDS = [
  'suicide', 'suicidal', 'suicid', 'selfharm', 'overdose', 'crisis', 'emergency',
  'انتحار', 'انتحر', 'انتحاري', 'طوارئ', 'أزمة',
  'entehar', 'ente7ar', 'intihar', 'enti7ar',
].map(normalizeForSearch);

/** Phrases, matched in order anywhere in the query (the last word may still be being typed). */
const PHRASES = [
  'kill myself', 'killing myself', 'end my life', 'ending my life', 'take my life', 'want to die', 'wanna die',
  'wish i was dead', 'wish i were dead', 'better off dead', "don't want to live", 'dont want to live',
  'no reason to live', 'self harm', 'hurt myself', 'hurting myself', 'harm myself', 'cut myself', 'cutting myself',
  'أقتل نفسي', 'قتل نفسي', 'أنهي حياتي', 'إنهاء حياتي', 'أريد أن أموت', 'أبي أموت', 'أبغى أموت', 'ابغي اموت',
  'بدي موت', 'نفسي أموت', 'أذية نفسي', 'أذى نفسي', 'إيذاء نفسي', 'إيذاء النفس', 'أذية النفس', 'أجرح نفسي',
  'جرح نفسي', 'لا أريد العيش', 'ما أبي أعيش', 'ما ابغى اعيش', 'أزمة نفسية',
  'abi amoot', 'abi amot', 'abgha amoot', 'ana bamoot', 'bamoot',
].map((p) => words(p));

export function isCrisisQuery(query: string): boolean {
  const qs = words(query);
  if (qs.length === 0) return false;
  for (const q of qs) {
    const forms = wordForms(q);
    for (const w of WORDS) {
      if (forms.some((f) => f.startsWith(w))) return true;
      if (w.length >= 6 && q.length >= 5 && editDistance(q, w, 1) <= 1) return true;
    }
  }
  for (const phrase of PHRASES) {
    for (let at = 0; at + phrase.length <= qs.length; at++) {
      const ok = phrase.every((p, k) => {
        const q = qs[at + k];
        const last = k === phrase.length - 1 && at + k === qs.length - 1;
        return q === p || wordForms(q).includes(p) || (last && q.length >= 2 && p.startsWith(q));
      });
      if (ok) return true;
    }
  }
  return false;
}
