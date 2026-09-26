/**
 * Houna bloom mood check-in (canvas "Mood check-in — Houna bloom"). English
 * copy is the canvas's; Arabic follows the journal catalogue's terms
 * (يومياتك). Copy must never claim the journal "never leaves the device" —
 * it's included in normal OS backups (CLAUDE.md).
 */
export const checkInStrings = {
  en: {
    title: 'How are you feeling right now?',
    close: 'Close',
    sliderLabel: 'Mood',
    heavier: 'Heavier',
    lighter: 'Lighter',
    noteLabel: 'Add a few words · optional',
    notePlaceholder: "What's on your mind?",
    save: 'Save to journal',
    savedPrivately: 'Saved privately in your journal on this phone.',
    saveError: "Couldn't save — please try again.",
  },
  ar: {
    title: 'كيف تشعر الآن؟',
    close: 'إغلاق',
    sliderLabel: 'المزاج',
    heavier: 'أثقل',
    lighter: 'أخف',
    noteLabel: 'أضف بضع كلمات · اختياري',
    notePlaceholder: 'ما الذي يشغل بالك؟',
    save: 'احفظ في يومياتك',
    savedPrivately: 'يُحفظ بشكل خاص في يومياتك على هذا الهاتف.',
    saveError: 'تعذّر الحفظ — يرجى المحاولة مرة أخرى.',
  },
} as const;
