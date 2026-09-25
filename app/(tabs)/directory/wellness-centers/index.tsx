import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { fetchWellnessCenters, type WellnessCenter, type CountryOption } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import FilterToggle from '@/components/directory/FilterToggle';
import ChipFilter from '@/components/directory/ChipFilter';

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
  const [showFilters, setShowFilters] = useState(false);

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
  const countryOptions = [{ value: '', label: common.all }, ...countries];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.replace('/directory')}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { backgroundColor: colors.cardPressed },
          ]}
        >
          <View style={isRTL ? styles.flip : undefined}>
<ArrowLeft size={18} color={colors.text} />
</View>
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{s.title}</Text>
      </View>

      {loading && centers.length === 0 ? (
        <LoadingState label={s.loading} />
      ) : error && centers.length === 0 ? (
        <ErrorState message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
      ) : (
        <FlatList
          data={centers}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <FilterToggle
                label={common.filterByCountry}
                activeCount={country ? 1 : 0}
                expanded={showFilters}
                onPress={() => setShowFilters((v) => !v)}
              />
              {showFilters && (
                <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ChipFilter label={common.country} options={countryOptions} value={country} onChange={setCountry} />
                  {!!country && (
                    <Pressable
                      onPress={() => setCountry('')}
                      style={({ pressed }) => pressed && { opacity: 0.6 }}
                    >
                      <Text style={[styles.resetText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                        {common.resetFilter}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
              <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                {num(centers.length)} {centers.length === 1 ? s.countOne : s.countOther}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.name}
                tags={item.services}
                imageResizeMode="contain"
                onPress={() =>
                  router.push({ pathname: '/directory/wellness-centers/[id]', params: { id: item.id } })
                }
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
            !!(error && centers.length > 0) ? (
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  title: {
    fontSize: typography.fontSize.xl,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  filterPanel: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  resetText: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  count: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  itemWrap: {
    marginBottom: spacing.sm,
  },
  empty: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing.xxl,
  },
});
