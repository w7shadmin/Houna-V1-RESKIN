/**
 * First run (canvas "Houna — First run (phase 5)"): the splash's tagline, and the first breath
 * (`app/welcome.tsx`), shown once before anything is asked. The Arabic breathes in the first
 * person plural, as the exercises do ("نكتم نفسنا"), so it never picks a gender.
 */
export const firstRunStrings = {
  en: {
    tagline: 'Breathe · rest · return',
    welcome: {
      notNow: 'Not now',
      adults: 'Houna is for adults, 18 and over.',
      language: 'Language',
      continue: 'Continue',
      // Each in its own language, in both catalogues.
      languageNames: { en: 'English', ar: 'العربية' },
      lines: {
        welcome: 'Welcome.',
        invite: 'Before anything else,\nlet’s breathe once together.',
        inhale: 'Breathe in…',
        hold: 'Hold, gently.',
        exhale: 'And all the way out.',
        end: 'That’s all Houna asks.',
      },
    },
  },
  ar: {
    tagline: 'تنفّس · استرح · عُد',
    welcome: {
      notNow: 'ليس الآن',
      adults: 'هُنا مخصّص للبالغين، من سن ١٨ فما فوق.',
      language: 'اللغة',
      continue: 'متابعة',
      languageNames: { en: 'English', ar: 'العربية' },
      lines: {
        welcome: 'مرحبًا.',
        invite: 'قبل أي شيء،\nلنتنفّس معًا مرة واحدة.',
        inhale: 'نأخذ نفسًا…',
        hold: 'نحبسه بلطف.',
        exhale: 'ونُخرجه حتى آخره.',
        end: 'هذا كل ما تطلبه هُنا.',
      },
    },
  },
};
