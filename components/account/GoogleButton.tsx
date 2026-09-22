import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography } from '@/constants/theme';

interface GoogleButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function GoogleButton({ label, onPress, disabled }: GoogleButtonProps) {
  const { fonts } = useLanguage();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: colors.border, backgroundColor: colors.card },
        pressed && { backgroundColor: colors.cardPressed },
        disabled && { opacity: 0.5 },
      ]}
    >
      <FontAwesome name="google" size={18} color={colors.text} />
      <Text style={[styles.label, { color: colors.text, fontFamily: fonts.semiBold }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  label: {
    fontSize: typography.fontSize.body,
  },
});
