import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { APPEARANCE_OPTIONS, THEME_FADE_MS, useTheme } from '@/contexts/ThemeContext';
import { alpha, dayPalette, flatten, layout, typography, type ColorScheme } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { getTodayEntry } from '@/lib/journal';
import { ACTIVITY_PERIODS, fetchCommunityActivity, type CommunityActivity } from '@/lib/communityActivity';
import { CommunityDotMap } from '@/components/community/WorldMap';
import ArrivingText from '@/components/ui/ArrivingText';
import MarkHalo from '@/components/starfield/MarkHalo';
import { useStarfield } from '@/contexts/StarfieldContext';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import AppearanceToggle, { STRIP_TURN_MS } from '@/components/home/AppearanceToggle';
import HomeBody, { startSkyChange, type SkyChange } from '@/components/home/HomeBody';
import HijriDate from '@/components/home/HijriDate';
import MoodBloom, { HOME_BLOOM } from '@/components/mood/MoodBloom';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon from '@/components/ui/CanvasIcon';
import NightStars from '@/components/home/NightStars';
import { useBadgeCheck } from '@/hooks/useBadgeCheck';
import { useLiveEvent } from '@/hooks/useLiveEvent';
import LiveBanner from '@/components/events/LiveBanner';

// Each rotating line stays this long: slow enough to read and settle before the next.
const ROTATE_MS = 9000;
/**
 * The map shows the past month only while testing (1 Oct 2026; 24 hours and the week come back
 * after launch: their strings and `ACTIVITY_PERIODS` stay). One figure, so every phone shows the same.
 */
const SHOWN_PERIOD = ACTIVITY_PERIODS.indexOf('month');

/**
 * Home — one screen, no scroll on a typical phone (canvas "Home — English"
 * / "Home — Arabic", Night and Day). Top bar (mood check-in, wordmark,
 * profile), the mark with its ring, "You're not alone" and a rotating line,
 * the community card, and the crisis button, which stays on Home by design
 * (CLAUDE.md: crisis resources are never buried).
 *
 * In both, the wordmark is the appearance toggle (a strip of sun · setting
 * sun · moon above it), the colours fading across on a change. Two Home
 * styles, both kept while the client decides (More → Appearance → Home):
 * "Classic", as above; and "Sun & moon" (canvas "Home — appearance"), where
 * the theme's own sun or moon stands alone in place of the mark and its ring:
 * a change sets it off the right edge, then the next rises in from the left
 * as the new colours arrive. Night's body there is the crescent bowl, the mark resting in it.
 *
 * Under the logo, the Hijri date (tonight's moon beside it) opens the month of moons; a long
 * press on the mark or body opens the sky clock (canvas "Phase 3").
 */
