import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { alpha } from '@/constants/theme';
import { COUNTDOWN_SECONDS } from '@/constants/breathPatterns';
import { arabicNumber } from '@/lib/arabicNumerals';
import { useReduceMotion } from '@/hooks/useCalmLoop';
import type { IconTileTone } from '@/components/ui/IconTile';

/** The stages' box (BreatheStages' SIZE), and the ring's radius just inside it. */
const STAGE = 250;
const R = 123;
const LENGTH = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * A quiet 3 · 2 · 1 before every breathing exercise (canvas "Round 2 — a countdown"). `begin(then)`
 * counts down a second at a time and calls `then` (the exercise's own start) at the end; `cancel`
 * stops it before anything has started, so nothing is counted. Each number is said to a screen reader.
 */
export function useCountdown() {
  const [n, setN] = useState(0);
  const then = useRef<(() => void) | null>(null);
  const { isRTL } = useLanguage();
  useEffect(() => {
    if (!n) return;
    AccessibilityInfo.announceForAccessibility(isRTL ? arabicNumber(n) : String(n));
    const id = setTimeout(() => {
      if (n > 1) setN(n - 1);
      else {
        setN(0);
        then.current?.();
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [n, isRTL]);
  return {
    n,
    active: n > 0,
    begin: (start: () => void) => {
      then.current = start;
      setN(COUNTDOWN_SECONDS);
    },
    cancel: () => setN(0),
  };
}

/**
 * The stage, and while counting a thin ring in the exercise's tone round it, drawing down over
 * the countdown (still under Reduce Motion). Always wraps the stage, so the stage never remounts.
 */
export function CountdownRing({ active, tone, children }: { active: boolean; tone: IconTileTone; children: React.ReactNode }) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const draw = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    draw.setValue(0);
    if (!active || reduceMotion) return;
    // SVG strokes can't take the native driver; it's one short line.
    const anim = Animated.timing(draw, { toValue: 1, duration: COUNTDOWN_SECONDS * 1000, easing: Easing.linear, useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [active, reduceMotion, draw]);
  const offset = draw.interpolate({ inputRange: [0, 1], outputRange: [0, LENGTH] });
  return (
    <View style={styles.box}>
      {children}
      {active && (
        <Svg width={STAGE} height={STAGE} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Circle cx={STAGE / 2} cy={STAGE / 2} r={R} fill="none" stroke={alpha(colors.text, 0.12)} strokeWidth={2} />
          <AnimatedCircle
            cx={STAGE / 2}
            cy={STAGE / 2}
            r={R}
            fill="none"
            stroke={colors.tones[tone].fg}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={`${LENGTH} ${LENGTH}`}
            strokeDashoffset={offset}
            // From twelve o'clock, drawing down clockwise.
            transform={`rotate(-90 ${STAGE / 2} ${STAGE / 2})`}
          />
        </Svg>
      )}
    </View>
  );
}

/** The number, where the phase word will be. */
export function CountdownNumber({ n }: { n: number }) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  return (
    <Text accessibilityElementsHidden importantForAccessibility="no" style={[isRTL ? styles.numberArabic : styles.number, { color: colors.text, fontFamily: fonts.numeral }]}>
      {isRTL ? arabicNumber(n) : String(n)}
    </Text>
  );
}

const styles = StyleSheet.create({
  box: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 72,
    lineHeight: 80,
    textAlign: 'center',
  },
  numberArabic: {
    fontSize: 60,
    lineHeight: 84,
    textAlign: 'center',
  },
});
