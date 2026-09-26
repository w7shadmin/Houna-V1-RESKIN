/**
 * Recap ("Houna Wrapped", canvas "Recap (tap through)"). English is the
 * canvas copy. The mood slide stays descriptive — "Every feeling counted.
 * None of them was wrong." — never a score or a comparison.
 */
export const recapStrings = {
  en: {
    header: { month: 'Houna recap · {period}', year: 'Houna recap · {period}' },
    close: 'Close recap',
    previous: 'Previous',
    next: 'Next',
    tapToContinue: 'Tap to continue',
    intro: {
      title: { month: 'Your month, gently', year: 'Your year, gently' },
      body: 'A look back at the moments you made for yourself.',
      empty: 'Nothing to look back on yet — this recap fills in as you breathe, meditate and journal.',
    },
    breathing: {
      eyebrow: 'Breathing',
      unit: { one: 'minute spent breathing', few: 'minutes spent breathing' },
      goTo: 'Your go-to',
    },
    meditation: {
      eyebrow: 'Meditation',
      unit: { one: 'minute in stillness', few: 'minutes in stillness' },
      favourite: 'Favourite scene',
    },
    journal: {
      eyebrow: 'Journal',
      unit: { one: 'day you checked in with yourself', few: 'days you checked in with yourself' },
      words: { one: '{n} word written, kept privately in your journal.', few: '{n} words written, kept privately in your journal.' },
    },
    moods: {
      eyebrow: 'Your emotional landscape',
      line: 'Every feeling counted. None of them was wrong.',
      a11y: 'Feelings you logged, most often first: {list}.',
    },
    community: {
      line: {
        one: 'You breathed alongside {n} person in {k}.',
        few: 'You breathed alongside {n} people in {k}.',
      },
      countries: { one: '{n} country', few: '{n} countries' },
    },
    share: {
      title: { named: "{name}'s {period} in Houna", anonymous: 'Your {period} in Houna' },
      breathing: 'Breathing',
      meditation: 'Meditation',
      journal: 'Journal check-ins',
      minutes: '{n} min',
      days: { one: '{n} day', few: '{n} days' },
      share: 'Share',
      done: 'Done',
    },
  },
  ar: {
    header: { month: 'ملخّص هُنا · {period}', year: 'ملخّص هُنا · {period}' },
    close: 'إغلاق الملخّص',
    previous: 'السابق',
    next: 'التالي',
    tapToContinue: 'اضغط للمتابعة',
    intro: {
      title: { month: 'شهرك، بهدوء', year: 'عامك، بهدوء' },
      body: 'نظرة إلى الوراء على اللحظات التي منحتها لنفسك.',
      empty: 'لا شيء لنستعيده بعد — يمتلئ هذا الملخّص كلما تنفّست وتأمّلت وكتبت.',
    },
    breathing: {
      eyebrow: 'التنفّس',
      unit: { one: 'دقيقة من التنفّس', two: 'دقيقتان من التنفّس', few: 'دقائق من التنفّس', many: 'دقيقة من التنفّس' },
      goTo: 'تمرينك المفضّل',
    },
    meditation: {
      eyebrow: 'التأمّل',
      unit: { one: 'دقيقة من السكون', two: 'دقيقتان من السكون', few: 'دقائق من السكون', many: 'دقيقة من السكون' },
      favourite: 'مشهدك المفضّل',
    },
    journal: {
      eyebrow: 'اليوميات',
      unit: { one: 'يوم تفقّدت فيه نفسك', two: 'يومان تفقّدت فيهما نفسك', few: 'أيام تفقّدت فيها نفسك', many: 'يوماً تفقّدت فيه نفسك' },
      words: {
        one: 'كلمة واحدة كتبتها، محفوظة بخصوصية في يومياتك.',
        two: 'كلمتان كتبتهما، محفوظتان بخصوصية في يومياتك.',
        few: '{n} كلمات كتبتها، محفوظة بخصوصية في يومياتك.',
        many: '{n} كلمة كتبتها، محفوظة بخصوصية في يومياتك.',
      },
    },
    moods: {
      eyebrow: 'مشهدك العاطفي',
      line: 'كل شعور كان له مكان. ولم يكن أيٌّ منها خطأ.',
      a11y: 'المشاعر التي سجّلتها، الأكثر تكراراً أولاً: {list}.',
    },
    community: {
      line: {
        one: 'تنفّست إلى جانب شخص واحد في {k}.',
        two: 'تنفّست إلى جانب شخصين في {k}.',
        few: 'تنفّست إلى جانب {n} أشخاص في {k}.',
        many: 'تنفّست إلى جانب {n} شخصاً في {k}.',
      },
      countries: { one: 'دولة واحدة', two: 'دولتين', few: '{n} دول', many: '{n} دولة' },
    },
    share: {
      title: { named: '{name} في هُنا · {period}', anonymous: 'أنت في هُنا · {period}' },
      breathing: 'التنفّس',
      meditation: 'التأمّل',
      journal: 'مرّات تفقّد اليوميات',
      minutes: '{n} د',
      days: { one: 'يوم واحد', two: 'يومان', few: '{n} أيام', many: '{n} يوماً' },
      share: 'مشاركة',
      done: 'تم',
    },
  },
} as const;
