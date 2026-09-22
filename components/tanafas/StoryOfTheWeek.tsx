import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, Linking, StyleSheet } from 'react-native';
import { Sparkles, ExternalLink, FileText } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import { fetchArticles, safeUrl, type Article } from '@/lib/hounaApi';

/**
 * Stopgap for Segment 3's "story of the week" until Segment 6 (Voices, an
 * actual submission platform) exists to source real community stories from
 * — highlights one already-published article instead, picked deterministically
 * by the ISO week number so it's the same pick for everyone and changes once
 * a week, not on every load. The push-notification half of this (Segment 4)
 * isn't built yet; this is the in-app banner half only.
 */
function isoWeekKey(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return d.getUTCFullYear() * 100 + week;
}

export default function StoryOfTheWeek() {
  const { t, language, fonts } = useLanguage();
  const hub = t.tanafas.hub;

  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchArticles(language)
      .then((data) => {
        if (cancelled || data.articles.length === 0) return;
        const index = isoWeekKey(new Date()) % data.articles.length;
        setArticle(data.articles[index]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [language]);

  if (!article) return null;

  const handleOpen = () => {
    const url = safeUrl(article.url);
    if (url) Linking.openURL(url);
  };

  return (
    <Pressable
      onPress={handleOpen}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={styles.badgeRow}>
        <Sparkles size={13} color={colors.primary} strokeWidth={2.2} />
        <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fonts.semiBold }]}>{hub.storyOfWeek}</Text>
      </View>

      <View style={styles.body}>
        <View style={[styles.image, { backgroundColor: colors.surface }]}>
          {article.imageUrl ? (
            <Image source={{ uri: article.imageUrl }} style={styles.imageImg} resizeMode="cover" />
          ) : (
            <FileText size={20} color={colors.textTertiary} strokeWidth={1.6} />
          )}
        </View>
        <View style={styles.text}>
          <Text numberOfLines={2} style={[styles.title, { color: colors.text, fontFamily: fonts.semiBold }]}>
            {article.title}
          </Text>
          {!!article.sourceDomain && (
            <View style={styles.meta}>
              <ExternalLink size={10} color={colors.textTertiary} strokeWidth={2} />
              <Text numberOfLines={1} style={[styles.metaText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                {article.sourceDomain}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageImg: {
    width: '100%',
    height: '100%',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs + 2,
  },
  metaText: {
    fontSize: 10,
    flex: 1,
  },
});
