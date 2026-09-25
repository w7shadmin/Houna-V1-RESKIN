import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Animated, BackHandler, Easing, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStarfield } from '@/contexts/StarfieldContext';
import { grid, nightColors, nightPalette } from '@/constants/theme';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { MIN_SESSION_SECONDS, logSession } from '@/lib/sessionLog';
import { pingActivity, recordTanafasSession } from '@/lib/usageTracking';
import MarkHalo, { HALO_BOX } from '@/components/starfield/MarkHalo';
import StarSky from '@/components/starfield/StarSky';
import ShootingStars from '@/components/starfield/ShootingStars';

/** How much bigger the moon is than Home's mark. */
const MOON_SCALE = 1.45;
/** The moonglow in the sky round the moon. */
const GLOW = 420;

interface Frame {
  /** This screen's own top-left on the window: Home's measurement is converted by it. */
  ox: number;
  oy: number;
  width: number;
  height: number;
}

/**
 * The Houna starfield (Night only, opened by tapping Home's mark). Everything
 * else, the mark's dot ring included, has faded away on Home; here the mark is
 * taken over at exactly the spot it was drawn and becomes the moon: it glides
 * to the middle of a turning, twinkling night sky with the odd shooting star,
 * and breathes on Home's easy 5s rhythm for the person to breathe along with.
 * The only word is "Tanafas". Tapping the moon (or Back) reverses it all.
 *
 * The handoff is seamless because both copies of the mark run on one shared
 * clock (StarfieldContext), and this screen measures its own origin rather than
 * trusting that its coordinates match Home's (on Android they differ by the
 * status bar).
 */
