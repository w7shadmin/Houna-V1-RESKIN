import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { APPEARANCE_OPTIONS, useTheme, type AppearancePreference } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { alpha, layout, type ColorScheme } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { getCountryName } from '@/lib/countries';
import { exportAndShareJournal } from '@/lib/journal';
import { computeStreak, getMyBadges, getMyStreak } from '@/lib/streaks';
import { sessionDays } from '@/lib/sessionLog';
import { listResults } from '@/lib/psychometrics/results';
import { BADGE_ORDER, nextStreakBadge } from '@/lib/badges';
import { star8Points } from '@/lib/khatam';
import { resolveImageUrl } from '@/lib/hounaApi';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import Orb from '@/components/ui/Orb';
import PressedMark from '@/components/ui/PressedMark';
import MoonGlyph from '@/components/ui/MoonGlyph';
import ScreenGlow from '@/components/ui/ScreenGlow';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';
import HounaMark from '@/components/HounaMark';
import NightStars from '@/components/home/NightStars';
import BadgeGem from '@/components/badges/BadgeGem';
import KuficRing from '@/components/profile/KuficRing';
import YourSky from '@/components/profile/YourSky';
import MonthRidges from '@/components/profile/MonthRidges';
import { useMonthPractice } from '@/hooks/useMonthPractice';
import { useBadgeCheck } from '@/hooks/useBadgeCheck';

/** The body at the ring's centre: the theme's own sun or moon, as a lit disc with the mark pressed in (pressed-kit's discs). */
const DISC: Record<ColorScheme, { stops: [string, number][]; surface: string; glow: string }> = {
  sunrise: { stops: [['#FFF9F1', 0], ['#FFE9D3', 0.52], ['#FBC8A3', 0.82], ['#F9A980', 1]], surface: '#FBC8A3', glow: '#F9A980' },
  day: { stops: [['#FFF3E4', 0], ['#FFD9B3', 0.5], ['#F5B08A', 0.8], ['#E4826A', 1]], surface: '#F5B08A', glow: '#EC8C6E' },
  night: { stops: [['#D9FAF6', 0], ['#6FD6CF', 0.55], ['#2E8F8A', 1]], surface: '#6FD6CF', glow: '#6FD6CF' },
};
const AVATAR = 108;

/**
 * Profile (canvas "Phase 6 — Profile: the Kufic ring"), opened from Home's top-right button. The
 * ring reads هُنا · نتنفّس معًا, "here · we breathe together", turning slowly round the theme's own
 * body with the mark pressed in (or the person's photo). Then, for an Alias: three numbers (the
 * practice streak, sessions this month, badges) and the badges held, lit in their gems, the next
 * one waiting unlit. For everyone, from the phone's own log: Your sky (a star for each day
 * practised this month) and Your month in breath (the month's minutes as ridges). Then My results,
 * Recap and Stats, one tap away, and the settings: language, appearance, notifications, journal
 * export, sign out. Guests keep the claim-an-alias card in place of the name, numbers and badges.
 */
