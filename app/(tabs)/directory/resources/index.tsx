import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, Linking, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { palette, spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchResourceDirectory, safeUrl, type ResourceDirectoryData, type ResourceArticle } from '@/lib/hounaApi';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import LottieTopicIcon from '@/components/directory/LottieTopicIcon';
import GradientTile from '@/components/GradientTile';

export default function ResourceDirectoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.directory.resources;
  const common = t.directory.common;

  const [data, setData] = useState<ResourceDirectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchResourceDirectory(language);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : s.error);
    } finally {
      setLoading(false);
    }
  }, [language, s.error]);

  useEffect(() => {
    load();
  }, [load]);

  const handleArticle = (article: ResourceArticle) => {
    const url = safeUrl(article.url);
    if (url) Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {loading && !data ? (
        <>
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
          </View>
          <LoadingState label={s.loading} />
        </>
      ) : error && !data ? (
        <>
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
          </View>
          <ErrorState message={error} retryLabel={common.tryAgain} onRetry={load} />
        </>
      ) : data ? (
        <FlatList
          data={[]}
          keyExtractor={() => 'x'}
          renderItem={null}
          ListHeaderComponent={
            <View>
              {/* Banner */}
              <View style={styles.banner}>
                {data.bannerImage ? (
                  <Image source={{ uri: data.bannerImage }} style={styles.bannerImg} resizeMode="cover" />
                ) : (
                  <View style={[styles.bannerImg, { backgroundColor: colors.primaryLightest }]} />
                )}
                <View style={styles.bannerOverlay} />
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.bannerBackBtn,
                    isRTL ? styles.bannerBackBtnEnd : styles.bannerBackBtnStart,
                    pressed && { backgroundColor: 'rgba(255,255,255,0.7)' },
                  ]}
                >
                  <View style={isRTL ? styles.flip : undefined}>
<ArrowLeft size={18} color={colors.text} />
</View>
                </Pressable>
              </View>

              <Text style={[styles.heading, { color: colors.primary, fontFamily: fonts.bold }]}>{data.heading}</Text>

              {/* Topic grid */}
              <View style={styles.grid}>
                {data.topics.map((topic, i) => (
                  <Pressable
                    key={`${topic.slug}-${i}`}
                    onPress={() => router.push({ pathname: '/directory/resources/[slug]', params: { slug: topic.slug } })}
                    style={({ pressed }) => [
                      styles.topicCard,
                      { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                      pressed && { backgroundColor: colors.cardPressed },
                    ]}
                  >
                    <GradientTile color={palette.turquoise} size={56} borderRadius={radius.md} style={styles.topicIconTile}>
                      <LottieTopicIcon slug={topic.slug} size={40} />
                    </GradientTile>
                    <Text numberOfLines={2} style={[styles.topicTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                      {topic.title}
                    </Text>
                    {!!topic.description && (
                      <Text numberOfLines={1} style={[styles.topicDesc, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                        {topic.description}
                      </Text>
                    )}
                    <View style={styles.learnMoreRow}>
                      <Text style={[styles.learnMoreText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                        {s.learnMore}
                      </Text>
                      <View style={isRTL ? styles.flip : undefined}>
<ChevronRight size={13} color={colors.primary} strokeWidth={2} />
</View>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Important Articles */}
              {data.importantArticles.length > 0 && (
                <View style={styles.articlesSection}>
                  <Text style={[styles.articlesHeading, { color: colors.text, fontFamily: fonts.bold }]}>
                    {s.importantArticles}
                  </Text>
                  <Text style={[styles.articlesBlurb, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                    {s.articlesBlurb}
                  </Text>
                  <View style={styles.articlesList}>
                    {data.importantArticles.map((article, i) => (
                      <ListItemCard
                        key={`${article.url}-${i}`}
                        imageUrl={article.imageUrl}
                        title={article.title}
                        subtitle={article.sourceDomain}
                        description={article.blurb}
                        imageResizeMode="cover"
                        onPress={() => handleArticle(article)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : null}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
  listContent: {
    paddingBottom: spacing.xxl,
  },
  banner: {
    height: 176,
    width: '100%',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bannerBackBtn: {
    position: 'absolute',
    top: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerBackBtnStart: {
    start: spacing.md,
  },
  bannerBackBtnEnd: {
    end: spacing.md,
  },
  heading: {
    fontSize: typography.fontSize.lg,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  topicCard: {
    width: '47%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 4,
  },
  topicIconTile: {
    marginBottom: spacing.sm,
  },
  topicTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  topicDesc: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  learnMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  learnMoreText: {
    fontSize: typography.fontSize.xs,
  },
  articlesSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  articlesHeading: {
    fontSize: typography.fontSize.lg,
  },
  articlesBlurb: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  articlesList: {
    gap: spacing.sm,
  },
});
