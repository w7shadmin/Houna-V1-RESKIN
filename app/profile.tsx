import React, { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, type AppearancePreference } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { alpha, layout, nightPalette } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { getCountryName } from '@/lib/countries';
import { exportAndShareJournal, formatEntryDateShort, localDateString } from '@/lib/journal';
import { computeStreak } from '@/lib/streaks';
import { sessionDays } from '@/lib/sessionLog';
import { listResults, type StoredResult } from '@/lib/psychometrics/results';
import { getTest } from '@/constants/psychometrics';
import { resolveImageUrl } from '@/lib/hounaApi';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import IconTile from '@/components/ui/IconTile';
import Orb from '@/components/ui/Orb';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';
import HounaMark from '@/components/HounaMark';
import RadarChart from '@/components/discover/RadarChart';

/**
 * Profile (FEATURES_BRIEF §7, canvas "Profile"), opened from Home's
 * top-right button. Members see their identity, the recap card, their
 * latest self-reflection traits and practice streak; Guests get a
 * claim-an-alias card instead (the recap card too — Recap works on-device
 * for everyone). Settings live here: language, appearance, notifications,
 * community map, journal export, sign out.
 */
export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL, language, setLanguage } = useLanguage();
  const { profile, signOut } = useAuth();
  const p = t.profile;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [latest, setLatest] = useState<StoredResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [exportFailed, setExportFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      listResults()
        .then((rs) => alive && setLatest(rs.find((r) => getTest(r.testId)) ?? null))
        .catch(() => {});
      sessionDays()
        .then((days) => alive && setStreak(computeStreak(days).current))
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, []),
  );

  const month = t.journal.dateNames.monthsLong[new Date().getMonth()];
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const go = (href: Href) => () => router.push(href);

  const onExport = () => {
    setExportFailed(false);
    exportAndShareJournal().catch(() => setExportFailed(true));
  };

  const latin = fonts.labelTracked;
  const eyebrow = (text: string, color: string) => (
    <Text
      style={[
        latin ? styles.eyebrowLatin : styles.eyebrowArabic,
        { color, fontFamily: latin ? fonts.labelRegular : fonts.label },
      ]}
    >
      {text}
    </Text>
  );

  const test = latest ? getTest(latest.testId) : undefined;
  const country = profile?.country ? getCountryName(profile.country, language) : null;
  const avatar = resolveImageUrl(profile?.avatar_url ?? null);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <IconButton
            variant="subtle"
            accessibilityLabel={p.back}
            onPress={back}
            renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
          />
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
            {p.title}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {profile ? (
          <View style={styles.identity}>
            <View style={[styles.avatarRing, { boxShadow: `0 0 0 4px ${colors.background}, 0 0 0 5px ${alpha(nightPalette.hounaGlow, 0.5)}` }]}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <>
                  <Orb size={92} fx={0.3} fy={0.25} stops={[['#D9FAF6', 0], [nightPalette.hounaGlow, 0.55], ['#2E8F8A', 1]]} />
                  <View style={StyleSheet.absoluteFill}>
                    <Text style={[styles.avatarInitial, { color: nightPalette.midnight, fontFamily: fonts.display }]}>
                      {profile.username.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                </>
              )}
            </View>
            <Text style={[styles.username, { color: colors.text, fontFamily: fonts.display }]}>{profile.username}</Text>
            <View style={styles.countryRow}>
              {country && (
                <Text style={[styles.country, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{country} ·</Text>
              )}
              <Pressable accessibilityRole="link" onPress={go('/account/profile')} hitSlop={8}>
                <Text style={[styles.country, { color: colors.primary, fontFamily: fonts.medium }]}>
                  {country ? p.edit : p.addCountry}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.guest, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <HounaMark size={64} />
            <Text style={[styles.guestTitle, isRTL && styles.guestTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
              {p.guest.title}
            </Text>
            <Text style={[styles.guestBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{p.guest.body}</Text>
            <View style={styles.guestButtons}>
              <Button label={p.guest.signIn} variant="secondary" onPress={go('/account/sign-in')} />
              <Button label={p.guest.createAlias} onPress={go('/account/sign-up')} />
            </View>
          </View>
        )}

        {/* Recap — everyone: it's built from this phone's own log. */}
        <Pressable
          accessibilityRole="link"
          onPress={go('/recap')}
          style={({ pressed }) => [
            styles.recap,
            { backgroundColor: colors.sheet, borderColor: alpha(nightPalette.dusk, 0.3) },
            pressed && styles.pressed,
          ]}
        >
          <RecapGlow />
          <View style={styles.recapText}>
            {eyebrow(p.recap.eyebrow.replace('{month}', month), colors.text)}
            <Text style={[styles.recapTitle, isRTL && styles.recapTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
              {p.recap.title}
            </Text>
          </View>
          <View style={[styles.recapGo, { backgroundColor: colors.action }]}>
            <DirectionalIcon isRTL={isRTL} name="arrow" size={20} strokeWidth={1.8} color={colors.onAction} />
          </View>
        </Pressable>

        {profile && latest && test && (
          <View style={[styles.card, styles.traits, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <RadarChart
              compact
              width={120}
              color={colors.tones.dusk.fg}
              axes={test.traits
                .filter((tr) => latest.scores[tr.key])
                .map((tr) => ({ label: tr.label[language], value: latest.scores[tr.key].normalised0to1 }))}
            />
            <View style={styles.cardText}>
              {eyebrow(p.traits.eyebrow, colors.tones.dusk.fg)}
              <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                {p.traits.from.replace('{test}', test.title[language])}
              </Text>
              <Text style={[styles.cardNote, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                {p.traits.taken.replace(
                  '{date}',
                  formatEntryDateShort(localDateString(new Date(latest.takenAt)), t.journal.dateNames, num),
                )}
              </Text>
              <Pressable
                accessibilityRole="link"
                hitSlop={8}
                onPress={go({ pathname: '/tanafas/discover/result/[resultId]', params: { resultId: latest.id } })}
              >
                <Text style={[styles.cardLink, { color: colors.tones.dusk.fg, fontFamily: fonts.semiBold }]}>{p.traits.view}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {profile && (
          <View style={[styles.card, styles.streak, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconTile size={46} renderIcon={(c) => <CanvasIcon name="tanafas" size={22} strokeWidth={1.6} color={c} />} />
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                {streak > 0 ? arabicPlural(streak, p.streak.title).replace('{n}', num(streak)) : p.streak.none}
              </Text>
              <Text style={[styles.cardNote, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{p.streak.note}</Text>
            </View>
            <Pressable accessibilityRole="link" onPress={go('/account/stats')} hitSlop={8}>
              <Text style={[styles.streakLink, { color: colors.primary, fontFamily: fonts.medium }]}>{p.streak.stats}</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.settings, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
          <LinkRow label={p.settings.communityMap} onPress={go('/account/community')} />
          <LinkRow label={p.settings.exportJournal} onPress={onExport} last />
        </View>
        {exportFailed && (
          <Text style={[styles.cardNote, { color: colors.accent, fontFamily: fonts.regular, textAlign: 'center' }]}>
            {p.settings.exportError}
          </Text>
        )}

        {profile && (
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
        options={(['system', 'night', 'day'] as AppearancePreference[]).map((id) => ({ id, label: opts[id] }))}
        value={preference}
        onChange={(id) => setPreference(id as AppearancePreference)}
      />
    </SettingRow>
  );
}

function LinkRow({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
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

/** Recap card glows: Dusk from the top end corner, Houna glow from the bottom start (canvas). */
function RecapGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="recapDusk" gradientUnits="userSpaceOnUse" cx={90} cy={0} rx={90} ry={120} fx={90} fy={0}>
            <Stop offset="0" stopColor={nightPalette.dusk} stopOpacity={0.55} />
            <Stop offset="0.6" stopColor={nightPalette.dusk} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="recapGlow" gradientUnits="userSpaceOnUse" cx={0} cy={100} rx={80} ry={110} fx={0} fy={100}>
            <Stop offset="0" stopColor={nightPalette.hounaGlow} stopOpacity={0.4} />
            <Stop offset="0.6" stopColor={nightPalette.hounaGlow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill="url(#recapDusk)" />
        <Rect x={0} y={0} width={100} height={100} fill="url(#recapGlow)" />
      </Svg>
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
    gap: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  identity: {
    alignItems: 'center',
    gap: 10,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 92,
    height: 92,
  },
  avatarInitial: {
    fontSize: 34,
    lineHeight: 92,
    textAlign: 'center',
  },
  username: {
    fontSize: 28,
    lineHeight: 36,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  country: {
    fontSize: 14,
  },
  guest: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 26,
    paddingHorizontal: 20,
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
    gap: 10,
  },
  recap: {
    minHeight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  recapText: {
    flex: 1,
    gap: 6,
  },
  recapTitle: {
    fontSize: 25,
    lineHeight: 25 * 1.15,
  },
  recapTitleArabic: {
    lineHeight: 38,
  },
  recapGo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  traits: {
    gap: 16,
  },
  streak: {
    gap: 14,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15.5,
  },
  cardNote: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardLink: {
    marginTop: 2,
    fontSize: 14,
  },
  streakLink: {
    fontSize: 14,
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
    fontSize: 15,
  },
  segmented: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
