import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
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
 *
 * Sits over very different backdrops (the pale entry screen vs. the teal
 * home hero banner), so it can't just be a solid-tinted outline — that
 * either vanishes against a similar hue or reads as too strong against a
 * bright one. A real frosted-glass blur adapts to whatever is behind it
 * instead, with a soft brand-tinted shadow for a touch of lift rather than
 * a hard border.
 */
export default function LanguageSwitcherButton() {
  const { language, setLanguage, fonts } = useLanguage();
  const next = language === 'en' ? 'ar' : 'en';
  // Scheherazade New's "ع" sits visually lower in its own em-box than
  // Inter's "E" does, even though both are centered in the same circle —
  // nudge it up to match the Latin glyph's optical center.
  const isArabicLabel = language === 'ar';
  // React Native positions `position: 'absolute'` children relative to the
  // parent's outer edge, not its padding box — unlike web CSS, the
  // SafeAreaView's top padding (from edges={['top']}) has no effect on an
  // absolutely-positioned child's own `top` offset. Adding the inset here
  // directly is the only way this actually clears the status bar.
  const insets = useSafeAreaInsets();

  return (
    // The shadow lives on this outer, non-clipped wrapper — a blurred
    // circle needs `overflow: hidden` to keep the blur itself circular,
    // but overflow:hidden on the same view would also clip its own shadow.
    <View style={[styles.shadowWrap, { top: insets.top + spacing.sm }]}>
      <Pressable
        onPress={() => setLanguage(next)}
        hitSlop={14}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={LABELS[next]}
      >
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
        <Text
          style={[
            styles.label,
            { color: colors.text, fontFamily: fonts.bold },
            isArabicLabel && styles.arabicLabel,
          ]}
        >
          {LABELS[language]}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    position: 'absolute',
    end: spacing.lg,
    zIndex: 10,
    borderRadius: radius.full,
    ...shadows.card,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
  },
  arabicLabel: {
    transform: [{ translateY: -2 }],
  },
});
