import { supabase } from './supabase';

export type TanafasSessionKind = 'breathing' | 'meditation' | 'mood';

/**
 * Records a Tanafas session (breathing, meditation, or — for Segment 5's
 * streaks — a mood/journal check-in) for the community map and the
 * streak/leaderboard. Alias users only — Guests keep the "nothing stored
 * beyond the device" promise exactly as stated, so this silently no-ops
 * when there's no signed-in session. Records on any session end, not just a
 * natural completion (finishing all cycles or reaching the target
 * duration) — someone stopping early is still usage. A 'mood' entry is
 * instantaneous by nature (no real duration to time), so 0 is a valid
 * duration here — only genuinely negative values (a caller bug) are
 * rejected.
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
