import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography } from '@/constants/theme';

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipFilterProps {
  label: string;
  options: readonly ChipOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Single-select horizontal chip row — RN's stand-in for the old MVP's <select>. */
export default function ChipFilter({ label, options, value, onChange }: ChipFilterProps) {
  const { fonts } = useLanguage();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textTertiary, fontFamily: fonts.semiBold }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                },
                pressed && !active && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold, lineHeight: typography.lineHeight.xs },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  row: {
    gap: spacing.xs,
  },
  chip: {
    height: 28,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: typography.fontSize.xs,
  },
});
