import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Defaults to true — the small stat-tile screens that omit it are the exception, not the rule. */
  shadow?: boolean;
  /** Content density: 'md' (24px, default) for standalone cards, 'sm' (12px) for list rows. */
  padding?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared card primitive, codifying the bordered-white-surface pattern used
 * almost everywhere content needs grouping (journal entries, directory list
 * items, stat tiles, mood card). New screens should use this instead of
 * hand-rolling another copy; existing screens aren't migrated as part of
 * introducing it.
 */
export default function Card({ children, onPress, shadow = true, padding = 'md', style }: CardProps) {
  const base = [
    styles.base,
    { backgroundColor: colors.card, borderColor: colors.border, padding: padding === 'sm' ? spacing.sm + 4 : spacing.lg },
    shadow && shadows.card,
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { backgroundColor: colors.cardPressed }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: radius.lg,
  },
});
