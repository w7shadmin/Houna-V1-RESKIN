import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, BookOpen, TrendingUp, Calendar, Download, ChevronLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import {
  loadEntries,
  exportAndShareJournal,
  formatEntryDateShort,
  MOOD_TAGS,
  MOOD_EMOJI,
  MOOD_COLORS,
  type JournalEntry,
} from '@/lib/journal';
import EntryCard from '@/components/journal/EntryCard';
import MoodTrendChart from '@/components/journal/MoodTrendChart';

type JournalTab = 'entries' | 'insights';
type RangeKey = 7 | 30;

export default function JournalHomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const { t, isRTL, fonts } = useLanguage();
  const list = t.journal.list;
  const insights = t.journal.insights;

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<JournalTab>(initialTab === 'insights' ? 'insights' : 'entries');
  const [range, setRange] = useState<RangeKey>(7);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadEntries()
        .then((data) => {
          if (!cancelled) setEntries(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const moodEntries = useMemo(() => entries.filter((e) => e.mood), [entries]);
  const hasEnoughData = moodEntries.length >= 3;

  const dayLabelFor = useCallback(
    (d: Date) => {
      const short = formatEntryDateShort(formatDateKey(d), t.journal.dateNames, num);
      return short.split(',')[0];
    },
    [t.journal.dateNames, isRTL],
  );

  const selectedDay = useMemo(() => {
    if (!selectedDateStr) return null;
    const entry = moodEntries.find((e) => e.date === selectedDateStr) ?? null;
    return { dateStr: selectedDateStr, entry };
  }, [selectedDateStr, moodEntries]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAndShareJournal();
    } catch {
      Alert.alert(list.exportError);
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { backgroundColor: colors.cardPressed },
          ]}
        >
          <ArrowLeft size={18} color={colors.text} style={isRTL ? styles.flip : undefined} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleExport}
          disabled={exporting || entries.length === 0}
          hitSlop={12}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            entries.length === 0 && styles.iconBtnDisabled,
            pressed && { backgroundColor: colors.cardPressed },
          ]}
          accessibilityLabel={list.exportAction}
        >
          {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Download size={18} color={colors.text} />}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, { backgroundColor: colors.primaryLightest }]}>
          {tab === 'entries' ? (
            <BookOpen size={13} color={colors.primary} />
          ) : (
            <TrendingUp size={13} color={colors.primary} />
          )}
          <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            {tab === 'entries' ? list.badge : insights.badge}
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>
          {tab === 'entries' ? list.title : insights.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
          {tab === 'entries' ? list.subtitle : insights.subtitle}
        </Text>

        <View style={[styles.tabRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable
            onPress={() => setTab('entries')}
            style={({ pressed }) => [
              styles.tabBtn,
              tab === 'entries' && { backgroundColor: colors.primary },
              pressed && (tab === 'entries' ? { opacity: 0.85 } : { backgroundColor: colors.cardPressed }),
            ]}
          >
            <BookOpen size={15} color={tab === 'entries' ? colors.onPrimary : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                { color: tab === 'entries' ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold },
              ]}
            >
              {list.tabEntries}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('insights')}
            style={({ pressed }) => [
              styles.tabBtn,
              tab === 'insights' && { backgroundColor: colors.primary },
              pressed && (tab === 'insights' ? { opacity: 0.85 } : { backgroundColor: colors.cardPressed }),
            ]}
          >
            <TrendingUp size={15} color={tab === 'insights' ? colors.onPrimary : colors.textSecondary} />
            <Text
              style={[
                styles.tabText,
                { color: tab === 'insights' ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold },
              ]}
            >
              {list.tabInsights}
            </Text>
          </Pressable>
        </View>

        {tab === 'entries' ? (
          <>
            <Pressable
              onPress={() => router.push({ pathname: '/tanafas/journal/entry/[id]', params: { id: 'new' } })}
              style={({ pressed }) => [
                styles.newBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Plus size={20} color={colors.onPrimary} />
              <Text style={[styles.newBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
                {list.newEntry}
              </Text>
            </Pressable>

            {loading ? (
              <ActivityIndicator style={styles.loading} color={colors.primary} />
            ) : entries.length === 0 ? (
              <View style={styles.empty}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLightest }]}>
                  <BookOpen size={36} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                  {list.emptyTitle}
                </Text>
                <Text style={[styles.emptyBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                  {list.emptyBody}
                </Text>
              </View>
            ) : (
              <View style={styles.entries}>
                {entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onPress={() => router.push({ pathname: '/tanafas/journal/entry/[id]', params: { id: entry.id } })}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={[styles.rangeRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
              {([7, 30] as RangeKey[]).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => {
                    setRange(r);
                    setSelectedDateStr(null);
                  }}
                  style={({ pressed }) => [
                    styles.rangeBtn,
                    range === r && { backgroundColor: colors.primary },
                    pressed && (range === r ? { opacity: 0.85 } : { backgroundColor: colors.cardPressed }),
                  ]}
                >
                  <Text
                    style={[
                      styles.rangeText,
                      { color: range === r ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold },
                    ]}
                  >
                    {r === 7 ? insights.sevenDays : insights.thirtyDays}
                  </Text>
                </Pressable>
              ))}
            </View>

            {!hasEnoughData ? (
              <View style={[styles.placeholderCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.primaryLightest }]}>
                  <Calendar size={32} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.placeholderText, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
                  {insights.placeholder(Math.max(0, 3 - moodEntries.length))}
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.chartCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <MoodTrendChart
                    moodEntries={moodEntries}
                    range={range}
                    dayLabelFor={dayLabelFor}
                    selectedDateStr={selectedDateStr}
                    onSelectDate={setSelectedDateStr}
                  />
                </View>

                <View style={styles.legend}>
                  {MOOD_TAGS.map((tag) => (
                    <View key={tag} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: MOOD_COLORS[tag] }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
                        {MOOD_EMOJI[tag]} {t.journal.moodLabelsFull[tag]}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.tapHint, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                  {insights.tapHint}
                </Text>

                {selectedDay && (
                  <View style={[styles.dayCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <View style={styles.dayCardHeader}>
                      <Text style={[styles.dayCardDate, { color: colors.text, fontFamily: fonts.bold }]}>
                        {formatEntryDateShort(selectedDay.dateStr, t.journal.dateNames, num)}
                      </Text>
                      {selectedDay.entry ? (
                        <View style={styles.dayCardMood}>
                          <Text style={styles.dayCardMoodEmoji}>{MOOD_EMOJI[selectedDay.entry.mood]}</Text>
                          <Text
                            style={[
                              styles.dayCardMoodLabel,
                              { color: MOOD_COLORS[selectedDay.entry.mood], fontFamily: fonts.semiBold },
                            ]}
                          >
                            {t.journal.moodLabelsFull[selectedDay.entry.mood]}
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.dayCardNoEntry, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                          {insights.noEntry}
                        </Text>
                      )}
                    </View>
                    {selectedDay.entry && (
                      <>
                        <Text
                          numberOfLines={3}
                          style={[styles.dayCardText, { color: colors.textSecondary, fontFamily: fonts.regular }]}
                        >
                          {selectedDay.entry.text.trim() || insights.noEntry}
                        </Text>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/tanafas/journal/entry/[id]',
                              params: { id: selectedDay.entry!.id },
                            })
                          }
                          style={({ pressed }) => [styles.viewEntryBtn, pressed && { opacity: 0.6 }]}
                        >
                          <Text style={[styles.viewEntryText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                            {insights.viewEntry}
                          </Text>
                          <ChevronLeft
                            size={14}
                            color={colors.primary}
                            style={!isRTL ? styles.flip : undefined}
                          />
                        </Pressable>
                      </>
                    )}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDisabled: {
    opacity: 0.5,
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    gap: spacing.xs + 2,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.fontSize.xl,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.full,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  newBtn: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  newBtnText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  loading: {
    marginTop: spacing.xxl,
  },
  entries: {
    gap: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.fontSize.md,
  },
  emptyBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280,
  },
  rangeRow: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.md,
  },
  rangeBtn: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
  },
  rangeText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  placeholderCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  placeholderText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
    maxWidth: 260,
  },
  chartCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  legendText: {
    fontSize: typography.fontSize.xs,
  },
  tapHint: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  dayCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCardDate: {
    fontSize: typography.fontSize.sm,
  },
  dayCardMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayCardMoodEmoji: {
    fontSize: typography.fontSize.md,
  },
  dayCardMoodLabel: {
    fontSize: typography.fontSize.sm,
  },
  dayCardNoEntry: {
    fontSize: typography.fontSize.xs,
  },
  dayCardText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    marginTop: spacing.sm,
  },
  viewEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm + 2,
  },
  viewEntryText: {
    fontSize: typography.fontSize.sm,
  },
});
