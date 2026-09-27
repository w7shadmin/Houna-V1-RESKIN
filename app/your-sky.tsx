import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { formatEntryDateLong } from '@/lib/journal';
import IconButton from '@/components/ui/IconButton';
import ScreenGlow from '@/components/ui/ScreenGlow';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';
import NightStars from '@/components/home/NightStars';
import YourSky from '@/components/profile/YourSky';
import { useMonthPractice } from '@/hooks/useMonthPractice';
import { alpha } from '@/constants/theme';

/**
 * Your sky, whole (canvas "Phase 6 — Your sky"), from Profile: a star for each day practised this
 * month, joined in order, tonight's the brightest. Tap a star for its day and minutes. From the
 * phone's own log, so Guests have it too.
 */
export default function YourSkyScreen() {
  const { colors, isNight } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const s = t.profile.sky;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const month = useMonthPractice();
  const [selected, setSelected] = useState<number | undefined>(undefined);
  const last = month?.practised[month.practised.length - 1]?.date;
  useEffect(() => {
    if (selected === undefined && last !== undefined) setSelected(last);
  }, [last, selected]);

  const w = Math.min(width, layout.maxContentWidth) - layout.screenPadding * 2;
  const h = Math.min(360, Math.max(240, height * 0.42));
  const monthName = t.journal.dateNames.monthsLong[new Date().getMonth()];
  const count = month?.practised.length ?? 0;
  const day = month && selected !== undefined ? month.practised.find((d) => d.date === selected) : undefined;
  const dateOf = (date: number) => formatEntryDateLong(new Date(month!.from.getFullYear(), month!.from.getMonth(), date), t.journal.dateNames, num);
  const minutes = (n: number) => arabicPlural(n, s.minutes).replace('{n}', num(n));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {isNight && <NightStars />}
      <ScreenGlow color={alpha(colors.tones.glow.hue, isNight ? 0.12 : 0.18)} rx={70} ry={40} cy={60} />
      <View style={styles.column}>
        <View>
          <IconButton
            variant="control"
            accessibilityLabel={t.directory.common.goBack}
            onPress={back}
            renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
          />
        </View>
        <View style={styles.header}>
          <Text
            style={[
              fonts.labelTracked ? styles.labelLatin : styles.labelArabic,
              { color: colors.primary, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label },
            ]}
          >
            {s.eyebrow.replace('{month}', monthName)}
          </Text>
          <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {count > 0 ? arabicPlural(count, s.stars).replace('{n}', num(count)) : s.empty}
          </Text>
          <Text style={[styles.line, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.line}</Text>
        </View>
        <View style={styles.sky}>
          {month && (
            <YourSky
              dates={month.practised.map((d) => d.date)}
              days={month.days}
              width={w}
              height={h}
              isRTL={isRTL}
              big
              selected={selected}
              onPick={setSelected}
              starLabel={(date) => {
                const p = month.practised.find((d) => d.date === date);
                return `${dateOf(date)}, ${p ? minutes(p.practice.minutes) : ''}`;
              }}
            />
          )}
        </View>
        {day && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLiveRegion="polite">
            <Text style={[styles.cardDate, { color: colors.text, fontFamily: fonts.medium }]}>{dateOf(day.date)}</Text>
            <Text style={[styles.cardMin, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{minutes(day.practice.minutes)}</Text>
          </View>
        )}
        <Text style={[styles.tap, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.tap}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    gap: grid(2),
  },
  header: {
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
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleArabic: {
    lineHeight: 48,
  },
  line: {
    fontSize: 15,
    lineHeight: 22,
  },
  sky: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: grid(2),
    paddingHorizontal: grid(2),
    borderRadius: 22,
    borderWidth: 1,
  },
  cardDate: {
    fontSize: 15.5,
  },
  cardMin: {
    fontSize: 14,
  },
  tap: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
