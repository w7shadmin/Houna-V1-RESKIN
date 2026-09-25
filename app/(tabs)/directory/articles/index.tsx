import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Linking, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid, layout } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { fetchArticles, safeUrl, type Article } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import PageHeader from '@/components/directory/PageHeader';

export default function ArticlesListScreen() {
  const { colors } = useTheme();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.directory.articles;
  const common = t.directory.common;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArticles(language);
      setArticles(data.articles);
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
  const open = (item: Article) => {
    const url = safeUrl(item.url);
    if (url) Linking.openURL(url).catch(() => {});
  };
  const header = <PageHeader title={s.title} intro={t.directory.hub.articlesSubtitle} />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {loading && articles.length === 0 ? (
        <View style={styles.stateWrap}>
          {header}
          <LoadingState label={s.loading} />
        </View>
      ) : error && articles.length === 0 ? (
        <View style={styles.stateWrap}>
          {header}
          <ErrorState message={error} retryLabel={common.tryAgain} onRetry={load} />
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item, i) => `${item.url}-${i}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {header}
              <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
                {num(articles.length)} {articles.length === 1 ? s.countOne : s.countOther}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.title}
                subtitle={item.sourceDomain}
                description={item.blurb}
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
            error && articles.length > 0 ? <InlineError message={error} retryLabel={common.tryAgain} onRetry={load} /> : null
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
