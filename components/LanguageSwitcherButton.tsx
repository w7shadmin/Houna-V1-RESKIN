import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, shadows } from '@/constants/theme';

/**
 * "E" / "ع" are identity glyphs for the language itself, not translatable
 * prose — shown together regardless of current language, so they live here
 * as fixed constants rather than in the per-language string catalogue.
 */
const LABELS = { en: 'E', ar: 'ع' } as const;

/**
 * Small floating language toggle. Deliberately shown only on the entry
 * screen and Home — not a replacement for the full language setting in
 * More, just a quick switch for the two screens someone lands on first.
 */
export default function LanguageSwitcherButton() {
  const { language, setLanguage, fonts } = useLanguage();
  const next = language === 'en' ? 'ar' : 'en';
  // React Native positions `position: 'absolute'` children relative to the
  // parent's outer edge, not its padding box — unlike web CSS, the
  // SafeAreaView's top padding (from edges={['top']}) has no effect on an
  // absolutely-positioned child's own `top` offset. Adding the inset here
  // directly is the only way this actually clears the status bar.
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => setLanguage(next)}
      hitSlop={14}
      style={({ pressed }) => [
        styles.button,
        { top: insets.top + spacing.sm, backgroundColor: colors.card },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={LABELS[next]}
    >
      <Text style={[styles.label, { color: colors.primary, fontFamily: fonts.bold }]}>{LABELS[language]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    end: spacing.lg,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.cardLg,
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: 13,
  },
});
