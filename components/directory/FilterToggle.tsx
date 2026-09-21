import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Search, ChevronDown } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography } from '@/constants/theme';

interface FilterToggleProps {
  label: string;
  activeCount: number;
  expanded: boolean;
  onPress: () => void;
}

export default function FilterToggle({ label, activeCount, expanded, onPress }: FilterToggleProps) {
  const { fonts, isRTL } = useLanguage();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggle,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && { backgroundColor: colors.cardPressed },
      ]}
    >
      <View style={styles.left}>
        <Search size={16} color={colors.primary} />
        <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fonts.regular, lineHeight: typography.lineHeight.sm }]}>{label}</Text>
        {activeCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {activeCount}
            </Text>
          </View>
        )}
      </View>
      <ChevronDown
        size={18}
        color={colors.textTertiary}
        style={[expanded && styles.flipped, isRTL && undefined]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
  },
  flipped: {
    transform: [{ rotate: '180deg' }],
  },
});
