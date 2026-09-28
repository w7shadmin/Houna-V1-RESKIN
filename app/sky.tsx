import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { duskScene, grid, nightPalette, sunriseScene, type SkyWash } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import { HORIZON, firstLight, skyAt, skyTimeline, sunTimes, type PartOfDay, type SkyState } from '@/lib/skyClock';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { useBreathingVisit, useImmersiveScene } from '@/hooks/useBreathingScene';
import Orb from '@/components/ui/Orb';
import PressedMark from '@/components/ui/PressedMark';
import MoonDisc from '@/components/starfield/MoonDisc';
import StarSky from '@/components/starfield/StarSky';
import { HALO_BOX } from '@/components/starfield/MarkHalo';

/** The day, from first light to now, plays through in this long. */
const PLAY_MS = 20_000;
const PLAY_EASING = Easing.inOut(Easing.sin);
/** Held at the hour, the sky moves on this often. */
const LIVE_MS = 30_000;
const SUN = 88;
const MOON_SCALE = 0.7;

/** The four skies: the scenes' own (Sunrise's pre-dawn and morning, Dusk's violet evening) and the night's. */
const SKIES: Record<Exclude<PartOfDay, 'night'>, SkyWash> & { night: SkyWash } = {
  night: { colors: [nightPalette.midnight, nightPalette.nightfall, '#1C2452'], locations: [0, 0.6, 1] },
  dawn: sunriseScene.skyA,
  dusk: duskScene.skyB,
  day: sunriseScene.skyB,
};

type Num = number | Animated.AnimatedInterpolation<number>;
interface Values {
  dawn: Num;
  dusk: Num;
  day: Num;
  night: Num;
  sunX: Num;
  sunY: Num;
  sunLight: Num;
  moonX: Num;
  moonY: Num;
  moonLight: Num;
}

/**
 * The sky clock (canvas "Phase 3 — the sky clock"), opened with a long press on Home's mark or
 * body: one sky through the day, the sun (and tonight's moon, in its real phase) crossing over
 * the hills. It opens by playing the day from first light to now in about 20 seconds, then holds
 * at the hour, moving with the clock while it's open. The chosen theme is untouched: this sky is
 * its own. The words are the part of the day and the time; tap anywhere (or Back) to leave.
 * Every visit counts as a breathing session, as the starfield's does.
 */
