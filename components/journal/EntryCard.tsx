import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import { MOOD_EMOJI, formatEntryDateShort, type JournalEntry } from '@/lib/journal';

interface EntryCardProps {
  entry: JournalEntry;
  onPress: () => void;
}

export default function EntryCard({ entry, onPress }: EntryCardProps) {
  const { t, isRTL, fonts } = useLanguage();
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const dateLabel = formatEntryDateShort(entry.date, t.journal.dateNames, num);
  const snippet = entry.text.trim();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.emoji}>{MOOD_EMOJI[entry.mood]}</Text>
      <View style={styles.text}>
        <Text style={[styles.date, { color: colors.text, fontFamily: fonts.semiBold }]}>{dateLabel}</Text>
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
    gap: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 4,
  },
  pressed: {
    opacity: 0.85,
  },
  emoji: {
    fontSize: 22,
    marginTop: 1,
  },
  text: {
    flex: 1,
  },
  date: {
    fontSize: typography.fontSize.sm,
  },
  snippet: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginTop: 2,
  },
  snippetItalic: {
    fontStyle: 'italic',
  },
});
