import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowUpDown, Calendar } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout, radius } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { eventTime, formatEventDate } from '@/lib/eventDate';
import { decodeEntities } from '@/lib/directoryProfile';
import { fetchEvents, fetchSpeakers, resolveImageUrl, type EventItem, type Speaker } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';
import { GroupLabel } from '@/components/directory/ProfileKit';
import { EventPills, tidyRole } from '@/components/events/EventPills';
import Chip from '@/components/ui/Chip';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';

type EventFilter = 'all' | 'upcoming' | 'virtual' | 'past';

/**
 * Events tab, drawn like the Directory hub: eyebrow + display title, the
 * app's chips for filtering, event cards with the image on top and status
 * pills, then a row of speakers.
 */
export default function EventsListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.events.list;
  const common = t.directory.common;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [events, setEvents] = useState<EventItem[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventFilter>('all');
  const [newestFirst, setNewestFirst] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, speakersData] = await Promise.all([fetchEvents(language), fetchSpeakers(language)]);
      setEvents(eventsData.events);
      setSpeakers(speakersData.speakers);
    } catch (err) {
      setError(err instanceof Error ? err.message : s.error);
    } finally {
      setLoading(false);
    }
  }, [language, s.error]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRetry = () => {
    setEvents([]);
    setSpeakers([]);
    load();
  };

  const shown = useMemo(() => {
    let result = events;
    if (filter === 'upcoming') result = result.filter((e) => e.status === 'upcoming');
    else if (filter === 'virtual') result = result.filter((e) => e.isVirtual);
    else if (filter === 'past') result = result.filter((e) => e.status === 'ended');
    return [...result].sort((a, b) => (newestFirst ? eventTime(b.date) - eventTime(a.date) : eventTime(a.date) - eventTime(b.date)));
  }, [events, filter, newestFirst]);

  const filters: { key: EventFilter; label: string }[] = [
    { key: 'all', label: s.all },
    { key: 'upcoming', label: s.upcoming },
    { key: 'virtual', label: s.virtual },
    { key: 'past', label: s.past },
  ];

  const labelLatin = fonts.labelTracked;
  const header = (
    <View style={styles.header}>
      <Text
        style={[
          labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
          { color: colors.primary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
        ]}
      >
        {s.eyebrow}
      </Text>
      <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
        {s.title}
      </Text>
      <Text style={[styles.intro, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.intro}</Text>
    </View>
  );

  if ((loading || error) && events.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.stateWrap}>
          {header}
          {loading ? <LoadingState label={s.loading} /> : <ErrorState message={error!} retryLabel={common.tryAgain} onRetry={handleRetry} />}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {header}

        <View style={styles.controls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={styles.chips}>
            {filters.map((f) => (
              <Chip key={f.key} size="sm" label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
            ))}
          </ScrollView>
          <View style={styles.metaRow}>
            <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
              {arabicPlural(shown.length, s.count).replace('{n}', num(shown.length))}
            </Text>
            <Pressable
              onPress={() => setNewestFirst((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={s.sort}
              hitSlop={8}
              style={({ pressed }) => [styles.sort, pressed && styles.pressed]}
            >
              <ArrowUpDown size={14} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={[styles.sortText, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
                {newestFirst ? s.sortNewest : s.sortOldest}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.list}>
          {shown.map((event, i) => (
            <EventCard
              key={`${event.slug}-${i}`}
              event={event}
              onPress={() => router.push({ pathname: '/events/[slug]', params: { slug: event.slug } })}
            />
          ))}
          {shown.length === 0 && (
            <Text style={[styles.empty, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.noEvents}</Text>
          )}
        </View>

        {speakers.length > 0 && (
          <View style={styles.speakers}>
            <GroupLabel>{s.speakers}</GroupLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.speakerRow}>
              {speakers.map((speaker, i) => (
                <SpeakerCard
                  key={`${speaker.slug}-${i}`}
                  speaker={speaker}
                  onPress={() => router.push({ pathname: '/events/speakers/[slug]', params: { slug: speaker.slug } })}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {!!(error && events.length > 0) && <InlineError message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function EventCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const s = t.events.list;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const uri = resolveImageUrl(event.imageUrl);
  const date = event.date
    ? formatEventDate(event.date, { monthsLong: t.journal.dateNames.monthsLong, am: s.am, pm: s.pm }, num)
    : '';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={event.title}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressedCard]}
    >
      <View style={[styles.cardImage, { backgroundColor: colors.control }]}>
        {!!uri && <Image source={{ uri }} style={styles.fill} resizeMode="cover" />}
        <View style={styles.cardPills}>
          <EventPills event={event} />
        </View>
      </View>
      <View style={styles.cardBody}>
        {!!date && (
          <View style={styles.dateRow}>
            <Calendar size={14} color={colors.primary} strokeWidth={1.8} />
            <Text style={[styles.date, { color: colors.primary, fontFamily: fonts.medium }]}>{date}</Text>
          </View>
        )}
        <Text numberOfLines={2} style={[styles.cardTitle, isRTL && styles.cardTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
          {decodeEntities(event.title)}
        </Text>
        {!!event.description && (
          <Text numberOfLines={2} style={[styles.cardDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
            {decodeEntities(event.description)}
          </Text>
        )}
        <View style={styles.readMore}>
          <Text style={[styles.readMoreText, { color: colors.primary, fontFamily: fonts.medium }]}>{s.readMore}</Text>
          <DirectionalIcon isRTL={isRTL} name="chevron" size={14} strokeWidth={2} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

function SpeakerCard({ speaker, onPress }: { speaker: Speaker; onPress: () => void }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const uri = resolveImageUrl(speaker.imageUrl);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={speaker.name}
      style={({ pressed }) => [styles.speaker, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressedCard]}
    >
      <View style={[styles.speakerRing, { borderColor: colors.tones.glow.border }]}>
        <View style={[styles.speakerAvatar, { backgroundColor: colors.control }]}>
          {!!uri && <Image source={{ uri }} style={styles.fill} resizeMode="cover" />}
        </View>
      </View>
      <Text numberOfLines={2} style={[styles.speakerName, { color: colors.text, fontFamily: fonts.semiBold }]}>
        {decodeEntities(speaker.name)}
      </Text>
      {!!speaker.role && (
        <Text numberOfLines={2} style={[styles.speakerRole, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
          {tidyRole(speaker.role)}
        </Text>
      )}
    </Pressable>
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
  header: {
    gap: grid(1),
    paddingTop: grid(1),
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13.5,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  titleArabic: {
    lineHeight: 48,
  },
  intro: {
    fontSize: 15,
    lineHeight: 24,
  },
  controls: {
    gap: grid(1.5),
  },
  chips: {
    gap: grid(1),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    fontSize: 13,
    lineHeight: 16,
  },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(0.5),
  },
  sortText: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.6,
  },
  pressedCard: {
    opacity: 0.85,
  },
  list: {
    gap: grid(2),
  },
  card: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    height: grid(20),
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  cardPills: {
    position: 'absolute',
    top: grid(1.5),
    start: grid(1.5),
  },
  cardBody: {
    padding: grid(2),
    gap: grid(1),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
  },
  date: {
    fontSize: 13,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  cardTitleArabic: {
    lineHeight: 34,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(0.5),
  },
  readMoreText: {
    fontSize: 13,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: grid(6),
  },
  speakers: {
    gap: grid(1.5),
  },
  speakerRow: {
    gap: grid(1.5),
  },
  speaker: {
    width: grid(17),
    alignItems: 'center',
    gap: grid(1),
    padding: grid(2),
    borderRadius: radius.card,
    borderWidth: 1,
  },
  speakerRing: {
    padding: grid(0.5),
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  speakerAvatar: {
    width: grid(9),
    height: grid(9),
    borderRadius: 999,
    overflow: 'hidden',
  },
  speakerName: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  speakerRole: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
