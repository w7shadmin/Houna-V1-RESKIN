import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStarfield } from '@/contexts/StarfieldContext';
import { useTheme } from '@/contexts/ThemeContext';
import { dayPalette, grid, type SunScene as SunSceneTokens } from '@/constants/theme';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { stopProps } from '@/lib/svgStop';
import { useBreathingVisit, useImmersiveScene, useSceneFrame } from '@/hooks/useBreathingScene';
import MarkHalo, { HALO_BOX } from '@/components/starfield/MarkHalo';
import ShootingStars from '@/components/starfield/ShootingStars';
import SunDisc from './SunDisc';
import FirstStars from './FirstStars';

/** The sun settles a little smaller than Home's mark box (canvas: 0.9). */
const SUN_SCALE = 0.9;
/** Rising: the sun starts with its centre this far below the bottom edge (the disc hidden, its glow just showing). */
const BELOW = 131;
/** Rising: a low sun looks bigger; it eases to its settled size as it climbs. */
const LOW_SCALE = 1.15;
/** Rising: the horizon glow, an ellipse centred on the bottom edge (the canvas's 610 by 480 on a 390 screen). */
const HORIZON_HEIGHT = 240;
const HORIZON_SPAN = 305 / 390;

/** Exactly Home's mark in this theme (same colours, strength and clock), minus the ring. */
function HomeMark() {
  const { colors } = useTheme();
  return <MarkHalo accent={colors.primary} dusk={colors.tones.dusk.fg} glow={dayPalette.hounaTeal} glowStrength={0.5} showRing={false} />;
}

