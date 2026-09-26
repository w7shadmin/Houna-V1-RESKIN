import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchArticles,
  fetchEvents,
  fetchOrganizations,
  fetchPodcasts,
  fetchSearchIndex,
  fetchSpeakers,
  fetchTherapists,
  fetchWellnessCenters,
  type CountryOption,
  type Therapist,
} from './hounaApi';
import { getCountry } from './countries';
import { normalizeForSearch } from './searchText';
import { SearchIndex } from './searchRank';

/**
 * Unified directory search, phase 1 (FEATURES_BRIEF §3): everything is
 * fetched from the existing list endpoints once per language, turned into
 * `SearchItem`s, cached in memory for the session, and matched and ranked on
 * the device (`searchRank.ts`: typos, word forms, the bilingual meaning map).
 * Queries never leave the phone. Phase 2 (a server-side `search` route in
 * houna-proxy) needs that Edge Function's source, which isn't in this repo.
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
  /** Professionals: what their own page says (location, languages, who they work with, specialties). */
  facts?: string[];
  /** Tanafas items: the exercise's tone. */
  tone?: 'glow' | 'dawn' | 'dusk' | 'bloom';
}

export interface LocalTopic {
  slug: string;
  label: string;
  description: string;
}

type Lang = 'en' | 'ar';

/**
 * Professionals come 15 to a page; there were 20 pages (286 people) in September 2026. The
 * proxy's `lastPage` is always the current page + 1, so it can't say when to stop: pages are
 * fetched a few at a time until one comes back empty or brings no one new. Never more than this.
 */
const MAX_PROFESSIONAL_PAGES = 40;
/** Pages fetched at once. */
const PAGE_BATCH = 10;

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
        { text: [it.subtitle, ...(it.facts ?? [])].join(' \n '), weight: 2 },
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

/** Bump when a saved list's shape changes, so old copies are ignored. */
const STORE_VERSION = 1;
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

async function allTherapists(lang: Lang, country = ''): Promise<{ therapists: Therapist[]; countries: CountryOption[] }> {
  const first = await fetchTherapists(1, { country }, lang);
  const therapists = [...first.therapists];
  const seen = new Set(therapists.map((t) => t.slug));
  let next = 2;
  let more = first.therapists.length > 0;
  while (more && next <= MAX_PROFESSIONAL_PAGES) {
    const pages = Array.from({ length: Math.min(PAGE_BATCH, MAX_PROFESSIONAL_PAGES - next + 1) }, (_, i) => next + i);
    next += pages.length;
    const results = await Promise.all(pages.map((p) => fetchTherapists(p, { country }, lang)));
    for (const r of results) {
      const fresh = r.therapists.filter((t) => !seen.has(t.slug));
      fresh.forEach((t) => seen.add(t.slug));
      therapists.push(...fresh);
      if (fresh.length === 0) more = false;
    }
  }
  return { therapists, countries: first.countries };
}

const professionalItem = (p: Therapist) => item('professional', p.slug, p.name, p.role, p.imageUrl, [p.summary]);

export const SOURCES: Record<SourceKey, (lang: Lang) => Promise<SearchItem[] | ProfessionalsResult>> = {
  articles: (lang) =>
    kept(`articles:${lang}`, async () =>
      (await fetchArticles(lang)).articles.map((a) =>
        item('article', a.url, a.title, a.blurb, a.imageUrl, [], a.sourceDomain),
      ),
    ),
  podcasts: (lang) =>
    kept(`podcasts:${lang}`, async () =>
      (await fetchPodcasts(lang)).podcasts.map((p) =>
        item('podcast', p.url, p.title, p.host, p.imageUrl, [p.description], p.sourceDomain),
      ),
    ),
  professionals: (lang) =>
    kept(`professionals:${lang}`, async () => {
      const { therapists, countries } = await allTherapists(lang);
      return { items: therapists.map(professionalItem), countries };
    }),
  organizations: (lang) =>
    kept(`organizations:${lang}`, async () =>
      (await fetchOrganizations(undefined, lang)).organizations.map((o) =>
        item('organization', o.id, o.name, o.summary, o.imageUrl),
      ),
    ),
  wellness: (lang) =>
    kept(`wellness:${lang}`, async () =>
      (await fetchWellnessCenters(undefined, lang)).centers.map((c) =>
        item('wellness', c.id, c.name, c.summary, c.imageUrl, c.services),
      ),
    ),
  // The subtitle is the site's raw date; the results format it (lib/eventDate.ts).
  events: (lang) =>
    kept(`events:${lang}`, async () =>
      (await fetchEvents(lang)).events.map((e) => item('event', e.slug, e.title, e.date, e.imageUrl, [e.description])),
    ),
  speakers: (lang) =>
    kept(`speakers:${lang}`, async () =>
      (await fetchSpeakers(lang)).speakers.map((s) => item('speaker', s.slug, s.name, s.role, s.imageUrl, [s.bio])),
    ),
};

/**
 * Each professional's facts by slug, from the daily server index: kept like
 * the lists, and an empty map while the first build runs or if it fails, so
 * search never waits on it.
 */
export function professionalFacts(lang: Lang): Promise<Map<string, string[]>> {
  return kept(`professional-facts:${lang}`, async () => {
    const index = await fetchSearchIndex(lang);
    if (!index) throw new Error('The search index is still being built');
    return index.professionals.map((p) => [p.slug, [...Object.values(p.info), ...(p.specialties ? [p.specialties] : [])]] as [string, string[]]);
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

/** Slugs of professionals in one proxy country (all pages, capped). */
export function professionalsInCountry(lang: Lang, countryId: string): Promise<Set<string>> {
  return kept(`professionals:${lang}:${countryId}`, async () => {
    const { therapists } = await allTherapists(lang, countryId);
    return therapists.map((p) => p.slug);
  }).then((slugs) => new Set(slugs));
}
