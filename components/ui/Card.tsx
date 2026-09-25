import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  /**
   * `row` — list card (20 radius, 14 padding), e.g. a directory entry with
   * an icon tile. `feature` — a standalone section card (24 radius), e.g.
   * Home's community card.
   */
  variant?: 'row' | 'feature';
  style?: StyleProp<ViewStyle>;
}

/**
 * Card from the Nightlight/Daylight sheets: a faint Moonlight wash (Night)
 * or Paper (Day) with a hairline border and no shadow. Pressable cards dim
 * the whole card via opacity — CLAUDE.md's pressed-state convention.
 */
export default function Card({ children, onPress, accessibilityLabel, variant = 'row', style }: CardProps) {
  const { colors } = useTheme();
  const base = [
    styles.base,
    variant === 'feature' ? styles.feature : styles.row,
    { backgroundColor: colors.card, borderColor: colors.border },
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
  },
  row: {
    borderRadius: radius.card,
    padding: 14,
  },
  feature: {
    borderRadius: radius.cardLg,
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
