import type { LoggedSession } from './sessionLog';
import type { LeaderboardRow, StreakInfo } from './streaks';

/**
 * SHOWCASE MODE — temporary, for presenting the app. While true, the app shows generated demo
 * data on top of the real: a busier community map, a full month of practice in every colour
 * (Profile's graphs, Stats, Recap), a long streak, badges and a leaderboard. Nothing is written
 * anywhere (badge awards are skipped), and the phone's own log is untouched. Set to false to go
 * back to normal; delete this file and its uses once the showcase is over.
 */
export const SHOWCASE = true;

/** A fixed seed, so the demo looks the same every time. */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** What a day of practice might hold: every part of practice, so every colour shows. */
const PRACTICE: { kind: LoggedSession['kind']; exercise: string; minutes: [number, number]; weight: number }[] = [
  { kind: 'breathing', exercise: 'anxiety-relief', minutes: [3, 8], weight: 4 },
  { kind: 'breathing', exercise: 'physiological-sigh', minutes: [2, 5], weight: 3 },
  { kind: 'breathing', exercise: 'steady-mind', minutes: [3, 8], weight: 3 },
  { kind: 'breathing', exercise: 'panic-relief', minutes: [3, 7], weight: 2 },
  { kind: 'breathing', exercise: 'tension-release', minutes: [5, 12], weight: 2 },
  { kind: 'meditation', exercise: 'fire', minutes: [5, 20], weight: 2 },
  { kind: 'meditation', exercise: 'rain', minutes: [5, 15], weight: 2 },
  { kind: 'meditation', exercise: 'forest', minutes: [5, 15], weight: 1 },
  { kind: 'meditation', exercise: 'ocean', minutes: [5, 15], weight: 1 },
  { kind: 'breathing', exercise: 'starfield', minutes: [1, 4], weight: 2 },
  { kind: 'breathing', exercise: 'sunrise', minutes: [1, 3], weight: 1 },
  { kind: 'breathing', exercise: 'dusk', minutes: [1, 3], weight: 1 },
];
const TOTAL_WEIGHT = PRACTICE.reduce((a, p) => a + p.weight, 0);
/** How far back the demo goes, and the unbroken run up to today. */
const DAYS_BACK = 80;
const STREAK_DAYS = 23;

let cache: LoggedSession[] | null = null;

/** The demo sessions, from DAYS_BACK ago up to now. */
export function demoSessions(): LoggedSession[] {
  if (cache) return cache;
  const rand = seeded(2026);
  const now = Date.now();
  const today = new Date();
  const out: LoggedSession[] = [];
  for (let back = DAYS_BACK; back >= 0; back--) {
    // The last STREAK_DAYS every day; before that, most days.
    if (back > STREAK_DAYS && rand() < 0.22) continue;
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back);
    const count = 1 + Math.floor(rand() * 3.2);
    for (let k = 0; k < count; k++) {
      let pick = rand() * TOTAL_WEIGHT;
      const p = PRACTICE.find((x) => (pick -= x.weight) < 0) ?? PRACTICE[0];
      const minutes = p.minutes[0] + rand() * (p.minutes[1] - p.minutes[0]);
      // Mornings and evenings, mostly.
      const hour = rand() < 0.5 ? 6 + rand() * 4 : 18 + rand() * 5;
      const startedAt = day.getTime() + hour * 3600000;
      if (startedAt > now - 600000) continue;
      out.push({ id: `showcase-${back}-${k}`, kind: p.kind, exercise: p.exercise, startedAt: Math.round(startedAt), durationSeconds: Math.round(minutes * 60) });
    }
  }
  // Today counts too, so the streak runs through it.
  const morning = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 30).getTime();
  if (morning < now && !out.some((x) => x.startedAt >= morning)) {
    out.push({ id: 'showcase-today', kind: 'breathing', exercise: 'anxiety-relief', startedAt: morning, durationSeconds: 300 });
  }
  cache = out.sort((a, b) => a.startedAt - b.startedAt);
  return cache;
}

export function demoSessionsBetween(from: Date, to: Date): LoggedSession[] {
  return demoSessions().filter((x) => x.startedAt >= from.getTime() && x.startedAt < to.getTime());
}

export function demoDays(): Set<string> {
  return new Set(demoSessions().map((x) => dayKey(new Date(x.startedAt))));
}

export const demoStreak = (): StreakInfo => ({ current: STREAK_DAYS + 1, longest: 27 });

/** Badges held: the early streak ones and the exploring ones, earned over the demo's weeks. */
export function demoBadges(): Map<string, string> {
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
  return new Map([
    ['first_session', at(78)],
    ['streak_3', at(70)],
    ['streak_7', at(62)],
    ['all_breathing', at(55)],
    ['streak_14', at(40)],
    ['all_scenes', at(30)],
    ['all_skies', at(12)],
  ]);
}

export const demoBadgeShares = (): Record<string, number> => ({
  first_session: 92,
  streak_3: 61,
  streak_7: 38,
  streak_14: 19,
  streak_30: 8,
  streak_100: 2,
  all_breathing: 27,
  all_scenes: 22,
  all_skies: 14,
});

const LEADERS: [string, number, number][] = [
  ['noor.breathes', 31, 214],
  ['Layla', 27, 188],
  ['sama_k', 24, 161],
  ['yousef.a', 22, 149],
  ['hala', 19, 133],
  ['calm.omar', 17, 118],
  ['reem_s', 15, 97],
  ['dana.q', 13, 84],
  ['faisal', 11, 71],
  ['mariam', 9, 58],
];

export function demoLeaderboard(period: 'week' | 'all'): LeaderboardRow[] {
  const k = period === 'week' ? 1 : 9.4;
  return LEADERS.map(([username, sessions, minutes]) => ({ username, session_count: Math.round(sessions * k), total_minutes: Math.round(minutes * k) }));
}

/** Where people breathed with Houna: the Gulf and the region first, then the wider world. */
const COUNTRIES: [string, number][] = [
  ['KW', 412], ['SA', 388], ['AE', 301], ['QA', 142], ['BH', 118], ['OM', 96], ['EG', 184], ['JO', 88],
  ['LB', 64], ['IQ', 71], ['MA', 58], ['TN', 33], ['DZ', 29], ['PS', 41], ['SY', 22], ['SD', 17], ['YE', 14], ['LY', 11],
  ['TR', 47], ['GB', 86], ['US', 104], ['CA', 44], ['DE', 39], ['FR', 36], ['NL', 18], ['SE', 15], ['IE', 9], ['ES', 12],
  ['IT', 10], ['IN', 52], ['PK', 38], ['MY', 26], ['ID', 21], ['AU', 24], ['NZ', 6], ['SG', 13], ['JP', 7], ['BR', 9], ['ZA', 8], ['NG', 10],
];

export function demoActivity(period: '24h' | 'week' | 'month' | string): { totalSessions: number; totalPeople: number; countries: { country: string; count: number }[] } {
  // Fewer places in a day than in a month.
  const share = period === '24h' ? 0.035 : period === 'week' ? 0.24 : 1;
  const reach = period === '24h' ? 18 : period === 'week' ? 32 : COUNTRIES.length;
  const countries = COUNTRIES.slice(0, reach).map(([country, count]) => ({ country, count: Math.max(1, Math.round(count * share)) }));
  const people = countries.reduce((a, c) => a + c.count, 0);
  return { totalSessions: Math.round(people * 2.6), totalPeople: people, countries };
}
