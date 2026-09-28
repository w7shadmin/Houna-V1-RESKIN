import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { exportJournal } from '@/lib/journalExport';

/** Exports the journal as a PDF in the reader's language (lib/journalExport.ts). */
export function useJournalExport() {
  const { t, isRTL } = useLanguage();
  return useCallback(
    () =>
      exportJournal({
        title: t.journal.exportTitle,
        exportedOn: t.journal.exportedOn,
        empty: t.journal.exportEmpty,
        moods: t.journal.moodLabelsFull,
        dateNames: t.journal.dateNames,
        num: (n: number) => (isRTL ? arabicNumber(n) : String(n)),
        rtl: isRTL,
      }),
    [t, isRTL],
  );
}
