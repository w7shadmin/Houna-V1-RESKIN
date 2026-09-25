import * as SQLite from 'expo-sqlite';

/**
 * The on-device database shared by the journal and other private,
 * device-only records (self-reflection results; later the session log for
 * Recap). One file — `houna-journal.db`, the journal's original name, so
 * existing entries are untouched — with each table created on first open.
 * Nothing here is synced; it is included in the phone's normal OS backup.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getLocalDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('houna-journal.db').then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY NOT NULL,
          date TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          text TEXT NOT NULL,
          mood TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS psychometric_results (
          id TEXT PRIMARY KEY NOT NULL,
          test_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          scores TEXT NOT NULL,
          taken_at INTEGER NOT NULL,
          saved_to_profile INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY NOT NULL,
          kind TEXT NOT NULL,
          exercise TEXT NOT NULL,
          started_at INTEGER NOT NULL,
          duration_seconds INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS sessions_started_at ON sessions (started_at);
      `);
      return db;
    });
  }
  return dbPromise;
}

/** Local, non-cryptographic UUID v4 — fine for client-only primary keys. */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
