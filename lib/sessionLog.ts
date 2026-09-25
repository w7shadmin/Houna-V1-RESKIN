import { generateId, getLocalDb } from './localDb';

/**
 * On-device log of every breathing/meditation session, for Guests and
 * Aliases alike — the source for Recap (FEATURES_BRIEF §6). Separate from
 * `recordTanafasSession` (Supabase, Aliases only, feeds streaks), which is
 * unchanged. Nothing here is synced.
 */
export type SessionKind = 'breathing' | 'meditation';

export interface LoggedSession {
  id: string;
  kind: SessionKind;
  /** Exercise route id (e.g. 'steady-mind') or meditation scene id. */
  exercise: string;
  startedAt: number;
  durationSeconds: number;
}

/** Shorter than this is an open-and-close, not a session. */
export const MIN_SESSION_SECONDS = 10;

export async function logSession(kind: SessionKind, exercise: string, startedAt: Date, endedAt: Date = new Date()): Promise<void> {
  const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
  if (durationSeconds < MIN_SESSION_SECONDS) return;
  try {
    const db = await getLocalDb();
    await db.runAsync(
      'INSERT INTO sessions (id, kind, exercise, started_at, duration_seconds) VALUES (?, ?, ?, ?, ?);',
      [generateId(), kind, exercise, startedAt.getTime(), durationSeconds],
    );
  } catch {
    // Non-fatal — a missed log entry must never interrupt a session.
  }
}

interface Row {
  id: string;
  kind: SessionKind;
  exercise: string;
  started_at: number;
  duration_seconds: number;
}

/** Sessions that started in [from, to). */
export async function sessionsBetween(from: Date, to: Date): Promise<LoggedSession[]> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<Row>(
    'SELECT * FROM sessions WHERE started_at >= ? AND started_at < ? ORDER BY started_at;',
    [from.getTime(), to.getTime()],
  );
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    exercise: r.exercise,
    startedAt: r.started_at,
    durationSeconds: r.duration_seconds,
  }));
}
