/**
 * Journal + mood storage — SQLite, on-device only. No account, no sync, no
 * server round-trip (CLAUDE.md: journal/mood data must never leave the
 * device except through a deliberate user-initiated export).
 *
 * Ported from the old MVP's `journal-store.ts` (localStorage-based). The
 * entry shape gained `updatedAt` (houna-port-reference.md) — the old MVP
 * only tracked `createdAt`. `id` is now a real UUID rather than the old
 * `${Date.now()}-${random}` string.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MOOD_STYLE } from '@/constants/moods';
import { generateId, getLocalDb } from './localDb';

/** The seven moods on the check-in slider, heavy → light (see constants/moods.ts). */
export type Mood = 'angry' | 'anxious' | 'sad' | 'neutral' | 'calm' | 'hopeful' | 'joyful';
/** Moods older entries can carry but the slider no longer offers. */
export type LegacyMood = 'frustrated' | 'tired';
/** Anything a stored entry can hold. */
export type MoodTag = Mood | LegacyMood;

/** Heavy → light: the slider's order. */
export const MOOD_ORDER: Mood[] = ['angry', 'anxious', 'sad', 'neutral', 'calm', 'hopeful', 'joyful'];

/** Light → heavy: pickers and legends. */
export const MOOD_TAGS: Mood[] = [...MOOD_ORDER].reverse();

/**
 * A retired mood's place on today's scale — frustrated sits with angry and
 * tired with sad (the Mood Meter puts fatigue in the same low-energy,
 * unpleasant quadrant as sadness).
 */
export function currentMood(tag: MoodTag): Mood {
  if (tag === 'frustrated') return 'angry';
  if (tag === 'tired') return 'sad';
  return tag;
}

export const MOOD_EMOJI: Record<MoodTag, string> = {
  angry: '😡',
  anxious: '😰',
  sad: '😔',
  neutral: '😐',
  calm: '😌',
  hopeful: '🙂',
  joyful: '😄',
  frustrated: '😣',
  tired: '😴',
};

/** Journal colours come from the same table as the slider and recap. */
export const MOOD_COLORS = Object.fromEntries(
  Object.entries(MOOD_STYLE).map(([tag, style]) => [tag, style.color]),
) as Record<MoodTag, string>;

/** Higher = lighter, 1–7 (heavy → light); retired moods sit between their neighbours. */
export const MOOD_VALUES: Record<MoodTag, number> = {
  angry: 1,
  anxious: 2,
  sad: 3,
  neutral: 4,
  calm: 5,
  hopeful: 6,
  joyful: 7,
  frustrated: 1.5,
  tired: 3.5,
};

export const MOOD_VALUE_MAX = 7;

export interface JournalEntry {
  id: string;
  date: string; // ISO date, yyyy-mm-dd, local
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  text: string;
  mood: MoodTag;
}

interface JournalEntryRow {
  id: string;
  date: string;
  created_at: number;
  updated_at: number;
  text: string;
  mood: MoodTag;
}

function rowToEntry(row: JournalEntryRow): JournalEntry {
  return {
    id: row.id,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    text: row.text,
    mood: row.mood,
  };
}

const getDb = getLocalDb;

export function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayDateString(): string {
  return localDateString(new Date());
}

/** Deterministic per-day pick from a prompts array — same index for everyone on a given date. */
export function getPromptForToday(prompts: string[]): string {
  const dateStr = todayDateString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) & 0x7fffffff;
  }
  return prompts[hash % prompts.length];
}

export async function loadEntries(): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<JournalEntryRow>(
    'SELECT * FROM journal_entries ORDER BY created_at DESC;',
  );
  return rows.map(rowToEntry);
}

export async function getEntry(id: string): Promise<JournalEntry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<JournalEntryRow>(
    'SELECT * FROM journal_entries WHERE id = ?;',
    [id],
  );
  return row ? rowToEntry(row) : null;
}

export async function saveEntry(text: string, mood: MoodTag): Promise<JournalEntry> {
  const db = await getDb();
  const now = Date.now();
  const entry: JournalEntry = {
    id: generateId(),
    date: todayDateString(),
    createdAt: now,
    updatedAt: now,
    text,
    mood,
  };
  await db.runAsync(
    'INSERT INTO journal_entries (id, date, created_at, updated_at, text, mood) VALUES (?, ?, ?, ?, ?, ?);',
    [entry.id, entry.date, entry.createdAt, entry.updatedAt, entry.text, entry.mood],
  );
  return entry;
}

export async function updateEntry(id: string, text: string, mood: MoodTag): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE journal_entries SET text = ?, mood = ?, updated_at = ? WHERE id = ?;',
    [text, mood, Date.now(), id],
  );
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM journal_entries WHERE id = ?;', [id]);
}

/** Most recent entry for today, if any — used by the Home screen's quick mood check-in. */
export async function getTodayEntry(): Promise<JournalEntry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<JournalEntryRow>(
    'SELECT * FROM journal_entries WHERE date = ? ORDER BY created_at DESC LIMIT 1;',
    [todayDateString()],
  );
  return row ? rowToEntry(row) : null;
}

/**
 * Mood check-in log. Updates today's most recent entry's mood if one exists
 * (preserving any text already written, with `note` appended), or creates a
 * new entry otherwise — it becomes an ordinary journal entry the user can
 * add to later, rather than a separate mood-only record.
 */
export async function logMoodForToday(mood: MoodTag, note = ''): Promise<JournalEntry> {
  const words = note.trim();
  const existing = await getTodayEntry();
  if (existing) {
    const prior = existing.text.trim();
    const text = !words ? existing.text : prior ? `${prior}\n\n${words}` : words;
    await updateEntry(existing.id, text, mood);
    return { ...existing, text, mood, updatedAt: Date.now() };
  }
  return saveEntry(words, mood);
}

interface DateNames {
  weekdaysShort: string[];
  weekdaysLong: string[];
  monthsShort: string[];
  monthsLong: string[];
}

function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/** e.g. "Mon, Sep 21" — locale names come from the string catalogue, never hardcoded here. */
export function formatEntryDateShort(dateStr: string, names: DateNames, num: (n: number) => string): string {
  const d = parseLocalDate(dateStr);
  return `${names.weekdaysShort[d.getDay()]}, ${names.monthsShort[d.getMonth()]} ${num(d.getDate())}`;
}

/** e.g. "Sunday, September 21" — used for the new-entry heading. */
export function formatEntryDateLong(d: Date, names: DateNames, num: (n: number) => string): string {
  return `${names.weekdaysLong[d.getDay()]}, ${names.monthsLong[d.getMonth()]} ${num(d.getDate())}`;
}

export async function exportEntriesAsJson(): Promise<string> {
  const entries = await loadEntries();
  return JSON.stringify(entries, null, 2);
}

/**
 * Real backup mechanism: writes all entries to a JSON file and opens the
 * native share sheet so the user can save it anywhere they choose (Files,
 * email to self, cloud drive, etc). Replaces the old MVP's decorative
 * Canvas "share as image" feature, which has no RN equivalent — this is
 * the actual data-loss protection CLAUDE.md asks for, since the journal
 * lives only in this on-device database.
 */
export async function exportAndShareJournal(): Promise<void> {
  const json = await exportEntriesAsJson();
  const file = new File(Paths.cache, `houna-journal-export-${Date.now()}.json`);
  file.create();
  file.write(json);
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
  }
}
