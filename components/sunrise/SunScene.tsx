import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStarfield } from '@/contexts/StarfieldContext';
import { useTheme } from '@/contexts/ThemeContext';
import { dayPalette, grid, type SunScene as SunSceneTokens } from '@/constants/theme';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { useBreathingVisit, useImmersiveScene, useSceneFrame } from '@/hooks/useBreathingScene';
import MarkHalo, { HALO_BOX } from '@/components/starfield/MarkHalo';
import ShootingStars from '@/components/starfield/ShootingStars';
import SunDisc from './SunDisc';
import FirstStars from './FirstStars';

/** The sun settles a little smaller than Home's mark box (canvas: 0.9). */
const SUN_SCALE = 0.9;

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
 * golden hour), and the mark, taken over at exactly the spot it was drawn,
 * glides down as the starfield's moon does, to where this scene's sun settles
 * (Dusk's lower, as a setting sun), becoming a small sun as the second sky takes
 * over (morning; violet dusk, where the first faint stars then come out, with the
 * starfield's shooting stars now and then, far back behind them and the sun). The
 * sun breathes on Home's easy 5s rhythm (see SunDisc). The only word is
 * "Tanafas". Tapping the sun (or Back) reverses it all.
 */
export default function SunScene({ scene, session, closeLabel }: SunSceneProps) {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { colors } = useTheme();
  const { setHaloHidden } = useStarfield()!;
  const { rootRef, frame, onLayout, from, to } = useSceneFrame(scene.settle);
  const skyA = useRef(new Animated.Value(0)).current;
  const skyB = useRef(new Animated.Value(0)).current;
  const glide = useRef(new Animated.Value(0)).current;
  /** 0 → 1: Home's mark becoming the sun. */
  const sun = useRef(new Animated.Value(0)).current;
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
    Animated.parallel([
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
    ]).start(({ finished }) => {
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
    Animated.sequence([
      Animated.parallel([
        Animated.timing(word, { toValue: 0, duration: 250, useNativeDriver: NATIVE }),
        Animated.timing(stars, { toValue: 0, duration: 400, useNativeDriver: NATIVE }),
      ]),
      Animated.parallel([
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
  }, [word, stars, glide, sun, skyB, router, setHaloHidden, countVisit]);

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

          {/* The mark, then the sun: placed by its centre in this screen's own pixels
              (converted from Home's measurement), hence left/top. */}
          <Animated.View
            style={[
              styles.sun,
              {
                transform: [
                  { translateX: glide.interpolate({ inputRange: [0, 1], outputRange: [from.x - HALO_BOX / 2, to.x - HALO_BOX / 2] }) },
                  { translateY: glide.interpolate({ inputRange: [0, 1], outputRange: [from.y - HALO_BOX / 2, to.y - HALO_BOX / 2] }) },
                  { scale: sun.interpolate({ inputRange: [0, 1], outputRange: [1, SUN_SCALE] }) },
                ],
              },
            ]}
          >
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={closeLabel}>
              <SunDisc form={sun} scene={scene} />
              {/* Exactly Home's mark in this theme (same colours, strength and clock), minus the
                  ring, giving way to the sun's own. */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: sun.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' }) }]} pointerEvents="none" needsOffscreenAlphaCompositing>
                <MarkHalo accent={colors.primary} dusk={colors.tones.dusk.fg} glow={dayPalette.hounaTeal} glowStrength={0.5} showRing={false} />
              </Animated.View>
            </Pressable>
          </Animated.View>

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
