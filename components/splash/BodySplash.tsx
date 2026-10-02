import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStarfield } from '@/contexts/StarfieldContext';
import { Body } from '@/components/home/HomeBody';
import { HALO_BOX } from '@/components/starfield/MarkHalo';
import NightStars from '@/components/home/NightStars';
import Logo from '@/components/Logo';
import Label from '@/components/ui/Label';

/** The timeline (ms): the body rises, the wordmark settles, a held beat, then the handover. */
const RISE = 700;
const WORDS_AT = 500;
const WORDS = 600;
const EXIT_AT = 2300;
const EXIT = 700;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/**
 * The splash, each theme's body (canvas "Phase 5 — the splash, each theme's body"): Sunrise's
 * star-lattice sun, Dusk's evening sun or Night's crescent bowl rises into the middle, and the
 * wordmark and "Breathe · rest · return" settle beneath it; about 3s, as SplashIntro. On the
 * "Sun & moon" Home, the body then glides to its place on Home (Home's measured `homeBody`) as
 * Home comes in round it, and Home's own takes over where it lands: one body, never two.
 * Classic, the first run (no Home beneath) and Reduce Motion simply fade.
 *
 * Built and kept, not yet in use: app/_layout.tsx's SPLASH chooses it.
 */
export default function BodySplash({ onFinish }: { onFinish: () => void }) {
  const { colors, scheme, isNight, homeStyle } = useTheme();
  const { t } = useLanguage();
  const starfield = useStarfield();
  const reduceMotion = useReducedMotion();
  const bodyRef = useRef<View>(null);

  const rise = useSharedValue(0);
  const words = useSharedValue(0);
  const ground = useSharedValue(1);
  const bodyOpacity = useSharedValue(1);
  const glideX = useSharedValue(0);
  const glideY = useSharedValue(0);

  useEffect(() => {
    const finish = () => {
      starfield?.setHaloHidden(false);
      onFinish();
    };
    const fadeAll = () => {
      bodyOpacity.value = withTiming(0, { duration: EXIT, easing: EASE_IN_OUT });
      ground.value = withTiming(0, { duration: EXIT, easing: EASE_IN_OUT }, (done) => {
        if (done) runOnJS(finish)();
      });
    };
    const glide = (dx: number, dy: number) => {
      // Home's own body steps aside while this one travels to it, and returns where it lands.
      starfield?.setHaloHidden(true);
      glideX.value = withTiming(dx, { duration: EXIT, easing: EASE_IN_OUT });
      glideY.value = withTiming(dy, { duration: EXIT, easing: EASE_IN_OUT });
      ground.value = withTiming(0, { duration: EXIT, easing: EASE_IN_OUT }, (done) => {
        if (done) runOnJS(finish)();
      });
    };
    const exit = () => {
      words.value = withTiming(0, { duration: EXIT / 2 });
      const home = starfield?.homeBody.current;
      if (reduceMotion || homeStyle !== 'sky' || !home || !bodyRef.current) return fadeAll();
      bodyRef.current.measureInWindow((x, y, w, h) => {
        home.measureInWindow((hx, hy, hw, hh) => {
          if (!hw || !hh) return fadeAll();
          glide(hx + hw / 2 - (x + w / 2), hy + hh / 2 - (y + h / 2));
        });
      });
    };

    rise.value = withTiming(1, { duration: reduceMotion ? 300 : RISE, easing: EASE_OUT });
    words.value = withDelay(WORDS_AT, withTiming(1, { duration: WORDS, easing: EASE_OUT }));
    const timer = setTimeout(exit, EXIT_AT);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groundStyle = useAnimatedStyle(() => ({ opacity: ground.value }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: rise.value * bodyOpacity.value,
    transform: [
      { translateX: glideX.value },
      { translateY: glideY.value + (reduceMotion ? 0 : 30 * (1 - rise.value)) },
      { scale: reduceMotion ? 1 : 0.92 + 0.08 * rise.value },
    ],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: words.value,
    transform: [{ translateY: reduceMotion ? 0 : 8 * (1 - words.value) }],
  }));

  return (
    <View style={styles.root} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }, groundStyle]}>
        {isNight && <NightStars />}
      </Animated.View>
      <View style={styles.column}>
        <Animated.View ref={bodyRef} collapsable={false} style={[styles.box, bodyStyle]}>
          <Body scheme={scheme} />
        </Animated.View>
        <Animated.View style={[styles.words, wordStyle]}>
          <Logo variant="themed" width={150} />
          <Label>{t.firstRun.tagline}</Label>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 64,
  },
  box: {
    width: HALO_BOX,
    height: HALO_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    alignItems: 'center',
    gap: 16,
  },
});
