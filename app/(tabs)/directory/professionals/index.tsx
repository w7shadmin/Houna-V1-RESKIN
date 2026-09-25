import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { fetchTherapists, type Therapist, type CountryOption } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import FilterToggle from '@/components/directory/FilterToggle';
import ChipFilter from '@/components/directory/ChipFilter';

interface Filters {
  availability: string;
  profession: string;
  country: string;
  sort: string;
}

const initialFilters: Filters = { availability: '', profession: '', country: '', sort: 'name-ASC' };

export default function ProfessionalsListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.directory.professionals;
  const common = t.directory.common;

  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadingRef = useRef(false);
  const pageRef = useRef(1);
  const lastPageRef = useRef(1);

  const loadPage = useCallback(
    async (pageNum: number, currentFilters: Filters, append: boolean) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await fetchTherapists(pageNum, currentFilters, language);
        if (data.therapists.length === 0 && append) {
          lastPageRef.current = pageNum;
          setLastPage(pageNum);
        } else {
          setTherapists((prev) => (append ? [...prev, ...data.therapists] : data.therapists));
          pageRef.current = data.currentPage;
          lastPageRef.current = data.lastPage;
          setPage(data.currentPage);
          setLastPage(data.lastPage);
        }
        if (data.countries.length > 0) setCountries(data.countries);
      } catch (err) {
        setError(err instanceof Error ? err.message : s.error);
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [language, s.error],
  );

  useEffect(() => {
    pageRef.current = 1;
    lastPageRef.current = 1;
    setPage(1);
    setLastPage(1);
    setTherapists([]);
    loadingRef.current = false;
    loadPage(1, filters, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, language]);

  const handleRetry = () => {
    setTherapists([]);
    pageRef.current = 1;
    lastPageRef.current = 1;
    loadingRef.current = false;
    loadPage(1, filters, false);
  };

  const handleEndReached = () => {
    if (pageRef.current < lastPageRef.current && !loadingRef.current) {
      loadPage(pageRef.current + 1, filters, true);
    }
  };

  const activeFilterCount = [filters.availability, filters.profession, filters.country, filters.sort !== 'name-ASC' ? filters.sort : ''].filter(Boolean).length;
  const hasMore = page < lastPage;
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
          <ArrowLeft size={18} color={colors.text} style={isRTL ? styles.flip : undefined} />
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{s.title}</Text>
      </View>

      {loading && therapists.length === 0 ? (
        <LoadingState label={s.loading} />
      ) : error && therapists.length === 0 ? (
        <ErrorState message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
      ) : (
        <FlatList
          data={therapists}
          keyExtractor={(item, i) => `${item.slug}-${i}`}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.4}
          onEndReached={handleEndReached}
          // This list grows via infinite scroll to ~300 rows (the real
          // professional count) — tuned batching keeps that from
          // triggering RN's "large list slow to update" warning.
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListHeaderComponent={
            <View>
              <FilterToggle
                label={common.filters}
                activeCount={activeFilterCount}
                expanded={showFilters}
                onPress={() => setShowFilters((v) => !v)}
              />
              {showFilters && (
                <View style={[styles.filterPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ChipFilter
                    label={s.lookingFor}
                    options={s.availability}
                    value={filters.availability}
                    onChange={(v) => setFilters((f) => ({ ...f, availability: v }))}
                  />
                  <ChipFilter
                    label={s.profession}
                    options={s.professionOptions}
                    value={filters.profession}
                    onChange={(v) => setFilters((f) => ({ ...f, profession: v }))}
                  />
                  <ChipFilter
                    label={common.country}
                    options={countryOptions}
                    value={filters.country}
                    onChange={(v) => setFilters((f) => ({ ...f, country: v }))}
                  />
                  <ChipFilter
                    label={s.sortBy}
                    options={s.sortOptions}
                    value={filters.sort}
                    onChange={(v) => setFilters((f) => ({ ...f, sort: v }))}
                  />
                  {activeFilterCount > 0 && (
                    <Pressable
                      onPress={() => setFilters(initialFilters)}
                      style={({ pressed }) => pressed && { opacity: 0.6 }}
                    >
                      <Text style={[styles.resetText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                        {common.resetFilters}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
              <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                {num(therapists.length)} {therapists.length === 1 ? s.countOne : s.countOther}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.name}
                subtitle={item.role}
                description={item.summary}
                onPress={() =>
                  router.push({ pathname: '/directory/professionals/[slug]', params: { slug: item.slug } })
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
            <View style={styles.footer}>
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} />
              ) : !hasMore && therapists.length > 0 ? (
                <Text style={[styles.endText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                  {common.reachedEnd}
                </Text>
              ) : null}
              {!!(error && therapists.length > 0) && (
                <InlineError message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
              )}
            </View>
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
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  endText: {
    fontSize: typography.fontSize.xs,
  },
});
