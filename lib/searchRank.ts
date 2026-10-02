import { CONCEPT_GROUPS } from './searchConcepts.ts';
import { allowedEdits, editDistance, isArabic, isStopword, wordForms, words } from './searchText.ts';

/**
 * The directory search's matching and ranking, on the device. Each item is a
 * few weighted fields (a title counts more than a role, a role more than a
 * summary). A query word matches an item's word exactly, as its start
 * ("sara" → Sarah), inside it, or with a typo or two ("depresion"); through
 * its other forms (therapists → therapist, بالاكتئاب → اكتئاب); or, a little
 * lower, through the meaning map (`searchConcepts.ts`: "sad" → depression,
 * "قلق" → anxiety). Items matching every query word come first; items
 * matching at least half of them follow, but only when few match them all.
 */

export interface SearchField {
  text: string;
  /** 3 for a title, 2 for a role or subtitle, 1 for a summary. */
  weight: number;
}

export interface SearchEntry<T> {
  item: T;
  /** For ties: alphabetical. */
  title: string;
  fields: SearchField[];
}

/** How well a query word matches a word, 0–1. */
const EXACT = 1;
const PREFIX = 0.85;
const TYPO = 0.7;
const TWO_TYPOS = 0.5;
const INSIDE = 0.55;
/** A match through the meaning map counts this much of a direct one. */
const SYNONYM = 0.7;
/** Matching every query word lifts an item above every partial match. */
const ALL_WORDS = 3;
/** Partial matches (at least half the words) are only added when fewer items than this match them all. */
const FEW = 5;

/** What a search found, and how. */
export interface SearchResult<T> {
  items: T[];
  /**
   * The indexed words that matched a query word directly (exactly, as its
   * start or inside it) or through a corrected spelling: what the results
   * light up. Normalised (`words()`); meaning-map matches aren't included.
   */
  lit: Set<string>;
  /**
   * The query as read, when some query word matched nothing as typed and
   * only through a corrected spelling ("anxeity" → "anxiety"); otherwise null.
   */
  corrected: string | null;
}

interface IndexedField {
  weight: number;
  words: string[];
  /** The field's words, space-separated and padded, for phrase matches. */
  text: string;
}

interface IndexedDoc<T> {
  item: T;
  title: string;
  fields: IndexedField[];
}

interface Concept {
  /** Single words, and the forms each is matched by. */
  words: string[];
  forms: string[][];
  /** Multi-word entries, normalised and space-separated. */
  phrases: string[];
}

const CONCEPTS: Concept[] = CONCEPT_GROUPS.map((group) => {
  const single: string[] = [];
  const phrases: string[] = [];
  for (const term of group) {
    const w = words(term);
    if (w.length === 1) single.push(w[0]);
    else if (w.length > 1) phrases.push(w.join(' '));
  }
  const unique = [...new Set(single)];
  return { words: unique, forms: unique.map(wordForms), phrases };
});

const sharesForm = (a: string[], b: string[]) => a.some((x) => b.includes(x));

/** Two query-word sequences line up at `at`. */
const phraseAt = (seq: string[], phrase: string[], at: number) => phrase.every((p, k) => seq[at + k] === p);

/** The meaning-map words and phrases a query word brings in, beyond itself. */
interface Alternatives {
  words: Set<string>;
  phrases: Set<string>;
  /** A group was reached by the word as typed (or a phrase), not only through a typo. */
  asTyped: boolean;
}

/**
 * For each query word, the concepts it triggers: by sharing a form with one
 * of a group's words (or, for longer words, by a typo), or by being part of
 * one of a group's phrases in the query ("low mood", "can't sleep").
 */
