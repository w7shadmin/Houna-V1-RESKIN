import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid, layout, radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { fetchOrganizations, type Organization, type CountryOption } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import FilterToggle from '@/components/directory/FilterToggle';
import ChipFilter from '@/components/directory/ChipFilter';
import PageHeader from '@/components/directory/PageHeader';

export default function OrganizationsListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.directory.organizations;
  const common = t.directory.common;

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(
    async (selectedCountry: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchOrganizations(selectedCountry, language);
        setOrgs(data.organizations);
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
    setOrgs([]);
    load(country);
  };

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const countryOptions = [{ value: '', label: common.all }, ...countries];
  const header = <PageHeader title={s.title} intro={t.directory.hub.organizationsSubtitle} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {loading && orgs.length === 0 ? (
        <View style={styles.stateWrap}>
          {header}
          <LoadingState label={s.loading} />
        </View>
      ) : error && orgs.length === 0 ? (
        <View style={styles.stateWrap}>
          {header}
          <ErrorState message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
        </View>
      ) : (
        <FlatList
          data={orgs}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {header}
              {/* Only offer the filter when the server sent countries to pick from. */}
              {countries.length > 0 && (
                <FilterToggle
                  label={common.filterByCountry}
                  activeCount={country ? 1 : 0}
                  expanded={showFilters}
                  onPress={() => setShowFilters((v) => !v)}
                />
              )}
              {showFilters && countries.length > 0 && (
                <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ChipFilter label={common.country} options={countryOptions} value={country} onChange={setCountry} />
                  {!!country && (
                    <Pressable onPress={() => setCountry('')} accessibilityRole="button" style={({ pressed }) => pressed && styles.pressed}>
                      <Text style={[styles.resetText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                        {common.resetFilter}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
              <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
                {num(orgs.length)} {orgs.length === 1 ? s.countOne : s.countOther}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.name}
                description={item.summary}
                imageResizeMode="contain"
                onPress={() => router.push({ pathname: '/directory/organizations/[id]', params: { id: item.id } })}
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
            error && orgs.length > 0 ? (
              <InlineError message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
            ) : null
          }
        />
      )}
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
  filterPanel: {
    gap: grid(1),
    borderRadius: radius.cardLg,
    borderWidth: 1,
    padding: grid(2),
  },
  pressed: {
    opacity: 0.6,
  },
  resetText: {
    fontSize: 14,
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
