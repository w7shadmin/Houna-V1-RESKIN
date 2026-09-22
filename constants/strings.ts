/**
 * Houna string catalogue.
 *
 * Every user-facing string in the app goes through here — never hardcode
 * English (or Arabic) directly in a component. Arabic strings are ported
 * from the old MVP wherever it already had the screen (see
 * ../../reference/docs/houna-port-reference.md); a handful of strings below
 * have no old-MVP equivalent (dev "coming soon" placeholders for screens
 * that aren't built yet) and are marked accordingly.
 */

import { tanafasStrings } from './tanafasStrings';
import { directoryStrings } from './directoryStrings';
import { eventsStrings } from './eventsStrings';
import { journalStrings } from './journalStrings';
import { homeStrings } from './homeStrings';
import { accountStrings } from './accountStrings';

export type Language = 'en' | 'ar';

export const strings = {
  en: {
    tabs: {
      home: 'Home',
      directory: 'Directory',
      events: 'Events',
      more: 'More',
      tanafas: 'Tanafas',
    },
    common: {
      back: 'Back',
      // placeholder — real content not built yet
      comingSoon: 'Coming Soon',
    },
    notFound: {
      title: 'Oops!',
      message: "This screen doesn't exist.",
      link: 'Go to home screen!',
    },
    splash: {
      title: 'Houna',
      subtitle: 'Your mental wellness companion',
      getStarted: 'Get Started',
    },
    entry: {
      subheading: 'You are Houna',
      explore: 'Explore Houna',
    },
    home: homeStrings.en,
    directory: directoryStrings.en,
    events: eventsStrings.en,
    about: {
      loading: 'Loading...',
      error: 'Failed to load about',
      retry: 'Try again',
      youAreHouna: 'You Are Houna',
      vision: 'Our Vision',
      mission: 'Our Mission',
      founder: 'Founder',
      advisor: 'Advisor',
      team: 'Team',
    },
    // About / Get Involved / Contact ported from the old MVP's MoreScreen;
    // Account section (see `account.more` below) is new.
    more: {
      title: 'More',
      subtitle: 'Learn about us and ways to connect.',
      language: 'Language',
      languageEnglish: 'English',
      languageArabic: 'العربية',
      about: 'About / Who We Are',
      getInvolved: 'Get Involved',
      contact: 'Contact Us',
    },
    account: accountStrings.en,
    tanafas: tanafasStrings.en,
    journal: journalStrings.en,
  },
  ar: {
    tabs: {
      home: 'الرئيسية',
      directory: 'الدليل',
      events: 'الفعاليات',
      more: 'المزيد',
      // "Tanafas" is itself the transliteration of تنفّس (breathing) — kept
      // as the native word rather than translated.
      tanafas: 'تنفّس',
    },
    common: {
      back: 'رجوع',
      comingSoon: 'قريباً',
    },
    notFound: {
      title: 'عذراً!',
      message: 'هذه الشاشة غير موجودة.',
      link: 'العودة إلى الرئيسية!',
    },
    splash: {
      title: 'هُنا',
      subtitle: 'رفيقك في الصحة النفسية',
      getStarted: 'ابدأ الآن',
    },
    entry: {
      subheading: 'أنت هُنا',
      explore: 'استكشف هُنا',
    },
    home: homeStrings.ar,
    directory: directoryStrings.ar,
    events: eventsStrings.ar,
    about: {
      loading: 'جاري التحميل...',
      error: 'فشل تحميل المحتوى',
      retry: 'حاول مرة أخرى',
      youAreHouna: 'أنت هنا',
      vision: 'رؤيتنا',
      mission: 'مهمتنا',
      founder: 'المؤسسون',
      advisor: 'المستشارون',
      team: 'الفريق',
    },
    more: {
      title: 'المزيد',
      subtitle: 'تعرّف علينا وطرق التواصل معنا.',
      language: 'اللغة',
      languageEnglish: 'English',
      languageArabic: 'العربية',
      about: 'عن هُنا / من نحن',
      getInvolved: 'شارك معنا',
      contact: 'تواصل معنا',
    },
    account: accountStrings.ar,
    tanafas: tanafasStrings.ar,
    journal: journalStrings.ar,
  },
} as const;

type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends string
  ? string
  : { [K in keyof T]: Widen<T[K]> };

export type StringCatalogue = Widen<typeof strings.en>;
