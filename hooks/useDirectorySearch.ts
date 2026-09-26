import { useEffect, useMemo, useState } from 'react';
import {
  ALIAS_SOURCES,
  SOURCES,
  professionalFacts,
  professionalsInCountry,
  proxyCountryId,
  tanafasItems,
  topicItems,
  type LocalExercise,
  type LocalTopic,
  type SearchItem,
  type SourceKey,
} from '@/lib/directorySearch';
import { getCountryName } from '@/lib/countries';

const SOURCE_KEYS = Object.keys(SOURCES) as SourceKey[];

export interface NearYou {
  slugs: Set<string>;
  countryName: string;
}

/** The app's own content the search covers, in the current language. */
export interface LocalContent {
  topics: readonly LocalTopic[];
  exercises: readonly LocalExercise[];
  kindWords: Record<LocalExercise['kind'], string>;
}

/**
 * Loads the search index progressively — each source's results appear as
 * soon as it answers (from the phone's saved copy when there is one) — once
 * `enabled` turns true (first focus or keystroke, so browsing the Directory
 * never triggers the fetches). Once they're all in, the same lists in the
 * other language load quietly behind, so a name can be found in either script
 * ("Nour" in Arabic, "نور" in English). Professionals also carry what their
 * own page says (location, languages, who they work with, specialties), from
 * the daily server index (supabase/functions/houna-search-index).
 */
export function useDirectorySearch(
  language: 'en' | 'ar',
  countryIso: string | null,
  local: LocalContent,
  enabled: boolean,
) {
  const [bySource, setBySource] = useState<Partial<Record<SourceKey, SearchItem[]>>>({});
  const [failed, setFailed] = useState<SourceKey[]>([]);
  const [near, setNear] = useState<NearYou | null>(null);
  /** `${type}:${key}` → the item's name in the other language. */
  const [aliases, setAliases] = useState<Map<string, string>>(new Map());
  /** Professional slug → what their own page says (from the daily server index). */
  const [facts, setFacts] = useState<Map<string, string[]>>(new Map());

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setBySource({});
    setFailed([]);
    setNear(null);
    setAliases(new Map());
    setFacts(new Map());

    // Alongside the lists: one small file, never holding the search up.
    professionalFacts(language).then((map) => alive && setFacts(map));

    const loads = SOURCE_KEYS.map((key) =>
      SOURCES[key](language)
        .then((res) => {
          if (!alive) return;
          const items = Array.isArray(res) ? res : res.items;
          setBySource((prev) => ({ ...prev, [key]: items }));

          // "Professionals near you" — only when the person has set a country.
          if (!Array.isArray(res) && countryIso) {
            const id = proxyCountryId(countryIso, res.countries);
            const name = getCountryName(countryIso, language);
            if (id && name) {
              professionalsInCountry(language, id)
                .then((slugs) => alive && setNear({ slugs, countryName: name }))
                .catch(() => {});
            }
          }
        })
        .catch(() => alive && setFailed((prev) => [...prev, key])),
    );

    // The other language's names, after this language's lists (never competing with them).
    const other = language === 'en' ? 'ar' : 'en';
    Promise.all(loads).then(() => {
      ALIAS_SOURCES.forEach((key) => {
        SOURCES[key](other)
          .then((res) => {
            if (!alive) return;
            const items = Array.isArray(res) ? res : res.items;
            setAliases((prev) => {
              const next = new Map(prev);
              items.forEach((it) => next.set(`${it.type}:${it.key}`, it.title));
              return next;
            });
          })
          .catch(() => {});
      });
    });

    return () => {
      alive = false;
    };
  }, [enabled, language, countryIso]);

  const localItems = useMemo(
    () => [...topicItems(local.topics), ...tanafasItems(local.exercises, local.kindWords)],
    [local],
  );

  const items = useMemo(() => {
    const loaded = SOURCE_KEYS.flatMap((k) => bySource[k] ?? []);
    if (aliases.size === 0 && facts.size === 0) return [...localItems, ...loaded];
    return [
      ...localItems,
      ...loaded.map((it) => {
        const alias = aliases.get(`${it.type}:${it.key}`);
        const known = it.type === 'professional' ? facts.get(it.key) : undefined;
        if (!known && !(alias && alias !== it.title)) return it;
        return { ...it, ...(alias && alias !== it.title ? { aliases: [alias] } : {}), ...(known ? { facts: known } : {}) };
      }),
    ];
  }, [localItems, bySource, aliases, facts]);
  const loading = enabled && Object.keys(bySource).length + failed.length < SOURCE_KEYS.length;

  return { items, near, loading, failed };
}
