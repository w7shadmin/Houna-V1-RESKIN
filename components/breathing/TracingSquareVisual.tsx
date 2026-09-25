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
  phaseCount: number;
}

const BOX = 280;
const OUTER = 240;
const ORB = 20;
/** The orb travels just inside the dotted square, one edge per phase. */
const TRACK_MIN = (BOX - OUTER) / 2 + 14;
const TRACK = OUTER - 28;

/**
 * Box (4×4) breathing, as drawn on the canvas: a dotted rounded square and
 * an inner square, with a glowing orb tracing one edge per phase and the
 * phase word in the display face at the centre. The orb moves by transform
 * from the box's centre, so its path is the same in both text directions.
 */
export default function TracingSquareVisual({ phase, phaseIndex, progressInPhase, isRunning, isComplete, accentColor, readyLabel, secSuffix }: Props) {
  const { colors } = useTheme();
  const { isRTL, fonts } = useLanguage();

  const p = isRunning ? progressInPhase : 0;
  let x = TRACK_MIN;
  let y = TRACK_MIN;
  switch (isRunning ? phaseIndex % 4 : 0) {
    case 0: x = TRACK_MIN + p * TRACK; y = TRACK_MIN; break;
    case 1: x = TRACK_MIN + TRACK; y = TRACK_MIN + p * TRACK; break;
    case 2: x = TRACK_MIN + (1 - p) * TRACK; y = TRACK_MIN + TRACK; break;
    case 3: x = TRACK_MIN; y = TRACK_MIN + (1 - p) * TRACK; break;
  }
  const secondsLeft = Math.max(Math.ceil(phase.duration * (1 - progressInPhase)), 0);
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  return (
    <View style={styles.box}>
      <View style={[styles.outer, { borderColor: alpha(accentColor, 0.4) }]} />
      <View style={[styles.inner, { borderColor: colors.borderControl }]} />
      {!isComplete && (
        <View
          style={[
            styles.orb,
            {
              // Absolute with no insets centres the orb in the box; offset from there.
              transform: [{ translateX: x - BOX / 2 }, { translateY: y - BOX / 2 }],
              backgroundColor: accentColor,
              boxShadow: `0 0 18px ${alpha(accentColor, 0.9)}, 0 0 42px ${alpha(accentColor, 0.45)}`,
              opacity: isRunning ? 1 : 0.45,
            },
          ]}
        />
      )}
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
  outer: {
    position: 'absolute',
    width: OUTER,
    height: OUTER,
    borderRadius: 42,
    borderWidth: 2,
    borderStyle: 'dotted',
  },
  inner: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 26,
    borderWidth: 1,
  },
  orb: {
    position: 'absolute',
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
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
