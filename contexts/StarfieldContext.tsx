import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';

/** One lap of the ring's ripple, one breath (out + in), one slow turn of the ring. */
const DRIFT_MS = 8000;
export const BREATH_MS = 5000;
const TURN_MS = 120000;

/** The mark's motion, shared by Home's mark and the starfield's moon so the two are identical wherever they overlap. */
export interface MarkClock {
  drift: Animated.Value;
  turn: Animated.Value;
  breath: Animated.Value;
}

/**
 * The Houna starfield's handoff from Home.
 * - `chrome` (1 → 0): Home's UI, the mark's dot ring and the tab bar fade out
 *   together, leaving only the mark; `chromeHidden` switches off their touches.
 * - `haloHidden`: Home's mark steps aside once the starfield has drawn its
 *   moon over it, and comes back just before the starfield leaves.
 * - `clock`: the mark's animation, running once for both copies.
 */
interface StarfieldState {
  chrome: Animated.Value;
  chromeHidden: boolean;
  setChromeHidden: (hidden: boolean) => void;
  haloHidden: boolean;
  setHaloHidden: (hidden: boolean) => void;
  clock: MarkClock;
}

const StarfieldContext = createContext<StarfieldState | null>(null);

export function StarfieldProvider({ children }: { children: React.ReactNode }) {
  const chrome = useRef(new Animated.Value(1)).current;
  const [chromeHidden, setChromeHidden] = useState(false);
  const [haloHidden, setHaloHidden] = useState(false);
  const clock = useRef<MarkClock>({ drift: new Animated.Value(0), turn: new Animated.Value(0), breath: new Animated.Value(0) }).current;
  const reduceMotion = useReduceMotion();

  // One continuous run (native driver, so it costs next to nothing); held still with Reduce Motion.
  useEffect(() => {
    if (reduceMotion) return;
    const lap = (v: Animated.Value, duration: number) =>
      Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: NATIVE }));
    const anim = Animated.parallel([
      lap(clock.drift, DRIFT_MS),
      lap(clock.turn, TURN_MS),
      Animated.loop(
        Animated.sequence([
          Animated.timing(clock.breath, { toValue: 1, duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
          Animated.timing(clock.breath, { toValue: 0, duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        ]),
      ),
    ]);
    Object.values(clock).forEach((v) => v.setValue(0));
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, clock]);

  const value = useMemo(
    () => ({ chrome, chromeHidden, setChromeHidden, haloHidden, setHaloHidden, clock }),
    [chrome, chromeHidden, haloHidden, clock],
  );
  return <StarfieldContext.Provider value={value}>{children}</StarfieldContext.Provider>;
}

/** Null outside the provider (it wraps the whole app in app/_layout.tsx). */
export function useStarfield() {
  return useContext(StarfieldContext);
}
