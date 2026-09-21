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
      loading: 'Loading events...',
      error: 'Failed to load events',
      all: 'All',
      upcoming: 'Upcoming',
      virtual: 'Virtual',
      past: 'Past',
      sortNewest: 'Sort by newest',
      sortOldest: 'Sort by oldest',
      countOne: 'event',
      countOther: 'events',
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
      loading: 'جاري تحميل الفعاليات...',
      error: 'فشل تحميل الفعاليات',
      all: 'الكل',
      upcoming: 'القادمة',
      virtual: 'افتراضية',
      past: 'السابقة',
      sortNewest: 'الترتيب: الأحدث',
      sortOldest: 'الترتيب: الأقدم',
      countOne: 'فعالية',
      countOther: 'فعاليات',
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
