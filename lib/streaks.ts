import { supabase } from './supabase';
import { localDateString } from './journal';

/**
 * Streaks/leaderboard (Segment 5 of the accounts roadmap) — reads the same
 * `tanafas_sessions` table Segment 2's usage tracking writes to, now also
 * fed by mood/journal activity (`kind: 'mood'`, see HomeMoodCard.tsx and
 * the journal entry screen). Wim Hof/Nervous System Reset never appears
 * here — it doesn't use the shared session shell that calls
 * `recordTanafasSession`, so it never writes a row in the first place.
 *
 * Streak math runs client-side against the caller's own rows (already
 * readable under `tanafas_sessions`' own-row RLS) rather than a server
 * function — simple enough not to need one, and it's just a `count`-sized
 * read per Alias, not per app load.
 */

export interface StreakInfo {
  current: number;
  longest: number;
}

export const BADGE_THRESHOLDS = [3, 7, 14, 30, 100] as const;
export type BadgeThreshold = (typeof BADGE_THRESHOLDS)[number];

export function badgeCodeForThreshold(days: BadgeThreshold): string {
  return `streak_${days}`;
}

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return localDateString(d);
}

/** Exported for tests/reuse — pure function over a set of "activity happened this day" date strings. */
export function computeStreak(activeDays: Set<string>): StreakInfo {
  if (activeDays.size === 0) return { current: 0, longest: 0 };

  const sorted = [...activeDays].sort();
  let longest = 0;
  let run = 0;
  let prevDay: string | null = null;
  for (const day of sorted) {
    run = prevDay !== null && addDays(prevDay, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    prevDay = day;
  }

  // Walk backward from today. If today has no activity yet, start counting
  // from yesterday instead — a streak isn't "broken" before today is over.
  let cursor = localDateString(new Date());
  if (!activeDays.has(cursor)) cursor = addDays(cursor, -1);
  let current = 0;
  while (activeDays.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  return { current, longest };
}

export async function getMyStreak(): Promise<StreakInfo> {
  const { data } = await supabase.from('tanafas_sessions').select('started_at');
  const activeDays = new Set((data ?? []).map((row) => localDateString(new Date(row.started_at))));
  return computeStreak(activeDays);
}

/**
 * Awards any streak badges the current streak newly qualifies for.
 * `UNIQUE (user_id, badge_code)` makes the insert naturally idempotent —
 * safe to call every time the streak is recomputed, not just once.
 */
export async function checkAndAwardBadges(userId: string, currentStreak: number): Promise<BadgeThreshold[]> {
  const earned = BADGE_THRESHOLDS.filter((days) => currentStreak >= days);
  if (earned.length === 0) return [];

  const rows = earned.map((days) => ({ user_id: userId, badge_code: badgeCodeForThreshold(days) }));
  await supabase.from('badges_earned').upsert(rows, { onConflict: 'user_id,badge_code', ignoreDuplicates: true });
  return earned;
}

export async function getMyEarnedBadgeCodes(): Promise<Set<string>> {
  const { data } = await supabase.from('badges_earned').select('badge_code');
  return new Set((data ?? []).map((row) => row.badge_code));
}

export interface LeaderboardRow {
  username: string;
  session_count: number;
  total_minutes: number;
}

export async function getLeaderboard(period: 'week' | 'all'): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', { period });
  if (error || !data) return [];
  return data as LeaderboardRow[];
}