export default function StarfieldScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const starfield = useStarfield()!;
  const { clock, setHaloHidden } = starfield;
  const reduceMotion = useReduceMotion();
  const params = useLocalSearchParams<{ x?: string; y?: string }>();

  const rootRef = useRef<View>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const sky = useRef(new Animated.Value(0)).current;
  const glide = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const [settled, setSettled] = useState(false);
  const closing = useRef(false);

  // Where this screen sits on the window, so Home's mark (measured on the window) lands exactly.
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    rootRef.current?.measureInWindow((ox, oy) => setFrame({ ox, oy, width, height }));
  };

  const from = frame && {
    x: (Number(params.x) || frame.ox + frame.width / 2) - frame.ox,
    y: (Number(params.y) || frame.oy + frame.height * 0.3) - frame.oy,
  };
  const to = frame && { x: frame.width / 2, y: frame.height * 0.42 };

  // Once the moon is drawn over Home's mark, hide Home's (the next frame, so there's no gap), then rise.
  useEffect(() => {
    if (!frame) return;
    const raf = requestAnimationFrame(() => setHaloHidden(true));
    Animated.sequence([
      Animated.parallel([
        Animated.timing(sky, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(glide, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }),
        ]),
      ]),
    ]).start(({ finished }) => {
      if (!finished) return;
      setSettled(true);
      // The label: in once the moon has settled, three seconds, then gone for the rest of the visit.
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

  // Every visit counts as a breathing session, like the Breathe exercises: the time spent
  // breathing (in the foreground, from arrival until the moon is tapped) goes to Recap's
  // minutes, the streak and the leaderboard. Anything under the app-wide minimum is an
  // accidental open; the community ping waits for that minimum too.
  const breathing = useRef({ ms: 0, since: Date.now() as number | null, counted: false });
  const countVisit = useCallback(() => {
    const b = breathing.current;
    if (b.counted) return;
    b.counted = true;
    const ms = b.ms + (b.since !== null ? Date.now() - b.since : 0);
    if (ms < MIN_SESSION_SECONDS * 1000) return;
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - ms);
    logSession('breathing', 'starfield', startedAt, endedAt).catch(() => {});
    recordTanafasSession('breathing', startedAt, endedAt).catch(() => {});
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const b = breathing.current;
      if (state === 'active') {
        if (b.since === null) b.since = Date.now();
      } else if (b.since !== null) {
        b.ms += Date.now() - b.since;
        b.since = null;
      }
    });
    const ping = setTimeout(() => pingActivity('breathing').catch(() => {}), MIN_SESSION_SECONDS * 1000);
    return () => {
      sub.remove();
      clearTimeout(ping);
      countVisit();
    };
  }, [countVisit]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    countVisit();
    setSettled(false);
    word.stopAnimation();
    Animated.sequence([
      Animated.timing(word, { toValue: 0, duration: 250, useNativeDriver: NATIVE }),
      Animated.parallel([
        Animated.timing(glide, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(sky, { toValue: 0, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
        ]),
      ]),
    ]).start(() => {
      // The moon is back on Home's mark: show Home's under it, then leave a frame later.
      setHaloHidden(false);
      requestAnimationFrame(() => requestAnimationFrame(() => router.back()));
    });
  }, [word, glide, sky, router, setHaloHidden, countVisit]);

  // Android back: the same way out as tapping the moon.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  // Immersive: screen stays on, system bars away. Leaving any other way still gives Home its mark back.
  useEffect(() => {
    const tag = 'houna-starfield';
    activateKeepAwakeAsync(tag).catch(() => {});
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
      NavigationBar.setVisibilityAsync('visible').catch(() => {});
      setHaloHidden(false);
    };
  }, [setHaloHidden]);

  return (
    <View ref={rootRef} collapsable={false} onLayout={onLayout} style={StyleSheet.absoluteFill}>
      <StatusBar hidden style="light" />
      {/* The night: the ground darkens first, the stars come out just behind it. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.night, { opacity: sky }]} />
      {frame && from && to && (
        <>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: sky.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 1] }) }]}>
            <StarSky cx={to.x} cy={to.y} diagonal={Math.hypot(frame.width, frame.height)} />
            <ShootingStars width={frame.width} height={frame.height} active={settled && !reduceMotion} />
          </Animated.View>

          {/* The moon: Home's mark without its ring, rising to the middle. Placed by its centre in
              this screen's own pixels (converted from Home's measurement), hence left/top. */}
          <Animated.View
            style={[
              styles.moon,
              {
                transform: [
                  { translateX: glide.interpolate({ inputRange: [0, 1], outputRange: [from.x - HALO_BOX / 2, to.x - HALO_BOX / 2] }) },
                  { translateY: glide.interpolate({ inputRange: [0, 1], outputRange: [from.y - HALO_BOX / 2, to.y - HALO_BOX / 2] }) },
                  { scale: glide.interpolate({ inputRange: [0, 1], outputRange: [1, MOON_SCALE] }) },
                ],
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.moonglow,
                {
                  opacity: Animated.multiply(glide, clock.breath.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })),
                  transform: [{ scale: clock.breath.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }],
                },
              ]}
            >
              <Svg width={GLOW} height={GLOW}>
                <Defs>
                  <RadialGradient id="moonglow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0.2" stopColor={nightColors.glow} stopOpacity={0.1} />
                    <Stop offset="1" stopColor={nightColors.glow} stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#moonglow)" />
              </Svg>
            </Animated.View>
            <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t.home.starfield.close}>
              {/* Exactly Home's Night mark (same colours, strength and clock), minus the ring. */}
              <MarkHalo accent={nightColors.primary} dusk={nightColors.tones.dusk.fg} glow={nightColors.glow} glowStrength={0.4} showRing={false} />
            </Pressable>
          </Animated.View>

          <Animated.Text
            pointerEvents="none"
            style={[
              fonts.labelTracked ? styles.wordLatin : styles.wordArabic,
              {
                bottom: grid(7),
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
  night: {
    backgroundColor: nightPalette.midnight,
  },
  moon: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: HALO_BOX,
    height: HALO_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moonglow: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
  },
  // A quiet label, as the app's tracked labels: never competing with the moon.
  wordLatin: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: nightPalette.haze,
    fontSize: 12,
    letterSpacing: 12 * 0.3,
    textTransform: 'uppercase',
  },
  wordArabic: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: nightPalette.haze,
    fontSize: 14,
  },
});
