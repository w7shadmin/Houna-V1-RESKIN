import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { layout, typography } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { getTodayEntry } from '@/lib/journal';
import { ACTIVITY_PERIODS, fetchCommunityActivity, type CommunityActivity } from '@/lib/communityActivity';
import { CommunityDotMap } from '@/components/community/WorldMap';
import Logo from '@/components/Logo';
import HounaMark from '@/components/HounaMark';
import MoodBloom, { HOME_BLOOM } from '@/components/mood/MoodBloom';
import Card from '@/components/ui/Card';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon from '@/components/ui/CanvasIcon';

/** Canvas: the period (and its line) advances every 4.5s until someone picks one. */
const ROTATE_MS = 4500;

/**
 * Home — one screen, no scroll on a typical phone (canvas "Home — English"
 * / "Home — Arabic", Night and Day). Top bar (mood check-in, wordmark,
 * profile), the mark with its ring, "You're not alone" and a rotating line,
 * the community card, and the crisis button, which stays on Home by design
 * (CLAUDE.md: crisis resources are never buried).
 */
export default function HomeScreen() {
  const { colors, isNight } = useTheme();
  const { t, isRTL, fonts } = useLanguage();
  const router = useRouter();
  const h = t.home;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [period, setPeriod] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [activity, setActivity] = useState<(CommunityActivity | null | undefined)[]>([]);
  const [moodPending, setMoodPending] = useState(false);

  // Soft amber dot on the mood button only when today has no entry — never
  // a count or streak (CLAUDE.md: no guilt mechanics on mood).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getTodayEntry()
        .then((entry) => alive && setMoodPending(!entry))
        .catch(() => alive && setMoodPending(false));
      return () => {
        alive = false;
      };
    }, []),
  );

  // Auto-advancing content must be stoppable (WCAG 2.2.2): it stops once the
  // person picks a period, and never starts with Reduce Motion on.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => reduce && setAutoRotate(false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    const id = setInterval(() => setPeriod((p) => (p + 1) % ACTIVITY_PERIODS.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [autoRotate]);

  useEffect(() => {
    let alive = true;
    ACTIVITY_PERIODS.forEach((p, i) => {
      fetchCommunityActivity(p).then((a) => {
        if (!alive) return;
        setActivity((prev) => {
          const next = [...prev];
          next[i] = a;
          return next;
        });
      });
    });
    return () => {
      alive = false;
    };
  }, []);

  const current = activity[period];
  const lit = useMemo(() => current?.countries.map((c) => c.country) ?? [], [current]);

  const pickPeriod = (i: number) => {
    setAutoRotate(false);
    setPeriod(i);
  };

  const accent = colors.primary;
  const labelLatin = fonts.labelTracked;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isNight && <Stars />}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TopGlow color={colors.glow} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <View>
            <IconButton
              variant="subtle"
              accessibilityLabel={moodPending ? h.topBar.moodCheckInPending : h.topBar.moodCheckIn}
              onPress={() => router.push('/check-in')}
              renderIcon={() => <MoodBloom size={26} color={accent} shape={HOME_BLOOM} />}
            />
            {moodPending && (
              <View
                pointerEvents="none"
                style={[
                  styles.moodDot,
                  { backgroundColor: colors.accent, boxShadow: `0 0 0 2px ${colors.background}` },
                ]}
              />
            )}
          </View>
          <View accessible accessibilityRole="image" accessibilityLabel={h.topBar.logo}>
            <Logo variant="themed" width={64} />
          </View>
          <IconButton
            variant="subtle"
            accessibilityLabel={h.topBar.profile}
            onPress={() => router.push('/profile')}
            renderIcon={(c) => <CanvasIcon name="profile" size={20} strokeWidth={1.7} color={c} />}
          />
        </View>

        {/* Mark, "You're not alone", rotating line */}
        <View style={styles.hero}>
          <MarkHalo accent={accent} dusk={colors.tones.dusk.fg} glow={colors.glow} />
          <View style={styles.notAloneRow}>
            <View style={[styles.notAloneDot, { backgroundColor: accent }]} />
            <Text
              style={[
                labelLatin ? styles.notAloneLatin : styles.notAloneArabic,
                { color: accent, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
              ]}
            >
              {h.hero.badge}
            </Text>
          </View>
          <Text
            accessibilityLiveRegion={autoRotate ? 'none' : 'polite'}
            style={[
              isRTL ? styles.lineArabic : styles.lineLatin,
              { color: colors.text, fontFamily: fonts.display },
            ]}
          >
            {h.lines[period]}
          </Text>
        </View>

        {/* Community card */}
        <Card variant="feature" style={styles.community}>
          <View style={styles.communityHead}>
            <Text
              style={[
                labelLatin ? styles.sectionLabelLatin : styles.sectionLabelArabic,
                { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
              ]}
            >
              {h.community.label}
            </Text>
            <View
              accessibilityRole="tablist"
              accessibilityLabel={h.community.periodsLabel}
              style={[styles.periods, { backgroundColor: colors.control }]}
            >
              {h.community.periods.map((label, i) => {
                const selected = i === period;
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="tab"
                    aria-selected={selected}
                    onPress={() => pickPeriod(i)}
                    hitSlop={{ top: 8, bottom: 8 }}
                    style={[styles.period, selected && { backgroundColor: colors.action }]}
                  >
                    <Text
                      style={[
                        labelLatin ? styles.periodLatin : styles.periodArabic,
                        {
                          color: selected ? colors.onAction : colors.textTertiary,
                          fontFamily: labelLatin ? fonts.labelRegular : fonts.label,
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <CommunityDotMap lit={lit} accent={accent} dotColor={colors.mapLand} variant="solid" />

          {current ? (
            <View style={styles.countRow}>
              <Text style={[styles.count, isRTL && styles.countArabic, { color: accent, fontFamily: fonts.display }]}>
                {num(current.totalPeople)}
              </Text>
              <View style={styles.countText}>
                <Text
                  style={[
                    styles.countSentence,
                    isRTL && styles.countSentenceArabic,
                    { color: colors.text, fontFamily: fonts.regular },
                  ]}
                >
                  {arabicPlural(current.totalPeople, h.community.people).replace(
                    '{period}',
                    h.community.periodText[period],
                  )}
                </Text>
                <Text
                  style={[
                    labelLatin ? styles.countriesLatin : styles.countriesArabic,
                    { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.regular },
                  ]}
                >
                  {arabicPlural(current.countries.length, h.community.countries).replace(
                    '{n}',
                    num(current.countries.length),
                  )}
                </Text>
              </View>
            </View>
          ) : (
            current === null && (
              <Text style={[styles.unavailable, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {h.community.unavailable}
              </Text>
            )
          )}
        </Card>

        {/* Crisis — always here, never behind navigation. */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/crisis')}
          style={({ pressed }) => [
            styles.crisis,
            { backgroundColor: colors.crisis.bg, borderColor: colors.crisis.border },
            pressed && styles.pressed,
          ]}
        >
          <CanvasIcon name="phone" size={16} strokeWidth={1.8} color={colors.crisis.icon} />
          <Text style={[styles.crisisText, isRTL && styles.crisisTextArabic, { color: colors.text, fontFamily: fonts.medium }]}>
            {h.crisisButton}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ──────────────── Decorative layers (canvas values) ──────────────── */

/** The 28-dot ring around the mark: first half brand accent, second half Dusk, swelling toward the sides. */
function MarkHalo({ accent, dusk, glow }: { accent: string; dusk: string; glow: string }) {
  const N = 28;
  const R = 86;
  const C = 95;
  const dots = Array.from({ length: N }, (_, i) => {
    const t = i / N;
    const a = t * Math.PI * 2 - Math.PI / 2;
    const s = 2.5 + 4 * Math.sin(t * Math.PI);
    return {
      cx: C + R * Math.cos(a),
      cy: C + R * Math.sin(a),
      r: s / 2,
      o: 0.22 + 0.78 * Math.sin(t * Math.PI),
      c: i < N / 2 ? accent : dusk,
    };
  });

  return (
    <View style={styles.halo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={190} height={190} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="markGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={glow} stopOpacity={0.45} />
            <Stop offset="1" stopColor={glow} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {dots.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={d.c} opacity={d.o} />
        ))}
        <Circle cx={95} cy={95} r={55} fill="url(#markGlow)" />
      </Svg>
      <HounaMark size={70} />
    </View>
  );
}

/** Soft brand glow behind the top of the screen (380×330 ellipse, 18% → 0). */
function TopGlow({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={styles.topGlow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={380} height={330}>
        <Defs>
          <RadialGradient id="topGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.18} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={190} cy={165} rx={190} ry={165} fill="url(#topGlow)" />
      </Svg>
    </View>
  );
}

/** Night sky: the canvas's seven stars on a 390×380 tile, repeated down the screen. */
const STAR_TILE: { x: number; y: number; r: number; o: number }[] = [
  { x: 24, y: 40, r: 1.3, o: 0.55 },
  { x: 150, y: 96, r: 1.3, o: 0.35 },
  { x: 300, y: 30, r: 1.5, o: 0.5 },
  { x: 80, y: 230, r: 1.3, o: 0.3 },
  { x: 350, y: 190, r: 1.3, o: 0.45 },
  { x: 220, y: 300, r: 1.3, o: 0.25 },
  { x: 120, y: 350, r: 1.1, o: 0.4 },
];

function Stars() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const tilesX = Math.ceil(width / 390);
  const tilesY = Math.ceil(height / 380);
  const stars = [];
  for (let ty = 0; ty < tilesY; ty++)
    for (let tx = 0; tx < tilesX; tx++)
      for (const s of STAR_TILE) stars.push({ ...s, x: s.x + tx * 390, y: s.y + ty * 380 });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={colors.text} opacity={s.o} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingTop: 16,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
    gap: 12,
  },
  topGlow: {
    position: 'absolute',
    top: 30,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodDot: {
    position: 'absolute',
    top: 2,
    end: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hero: {
    alignItems: 'center',
    gap: 10,
  },
  halo: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notAloneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notAloneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notAloneLatin: {
    fontSize: typography.label.fontSize,
    letterSpacing: typography.label.letterSpacing,
    textTransform: 'uppercase',
  },
  notAloneArabic: {
    fontSize: 14,
  },
  lineLatin: {
    minHeight: 50,
    maxWidth: 320,
    fontSize: 20,
    lineHeight: 25,
    textAlign: 'center',
  },
  lineArabic: {
    minHeight: 50,
    maxWidth: 320,
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'center',
  },
  community: {
    gap: 12,
  },
  communityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabelLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
  },
  sectionLabelArabic: {
    fontSize: 13,
  },
  periods: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    borderRadius: 999,
  },
  period: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.08,
    textTransform: 'uppercase',
  },
  periodArabic: {
    fontSize: 12.5,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  count: {
    fontSize: 36,
    lineHeight: 36,
  },
  countArabic: {
    lineHeight: 50,
  },
  countText: {
    flex: 1,
    gap: 3,
    paddingBottom: 2,
  },
  countSentence: {
    fontSize: 14,
    lineHeight: 14 * 1.3,
  },
  countSentenceArabic: {
    lineHeight: 21,
  },
  countriesLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.1,
    textTransform: 'uppercase',
  },
  countriesArabic: {
    fontSize: 12.5,
  },
  unavailable: {
    fontSize: 14,
    lineHeight: 20,
  },
  crisis: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
  crisisText: {
    fontSize: 14,
  },
  crisisTextArabic: {
    fontSize: 14.5,
  },
  pressed: {
    opacity: 0.85,
  },
});
