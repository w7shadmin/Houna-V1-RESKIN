import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '@/components/Logo';
import LanguageSwitcherButton from '@/components/LanguageSwitcherButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, spacing, radius, typography, shadows } from '@/constants/theme';
import { hexToRgba, mix } from '@/lib/color';

/**
 * Ported from the old MVP's EntryChoiceScreen — same layered decorative
 * circles, centered logo + "You are Houna" subheading, and Tanafas/Explore
 * choice. The old version also had a faint background pattern motif SVG;
 * dropped here per explicit instruction, so only the translucent circles
 * remain.
 */

/** Same lighter→base→darker bevel recipe as the tab bar's floating Tanafas button, so the two visually match — lighter than a flat turquoise, and well clear of turquoiseDark. */
const TANAFAS_BUTTON_GRADIENT: readonly [string, string, string] = [
  mix(palette.turquoise, palette.white, 0.55),
  palette.turquoise,
  mix(palette.turquoise, palette.black, 0.12),
];
export default function EntryScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <LanguageSwitcherButton />

      <View style={styles.circleLayer} pointerEvents="none">
        <View style={[styles.circle, styles.circleTopEnd, { backgroundColor: hexToRgba(palette.turquoise, 0.14) }]} />
        <View style={[styles.circle, styles.circleMidStart, { backgroundColor: hexToRgba(palette.turquoise, 0.12) }]} />
        <View style={[styles.circle, styles.circleBottomEnd, { backgroundColor: hexToRgba(palette.turquoise, 0.08) }]} />
        <View style={[styles.circle, styles.circleBottomStart, { backgroundColor: hexToRgba(palette.turquoise, 0.15) }]} />
        <View style={[styles.circle, styles.circleCenter, { backgroundColor: hexToRgba(palette.turquoise, 0.05) }]} />
      </View>

      <View style={styles.middle}>
        <Logo variant="green" size="small" />
        <Text style={[styles.subheading, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
          {t.entry.subheading}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/tanafas')}
          style={({ pressed }) => [styles.tanafasBtnOuter, pressed && { transform: [{ scale: 0.97 }] }]}
        >
          <LinearGradient
            colors={TANAFAS_BUTTON_GRADIENT}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.tanafasBtn, shadows.cardLg]}
          >
            <Text style={[styles.tanafasBtnText, { fontFamily: fonts.semiBold }]}>{t.tabs.tanafas}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => [
            styles.exploreBtn,
            { borderColor: colors.primary, backgroundColor: colors.card },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={[styles.exploreBtnText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            {t.entry.explore}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const CIRCLE_STYLE = {
  position: 'absolute' as const,
  borderRadius: radius.full,
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  circleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: CIRCLE_STYLE,
  circleTopEnd: {
    width: 288,
    height: 288,
    top: -96,
    end: -80,
  },
  circleMidStart: {
    width: 160,
    height: 160,
    top: '25%',
    start: -64,
  },
  circleBottomEnd: {
    width: 320,
    height: 320,
    bottom: -96,
    end: -48,
  },
  circleBottomStart: {
    width: 224,
    height: 224,
    bottom: -64,
    start: -80,
  },
  circleCenter: {
    width: 320,
    height: 320,
    top: '50%',
    start: '50%',
    marginTop: -160,
    marginStart: -160,
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subheading: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.body,
  },
  actions: {
    gap: spacing.sm + 4,
  },
  tanafasBtnOuter: {
    borderRadius: radius.full,
  },
  tanafasBtn: {
    // Fixed height + explicit lineHeight on the text (not paddingVertical
    // sizing to content) — Scheherazade New's natural line-height is much
    // taller than Inter's at the same fontSize, so a padding-only button
    // renders visibly taller in Arabic than English. Fixing the height and
    // centering content decouples button size from which font is active.
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tanafasBtnText: {
    color: '#ffffff',
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  exploreBtn: {
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreBtnText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
});
