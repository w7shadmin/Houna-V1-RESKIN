import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { MOOD_TAGS, MOOD_EMOJI, type MoodTag } from '@/lib/journal';

interface MoodPickerProps {
  value: MoodTag | null;
  onChange: (mood: MoodTag) => void;
  disabled?: boolean;
}

export default function MoodPicker({ value, onChange, disabled }: MoodPickerProps) {
  const { t, fonts } = useLanguage();
  const labels = t.journal.moodLabels;

  return (
    <View style={styles.row}>
      {MOOD_TAGS.map((tag) => {
        const selected = value === tag;
        return (
          <Pressable
            key={tag}
            disabled={disabled}
            onPress={() => onChange(tag)}
            style={({ pressed }) => [
              styles.chip,
              { borderColor: colors.border, backgroundColor: colors.card },
              selected && { borderColor: colors.primary, backgroundColor: colors.primaryLightest },
              pressed && { backgroundColor: colors.cardPressed },
            ]}
          >
            <Text style={styles.emoji}>{MOOD_EMOJI[tag]}</Text>
            <Text
              style={[
                styles.label,
                { color: selected ? colors.primary : colors.textSecondary, fontFamily: fonts.medium },
              ]}
            >
              {labels[tag]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 6,
  },
  emoji: {
    fontSize: typography.fontSize.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
