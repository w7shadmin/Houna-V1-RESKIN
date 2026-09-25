import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, Linking, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { fetchPodcasts, safeUrl, type Podcast } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';

export default function PodcastsListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
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

  const handleOpen = (podcast: Podcast) => {
    const url = safeUrl(podcast.url);
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
          <View style={isRTL ? styles.flip : undefined}>
<ArrowLeft size={18} color={colors.text} />
</View>
        </Pressable>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{s.title}</Text>
      </View>

      {loading && podcasts.length === 0 ? (
        <LoadingState label={s.loading} />
      ) : error && podcasts.length === 0 ? (
        <ErrorState message={error} retryLabel={common.tryAgain} onRetry={load} />
      ) : (
        <FlatList
          data={podcasts}
          keyExtractor={(item, i) => `${item.title}-${i}`}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {num(podcasts.length)} {podcasts.length === 1 ? s.countOne : s.countOther}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.itemWrap}>
              <ListItemCard
                imageUrl={item.imageUrl}
                title={item.title}
                subtitle={item.host}
                description={item.description}
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
            error && podcasts.length > 0 ? (
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
