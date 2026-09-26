import {
  fetchArticles,
  fetchOrganizations,
  fetchPodcasts,
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

export type SearchType = 'topic' | 'article' | 'professional' | 'podcast' | 'organization' | 'wellness';

export interface SearchItem {
  type: SearchType;
  /** Route param (slug/id) or, for articles/podcasts, the external URL. */
  key: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  /** Source domain for articles/podcasts. */
  source?: string;
  /** What's searched: the title, the subtitle, then anything else (summary, services…). */
  extra: string[];
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
        { text: it.title, weight: 3 },
        { text: it.subtitle, weight: 2 },
        { text: it.extra.join(' \n '), weight: 1 },
      ],
    })),
  );
}

/* ──────────────── Sources (cached per language) ──────────────── */

export type SourceKey = 'articles' | 'podcasts' | 'professionals' | 'organizations' | 'wellness';

interface ProfessionalsResult {
  items: SearchItem[];
  countries: CountryOption[];
}

const cache = new Map<string, Promise<unknown>>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load();
    // A failed load shouldn't be cached for the rest of the session.
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
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
    cached(`articles:${lang}`, async () =>
      (await fetchArticles(lang)).articles.map((a) =>
        item('article', a.url, a.title, a.blurb, a.imageUrl, [], a.sourceDomain),
      ),
    ),
  podcasts: (lang) =>
    cached(`podcasts:${lang}`, async () =>
      (await fetchPodcasts(lang)).podcasts.map((p) =>
        item('podcast', p.url, p.title, p.host, p.imageUrl, [p.description], p.sourceDomain),
      ),
    ),
  professionals: (lang) =>
    cached(`professionals:${lang}`, async () => {
      const { therapists, countries } = await allTherapists(lang);
      return { items: therapists.map(professionalItem), countries };
    }),
  organizations: (lang) =>
    cached(`organizations:${lang}`, async () =>
      (await fetchOrganizations(undefined, lang)).organizations.map((o) =>
        item('organization', o.id, o.name, o.summary, o.imageUrl),
      ),
    ),
  wellness: (lang) =>
    cached(`wellness:${lang}`, async () =>
      (await fetchWellnessCenters(undefined, lang)).centers.map((c) =>
        item('wellness', c.id, c.name, c.summary, c.imageUrl, c.services),
      ),
    ),
};

export function topicItems(topics: readonly LocalTopic[]): SearchItem[] {
  return topics.map((t) => item('topic', t.slug, t.label, t.description, null));
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
  return cached(`professionals:${lang}:${countryId}`, async () => {
    const { therapists } = await allTherapists(lang, countryId);
    return new Set(therapists.map((p) => p.slug));
  });
}
