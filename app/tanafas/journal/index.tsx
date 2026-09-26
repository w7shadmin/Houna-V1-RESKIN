import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid, layout, radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { MOOD_STYLE } from '@/constants/moods';
import { arabicNumber } from '@/lib/arabicNumerals';
import { loadEntries, exportAndShareJournal, formatEntryDateShort, MOOD_TAGS, type JournalEntry } from '@/lib/journal';
import EntryCard from '@/components/journal/EntryCard';
import MoodTrendChart from '@/components/journal/MoodTrendChart';
import MoodGlyph from '@/components/mood/MoodGlyph';
import MoodBloom, { HOME_BLOOM } from '@/components/mood/MoodBloom';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';
import { GroupLabel } from '@/components/directory/ProfileKit';

type JournalTab = 'entries' | 'insights';
type RangeKey = 7 | 30;

/**
 * The private journal (Tanafas): entries grouped by month, and Insights —
 * the mood trend with each day in its mood's colour. On-device only; the
 * export button shares a copy (a lost phone shouldn't mean a lost journal).
 */
export default function JournalHomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { tab: initialTab } = useLocalSearchParams<{ tab?: string }>();
  const { t, isRTL, fonts } = useLanguage();
  const list = t.journal.list;
  const insights = t.journal.insights;
  const names = t.journal.dateNames;

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
        .then((data) => !cancelled && setEntries(data))
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const num = useCallback((n: number) => (isRTL ? arabicNumber(n) : String(n)), [isRTL]);
  const moodEntries = useMemo(() => entries.filter((e) => e.mood), [entries]);
  const hasEnoughData = moodEntries.length >= 3;

  const dayLabelFor = useCallback(
    (d: Date) => names.weekdaysShort[d.getDay()],
    [names],
  );

  // Newest first, grouped under "September 2026"-style labels.
  const months = useMemo(() => {
    const groups: { key: string; label: string; items: JournalEntry[] }[] = [];
    for (const entry of entries) {
      const key = entry.date.slice(0, 7);
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        const [y, m] = key.split('-').map(Number);
        group = { key, label: `${names.monthsLong[m - 1]} ${num(y)}`, items: [] };
        groups.push(group);
      }
      group.items.push(entry);
    }
    return groups;
  }, [entries, names, num]);

  const selectedDay = useMemo(() => {
    if (!selectedDateStr) return null;
    return { dateStr: selectedDateStr, entry: moodEntries.find((e) => e.date === selectedDateStr) ?? null };
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

  const openEntry = (id: string) => router.push({ pathname: '/tanafas/journal/entry/[id]', params: { id } });
  const labelLatin = fonts.labelTracked;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <IconButton
            variant="control"
            accessibilityLabel={t.directory.common.goBack}
            onPress={() => router.back()}
            renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
          />
          <IconButton
            variant="control"
            accessibilityLabel={list.exportAction}
            onPress={handleExport}
            disabled={exporting || entries.length === 0}
            renderIcon={(c) => (exporting ? <ActivityIndicator size="small" color={c} /> : <Download size={20} color={c} strokeWidth={1.7} />)}
          />
        </View>

        <View style={styles.header}>
          <Text
            style={[
              labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
              { color: colors.primary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
            ]}
          >
            {tab === 'entries' ? list.badge : insights.badge}
          </Text>
          <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {tab === 'entries' ? list.title : insights.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
            {tab === 'entries' ? list.subtitle : insights.subtitle}
          </Text>
        </View>

        <View style={styles.chips} accessibilityRole="tablist">
          <Chip size="sm" label={list.tabEntries} selected={tab === 'entries'} onPress={() => setTab('entries')} />
          <Chip size="sm" label={list.tabInsights} selected={tab === 'insights'} onPress={() => setTab('insights')} />
        </View>

        {tab === 'entries' ? (
          <>
            <Button label={list.newEntry} onPress={() => openEntry('new')} block />

            {loading ? (
              <ActivityIndicator style={styles.loading} color={colors.primary} />
            ) : entries.length === 0 ? (
              <View style={[styles.card, styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MoodBloom size={grid(9)} color={colors.primary} shape={HOME_BLOOM} ringOpacity={0.5} />
                <Text style={[styles.emptyTitle, isRTL && styles.emptyTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
                  {list.emptyTitle}
                </Text>
                <Text style={[styles.emptyBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{list.emptyBody}</Text>
              </View>
            ) : (
              months.map((month) => (
                <View key={month.key} style={styles.group}>
                  <GroupLabel>{month.label}</GroupLabel>
                  {month.items.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onPress={() => openEntry(entry.id)} />
                  ))}
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <View style={styles.chips}>
              {([7, 30] as RangeKey[]).map((r) => (
                <Chip
                  key={r}
                  size="sm"
                  label={r === 7 ? insights.sevenDays : insights.thirtyDays}
                  selected={range === r}
                  onPress={() => {
                    setRange(r);
                    setSelectedDateStr(null);
                  }}
                />
              ))}
            </View>

            {!hasEnoughData ? (
              <View style={[styles.card, styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MoodGlyph mood="neutral" size={grid(7)} />
                <Text style={[styles.emptyBody, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
                  {insights.placeholder(Math.max(0, 3 - moodEntries.length))}
                </Text>
              </View>
            ) : (
              <>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                      <MoodGlyph mood={tag} size={grid(2)} />
                      <Text style={[styles.legendText, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
                        {t.journal.moodLabelsFull[tag]}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.hint, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{insights.tapHint}</Text>

                {selectedDay && (
                  <View style={[styles.card, styles.day, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.dayDate, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
                      {formatEntryDateShort(selectedDay.dateStr, names, num)}
                    </Text>
                    {selectedDay.entry ? (
                      <>
                        <View style={styles.dayMood}>
                          <MoodGlyph mood={selectedDay.entry.mood} size={grid(3)} />
                          <Text style={[styles.dayMoodLabel, { color: MOOD_STYLE[selectedDay.entry.mood].color, fontFamily: fonts.semiBold }]}>
                            {t.journal.moodLabelsFull[selectedDay.entry.mood]}
                          </Text>
                        </View>
                        {!!selectedDay.entry.text.trim() && (
                          <Text numberOfLines={3} style={[styles.dayText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                            {selectedDay.entry.text.trim()}
                          </Text>
                        )}
                        <Pressable
                          onPress={() => openEntry(selectedDay.entry!.id)}
                          accessibilityRole="link"
                          style={({ pressed }) => [styles.viewEntry, pressed && styles.pressed]}
                        >
                          <Text style={[styles.viewEntryText, { color: colors.primary, fontFamily: fonts.medium }]}>{insights.viewEntry}</Text>
                          <DirectionalIcon isRTL={isRTL} name="chevron" size={14} strokeWidth={2} color={colors.primary} />
                        </Pressable>
                      </>
                    ) : (
                      <Text style={[styles.dayText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{insights.noEntry}</Text>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(5),
    gap: grid(2),
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: {
    gap: grid(1),
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
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
  },
  chips: {
    flexDirection: 'row',
    gap: grid(1),
  },
  loading: {
    marginTop: grid(4),
  },
  card: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    padding: grid(2),
  },
  empty: {
    alignItems: 'center',
    gap: grid(1.5),
    paddingVertical: grid(4),
    paddingHorizontal: grid(3),
  },
  emptyTitle: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  emptyTitleArabic: {
    lineHeight: 36,
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 300,
  },
  group: {
    gap: grid(1.5),
    marginTop: grid(1),
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: grid(1.5),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(0.5),
  },
  legendText: {
    fontSize: 13,
  },
  hint: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  day: {
    gap: grid(1),
  },
  dayDate: {
    fontSize: 13,
  },
  dayMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
  },
  dayMoodLabel: {
    fontSize: 16,
  },
  dayText: {
    fontSize: 15,
    lineHeight: 24,
  },
  viewEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(0.5),
  },
  viewEntryText: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.6,
  },
});
