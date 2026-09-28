import type { LoggedSession } from './sessionLog';

/**
 * Practice from the on-device session log, for the graphs (canvas "Houna — Graphs (phase 4)"):
 * minutes by exercise, a week's bounds, and each day's total. Pure (no storage or RN imports),
 * so it runs under `npm test`. Only breathing and meditation sessions are ever logged, so mood
 * and the journal can never count here.
 */

/** The parts of practice, in the arc's order: the five exercises in their tones, meditation, then the Home scenes. */
export const PRACTICE_GROUPS = ['anxietyRelief', 'steadyMind', 'panicRelief', 'tensionRelease', 'physiologicalSigh', 'meditation', 'tanafas'] as const;
export type PracticeGroup = (typeof PRACTICE_GROUPS)[number];

const EXERCISE_GROUP: Record<string, PracticeGroup> = {
  'anxiety-relief': 'anxietyRelief',
  'steady-mind': 'steadyMind',
  'panic-relief': 'panicRelief',
  'tension-release': 'tensionRelease',
  'physiological-sigh': 'physiologicalSigh',
};

/** Which part of practice a session was: an exercise, meditation, or a visit to Home's sky (the starfield, sunrise, dusk, the sky clock). */
export function practiceGroup(s: Pick<LoggedSession, 'kind' | 'exercise'>): PracticeGroup {
  if (s.kind === 'meditation') return 'meditation';
  return EXERCISE_GROUP[s.exercise] ?? 'tanafas';
}

/** Whole minutes in each part, from the sessions' seconds added up first (so short sessions still count together). */
export function minutesByGroup(sessions: LoggedSession[]): Record<PracticeGroup, number> {
  const seconds = Object.fromEntries(PRACTICE_GROUPS.map((g) => [g, 0])) as Record<PracticeGroup, number>;
  for (const s of sessions) seconds[practiceGroup(s)] += s.durationSeconds;
  return Object.fromEntries(PRACTICE_GROUPS.map((g) => [g, Math.round(seconds[g] / 60)])) as Record<PracticeGroup, number>;
}

/** The week `now` is in, Monday to Monday (as the leaderboard's week), and the one before. */
export function weekBounds(now: Date): { from: Date; to: Date; lastFrom: Date } {
  const day = (now.getDay() + 6) % 7; // Monday 0 … Sunday 6
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  return {
    from,
    to: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7),
    lastFrom: new Date(from.getFullYear(), from.getMonth(), from.getDate() - 7),
  };
}

/** Local yyyy-mm-dd. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface DayPractice {
  minutes: number;
  /** The part with the most time that day. */
  mostly: PracticeGroup;
}

/** Each day practised (by its local yyyy-mm-dd): its minutes, and what it mostly was. Days with none are absent. */
export function practiceByDay(sessions: LoggedSession[]): Map<string, DayPractice> {
  const days = new Map<string, LoggedSession[]>();
  for (const s of sessions) {
    const k = dayKey(new Date(s.startedAt));
    days.set(k, [...(days.get(k) ?? []), s]);
  }
  const out = new Map<string, DayPractice>();
  for (const [k, list] of days) {
    const byGroup = minutesByGroup(list);
    const seconds = list.reduce((sum, s) => sum + s.durationSeconds, 0);
    const mostly = PRACTICE_GROUPS.reduce((best, g) => (byGroup[g] > byGroup[best] ? g : best), practiceGroup(list[0]));
    out.set(k, { minutes: Math.max(1, Math.round(seconds / 60)), mostly });
  }
  return out;
}

/** The month `now` is in: its first day, the first of the next, and how many days it has. */
export function monthBounds(now: Date): { from: Date; to: Date; days: number } {
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { from, to, days: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() };
}

/**
 * Minutes in each part of practice on each day of a month (index 0 is the 1st), for the month in
 * ridges. Seconds are added up first, as minutesByGroup does, then shown as fractional minutes.
 */
export function minutesByDayAndGroup(sessions: LoggedSession[], from: Date, days: number): Record<PracticeGroup, number>[] {
  const out = Array.from({ length: days }, () => Object.fromEntries(PRACTICE_GROUPS.map((g) => [g, 0])) as Record<PracticeGroup, number>);
  for (const s of sessions) {
    const d = new Date(s.startedAt);
    const i = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - from.getTime()) / 86400000);
    if (i >= 0 && i < days) out[i][practiceGroup(s)] += s.durationSeconds / 60;
  }
  return out;
}

/**
 * A centred moving average over `window` days, through day `through` (0-based, today) only: the
 * ridges swell with the weeks rather than spiking day to day, and the days to come stay empty.
 */
export function smoothed(values: number[], through: number, window = 7): number[] {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    if (i > through) return 0;
    const lo = Math.max(0, i - half);
    const hi = Math.min(through, i + half);
    let sum = 0;
    for (let k = lo; k <= hi; k++) sum += values[k];
    return sum / (hi - lo + 1);
  });
}