function alternatives(all: string[], tokens: string[], exact = false): Alternatives[] {
  const alts = tokens.map(() => ({ words: new Set<string>(), phrases: new Set<string>(), asTyped: false }));
  const bring = (i: number, c: Concept, asTyped = true) => {
    if (asTyped) alts[i].asTyped = true;
    c.words.forEach((w) => w !== tokens[i] && alts[i].words.add(w));
    c.phrases.forEach((p) => alts[i].phrases.add(p));
  };
  tokens.forEach((t, i) => {
    const forms = wordForms(t);
    for (const c of CONCEPTS) {
      if (c.forms.some((f) => sharesForm(forms, f))) bring(i, c);
      else if (!exact && t.length >= 5 && c.words.some((w) => w.length >= 5 && editDistance(t, w, 1) <= 1)) bring(i, c, false);
    }
  });
  for (const c of CONCEPTS) {
    for (const phrase of c.phrases) {
      const p = phrase.split(' ');
      for (let at = 0; at + p.length <= all.length; at++) {
        if (!phraseAt(all, p, at)) continue;
        p.forEach((w) => {
          const i = tokens.indexOf(w);
          if (i >= 0) bring(i, c);
        });
      }
    }
  }
  return alts;
}

/** How well a query word (its forms) matches one indexed word. */
function matchWord(qForms: string[], word: string, wordFormsOf: string[], fuzzy: boolean, prefix: boolean): number {
  let best = 0;
  for (const q of qForms) {
    for (const d of wordFormsOf) {
      if (q === d) return EXACT;
      if (prefix && q.length >= 2 && d.startsWith(q)) best = Math.max(best, PREFIX);
      else if (q.length >= 4 && d.includes(q)) best = Math.max(best, INSIDE);
    }
  }
  if (!fuzzy || best >= TYPO) return best;
  const q = qForms[0];
  const edits = allowedEdits(q.length);
  if (edits === 0 || isArabic(q) !== isArabic(word)) return best;
  for (const d of wordFormsOf) {
    const whole = editDistance(q, d, edits);
    if (whole <= edits) return Math.max(best, whole <= 1 ? TYPO : TWO_TYPOS);
    // Still typing, with a typo: "depresi" against "depression".
    if (q.length >= 5 && d.length > q.length && editDistance(q, d.slice(0, q.length), 1) <= 1) best = Math.max(best, TWO_TYPOS);
  }
  return best;
}

export class SearchIndex<T> {
  private docs: IndexedDoc<T>[];
  private vocab: string[];
  private forms = new Map<string, string[]>();

  constructor(entries: SearchEntry<T>[]) {
    const vocab = new Set<string>();
    this.docs = entries.map(({ item, title, fields }) => ({
      item,
      title,
      fields: fields.map(({ text, weight }) => {
        const ws = words(text);
        // Titles also match run together ("Al Rahmani" ↔ "AlRahmani").
        if (weight >= 3) {
          const count = ws.length;
          for (let k = 0; k + 1 < count; k++) if (!isArabic(ws[k])) ws.push(ws[k] + ws[k + 1]);
        }
        const unique = [...new Set(ws)];
        unique.forEach((w) => vocab.add(w));
        return { weight, words: unique, text: ` ${words(text).join(' ')} ` };
      }),
    }));
    this.vocab = [...vocab];
    this.vocab.forEach((w) => this.forms.set(w, wordForms(w)));
  }

  get size() {
    return this.docs.length;
  }

  /** The items matching `query`, best first. */
  search(query: string): T[] {
    return this.query(query).items;
  }

