import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { alpha, grid } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { MOOD_STYLE } from '@/constants/moods';
import { MOOD_TAGS, currentMood, type MoodTag } from '@/lib/journal';
import MoodGlyph from '@/components/mood/MoodGlyph';

interface MoodPickerProps {
  value: MoodTag | null;
  onChange: (mood: MoodTag) => void;
  disabled?: boolean;
}

/**
 * The journal entry's mood: the seven check-in moods as chips, each with its
 * bloom and tinted in its own colour when chosen. An older entry holding a
 * retired mood shows the mood it now sits with (and keeps its own value
 * unless another is picked).
 */
export default function MoodPicker({ value, onChange, disabled }: MoodPickerProps) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const labels = t.journal.moodLabels;
  const shown = value ? currentMood(value) : null;

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {MOOD_TAGS.map((tag) => {
        const selected = shown === tag;
        const tint = MOOD_STYLE[tag].color;
        return (
          <Pressable
            key={tag}
            disabled={disabled}
            onPress={() => onChange(tag)}
            accessibilityRole="radio"
            aria-checked={selected}
            aria-disabled={!!disabled}
            style={({ pressed }) => [
              styles.chip,
              selected
                ? { backgroundColor: alpha(tint, 0.16), borderColor: tint }
                : { backgroundColor: colors.control, borderColor: colors.borderControl },
              disabled && !selected && styles.dimmed,
              pressed && styles.pressed,
            ]}
          >
            <MoodGlyph mood={tag} size={grid(2.5)} />
            <Text style={[styles.label, { color: selected ? colors.text : colors.textSecondary, fontFamily: fonts.medium }]}>
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
    gap: grid(1),
  },
  chip: {
    height: grid(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
    borderWidth: 1,
    borderRadius: 999,
    paddingStart: grid(1),
    paddingEnd: grid(2),
  },
  label: {
    fontSize: 14,
  },
  dimmed: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
