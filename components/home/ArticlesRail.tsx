import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ArrowLeft, ExternalLink, FileText } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { fetchArticles, safeUrl, resolveImageUrl, type Article } from '@/lib/hounaApi';

const RAIL_CARD_W = 150;
const RAIL_IMAGE_H = 100;

/** Horizontal preview rail for the latest articles — full list lives at /directory/articles. */
export default function ArticlesRail() {
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.home.articlesRail;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchArticles(language)
      .then((data) => {
        if (!cancelled) setArticles(data.articles.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const handleOpen = (article: Article) => {
    const url = safeUrl(article.url);
    if (url) Linking.openURL(url);
  };

  if (!loading && articles.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.text, fontFamily: fonts.bold }]}>{s.heading}</Text>
        <Pressable
          onPress={() => router.push('/directory/articles')}
          style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.seeAllText, { color: colors.primary, fontFamily: fonts.semiBold }]}>{s.seeAll}</Text>
          <ArrowIcon size={14} color={colors.primary} strokeWidth={2.2} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {articles.map((article, i) => (
            <Pressable
              key={`${article.url}-${i}`}
              onPress={() => handleOpen(article)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.cardImage, { backgroundColor: colors.surface }]}>
                {resolveImageUrl(article.imageUrl) ? (
                  <Image source={{ uri: resolveImageUrl(article.imageUrl)! }} style={styles.cardImageImg} resizeMode="cover" />
                ) : (
                  <FileText size={22} color={colors.textTertiary} strokeWidth={1.6} />
                )}
              </View>
              <View style={styles.cardText}>
                <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                  {article.title}
                </Text>
                {!!article.sourceDomain && (
                  <View style={styles.cardMeta}>
                    <ExternalLink size={10} color={colors.textTertiary} strokeWidth={2} />
                    <Text numberOfLines={1} style={[styles.cardMetaText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                      {article.sourceDomain}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.fontSize.md,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
  },
  loading: {
    paddingVertical: spacing.lg,
  },
  rail: {
    gap: spacing.sm + 4,
  },
  card: {
    width: RAIL_CARD_W,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: RAIL_IMAGE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageImg: {
    width: '100%',
    height: '100%',
  },
  cardText: {
    padding: spacing.sm + 2,
    gap: spacing.xxs + 2,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  cardMetaText: {
    fontSize: 10,
    flex: 1,
  },
});