  /**
   * The items matching `query`, best first, with what matched and any
   * corrected spelling. `exact` turns spelling correction off (the
   * "Search for … instead" a corrected search offers).
   */
  query(query: string, { exact = false }: { exact?: boolean } = {}): SearchResult<T> {
    const all = words(query);
    if (all.length === 0) return { items: [], lit: new Set(), corrected: null };
    const kept = all.filter((w) => !isStopword(w));
    const tokens = kept.length > 0 ? [...new Set(kept)] : [...new Set(all)];
    const alts = alternatives(all, tokens, exact);

    // Every indexed word, scored once per query word; noting, per query word, whether anything
    // matched it as typed or through the meaning map, and its best corrected spelling.
    const lit = new Set<string>();
    const asTyped = tokens.map(() => false);
    const respelt = tokens.map(() => ({ word: '', score: 0 }));
    const scores = tokens.map((t, i) => {
      const qForms = wordForms(t);
      // A complete word the meaning map knows ("sad") isn't also the start of a name (Sadiq).
      const known = CONCEPTS.some((c) => c.forms.some((f) => sharesForm(qForms, f)));
      const synForms = [...alts[i].words].map((w) => ({ forms: wordForms(w), prefix: w.length >= 4 }));
      const map = new Map<string, number>();
      for (const w of this.vocab) {
        const wf = this.forms.get(w)!;
        const typed = matchWord(qForms, w, wf, false, !known);
        let s = typed;
        if (typed > 0) {
          lit.add(w);
          asTyped[i] = true;
        } else if (!exact) {
          const typo = matchWord(qForms, w, wf, true, false);
          if (typo > 0) {
            s = typo;
            lit.add(w);
            if (typo > respelt[i].score) respelt[i] = { word: w, score: typo };
          }
        }
        if (s < EXACT) {
          for (const syn of synForms) {
            const viaMeaning = matchWord(syn.forms, w, wf, false, syn.prefix) * SYNONYM;
            if (viaMeaning > 0 && alts[i].asTyped) asTyped[i] = true;
            s = Math.max(s, viaMeaning);
            if (s >= SYNONYM) break;
          }
        }
        if (s > 0) map.set(w, s);
      }
      return map;
    });

    const n = tokens.length;
    const phrase = ` ${tokens.join(' ')}`;
    // Each item's best match for each query word.
    const bests = this.docs.map((doc) =>
      tokens.map((_, i) => {
        let best = 0;
        for (const f of doc.fields) {
          let s = 0;
          for (const w of f.words) s = Math.max(s, scores[i].get(w) ?? 0);
          if (s < SYNONYM) for (const p of alts[i].phrases) if (f.text.includes(` ${p}`)) s = Math.max(s, SYNONYM);
          best = Math.max(best, s * f.weight);
        }
        return best;
      }),
    );
    // A word most items match ("therapy": nearly every professional's role) says little about
    // which one is wanted; a rare one ("trauma") says a lot. Each word weighs by its rarity.
    const total = this.docs.length;
    const rarity = tokens.map((_, i) => {
      const found = bests.reduce((c, b) => c + (b[i] > 0 ? 1 : 0), 0);
      return Math.log((total + 1) / (found + 1)) + 0.1;
    });
    const weight = rarity.reduce((a, b) => a + b, 0);

    const ranked: { item: T; title: string; score: number; all: boolean }[] = [];
    this.docs.forEach((doc, d) => {
      let sum = 0;
      let covered = 0;
      let matched = 0;
      bests[d].forEach((best, i) => {
        if (best > 0) {
          matched++;
          covered += rarity[i];
        }
        sum += best * rarity[i];
      });
      // Partial matches must cover at least half the query's weight.
      if (matched === 0 || covered < weight / 2) return;
      let score = sum / weight + (matched === n ? ALL_WORDS : 0);
      // The words together, in order, in the title: a name or a topic, spelled out.
      if (n >= 2 && doc.fields.some((f) => f.weight >= 3 && f.text.includes(phrase))) score += 1;
      ranked.push({ item: doc.item, title: doc.title, score, all: matched === n });
    });
    ranked.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
    const complete = ranked.filter((r) => r.all);
    const items = (complete.length >= FEW ? complete : ranked).map((r) => r.item);

    // "Showing results for …": the query with each word that matched only through a corrected spelling replaced.
    const fixes = new Map(tokens.map((t, i) => [t, !asTyped[i] && respelt[i].word ? respelt[i].word : t]));
    const corrected = items.length > 0 && tokens.some((t) => fixes.get(t) !== t) ? all.map((w) => fixes.get(w) ?? w).join(' ') : null;
    return { items, lit, corrected };
  }
}
