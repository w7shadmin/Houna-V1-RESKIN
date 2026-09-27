import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import { currentHijri, formatHijri } from '@/lib/hijri';
import { moonPhase } from '@/lib/moonPhase';
import { useNow } from '@/hooks/useNow';
import MoonGlyph from '@/components/ui/MoonGlyph';

/**
 * Home's Hijri date, under the logo (canvas "Phase 3 — Home: the Hijri date"): tonight's moon
 * in its phase, the Hijri day and the phase's name. The Hijri day turns at sunset (6 pm), so
 * the date moves on then; on the evening a month begins it shows the hilal, glowing, and the
 * new month's name. Tapping it opens the month of moons.
 */
export default function HijriDate({ background }: { background: string }) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const router = useRouter();
  const h = t.home.hijri;
  const now = useNow(5 * 60_000);
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const { evening, hijri } = currentHijri(now);
  const hilal = evening && hijri.day === 1;
  const first = hilal ? h.hilal : formatHijri(hijri, h.months, num);
  const second = hilal ? h.months[hijri.month - 1] : h.phases[moonPhase(now).name];
  const lit = colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={h.open.replace('{date}', first).replace('{phase}', second)}
      onPress={() => router.push('/month')}
      hitSlop={8}
      style={({ pressed }) => [styles.chip, { backgroundColor: background, borderColor: colors.borderControl }, pressed && styles.pressed]}
    >
      <View style={hilal && { borderRadius: 7, boxShadow: `0 0 8px ${alpha(colors.tones.glow.hue, 0.8)}` }}>
        <MoonGlyph date={now} size={14} lit={lit} dark={alpha(lit, 0.16)} minFraction={hilal ? 0.07 : 0} />
      </View>
      <Text style={[styles.first, { color: colors.text, fontFamily: fonts.semiBold }]}>{first}</Text>
      <Text style={[styles.second, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{second}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  first: {
    fontSize: 12.5,
  },
  second: {
    fontSize: 12.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
