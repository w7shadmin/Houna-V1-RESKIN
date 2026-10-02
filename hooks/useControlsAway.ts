import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform } from 'react-native';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';

/** Stillness before the controls step aside, and how long they take to fade each way. */
export const CONTROLS_IDLE_MS = 3000;
const FADE_IN_MS = 200;
const FADE_OUT_MS = 400;

/**
 * Whether a screen reader is on (VoiceOver, TalkBack): the controls then never hide. Native
 * only: react-native-web can't tell and always answers yes.
 */
function useScreenReader() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    AccessibilityInfo.isScreenReaderEnabled().then(setOn).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setOn);
    return () => sub.remove();
  }, []);
  return on;
}

/**
 * Controls that step aside during practice (canvas "Motion — controls step aside"): while
 * `active` (a session running, not paused), they fade out after three seconds of stillness
 * and come back at a touch (`wake`). Whenever it isn't active they're shown and stay. With a
 * screen reader on they never hide; with Reduce Motion they appear and disappear without a fade.
 * `opacity` goes on the controls; `interactive` is false once they're gone, for pointerEvents.
 */
export function useControlsAway(active: boolean) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [interactive, setInteractive] = useState(true);
  const reduceMotion = useReduceMotion();
  const screenReader = useScreenReader();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clear();
    setInteractive(true);
    Animated.timing(opacity, { toValue: 1, duration: reduceMotion ? 0 : FADE_IN_MS, useNativeDriver: NATIVE }).start();
  }, [clear, opacity, reduceMotion]);

  const scheduleHide = useCallback(() => {
    clear();
    if (screenReader) return;
    timer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: reduceMotion ? 0 : FADE_OUT_MS, useNativeDriver: NATIVE }).start(({ finished }) => {
        if (finished) setInteractive(false);
      });
    }, CONTROLS_IDLE_MS);
  }, [clear, opacity, reduceMotion, screenReader]);

  useEffect(() => {
    show();
    if (active) scheduleHide();
    return clear;
  }, [active, show, scheduleHide, clear]);

  /** A touch: bring the controls back and start counting again. */
  const wake = useCallback(() => {
    if (!active) return;
    show();
    scheduleHide();
  }, [active, show, scheduleHide]);

  return { opacity, interactive, wake };
}
