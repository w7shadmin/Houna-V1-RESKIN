/**
 * Text handling for the directory search: folding text so small differences
 * don't matter, splitting it into words, the forms a word can take (English
 * endings, Arabic attached letters), and a bounded typo distance.
 */

/**
 * Case-, accent- and Arabic-letter-form-insensitive: strips Latin accents,
 * Arabic harakat and tatweel, folds alef/yaa/taa-marbuta/hamza carrier
 * variants (and the Persian yeh and keheh) so "إكتئاب", "اكتئاب" and "الاكتئاب"
 * line up, reads Arabic-Indic digits as 0–9, and drops apostrophes ("can't" → "cant").
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    // Digits first: they sit inside the harakat range below, which would delete them.
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/['’‘`]/g, '')
    .toLowerCase();
}

/** Normalised words: anything that isn't a letter or digit separates them. */
export function words(text: string): string[] {
  return normalizeForSearch(text)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

const ARABIC = /[؀-ۿ]/;
export const isArabic = (word: string) => ARABIC.test(word);

/**
 * Filler words dropped from a query that has other words in it ("anxiety in
 * children" → anxiety, children). Normalised. Not "علي": it's also a name.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'about', 'from', 'by', 'as',
  'my', 'me', 'i', 'im', 'ive', 'is', 'are', 'be', 'am', 'it', 'this', 'that', 'how', 'what', 'who', 'where', 'can', 'do', 'does',
  'cant', 'dont', 'wont', 'doesnt', 'isnt', 'not', 'no', 'feel', 'feeling',
  'في', 'من', 'عن', 'مع', 'او', 'الي', 'و', 'ف', 'كيف', 'ما', 'ماذا', 'هل', 'انا', 'عند', 'لدي', 'هذا', 'هذه',
]);
export const isStopword = (word: string) => STOPWORDS.has(word);

/**
 * The forms a word is matched by, itself first. English: a light stem
 * (therapists → therapist, stories → story, coping → cop… on both sides, so
 * they meet). Arabic: without an attached "and"/"so"/"with"/"like"/"for" and
 * the definite article (والقلق, بالاكتئاب, للأطفال → قلق, اكتئاب, أطفال), and
 * without a plural ending. Every form is kept, so nothing is lost when a word
 * really begins with one of those letters (وحدة).
 */
export function wordForms(word: string): string[] {
  const forms = new Set([word]);
  if (isArabic(word)) {
    let w = word;
    if (w.length >= 5 && /^(وال|فال|بال|كال)/.test(w)) w = w.slice(3);
    else if (w.length >= 4 && /^لل/.test(w)) w = w.slice(2);
    else if (w.length >= 4 && /^ال/.test(w)) w = w.slice(2);
    else if (w.length >= 4 && /^[وفبكل]/.test(w)) forms.add(w.slice(1));
    forms.add(w);
    if (w.length >= 5 && /(ات|ون|ين)$/.test(w)) forms.add(w.slice(0, -2));
  } else {
    let w = word;
    if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
    else if (/(ches|shes|sses|xes|zes)$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') && !w.endsWith('us')) w = w.slice(0, -1);
    if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
    else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
    forms.add(w);
  }
  return [...forms];
}

/** How many typos a word of this length may carry: none under 4 letters, one up to 7, two from 8. */
export function allowedEdits(length: number): number {
  return length < 4 ? 0 : length < 8 ? 1 : 2;
}

/**
 * Edit distance counting a swap of two neighbouring letters as one edit
 * (optimal string alignment), or `max + 1` as soon as it's certainly over `max`.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      row.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}
