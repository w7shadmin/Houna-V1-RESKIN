import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';

interface GoogleButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

/** A secondary pill with Google's own glyph — same height and shape as `Button`. */
export default function GoogleButton({ label, onPress, disabled }: GoogleButtonProps) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        { borderColor: colors.borderStrong, backgroundColor: colors.control },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <FontAwesome6 name="google" brand size={17} color={colors.text} />
      <Text style={[styles.label, { color: colors.text, fontFamily: fonts.semiBold }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: grid(1.5),
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: grid(3),
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 16,
  },
});
