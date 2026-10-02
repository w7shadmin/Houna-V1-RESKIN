import type { LoggedSession } from '../sessionLog';
import type { JournalEntry, MoodTag } from '../journal';

/**
 * Recap numbers (FEATURES_BRIEF §6) from the on-device session log and the
 * journal. Pure — no storage or RN imports — so it runs under `npm test`.
 *
 * The mood part is descriptive only: counts per mood, no score, no
 * comparison with any other period, no streaks.
 */
export interface Recap {
  breathingMinutes: number;
  /** Most-used breathing exercise id; ties go to the most recent. */
  goToExercise: string | null;
  meditationMinutes: number;
  favouriteScene: string | null;
  /** Distinct days with at least one journal entry. */
  journalDays: number;
  wordsWritten: number;
  /** Only moods that were logged at least once, most frequent first. */
  moods: { mood: MoodTag; count: number }[];
}

function minutes(sessions: LoggedSession[]): number {
  return Math.round(sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60);
}

function mostUsed(sessions: LoggedSession[]): string | null {
  const counts = new Map<string, { n: number; last: number }>();
  for (const s of sessions) {
    const c = counts.get(s.exercise) ?? { n: 0, last: 0 };
    c.n += 1;
    c.last = Math.max(c.last, s.startedAt);
    counts.set(s.exercise, c);
  }
  let best: string | null = null;
  let bestC = { n: 0, last: 0 };
  for (const [exercise, c] of counts) {
    if (c.n > bestC.n || (c.n === bestC.n && c.last > bestC.last)) {
      best = exercise;
      bestC = c;
    }
  }
  return best;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}

/** Local yyyy-mm-dd of `d`, matching how journal entries store `date`. */
function localDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** `sessions` should already be limited to [from, to); journal entries are filtered here by their day. */
export function computeRecap(sessions: LoggedSession[], entries: JournalEntry[], from: Date, to: Date): Recap {
  const breathing = sessions.filter((s) => s.kind === 'breathing');
  const meditation = sessions.filter((s) => s.kind === 'meditation');

  const fromDay = localDate(from);
  const toDay = localDate(to);
  const inPeriod = entries.filter((e) => e.date >= fromDay && e.date < toDay);

  const moodCounts = new Map<MoodTag, number>();
  for (const e of inPeriod) moodCounts.set(e.mood, (moodCounts.get(e.mood) ?? 0) + 1);

  return {
    breathingMinutes: minutes(breathing),
    goToExercise: mostUsed(breathing),
    meditationMinutes: minutes(meditation),
    favouriteScene: mostUsed(meditation),
    journalDays: new Set(inPeriod.map((e) => e.date)).size,
    wordsWritten: inPeriod.reduce((sum, e) => sum + countWords(e.text), 0),
    moods: [...moodCounts]
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export type RecapPeriod = 'month' | 'year';

/** [start of this month/year, start of the next) in local time. */
export function periodBounds(period: RecapPeriod, now: Date = new Date()): { from: Date; to: Date } {
  if (period === 'year') {
    return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1) };
  }
  return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
}
