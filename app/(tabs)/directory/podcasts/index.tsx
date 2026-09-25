import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid, layout } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { fetchPodcasts, safeUrl, type Podcast } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import PageHeader from '@/components/directory/PageHeader';

export default function PodcastsListScreen() {
  const { colors } = useTheme();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.directory.podcasts;
  const common = t.directory.common;

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPodcasts(language);
      setPodcasts(data.podcasts);
    } catch (err) {
      setError(err instanceof Error ? err.message : s.error);
    } finally {
      setLoading(false);
    }
  }, [language, s.error]);

  useEffect(() => {
    load();
  }, [load]);

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const open = (item: Podcast) => {
    const url = safeUrl(item.url);
    if (url) Linking.openURL(url).catch(() => {});
  };
  const header = <PageHeader title={s.title} intro={t.directory.hub.podcastsSubtitle} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {loading && podcasts.length === 0 ? (
        <View style={styles.stateWrap}>
          {header}
          <LoadingState label={s.loading} />
        </View>
      ) : error && podcasts.length === 0 ? (
        <View style={styles.stateWrap}>
          {header}
          <ErrorState message={error} retryLabel={common.tryAgain} onRetry={load} />
        </View>
      ) : (
        <FlatList
          data={podcasts}
          keyExtractor={(item, i) => `${item.title}-${i}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {header}
              <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
                {arabicPlural(podcasts.length, s.count).replace('{n}', num(podcasts.length))}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.title}
                subtitle={item.host}
                description={item.description}
                imageResizeMode="contain"
                onPress={() => open(item)}
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
            error && podcasts.length > 0 ? <InlineError message={error} retryLabel={common.tryAgain} onRetry={load} /> : null
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
