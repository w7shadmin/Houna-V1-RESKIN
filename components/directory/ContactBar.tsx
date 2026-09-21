import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';

interface ContactBarProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

/** Bottom action bar for detail screens — sits below the scroll area, not layered over it. */
export default function ContactBar({ icon: Icon, label, onPress }: ContactBarProps) {
  const { fonts } = useLanguage();
  return (
    <SafeAreaView edges={['bottom']} style={[styles.wrap, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary, ...shadows.card }, pressed && { opacity: 0.9 }]}
      >
        <Icon size={18} color={colors.onPrimary} />
        <Text style={[styles.text, { color: colors.onPrimary, fontFamily: fonts.bold, lineHeight: typography.lineHeight.body }]}>{label}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  btn: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.body,
  },
});
