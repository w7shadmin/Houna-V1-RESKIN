/**
 * Crisis support screen strings (reached from Home's "Need to talk now?"
 * button). CLAUDE.md: crisis resources must never be buried.
 *
 * DRAFT — safety-critical copy written for the redesign, not yet reviewed.
 * The Arabic needs a native clinical reviewer before release. Country
 * hotline numbers deliberately live in lib/crisisLines.ts as data, and are
 * never invented here.
 */
export const crisisStrings = {
  en: {
    title: 'Need to talk now?',
    intro: "You don't have to go through this alone. Reaching out is a strong thing to do.",
    emergencyHeading: 'If you are in danger right now',
    emergencyBody:
      'If you might act on thoughts of harming yourself, or someone else is in danger, call your local emergency number now or go to the nearest emergency department.',
    linesHeading: 'Crisis lines',
    talkHeading: 'Other ways to get support',
    talkBody: 'Tell someone you trust how you are feeling — a friend, a family member, or a teacher.',
    findProfessional: 'Find a mental health professional',
    readSupport: 'Understanding suicide and self-harm',
    call: 'Call',
  },
  ar: {
    title: 'تحتاج إلى التحدث الآن؟',
    intro: 'لست مضطراً لمواجهة هذا وحدك. طلب المساعدة خطوة شجاعة.',
    emergencyHeading: 'إذا كنت في خطر الآن',
    emergencyBody:
      'إذا كنت قد تتصرف بناءً على أفكار لإيذاء نفسك، أو كان شخص آخر في خطر، اتصل برقم الطوارئ المحلي الآن أو توجّه إلى أقرب قسم طوارئ.',
    linesHeading: 'خطوط الدعم في الأزمات',
    talkHeading: 'طرق أخرى للحصول على الدعم',
    talkBody: 'أخبر شخصاً تثق به بما تشعر به — صديقاً أو أحد أفراد عائلتك أو معلّماً.',
    findProfessional: 'ابحث عن مختص في الصحة النفسية',
    readSupport: 'فهم الانتحار وإيذاء النفس',
    call: 'اتصال',
  },
} as const;
