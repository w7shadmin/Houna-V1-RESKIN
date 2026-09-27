import type { LoggedSession } from './sessionLog';

/**
 * The nine badges (canvas "Phase 6 — nine skies, set in gems"): five for a practice streak, a
 * journey through the day, and four for exploring. Pure (no storage or RN imports), so it runs
 * under `npm test`. Awarding and storage are in lib/streaks.ts (Aliases only). Only breathing and
 * meditation are ever logged, so mood and the journal can never earn a badge.
 */
export const STREAK_BADGES = [
  { code: 'streak_3', days: 3 },
  { code: 'streak_7', days: 7 },
  { code: 'streak_14', days: 14 },
  { code: 'streak_30', days: 30 },
  { code: 'streak_100', days: 100 },
] as const;
export const EXPLORE_BADGES = ['first_session', 'all_breathing', 'all_scenes', 'all_skies'] as const;

export type BadgeCode = (typeof STREAK_BADGES)[number]['code'] | (typeof EXPLORE_BADGES)[number];

/** The order they're shown in: the first breath, then along the day, the rest of exploring last. */
export const BADGE_ORDER: readonly BadgeCode[] = [
  'first_session',
  'streak_3',
  'streak_7',
  'all_breathing',
  'streak_14',
  'streak_30',
  'streak_100',
  'all_scenes',
  'all_skies',
];

export const isBadgeCode = (code: string): code is BadgeCode => (BADGE_ORDER as readonly string[]).includes(code);

/** What each exploring badge asks for, by the session log's `exercise` ids. */
const BREATHING = ['anxiety-relief', 'steady-mind', 'panic-relief', 'tension-release'];
const SCENES = ['fire', 'rain', 'forest', 'ocean'];
const SKIES = ['sunrise', 'dusk', 'starfield'];

const tried = (sessions: Pick<LoggedSession, 'kind' | 'exercise'>[], kind: LoggedSession['kind'], ids: string[]) =>
  ids.every((id) => sessions.some((s) => s.kind === kind && s.exercise === id));

/** Every badge the practice so far qualifies for: the current streak, and what's been tried (from the log). */
export function qualifyingBadges(streak: number, sessions: Pick<LoggedSession, 'kind' | 'exercise'>[]): BadgeCode[] {
  const out: BadgeCode[] = STREAK_BADGES.filter((b) => streak >= b.days).map((b) => b.code);
  if (sessions.length > 0) out.push('first_session');
  if (tried(sessions, 'breathing', BREATHING)) out.push('all_breathing');
  if (tried(sessions, 'meditation', SCENES)) out.push('all_scenes');
  if (tried(sessions, 'breathing', SKIES)) out.push('all_skies');
  return BADGE_ORDER.filter((c) => out.includes(c));
}

/** A streak badge's days in a row; undefined for exploring badges. */
export function streakDays(code: BadgeCode): number | undefined {
  return STREAK_BADGES.find((b) => b.code === code)?.days;
}

/** The next streak badge not yet held, and the days still to go from `streak`. */
export function nextStreakBadge(held: { has(code: string): boolean }, streak: number): { code: BadgeCode; remaining: number } | null {
  const next = STREAK_BADGES.find((b) => !held.has(b.code));
  return next ? { code: next.code, remaining: Math.max(1, next.days - streak) } : null;
}
