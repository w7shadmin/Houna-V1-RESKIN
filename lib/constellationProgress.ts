import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Your sky's constellation, kept on the phone (like the session log it counts, so Guests have it):
 * which one is being lit, since when, and the ones already finished. Each session logged after
 * `startedAt` lights the next star; choosing another starts it from its first star.
 */
export interface SkyProgress {
  current: { id: string; startedAt: number } | null;
  completed: { id: string; at: number }[];
}

const KEY = 'houna-constellation';
const EMPTY: SkyProgress = { current: null, completed: [] };

export async function loadSkyProgress(): Promise<SkyProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<SkyProgress>;
    return { current: p.current ?? null, completed: Array.isArray(p.completed) ? p.completed : [] };
  } catch {
    return EMPTY;
  }
}

export async function saveSkyProgress(p: SkyProgress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => {});
}

/** Starts `id` now, in place of whatever was being lit. */
export function chooseConstellation(p: SkyProgress, id: string, now: number): SkyProgress {
  return { ...p, current: { id, startedAt: now } };
}

/**
 * When each star was lit: the start time of each session since the constellation was chosen, one
 * per star, in order, no more than it has stars.
 */
export function litTimes(sessionStarts: number[], startedAt: number, stars: number): number[] {
  return sessionStarts
    .filter((t) => t >= startedAt)
    .sort((a, b) => a - b)
    .slice(0, stars);
}

/** Records the current constellation as finished (once), keeping it on screen until another is chosen. */
export function markComplete(p: SkyProgress, at: number): SkyProgress {
  if (!p.current || p.completed.some((c) => c.id === p.current!.id && c.at >= p.current!.startedAt)) return p;
  return { ...p, completed: [...p.completed, { id: p.current.id, at }] };
}
