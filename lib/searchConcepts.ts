/**
 * The directory search's meaning map: groups of words that mean roughly the
 * same thing to someone looking for help, in English, Arabic (standard and
 * Gulf) and a little Arabizi. A query word that matches any word in a group
 * also finds the others, a little lower (so "sad" finds depression, "أرق"
 * finds sleep, and English works with the app in Arabic, and back).
 *
 * Written as people type, normalised when loaded. Multi-word entries match as
 * phrases ("low mood", "can't sleep"). Content, not code: add to it freely,
 * but keep each group to one idea, or unrelated results creep in.
 */
export const CONCEPT_GROUPS: readonly string[][] = [
  // Feelings and conditions
  ['anxiety', 'anxious', 'worry', 'worried', 'worrying', 'nervous', 'panic', 'panic attack', 'fear', 'phobia', 'قلق', 'توتر', 'خوف', 'رهاب', 'هلع', 'نوبة هلع', 'qalaq'],
  ['depression', 'depressed', 'sad', 'sadness', 'low mood', 'unhappy', 'empty', 'hopeless', 'loss of passion', 'lost my passion', 'lost my spark', 'lost interest', 'no motivation', 'unmotivated', 'nothing feels good', 'اكتئاب', 'حزن', 'حزين', 'ضيقة', 'ضيق', 'كآبة', 'يأس', 'مزاج منخفض', 'فقدان الشغف', 'فقدت الشغف', 'فقدت شغفي', 'لا شغف', 'فقدان الاهتمام', 'لا دافع', 'ekti2ab', 'ektiab'],
  ['stress', 'stressed', 'pressure', 'overwhelmed', 'burnout', 'burnt out', 'too much', "can't cope", 'cant cope', 'ضغط', 'ضغوط', 'إجهاد', 'احتراق', 'إرهاق', 'مثقل', 'فوق طاقتي', 'لا أستطيع التحمل'],
  ['sleep', 'insomnia', "can't sleep", 'cant sleep', 'nightmares', 'lack of sleep', 'sleepless', 'نوم', 'أرق', 'كوابيس', 'السهر', 'قلة النوم', 'لا أستطيع النوم'],
  ['trauma', 'ptsd', 'traumatic', 'shock', 'صدمة', 'صدمات', 'اضطراب ما بعد الصدمة'],
  ['grief', 'loss', 'bereavement', 'mourning', 'death', 'grieving', 'lost someone', 'missing someone', 'حزن على', 'فقد', 'فقدان', 'الفقد', 'حداد', 'وفاة', 'عزاء'],
  // Everyday words for what clinical terms name (the Directory hub's "In your own words").
  ['childhood issues', 'childhood trauma', 'inner child', 'upbringing', 'things from childhood', 'trauma', 'صدمات الطفولة', 'مشاكل الطفولة', 'الطفل الداخلي', 'أمور من الطفولة', 'صدمة'],
  ['burnout', 'burnt out', 'burned out', 'emotional exhaustion', 'emotionally drained', 'drained', 'worn out', 'exhausted', 'compassion fatigue', 'احتراق', 'احتراق وظيفي', 'الاحتراق الوظيفي', 'استنزاف', 'استنزاف عاطفي', 'إنهاك', 'منهك', 'مستنزف'],
  ['numb', 'numbness', 'feel nothing', 'feeling nothing', 'detached', 'disconnected', 'dissociation', 'dissociative', 'depersonalization', 'unreal', 'خدر', 'تبلد', 'تبلد المشاعر', 'لا أشعر بشيء', 'انفصال عن الواقع', 'انفصال'],
  ['adjustment', 'adjusting', 'adjustment difficulties', 'big change', 'life change', 'life transition', 'moving abroad', 'new country', 'expat', 'settling in', 'التأقلم', 'صعوبة التأقلم', 'تغيير كبير', 'تغيير في الحياة', 'الغربة', 'مرحلة انتقالية'],
  ['hormones', 'hormonal', 'pms', 'pmdd', 'menopause', 'perimenopause', 'thyroid', 'after birth', 'chronic illness', 'medical condition', 'health condition', 'هرمونات', 'هرموني', 'الدورة الشهرية', 'سن اليأس', 'انقطاع الطمث', 'الغدة الدرقية', 'بعد الولادة', 'مرض مزمن', 'حالة صحية'],
  ['anger', 'angry', 'rage', 'temper', 'غضب', 'عصبية', 'عصبي'],
  ['loneliness', 'lonely', 'alone', 'isolation', 'isolated', 'وحدة', 'وحيد', 'عزلة'],
  ['self-esteem', 'self esteem', 'confidence', 'self worth', 'ثقة بالنفس', 'تقدير الذات', 'الثقة'],
  ['ocd', 'obsessive', 'compulsive', 'obsession', 'وسواس', 'الوسواس القهري', 'وسواس قهري'],
  ['adhd', 'attention deficit', 'hyperactivity', 'focus', 'concentration', 'فرط الحركة', 'تشتت الانتباه', 'نقص الانتباه', 'تركيز'],
  ['autism', 'autistic', 'asd', 'spectrum', 'توحد', 'طيف التوحد'],
  ['bipolar', 'mania', 'manic', 'ثنائي القطب', 'اضطراب ثنائي القطب', 'هوس'],
  ['psychosis', 'schizophrenia', 'hallucinations', 'ذهان', 'فصام', 'هلوسة'],
  ['eating disorder', 'anorexia', 'bulimia', 'binge eating', 'body image', 'اضطرابات الأكل', 'فقدان الشهية', 'الشره', 'صورة الجسد'],
  ['addiction', 'substance', 'drugs', 'alcohol', 'gambling', 'recovery', 'إدمان', 'مخدرات', 'كحول', 'قمار', 'تعافي'],
  ['suicide', 'suicidal', 'self-harm', 'self harm', 'انتحار', 'إيذاء النفس', 'ايذاء النفس'],
  ['abuse', 'violence', 'domestic violence', 'assault', 'harassment', 'bullying', 'bullied', 'abusive', 'unsafe at home', 'hurt at home', 'إساءة', 'عنف', 'عنف أسري', 'تعنيف', 'اعتداء', 'تحرش', 'تنمر'],

  // Relationships and life stages
  ['relationship', 'relationships', 'couple', 'couples', 'marriage', 'married', 'divorce', 'partner', 'husband', 'wife', 'علاقات', 'علاقة', 'زواج', 'زوجين', 'طلاق', 'زوج', 'زوجة'],
  ['family', 'parenting', 'parent', 'parents', 'mother', 'father', 'mom', 'dad', 'عائلة', 'أسرة', 'تربية', 'والدين', 'الأهل', 'أم', 'أب'],
  ['children', 'child', 'kids', 'kid', 'childhood', 'toddler', 'أطفال', 'طفل', 'الطفولة', 'عيال', 'ياهل', 'يهال'],
  ['teens', 'teenager', 'teenagers', 'adolescent', 'adolescence', 'youth', 'young people', 'students', 'مراهقين', 'مراهق', 'المراهقة', 'شباب', 'طلاب'],
  ['women', "women's health", 'pregnancy', 'postpartum', 'maternal', 'motherhood', 'المرأة', 'نساء', 'حمل', 'ما بعد الولادة', 'اكتئاب ما بعد الولادة', 'أمومة'],
  ['work', 'workplace', 'job', 'career', 'employees', 'عمل', 'وظيفة', 'بيئة العمل', 'الموظفين', 'مهنة'],
  ['elderly', 'older adults', 'aging', 'dementia', 'alzheimer', 'كبار السن', 'الشيخوخة', 'الخرف', 'زهايمر'],

  // Kinds of help
  ['therapist', 'therapy', 'psychotherapy', 'psychotherapist', 'counselor', 'counsellor', 'counseling', 'counselling', 'coach', 'معالج', 'معالجة', 'علاج نفسي', 'مرشد', 'استشارة', 'استشاري', 'أخصائي نفسي', 'اخصائي'],
  ['psychologist', 'clinical psychologist', 'psychology', 'أخصائي نفسي', 'طبيب نفسي', 'علم النفس', 'نفساني'],
  ['psychiatrist', 'psychiatry', 'medication', 'doctor', 'طبيب نفسي', 'الطب النفسي', 'دكتور', 'أدوية'],
  ['cbt', 'cognitive behavioral', 'cognitive behavioural', 'العلاج المعرفي السلوكي', 'معرفي سلوكي'],
  ['mindfulness', 'meditation', 'breathing', 'relaxation', 'calm', 'يقظة ذهنية', 'تأمل', 'تنفس', 'استرخاء', 'هدوء', 'tanafas', 'تنفّس'],
  ['online', 'virtual', 'remote', 'video', 'عن بعد', 'أونلاين', 'اونلاين', 'افتراضي'],
  ['support group', 'group therapy', 'community', 'مجموعة دعم', 'علاج جماعي', 'مجتمع'],
];
