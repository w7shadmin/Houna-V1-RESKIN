import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Video, CheckCircle2, Clock, ChevronRight, ArrowUpDown, Mic } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchEvents, fetchSpeakers, resolveImageUrl, type EventItem, type Speaker } from '@/lib/hounaApi';
import { LoadingState, ErrorState, InlineError } from '@/components/directory/AsyncState';

type EventFilter = 'all' | 'upcoming' | 'virtual' | 'past';

function parseEventDate(dateStr: string): number {
  const m = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime();
  return 0;
}

export default function EventsListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.events.list;
  const common = t.directory.common;

  const [events, setEvents] = useState<EventItem[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventFilter>('all');
  const [sortByNewest, setSortByNewest] = useState(true);

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

  const filteredEvents = useMemo(() => {
    let result = events;
    if (filter === 'upcoming') result = result.filter((e) => e.status === 'upcoming');
    else if (filter === 'virtual') result = result.filter((e) => e.isVirtual);
    else if (filter === 'past') result = result.filter((e) => e.status === 'ended');

    return [...result].sort((a, b) => {
      const da = parseEventDate(a.date);
      const db = parseEventDate(b.date);
      return sortByNewest ? db - da : da - db;
    });
  }, [events, filter, sortByNewest]);

  const filterTabs: { key: EventFilter; label: string }[] = [
    { key: 'all', label: s.all },
    { key: 'upcoming', label: s.upcoming },
    { key: 'virtual', label: s.virtual },
    { key: 'past', label: s.past },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {loading && events.length === 0 ? (
        <LoadingState label={s.loading} />
      ) : error && events.length === 0 ? (
        <ErrorState message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.headerRow}>
            <Calendar size={22} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{s.title}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {filterTabs.map((tab) => {
              const active = tab.key === filter;
              return (
                <Pressable
                  key={tab.key}
                  onPress={() => setFilter(tab.key)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                    pressed && !active && { backgroundColor: colors.cardPressed },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: active ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold, lineHeight: typography.lineHeight.xs },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={() => setSortByNewest((v) => !v)}
            style={({ pressed }) => [styles.sortRow, pressed && { opacity: 0.6 }]}
          >
            <ArrowUpDown size={13} color={colors.textTertiary} />
            <Text style={[styles.sortText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {sortByNewest ? s.sortNewest : s.sortOldest}
            </Text>
          </Pressable>

          <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
            {filteredEvents.length} {filteredEvents.length === 1 ? s.countOne : s.countOther}
          </Text>

          <View style={styles.eventList}>
            {filteredEvents.map((event, i) => (
              <Pressable
                key={`${event.slug}-${i}`}
                onPress={() => router.push({ pathname: '/events/[slug]', params: { slug: event.slug } })}
                style={({ pressed }) => [
                  styles.eventCard,
                  { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                  pressed && styles.pressed,
                ]}
              >
                {!!resolveImageUrl(event.imageUrl) && (
                  <View style={styles.eventImageWrap}>
                    <Image source={{ uri: resolveImageUrl(event.imageUrl)! }} style={styles.eventImage} resizeMode="cover" />
                    <View style={[styles.badgeRow, { end: spacing.sm }]}>
                      {event.isVirtual && (
                        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                          <Video size={10} color={colors.onPrimary} />
                          <Text style={[styles.badgeText, { color: colors.onPrimary, fontFamily: fonts.bold, lineHeight: 12 }]}>
                            {s.virtual}
                          </Text>
                        </View>
                      )}
                      {event.status === 'ended' ? (
                        <View style={[styles.badge, { backgroundColor: colors.textSecondary }]}>
                          <CheckCircle2 size={10} color={colors.onPrimary} />
                          <Text style={[styles.badgeText, { color: colors.onPrimary, fontFamily: fonts.bold, lineHeight: 12 }]}>
                            {s.past}
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                          <Clock size={10} color={colors.onPrimary} />
                          <Text style={[styles.badgeText, { color: colors.onPrimary, fontFamily: fonts.bold, lineHeight: 12 }]}>
                            {s.upcoming}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                <View style={styles.eventBody}>
                  <Text numberOfLines={2} style={[styles.eventTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                    {event.title}
                  </Text>
                  {!!event.date && (
                    <View style={styles.eventDateRow}>
                      <Calendar size={13} color={colors.primary} />
                      <Text style={[styles.eventDate, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                        {event.date}
                      </Text>
                    </View>
                  )}
                  {!!event.description && (
                    <Text
                      numberOfLines={2}
                      style={[styles.eventDesc, { color: colors.textTertiary, fontFamily: fonts.regular }]}
                    >
                      {event.description}
                    </Text>
                  )}
                  <View style={styles.readMoreRow}>
                    <Text style={[styles.readMoreText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                      {s.readMore}
                    </Text>
                    <View style={isRTL ? styles.flip : undefined}>
<ChevronRight size={14} color={colors.primary} />
</View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {filteredEvents.length === 0 && !loading && (
            <Text style={[styles.empty, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {s.noEvents}
            </Text>
          )}

          {speakers.length > 0 && (
            <View style={styles.speakersSection}>
              <View style={styles.speakersHeaderRow}>
                <Mic size={20} color={colors.primary} />
                <Text style={[styles.speakersTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                  {s.speakers}
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.speakersRow}>
                {speakers.map((speaker, i) => (
                  <Pressable
                    key={`${speaker.slug}-${i}`}
                    onPress={() => router.push({ pathname: '/events/speakers/[slug]', params: { slug: speaker.slug } })}
                    style={({ pressed }) => [
                      styles.speakerCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      pressed && { backgroundColor: colors.cardPressed },
                    ]}
                  >
                    <View style={[styles.speakerAvatar, { backgroundColor: colors.surface }]}>
                      {!!resolveImageUrl(speaker.imageUrl) && (
                        <Image source={{ uri: resolveImageUrl(speaker.imageUrl)! }} style={styles.speakerAvatarImg} resizeMode="cover" />
                      )}
                    </View>
                    <Text
                      numberOfLines={2}
                      style={[styles.speakerName, { color: colors.text, fontFamily: fonts.bold }]}
                    >
                      {speaker.name}
                    </Text>
                    {!!speaker.role && (
                      <Text
                        numberOfLines={2}
                        style={[styles.speakerRole, { color: colors.textTertiary, fontFamily: fonts.regular }]}
                      >
                        {speaker.role}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {!!(error && events.length > 0) && (
            <InlineError message={error} retryLabel={common.tryAgain} onRetry={handleRetry} />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
  },
  filterRow: {
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    height: 28,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: typography.fontSize.xs,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  sortText: {
    fontSize: typography.fontSize.xs,
  },
  count: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  eventList: {
    gap: spacing.sm,
  },
  eventCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  eventImageWrap: {
    height: 128,
    backgroundColor: '#00000010',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: spacing.sm,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: radius.full,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  eventBody: {
    padding: spacing.sm + 4,
  },
  eventTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  eventDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  eventDate: {
    fontSize: typography.fontSize.xs,
  },
  eventDesc: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    marginTop: 4,
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    marginTop: spacing.xs,
  },
  readMoreText: {
    fontSize: typography.fontSize.xs,
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  empty: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    paddingVertical: spacing.xxl,
  },
  speakersSection: {
    marginTop: spacing.xl,
  },
  speakersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  speakersTitle: {
    fontSize: typography.fontSize.md,
  },
  speakersRow: {
    gap: spacing.sm,
  },
  speakerCard: {
    width: 128,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 4,
  },
  speakerAvatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  speakerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  speakerName: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  speakerRole: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
});
