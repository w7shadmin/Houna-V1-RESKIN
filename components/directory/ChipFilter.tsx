import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import Chip from '@/components/ui/Chip';
import Label from '@/components/ui/Label';

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
  return (
    <View style={styles.wrap}>
      <Label style={styles.label}>{label}</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {options.map((opt) => (
          <Chip
            key={opt.value}
            label={opt.label}
            selected={opt.value === value}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  label: {
    marginBottom: spacing.sm,
  },
  row: {
    gap: spacing.sm,
  },
});