export default function HomeScreen() {
  const { colors, isNight, scheme, preference, setPreference, homeStyle } = useTheme();
  const sky = homeStyle === 'sky';
  const reduceMotion = useReduceMotion();
  /** A change of theme under way from the logo: where to, and in "Sun & moon" the bodies moving. */
  const [turningTo, setTurningTo] = useState<ColorScheme | null>(null);
  const [change, setChange] = useState<SkyChange | null>(null);
  const { t, isRTL, fonts } = useLanguage();
  const router = useRouter();
  const h = t.home;
  // A badge earned in a session arrives as Home comes back into view.
  useBadgeCheck();
  // A Houna event streaming on YouTube: a banner over the map from an hour before until it ends.
  const live = useLiveEvent();
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const period = SHOWN_PERIOD;
  const [line, setLine] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [current, setCurrent] = useState<CommunityActivity | null | undefined>(undefined);
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
  // person taps the line, and never starts with Reduce Motion on.
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => reduce && setAutoRotate(false))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    const id = setInterval(() => setLine((l) => (l + 1) % h.lines.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [autoRotate, h.lines.length]);

  useEffect(() => {
    let alive = true;
    fetchCommunityActivity(ACTIVITY_PERIODS[SHOWN_PERIOD]).then((a) => alive && setCurrent(a));
    return () => {
      alive = false;
    };
  }, []);
  const lit = useMemo(() => current?.countries.map((c) => c.country) ?? [], [current]);

  // The Houna starfield (Night), sunrise (Sunrise) and dusk (Dusk): tapping the mark fades
  // everything else away, then hands the mark over to the scene, drawn at exactly this spot.
  const scene = isNight ? ('/starfield' as const) : scheme === 'sunrise' ? ('/sunrise' as const) : ('/dusk' as const);
  const sceneLabel = scene === '/starfield' ? h.starfield.open : scene === '/sunrise' ? h.sunrise.open : h.dusk.open;
  const starfield = useStarfield();
  const starfieldRef = useRef(starfield);
  starfieldRef.current = starfield;
  const localHalo = useRef<View>(null);
  // Shared, so the splash can find the body it hands over to.
  const haloRef = starfield?.homeBody ?? localHalo;
  const away = useRef(false);

  const openScene = () => {
    const sf = starfieldRef.current;
    if (!sf || away.current) return;
    away.current = true;
    sf.setChromeHidden(true);
    Animated.timing(sf.chrome, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start(() => {
      haloRef.current?.measureInWindow((x, y, w, hgt) => {
        // The scene draws its moon or sun over this exact spot, then hides this mark (haloHidden).
        // "Sun & moon": Home already shows the scene's body (Night's moon too), so the scene
        // starts with it whole, at this spot and size.
        router.push({
          pathname: scene,
          params: {
            x: String(x + w / 2),
            y: String(y + hgt / 2),
            // The anchor: where the scene's moon or sun settles, the centre of the mark's box.
            ay: String(y + hgt / 2),
            ...(sky ? { body: '1' } : {}),
          },
        });
      });
    });
  };

  // Back from the scene: its moon or sun has returned to this spot and shown our mark again
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

  // The logo (both styles): the next theme, through the day, the colours fading across. In
  // "Sun & moon" the body sets first, and the next rises as the new colours arrive.
  const nextTheme = APPEARANCE_OPTIONS[(APPEARANCE_OPTIONS.indexOf(preference) + 1) % APPEARANCE_OPTIONS.length];
  const themeNames = t.profile.settings.appearanceOptions;
  const cycleTheme = () => {
    if (turningTo) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    const to = nextTheme;
    setTurningTo(to);
    // The crossfade starts from a picture of the screen, so let the strip finish its turn (and
    // that frame be drawn) first; a picture taken mid-turn would show it jumping back.
    const turned = Date.now() + STRIP_TURN_MS + 50;
    const switchColours = () =>
      new Promise((ready) => setTimeout(ready, Math.max(0, turned - Date.now()))).then(() => setPreference(to));
    let done: Promise<unknown>;
    if (sky) {
      const run = startSkyChange(preference, to, reduceMotion, switchColours);
      setChange(run.change);
      done = run.done;
    } else {
      done = switchColours().then(() => new Promise((settled) => setTimeout(settled, THEME_FADE_MS)));
    }
    done.finally(() => {
      setChange(null);
      setTurningTo(null);
    });
  };

  const nextLine = () => {
    setAutoRotate(false);
    setLine((l) => (l + 1) % h.lines.length);
  };

  const accent = colors.primary;
  // Night surfaces are glassy (translucent); over the stars they'd let stars
  // show through. Pre-blend them onto the background so the sky stays behind.
  const solid = (c: string) => (isNight ? flatten(c, colors.background) : c);
  const topButton = { backgroundColor: solid(colors.control) };
  const labelLatin = fonts.labelTracked;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isNight && <NightStars />}

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
          <AppearanceToggle
            current={turningTo ?? preference}
            onPress={cycleTheme}
            disabled={!!turningTo}
            accessibilityLabel={h.topBar.appearanceToggle.replace('{current}', themeNames[preference]).replace('{next}', themeNames[nextTheme])}
          />
          <IconButton
            variant="subtle"
            style={topButton}
            accessibilityLabel={h.topBar.profile}
            onPress={() => router.push('/profile')}
            renderIcon={(c) => <CanvasIcon name="profile" size={20} strokeWidth={1.7} color={c} />}
          />
        </Animated.View>

        {/* The Hijri date, tonight's moon beside it: opens the month of moons. */}
        <Animated.View style={[styles.hijri, chrome.style]} pointerEvents={chrome.pointerEvents}>
          <HijriDate />
        </Animated.View>

        {/* Mark, "You're not alone", rotating line */}
        <View style={styles.hero}>
          {/* The mark opens this theme's scene: the starfield, the sunrise or the dusk. */}
          <Pressable
            onPress={openScene}
            accessibilityRole="button"
            accessibilityLabel={sceneLabel}
          >
            <View ref={haloRef} collapsable={false} style={starfield?.haloHidden && styles.hidden}>
              {/* Day: the logo's deeper teal, a little stronger — the pale Night glow vanishes on Daybreak. */}
              {sky ? (
                <HomeBody scheme={scheme} change={change} reduceMotion={reduceMotion} />
              ) : (
                <MarkHalo
                  accent={accent}
                  dusk={colors.tones.dusk.fg}
                  glow={isNight ? colors.glow : dayPalette.hounaTeal}
                  glowStrength={isNight ? 0.4 : 0.5}
                  ringOpacity={starfield?.chrome}
                  kufic={isNight ? alpha(colors.text, 0.72) : alpha(colors.primary, 0.78)}
                />
              )}
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
          {/* Each line arrives: letter by letter in English, word by word in Arabic. */}
          <Pressable
            onPress={nextLine}
            accessibilityRole="button"
            accessibilityHint={h.community.nextLine}
            accessibilityLiveRegion={autoRotate ? 'none' : 'polite'}
            style={styles.lineBox}
          >
            <ArrivingText
              isRTL={isRTL}
              style={[isRTL ? styles.lineArabic : styles.lineLatin, { color: colors.text, fontFamily: fonts.display }]}
            >
              {h.lines[line]}
            </ArrivingText>
          </Pressable>
          </Animated.View>
        </View>

        <Animated.View style={[styles.lower, chrome.style]} pointerEvents={chrome.pointerEvents}>
        <LiveBanner event={live.event} state={live.state} />
        {/* Breathing together: the map, its periods and the count, straight on the sky (canvas "Round 2 —
            Home's map without its card"); the card's room is kept, so nothing else moves. */}
        <View style={styles.community}>
          <View style={styles.communityHead}>
            <Text
              style={[
                labelLatin ? styles.sectionLabelLatin : styles.sectionLabelArabic,
                { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
              ]}
            >
              {h.community.label}
            </Text>
            {/* The period chooser (24H · Week · Month) is off while testing: the month only. */}
            <View style={[styles.periods, { backgroundColor: colors.control }]}>
              <View style={[styles.period, { backgroundColor: colors.action }]}>
                <Text
                  style={[
                    labelLatin ? styles.periodLatin : styles.periodArabic,
                    { color: colors.onAction, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
                  ]}
                >
                  {h.community.periods[period]}
                </Text>
              </View>
            </View>
          </View>

          <CommunityDotMap lit={lit} accent={accent} dotColor={colors.mapLand} variant="solid" />

          {current ? (
            <View style={styles.countRow}>
              <Text style={[styles.count, isRTL && styles.countArabic, { color: accent, fontFamily: fonts.numeral }]}>
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
        </View>

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
  hijri: {
    alignItems: 'center',
    // The body's box is mostly sky at the top: let the date sit into it a little.
    marginBottom: -8,
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
  lineBox: {
    minHeight: 50,
    maxWidth: 320,
    justifyContent: 'center',
  },
  lineLatin: {
    fontSize: 20,
    lineHeight: 25,
  },
  lineArabic: {
    fontSize: 22,
    lineHeight: 32,
  },
  community: {
    gap: 12,
    // The card's own padding, kept: the map, chips and count stay where they were.
    padding: 16,
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
