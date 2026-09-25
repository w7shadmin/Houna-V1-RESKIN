import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, Play } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchEventDetail, type EventDetail } from '@/lib/hounaApi';
import { stripHtml } from '@/lib/html';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import DetailHero from '@/components/directory/DetailHero';
import InfoRow from '@/components/directory/InfoRow';

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, language, fonts } = useLanguage();
  const s = t.events.detail;
  const common = t.directory.common;

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEventDetail(slug, language)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : common.notFound);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, language, common.notFound]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState label={s.loading} />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState message={error || common.notFound} retryLabel={common.goBack} onRetry={() => router.back()} />
      </View>
    );
  }

  const infoEntries = Object.entries(detail.info);
  const description = detail.description ? stripHtml(detail.description) : '';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DetailHero imageUrl={detail.imageUrl} />

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{detail.title}</Text>

          {!!detail.date && (
            <View style={styles.dateRow}>
              <Calendar size={16} color={colors.primary} />
              <Text style={[styles.date, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>
                {detail.date}
              </Text>
            </View>
          )}

          {infoEntries.length > 0 && (
            <View style={styles.infoGrid}>
              {infoEntries.map(([key, value]) => (
                <InfoRow key={key} icon={Calendar} label={key} value={value} />
              ))}
            </View>
          )}

          {!!description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                {s.aboutEvent}
              </Text>
              <Text style={[styles.sectionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {description}
              </Text>
            </View>
          )}

          {detail.youtubeEmbeds.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{s.watch}</Text>
              <View style={styles.videoList}>
                {detail.youtubeEmbeds.map((embedUrl, i) => {
                  const videoId = embedUrl.match(/embed\/([^?]+)/)?.[1] || '';
                  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}
                      style={[styles.videoCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      {({ pressed }) => (
                        <>
                          <Image source={{ uri: thumbUrl }} style={styles.videoThumb} resizeMode="cover" />
                          <View
                            style={[
                              styles.playOverlay,
                              pressed && { backgroundColor: 'rgba(0,0,0,0.45)' },
                            ]}
                          >
                            <View
                              style={[
                                styles.playBtn,
                                pressed && { backgroundColor: 'rgba(255,255,255,0.7)' },
                              ]}
                            >
                              <Play size={20} color={colors.primary} fill={colors.primary} />
                            </View>
                          </View>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xl,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  date: {
    fontSize: typography.fontSize.sm,
  },
  infoGrid: {
    marginTop: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
  },
  videoList: {
    gap: spacing.sm,
  },
  videoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    aspectRatio: 16 / 9,
  },
  videoThumb: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