export default function SkyScreen() {
  const router = useRouter();
  const { t, fonts, isRTL } = useLanguage();
  const s = t.home.sky;
  const { width: W, height: H } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const opened = useMemo(() => new Date(), []);
  const start = useMemo(() => firstLight(opened), [opened]);
  const timeline = useMemo(() => skyTimeline(start, opened), [start, opened]);
  const clock = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;
  const [live, setLive] = useState(false);
  const [now, setNow] = useState(opened);
  // The time the playing sky shows, for its words (worked out as the animation eases, not read back from it).
  const [shown, setShown] = useState(start);
  const closing = useRef(false);

  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start();
    if (reduceMotion) {
      setLive(true);
      return;
    }
    const began = Date.now();
    const tick = setInterval(() => {
      const p = PLAY_EASING(Math.min(1, (Date.now() - began) / PLAY_MS));
      setShown(new Date(start.getTime() + (opened.getTime() - start.getTime()) * p));
    }, 250);
    const play = Animated.timing(clock, { toValue: 1, duration: PLAY_MS, easing: PLAY_EASING, useNativeDriver: NATIVE });
    play.start(({ finished }) => {
      clearInterval(tick);
      if (finished) setLive(true);
    });
    return () => {
      clearInterval(tick);
      play.stop();
    };
    // Once, as it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Held at the hour: move with the clock.
  useEffect(() => {
    if (!live) return;
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), LIVE_MS);
    return () => clearInterval(id);
  }, [live]);

  const values: Values = useMemo(() => {
    const px = (st: SkyState) => ({
      dawn: st.dawn,
      dusk: st.dusk,
      day: st.day,
      night: st.night,
      sunX: st.sun.x * W - SUN / 2,
      sunY: st.sun.y * H - SUN / 2,
      sunLight: st.sunLight,
      moonX: st.moon.x * W - HALO_BOX / 2,
      moonY: st.moon.y * H - HALO_BOX / 2,
      moonLight: st.moonLight,
    });
    if (live) return px(skyAt(now));
    const rows = timeline.states.map(px);
    const at = (key: keyof Values) => clock.interpolate({ inputRange: timeline.at, outputRange: rows.map((r) => r[key] as number) });
    return {
      dawn: at('dawn'),
      dusk: at('dusk'),
      day: at('day'),
      night: at('night'),
      sunX: at('sunX'),
      sunY: at('sunY'),
      sunLight: at('sunLight'),
      moonX: at('moonX'),
      moonY: at('moonY'),
      moonLight: at('moonLight'),
    };
  }, [live, now, timeline, clock, W, H]);

  const countVisit = useBreathingVisit('sky');
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    countVisit();
    Animated.timing(enter, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }).start(() => router.back());
  }, [enter, router, countVisit]);
  useImmersiveScene('houna-sky', close);

  // The words: the part of the day, the time, and the next sunrise or sunset.
  const moment = live ? now : shown;
  const part = skyAt(moment).part;
  const clockText = (d: Date) => `${num(d.getHours() % 12 || 12)}:${num(d.getMinutes()).padStart(2, num(0))} ${d.getHours() < 12 ? s.am : s.pm}`;
  const { sunrise, sunset } = sunTimes(moment);
  const next =
    moment < sunrise
      ? s.sunrise.replace('{t}', clockText(sunrise))
      : moment < sunset
        ? s.sunset.replace('{t}', clockText(sunset))
        : s.sunrise.replace('{t}', clockText(sunTimes(new Date(moment.getTime() + 86_400_000)).sunrise));
  const whole = useRef(new Animated.Value(1)).current;
  const latin = fonts.labelTracked;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.physical, { opacity: enter }]}>
      <StatusBar hidden style="light" />
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel={`${s.parts[part]}, ${clockText(moment)}. ${s.close}`}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Sky wash={SKIES.night} />
          <Sky wash={SKIES.dawn} opacity={values.dawn} />
          <Sky wash={SKIES.dusk} opacity={values.dusk} />
          <Sky wash={SKIES.day} opacity={values.day} />
          {/* The stars, only above the hills (which let a little of the sky through). */}
          <Animated.View style={[styles.stars, { height: H * HORIZON, opacity: values.night }]}>
            <StarSky cx={W / 2} cy={H * HORIZON} reach={Math.hypot(W / 2, Math.max(H * HORIZON, H * (1 - HORIZON)))} />
          </Animated.View>

          {/* The moon, in tonight's phase, and the sun: placed by their centres, in physical pixels. */}
          <Animated.View
            style={[
              styles.body,
              { width: HALO_BOX, height: HALO_BOX, opacity: values.moonLight, transform: [{ translateX: values.moonX }, { translateY: values.moonY }, { scale: MOON_SCALE }] },
            ]}
          >
            <MoonDisc form={whole} />
          </Animated.View>
          <Animated.View
            style={[styles.body, { width: SUN, height: SUN, opacity: values.sunLight, transform: [{ translateX: values.sunX }, { translateY: values.sunY }] }]}
          >
            <Orb size={SUN} stops={sunriseScene.disc} fx={0.5} fy={0.45} glow={`0 0 40px ${sunriseScene.glow}`} />
            <PressedMark size={48} surface={sunriseScene.surface} />
          </Animated.View>

          <Hills top={H * HORIZON - 30} width={W} height={H * (1 - HORIZON) + 30} />

          <View style={[styles.words, { top: H * 0.8 }]}>
            <Arriving key={part}>
              <Text style={[styles.part, isRTL && styles.partArabic, { fontFamily: fonts.display }]}>{s.parts[part]}</Text>
            </Arriving>
            <Text style={[latin ? styles.subLatin : styles.subArabic, { fontFamily: latin ? fonts.labelRegular : fonts.label }]}>
              {`${clockText(moment)} · ${next}`}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Sky({ wash, opacity }: { wash: SkyWash; opacity?: Num }) {
  return (
    <Animated.View style={[StyleSheet.absoluteFill, opacity !== undefined && { opacity }]}>
      <LinearGradient colors={wash.colors as [string, string, ...string[]]} locations={wash.locations as [number, number, ...number[]]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

/** The hills in front of the sky (the sun and moon go down behind them). */
function Hills({ top, width, height }: { top: number; width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 390 300" preserveAspectRatio="none" style={[styles.hills, { top }]}>
      <Path d="M0 30 Q100 0 200 22 T390 14 V300 H0 Z" fill={nightPalette.midnight} fillOpacity={0.6} />
      <Path d="M0 70 Q140 36 260 64 T390 58 V300 H0 Z" fill={nightPalette.midnight} fillOpacity={0.9} />
    </Svg>
  );
}

/** Fades its child in as it mounts: key it on what it shows. */
function Arriving({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start();
  }, [v]);
  return <Animated.View style={{ opacity: v }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  // Placed in physical pixels (the sky doesn't mirror): lay out left-to-right in either language
  // (Android otherwise swaps left/right in Arabic; the web never does, and has no direction style).
  physical: Platform.OS === 'web' ? {} : { direction: 'ltr' },
  stars: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  body: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hills: {
    position: 'absolute',
    left: 0,
  },
  words: {
    position: 'absolute',
    left: grid(4),
    right: grid(4),
    alignItems: 'center',
    gap: grid(1),
  },
  part: {
    fontSize: 28,
    lineHeight: 34,
    color: nightPalette.moonlight,
    textAlign: 'center',
  },
  partArabic: {
    fontSize: 30,
    lineHeight: 44,
  },
  subLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
    color: nightPalette.mist,
    textAlign: 'center',
  },
  subArabic: {
    fontSize: 13,
    color: nightPalette.mist,
    textAlign: 'center',
  },
});
