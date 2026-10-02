import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import DetailScreen from '@/components/DetailScreen';
import Button from '@/components/ui/Button';
import YouTubePlayer from '@/components/ui/YouTubePlayer';
import { liveTime } from '@/components/events/LiveBanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';
import { useLiveEvent } from '@/hooks/useLiveEvent';
import { openInApp } from '@/lib/inAppBrowser';

/**
 * A Houna event streamed live on YouTube (app_config.live_event), played inside the app: YouTube's
 * own waiting screen and countdown before it starts, the stream while it's on. The chat isn't part
 * of YouTube's embedded player, so it's one tap away on YouTube. Opened from Home's or Events'
 * banner, or a "We're live" notification (`/live`).
 */
export default function LiveScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const s = t.events.live;
  const { event, state } = useLiveEvent();

  if (!event || !state) {
    return (
      <DetailScreen title={s.title}>
        <Text style={[styles.none, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.none}</Text>
        <Button variant="secondary" label={t.events.list.title} onPress={() => router.replace('/events')} />
      </DetailScreen>
    );
  }

  const title = isRTL ? event.titleAr : event.titleEn;
  const status = state === 'live' ? s.now : s.soon.replace('{time}', liveTime(event.startsAt, isRTL, t.events.list.am, t.events.list.pm));

  return (
    <DetailScreen title={s.title}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.video, { backgroundColor: '#000', borderColor: colors.border }]}>
          <YouTubePlayer id={event.videoId} title={title} />
        </View>
        <View style={styles.text}>
          <Text
            style={[fonts.labelTracked ? styles.statusLatin : styles.statusArabic, { color: colors.tones.dawn.text, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.semiBold }]}
            accessibilityLiveRegion="polite"
          >
            {status}
          </Text>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
        </View>
        <View style={styles.actions}>
          {event.eventSlug && (
            <Button variant="secondary" label={s.aboutEvent} onPress={() => router.push(`/events/${encodeURIComponent(event.eventSlug!)}`)} block />
          )}
          <Button
            variant="secondary"
            label={s.chat}
            onPress={() => openInApp(`https://www.youtube.com/watch?v=${event.videoId}`, colors.background)}
            block
          />
        </View>
      </ScrollView>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: grid(4),
    gap: grid(3),
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  text: {
    gap: grid(1),
  },
  statusLatin: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  statusArabic: {
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  actions: {
    gap: grid(1.5),
  },
  none: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: grid(2),
  },
});
