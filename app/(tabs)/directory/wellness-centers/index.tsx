import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageMarkGlow from '@/components/ui/PageMarkGlow';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid, layout, radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { fetchWellnessCenters, type WellnessCenter, type CountryOption } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import PageHeader from '@/components/directory/PageHeader';
import ListSearch from '@/components/directory/ListSearch';
import { FilterPill, FilterSheet } from '@/components/directory/FilterSelect';
import { buildSearchIndex, listSearchItems } from '@/lib/directorySearch';
import { cleanServiceTags } from '@/lib/directoryFilters';

export default function WellnessCentersListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.directory.wellnessCenters;
  const common = t.directory.common;

  const [centers, setCenters] = useState<WellnessCenter[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  // This list's own search (names, summaries, services), on the phone, as you type.
  const [query, setQuery] = useState('');

  const load = useCallback(
    async (selectedCountry: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchWellnessCenters(selectedCountry, language);
        setCenters(data.centers);
        if (data.countries.length > 0) setCountries(data.countries);
      } catch (err) {
        setError(err instanceof Error ? err.message : s.error);
      } finally {
        setLoading(false);
      }
    },
    [language, s.error],
  );

  useEffect(() => {
    load(country);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, language]);

  const handleRetry = () => {
    setCenters([]);
    load(country);
  };

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const countryOptions = [{ value: '', label: t.directory.professionals.anyCountry }, ...countries];
  const index = useMemo(
    () =>
      buildSearchIndex(
        listSearchItems(centers, (x) => ({ key: x.id, title: x.name, subtitle: x.summary, extra: x.services })),
      ),
    [centers],
  );
  const shown = useMemo(() => {
    if (!query.trim()) return centers;
    const byId = new Map(centers.map((x) => [x.id, x]));
    return index.query(query).items.map((it) => byId.get(it.key)).filter((x): x is (typeof centers)[number] => !!x);
  }, [centers, index, query]);
  const header = <PageHeader title={s.title} intro={t.directory.hub.wellnessSubtitle} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* The mark as a soft glow behind the header (Design studies "E4"). */}
      <PageMarkGlow />
      {loading && centers.length === 0 ? (
        <View style={styles.stateWrap}>
          {header}
          <LoadingState label={s.loading} />
        </View>
      ) : error && centers.length === 0 ? (
        <View style={styles.stateWrap}>
          {header}
          <ErrorState message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
        </View>
      ) : (
        <FlatList
          data={shown}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          keyExtractor={(item, i) => `${item.id}-${i}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {header}
              <ListSearch value={query} onChange={setQuery} placeholder={s.searchPlaceholder} />
              {/* Only offer the filter when the server sent countries to pick from. */}
              {countries.length > 0 && (
                <View style={styles.pills}>
                  <FilterPill label={common.country} value={country} options={countryOptions} onPress={() => setCountryOpen(true)} />
                </View>
              )}
              <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
                {arabicPlural(shown.length, s.count).replace('{n}', num(shown.length))}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.name}
                tags={cleanServiceTags(item.services)}
                imageResizeMode="contain"
                onPress={() => router.push({ pathname: '/directory/wellness-centers/[id]', params: { id: item.id } })}
              />
            </View>
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={[styles.empty, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                {common.noResults}
              </Text>
            ) : null
          }
          ListFooterComponent={
            error && centers.length > 0 ? (
              <InlineError message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
            ) : null
          }
        />
      )}
      <FilterSheet
        visible={countryOpen}
        title={common.country}
        value={country}
        options={countryOptions}
        onChange={setCountry}
        onClose={() => setCountryOpen(false)}
      />
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
  },
  count: {
    fontSize: 13,
    lineHeight: 16,
  },
  itemWrap: {
    marginBottom: grid(1.5),
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: grid(6),
  },
});
