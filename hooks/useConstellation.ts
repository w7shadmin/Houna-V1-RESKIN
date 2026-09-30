import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { sessionsBetween } from '@/lib/sessionLog';
import { constellationById, type Constellation } from '@/lib/constellations';
import { chooseConstellation, litTimes, loadSkyProgress, markComplete, saveSkyProgress, type SkyProgress } from '@/lib/constellationProgress';

export interface ConstellationState {
  progress: SkyProgress;
  constellation: Constellation | null;
  /** When each lit star was lit (session start times), in order. */
  lit: number[];
  complete: boolean;
  choose: (id: string) => void;
}

/**
 * Your sky's constellation: the one being lit and its lit stars, from the phone's own session log,
 * refreshed whenever the screen comes into focus (so a star lights on returning from a session).
 * Finishing one is recorded once.
 */
export function useConstellation(): ConstellationState | null {
  const [state, setState] = useState<{ progress: SkyProgress; lit: number[] } | null>(null);

  const load = useCallback(() => {
    let alive = true;
    (async () => {
      let progress = await loadSkyProgress();
      const c = constellationById(progress.current?.id);
      let lit: number[] = [];
      if (progress.current && c) {
        const sessions = await sessionsBetween(new Date(progress.current.startedAt), new Date(Date.now() + 60_000)).catch(() => []);
        lit = litTimes(
          sessions.map((x) => x.startedAt),
          progress.current.startedAt,
          c.stars.length,
        );
        if (lit.length === c.stars.length) {
          const marked = markComplete(progress, lit[lit.length - 1]);
          if (marked !== progress) {
            progress = marked;
            await saveSkyProgress(progress);
          }
        }
      }
      if (alive) setState({ progress, lit });
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useFocusEffect(load);

  const choose = useCallback(
    (id: string) => {
      setState((s) => {
        const progress = chooseConstellation(s?.progress ?? { current: null, completed: [] }, id, Date.now());
        saveSkyProgress(progress);
        return { progress, lit: [] };
      });
    },
    [],
  );

  if (!state) return null;
  const constellation = constellationById(state.progress.current?.id);
  return {
    progress: state.progress,
    constellation,
    lit: state.lit,
    complete: !!constellation && state.lit.length === constellation.stars.length,
    choose,
  };
}
