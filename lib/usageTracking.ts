import { supabase } from './supabase';

/** Exercise sessions only — mood/journal activity is never recorded here (it would feed streaks). */
export type TanafasSessionKind = 'breathing' | 'meditation';

/**
 * Records a Tanafas exercise session (breathing or meditation) for the
 * streak/leaderboard. Alias users only — Guests keep the "nothing stored
 * beyond the device" promise exactly as stated, so this silently no-ops
 * when there's no signed-in session. Records on any session end, not just a
 * natural completion (finishing all cycles or reaching the target
 * duration) — someone stopping early is still usage. Only genuinely
 * negative durations (a caller bug) are rejected.
 *
 * Fire-and-forget by design: a failed write must never interrupt the
 * breathing/meditation UI, so errors are swallowed here rather than left
 * for call sites to handle.
 */
export async function recordTanafasSession(
  kind: TanafasSessionKind,
  startedAt: Date,
  endedAt: Date = new Date(),
): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;

    const duration_seconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
    if (duration_seconds < 0) return;

    await supabase.from('tanafas_sessions').insert({
      user_id: userId,
      kind,
      started_at: startedAt.toISOString(),
      completed_at: endedAt.toISOString(),
      duration_seconds,
    });
  } catch {
    // Non-fatal — usage tracking is a nice-to-have, never worth surfacing an error for.
  }
}

/**
 * Anonymous "someone just started a session" ping for Home's community
 * counter (`activity_pings`, FEATURES_BRIEF §1). Sent for Guests and Aliases
 * alike, with no user id — only the Alias's opted-in country, if any.
 * Unlike `recordTanafasSession`, it never feeds streaks or the leaderboard.
 *
 * Fire-and-forget; a no-op until the table exists.
 */
export async function pingActivity(kind: 'breathing' | 'meditation'): Promise<void> {
  try {
    let country: string | null = null;
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (userId) {
      const { data: profile } = await supabase.from('profiles').select('country').eq('id', userId).maybeSingle();
      country = profile?.country ?? null;
    }
    // No `.select()` after the insert — there's deliberately no SELECT policy (CLAUDE.md).
    await supabase.from('activity_pings').insert({ kind, country });
  } catch {
    // Non-fatal, like recordTanafasSession.
  }
}
