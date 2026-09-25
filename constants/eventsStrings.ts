/**
 * Strings for the Events tab (list + event detail + speaker detail).
 * Unlike Directory, the old MVP's EventsScreen.tsx *did* have full ported
 * Arabic for its own UI chrome — used directly here. EventDetailScreen and
 * SpeakerDetailScreen didn't, so those bits are translated fresh.
 */

export const eventsStrings = {
  en: {
    list: {
      title: 'Events',
      eyebrow: 'Talks & workshops',
      intro: 'Conversations with mental health professionals, in person and online.',
      sort: 'Sort',
      am: 'AM',
      pm: 'PM',
      loading: 'Loading events...',
      error: 'Failed to load events',
      all: 'All',
      upcoming: 'Upcoming',
      virtual: 'Virtual',
      past: 'Past',
      sortNewest: 'Sort by newest',
      sortOldest: 'Sort by oldest',
      count: { one: '{n} event', few: '{n} events' },
      readMore: 'Read More',
      noEvents: 'No events found',
      speakers: 'Speakers',
    },
    detail: {
      loading: 'Loading event...',
      aboutEvent: 'About this event',
      watch: 'Watch',
    },
    speaker: {
      loading: 'Loading speaker...',
      about: 'About',
    },
  },
  ar: {
    list: {
      title: 'الفعاليات',
      eyebrow: 'حوارات وورش عمل',
      intro: 'لقاءات مع مختصين في الصحة النفسية، حضوريًا وعبر الإنترنت.',
      sort: 'الترتيب',
      am: 'ص',
      pm: 'م',
      loading: 'جاري تحميل الفعاليات...',
      error: 'فشل تحميل الفعاليات',
      all: 'الكل',
      upcoming: 'القادمة',
      virtual: 'افتراضية',
      past: 'السابقة',
      sortNewest: 'الترتيب: الأحدث',
      sortOldest: 'الترتيب: الأقدم',
      count: { one: 'فعالية واحدة', two: 'فعاليتان', few: '{n} فعاليات', many: '{n} فعالية' },
      readMore: 'اقرأ المزيد',
      noEvents: 'لا توجد فعاليات',
      speakers: 'المتحدثون',
    },
    detail: {
      loading: 'جاري تحميل الفعالية...',
      aboutEvent: 'عن هذه الفعالية',
      watch: 'شاهد',
    },
    speaker: {
      loading: 'جاري تحميل بيانات المتحدث...',
      about: 'نبذة',
    },
  },
} as const;
