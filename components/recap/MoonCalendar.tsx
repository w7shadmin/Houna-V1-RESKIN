import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, grid, radius } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { formatEntryDateLong } from '@/lib/journal';
import { dayKey, practiceByDay } from '@/lib/practice';
import type { LoggedSession } from '@/lib/sessionLog';
import MoonGlyph from '@/components/ui/MoonGlyph';

const CW = 46;
const RH = 54;
const MOON = 24;

interface MoonCalendarProps {
  /** The month's first day, and the sessions logged in it. */
  month: Date;
  sessions: LoggedSession[];
}

/**
 * Recap's month by moonlight (canvas "Phase 4 — Recap: the month by moonlight"): the month as a
 * calendar of its nights' real moons, the days practised lit and glowing, the rest dim (never
 * "missed"), days still to come fainter and still. Tap a moon for that day's minutes and what
 * they mostly were. Only the moons take touches, so a tap anywhere else still moves Recap on.
 * The week runs right to left in Arabic (the row mirrors itself).
 */
export default function MoonCalendar({ month, sessions }: MoonCalendarProps) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const m = t.recap.moonlight;
  const names = t.tanafas.practiceGroups;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const days = useMemo(() => practiceByDay(sessions), [sessions]);
  const today = new Date();
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const lead = month.getDay();
  const dates = useMemo(() => Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1, 12)), [month, count]);
  const isFuture = (d: Date) => dayKey(d) > dayKey(today);
  const [picked, setPicked] = useState(() => {
    const i = dates.findIndex((d) => dayKey(d) === dayKey(today));
    return i >= 0 ? i : count - 1;
  });

  const sel = dates[picked];
  const selDay = days.get(dayKey(sel));
  const date = formatEntryDateLong(sel, t.journal.dateNames, num);
  const detail = isFuture(sel)
    ? m.toCome.replace('{date}', date)
    : selDay
      ? m.practised
          .replace('{date}', date)
          .replace('{minutes}', arabicPlural(selDay.minutes, m.minutes).replace('{n}', num(selDay.minutes)))
          .replace('{what}', names[selDay.mostly])
      : m.quiet.replace('{date}', date);
  const latin = fonts.labelTracked;
  const lit = colors.primary;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.head} pointerEvents="none">
        <Text style={[latin ? styles.eyebrowLatin : styles.eyebrowArabic, { color: colors.tones.dusk.text, fontFamily: latin ? fonts.labelRegular : fonts.label }]}>
          {m.eyebrow}
        </Text>
        <Text style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
          {m.title.replace('{month}', t.journal.dateNames.monthsLong[month.getMonth()])}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{m.body}</Text>
      </View>

      <View style={styles.grid} pointerEvents="box-none">
        {m.weekdays.map((w, i) => (
          <Text key={`w${i}`} pointerEvents="none" style={[styles.weekday, { color: colors.textTertiary, fontFamily: latin ? fonts.labelRegular : fonts.label }]}>
            {w}
          </Text>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <View key={`lead${i}`} style={styles.cell} pointerEvents="none" />
        ))}
        {dates.map((d, i) => {
          const future = isFuture(d);
          const practised = days.has(dayKey(d));
          const on = i === picked;
          return (
            <Pressable
              key={i}
              disabled={future}
              onPress={() => setPicked(i)}
              accessibilityRole="button"
              aria-selected={on}
              accessibilityLabel={formatEntryDateLong(d, t.journal.dateNames, num)}
              style={styles.cell}
            >
              <View
                style={[
                  styles.moon,
                  practised && { boxShadow: `0 0 12px ${alpha(colors.tones.glow.hue, 0.55)}` },
                ]}
              >
                <View style={[styles.ring, { borderColor: colors.text, opacity: on ? 1 : 0 }]} />
                <MoonGlyph
                  date={d}
                  size={MOON}
                  lit={practised ? lit : alpha(colors.text, future ? 0.08 : 0.2)}
                  dark={alpha(colors.text, practised ? 0.08 : 0.04)}
                />
              </View>
              <Text
                style={[
                  styles.dayNumber,
                  { color: practised ? colors.text : colors.textTertiary, fontFamily: fonts.regular, opacity: future ? 0.45 : 1 },
                ]}
              >
                {num(i + 1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.detail, { backgroundColor: colors.card, borderColor: colors.border }]} pointerEvents="none" accessibilityLiveRegion="polite">
        <Text style={[styles.detailText, { color: colors.text, fontFamily: fonts.regular }]}>{detail}</Text>
      </View>
      <Text pointerEvents="none" style={[styles.note, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
        {m.note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: grid(2),
  },
  head: {
    alignItems: 'center',
    gap: grid(1),
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.18,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  titleArabic: {
    lineHeight: 46,
  },
  body: {
    maxWidth: 320,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
  },
  grid: {
    width: CW * 7,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    width: CW,
    textAlign: 'center',
    fontSize: 11,
    marginBottom: grid(0.5),
  },
  cell: {
    width: CW,
    height: RH,
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  moon: {
    width: MOON,
    height: MOON,
    borderRadius: MOON / 2,
  },
  ring: {
    position: 'absolute',
    top: -5,
    bottom: -5,
    start: -5,
    end: -5,
    borderRadius: MOON / 2 + 5,
    borderWidth: 1.5,
  },
  dayNumber: {
    fontSize: 12,
  },
  detail: {
    alignSelf: 'stretch',
    minHeight: grid(7),
    justifyContent: 'center',
    paddingHorizontal: grid(2),
    paddingVertical: grid(1.5),
    borderRadius: radius.cardLg,
    borderWidth: 1,
  },
  detailText: {
    fontSize: 15,
    lineHeight: 21,
  },
  note: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
  },
});
