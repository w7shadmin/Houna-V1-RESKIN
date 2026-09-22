/**
 * Strings for the Meditation section (scene list + player). Unlike
 * breathing exercises, the old MVP never built a meditation screen at all —
 * there's nothing to port here, everything is new. See build-notes.md §4:
 * real video/audio assets aren't sourced yet, so the player currently
 * drives a placeholder animated visual per scene instead of real footage.
 */

export const meditationStrings = {
  en: {
    list: {
      title: 'Meditation',
      subtitle: 'Choose an ambient scene to help you unwind.',
    },
    scenes: {
      fire: { name: 'Fire', description: 'A crackling, warm glow' },
      rain: { name: 'Rain', description: 'Steady rainfall to settle the mind' },
      forest: { name: 'Creek', description: 'A mountain stream flowing over stones' },
      ocean: { name: 'Ocean', description: 'Slow, rolling waves' },
    },
    player: {
      chooseSession: 'Choose your session length',
      min: { one: 'min', two: 'min', few: 'min', many: 'min' },
      custom: 'Custom',
      begin: 'Begin',
      pause: 'Pause',
      resume: 'Resume',
      startAgain: 'Start Again',
      exit: 'Exit',
      remaining: 'remaining',
      elapsed: 'elapsed',
      hours: 'hr',
      minutes: 'min',
      noLimit: 'No limit',
      audioOnly: 'Audio only',
      videoOn: 'Turn video on',
      fullscreen: 'Fullscreen',
      exitFullscreen: 'Exit fullscreen',
      wellDone: 'Well done',
      completionBody: 'Take a moment before you go back to your day. You can return here anytime you need a quiet moment.',
      placeholderNotice: 'Placeholder ambience — real video and audio for this scene are still being sourced.',
    },
  },
  ar: {
    list: {
      title: 'التأمل',
      subtitle: 'اختر أجواء هادئة تساعدك على الاسترخاء.',
    },
    scenes: {
      fire: { name: 'نار', description: 'توهّج دافئ ومتطاير' },
      rain: { name: 'مطر', description: 'هطول مطر ثابت يهدئ الذهن' },
      forest: { name: 'جدول', description: 'جدول جبلي يتدفق بين الصخور' },
      ocean: { name: 'محيط', description: 'أمواج بطيئة ومتدحرجة' },
    },
    player: {
      chooseSession: 'اختر مدة الجلسة',
      // Arabic count agreement: 1 دقيقة, 2 دقيقتان, 3–10 دقائق, 11+ دقيقة.
      min: { one: 'دقيقة', two: 'دقيقتان', few: 'دقائق', many: 'دقيقة' },
      custom: 'مخصص',
      begin: 'ابدأ',
      pause: 'إيقاف مؤقت',
      resume: 'استئناف',
      startAgain: 'ابدأ من جديد',
      exit: 'رجوع',
      remaining: 'متبقية',
      elapsed: 'منقضية',
      hours: 'س',
      minutes: 'د',
      noLimit: 'بلا حدود',
      audioOnly: 'صوت فقط',
      videoOn: 'تشغيل الفيديو',
      fullscreen: 'ملء الشاشة',
      exitFullscreen: 'إنهاء ملء الشاشة',
      wellDone: 'أحسنت',
      completionBody: 'خذ لحظة قبل العودة إلى يومك. يمكنك العودة إلى هنا في أي وقت تحتاج فيه إلى لحظة هدوء.',
      placeholderNotice: 'أجواء مؤقتة — لا يزال العمل جارياً على توفير الفيديو والصوت الحقيقيين لهذا المشهد.',
    },
  },
} as const;