export default function ProfileScreen() {
  const { colors, scheme, isNight } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t, fonts, isRTL, language, setLanguage } = useLanguage();
  const { profile, signOut, isGuest, needsUsername } = useAuth();
  const p = t.profile;
  const b = t.badges;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [streak, setStreak] = useState(0);
  const [serverStreak, setServerStreak] = useState(0);
  const [held, setHeld] = useState<Map<string, string> | null>(null);
  const [resultCount, setResultCount] = useState(0);
  const [exportFailed, setExportFailed] = useState(false);
  const month = useMonthPractice();

  const loadBadges = useCallback(() => {
    if (!profile) return;
    getMyBadges().then(setHeld).catch(() => {});
    getMyStreak()
      .then((s) => setServerStreak(s.current))
      .catch(() => {});
  }, [profile]);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      sessionDays()
        .then((days) => alive && setStreak(computeStreak(days).current))
        .catch(() => {});
      listResults()
        .then((rs) => alive && setResultCount(rs.length))
        .catch(() => {});
      loadBadges();
      return () => {
        alive = false;
      };
    }, [loadBadges]),
  );
  useBadgeCheck(loadBadges);

  const monthName = t.journal.dateNames.monthsLong[new Date().getMonth()];
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const go = (href: Href) => () => router.push(href);
  const onExport = () => {
    setExportFailed(false);
    exportAndShareJournal().catch(() => setExportFailed(true));
  };

  const country = profile?.country ? getCountryName(profile.country, language) : null;
  const since = profile ? p.since.replace('{month}', t.journal.dateNames.monthsLong[new Date(profile.created_at).getMonth()]) : '';
  const avatar = resolveImageUrl(profile?.avatar_url ?? null);
  const disc = DISC[scheme];
  const earned = BADGE_ORDER.filter((c) => held?.has(c));
  const next = held ? nextStreakBadge(held, serverStreak) : null;
  // The cards' inner width, for the sky and the ridges.
  const inner = Math.min(width, layout.maxContentWidth) - layout.screenPadding * 2 - 2 * 16 - 2;
  const latin = fonts.labelTracked;
  const eyebrow = (text: string, color: string) => (
    <Text style={[latin ? styles.eyebrowLatin : styles.eyebrowArabic, { color, fontFamily: latin ? fonts.labelRegular : fonts.label }]}>{text}</Text>
  );
  const card = { backgroundColor: colors.card, borderColor: colors.border };
  const stat = (glyph: React.ReactNode, value: number, label: string) => (
    <View style={styles.stat}>
      <View style={styles.statGlyph}>{glyph}</View>
      <Text style={[styles.statNumber, isRTL && styles.statNumberArabic, { color: colors.text, fontFamily: fonts.numeral }]}>{num(value)}</Text>
      {eyebrow(label, colors.textTertiary)}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top} pointerEvents="none">
          {isNight && <NightStars />}
          <ScreenGlow color={alpha(disc.glow, isNight ? 0.2 : 0.18)} rx={70} ry={50} cy={42} />
        </View>
        <View style={styles.header}>
          <IconButton
            variant="subtle"
            accessibilityLabel={p.back}
            onPress={back}
            renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
          />
        </View>

        <View style={styles.identity}>
          <KuficRing color={isNight ? alpha(colors.text, 0.72) : alpha(colors.primary, 0.78)}>
            <View style={[styles.avatar, { boxShadow: `0 0 36px ${alpha(disc.glow, 0.5)}` }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} accessibilityIgnoresInvertColors />
              ) : (
                <>
                  <Orb size={AVATAR} fx={0.5} fy={0.45} stops={disc.stops} />
                  <PressedMark size={56} surface={disc.surface} />
                </>
              )}
            </View>
          </KuficRing>
          {profile && (
            <>
              <Text accessibilityRole="header" style={[styles.username, { color: colors.text, fontFamily: fonts.display }]}>
                {profile.username}
              </Text>
              <View style={styles.countryRow}>
                <Text style={[styles.country, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                  {country ? `${country} · ${since}` : since}
                </Text>
                <Pressable accessibilityRole="link" onPress={go('/account/profile')} hitSlop={8}>
                  <Text style={[styles.country, { color: colors.primary, fontFamily: fonts.medium }]}>{country ? p.edit : p.addCountry}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>

        {profile ? (
          <View style={styles.stats}>
            {stat(<MoonGlyph date={new Date()} size={26} lit={colors.tones.dawn.fg} dark={alpha(colors.tones.dawn.fg, 0.14)} minFraction={0.3} />, streak, p.numbers.streak)}
            {stat(
              <View style={[styles.statOrb, { backgroundColor: alpha(colors.tones.glow.hue, 0.7), boxShadow: `0 0 10px ${alpha(colors.tones.glow.hue, 0.55)}` }]}>
                <View style={styles.statOrbShine} />
              </View>,
              month?.sessions.length ?? 0,
              p.numbers.month,
            )}
            {stat(
              <Svg width={28} height={28}>
                <Polygon points={star8Points(14, 14, 13)} fill={colors.tones.dusk.fg} />
              </Svg>,
              earned.length,
              p.numbers.badges,
            )}
          </View>
        ) : needsUsername ? (
          // Signed in, alias not claimed yet — finish setup (was on More's account card).
          <Pressable
            accessibilityRole="link"
            onPress={go('/account/username')}
            style={({ pressed }) => [styles.guest, card, pressed && styles.pressed]}
          >
            <HounaMark size={48} />
            <Text style={[styles.guestTitle, isRTL && styles.guestTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
              {t.account.more.finishSetupTitle}
            </Text>
            <Text style={[styles.guestBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{t.account.more.finishSetupBody}</Text>
          </Pressable>
        ) : (
          <View style={[styles.guest, card]}>
            <Text style={[styles.guestTitle, isRTL && styles.guestTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>{p.guest.title}</Text>
            <Text style={[styles.guestBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{p.guest.body}</Text>
            <View style={styles.guestButtons}>
              <Button label={p.guest.signIn} variant="secondary" onPress={go('/account/sign-in')} />
              <Button label={p.guest.createAlias} onPress={go('/account/sign-up')} />
            </View>
          </View>
        )}

        {/* The badges held (kept by Houna, so an Alias's), lit in their gems; the next one waiting. */}
        {profile && held && (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${b.title}, ${b.count.replace('{n}', num(earned.length)).replace('{m}', num(BADGE_ORDER.length))}`}
            onPress={go('/account/badges')}
            style={({ pressed }) => [styles.card, card, pressed && styles.pressed]}
          >
            <View style={styles.cardHead}>
              {eyebrow(b.title, colors.primary)}
              <View style={styles.cardHeadEnd}>
                <Text style={[styles.cardMeta, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                  {`${b.count.replace('{n}', num(earned.length)).replace('{m}', num(BADGE_ORDER.length))} · ${p.badgesCard.seeAll}`}
                </Text>
                <DirectionalIcon isRTL={isRTL} name="chevron" size={16} color={colors.textTertiary} />
              </View>
            </View>
            {earned.length > 0 ? (
              <View style={styles.gems}>
                {earned.slice(0, 4).map((c) => (
                  <View key={c} style={styles.gem}>
                    <BadgeGem code={c} size={52} />
                    <Text numberOfLines={1} style={[styles.gemName, { color: colors.text, fontFamily: fonts.regular }]}>{b.names[c]}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.cardNote, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{b.empty}</Text>
            )}
            {next && (
              <>
                <View style={[styles.rule, { backgroundColor: colors.border }]} />
                <View style={styles.next}>
                  <BadgeGem code={next.code} size={30} locked />
                  <View>
                    <Text style={[styles.nextLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{b.next}</Text>
                    <Text style={[styles.nextLine, { color: colors.text, fontFamily: fonts.regular }]}>
                      {`${b.names[next.code]} · ${arabicPlural(next.remaining, b.remaining).replace('{n}', num(next.remaining))}`}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </Pressable>
        )}

        {/* Your sky: everyone, from the phone's own log. */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={p.sky.open.replace(
            '{n}',
            month && month.practised.length > 0 ? arabicPlural(month.practised.length, p.sky.stars).replace('{n}', num(month.practised.length)) : p.sky.empty,
          )}
          onPress={go('/your-sky')}
          style={({ pressed }) => [styles.card, card, styles.skyCard, pressed && styles.pressed]}
        >
          {isNight && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <NightStars />
            </View>
          )}
          <View style={styles.cardHead}>
            {eyebrow(p.sky.eyebrow.replace('{month}', monthName), colors.primary)}
            <DirectionalIcon isRTL={isRTL} name="chevron" size={16} color={colors.textTertiary} />
          </View>
          <Text style={[styles.cardTitle, isRTL && styles.cardTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {month && month.practised.length > 0 ? arabicPlural(month.practised.length, p.sky.stars).replace('{n}', num(month.practised.length)) : p.sky.empty}
          </Text>
          {month && <YourSky dates={month.practised.map((d) => d.date)} days={month.days} width={inner} height={140} isRTL={isRTL} />}
        </Pressable>

        {/* Your month in breath: the month's minutes by part, as ridges. */}
        <View
          style={[styles.card, card]}
          accessible
          accessibilityLabel={`${p.breath.title}. ${p.breath.a11y.replace('{month}', monthName).replace('{n}', `${num(month?.minutes ?? 0)} ${arabicPlural(month?.minutes ?? 0, t.account.stats.week.unit)}`)}`}
        >
          {eyebrow(monthName, colors.primary)}
          <Text style={[styles.cardTitle, isRTL && styles.cardTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>{p.breath.title}</Text>
          {month && month.sessions.length > 0 ? (
            <>
              <View style={styles.minutes}>
                <Text style={[styles.minutesNumber, isRTL && styles.minutesNumberArabic, { color: colors.text, fontFamily: fonts.numeral }]}>{num(month.minutes)}</Text>
                <Text style={[styles.cardNote, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{arabicPlural(month.minutes, t.account.stats.week.unit)}</Text>
              </View>
              <MonthRidges byDayAndGroup={month.byDayAndGroup} today={month.today} width={inner} height={118} />
            </>
          ) : (
            <Text style={[styles.cardNote, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{p.breath.empty}</Text>
          )}
        </View>

        {/* One tap away: My results (never on this page itself, for shared phones), Recap, Stats. */}
        <View style={[styles.settings, card]}>
          <LinkRow label={p.rows.results} detail={resultCount > 0 ? num(resultCount) : undefined} onPress={go('/results')} />
          <LinkRow label={p.rows.recap.replace('{month}', monthName)} onPress={go('/recap')} last={!profile} />
          {profile && <LinkRow label={p.rows.stats} onPress={go('/account/stats')} last />}
        </View>

        <View style={[styles.settings, card]}>
          <SettingRow label={p.settings.language}>
            <Segmented
              label={p.settings.language}
              options={[
                { id: 'en', label: t.more.languageEnglish, fontFamily: 'Figtree_600SemiBold' },
                { id: 'ar', label: t.more.languageArabic, fontFamily: 'IBMPlexSansArabic_600SemiBold' },
              ]}
              value={language}
              // Switching direction reloads the app on native (LanguageContext).
              onChange={(id) => id !== language && setLanguage(id as 'en' | 'ar')}
            />
          </SettingRow>
          <AppearanceRow />
          <LinkRow label={p.settings.notifications} onPress={go('/account/notifications')} />
          <LinkRow label={p.settings.exportJournal} onPress={onExport} last />
        </View>
        {exportFailed && (
          <Text style={[styles.cardNote, { color: colors.accent, fontFamily: fonts.regular, textAlign: 'center' }]}>{p.settings.exportError}</Text>
        )}

        {!isGuest && (
          <Pressable accessibilityRole="button" onPress={() => signOut()} style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}>
            <Text style={[styles.signOutText, { color: colors.textSecondary, fontFamily: fonts.medium }]}>{p.signOut}</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <View style={[styles.row, styles.rowTall, { borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.rowLabel, { color: colors.text, fontFamily: fonts.medium }]}>{label}</Text>
      {children}
    </View>
  );
}

function AppearanceRow() {
  const { preference, setPreference } = useTheme();
  const { t } = useLanguage();
  const opts = t.profile.settings.appearanceOptions;
  return (
    <SettingRow label={t.profile.settings.appearance}>
      <Segmented
        label={t.profile.settings.appearance}
        options={APPEARANCE_OPTIONS.map((id) => ({ id, label: opts[id] }))}
        value={preference}
        onChange={(id) => setPreference(id as AppearancePreference)}
      />
    </SettingRow>
  );
}

function LinkRow({ label, detail, onPress, last }: { label: string; detail?: string; onPress: () => void; last?: boolean }) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        styles.rowLink,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
        pressed && { backgroundColor: colors.cardPressed },
      ]}
    >
      <Text style={[styles.rowLabel, { color: colors.text, fontFamily: fonts.medium }]}>{label}</Text>
      {!!detail && <Text style={[styles.rowDetail, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{detail}</Text>}
      <DirectionalIcon isRTL={isRTL} name="chevron" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

/** Pill segmented control from the Profile artboard (language, appearance). */
function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; label: string; fontFamily?: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.segmented, { backgroundColor: colors.control }]}>
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            aria-checked={selected}
            onPress={() => onChange(o.id)}
            style={[styles.segment, selected && { backgroundColor: colors.action }]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: selected ? colors.onAction : colors.textSecondary, fontFamily: o.fontFamily ?? fonts.semiBold },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}


const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    paddingBottom: 40,
    gap: 16,
  },
  top: {
    position: 'absolute',
    left: -layout.screenPadding,
    right: -layout.screenPadding,
    top: 0,
    height: 420,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
  },
  identity: {
    alignItems: 'center',
    gap: 4,
    marginTop: -24,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: AVATAR,
    height: AVATAR,
  },
  username: {
    marginTop: 4,
    fontSize: 32,
    lineHeight: 40,
  },
  countryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 8,
  },
  country: {
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statGlyph: {
    height: 28,
    justifyContent: 'center',
  },
  statOrb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
  },
  statOrbShine: {
    position: 'absolute',
    left: 5,
    top: 4,
    width: 10,
    height: 8,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  statNumber: {
    fontSize: 32,
    lineHeight: 36,
  },
  statNumberArabic: {
    fontSize: 28,
    lineHeight: 40,
  },
  guest: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  guestTitle: {
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
  },
  guestTitleArabic: {
    lineHeight: 38,
  },
  guestBody: {
    fontSize: 14.5,
    lineHeight: 14.5 * 1.5,
    textAlign: 'center',
  },
  guestButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  eyebrowLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13,
  },
  card: {
    padding: 16,
    gap: 8,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  skyCard: {
    gap: 8,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeadEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMeta: {
    fontSize: 13.5,
  },
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  cardTitleArabic: {
    lineHeight: 38,
  },
  cardNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  gems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  gem: {
    width: 72,
    alignItems: 'center',
    gap: 10,
  },
  gemName: {
    fontSize: 12,
    textAlign: 'center',
  },
  rule: {
    height: 1,
    marginVertical: 6,
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextLabel: {
    fontSize: 11,
  },
  nextLine: {
    fontSize: 14,
  },
  minutes: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  minutesNumber: {
    fontSize: 30,
    lineHeight: 34,
  },
  minutesNumberArabic: {
    fontSize: 26,
    lineHeight: 38,
  },
  settings: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
  },
  rowTall: {
    minHeight: 60,
    borderBottomWidth: 1,
  },
  rowLink: {
    minHeight: 56,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  rowDetail: {
    fontSize: 13.5,
  },
  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
  },
  segment: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13.5,
  },
  signOut: {
    alignSelf: 'center',
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
