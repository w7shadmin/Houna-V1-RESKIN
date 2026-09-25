import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, typography } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  /** `sm` — the 36px filter chips on the search screen. */
  size?: 'md' | 'sm';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Filter chip from the Nightlight/Daylight sheets: 40px pill. Latin labels
 * are tracked DM Mono caps; Arabic uses IBM Plex Sans Arabic untracked
 * (Arabic has no case and tracking breaks its joins).
 */
export default function Chip({ label, selected = false, size = 'md', onPress, style }: ChipProps) {
  const { fonts } = useLanguage();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={selected}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.baseSm,
        selected
          ? { backgroundColor: colors.action, borderColor: colors.action }
          : { backgroundColor: pressed ? colors.cardPressed : colors.control, borderColor: colors.borderControl },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: selected ? colors.onAction : colors.text,
            fontFamily: selected ? fonts.label : fonts.labelRegular,
          },
          fonts.labelTracked
            ? size === 'sm'
              ? styles.labelLatinSm
              : { letterSpacing: typography.chip.letterSpacing, textTransform: 'uppercase' }
            : size === 'sm'
              ? styles.labelArabicSm
              : styles.labelArabic,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.chip.fontSize,
  },
  labelArabic: {
    fontSize: 14,
  },
  baseSm: {
    height: 36,
    paddingHorizontal: 12,
  },
  labelLatinSm: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.1,
    textTransform: 'uppercase',
  },
  labelArabicSm: {
    fontSize: 13,
  },
});
