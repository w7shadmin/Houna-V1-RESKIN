import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/** Animations run on the UI thread on native (web has no native driver). */
export const NATIVE = Platform.OS !== 'web';

/** A sine wave sampled across one loop (0 → 1), offset by `phase` laps — for piecewise interpolation. */
export const WAVE_STEPS = Array.from({ length: 17 }, (_, k) => k / 16);
export const wave = (phase: number) => WAVE_STEPS.map((t) => Math.sin(2 * Math.PI * (t + phase)));

/** Whether the person has asked their phone for less motion. */
export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);
  return reduceMotion;
}

/**
 * A looping animated value for ambient motion (Home's ring, the starfield).
 * Runs only while its screen is on screen and Reduce Motion is off; otherwise
 * it holds still.
 */
export function useCalmLoop(make: (v: Animated.Value) => Animated.CompositeAnimation) {
  const v = useRef(new Animated.Value(0)).current;
  const focused = useIsFocused();
  const reduceMotion = useReduceMotion();
  useEffect(() => {
    if (!focused || reduceMotion) return;
    // Always from the top of a cycle: a loop replays from the value it started at, so
    // resuming mid-cycle (after the screen was covered) would jump back there every lap.
    v.setValue(0);
    const anim = make(v);
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, reduceMotion, v]);
  return v;
}
