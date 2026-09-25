/**
 * Profile (canvas "Profile"), opened from Home's top-right button. English
 * is the canvas copy.
 */
export const profileStrings = {
  en: {
    title: 'Profile',
    back: 'Back to Home',
    edit: 'Edit',
    addCountry: 'Add your country',
    recap: {
      eyebrow: 'Your {month} recap',
      title: 'See your month in Houna',
    },
    traits: {
      eyebrow: 'Your traits',
      from: 'From {test}',
      taken: 'Taken {date} · not a diagnosis',
      view: 'View results',
    },
    streak: {
      title: { one: '{n}-day practice streak', few: '{n}-day practice streak' },
      none: 'Your practice streak starts with your next session',
      note: 'Breathing and meditation only — never mood',
      stats: 'Stats',
    },
    guest: {
      title: "You're browsing as a guest",
      body: 'Claim an alias — no real name or email needed — to keep your streak and results in one place.',
      signIn: 'Sign in',
      createAlias: 'Create alias',
    },
    settings: {
      language: 'Language',
      appearance: 'Appearance',
      appearanceOptions: { system: 'System', night: 'Night', day: 'Dusk' },
      notifications: 'Notifications',
      communityMap: 'Community map',
      exportJournal: 'Export my journal',
      exportError: 'Could not export — please try again.',
    },
    signOut: 'Sign out',
  },
  ar: {
    title: 'الملف الشخصي',
    back: 'العودة إلى الرئيسية',
    edit: 'تعديل',
    addCountry: 'أضف دولتك',
    recap: {
      eyebrow: 'ملخّص {month}',
      title: 'شاهد شهرك في هُنا',
    },
    traits: {
      eyebrow: 'سماتك',
      from: 'من {test}',
      taken: 'أُجري في {date} · ليس تشخيصاً',
      view: 'اعرض النتائج',
    },
    streak: {
      title: {
        one: 'سلسلة ممارسة ليوم واحد',
        two: 'سلسلة ممارسة ليومين',
        few: 'سلسلة ممارسة لـ{n} أيام',
        many: 'سلسلة ممارسة لـ{n} يوماً',
      },
      none: 'تبدأ سلسلة ممارستك مع جلستك القادمة',
      note: 'التنفّس والتأمّل فقط — وليس المزاج أبداً',
      stats: 'الإحصاءات',
    },
    guest: {
      title: 'أنت تتصفّح كضيف',
      body: 'اختر اسماً مستعاراً — دون اسم حقيقي أو بريد إلكتروني — لتحتفظ بسلسلتك ونتائجك في مكان واحد.',
      signIn: 'تسجيل الدخول',
      createAlias: 'إنشاء اسم مستعار',
    },
    settings: {
      language: 'اللغة',
      appearance: 'المظهر',
      appearanceOptions: { system: 'النظام', night: 'ليلي', day: 'الغسق' },
      notifications: 'الإشعارات',
      communityMap: 'خريطة المجتمع',
      exportJournal: 'تصدير يومياتي',
      exportError: 'تعذّر التصدير — يرجى المحاولة مرة أخرى.',
    },
    signOut: 'تسجيل الخروج',
  },
} as const;
