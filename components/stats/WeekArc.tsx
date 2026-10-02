import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, grid, radius } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { PRACTICE_GROUPS, type PracticeGroup } from '@/lib/practice';
import { useReduceMotion } from '@/hooks/useCalmLoop';
import { practiceColours } from './practiceColours';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const W = 280;
const R = 118;
const STROKE = 10;
/** The arc: from lower left, over the top, to lower right. */
const START = 150;
const SWEEP = 240;
/** Degrees of daylight between parts. */
const GAP = 5;
const CX = W / 2;
const CY = R + STROKE;
const H = CY + R * Math.sin((30 * Math.PI) / 180) + STROKE;

const point = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [CX + R * Math.cos(a), CY + R * Math.sin(a)] as const;
};
const arcPath = (a0: number, a1: number) => {
  const [x0, y0] = point(a0);
  const [x1, y1] = point(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

interface WeekArcProps {
  /** This week's minutes in each part. */
  week: Record<PracticeGroup, number>;
  lastWeek: number;
}

/**
 * The week as an arc (canvas "Phase 4 — Stats: the week as an arc"): this week's minutes, large,
 * on an arc split by the parts of practice in their tones (meditation in ink, Home's sky visits
 * in half-ink), last week beneath for scale (no arrow, no verdict), and the parts with their
 * minutes. The arc draws itself once as it opens; it fills from the right in Arabic.
 */
export default function WeekArc({ week, lastWeek }: WeekArcProps) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const s = t.account.stats.week;
  const names = t.tanafas.practiceGroups;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const reduceMotion = useReduceMotion();
  const draw = useRef(new Animated.Value(0)).current;

  const colour = practiceColours(colors);
  const total = PRACTICE_GROUPS.reduce((sum, g) => sum + week[g], 0);
  const parts = PRACTICE_GROUPS.filter((g) => week[g] > 0);

  useEffect(() => {
    draw.setValue(0);
    // SVG strokes can't take the native driver; it's one short draw as the screen opens.
    Animated.timing(draw, { toValue: 1, duration: reduceMotion ? 0 : 1100, easing: Easing.bezier(0.3, 0.7, 0.3, 1), useNativeDriver: false }).start();
  }, [total, draw, reduceMotion]);

  let at = START;
  const segments = parts.map((g, i) => {
    const span = (week[g] / total) * SWEEP;
    // Gaps between parts only: the first and last reach the arc's ends, covering the track's caps.
    const a0 = at + (i === 0 ? 0 : GAP / 2);
    const a1 = at + span - (i === parts.length - 1 ? 0 : GAP / 2);
    at += span;
    const len = Math.max(0, ((a1 - a0) / 360) * 2 * Math.PI * R);
    // Each part draws in its turn along the arc.
    const from = (a0 - START) / SWEEP;
    const to = (a1 + GAP / 2 - START) / SWEEP;
    const offset = draw.interpolate({ inputRange: [from, Math.max(to, from + 0.001)], outputRange: [len, 0], extrapolate: 'clamp' });
    return { g, d: arcPath(a0, Math.max(a1, a0 + 0.5)), len, offset };
  });
  const [kx, ky] = point(START + SWEEP);
  const latin = fonts.labelTracked;
  const label = (text: string, color: string) => (
    <Text style={[latin ? styles.labelLatin : styles.labelArabic, { color, fontFamily: latin ? fonts.labelRegular : fonts.label }]}>{text}</Text>
  );

  return (
    <View style={styles.wrap}>
      <View
        style={styles.dial}
        accessible
        accessibilityRole="image"
        accessibilityLabel={s.a11y
          .replace('{n}', `${num(total)} ${arabicPlural(total, s.unit)}`)
          .replace('{m}', `${num(lastWeek)} ${arabicPlural(lastWeek, s.unit)}`)}
      >
        {/* Mirrored in Arabic, so it fills from the right. */}
        <Svg width={W} height={H} style={isRTL && styles.mirror}>
          <Path d={arcPath(START, START + SWEEP)} fill="none" stroke={alpha(colors.text, 0.08)} strokeWidth={STROKE} strokeLinecap="round" />
          {segments.map(({ g, d, len, offset }) => (
            <AnimatedPath
              key={g}
              d={d}
              fill="none"
              stroke={colour[g]}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${len} ${len}`}
              strokeDashoffset={offset}
            />
          ))}
          <Circle cx={kx} cy={ky} r={7} fill={colors.background} stroke={colors.text} strokeWidth={3} />
        </Svg>
        <View style={styles.centre} pointerEvents="none">
          {label(s.eyebrow, colors.tones.glow.text)}
          <Text style={[styles.total, isRTL && styles.totalArabic, { color: colors.text, fontFamily: fonts.numeral }]}>{num(total)}</Text>
          <Text style={[styles.unit, { color: colors.textSecondary, fontFamily: fonts.display }]}>{arabicPlural(total, s.unit)}</Text>
        </View>
      </View>

      <View style={styles.last}>
        {label(s.lastWeek, colors.textTertiary)}
        <Text style={[styles.lastNumber, { color: colors.textSecondary, fontFamily: isRTL ? fonts.medium : fonts.numeral }]}>{num(lastWeek)}</Text>
      </View>

      {parts.length > 0 && (
        <View style={styles.legend}>
          {parts.map((g) => (
            <View key={g} style={[styles.part, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.dot, { backgroundColor: colour[g] }]} />
              <Text numberOfLines={1} style={[styles.partName, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {names[g]}
              </Text>
              <Text style={[styles.partMinutes, { color: colors.text, fontFamily: isRTL ? fonts.medium : fonts.numeral }]}>{num(week[g])}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: grid(2),
  },
  dial: {
    alignSelf: 'center',
    width: W,
    height: H,
  },
  mirror: {
    transform: [{ scaleX: -1 }],
  },
  centre: {
    ...StyleSheet.absoluteFillObject,
    top: CY - R + 24,
    alignItems: 'center',
    gap: grid(1),
  },
  labelLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
  },
  labelArabic: {
    fontSize: 13,
  },
  total: {
    fontSize: 80,
    lineHeight: 84,
  },
  totalArabic: {
    fontSize: 72,
    lineHeight: 100,
  },
  unit: {
    fontSize: 20,
    lineHeight: 26,
  },
  last: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: grid(1),
    marginTop: -grid(1),
  },
  lastNumber: {
    fontSize: 20,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: grid(1),
  },
  part: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
    paddingHorizontal: grid(1.5),
    height: grid(5.5),
    borderRadius: radius.card,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  partName: {
    flex: 1,
    fontSize: 13.5,
  },
  partMinutes: {
    fontSize: 17,
  },
});
