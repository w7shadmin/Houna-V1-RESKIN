import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, typography } from '@/constants/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Filter chip from the Nightlight/Daylight sheets: 40px pill. Latin labels
 * are tracked DM Mono caps; Arabic uses IBM Plex Sans Arabic untracked
 * (Arabic has no case and tracking breaks its joins).
 */
export default function Chip({ label, selected = false, onPress, style }: ChipProps) {
  const { fonts } = useLanguage();
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-selected={selected}
      style={({ pressed }) => [
        styles.base,
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
            ? { letterSpacing: typography.chip.letterSpacing, textTransform: 'uppercase' }
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
    paddingHorizontal: 18,
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
});
