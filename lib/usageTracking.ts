import { supabase } from './supabase';
import { activityActor } from './activityActor';
import { MIN_SESSION_SECONDS } from './sessionLog';

/** Exercise sessions only — mood/journal activity is never recorded here (it would feed streaks). */
export type TanafasSessionKind = 'breathing' | 'meditation';

/**
 * Records a Tanafas exercise session (breathing or meditation) for the
 * streak/leaderboard. Alias users only — Guests keep the "nothing stored
 * beyond the device" promise exactly as stated, so this silently no-ops
 * when there's no signed-in session. Records on any session end, not just a
 * natural completion (finishing all cycles or reaching the target
 * duration) — someone stopping early is still usage, as long as it lasted the
 * app-wide minimum (MIN_SESSION_SECONDS): the database refuses shorter ones, so
 * the leaderboard can't be padded with empty sessions.
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
    if (duration_seconds < MIN_SESSION_SECONDS) return;

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
 * alike, with no user id: the Alias's opted-in country, if any, and this install's anonymous
 * `actor` id, so the map counts each person once, where they are now (lib/activityActor.ts).
 * Unlike `recordTanafasSession`, it never feeds streaks or the leaderboard.
 *
 * Sent through `record_activity`, which keeps at most one ping a minute per phone (the table
 * itself takes no inserts). Changing country never sends one: `move_my_activity` moves the
 * pings already there. Fire-and-forget.
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
    const actor = await activityActor();
    if (!actor) return;
    await supabase.rpc('record_activity', { p_kind: kind, p_actor: actor, p_country: country });
  } catch {
    // Non-fatal, like recordTanafasSession.
  }
}
