import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, type LayoutChangeEvent, type View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import { useStarfield } from '@/contexts/StarfieldContext';
import { MIN_SESSION_SECONDS, logSession } from '@/lib/sessionLog';
import { pingActivity, recordTanafasSession } from '@/lib/usageTracking';

/**
 * What the Home-mark scenes share (the Night starfield, the Sunrise sun): the
 * handoff from Home's mark, visit counting, and the immersive shell. Each scene
 * draws its own sky and its own moon or sun.
 */

export interface SceneFrame {
  /** This screen's own top-left on the window: Home's measurement is converted by it. */
  ox: number;
  oy: number;
  width: number;
  height: number;
}

/**
 * Where the mark starts (Home's measured spot, in this screen's pixels) and where it
 * settles: centred, `settle` of the way down (the moon's 0.42, a little above the middle). The screen measures its own origin rather
 * than trusting that its coordinates match Home's (on Android they differ by the status bar).
 */
export function useSceneFrame(settle = 0.42) {
  const params = useLocalSearchParams<{ x?: string; y?: string }>();
  const rootRef = useRef<View>(null);
  const [frame, setFrame] = useState<SceneFrame | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    rootRef.current?.measureInWindow((ox, oy) => setFrame({ ox, oy, width, height }));
  };

  const from = frame && {
    x: (Number(params.x) || frame.ox + frame.width / 2) - frame.ox,
    y: (Number(params.y) || frame.oy + frame.height * 0.3) - frame.oy,
  };
  const to = frame && { x: frame.width / 2, y: frame.height * settle };
  return { rootRef, frame, onLayout, from, to };
}

/**
 * Every visit counts as a breathing session, like the Breathe exercises: the time spent
 * breathing (in the foreground, from arrival until the mark is tapped) goes to Recap's
 * minutes, the streak and the leaderboard, under `exercise`. Anything under the app-wide
 * minimum is an accidental open; the community ping waits for that minimum too. Returns
 * `countVisit`, to call on the way out (it also runs on unmount, once).
 */
export function useBreathingVisit(exercise: string) {
  const breathing = useRef({ ms: 0, since: Date.now() as number | null, counted: false });
  const countVisit = useCallback(() => {
    const b = breathing.current;
    if (b.counted) return;
    b.counted = true;
    const ms = b.ms + (b.since !== null ? Date.now() - b.since : 0);
    if (ms < MIN_SESSION_SECONDS * 1000) return;
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - ms);
    logSession('breathing', exercise, startedAt, endedAt).catch(() => {});
    recordTanafasSession('breathing', startedAt, endedAt).catch(() => {});
  }, [exercise]);
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
  return countVisit;
}

/**
 * Immersive while open: the screen stays on and the system bars step away. Android's
 * Back takes the same way out as tapping the mark. Leaving any other way still gives
 * Home its mark back.
 */
export function useImmersiveScene(tag: string, close: () => void) {
  const { setHaloHidden } = useStarfield()!;
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);
  useEffect(() => {
    activateKeepAwakeAsync(tag).catch(() => {});
    NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
      NavigationBar.setVisibilityAsync('visible').catch(() => {});
      setHaloHidden(false);
    };
  }, [tag, setHaloHidden]);
}
