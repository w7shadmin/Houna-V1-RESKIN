import React, { useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import SunDisc from '@/components/sunrise/SunDisc';
import MoonDisc from '@/components/starfield/MoonDisc';
import { HALO_BOX } from '@/components/starfield/MarkHalo';
import { duskScene, sunriseScene, type ColorScheme } from '@/constants/theme';
import { NATIVE } from '@/hooks/useCalmLoop';

/** Home's sun is a little smaller than its scene's settled one (0.9), to sit inside the ring. */
export const HOME_SUN_SCALE = 0.8;

/** A theme's own body, still and whole: Sunrise's sun, Dusk's evening sun, Night's moon in tonight's phase. */
export function Body({ scheme }: { scheme: ColorScheme }) {
  const whole = useRef(new Animated.Value(1)).current;
  if (scheme === 'night') return <MoonDisc form={whole} />;
  return (
    <View style={{ transform: [{ scale: HOME_SUN_SCALE }] }}>
      <SunDisc form={whole} scene={scheme === 'sunrise' ? sunriseScene : duskScene} />
    </View>
  );
}

/** A change in progress: the body leaving, the one arriving, and how far each has gone (0 → 1). */
export interface SkyChange {
  from: ColorScheme;
  to: ColorScheme;
  leave: Animated.Value;
  enter: Animated.Value;
}

/** Off the edge, a little lower: setting to the right, rising from the left (canvas "Home — appearance"). */
const DROP = 72;
/**
 * The body's timing (ms): it sets over LEAVE; the colours then fade over
 * THEME_FADE_MS (1000) as the next rises over ENTER, arriving just after
 * they've settled.
 */
const LEAVE = 1300;
const ENTER = 1500;

const run = (v: Animated.Value, duration: number, easing: (t: number) => number) =>
  new Promise<void>((resolve) => Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: NATIVE }).start(() => resolve()));

/**
 * Starts a change of theme on Home: the current body sets off the right edge
 * along a shallow arc; with the sky empty, `switchColours` fades the new
 * colours in (ThemeContext's setPreference), and the next body rises in from
 * the left as they arrive, all on the native driver. Under Reduce Motion the
 * bodies fade in place instead. Directions are physical: the sky doesn't
 * mirror in Arabic, and transforms aren't flipped by RTL. `done` resolves when
 * the new body is in place.
 */
export function startSkyChange(
  from: ColorScheme,
  to: ColorScheme,
  reduceMotion: boolean,
  switchColours: () => Promise<void>,
): { change: SkyChange; done: Promise<void> } {
  const leave = new Animated.Value(0);
  const enter = new Animated.Value(0);
  const done = run(leave, reduceMotion ? 300 : LEAVE, Easing.bezier(0.45, 0, 0.75, 0.45))
    .then(switchColours)
    .then(() => run(enter, reduceMotion ? 600 : ENTER, Easing.bezier(0.2, 0.6, 0.3, 1)));
  return { change: { from, to, leave, enter }, done };
}

/**
 * Home's centre in the "Sun & moon" style: the theme's body alone (no ring of
 * dots), in the mark's box so nothing round it moves, and during a change the two
 * bodies crossing (see startSkyChange).
 */
export default function HomeBody({ scheme, change, reduceMotion }: { scheme: ColorScheme; change: SkyChange | null; reduceMotion: boolean }) {
  const { width } = useWindowDimensions();
  const out = Math.max(260, width * 0.78);

  if (!change) {
    return (
      <View style={styles.box} pointerEvents="none">
        <Body scheme={scheme} />
      </View>
    );
  }

  const travel = !reduceMotion;
  const leaving = {
    opacity: change.leave.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0.95, 0] }),
    transform: travel
      ? [
          { translateX: change.leave.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, out * 0.45, out] }) },
          { translateY: change.leave.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, DROP * 0.2, DROP] }) },
        ]
      : [],
  };
  const arriving = {
    opacity: change.enter.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0.95, 1] }),
    transform: travel
      ? [
          { translateX: change.enter.interpolate({ inputRange: [0, 0.55, 1], outputRange: [-out, -out * 0.45, 0] }) },
          { translateY: change.enter.interpolate({ inputRange: [0, 0.55, 1], outputRange: [DROP, DROP * 0.2, 0] }) },
        ]
      : [],
  };
  return (
    <View style={styles.box} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.centre, leaving]}>
        <Body scheme={change.from} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, styles.centre, arriving]}>
        <Body scheme={change.to} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: HALO_BOX,
    height: HALO_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
