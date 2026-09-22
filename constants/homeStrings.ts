/**
 * Home screen strings — hero, Tanafas card, quick mood check-in, and the
 * professional-resources rows. Copy for hero/tanafasCard/proResources is
 * ported from a further-along in-progress build the user shared (bilingual
 * copy already written there, not machine-translated here); the mood
 * check-in strings are new, written to match this catalogue's existing
 * voice (`journal.*`, `tanafas.meditation.player.*`).
 */

export const homeStrings = {
  en: {
    hero: {
      badge: "You're not alone",
      headline: 'SELF-CARE IS HOW YOU GAIN CONTROL OF YOUR LIFE',
      body: 'A non-profit haven for mental health support, knowledge, and resources in the Arab world.',
      cta: 'Explore Resources',
    },
    tanafasCard: {
      eyebrow: 'BREATHE',
      title: 'Tanafas',
      body: 'Guided breathing exercises to calm your mind',
    },
    mood: {
      heading: 'How are you feeling today?',
      logged: 'Logged',
      viewHistory: 'View mood history',
      /**
       * Shown instead of `logged` when the day's mood-ping count (see
       * lib/moodPings.ts) is 2 or more — i.e. never just the person who
       * logged it. Plural-forms shaped like arabicPlural() expects even in
       * English (which has no dual/few distinction) so both languages carry
       * the same structure; `{n}` is replaced with the arabicNumber()'d or
       * plain count by the caller.
       */
      notAlone: {
        one: "You're not alone — {n} person felt this way today",
        two: "You're not alone — {n} people felt this way today",
        few: "You're not alone — {n} people felt this way today",
        many: "You're not alone — {n} people felt this way today",
      },
    },
    proResources: {
      heading: 'Professional Resources',
      seeAll: 'See all',
      professionals: 'Mental Health Professionals',
      professionalsDesc: 'Find therapists, psychologists, and psychiatrists near you.',
      organizations: 'Organizations',
      organizationsDesc: 'Explore mental health organizations across the region.',
      wellness: 'Wellness Centers',
      wellnessDesc: 'Discover clinics and wellness facilities offering specialized care.',
    },
    impactStats: {
      heading: 'Our Impact in Numbers',
      professionals: 'Mental Health Professionals',
      directory: 'Mental Health Directory',
      articles: 'Articles',
      events: 'Events',
    },
    articlesRail: {
      heading: 'Latest Articles',
      seeAll: 'See all',
      error: 'Unable to load articles',
    },
    podcastsRail: {
      heading: 'Podcasts',
      seeAll: 'See all',
      error: 'Unable to load podcasts',
      label: 'Podcast',
    },
    resourcesRail: {
      heading: 'Explore Our Resources',
      seeAll: 'See all',
      topics: [
        { slug: 'childhood-development', label: 'Childhood Development', description: 'Physical, cognitive, and emotional growth in children' },
        { slug: 'holistic-wellbeing', label: 'Holistic Wellbeing', description: 'Whole-person health across all dimensions of life' },
        { slug: 'media-and-mental-health', label: 'Media & Mental Health', description: 'How social media and news affect wellbeing' },
        { slug: 'ai-dependence', label: 'AI Dependence', description: 'When AI use interferes with daily functioning' },
        { slug: 'weight-management', label: 'Weight Management', description: 'Healthy approaches to weight and wellbeing' },
        { slug: 'attention-deficit-hyperactivity-adhd', label: 'ADHD', description: 'Attention deficit hyperactivity disorder' },
        { slug: 'psychotic-disorders', label: 'Psychotic Disorders', description: 'Conditions affecting perception and thinking' },
        { slug: 'depression', label: 'Depression', description: 'Persistent sadness and loss of interest' },
        { slug: 'anxiety', label: 'Anxiety', description: 'Excessive worry affecting daily life' },
        { slug: 'bipolar', label: 'Bipolar', description: 'Extreme mood swings between highs and lows' },
        { slug: 'autism', label: 'Autism', description: 'Developmental differences in communication' },
        { slug: 'behavioral-addiction-and-substance-abuse', label: 'Substance Abuse', description: 'Compulsive behaviors and substance dependence' },
        { slug: 'eating-disorders', label: 'Eating Disorders', description: 'Disrupted eating habits and food-related distress' },
        { slug: 'personality-disorders', label: 'Personality Disorders', description: 'Enduring patterns of inner experience and behavior' },
        { slug: 'suicide-and-self-harm', label: 'Suicide & Self-Harm', description: 'Crisis support and understanding self-injury' },
        { slug: 'dementia', label: 'Dementia', description: 'Decline in memory, thinking, and functioning' },
        { slug: 'abuse', label: 'Abuse', description: 'Support for survivors of emotional or physical abuse' },
      ],
    },
  },
  ar: {
    hero: {
      badge: 'لست وحدك',
      headline: 'العناية بالنفس هي كيف تسيطر على حياتك',
      body: 'ملاذ غير ربحي لدعم الصحة النفسية والموارد في العالم العربي.',
      cta: 'استكشف الموارد',
    },
    tanafasCard: {
      eyebrow: 'تنفس',
      title: 'تنفّس',
      body: 'تمارين تنفس موجهة لتهدئة عقلك',
    },
    mood: {
      heading: 'كيف تشعر اليوم؟',
      logged: 'تم التسجيل',
      viewHistory: 'عرض سجل المزاج',
      notAlone: {
        one: 'لست وحدك — شعر شخص واحد بهذا الشعور اليوم',
        two: 'لست وحدك — شعر شخصان بهذا الشعور اليوم',
        few: 'لست وحدك — شعر {n} أشخاص بهذا الشعور اليوم',
        many: 'لست وحدك — شعر {n} شخصًا بهذا الشعور اليوم',
      },
    },
    proResources: {
      heading: 'الموارد المهنية',
      seeAll: 'عرض الكل',
      professionals: 'المختصون في الصحة النفسية',
      professionalsDesc: 'ابحث عن معالجين وعلماء نفس وأطباء نفسيين بالقرب منك.',
      organizations: 'المنظمات',
      organizationsDesc: 'استكشف منظمات الصحة النفسية في جميع أنحاء المنطقة.',
      wellness: 'مراكز العافية',
      wellnessDesc: 'اكتشف العيادات ومرافق العافية التي تقدم رعاية متخصصة.',
    },
    impactStats: {
      heading: 'إنجازاتنا بالأرقام',
      professionals: 'المختصون في الصحة النفسية',
      directory: 'دليل الصحة النفسية',
      articles: 'المقالات',
      events: 'الفعاليات',
    },
    articlesRail: {
      heading: 'أحدث المقالات',
      seeAll: 'عرض الكل',
      error: 'تعذّر تحميل المقالات',
    },
    podcastsRail: {
      heading: 'البودكاست',
      seeAll: 'عرض الكل',
      error: 'تعذّر تحميل البودكاست',
      label: 'بودكاست',
    },
    resourcesRail: {
      heading: 'استكشف ما يناسبك',
      seeAll: 'عرض الكل',
      topics: [
        { slug: 'childhood-development', label: 'النمو في الطفولة', description: 'النمو الجسدي والمعرفي والعاطفي لدى الأطفال' },
        { slug: 'holistic-wellbeing', label: 'العافية الشاملة', description: 'صحة الشخص ككل عبر جميع أبعاد الحياة' },
        { slug: 'media-and-mental-health', label: 'الإعلام والصحة النفسية', description: 'كيف يؤثر وسائل التواصل والأخبار على العافية' },
        { slug: 'ai-dependence', label: 'الاعتماد على الذكاء الاصطناعي', description: 'عندما يتعارض استخدام الذكاء الاصطناعي مع الأداء اليومي' },
        { slug: 'weight-management', label: 'إدارة الوزن', description: 'نهج صحي للوزن والعافية' },
        { slug: 'attention-deficit-hyperactivity-adhd', label: 'فرط الحركة وتشتت الانتباه', description: 'اضطراب فرط الحركة وتشتت الانتباه' },
        { slug: 'psychotic-disorders', label: 'الاضطرابات الذهانية', description: 'حالات تؤثر على الإدراك والتفكير' },
        { slug: 'depression', label: 'الاكتئاب', description: 'حزن مستمر وفقدان الاهتمام' },
        { slug: 'anxiety', label: 'القلق', description: 'قلق مفرط يؤثر على الحياة اليومية' },
        { slug: 'bipolar', label: 'الاضطراب ثنائي القطب', description: 'تقلبات حادة في المزاج بين المرتفعات والانخفاضات' },
        { slug: 'autism', label: 'التوحد', description: 'اختلافات نمائية في التواصل' },
        { slug: 'behavioral-addiction-and-substance-abuse', label: 'إساءة استخدام المواد', description: 'سلوكيات قهرية واعتماد على المواد' },
        { slug: 'eating-disorders', label: 'اضطرابات الأكل', description: 'عادات أكل مضطربة وضيق مرتبط بالطعام' },
        { slug: 'personality-disorders', label: 'اضطرابات الشخصية', description: 'أنماط دائمة من التجربة الداخلية والسلوك' },
        { slug: 'suicide-and-self-harm', label: 'الانتحار وإيذاء النفس', description: 'دعم في الأزمات وفهم إيذاء النفس' },
        { slug: 'dementia', label: 'الخرف', description: 'تراجع في الذاكرة والتفكير والأداء' },
        { slug: 'abuse', label: 'الإساءة', description: 'دعم للناجين من الإساءة العاطفية أو الجسدية' },
      ],
    },
  },
};
