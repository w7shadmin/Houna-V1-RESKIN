import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Play } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout, radius, shadows } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import { decodeEntities, profileFacts } from '@/lib/directoryProfile';
import { formatEventDate } from '@/lib/eventDate';
import { fetchEventDetail, resolveImageUrl, type EventDetail } from '@/lib/hounaApi';
import { stripHtml } from '@/lib/html';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import { BodyText, FactGrid, GroupLabel, ProfileTopBar, SectionCard } from '@/components/directory/ProfileKit';

/**
 * An event, in the profile pages' language: rounded cover image, date,
 * display title, fact tiles (where, which language), About card, and any
 * recordings as video cards.
 */
export default function EventDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.events.detail;
  const list = t.events.list;
  const common = t.directory.common;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEventDetail(slug, language)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : common.notFound))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, language, common.notFound]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/events'));

  if (loading || error || !detail) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.stateWrap}>
          <ProfileTopBar onBack={back} />
          {loading ? (
            <LoadingState label={s.loading} />
          ) : (
            <ErrorState message={error || common.notFound} retryLabel={common.goBack} onRetry={back} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const uri = resolveImageUrl(detail.imageUrl);
  const facts = profileFacts(detail.info);
  const description = detail.description ? decodeEntities(stripHtml(detail.description)) : '';
  const date = detail.date ? formatEventDate(detail.date, { monthsLong: t.journal.dateNames.monthsLong, am: list.am, pm: list.pm }, num) : '';
  const videos = detail.youtubeEmbeds
    .map((u) => u.match(/embed\/([^?/]+)/)?.[1])
    .filter((id): id is string => !!id);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileTopBar onBack={back} />

        {!!uri && (
          <View style={[styles.cover, { backgroundColor: colors.control, borderColor: colors.border }]}>
            <Image source={{ uri }} style={styles.fill} resizeMode="cover" />
          </View>
        )}

        <View style={styles.titleBlock}>
          {!!date && (
            <View style={styles.dateRow}>
              <Calendar size={16} color={colors.primary} strokeWidth={1.8} />
              <Text style={[styles.date, { color: colors.primary, fontFamily: fonts.medium }]}>{date}</Text>
            </View>
          )}
          <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {decodeEntities(detail.title)}
          </Text>
        </View>

        {facts.length > 0 && <FactGrid facts={facts} />}

        {!!description && (
          <SectionCard title={s.aboutEvent}>
            <BodyText>{description}</BodyText>
          </SectionCard>
        )}

        {videos.length > 0 && (
          <View style={styles.group}>
            <GroupLabel>{s.watch}</GroupLabel>
            {videos.map((id) => (
              <Pressable
                key={id}
                onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${id}`).catch(() => {})}
                accessibilityRole="link"
                accessibilityLabel={`${s.watch}: ${detail.title}`}
                style={({ pressed }) => [styles.video, { backgroundColor: colors.control, borderColor: colors.border }, pressed && styles.pressed]}
              >
                <Image source={{ uri: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }} style={styles.fill} resizeMode="cover" />
                <View style={styles.videoShade}>
                  <View style={[styles.play, { backgroundColor: colors.action }, shadows.glow]}>
                    <Play size={22} color={colors.onAction} fill={colors.onAction} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
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
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(5),
    gap: grid(3),
  },
  cover: {
    aspectRatio: 16 / 10,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  titleBlock: {
    gap: grid(1),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
  },
  date: {
    fontSize: 14,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleArabic: {
    lineHeight: 46,
  },
  group: {
    gap: grid(1.5),
  },
  video: {
    aspectRatio: 16 / 9,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  videoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: grid(7),
    height: grid(7),
    borderRadius: grid(3.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
