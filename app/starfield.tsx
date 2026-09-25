import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import { useLanguage } from '@/contexts/LanguageContext';
import { nightColors, nightPalette } from '@/constants/theme';
import { NATIVE, useCalmLoop, useReduceMotion } from '@/hooks/useCalmLoop';
import { logSession } from '@/lib/sessionLog';
import { pingActivity, recordTanafasSession } from '@/lib/usageTracking';
import MarkHalo, { BREATH_MS, HALO_BOX } from '@/components/starfield/MarkHalo';
import StarSky from '@/components/starfield/StarSky';
import ShootingStars from '@/components/starfield/ShootingStars';

/** How much bigger the moon is than Home's mark. */
const MOON_SCALE = 1.45;
/** The moonglow in the sky round the moon. */
const GLOW = 420;
/** A visit counts as a breathing session (Recap, streaks) once it lasts this long. */
const COUNTS_AFTER_MS = 60000;

/**
 * The Houna starfield (Night only, opened by tapping Home's mark). Everything
 * else has faded away on Home; here the mark, handed over at exactly the spot
 * it was drawn, becomes a silver full moon: it glides to the middle of a
 * turning, twinkling night sky with the odd shooting star, and breathes on
 * Home's easy 5s rhythm for the person to breathe along with. The only word
 * is "Tanafas". Tapping the moon (or Back) reverses it all back into Home.
 */
export default function StarfieldScreen() {
  const router = useRouter();
  const { t, fonts, isRTL } = useLanguage();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const params = useLocalSearchParams<{ x?: string; y?: string }>();

  // Where Home drew the mark (its centre, in screen pixels), and where the moon settles.
  const from = { x: Number(params.x) || width / 2, y: Number(params.y) || height * 0.3 };
  const to = { x: width / 2, y: height * 0.42 };

  const sky = useRef(new Animated.Value(0)).current;
  const glide = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const [settled, setSettled] = useState(false);
  const closing = useRef(false);

  // The moonglow breathes with the moon (same 5s rhythm, started together).
  const breath = useCalmLoop((v) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    ),
  );

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(sky, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
        Animated.sequence([
          Animated.delay(150),
          Animated.timing(glide, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }),
        ]),
      ]),
      Animated.timing(word, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
    ]).start(({ finished }) => finished && setSettled(true));
  }, [sky, glide, word]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setSettled(false);
    Animated.sequence([
      Animated.timing(word, { toValue: 0, duration: 250, useNativeDriver: NATIVE }),
      Animated.parallel([
        Animated.timing(glide, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(sky, { toValue: 0, duration: 800, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
        ]),
      ]),
    ]).start(() => router.back());
  }, [word, glide, sky, router]);

  // Android back: the same way out as tapping the moon.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  // Immersive: screen stays on, system bars away.
  useEffect(() => {
    const tag = 'houna-starfield';
    activateKeepAwakeAsync(tag).catch(() => {});
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
      NavigationBar.setVisibilityAsync('visible').catch(() => {});
    };
  }, []);

  // A visit of a minute or more counts as a breathing session: the community ping at the
  // minute mark, then the on-device log (Recap) and streak record on leaving.
  useEffect(() => {
    const startedAt = new Date();
    const ping = setTimeout(() => pingActivity('breathing').catch(() => {}), COUNTS_AFTER_MS);
    return () => {
      clearTimeout(ping);
      const endedAt = new Date();
      if (endedAt.getTime() - startedAt.getTime() < COUNTS_AFTER_MS) return;
      logSession('breathing', 'starfield', startedAt, endedAt).catch(() => {});
      recordTanafasSession('breathing', startedAt, endedAt).catch(() => {});
    };
  }, []);

  const moonTransform = [
    { translateX: glide.interpolate({ inputRange: [0, 1], outputRange: [from.x - HALO_BOX / 2, to.x - HALO_BOX / 2] }) },
    { translateY: glide.interpolate({ inputRange: [0, 1], outputRange: [from.y - HALO_BOX / 2, to.y - HALO_BOX / 2] }) },
    { scale: glide.interpolate({ inputRange: [0, 1], outputRange: [1, MOON_SCALE] }) },
  ];
  const wordTop = to.y + (HALO_BOX / 2) * MOON_SCALE + 16;

  return (
    <>
      <StatusBar hidden style="light" />
      {/* The night: the ground darkens first, the stars come out just behind it. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.night, { opacity: sky }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: sky.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.3, 1] }) }]}>
        <StarSky cx={to.x} cy={to.y} diagonal={Math.hypot(width, height)} />
        <ShootingStars width={width} height={height} active={settled && !reduceMotion} />
      </Animated.View>

      {/* The moon: Home's mark, turning silver as it rises to the middle. Placed by its centre in
          screen pixels (the handoff from Home is measured that way), hence left/top. */}
      <Animated.View style={[styles.moon, { transform: moonTransform }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.moonglow,
            { opacity: Animated.multiply(glide, breath.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] })) },
            { transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }] },
          ]}
        >
          <Svg width={GLOW} height={GLOW}>
            <Defs>
              <RadialGradient id="moonglow" cx="50%" cy="50%" r="50%">
                <Stop offset="0.2" stopColor={nightPalette.moonlight} stopOpacity={0.1} />
                <Stop offset="1" stopColor={nightPalette.moonlight} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#moonglow)" />
          </Svg>
        </Animated.View>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t.home.starfield.close}>
          <MarkHalo
            accent={nightColors.primary}
            dusk={nightColors.tones.dusk.fg}
            light={{ mark: nightColors.logo.primary, glow: nightColors.glow, glowStrength: 0.4 }}
            alt={{ light: { mark: nightPalette.moonlight, glow: nightPalette.moonlight, glowStrength: 0.5 }, mix: glide }}
          />
        </Pressable>
      </Animated.View>

      <Animated.Text
        pointerEvents="none"
        style={[
          styles.word,
          isRTL && styles.wordArabic,
          {
            top: wordTop,
            fontFamily: fonts.display,
            opacity: word,
            transform: [{ translateY: word.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
          },
        ]}
      >
        {t.tabs.tanafas}
      </Animated.Text>
    </>
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
  word: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: nightPalette.moonlight,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 1,
  },
  wordArabic: {
    fontSize: 30,
    lineHeight: 48,
    letterSpacing: 0,
  },
});
