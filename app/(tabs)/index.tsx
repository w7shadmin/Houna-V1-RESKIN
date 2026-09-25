import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { dayPalette, flatten, layout, typography } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { getTodayEntry } from '@/lib/journal';
import { ACTIVITY_PERIODS, fetchCommunityActivity, type CommunityActivity } from '@/lib/communityActivity';
import { CommunityDotMap } from '@/components/community/WorldMap';
import Logo from '@/components/Logo';
import MarkHalo from '@/components/starfield/MarkHalo';
import { useStarfield } from '@/contexts/StarfieldContext';
import { NATIVE } from '@/hooks/useCalmLoop';
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

  // The Houna starfield (Night only): tapping the mark fades everything else
  // away, then hands the mark over to the starfield, drawn at exactly this spot.
  const starfield = useStarfield();
  const starfieldRef = useRef(starfield);
  starfieldRef.current = starfield;
  const haloRef = useRef<View>(null);
  const away = useRef(false);

  const openStarfield = () => {
    const sf = starfieldRef.current;
    if (!sf || away.current) return;
    away.current = true;
    sf.setChromeHidden(true);
    Animated.timing(sf.chrome, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start(() => {
      haloRef.current?.measureInWindow((x, y, w, hgt) => {
        // The starfield draws its moon over this exact spot, then hides this mark (haloHidden).
        router.push({ pathname: '/starfield', params: { x: String(x + w / 2), y: String(y + hgt / 2) } });
      });
    });
  };

  // Back from the starfield: its moon has returned to this spot and shown our mark again
  // just before leaving, so bring the rest of Home (the ring and the tab bar too) back.
  useFocusEffect(
    useCallback(() => {
      const sf = starfieldRef.current;
      if (!sf || !away.current) return;
      away.current = false;
      Animated.timing(sf.chrome, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }).start(() =>
        sf.setChromeHidden(false),
      );
    }, []),
  );
  const chrome = starfield
    ? { style: { opacity: starfield.chrome }, pointerEvents: (starfield.chromeHidden ? 'none' : 'auto') as 'none' | 'auto' }
    : { style: null, pointerEvents: 'auto' as const };

  const pickPeriod = (i: number) => {
    setAutoRotate(false);
    setPeriod(i);
  };

  const accent = colors.primary;
  // Night surfaces are glassy (translucent); over the stars they'd let stars
  // show through. Pre-blend them onto the background so the sky stays behind.
  const solid = (c: string) => (isNight ? flatten(c, colors.background) : c);
  const topButton = { backgroundColor: solid(colors.control) };
  const labelLatin = fonts.labelTracked;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isNight && <Stars />}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.topGlowWrap, chrome.style]} pointerEvents="none">
          <TopGlow color={colors.glow} />
        </Animated.View>

        {/* Top bar */}
        <Animated.View style={[styles.topBar, chrome.style]} pointerEvents={chrome.pointerEvents}>
          <View>
            <IconButton
              variant="subtle"
              style={topButton}
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
            style={topButton}
            accessibilityLabel={h.topBar.profile}
            onPress={() => router.push('/profile')}
            renderIcon={(c) => <CanvasIcon name="profile" size={20} strokeWidth={1.7} color={c} />}
          />
        </Animated.View>

        {/* Mark, "You're not alone", rotating line */}
        <View style={styles.hero}>
          {/* In Night the mark opens the Houna starfield; in Day it's decoration. */}
          <Pressable
            onPress={openStarfield}
            disabled={!isNight}
            accessibilityRole={isNight ? 'button' : undefined}
            accessibilityLabel={isNight ? h.starfield.open : undefined}
          >
            <View ref={haloRef} collapsable={false} style={starfield?.haloHidden && styles.hidden}>
              {/* Day: the logo's deeper teal, a little stronger — the pale Night glow vanishes on Daybreak. */}
              <MarkHalo
                accent={accent}
                dusk={colors.tones.dusk.fg}
                glow={isNight ? colors.glow : dayPalette.hounaTeal}
                glowStrength={isNight ? 0.4 : 0.5}
                ringOpacity={starfield?.chrome}
              />
            </View>
          </Pressable>
          <Animated.View style={[styles.heroText, chrome.style]} pointerEvents={chrome.pointerEvents}>
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
          </Animated.View>
        </View>

        <Animated.View style={[styles.lower, chrome.style]} pointerEvents={chrome.pointerEvents}>
        {/* Community card */}
        <Card variant="feature" style={[styles.community, { backgroundColor: solid(colors.card) }]}>
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
            { backgroundColor: solid(colors.crisis.bg), borderColor: colors.crisis.border },
            pressed && styles.pressed,
          ]}
        >
          <CanvasIcon name="phone" size={16} strokeWidth={1.8} color={colors.crisis.icon} />
          <Text style={[styles.crisisText, isRTL && styles.crisisTextArabic, { color: colors.text, fontFamily: fonts.medium }]}>
            {h.crisisButton}
          </Text>
        </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ──────────────── Decorative layers (canvas values) ──────────────── */

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

/**
 * Night sky on a 390×380 tile, repeated down the screen: the canvas's seven
 * stars, plus a scatter of fainter, smaller ones (fixed seed, so the sky is
 * the same every visit) for depth.
 */
const CANVAS_STARS: { x: number; y: number; r: number; o: number }[] = [
  { x: 24, y: 40, r: 1.3, o: 0.55 },
  { x: 150, y: 96, r: 1.3, o: 0.35 },
  { x: 300, y: 30, r: 1.5, o: 0.5 },
  { x: 80, y: 230, r: 1.3, o: 0.3 },
  { x: 350, y: 190, r: 1.3, o: 0.45 },
  { x: 220, y: 300, r: 1.3, o: 0.25 },
  { x: 120, y: 350, r: 1.1, o: 0.4 },
];

const FAINT_STARS = (() => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 16 }, () => ({
    x: Math.round(rand() * 390),
    y: Math.round(rand() * 380),
    r: +(0.6 + rand() * 0.6).toFixed(2),
    o: +(0.12 + rand() * 0.28).toFixed(2),
  }));
})();

const STAR_TILE = [...CANVAS_STARS, ...FAINT_STARS];

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
  topGlowWrap: {
    ...StyleSheet.absoluteFillObject,
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
    gap: 12,
  },
  hidden: {
    opacity: 0,
  },
  heroText: {
    alignItems: 'center',
    gap: 12,
  },
  lower: {
    gap: 12,
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
    padding: 4,
    borderRadius: 999,
  },
  period: {
    height: 28,
    paddingHorizontal: 12,
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
    gap: 4,
    paddingBottom: 4,
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
    paddingHorizontal: 16,
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
