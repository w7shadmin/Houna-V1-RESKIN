/**
 * Crisis support screen strings (reached from Home's "Need to talk now?"
 * button). CLAUDE.md: crisis resources must never be buried.
 *
 * DRAFT — safety-critical copy written for the redesign, not yet reviewed.
 * The Arabic needs a native clinical reviewer before release. Country
 * hotline numbers deliberately live in lib/crisisLines.ts as data, and are
 * never invented here. `{country}` is filled with the country's name.
 */
export const crisisStrings = {
  en: {
    title: 'Need to talk now?',
    intro: "You don't have to go through this alone. Reaching out is a strong thing to do.",
    emergencyHeading: 'If you are in danger right now',
    emergencyBody:
      'If you might act on thoughts of harming yourself, or someone else is in danger, call your local emergency number now or go to the nearest emergency department.',
    linesHeading: 'Crisis and support lines',
    emergencyNumbers: 'Emergency numbers',
    numbersFor: 'Numbers for {country}',
    change: 'Change',
    chooseCountry: 'Choose your country to see its crisis and emergency numbers.',
    groups: {
      child: 'Children and families',
      violence: 'Violence and abuse',
      addiction: 'Addiction',
      refugee: 'Refugees and migrant workers',
    },
    noCrisisLine:
      "We haven't confirmed a mental-health line in {country} yet. If you're in danger, call an emergency number above or go to the nearest emergency department.",
    checked: "These numbers were checked in September 2026 and are being reviewed. If one doesn't connect, call an emergency number.",
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
    linesHeading: 'خطوط الأزمات والدعم',
    emergencyNumbers: 'أرقام الطوارئ',
    numbersFor: 'الأرقام في {country}',
    change: 'تغيير',
    chooseCountry: 'اختر بلدك لعرض أرقام الطوارئ وخطوط الدعم فيه.',
    groups: {
      child: 'الأطفال والأسرة',
      violence: 'العنف والإساءة',
      addiction: 'الإدمان',
      refugee: 'اللاجئون والعمالة الوافدة',
    },
    noCrisisLine:
      'لم نتحقق بعد من خط للصحة النفسية في {country}. إذا كنت في خطر، اتصل بأحد أرقام الطوارئ أعلاه أو توجّه إلى أقرب قسم طوارئ.',
    checked: 'تم التحقق من هذه الأرقام في سبتمبر ٢٠٢٦ وهي قيد المراجعة. إذا لم يتصل أحدها، اتصل برقم طوارئ.',
    talkHeading: 'طرق أخرى للحصول على الدعم',
    talkBody: 'أخبر شخصاً تثق به بما تشعر به — صديقاً أو أحد أفراد عائلتك أو معلّماً.',
    findProfessional: 'ابحث عن مختص في الصحة النفسية',
    readSupport: 'فهم الانتحار وإيذاء النفس',
    call: 'اتصال',
  },
} as const;
