import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { alpha, dayPalette, layout, nightPalette } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { loadEntries, type MoodTag } from '@/lib/journal';
import { MOOD_STYLE } from '@/constants/moods';
import { sessionsBetween } from '@/lib/sessionLog';
import { computeRecap, periodBounds, type Recap, type RecapPeriod } from '@/lib/recap/compute';
import { fetchCommunityActivity, type CommunityActivity } from '@/lib/communityActivity';
import HounaMark from '@/components/HounaMark';
import Orb from '@/components/ui/Orb';
import ScreenGlow from '@/components/ui/ScreenGlow';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon from '@/components/ui/CanvasIcon';

type SlideKey = 'intro' | 'breathing' | 'meditation' | 'journal' | 'moods' | 'community' | 'share';

/* ──────────────── Canvas values ("Recap (tap through)", Night + Day) ──────────────── */

const N = nightPalette;
const GLOW = { teal: N.hounaGlow, dusk: N.dusk, dawn: N.dawn };

/** Per-slide ground and glows, verbatim from the canvas's BGS lists. */
const SLIDE_STYLE: Record<
  SlideKey,
  { night: string; day: string; glows: { c: string; a: number; rx: number; ry: number; cx: number; cy: number }[] }
> = {
  intro: { night: N.midnight, day: dayPalette.daybreak, glows: [{ c: GLOW.teal, a: 0.3, rx: 80, ry: 50, cx: 50, cy: 38 }] },
  breathing: { night: '#0E1E38', day: '#DCF0ED', glows: [{ c: GLOW.teal, a: 0.4, rx: 90, ry: 60, cx: 50, cy: 30 }] },
  meditation: { night: N.nightfall, day: '#FBF8F2', glows: [{ c: GLOW.dusk, a: 0.4, rx: 90, ry: 60, cx: 50, cy: 30 }] },
  journal: { night: N.midnight, day: dayPalette.daybreak, glows: [{ c: GLOW.dawn, a: 0.32, rx: 90, ry: 60, cx: 50, cy: 30 }] },
  moods: {
    night: '#10173A',
    day: dayPalette.paleFill,
    glows: [
      { c: GLOW.dusk, a: 0.3, rx: 70, ry: 50, cx: 30, cy: 30 },
      { c: GLOW.teal, a: 0.28, rx: 70, ry: 50, cx: 70, cy: 70 },
    ],
  },
  community: { night: N.midnight, day: dayPalette.daybreak, glows: [{ c: GLOW.teal, a: 0.34, rx: 80, ry: 50, cx: 50, cy: 36 }] },
  share: { night: N.nightfall, day: '#FBF8F2', glows: [{ c: GLOW.dusk, a: 0.34, rx: 90, ry: 60, cx: 50, cy: 40 }] },
};

/** Emotional-landscape orb slots, largest first (colours come from constants/moods.ts). */
const ORB_SLOTS = [
  { x: 150, y: 70, s: 96 },
  { x: 40, y: 40, s: 74 },
  { x: 60, y: 140, s: 62 },
  { x: 210, y: 180, s: 50 },
  { x: 140, y: 190, s: 42 },
  { x: 240, y: 30, s: 34 },
  { x: 20, y: 215, s: 30 },
  { x: 255, y: 110, s: 26 },
];

const EXERCISE_KEYS = {
  'anxiety-relief': 'anxietyRelief',
  'steady-mind': 'steadyMind',
  'panic-relief': 'panicRelief',
  'tension-release': 'tensionRelease',
} as const;

/**
 * Recap (FEATURES_BRIEF §6): a tap-through story of this month (or year)
 * built from the on-device session log and journal, so Guests get one too.
 * Slides with nothing to show are skipped. The mood slide is descriptive
 * only, the community slide appears only with real numbers, and the share
 * card never includes journal text or moods.
 */
