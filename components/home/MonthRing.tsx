import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { currentHijri, hijriMonthDays } from '@/lib/hijri';
import { SYNODIC_DAYS, moonPhase } from '@/lib/moonPhase';
import { formatEntryDateLong } from '@/lib/journal';
import MoonGlyph from '@/components/ui/MoonGlyph';

const R = 118;
const CELL = 32;
const BOX = 2 * R + CELL;

/**
 * The month of moons (canvas "Phase 3 — the month of moons"): every night of this Hijri month
 * in its real phase, round a ring from the 1st at the top, clockwise (counter-clockwise in
 * Arabic, as the text runs). Tap one to see its phase and date in the middle; tonight keeps a
 * faint ring. Below, the days to the next new moon. The moons take the four tones and the ink
 * in turn through the month.
 */
export default function MonthRing() {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const m = t.home.month;
  const h = t.home.hijri;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const now = useMemo(() => new Date(), []);
  const today = currentHijri(now);
  const days = useMemo(() => hijriMonthDays(today.date), [today.date.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
  const tonight = today.hijri.day - 1;
  const [picked, setPicked] = useState(tonight);
  const tones = [colors.tones.dusk.fg, colors.tones.glow.fg, colors.text, colors.tones.dawn.fg, colors.tones.bloom.fg];

  const sel = days[Math.min(picked, days.length - 1)];
  const selPhase = moonPhase(sel.date);
  const age = moonPhase(now).age;
  const toNew = age < 0.5 || age > SYNODIC_DAYS - 0.5 ? 0 : Math.round(SYNODIC_DAYS - age);
  const latin = fonts.labelTracked;

  return (
    <View style={styles.wrap}>
      <View style={styles.ring}>
        {days.map((d, k) => {
          const a = -Math.PI / 2 + (k / days.length) * Math.PI * 2;
          // Offsets from the centre, not left/top, so Arabic's turn the other way is ours to choose.
          const x = (isRTL ? -1 : 1) * R * Math.cos(a);
          const y = R * Math.sin(a);
          const on = k === picked;
          return (
            <Pressable
              key={k}
              accessibilityRole="radio"
              aria-checked={on}
              accessibilityLabel={`${num(d.hijri.day)} ${h.months[d.hijri.month - 1]}, ${h.phases[moonPhase(d.date).name]}`}
              onPress={() => setPicked(k)}
              hitSlop={2}
              style={[styles.cell, { transform: [{ translateX: x }, { translateY: y }] }]}
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  styles.ringMark,
                  { borderColor: colors.text, opacity: on ? 1 : k === tonight ? 0.3 : 0 },
                ]}
              />
              <MoonGlyph date={d.date} size={16} lit={tones[Math.min(4, Math.floor((k / days.length) * 5))]} dark={alpha(colors.text, 0.1)} />
            </Pressable>
          );
        })}
        <View style={styles.centre} pointerEvents="none" accessibilityLiveRegion="polite">
          <Text
            style={[
              latin ? styles.phaseLatin : styles.phaseArabic,
              { color: colors.textSecondary, fontFamily: latin ? fonts.labelRegular : fonts.medium },
            ]}
          >
            {h.phases[selPhase.name]}
          </Text>
          <Text style={[isRTL ? styles.dayArabic : styles.day, { color: colors.text, fontFamily: fonts.numeral }]}>{num(sel.hijri.day)}</Text>
          <Text style={[styles.greg, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
            {formatEntryDateLong(sel.date, t.journal.dateNames, num)}
          </Text>
        </View>
      </View>

      <View style={styles.foot}>
        <View style={styles.footRow}>
          <Text style={[styles.newMoon, { color: colors.text, fontFamily: fonts.regular }]}>
            {arabicPlural(toNew, m.newMoonIn).replace('{n}', num(toNew))}
          </Text>
          <Text
            style={[
              latin ? styles.tonightLatin : styles.tonightArabic,
              { color: colors.textTertiary, fontFamily: latin ? fonts.labelRegular : fonts.regular },
            ]}
          >
            {`${m.tonight} · ${h.phases[moonPhase(now).name]}`}
          </Text>
        </View>
        <Text style={[styles.note, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{m.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 24,
  },
  ring: {
    alignSelf: 'center',
    width: BOX,
    height: BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    position: 'absolute',
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMark: {
    borderRadius: CELL / 2,
    borderWidth: 1.5,
  },
  centre: {
    width: 180,
    alignItems: 'center',
    gap: 8,
  },
  phaseLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
  },
  phaseArabic: {
    fontSize: 13,
  },
  day: {
    fontSize: 44,
    lineHeight: 48,
  },
  dayArabic: {
    fontSize: 46,
    lineHeight: 64,
  },
  greg: {
    fontSize: 14,
    textAlign: 'center',
  },
  foot: {
    gap: 8,
    paddingHorizontal: 8,
  },
  footRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  newMoon: {
    fontSize: 16,
  },
  tonightLatin: {
    fontSize: 10,
    letterSpacing: 10 * 0.14,
    textTransform: 'uppercase',
  },
  tonightArabic: {
    fontSize: 12,
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
  },
});
