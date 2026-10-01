import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchProfessionalsInCountry,
  fetchSearchBundle,
  fetchSearchIndex,
  mergeLanguages,
  type CountryOption,
  type SearchBundle,
  type Therapist,
} from './hounaApi';
import { getCountry } from './countries';
import { normalizeForSearch } from './searchText';
import { SearchIndex } from './searchRank';
import type { ProfessionalProfile } from './searchHighlight';

/**
 * Unified directory search (FEATURES_BRIEF §3): every list comes in one call per language
 * (`fetchSearchBundle`, the `houna-search-bundle` Edge Function, which assembles houna-proxy's
 * lists for everyone every few hours), is turned into `SearchItem`s, kept on the phone, and
 * matched and ranked on the device (`searchRank.ts`: typos, word forms, the bilingual meaning
 * map). Queries never leave the phone. A search costs three calls a day at most (this language's
 * lists, the other language's for names, the professionals' profiles), where it was ~60.
 */

export type SearchType = 'topic' | 'tanafas' | 'article' | 'professional' | 'podcast' | 'organization' | 'wellness' | 'event' | 'speaker';

export interface SearchItem {
  type: SearchType;
  /** Route param (slug/id); for articles/podcasts, the external URL; for Tanafas, "breathe:<exercise>" / "meditate:<scene>". */
  key: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  /** Source domain for articles/podcasts. */
  source?: string;
  /** What's searched: the title, the subtitle, then anything else (summary, services…). */
  extra: string[];
  /** The same item's name in the other language (a professional's Arabic and Latin names), searched like the title. */
  aliases?: string[];
  /** Professionals: what their own page says (location, languages, who they work with, specialties), searched and shown. */
  profile?: ProfessionalProfile;
  /** Tanafas items: the exercise's tone. */
  tone?: 'glow' | 'dawn' | 'dusk' | 'bloom' | 'tide';
}

export interface LocalTopic {
  slug: string;
  label: string;
  description: string;
}

type Lang = 'en' | 'ar';

function item(
  type: SearchType,
  key: string,
  title: string,
  subtitle: string,
  imageUrl: string | null,
  extra: string[] = [],
  source?: string,
): SearchItem {
  return { type, key, title, subtitle, imageUrl, source, extra };
}

/** The search index over everything loaded so far: build it when the items change, then `search(query)`. */
export function buildSearchIndex(items: SearchItem[]): SearchIndex<SearchItem> {
  return new SearchIndex(
    items.map((it) => ({
      item: it,
      title: it.title,
      fields: [
        { text: [it.title, ...(it.aliases ?? [])].join(' \n '), weight: 3 },
        { text: [it.subtitle, ...(it.profile ? [...Object.values(it.profile.info), it.profile.specialties ?? ''] : [])].join(' \n '), weight: 2 },
        { text: it.extra.join(' \n '), weight: 1 },
      ],
    })),
  );
}

/* ──────────────── Sources (kept on the phone, per language) ──────────────── */

export type SourceKey = 'articles' | 'podcasts' | 'professionals' | 'organizations' | 'wellness' | 'events' | 'speakers';

interface ProfessionalsResult {
  items: SearchItem[];
  countries: CountryOption[];
}

/** Bump when a saved list's shape changes, so old copies are ignored (and cleared: `clearOldVersions`). */
const STORE_VERSION = 3;
/** A saved list this recent is used as is; an older one is used while a fresh one loads for next time. */
const FRESH_MS = 24 * 60 * 60 * 1000;
/** A saved list older than this isn't shown at all: the search waits for a fresh one. */
const STALE_MS = 14 * 24 * 60 * 60 * 1000;

const memory = new Map<string, Promise<unknown>>();

async function readSaved<T>(key: string): Promise<{ at: number; data: T } | null> {
  try {
    const raw = await AsyncStorage.getItem(`directory-search:v${STORE_VERSION}:${key}`);
    return raw ? (JSON.parse(raw) as { at: number; data: T }) : null;
  } catch {
    return null;
  }
}

function save<T>(key: string, data: T) {
  AsyncStorage.setItem(`directory-search:v${STORE_VERSION}:${key}`, JSON.stringify({ at: Date.now(), data })).catch(() => {});
}

let cleared = false;
/** Once a launch: removes lists saved by an older version (v1 kept one per list), so they don't linger. */
function clearOldVersions() {
  if (cleared) return;
  cleared = true;
  AsyncStorage.getAllKeys()
    .then((keys) => {
      const old = keys.filter((k) => k.startsWith('directory-search:v') && !k.startsWith(`directory-search:v${STORE_VERSION}:`));
      return old.length ? AsyncStorage.multiRemove(old) : undefined;
    })
    .catch(() => {});
}

