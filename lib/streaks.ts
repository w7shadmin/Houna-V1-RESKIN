import { supabase } from './supabase';
import { localDateString } from './journal';
import { qualifyingBadges, type BadgeCode } from './badges';
import type { LoggedSession } from './sessionLog';

/**
 * Streaks/leaderboard (Segment 5 of the accounts roadmap) — reads the same
 * `tanafas_sessions` table Segment 2's usage tracking writes to — breathing
 * and meditation sessions only. Mood and journal activity never count toward
 * a streak (no streaks or guilt mechanics on mood logging).
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
  // Exercise sessions only — mood logging never feeds a streak (CLAUDE.md safety
  // requirement). Older rows with kind 'mood' are still in the table, so filter.
  const { data } = await supabase.from('tanafas_sessions').select('started_at').neq('kind', 'mood');
  const activeDays = new Set((data ?? []).map((row) => localDateString(new Date(row.started_at))));
  return computeStreak(activeDays);
}

/**
 * Awards every badge the practice now qualifies for (lib/badges.ts: the streak, and what's been
 * tried, from the phone's own session log) and returns the ones that are new, for the unlock
 * moment. `UNIQUE (user_id, badge_code)` keeps a repeat insert harmless.
 */
export async function awardBadges(userId: string, currentStreak: number, sessions: Pick<LoggedSession, 'kind' | 'exercise'>[]): Promise<BadgeCode[]> {
  const held = await getMyBadges();
  const due = qualifyingBadges(currentStreak, sessions).filter((code) => !held.has(code));
  if (due.length === 0) return [];
  const { error } = await supabase
    .from('badges_earned')
    .upsert(due.map((code) => ({ user_id: userId, badge_code: code })), { onConflict: 'user_id,badge_code', ignoreDuplicates: true });
  return error ? [] : due;
}

/** The badges held, each with when it was earned (ISO). */
export async function getMyBadges(): Promise<Map<string, string>> {
  const { data } = await supabase.from('badges_earned').select('badge_code, earned_at');
  return new Map((data ?? []).map((row) => [row.badge_code as string, row.earned_at as string]));
}

/** Each badge's share of Houna's Aliases, as a whole percentage (get_badge_shares: counts only, no names). */
export async function getBadgeShares(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('get_badge_shares');
  if (error || !data) return {};
  return Object.fromEntries((data as { badge_code: string; share: number }[]).map((r) => [r.badge_code, r.share]));
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
