import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronDown, SlidersHorizontal } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';

interface FilterToggleProps {
  label: string;
  activeCount: number;
  expanded: boolean;
  onPress: () => void;
}

/** Pill that opens a list's filter panel, in the search bar's control style. */
export default function FilterToggle({ label, activeCount, expanded, onPress }: FilterToggleProps) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-expanded={expanded}
      style={({ pressed }) => [
        styles.toggle,
        {
          backgroundColor: colors.controlStrong,
          borderColor: expanded || activeCount > 0 ? colors.primary : colors.borderControl,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.start}>
        <SlidersHorizontal size={18} color={colors.textSecondary} strokeWidth={1.7} />
        <Text style={[styles.label, { color: colors.text, fontFamily: fonts.medium }]}>{label}</Text>
        {activeCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>
              {isRTL ? arabicNumber(activeCount) : activeCount}
            </Text>
          </View>
        )}
      </View>
      {/* Rotate a wrapper, not the icon — lucide copies `style` onto each path. */}
      <View style={expanded ? styles.flipped : undefined}>
        <ChevronDown size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toggle: {
    height: grid(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: grid(2.5),
  },
  pressed: {
    opacity: 0.85,
  },
  start: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
  },
  label: {
    fontSize: 15,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
  },
  flipped: {
    transform: [{ rotate: '180deg' }],
  },
});
