import { supabase } from '@/lib/supabase';
import { generateId, getLocalDb } from '@/lib/localDb';
import type { TestScores } from './types';

/**
 * Self-reflection results. On-device by default (same local database as
 * the journal). "Save to my profile" is a separate, explicit opt-in that
 * copies one result to Supabase `psychometric_results`, readable only by
 * its owner (FEATURES_BRIEF §5). Sensitive, health-adjacent data: never
 * join it into any public RPC.
 */
export interface StoredResult {
  id: string;
  testId: string;
  version: number;
  scores: TestScores;
  takenAt: number;
  savedToProfile: boolean;
}

interface Row {
  id: string;
  test_id: string;
  version: number;
  scores: string;
  taken_at: number;
  saved_to_profile: number;
}

const fromRow = (r: Row): StoredResult => ({
  id: r.id,
  testId: r.test_id,
  version: r.version,
  scores: JSON.parse(r.scores) as TestScores,
  takenAt: r.taken_at,
  savedToProfile: r.saved_to_profile === 1,
});

export async function saveResultLocally(testId: string, version: number, scores: TestScores): Promise<StoredResult> {
  const db = await getLocalDb();
  const result: StoredResult = { id: generateId(), testId, version, scores, takenAt: Date.now(), savedToProfile: false };
  await db.runAsync(
    'INSERT INTO psychometric_results (id, test_id, version, scores, taken_at, saved_to_profile) VALUES (?, ?, ?, ?, ?, 0);',
    [result.id, testId, version, JSON.stringify(scores), result.takenAt],
  );
  return result;
}

export async function getResult(id: string): Promise<StoredResult | null> {
  const db = await getLocalDb();
  const row = await db.getFirstAsync<Row>('SELECT * FROM psychometric_results WHERE id = ?;', [id]);
  return row ? fromRow(row) : null;
}

/** Newest first. */
export async function listResults(): Promise<StoredResult[]> {
  const db = await getLocalDb();
  const rows = await db.getAllAsync<Row>('SELECT * FROM psychometric_results ORDER BY taken_at DESC;');
  return rows.map(fromRow);
}

export async function deleteResult(id: string): Promise<void> {
  const db = await getLocalDb();
  await db.runAsync('DELETE FROM psychometric_results WHERE id = ?;', [id]);
}

/**
 * The explicit opt-in. Requires a signed-in Alias; returns false (never
 * throws) on any failure so the screen can say so plainly.
 */
export async function saveResultToProfile(result: StoredResult): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return false;
    // No `.select()` chained — only the owner has a SELECT policy, and we don't need the row back.
    const { error } = await supabase.from('psychometric_results').insert({
      user_id: userId,
      test_id: result.testId,
      version: result.version,
      scores: result.scores,
      taken_at: new Date(result.takenAt).toISOString(),
    });
    if (error) return false;
    const db = await getLocalDb();
    await db.runAsync('UPDATE psychometric_results SET saved_to_profile = 1 WHERE id = ?;', [result.id]);
    return true;
  } catch {
    return false;
  }
}