/**
 * One list, loaded once per session and kept on the phone between sessions,
 * so a search after the first is instant: a copy under a day old is used as
 * is; an older one (up to two weeks) is used while a fresh one loads in the
 * background for next time; anything older, or none, waits for the network.
 * These are public directory lists, never what anyone searched for.
 */
function kept<T>(key: string, load: () => Promise<T>): Promise<T> {
  let p = memory.get(key) as Promise<T> | undefined;
  if (p) return p;
  clearOldVersions();
  const fetchAndSave = () =>
    load().then((data) => {
      save(key, data);
      return data;
    });
  p = readSaved<T>(key).then((saved) => {
    const age = saved ? Date.now() - saved.at : Infinity;
    if (saved && age < STALE_MS) {
      if (age > FRESH_MS) {
        fetchAndSave()
          .then((data) => memory.set(key, Promise.resolve(data)))
          .catch(() => {});
      }
      return saved.data;
    }
    return fetchAndSave();
  });
  // A failed load shouldn't be remembered for the rest of the session.
  p.catch(() => memory.delete(key));
  memory.set(key, p);
  return p;
}

/** One language's lists, in one call, kept on the phone as one copy. */
const bundle = (lang: Lang) => kept<SearchBundle>(`bundle:${lang}`, () => fetchSearchBundle(lang));

/** A list from the other language's bundle, or nothing if it can't load (the reader's own still shows). */
async function otherLanguage<T>(lang: Lang, pick: (b: SearchBundle) => T[]): Promise<T[]> {
  try {
    return pick(await bundle(lang === 'en' ? 'ar' : 'en'));
  } catch {
    return [];
  }
}

const professionalItem = (p: Therapist) => item('professional', p.slug, p.name, p.role, p.imageUrl, [p.summary]);

export const SOURCES: Record<SourceKey, (lang: Lang) => Promise<SearchItem[] | ProfessionalsResult>> = {
  // Articles and podcasts in both languages, the reader's first (houna.org splits them; Houna shows all).
  articles: async (lang) =>
    mergeLanguages((await bundle(lang)).articles.articles, await otherLanguage(lang, (b) => b.articles.articles)).map((a) =>
      item('article', a.url, a.title, a.blurb, a.imageUrl, [], a.sourceDomain),
    ),
  podcasts: async (lang) =>
    mergeLanguages((await bundle(lang)).podcasts.podcasts, await otherLanguage(lang, (b) => b.podcasts.podcasts)).map((p) =>
      item('podcast', p.url, p.title, p.host, p.imageUrl, [p.description], p.sourceDomain),
    ),
  professionals: async (lang) => {
    const { therapists, countries } = (await bundle(lang)).professionals;
    return { items: therapists.map(professionalItem), countries };
  },
  organizations: async (lang) =>
    (await bundle(lang)).organizations.organizations.map((o) => item('organization', o.id, o.name, o.summary, o.imageUrl)),
  wellness: async (lang) =>
    (await bundle(lang)).wellness.centers.map((c) => item('wellness', c.id, c.name, c.summary, c.imageUrl, c.services)),
  // The subtitle is the site's raw date; the results format it (lib/eventDate.ts).
  events: async (lang) =>
    (await bundle(lang)).events.events.map((e) => item('event', e.slug, e.title, e.date, e.imageUrl, [e.description])),
  speakers: async (lang) =>
    (await bundle(lang)).speakers.speakers.map((s) => item('speaker', s.slug, s.name, s.role, s.imageUrl, [s.bio])),
};

/**
 * Every professional, from the same saved bundle as the search (the professionals list filters and
 * searches it on the phone), and who offers online sessions.
 */
export async function professionalsDirectory(lang: Lang): Promise<{ therapists: Therapist[]; online: Set<string> }> {
  const { therapists, online } = (await bundle(lang)).professionals;
  return { therapists, online: new Set(online ?? []) };
}

/** An article or podcast as Read & listen shows it. */
export interface MediaItem {
  kind: 'article' | 'podcast';
  url: string;
  title: string;
  text: string;
  /** The site it's on (who.int), or a podcast's host. */
  source: string;
  imageUrl: string | null;
  /** Listed only in the other language on houna.org (shown with a small language tag). */
  otherLanguage: boolean;
}

/**
 * Read & listen's articles and podcasts, both languages, the reader's first (as search shows them),
 * from the same saved bundle: what only the other language has is marked so the screen can say so.
 */
