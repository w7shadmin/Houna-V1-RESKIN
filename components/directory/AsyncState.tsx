import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { RotateCw } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography } from '@/constants/theme';

interface LoadingStateProps {
  label: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  const { fonts } = useLanguage();
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.label, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{label}</Text>
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}

export function ErrorState({ message, retryLabel, onRetry }: ErrorStateProps) {
  const { fonts } = useLanguage();
  return (
    <View style={styles.center}>
      <View style={[styles.icon, { backgroundColor: colors.accent + '18' }]}>
        <RotateCw size={24} color={colors.accent} />
      </View>
      <Text style={[styles.message, { color: colors.text, fontFamily: fonts.semiBold }]}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.9 }]}
      >
        <RotateCw size={16} color={colors.onPrimary} />
        <Text style={[styles.retryText, { color: colors.onPrimary, fontFamily: fonts.semiBold, lineHeight: typography.lineHeight.sm }]}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

interface InlineErrorProps {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}

/** Smaller error banner shown below already-loaded content (e.g. a failed "load more"). */
export function InlineError({ message, retryLabel, onRetry }: InlineErrorProps) {
  const { fonts } = useLanguage();
  return (
    <View style={[styles.inline, { backgroundColor: colors.accent + '14', borderColor: colors.accent + '30' }]}>
      <Text style={[styles.inlineText, { color: colors.accent, fontFamily: fonts.regular }]}>{message}</Text>
      <Pressable onPress={onRetry} style={({ pressed }) => pressed && { opacity: 0.6 }}>
        <Text style={[styles.inlineRetry, { color: colors.primary, fontFamily: fonts.semiBold }]}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  retryBtn: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  retryText: {
    fontSize: typography.fontSize.sm,
  },
  inline: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  inlineText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  inlineRetry: {
    fontSize: typography.fontSize.xs,
  },
});
