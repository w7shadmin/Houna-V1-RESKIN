import React, { useId, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { stopProps } from '@/lib/svgStop';
import { PRACTICE_GROUPS, smoothed, type PracticeGroup } from '@/lib/practice';
import { practiceColours } from '@/components/stats/practiceColours';

interface MonthRidgesProps {
  byDayAndGroup: Record<PracticeGroup, number>[];
  /** Today, 0-based. */
  today: number;
  width: number;
  height: number;
}

/** Drawn back to front: the sky visits and meditation behind, the exercises' tones over them. */
const DRAW_ORDER: PracticeGroup[] = ['tanafas', 'meditation', 'physiologicalSigh', 'tensionRelease', 'panicRelief', 'steadyMind', 'anxietyRelief'];
const TICKS = [1, 8, 15, 22, 29];

/** A smooth line through points (Catmull-Rom as cubic Béziers). */
function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Your month in breath (canvas "Phase 6 — Profile", the Explorations' ridges): minutes in each part
 * of practice through the month as translucent ridges in their tones (a seven-day average, so they
 * swell with the weeks), a faint grid, today's line, and the parts the month has. Days run from
 * the right in Arabic, as the week's arc does.
 */
export default function MonthRidges({ byDayAndGroup, today, width, height }: MonthRidgesProps) {
  const { colors, isNight } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const id = `rg${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const colour = practiceColours(colors);
  const days = byDayAndGroup.length;
  const xOf = (i: number) => {
    const x = days > 1 ? (i / (days - 1)) * width : 0;
    return isRTL ? width - x : x;
  };
  const series = useMemo(
    () => Object.fromEntries(PRACTICE_GROUPS.map((g) => [g, smoothed(byDayAndGroup.map((d) => d[g]), today)])) as Record<PracticeGroup, number[]>,
    [byDayAndGroup, today],
  );
  const parts = PRACTICE_GROUPS.filter((g) => byDayAndGroup.some((d) => d[g] > 0));
  const max = Math.max(0.01, ...parts.flatMap((g) => series[g]));
  const base = height - 1;
  const ridge = (g: PracticeGroup) => {
    const pts = series[g].slice(0, today + 1).map((v, i) => [xOf(i), base - (v / max) * (height - 12)] as [number, number]);
    if (pts.length < 2) return null;
    const line = smooth(pts);
    return (
      <React.Fragment key={g}>
        <Path d={`${line} L${xOf(today).toFixed(1)} ${base} L${xOf(0).toFixed(1)} ${base} Z`} fill={`url(#${id}${g})`} />
        <Path d={line} fill="none" stroke={colour[g]} strokeWidth={1.3} strokeOpacity={0.9} />
      </React.Fragment>
    );
  };
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        <Defs>
          {parts.map((g) => (
            <LinearGradient key={g} id={`${id}${g}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset={0} {...stopProps(colour[g], isNight ? 0.5 : 0.36)} />
              <Stop offset={1} {...stopProps(colour[g], 0.02)} />
            </LinearGradient>
          ))}
        </Defs>
        {TICKS.filter((d) => d <= days).map((d) => (
          <Line key={d} x1={xOf(d - 1)} y1={0} x2={xOf(d - 1)} y2={base} stroke={colors.border} strokeWidth={1} />
        ))}
        {DRAW_ORDER.filter((g) => parts.includes(g)).map(ridge)}
        <Line x1={xOf(today)} y1={0} x2={xOf(today)} y2={base} stroke={colors.text} strokeOpacity={0.7} strokeWidth={1} />
      </Svg>
      <View style={[styles.axis, { width }]}>
        {TICKS.filter((d) => d <= days).map((d) => (
          // Physical offsets: the graph itself is mirrored by hand, not by layout.
          <Text key={d} style={[styles.tick, { left: xOf(d - 1) - 14, color: colors.textTertiary, fontFamily: fonts.regular }]}>
            {num(d)}
          </Text>
        ))}
      </View>
      {parts.length > 0 && (
        <View style={styles.key}>
          {parts.map((g) => (
            <View key={g} style={styles.keyItem}>
              <View style={[styles.dot, { backgroundColor: colour[g] }]} />
              <Text style={[styles.keyText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{t.tanafas.practiceGroups[g]}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  axis: {
    height: 16,
    // Native only: Android would mirror the physical offsets in Arabic; the web never does and rejects the style.
    ...(Platform.OS !== 'web' && { direction: 'ltr' as const }),
  },
  tick: {
    position: 'absolute',
    width: 28,
    textAlign: 'center',
    fontSize: 11.5,
  },
  key: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    columnGap: 12,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  keyText: {
    fontSize: 12,
  },
});
