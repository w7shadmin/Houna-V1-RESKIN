import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { alpha } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import MoonGlyph from '@/components/ui/MoonGlyph';

const H = 300;
const CY = 100;
const R = 150;
const MOON = 26;

interface WeekMoonsProps {
  streak: number;
  /** This week, Monday first: the days practised. */
  practised: boolean[];
  /** Monday of this week. */
  monday: Date;
  /** Today, 0 (Monday) to 6. */
  today: number;
  width: number;
}

/**
 * The streak as the week in moons (canvas "Phase 6 — Stats: the week in moons", Oura's big numeral):
 * the streak, large, over this week's real moons on a curve, each lit on a day practised, today
 * ringed, days to come faint. A day not practised is a dim moon, never "missed". The week runs from
 * the right in Arabic. Streaks count breathing and meditation only, never mood.
 */
export default function WeekMoons({ streak, practised, monday, today, width }: WeekMoonsProps) {
  const { colors, isNight } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const s = t.account.stats;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const lit = isNight ? colors.text : colors.primary;
  const cx = width / 2;
  const days = Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  const a11y = s.moonsA11y
    .replace('{n}', `${num(streak)} ${arabicPlural(streak, s.inARow)}`)
    .replace('{days}', days.slice(0, today + 1).map((_, i) => `${s.weekdayNames[i]} ${practised[i] ? s.practised : s.rest}`).join(isRTL ? '، ' : ', '));

  return (
    <View style={[styles.wrap, { width, height: H }]} accessible accessibilityRole="image" accessibilityLabel={a11y}>
      <View style={styles.centre}>
        <Text style={[styles.number, isRTL && styles.numberArabic, { color: colors.text, fontFamily: fonts.numeral }]}>{num(streak)}</Text>
        <Text style={[styles.unit, { color: colors.textSecondary, fontFamily: fonts.display }]}>{arabicPlural(streak, s.inARow)}</Text>
      </View>
      {days.map((d, i) => {
        // Along a curve from the start side, under the numeral; physical, so mirrored by hand.
        const deg = 170 - i * (160 / 6);
        const a = ((isRTL ? 180 - deg : deg) * Math.PI) / 180;
        const x = cx + R * Math.cos(a);
        const y = CY + R * Math.sin(a);
        const future = i > today;
        const on = practised[i] && !future;
        return (
          <View key={i} style={[styles.day, { left: x - 22, top: y - 22 }]}>
            <View style={styles.moonBox}>
              {i === today && <View style={[styles.todayRing, { borderColor: alpha(colors.text, isNight ? 0.4 : 0.25) }]} />}
              <View style={on && isNight ? { boxShadow: `0 0 10px ${alpha(colors.text, 0.45)}`, borderRadius: MOON / 2 } : undefined}>
                <MoonGlyph date={d} size={MOON} lit={on ? lit : alpha(colors.text, future ? 0.1 : 0.2)} dark={alpha(on ? lit : colors.text, on ? 0.12 : 0.05)} minFraction={0.08} />
              </View>
            </View>
            <Text style={[styles.weekday, { color: i === today ? colors.text : colors.textTertiary, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label }]}>
              {s.weekdays[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    // Native only: Android would mirror the physical offsets in Arabic; the web never does and rejects the style.
    ...(Platform.OS !== 'web' && { direction: 'ltr' as const }),
  },
  centre: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    alignItems: 'center',
  },
  number: {
    fontSize: 112,
    lineHeight: 118,
  },
  numberArabic: {
    fontSize: 96,
    lineHeight: 124,
  },
  unit: {
    fontSize: 21,
    lineHeight: 28,
  },
  day: {
    position: 'absolute',
    width: 44,
    alignItems: 'center',
    gap: 6,
  },
  moonBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  weekday: {
    fontSize: 11,
  },
});
