import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ArrowLeft, Mic, Headphones, Play } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { fetchPodcasts, safeUrl, type Podcast } from '@/lib/hounaApi';

const RAIL_CARD_W = 150;
const RAIL_IMAGE_H = 100;

/** Horizontal preview rail for podcasts — full list lives at /directory/podcasts. */
export default function PodcastsRail() {
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.home.podcastsRail;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPodcasts(language)
      .then((data) => {
        if (!cancelled) setPodcasts(data.podcasts.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const handleOpen = (podcast: Podcast) => {
    const url = safeUrl(podcast.url);
    if (url) Linking.openURL(url);
  };

  if (!loading && podcasts.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.text, fontFamily: fonts.bold }]}>{s.heading}</Text>
        <Pressable
          onPress={() => router.push('/directory/podcasts')}
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
          {podcasts.map((podcast, i) => (
            <Pressable
              key={`${podcast.title}-${i}`}
              onPress={() => handleOpen(podcast)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.cardImage, { backgroundColor: colors.primaryLightest }]}>
                {podcast.imageUrl ? (
                  <Image source={{ uri: podcast.imageUrl }} style={styles.cardImageImg} resizeMode="cover" />
                ) : (
                  <Headphones size={22} color={colors.primary} strokeWidth={1.6} />
                )}
              </View>
              <View style={styles.cardText}>
                <View style={styles.cardEyebrow}>
                  <Mic size={9} color={colors.primary} strokeWidth={2.2} />
                  <Text style={[styles.cardEyebrowText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                    {s.label}
                  </Text>
                </View>
                <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                  {podcast.title}
                </Text>
                <View style={styles.cardFooter}>
                  <Text numberOfLines={1} style={[styles.cardHost, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                    {podcast.host || podcast.sourceDomain}
                  </Text>
                  <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                    <Play size={11} color={colors.onPrimary} fill={colors.onPrimary} />
                  </View>
                </View>
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
  cardEyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  cardEyebrowText: {
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  cardHost: {
    fontSize: 11,
    flex: 1,
  },
  playBtn: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
