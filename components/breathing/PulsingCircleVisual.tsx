import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import type { PhaseVisualProps } from './types';

interface Props extends PhaseVisualProps {
  accentColor: string;
  readyLabel: string;
  secSuffix: string;
}

const BOX = 280;
const ORB = 200;

/**
 * 4-7-8 breathing: a glowing orb that swells on the inhale, rests full on
 * the hold and settles on the exhale, inside the canvas's dotted and solid
 * rings, with the phase word in the display face at its centre.
 */
export default function PulsingCircleVisual({ phase, progressInPhase, isRunning, isComplete, accentColor, readyLabel, secSuffix }: Props) {
  const { colors } = useTheme();
  const { isRTL, fonts } = useLanguage();

  let scale = 0.62;
  if (isRunning && !isComplete) {
    if (phase.key === 'inhale') scale = 0.62 + progressInPhase * 0.38;
    else if (phase.key === 'hold') scale = 1;
    else if (phase.key === 'exhale') scale = 1 - progressInPhase * 0.38;
  }
  const secondsLeft = Math.max(Math.ceil(phase.duration * (1 - progressInPhase)), 0);
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  return (
    <View style={styles.box} accessibilityElementsHidden={!isRunning} importantForAccessibility={isRunning ? 'auto' : 'no-hide-descendants'}>
      <View style={[styles.dotted, { borderColor: alpha(accentColor, 0.4) }]} />
      <View style={[styles.inner, { borderColor: colors.borderControl }]} />
      <View
        style={[
          styles.orb,
          {
            backgroundColor: alpha(accentColor, 0.22),
            borderColor: alpha(accentColor, 0.5),
            boxShadow: `0 0 42px ${alpha(accentColor, 0.45)}`,
            transform: [{ scale }],
          },
        ]}
      />
      <View style={styles.centre} accessibilityLiveRegion="polite">
        {isRunning ? (
          <>
            <Text style={[styles.phase, isRTL && styles.phaseArabic, { color: colors.text, fontFamily: fonts.display }]}>{phase.label}</Text>
            <Text style={[styles.secs, { color: colors.textSecondary, fontFamily: fonts.labelRegular }]}>
              {num(secondsLeft)}
              {secSuffix}
            </Text>
          </>
        ) : !isComplete ? (
          <Text style={[styles.ready, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{readyLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: BOX,
    height: BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotted: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
    borderStyle: 'dotted',
  },
  inner: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 1,
  },
  orb: {
    position: 'absolute',
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    borderWidth: 1,
  },
  centre: {
    alignItems: 'center',
    gap: 4,
  },
  phase: {
    fontSize: 46,
    lineHeight: 52,
  },
  phaseArabic: {
    lineHeight: 72,
  },
  secs: {
    fontSize: 15,
  },
  ready: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 160,
  },
});
