import { normalizeForSearch } from './searchText.ts';

/**
 * Showing why a search result came up: the matched words lit in its text,
 * and, for a professional, a short line leading with what matched (a
 * specialty, or who they work with), then where they are and their languages.
 * `lit` is `SearchResult.lit`: normalised words.
 */

export interface Piece {
  text: string;
  lit: boolean;
}

const WORD = /[\p{L}\p{N}]+/gu;

/** `text` split into runs, each lit or not, by whether its words are in `lit`. Joined back, it's `text` unchanged. */
export function pieces(text: string, lit: ReadonlySet<string>): Piece[] {
  if (lit.size === 0 || !text) return [{ text, lit: false }];
  const out: Piece[] = [];
  let at = 0;
  const push = (t: string, on: boolean) => {
    if (!t) return;
    const last = out[out.length - 1];
    if (last && last.lit === on) last.text += t;
    else out.push({ text: t, lit: on });
  };
  for (const m of text.matchAll(WORD)) {
    const start = m.index ?? 0;
    push(text.slice(at, start), false);
    push(m[0], lit.has(normalizeForSearch(m[0])));
    at = start + m[0].length;
  }
  push(text.slice(at), false);
  return out;
}

const hasLit = (text: string, lit: ReadonlySet<string>) => [...text.matchAll(WORD)].some((m) => lit.has(normalizeForSearch(m[0])));

/** What a professional's own page says (the daily search index), labels in the page's language. */
export interface ProfessionalProfile {
  info: Record<string, string>;
  specialties: string | null;
}

/** The info labels, in English and Arabic, as houna.org writes them. */
const LABELS = {
  location: ['location', 'الموقع'],
  languages: ['languages', 'اللغات'],
  workWith: ['work with', 'يعمل مع'],
};
const field = (info: Record<string, string>, names: string[]) => names.map((n) => info[n]).find(Boolean) ?? null;

/** A specialties text broken into its items: lists use dashes, bullets, commas or new lines. */
function specialtyItems(text: string): string[] {
  return text
    .split(/\s[–—-]\s|[•·;|\n]|,\s|\s{3,}|^[–—-]\s*/)
    .map((s) => s.trim().replace(/^[–—-]\s*/, ''))
    .filter((s) => s.length > 1);
}

/**
 * "Trauma and trauma based therapy · Saudi Arabia · Arabic & English": the
 * specialty (or who they work with) that matched first, then location and
 * languages. Just location and languages when the match was elsewhere (their
 * name, their role); empty when the page said nothing.
 */
export function whyLine(profile: ProfessionalProfile | undefined, lit: ReadonlySet<string>): string {
  if (!profile) return '';
  const parts: string[] = [];
  const matched = profile.specialties ? specialtyItems(profile.specialties).find((s) => hasLit(s, lit)) : undefined;
  if (matched) parts.push(matched.length > 60 ? `${matched.slice(0, 58).trimEnd()}…` : matched);
  const workWith = field(profile.info, LABELS.workWith);
  if (!matched && workWith && hasLit(workWith, lit)) parts.push(workWith);
  for (const value of [field(profile.info, LABELS.location), field(profile.info, LABELS.languages)]) if (value) parts.push(value);
  return parts.join(' · ');
}
