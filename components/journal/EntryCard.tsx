import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid, radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { MOOD_STYLE } from '@/constants/moods';
import { arabicNumber } from '@/lib/arabicNumerals';
import { formatEntryDateShort, type JournalEntry } from '@/lib/journal';
import MoodGlyph from '@/components/mood/MoodGlyph';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
}

/** A journal entry in the list: its mood's bloom, the date, the mood's name and the first lines. */
export default function EntryCard({ entry, onPress }: EntryCardProps) {
  const { colors } = useTheme();
  const { t, isRTL, fonts } = useLanguage();
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const dateLabel = formatEntryDateShort(entry.date, t.journal.dateNames, num);
  const snippet = entry.text.trim();
  const moodLabel = t.journal.moodLabelsFull[entry.mood];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dateLabel}, ${moodLabel}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <MoodGlyph mood={entry.mood} size={grid(5)} />
      <View style={styles.text}>
        <View style={styles.meta}>
          <Text style={[styles.mood, { color: MOOD_STYLE[entry.mood].color, fontFamily: fonts.semiBold }]}>{moodLabel}</Text>
          <Text style={[styles.date, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{dateLabel}</Text>
        </View>
        <Text
          numberOfLines={2}
          style={[
            styles.snippet,
            { color: snippet ? colors.textSecondary : colors.textTertiary, fontFamily: fonts.regular },
            !snippet && styles.snippetItalic,
          ]}
        >
          {snippet || t.journal.list.noText}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: grid(1.5),
    borderRadius: radius.card,
    borderWidth: 1,
    padding: grid(2),
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: grid(0.5),
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: grid(1),
  },
  mood: {
    fontSize: 15,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    lineHeight: 16,
  },
  snippet: {
    fontSize: 14,
    lineHeight: 20,
  },
  snippetItalic: {
    fontStyle: 'italic',
  },
});