export default function RecapScreen() {
  const { colors, isNight } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const r = t.recap;
  const params = useLocalSearchParams<{ period?: string }>();
  const period: RecapPeriod = params.period === 'year' ? 'year' : 'month';
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [recap, setRecap] = useState<Recap | null>(null);
  const [community, setCommunity] = useState<CommunityActivity | null>(null);
  const [index, setIndex] = useState(0);

  const { from, to } = useMemo(() => periodBounds(period), [period]);
  const periodLabel = period === 'year' ? num(from.getFullYear()) : t.journal.dateNames.monthsLong[from.getMonth()];

  useEffect(() => {
    Promise.all([sessionsBetween(from, to), loadEntries()])
      .then(([sessions, entries]) => setRecap(computeRecap(sessions, entries, from, to)))
      .catch(() => setRecap(computeRecap([], [], from, to)));
    // The community RPC only covers up to a month.
    if (period === 'month') fetchCommunityActivity('month').then(setCommunity);
  }, [from, to, period]);

  const slides: SlideKey[] = useMemo(() => {
    if (!recap) return ['intro'];
    const list: SlideKey[] = ['intro'];
    if (recap.breathingMinutes > 0) list.push('breathing');
    if (recap.meditationMinutes > 0) list.push('meditation');
    if (recap.journalDays > 0) list.push('journal');
    if (recap.moods.length > 0) list.push('moods');
    if (community && community.totalPeople > 0 && list.length > 1) list.push('community');
    if (list.length > 1) list.push('share');
    return list;
  }, [recap, community]);

  const slide = slides[Math.min(index, slides.length - 1)];
  const last = index >= slides.length - 1;
  const style = SLIDE_STYLE[slide];
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const exerciseTitle = (id: string | null) =>
    id && id in EXERCISE_KEYS ? t.tanafas.exercises[EXERCISE_KEYS[id as keyof typeof EXERCISE_KEYS]].title : null;
  const sceneName = (id: string | null) =>
    id && id in t.tanafas.meditation.scenes ? t.tanafas.meditation.scenes[id as keyof typeof t.tanafas.meditation.scenes].name : null;

  const shareTitle = (profile?.username ? r.share.title.named.replace('{name}', profile.username) : r.share.title.anonymous).replace(
    '{period}',
    periodLabel,
  );
  // Only what actually happened — no "0 min" rows.
  const shareLines = recap
    ? (
        [
          [recap.breathingMinutes, r.share.breathing, r.share.minutes.replace('{n}', num(recap.breathingMinutes))],
          [recap.meditationMinutes, r.share.meditation, r.share.minutes.replace('{n}', num(recap.meditationMinutes))],
          [recap.journalDays, r.share.journal, arabicPlural(recap.journalDays, r.share.days).replace('{n}', num(recap.journalDays))],
        ] as [number, string, string][]
      )
        .filter(([n]) => n > 0)
        .map(([, k, v]) => [k, v])
    : [];

  const onShare = () => {
    // Totals only — never journal text or moods.
    Share.share({ message: [shareTitle, ...shareLines.map(([k, v]) => `${k}: ${v}`)].join('\n') }).catch(() => {});
  };

  const eyebrow = (label: string, color: string) => (
    <Text
      style={[
        fonts.labelTracked ? styles.eyebrowLatin : styles.eyebrowArabic,
        { color, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label },
      ]}
    >
      {label}
    </Text>
  );
  const bigNumber = (n: number) => (
    <Text style={[styles.big, isRTL && styles.bigArabic, { color: colors.text, fontFamily: fonts.display }]}>{num(n)}</Text>
  );
  const unit = (text: string) => <Text style={[styles.unit, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{text}</Text>;
  const cardBg = isNight ? alpha(N.moonlight, 0.07) : colors.surface;
  const factCard = (label: string, value: string) => (
    <View style={[styles.fact, { backgroundColor: cardBg, borderColor: colors.borderControlStrong }]}>
      <Text
        style={[
          fonts.labelTracked ? styles.factLabelLatin : styles.factLabelArabic,
          { color: colors.textTertiary, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.factValue, isRTL && styles.factValueArabic, { color: colors.text, fontFamily: fonts.display }]}>{value}</Text>
    </View>
  );

  let body: React.ReactNode = null;
  if (slide === 'intro') {
    const empty = recap !== null && slides.length === 1;
    body = (
      <>
        <BreathingMark />
        <Text style={[styles.introTitle, isRTL && styles.introTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
          {r.intro.title[period]}
        </Text>
        <Text style={[styles.introBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
          {empty ? r.intro.empty : r.intro.body}
        </Text>
        {empty && <Button label={r.share.done} variant="secondary" onPress={close} />}
      </>
    );
  } else if (slide === 'breathing' && recap) {
    const goTo = exerciseTitle(recap.goToExercise);
    body = (
      <>
        {eyebrow(r.breathing.eyebrow, colors.primary)}
        {bigNumber(recap.breathingMinutes)}
        {unit(arabicPlural(recap.breathingMinutes, r.breathing.unit))}
        {goTo && factCard(r.breathing.goTo, goTo)}
      </>
    );
  } else if (slide === 'meditation' && recap) {
    const fav = sceneName(recap.favouriteScene);
    body = (
      <>
        {eyebrow(r.meditation.eyebrow, colors.tones.dusk.fg)}
        {bigNumber(recap.meditationMinutes)}
        {unit(arabicPlural(recap.meditationMinutes, r.meditation.unit))}
        {fav && factCard(r.meditation.favourite, fav)}
      </>
    );
  } else if (slide === 'journal' && recap) {
    body = (
      <>
        {eyebrow(r.journal.eyebrow, colors.tones.dawn.fg)}
        {bigNumber(recap.journalDays)}
        {unit(arabicPlural(recap.journalDays, r.journal.unit))}
        {recap.wordsWritten > 0 && (
          <Text style={[styles.note, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
            {arabicPlural(recap.wordsWritten, r.journal.words).replace('{n}', num(recap.wordsWritten))}
          </Text>
        )}
      </>
    );
  } else if (slide === 'moods' && recap) {
    const max = recap.moods[0]?.count ?? 1;
    const labels = recap.moods.map((m) => t.journal.moodLabelsFull[m.mood]).join(isRTL ? '، ' : ', ');
    body = (
      <>
        {eyebrow(r.moods.eyebrow, colors.text)}
        <View style={styles.landscape} accessible accessibilityRole="image" accessibilityLabel={r.moods.a11y.replace('{list}', labels)}>
          {recap.moods.slice(0, ORB_SLOTS.length).map((m, k) => {
            const slot = ORB_SLOTS[k];
            const size = Math.max(34, Math.round(96 * Math.sqrt(m.count / max)));
            const o = MOOD_STYLE[m.mood];
            return (
              <View key={m.mood} style={{ position: 'absolute', left: slot.x + slot.s / 2 - size / 2, top: slot.y + slot.s / 2 - size / 2 }}>
                <Orb size={size} fx={0.34} fy={0.3} stops={[[o.hi, 0], [o.color, 0.55], [o.lo, 1]]} glow={`0 0 26px ${o.glow}`} />
              </View>
            );
          })}
        </View>
        <Text style={[styles.moodLine, isRTL && styles.moodLineArabic, { color: colors.text, fontFamily: fonts.display }]}>{r.moods.line}</Text>
      </>
    );
  } else if (slide === 'community' && community) {
    const k = community.countries.length;
    const countries = arabicPlural(k, r.community.countries).replace('{n}', num(k));
    body = (
      <>
        <CommunityRing />
        <Text style={[styles.communityLine, isRTL && styles.communityLineArabic, { color: colors.text, fontFamily: fonts.display }]}>
          {arabicPlural(community.totalPeople, r.community.line).replace('{n}', num(community.totalPeople)).replace('{k}', countries)}
        </Text>
      </>
    );
  } else if (slide === 'share' && recap) {
    body = (
      <>
        <View style={[styles.shareCard, { backgroundColor: cardBg, borderColor: colors.borderStrong }]}>
          <HounaMark size={56} />
          <Text style={[styles.shareTitle, isRTL && styles.shareTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>{shareTitle}</Text>
          <View style={styles.shareRows}>
            {shareLines.map(([k, v]) => (
              <View key={k} style={styles.shareRow}>
                <Text style={[styles.shareKey, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{k}</Text>
                <Text style={[styles.shareKey, { color: colors.text, fontFamily: fonts.semiBold }]}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.shareButtons}>
          <Button label={r.share.share} onPress={onShare} style={styles.flexButton} />
          <Button label={r.share.done} variant="secondary" onPress={close} style={styles.flexButton} />
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isNight ? style.night : style.day }]} edges={['top', 'bottom']}>
      {style.glows.map((g) => (
        <ScreenGlow key={`${g.cx}-${g.cy}`} color={alpha(g.c, g.a)} rx={g.rx} ry={g.ry} cx={g.cx} cy={g.cy} fade={0.7} />
      ))}

      <View style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.segments} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {slides.map((s, k) => (
              <View key={s} style={[styles.segment, { backgroundColor: k <= index ? colors.text : alpha(isNight ? N.moonlight : dayPalette.ink, 0.22) }]} />
            ))}
          </View>
          <View style={styles.headerRow}>
            {eyebrow(r.header[period].replace('{period}', periodLabel), colors.textSecondary)}
            <IconButton accessibilityLabel={r.close} onPress={close} renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />} />
          </View>
        </View>

        <View style={styles.body} accessibilityLiveRegion="polite">
          {body}
        </View>

        {!last && (
          <>
            {fonts.labelTracked ? (
              <Text style={[styles.tapLatin, { color: colors.textTertiary, fontFamily: fonts.labelRegular }]}>{r.tapToContinue}</Text>
            ) : (
              <Text style={[styles.tapArabic, { color: colors.textTertiary, fontFamily: fonts.label }]}>{r.tapToContinue}</Text>
            )}
            {/* Story taps: the reading-start third goes back, the rest goes forward (mirrors in Arabic). */}
            <View style={styles.tapZones}>
              <Pressable style={styles.tapBack} accessibilityRole="button" accessibilityLabel={r.previous} onPress={() => setIndex((i) => Math.max(0, i - 1))} />
              <Pressable style={styles.tapNext} accessibilityRole="button" accessibilityLabel={r.next} onPress={() => setIndex((i) => Math.min(slides.length - 1, i + 1))} />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/** The mark in its glow, breathing on the canvas's 6s loop (still with Reduce Motion). */
function BreathingMark() {
  const breath = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (reduce) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(breath, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            Animated.timing(breath, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          ]),
        );
        loop.start();
      })
      .catch(() => {});
    return () => loop?.stop();
  }, [breath]);
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });
  return (
    <Animated.View style={[styles.markHalo, { transform: [{ scale }] }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Orb size={150} fx={0.5} fy={0.5} stops={[[alpha(N.hounaGlow, 0.45), 0], [alpha(N.hounaGlow, 0), 0.7]]} />
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.markCenter}>
          <HounaMark size={92} />
        </View>
      </View>
    </Animated.View>
  );
}

/** 28-dot ring around the mark (community slide). */
function CommunityRing() {
  const { colors } = useTheme();
  const N_DOTS = 28;
  const R = 88;
  const C = 100;
  return (
    <View style={styles.ring} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={200} height={200} style={StyleSheet.absoluteFill}>
        {Array.from({ length: N_DOTS }, (_, k) => {
          const tt = k / N_DOTS;
          const a = tt * Math.PI * 2 - Math.PI / 2;
          const s = 2.5 + 4 * Math.sin(tt * Math.PI);
          return <Circle key={k} cx={C + R * Math.cos(a)} cy={C + R * Math.sin(a)} r={s / 2} fill={colors.primary} opacity={0.25 + 0.75 * Math.sin(tt * Math.PI)} />;
        })}
      </Svg>
      <HounaMark size={72} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingTop: 16,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 40,
  },
  top: {
    gap: 16,
    zIndex: 2,
  },
  segments: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.18,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  eyebrowArabic: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  introTitle: {
    fontSize: 42,
    lineHeight: 42 * 1.08,
    textAlign: 'center',
  },
  introTitleArabic: {
    lineHeight: 62,
  },
  introBody: {
    maxWidth: 300,
    fontSize: 16,
    lineHeight: 16 * 1.55,
    textAlign: 'center',
  },
  big: {
    fontSize: 96,
    lineHeight: 100,
  },
  bigArabic: {
    lineHeight: 130,
  },
  unit: {
    maxWidth: 280,
    fontSize: 18,
    textAlign: 'center',
  },
  note: {
    maxWidth: 290,
    marginTop: 8,
    fontSize: 14.5,
    lineHeight: 14.5 * 1.5,
    textAlign: 'center',
  },
  fact: {
    marginTop: 12,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  factLabelLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
  },
  factLabelArabic: {
    fontSize: 12.5,
  },
  factValue: {
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
  },
  factValueArabic: {
    lineHeight: 36,
  },
  // Decorative — fine to mirror in Arabic.
  landscape: {
    width: 300,
    height: 260,
  },
  moodLine: {
    maxWidth: 300,
    fontSize: 22,
    lineHeight: 22 * 1.3,
    textAlign: 'center',
  },
  moodLineArabic: {
    lineHeight: 36,
  },
  ring: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityLine: {
    maxWidth: 320,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
  },
  communityLineArabic: {
    lineHeight: 48,
  },
  shareCard: {
    width: 300,
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1,
  },
  shareTitle: {
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
  },
  shareTitleArabic: {
    lineHeight: 38,
  },
  shareRows: {
    alignSelf: 'stretch',
    gap: 12,
  },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareKey: {
    fontSize: 15,
  },
  shareButtons: {
    width: 300,
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
    alignSelf: 'auto',
  },
  tapLatin: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
  },
  tapArabic: {
    textAlign: 'center',
    fontSize: 12.5,
  },
  tapZones: {
    position: 'absolute',
    top: 110,
    bottom: 110,
    start: 0,
    end: 0,
    flexDirection: 'row',
  },
  tapBack: {
    flex: 120,
  },
  tapNext: {
    flex: 270,
  },
  markHalo: {
    width: 150,
    height: 150,
  },
  markCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
