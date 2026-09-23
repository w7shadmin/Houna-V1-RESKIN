import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, radius, spacing, typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared button primitive, codifying the fixed-height/opacity-press pattern
 * already used ad hoc across ~8 screens (sign-in, sign-up, username claim,
 * Voices submit, etc). New screens should use this instead of hand-rolling
 * another copy; existing screens aren't migrated as part of introducing it.
 */
export default function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const { fonts } = useLanguage();
  const isDisabled = disabled || loading;

  const fillColor = variant === 'destructive' ? palette.raspberry : colors.primary;
  const textColor = variant === 'secondary' ? colors.text : colors.onPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'secondary'
          ? { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }
          : { backgroundColor: fillColor },
        pressed && !isDisabled && (variant === 'secondary' ? { backgroundColor: colors.cardPressed } : { opacity: 0.7 }),
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor, fontFamily: fonts.semiBold }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.body,
  },
});