/** Rising: first light, a warm glow gathering along the bottom edge before the sun comes up through it. */
function HorizonGlow({ width, colors: [light, warm], shown }: { width: number; colors: [string, string]; shown: Animated.Value }) {
  const id = `horizon${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Animated.View pointerEvents="none" style={[styles.horizon, { opacity: shown }]}>
      <Svg width={width} height={HORIZON_HEIGHT}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset={0} {...stopProps(light, 0.95)} />
            <Stop offset={0.42} {...stopProps(warm, 0.55)} />
            <Stop offset={1} {...stopProps(warm, 0)} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={HORIZON_HEIGHT} rx={width * HORIZON_SPAN} ry={HORIZON_HEIGHT} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

interface SunSceneProps {
  /** The sky, the sun and where it settles (`sunriseScene` / `duskScene`). */
  scene: SunSceneTokens;
  /** The session it's logged as ("sunrise" / "dusk"; titled Tanafas in Recap). */
  session: string;
  /** The sun's spoken label: back to Home. */
  closeLabel: string;
}

/**
 * The Home-mark sun scenes: the light themes' counterparts to the Night
 * starfield (the Houna sunrise, and the Houna dusk). Home's words, card, ring and
 * tab bar have faded; here the first sky comes in (Sunrise: pre-dawn; Dusk:
 * golden hour), and the sun arrives by the scene's `entrance`. Gliding (Dusk):
 * the mark, taken over at exactly the spot it was drawn, glides down as the
 * starfield's moon does, to where this scene's sun settles (Dusk's lower, as a
 * setting sun), becoming a small sun. Rising (Sunrise): the mark fades where it
 * is, a glow gathers along the bottom edge, and the sun, the mark already pressed
 * in, comes up through it from below the screen, a touch larger while low.
 * Either way the second sky takes over as it comes
 * (morning; violet dusk, where the first faint stars then come out, with the
 * starfield's shooting stars now and then, far back behind them and the sun). The
 * sun breathes on Home's easy 5s rhythm (see SunDisc). The only word is
 * "Tanafas". Tapping the sun (or Back) reverses it all.
 */
export default function SunScene({ scene, session, closeLabel }: SunSceneProps) {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { setHaloHidden } = useStarfield()!;
  const { rootRef, frame, onLayout, from, to } = useSceneFrame(scene.settle);
  const skyA = useRef(new Animated.Value(0)).current;
  const skyB = useRef(new Animated.Value(0)).current;
  const rising = scene.entrance === 'rise';
  /** 0 → 1: the sun's way from where it starts (Home's mark, or below the bottom edge) to where it settles. */
  const glide = useRef(new Animated.Value(0)).current;
  /** 0 → 1: Home's mark becoming the sun (gliding); rising, the sun is whole from the start. */
  const sun = useRef(new Animated.Value(rising ? 1 : 0)).current;
  /** Rising: Home's mark, fading where it is. */
  const mark = useRef(new Animated.Value(1)).current;
  /** Rising: the glow gathering along the bottom edge. */
  const horizon = useRef(new Animated.Value(0)).current;
  const stars = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  /** Risen: shooting stars (Dusk) only once the sun has settled, and never with Reduce Motion. */
  const [settled, setSettled] = useState(false);
  const reduceMotion = useReduceMotion();

  // Once the mark is drawn over Home's, hide Home's (the next frame, so there's no gap), then rise.
  useEffect(() => {
    if (!frame) return;
    const raf = requestAnimationFrame(() => setHaloHidden(true));
    const timing = (v: Animated.Value, toValue: number, duration: number, delay = 0, easing = Easing.inOut(Easing.quad)) =>
      Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue, duration, easing, useNativeDriver: NATIVE })]);
    // Rising (canvas "Houna sunrise — from below", 5s): Home's mark fades where it is as pre-dawn
    // comes in; a glow gathers along the bottom edge; the sun comes up through it, a touch larger
    // while low, as the morning sky takes over. (One sequence per value, as below.)
    const rise = Animated.parallel([
      Animated.sequence([
        timing(skyA, 1, 750, 0, Easing.out(Easing.quad)),
        Animated.delay(1500),
        timing(skyA, 0, 2000),
      ]),
      timing(mark, 0, 800, 200),
      Animated.sequence([timing(horizon, 1, 1150, 600), Animated.delay(1250), timing(horizon, 0, 1500)]),
      timing(skyB, 1, 3250, 1750),
      timing(glide, 1, 3250, 1250, Easing.inOut(Easing.sin)),
    ]);
    const glideIn = Animated.parallel([
      // The first sky as the day steps back, then the second. (One sequence per value: two
      // animations on one value in a parallel would stop the lot.)
      Animated.sequence([
        Animated.timing(skyA, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
        Animated.delay(600),
        Animated.timing(skyA, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
      ]),
      timing(skyB, 1, 1500, 700),
      // The mark: the same glide as the starfield's moon, becoming the sun on the way.
      timing(glide, 1, 1400, 200, Easing.inOut(Easing.cubic)),
      timing(sun, 1, 1000, 700),
    ]);
    (rising ? rise : glideIn).start(({ finished }) => {
      if (!finished) return;
      setSettled(true);
      // The first stars (Dusk), and the label: in three seconds, then gone for the rest of the visit.
      Animated.timing(stars, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }).start();
      Animated.sequence([
        Animated.timing(word, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
        Animated.delay(3000),
        Animated.timing(word, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
      ]).start();
    });
    return () => cancelAnimationFrame(raf);
    // Once, when the frame is first known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame !== null]);

  // Every visit counts as a breathing session (Recap, streaks, the leaderboard).
  const countVisit = useBreathingVisit(session);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    countVisit();
    setSettled(false);
    word.stopAnimation();
    stars.stopAnimation();
    const timing = (v: Animated.Value, toValue: number, duration: number, delay = 0, easing = Easing.inOut(Easing.quad)) =>
      Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue, duration, easing, useNativeDriver: NATIVE })]);
    // Rising, back: the sun sinks below the edge, the pre-dawn and the glow come back and go, and
    // Home's mark returns where it was.
    const sink = Animated.parallel([
      timing(glide, 0, 2040, 340, Easing.inOut(Easing.sin)),
      timing(skyB, 0, 1700),
      Animated.sequence([timing(skyA, 0.8, 1020), Animated.delay(1020), timing(skyA, 0, 1020)]),
      Animated.sequence([timing(horizon, 0.8, 1020), timing(horizon, 0.6, 1360), timing(horizon, 0, 1020)]),
      timing(mark, 1, 680, 2380),
    ]);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(word, { toValue: 0, duration: 250, useNativeDriver: NATIVE }),
        Animated.timing(stars, { toValue: 0, duration: 400, useNativeDriver: NATIVE }),
      ]),
      rising ? sink : Animated.parallel([
        Animated.timing(glide, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.timing(sun, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(skyB, { toValue: 0, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
        ]),
      ]),
    ]).start(() => {
      // The mark is back on Home's: show Home's under it, then leave a frame later.
      setHaloHidden(false);
      requestAnimationFrame(() => requestAnimationFrame(() => router.back()));
    });
  }, [word, stars, glide, sun, skyA, skyB, mark, horizon, rising, router, setHaloHidden, countVisit]);

  // Screen on, system bars away, Android Back = tapping the sun.
  useImmersiveScene(`houna-${session}`, close);

  return (
    <View ref={rootRef} collapsable={false} onLayout={onLayout} style={[StyleSheet.absoluteFill, styles.physical]}>
      <StatusBar hidden style="dark" />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: skyA }]}>
        <LinearGradient colors={scene.skyA.colors} locations={scene.skyA.locations} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: skyB }]}>
        <LinearGradient colors={scene.skyB.colors} locations={scene.skyB.locations} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {frame && from && to && (
        <>
          {/* Shooting stars first, so the first stars (and the sun, above all this) pass in front of them. */}
          {scene.shootingStars && <ShootingStars width={frame.width} height={frame.height} active={settled && !reduceMotion} />}
          {scene.stars && <FirstStars width={frame.width} height={frame.height} color={scene.stars} shown={stars} />}

          {rising && scene.horizon && <HorizonGlow width={frame.width} colors={scene.horizon} shown={horizon} />}

          {/* The sun (gliding: the mark, becoming the sun): placed by its centre in this
              screen's own pixels (converted from Home's measurement), hence left/top. */}
          <Animated.View
            style={[
              styles.sun,
              {
                transform: [
                  { translateX: glide.interpolate({ inputRange: [0, 1], outputRange: [(rising ? to.x : from.x) - HALO_BOX / 2, to.x - HALO_BOX / 2] }) },
                  { translateY: glide.interpolate({ inputRange: [0, 1], outputRange: [(rising ? frame.height + BELOW : from.y) - HALO_BOX / 2, to.y - HALO_BOX / 2] }) },
                  {
                    scale: rising
                      ? glide.interpolate({ inputRange: [0, 0.08, 1], outputRange: [LOW_SCALE, LOW_SCALE, SUN_SCALE] })
                      : sun.interpolate({ inputRange: [0, 1], outputRange: [1, SUN_SCALE] }),
                  },
                ],
              },
            ]}
          >
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={closeLabel}>
              <SunDisc form={sun} scene={scene} />
              {/* Gliding: exactly Home's mark in this theme (same colours, strength and clock),
                  minus the ring, giving way to the sun's own. */}
              {!rising && (
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: sun.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' }) }]} pointerEvents="none" needsOffscreenAlphaCompositing>
                  <HomeMark />
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>

          {/* Rising: Home's mark stays where it was drawn, fading as the day steps back. */}
          {rising && (
            <Animated.View
              pointerEvents="none"
              needsOffscreenAlphaCompositing
              style={[styles.sun, { opacity: mark, transform: [{ translateX: from.x - HALO_BOX / 2 }, { translateY: from.y - HALO_BOX / 2 }] }]}
            >
              <HomeMark />
            </Animated.View>
          )}

          <Animated.Text
            pointerEvents="none"
            style={[
              fonts.labelTracked ? styles.wordLatin : styles.wordArabic,
              {
                bottom: grid(7),
                color: scene.word,
                fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label,
                opacity: word,
                transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
              },
            ]}
          >
            {t.tabs.tanafas}
          </Animated.Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Placed in physical screen pixels (the sun lands on Home's measured mark), so it lays out
  // left-to-right in either language, as the starfield does (Android swaps left/right in RTL).
  physical: Platform.OS === 'web' ? {} : { direction: 'ltr' },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HORIZON_HEIGHT,
  },
  sun: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: HALO_BOX,
    height: HALO_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // A quiet label, as the app's tracked labels: never competing with the sun.
  wordLatin: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 12 * 0.3,
    textTransform: 'uppercase',
  },
  wordArabic: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 14,
  },
});
