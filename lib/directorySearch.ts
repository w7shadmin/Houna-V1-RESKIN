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

/**
 * Unified directory search, phase 1 (FEATURES_BRIEF §3): everything is
 * fetched from the existing list endpoints once per language, normalised
 * into `SearchItem`s, cached in memory for the session, and filtered on the
 * device. Phase 2 (a server-side `search` route in houna-proxy) needs that
 * Edge Function's source, which isn't in this repo.
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
  /** Normalised title, and title + everything else searchable. */
  titleNorm: string;
  haystack: string;
}

export interface LocalTopic {
  slug: string;
  label: string;
  description: string;
}

type Lang = 'en' | 'ar';

/** Professionals are paginated at 15; the whole directory is ~2 pages today. Stop at this many regardless. */
const MAX_PROFESSIONAL_PAGES = 10;

/* ──────────────── Normalisation ──────────────── */

/**
 * Case-, diacritic- and Arabic-letter-form-insensitive: strips Latin
 * accents, Arabic harakat and tatweel, and folds alef/yaa/taa-marbuta/hamza
 * carrier variants so "إكتئاب", "اكتئاب" and "الاكتئاب" all match.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .toLowerCase();
}

/** Query → tokens; the Arabic definite article is dropped so "الاكتئاب" finds "اكتئاب". */
export function tokenize(query: string): string[] {
  return normalizeForSearch(query)
    .split(/[\s,.;:!?،؛؟]+/)
    .map((t) => (t.length > 3 ? t.replace(/^ال/, '') : t))
    .filter(Boolean);
}

function item(
  type: SearchType,
  key: string,
  title: string,
  subtitle: string,
  imageUrl: string | null,
  extra: string[] = [],
  source?: string,
): SearchItem {
  return {
    type,
    key,
    title,
    subtitle,
    imageUrl,
    source,
    titleNorm: normalizeForSearch(title),
    haystack: normalizeForSearch([title, subtitle, ...extra].join(' \n ')),
  };
}

/** Items whose text contains every token, title matches first. */
export function searchItems(items: SearchItem[], query: string): SearchItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  return items
    .filter((it) => tokens.every((t) => it.haystack.includes(t)))
    .map((it) => ({ it, score: tokens.every((t) => it.titleNorm.includes(t)) ? 2 : 1 }))
    .sort((a, b) => b.score - a.score || a.it.title.localeCompare(b.it.title))
    .map((x) => x.it);
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
  const last = Math.min(first.lastPage || 1, MAX_PROFESSIONAL_PAGES);
  const rest = await Promise.all(
    Array.from({ length: last - 1 }, (_, i) => fetchTherapists(i + 2, { country }, lang)),
  );
  return { therapists: [first, ...rest].flatMap((r) => r.therapists), countries: first.countries };
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
