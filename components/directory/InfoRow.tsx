import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography } from '@/constants/theme';

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export default function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  const { fonts } = useLanguage();
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Icon size={16} color={colors.primary} style={styles.icon} />
      <View style={styles.text}>
        <Text style={[styles.label, { color: colors.textTertiary, fontFamily: fonts.bold }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.text, fontFamily: fonts.regular }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 4,
    marginBottom: spacing.xs,
  },
  icon: {
    marginTop: 2,
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: typography.fontSize.sm,
    marginTop: 1,
  },
});