export async function mediaLibrary(lang: Lang): Promise<{ articles: MediaItem[]; podcasts: MediaItem[] }> {
  const mine = await bundle(lang);
  const otherArticles = await otherLanguage(lang, (b) => b.articles.articles);
  const otherPodcasts = await otherLanguage(lang, (b) => b.podcasts.podcasts);
  const articles = mergeLanguages(mine.articles.articles, otherArticles);
  const podcasts = mergeLanguages(mine.podcasts.podcasts, otherPodcasts);
  const ownA = mine.articles.articles.length;
  const ownP = mine.podcasts.podcasts.length;
  return {
    articles: articles.map((a, i) => ({
      kind: 'article',
      url: a.url,
      title: a.title,
      text: a.blurb,
      source: a.sourceDomain,
      imageUrl: a.imageUrl,
      otherLanguage: i >= ownA,
    })),
    podcasts: podcasts.map((p, i) => ({
      kind: 'podcast',
      url: p.url,
      title: p.title,
      text: p.description,
      source: p.host || p.sourceDomain,
      imageUrl: p.imageUrl,
      otherLanguage: i >= ownP,
    })),
  };
}

/** The professionals list's own search items (each with what their page says, when it's in). */
export function professionalSearchItems(therapists: Therapist[], profiles: Map<string, ProfessionalProfile>): SearchItem[] {
  // The slug is the name in Latin letters, so a name typed in English finds them on the Arabic list too.
  return therapists.map((p) => ({
    ...professionalItem(p),
    aliases: [p.slug.replace(/[-_.]+/g, ' ')],
    profile: profiles.get(p.slug),
  }));
}

/** Any list's items for its own search box: title, a line under it, and whatever else to match. */
export function listSearchItems<T>(list: T[], pick: (x: T) => { key: string; title: string; subtitle?: string; extra?: string[] }): SearchItem[] {
  return list.map((x) => {
    const p = pick(x);
    return item('article', p.key, p.title, p.subtitle ?? '', null, p.extra ?? []);
  });
}

/**
 * Each professional's profile by slug, from the daily server index: kept like
 * the lists, and an empty map while the first build runs or if it fails, so
 * search never waits on it.
 */
export function professionalProfiles(lang: Lang): Promise<Map<string, ProfessionalProfile>> {
  return kept(`professional-profiles:${lang}`, async () => {
    const index = await fetchSearchIndex(lang);
    if (!index) throw new Error('The search index is still being built');
    return index.professionals.map((p) => [p.slug, { info: p.info, specialties: p.specialties }] as [string, ProfessionalProfile]);
  })
    .then((entries) => new Map(entries))
    .catch(() => new Map());
}

/** The sources whose items keep the same key in both languages, so each can borrow the other's names. */
export const ALIAS_SOURCES: readonly SourceKey[] = ['professionals', 'organizations', 'wellness', 'speakers'];

export function topicItems(topics: readonly LocalTopic[]): SearchItem[] {
  return topics.map((t) => item('topic', t.slug, t.label, t.description, null));
}

/** A Tanafas breathing exercise or meditation scene, as the search sees it. */
export interface LocalExercise {
  kind: 'breathe' | 'meditate';
  /** The exercise key (BREATHE_ORDER) or scene id. */
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tone: SearchItem['tone'];
}

/** Tanafas' exercises and scenes: the kind's own word ("Breathing exercise") is searched too. */
export function tanafasItems(exercises: readonly LocalExercise[], kindWords: Record<LocalExercise['kind'], string>): SearchItem[] {
  return exercises.map((e) => ({
    ...item('tanafas', `${e.kind}:${e.id}`, e.title, e.subtitle, null, [e.description, kindWords[e.kind]]),
    tone: e.tone,
  }));
}

/**
 * "Near you": `profiles.country` is ISO alpha-2, but the proxy's country
 * filter uses houna.org's own numeric ids with English names — match by
 * normalised English name.
 */
export function proxyCountryId(iso: string | null | undefined, options: CountryOption[]): string | null {
  if (!iso) return null;
  const name = getCountry(iso)?.en;
  if (!name) return null;
  const want = normalizeForSearch(name);
  return options.find((o) => normalizeForSearch(o.label) === want)?.value ?? null;
}

/** Slugs of professionals in one proxy country (all pages, in one call). */
export function professionalsInCountry(lang: Lang, countryId: string): Promise<Set<string>> {
  return kept(`professionals:${lang}:${countryId}`, async () => {
    const { therapists } = await fetchProfessionalsInCountry(lang, countryId);
    return therapists.map((p) => p.slug);
  }).then((slugs) => new Set(slugs));
}
