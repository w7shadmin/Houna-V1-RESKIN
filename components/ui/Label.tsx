import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/constants/theme';

interface LabelProps {
  children: React.ReactNode;
  /** Defaults to the tertiary text colour. */
  color?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Eyebrow / section label — "YOU'RE NOT ALONE", "BREATHING TOGETHER".
 * Latin: DM Mono tracked caps. Arabic: IBM Plex Sans Arabic medium,
 * untracked and ~1.5px larger (the canvas's Arabic artboards size it up so
 * it reads at the same weight as the mono caps).
 */
export default function Label({ children, color, style }: LabelProps) {
  const { fonts } = useLanguage();
  const { colors } = useTheme();

  return (
    <Text
      style={[
        fonts.labelTracked ? styles.latin : styles.arabic,
        { color: color ?? colors.textTertiary, fontFamily: fonts.label },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  latin: {
    fontSize: typography.label.fontSize,
    letterSpacing: typography.label.letterSpacing,
    textTransform: 'uppercase',
  },
  arabic: {
    fontSize: 13,
  },
});
