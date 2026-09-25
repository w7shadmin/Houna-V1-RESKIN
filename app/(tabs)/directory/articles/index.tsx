import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Linking, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { fetchArticles, safeUrl, type Article } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';

export default function ArticlesListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
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

  const handleOpen = (article: Article) => {
    const url = safeUrl(article.url);
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
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

      {loading && articles.length === 0 ? (
        <LoadingState label={s.loading} />
      ) : error && articles.length === 0 ? (
        <ErrorState message={error} retryLabel={common.tryAgain} onRetry={load} />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item, i) => `${item.url}-${i}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {num(articles.length)} {articles.length === 1 ? s.countOne : s.countOther}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.title}
                subtitle={item.sourceDomain}
                description={item.blurb}
                imageResizeMode="contain"
                onPress={() => handleOpen(item)}
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
            error && articles.length > 0 ? (
              <InlineError message={error} retryLabel={common.tryAgain} onRetry={load} />
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
