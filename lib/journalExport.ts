import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { formatEntryDateLong, loadEntries, type MoodTag } from './journal';

/** What the export needs from the string catalogue, in the reader's language. */
export interface JournalExportLabels {
  title: string;
  /** "Exported {date}". */
  exportedOn: string;
  empty: string;
  moods: Record<MoodTag, string>;
  dateNames: Parameters<typeof formatEntryDateLong>[1];
  num: (n: number) => string;
  rtl: boolean;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The journal as a page to read: newest first, each entry's date, mood and words. */
export function journalHtml(entries: Awaited<ReturnType<typeof loadEntries>>, l: JournalExportLabels): string {
  const today = formatEntryDateLong(new Date(), l.dateNames, l.num);
  const body = entries.length
    ? entries
        .map((e) => {
          const date = formatEntryDateLong(new Date(e.date + 'T00:00:00'), l.dateNames, l.num);
          const words = e.text.trim() ? `<p>${escape(e.text.trim()).replace(/\n/g, '<br>')}</p>` : '';
          return `<section><h2>${escape(date)}</h2><div class="mood">${escape(l.moods[e.mood] ?? '')}</div>${words}</section>`;
        })
        .join('')
    : `<p class="empty">${escape(l.empty)}</p>`;
  return `<!doctype html><html lang="${l.rtl ? 'ar' : 'en'}" dir="${l.rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(l.title)}</title>
<style>
  body { font-family: ${l.rtl ? "'IBM Plex Sans Arabic', 'Noto Naskh Arabic', 'Segoe UI', sans-serif" : "'Figtree', 'Helvetica Neue', Arial, sans-serif"}; color: #1B2140; margin: 40px; line-height: 1.6; }
  header { border-bottom: 2px solid #3BAAA7; padding-bottom: 12px; margin-bottom: 24px; }
  h1 { font-size: 26px; margin: 0; color: #196662; }
  .when { color: #6B7085; font-size: 13px; margin-top: 4px; }
  section { page-break-inside: avoid; margin: 0 0 22px; }
  h2 { font-size: 15px; margin: 0 0 2px; }
  .mood { color: #3BAAA7; font-size: 13px; margin-bottom: 6px; }
  p { margin: 0; font-size: 14px; white-space: normal; }
  .empty { color: #6B7085; }
</style></head><body><header><h1>${escape(l.title)}</h1><div class="when">${escape(l.exportedOn.replace('{date}', today))}</div></header>${body}</body></html>`;
}

/**
 * The journal's export (CLAUDE.md: a local-only journal needs one): a PDF anyone can open, from
 * the entries on this phone, shared through the system sheet so it can be saved anywhere. PDF
 * printing is native (expo-print): where it isn't built in yet (an older dev client, the web),
 * the same page is shared as an HTML file, which opens in any browser and prints to PDF.
 */
/**
 * The last export's file. It's removed when the next export starts rather than straight after
 * sharing: on Android the share sheet can close before the receiving app (Drive, say) has read it.
 */
let lastExport: string | null = null;

export async function exportJournal(labels: JournalExportLabels): Promise<void> {
  if (lastExport) {
    try {
      const old = new File(lastExport);
      if (old.exists) old.delete();
    } catch {}
    lastExport = null;
  }
  const html = journalHtml(await loadEntries(), labels);
  const stamp = new Date().toISOString().slice(0, 10);
  let uri: string | null = null;
  let mimeType = 'application/pdf';
  try {
    const Print = await import('expo-print');
    const out = await Print.printToFileAsync({ html });
    uri = out.uri;
  } catch {
    const file = new File(Paths.cache, `houna-journal-${stamp}.html`);
    if (file.exists) file.delete();
    file.create();
    file.write(html);
    uri = file.uri;
    mimeType = 'text/html';
  }
  lastExport = uri;
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.html', dialogTitle: labels.title });
  }
}
