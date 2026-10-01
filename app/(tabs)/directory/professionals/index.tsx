import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageMarkGlow from '@/components/ui/PageMarkGlow';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid, layout } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import type { Therapist } from '@/lib/hounaApi';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import PageHeader from '@/components/directory/PageHeader';
import ListSearch from '@/components/directory/ListSearch';
import { FilterPill, FilterSheet, type FilterOption } from '@/components/directory/FilterSelect';
import { buildSearchIndex, professionalProfiles, professionalSearchItems, professionalsDirectory } from '@/lib/directorySearch';
import { AGE_GROUPS, PROFESSION_GROUPS, ageGroupsIn, countriesIn, countryOptions, professionGroup } from '@/lib/directoryFilters';
import { factValue } from '@/lib/directoryProfile';
import type { ProfessionalProfile } from '@/lib/searchHighlight';

type FilterKey = 'profession' | 'country' | 'age';
type Filters = Record<FilterKey, string>;
const NO_FILTERS: Filters = { profession: '', country: '', age: '' };

/**
 * Every professional on houna.org, filtered and searched on the phone (Houna's own filters since 1 Oct
 * 2026; the site's were noisy and won't survive its rebuild). One search box and one row of three
 * pills: profession (roles grouped by their words, lib/directoryFilters.ts), country and who they
 * work with, both from each person's own page. Anyone houna.org lists as offering online sessions
 * carries a small mark on their photo. Sorting and an online/offline filter were dropped on purpose.
 */
export default function ProfessionalsListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.directory.professionals;
  const common = t.directory.common;

  const [therapists, setTherapists] = useState<Therapist[] | null>(null);
  const [online, setOnline] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState<Map<string, ProfessionalProfile>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [sheet, setSheet] = useState<FilterKey | null>(null);

  const load = useCallback(() => {
    setError(null);
    professionalsDirectory(language)
      .then((d) => {
        setTherapists(d.therapists);
        setOnline(d.online);
      })
      .catch((err) => setError(err instanceof Error ? err.message : s.error));
    // Each person's own page (location, who they work with): the filters wait for it, the list doesn't.
    professionalProfiles(language).then(setProfiles).catch(() => {});
  }, [language, s.error]);

  useEffect(load, [load]);

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const location = (p: Therapist) => factValue(profiles.get(p.slug)?.info, 'location');
  const workWith = (p: Therapist) => factValue(profiles.get(p.slug)?.info, 'workWith');

  const index = useMemo(() => buildSearchIndex(professionalSearchItems(therapists ?? [], profiles)), [therapists, profiles]);

  const shown = useMemo(() => {
    if (!therapists) return [];
    const bySlug = new Map(therapists.map((p) => [p.slug, p]));
    const base = query.trim() ? index.query(query).items.map((it) => bySlug.get(it.key)).filter((p): p is Therapist => !!p) : therapists;
    return base.filter(
      (p) =>
        (!filters.profession || professionGroup(p.role) === filters.profession) &&
        (!filters.country || countriesIn(location(p)).includes(filters.country)) &&
        (!filters.age || ageGroupsIn(workWith(p)).includes(filters.age as never)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [therapists, profiles, index, query, filters]);

  const options: Record<FilterKey, FilterOption[]> = useMemo(
    () => ({
      profession: [
        { value: '', label: s.anyProfession },
        ...PROFESSION_GROUPS.map((g) => ({ value: g, label: s.groups[g], hint: s.groupHints[g] })),
      ],
      country: [
        { value: '', label: s.anyCountry },
        ...countryOptions((therapists ?? []).map(location)).map((c) => ({ value: c.name, label: c.name, count: c.count })),
      ],
      age: [{ value: '', label: s.anyone }, ...AGE_GROUPS.map((a) => ({ value: a, label: s.ages[a] }))],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [s, therapists, profiles],
  );
  const titles: Record<FilterKey, string> = { profession: s.profession, country: common.country, age: s.worksWith };
  const anySet = !!(filters.profession || filters.country || filters.age);

  const header = <PageHeader title={s.title} intro={t.directory.hub.professionalsSubtitle} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* The mark as a soft glow behind the header (Design studies "E4"). */}
      <PageMarkGlow />
      {!therapists && !error ? (
        <View style={styles.stateWrap}>
          {header}
          <LoadingState label={s.loading} />
        </View>
      ) : !therapists ? (
        <View style={styles.stateWrap}>
          {header}
          <ErrorState message={error ?? s.error} retryLabel={common.tryAgain} onRetry={load} />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {header}
              <ListSearch value={query} onChange={setQuery} placeholder={s.searchPlaceholder} />
              <View style={styles.pills}>
                {(['profession', 'country', 'age'] as const).map((k) => (
                  <FilterPill key={k} label={titles[k]} value={filters[k]} options={options[k]} onPress={() => setSheet(k)} />
                ))}
              </View>
              <View style={styles.countRow}>
                <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.medium }]} accessibilityLiveRegion="polite">
                  {arabicPlural(shown.length, s.count).replace('{n}', num(shown.length))}
                </Text>
                {anySet && (
                  <Pressable onPress={() => setFilters(NO_FILTERS)} accessibilityRole="button" hitSlop={12} style={({ pressed }) => pressed && styles.pressed}>
                    <Text style={[styles.clear, { color: colors.primary, fontFamily: fonts.semiBold }]}>{s.clear}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.name}
                subtitle={item.role}
                description={item.summary}
                onlineLabel={online.has(item.slug) ? s.online : undefined}
                onPress={() => router.push({ pathname: '/directory/professionals/[slug]', params: { slug: item.slug } })}
              />
            </View>
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.noMatch}</Text>}
        />
      )}
      {(['profession', 'country', 'age'] as const).map((k) => (
        <FilterSheet
          key={k}
          visible={sheet === k}
          title={titles[k]}
          value={filters[k]}
          options={options[k]}
          onChange={(v) => setFilters((f) => ({ ...f, [k]: v }))}
          onClose={() => setSheet(null)}
        />
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  stateWrap: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
  },
  listContent: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(5),
  },
  listHeader: {
    gap: grid(2),
    marginBottom: grid(1.5),
  },
  pills: {
    flexDirection: 'row',
    gap: grid(1),
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    fontSize: 13,
    lineHeight: 16,
  },
  clear: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.6,
  },
  itemWrap: {
    marginBottom: grid(1.5),
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: grid(6),
    paddingHorizontal: grid(2),
  },
});
