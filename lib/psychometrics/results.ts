import { generateId, getLocalDb } from '@/lib/localDb';
import type { TestScores } from './types';

/**
 * Self-reflection results: on this phone only (the same local database as the journal). They're
 * health data, so they never leave it; the old "Save to my profile" copy to the server was removed
 * (30 Sep 2026, the store compliance pack). `savedToProfile` only marks results saved that way before.
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

