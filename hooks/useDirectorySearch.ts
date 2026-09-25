import { useEffect, useMemo, useState } from 'react';
import {
  SOURCES,
  professionalsInCountry,
  proxyCountryId,
  topicItems,
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

/**
 * Loads the search index progressively — each source's results appear as
 * soon as it answers — once `enabled` turns true (first focus or keystroke,
 * so browsing the Directory never triggers five fetches).
 */
export function useDirectorySearch(
  language: 'en' | 'ar',
  countryIso: string | null,
  topics: readonly LocalTopic[],
  enabled: boolean,
) {
  const [bySource, setBySource] = useState<Partial<Record<SourceKey, SearchItem[]>>>({});
  const [failed, setFailed] = useState<SourceKey[]>([]);
  const [near, setNear] = useState<NearYou | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    setBySource({});
    setFailed([]);
    setNear(null);

    SOURCE_KEYS.forEach((key) => {
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
        .catch(() => alive && setFailed((prev) => [...prev, key]));
    });

    return () => {
      alive = false;
    };
  }, [enabled, language, countryIso]);

  const items = useMemo(
    () => [...topicItems(topics), ...SOURCE_KEYS.flatMap((k) => bySource[k] ?? [])],
    [topics, bySource],
  );
  const loading = enabled && Object.keys(bySource).length + failed.length < SOURCE_KEYS.length;

  return { items, near, loading, failed };
}
