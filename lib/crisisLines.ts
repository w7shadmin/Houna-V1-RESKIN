/**
 * Crisis lines by country, shown on the crisis screen (app/crisis.tsx).
 *
 * From the MENA crisis-lines research (research/crisis-lines/, checked 29 Sep 2026), which rates
 * every line Verified, Likely or Uncertain. The app shows only:
 *   - lines rated Verified (on an official or operator page that is current), and
 *   - emergency numbers rated Likely (police, ambulance, fire: better shown than left out).
 * Everything else waits for the team's phone checks. A wrong or dead number here is worse than
 * none: change a line only from a source you've opened, update the research data with it, and keep
 * `confidence` and `source` honest. Re-check every line every six months (sooner in Gaza, Sudan,
 * Yemen, Syria and Libya).
 */

export type CrisisKind = 'emergency' | 'crisis' | 'support' | 'child' | 'violence' | 'addiction' | 'refugee';

export interface Bilingual {
  en: string;
  ar: string;
}

export interface CrisisLine {
  /** ISO 3166-1 alpha-2, matching `profiles.country` and lib/countries.ts. */
  country: string;
  kind: CrisisKind;
  name: Bilingual;
  /** Dialled as shown inside the country (short codes work only there). */
  phone: string;
  hours?: Bilingual;
  /** Where or who it's limited to, when it isn't everyone in the country. */
  area?: Bilingual;
  /** Other ways to reach it, or what to do once connected. */
  extra?: Bilingual;
  /** The research's rating: only emergency numbers may be `likely`. */
  confidence: 'verified' | 'likely';
  /** Where it was confirmed, for the next person who checks it. */
  source: string;
}

/** When the numbers below were last checked. */
export const CRISIS_CHECKED_ON = '2026-09-29';

const H24: Bilingual = { en: '24/7', ar: 'على مدار الساعة' };

type Opts = Partial<Pick<CrisisLine, 'hours' | 'area' | 'extra'>> & { likely?: boolean };

function line(country: string, kind: CrisisKind, en: string, ar: string, phone: string, source: string, o: Opts = {}): CrisisLine {
  const { likely, ...rest } = o;
  return { country, kind, name: { en, ar }, phone, confidence: likely ? 'likely' : 'verified', source, ...rest };
}

export const CRISIS_LINES: CrisisLine[] = [
  // ── United Arab Emirates ──
  line('AE', 'emergency', 'Police', 'الشرطة', '999', 'u.ae handling emergencies (Sep 2026)', { hours: H24 }),
  line('AE', 'emergency', 'Ambulance', 'الإسعاف', '998', 'u.ae handling emergencies (Sep 2026)', { hours: H24 }),
  line('AE', 'emergency', 'Civil Defence', 'الدفاع المدني', '997', 'u.ae handling emergencies (Sep 2026)', { hours: H24 }),
  line('AE', 'crisis', '800-SAKINA mental health line', 'الخط الساخن "800-سكينة" للصحة النفسية', '800 725462', 'doh.gov.ae (3 Mar 2026)', {
    hours: H24,
    area: { en: 'Abu Dhabi', ar: 'أبوظبي' },
    extra: { en: 'Arabic and English', ar: 'بالعربية والإنجليزية' },
  }),
  line('AE', 'support', "Itma'en mental health support line", 'خدمة "اطمئن" للدعم النفسي', '800 506', 'dubaihealth.ae (13 Mar 2026)', {
    hours: { en: 'Daily, 9am to midnight', ar: 'يوميًا من ٩ صباحًا حتى منتصف الليل' },
    area: { en: 'Dubai', ar: 'دبي' },
  }),
  line('AE', 'child', 'Child Protection Centre (Ministry of Interior)', 'مركز وزارة الداخلية لحماية الطفل', '116111', 'u.ae (2026); moi.gov.ae', { hours: H24 }),
  line('AE', 'child', 'Community Development Authority protection line', 'خط الحماية – هيئة تنمية المجتمع', '800 988', 'u.ae (2026)', {
    area: { en: 'Dubai: children, elderly, people of determination', ar: 'دبي: الأطفال وكبار السن وأصحاب الهمم' },
  }),
  line('AE', 'child', 'Child & Family Protection Centre', 'مركز حماية الطفل والأسرة', '800 700', 'u.ae (2026); sharjah24.ae (Jul 2026)', {
    area: { en: 'Sharjah', ar: 'الشارقة' },
  }),
  line('AE', 'child', 'Hemaya Foundation', 'مؤسسة حماية', '800 446292', 'u.ae (2026)', { area: { en: 'Ajman', ar: 'عجمان' } }),
  line('AE', 'child', 'Aman Centre for Women and Children', 'مركز أمان للنساء والأطفال', '07 235 6666', 'u.ae (2026)', {
    area: { en: 'Ras Al Khaimah', ar: 'رأس الخيمة' },
  }),
  line('AE', 'violence', 'Dubai Foundation for Women and Children', 'مؤسسة دبي لرعاية النساء والأطفال', '800 111', 'dfwac.ae (2026)', {
    hours: H24,
    extra: { en: 'SMS 5111 · WhatsApp +971 800111', ar: 'رسالة نصية 5111 · واتساب +971 800111' },
  }),
  line('AE', 'violence', 'Family Care Authority', 'هيئة الرعاية الأسرية', '800 444', 'adfca.gov.ae', { area: { en: 'Abu Dhabi', ar: 'أبوظبي' } }),
  line('AE', 'addiction', 'National Rehabilitation Centre', 'المركز الوطني للتأهيل', '800 2252', 'nrc.gov.ae (2026)', {
    hours: { en: 'Mon–Thu 8am–6pm, Fri 8am–noon', ar: 'الاثنين–الخميس ٨ص–٦م، الجمعة ٨ص–١٢ظ' },
  }),

  // ── Saudi Arabia ──
  line('SA', 'emergency', 'Unified emergency', 'الطوارئ الموحد', '911', 'cst.gov.sa numbering plan', {
    hours: H24,
    area: { en: 'Riyadh, Makkah, Madinah and Eastern Province', ar: 'الرياض ومكة المكرمة والمدينة المنورة والمنطقة الشرقية' },
  }),
  line('SA', 'emergency', 'Police', 'الشرطة', '999', 'cst.gov.sa numbering plan', { hours: H24 }),
  line('SA', 'emergency', 'Ambulance (Saudi Red Crescent)', 'الإسعاف (الهلال الأحمر)', '997', 'cst.gov.sa numbering plan', { hours: H24 }),
  line('SA', 'emergency', 'Civil Defence', 'الدفاع المدني', '998', 'cst.gov.sa numbering plan', { hours: H24 }),
  line('SA', 'support', 'National Center for Mental Health: psychological consultations', 'المركز الوطني لتعزيز الصحة النفسية – الاستشارات النفسية', '920033360', 'moh.gov.sa psychiatry page (Sep 2026)', {
    hours: { en: 'Daily 8am–8pm (Saturday from 1pm)', ar: 'يوميًا ٨ص–٨م (السبت من ١ظ)' },
    extra: { en: 'Also the Qareboon app, by text or voice', ar: 'وتطبيق قريبون، كتابةً أو صوتًا' },
  }),
  line('SA', 'support', 'Ministry of Health 937 line', 'مركز 937 – وزارة الصحة', '937', 'moh.gov.sa/en/937 (May 2025)', { hours: H24 }),
  line('SA', 'child', 'Child Helpline', 'خط مساندة الطفل', '116111', 'cst.gov.sa numbering plan', {
    hours: { en: 'Daily 7am–11pm', ar: 'يوميًا ٧ص–١١م' },
  }),
  line('SA', 'violence', 'Family Violence Reporting Center', 'مركز بلاغات العنف الأسري', '1919', 'cst.gov.sa numbering plan; hrsd.gov.sa', { hours: H24 }),

  // ── Qatar ──
  line('QA', 'emergency', 'Emergency: police, fire, ambulance', 'الطوارئ: الشرطة والإطفاء والإسعاف', '999', 'portal.moi.gov.qa; marhaba.qa (Aug 2026)', {
    hours: H24,
    extra: { en: 'Deaf people: SMS or video call 992', ar: 'للصم: رسالة نصية أو مكالمة فيديو 992' },
  }),
  line('QA', 'emergency', 'Emergency from mobiles', 'الطوارئ من الجوال', '112', 'marhaba.qa (Aug 2026)', { likely: true }),
  line('QA', 'crisis', 'National Mental Health Helpline', 'خط المساعدة الوطني للصحة النفسية', '16000', 'hamad.qa (21 Apr 2026)', {
    hours: { en: 'Sat–Thu 8am–6pm', ar: 'السبت–الخميس ٨ص–٦م' },
    extra: { en: 'Then press 4 · Arabic, English, Tagalog, Hindi, Urdu, Malayalam', ar: 'ثم اضغط ٤ · بالعربية والإنجليزية والتاغالوغية والهندية والأردية والمالايالامية' },
  }),
  line('QA', 'violence', 'Aman Protection & Social Rehabilitation Centre', 'مركز الحماية والتأهيل الاجتماعي "أمان"', '919', 'aman.org.qa; QNA (Dec 2024)', { hours: H24 }),
  line('QA', 'addiction', 'Naufar addiction treatment (admissions)', 'نوفر لعلاج الإدمان (القبول)', '+974 4494 6000', 'naufar.com (2025)'),

  // ── Kuwait ──
  line('KW', 'emergency', 'Emergency: police, ambulance, fire', 'الطوارئ: الشرطة والإسعاف والإطفاء', '112', 'e.gov.kw emergencies', { hours: H24 }),

  // ── Bahrain ──
  line('BH', 'emergency', 'Ambulance, civil defence, police', 'الإسعاف والدفاع المدني وشرطة النجدة', '999', 'bahrain.bh emergency directory (Aug 2026)', { hours: H24 }),
  line('BH', 'support', 'Psychiatric Hospital', 'مستشفى الطب النفسي', '+973 17288888', 'moh.gov.bh psychiatric hospital page'),
  line('BH', 'child', 'Child Helpline', 'خط نجدة ومساندة الطفل', '998', 'social.gov.bh', { hours: H24 }),
  line('BH', 'violence', 'Domestic violence line (Aisha Yateem Centre)', 'خط العنف الأسري (مركز عائشة يتيم)', '17430515', 'bahrain.bh (Aug 2026)', {
    extra: { en: 'Also 17430488', ar: 'وأيضًا 17430488' },
  }),
  line('BH', 'violence', 'Family Counselling Centre (Ministry of Social Development)', 'مركز الإرشاد الأسري (وزارة التنمية الاجتماعية)', '80008001', 'bahrain.bh; social.gov.bh'),
  line('BH', 'violence', "Women's Support Center", 'مركز دعم المرأة', '80008006', 'bahrain.bh (Aug 2026)'),
  line('BH', 'refugee', 'Expat Protection Centre', 'مركز حماية العمالة الوافدة', '995', 'lmra.gov.bh', {
    hours: { en: '24 hours', ar: 'على مدار الساعة' },
    area: { en: 'Migrant and domestic workers', ar: 'العمالة الوافدة والمنزلية' },
  }),

  // ── Oman ──
  line('OM', 'emergency', 'Emergency: police, ambulance, fire', 'الطوارئ: الشرطة والإسعاف والإطفاء', '9999', 'rop.gov.om; gov.om', { hours: H24 }),
  line('OM', 'crisis', 'Al Masarra Hospital psychiatric emergency', 'مستشفى المسرة – طوارئ الطب النفسي', '24873268', 'moh.gov.om Al Masarra page (Nov 2025)', { hours: H24 }),
  line('OM', 'child', 'Child Protection Line', 'خط حماية الطفل', '1100', 'gov.om; omandaily.om (Aug 2025)', { hours: H24 }),
  line('OM', 'violence', 'Police hotline for trafficking and blackmail', 'الخط الساخن لشرطة عمان السلطانية للاتجار بالبشر والابتزاز', '80077444', 'fm.gov.om (Sep 2026); rop.gov.om'),
  line('OM', 'addiction', 'Hayah addiction support line', 'منصة "حياة" – رقم الاستشارات المجاني', '1110', 'omannews.gov.om (Sep 2025); hayah.om', {
    extra: { en: 'Free and confidential · live chat on hayah.om', ar: 'مجاني وسري · محادثة مباشرة على hayah.om' },
  }),

  // ── Lebanon ──
  line('LB', 'emergency', 'Red Cross ambulance', 'الصليب الأحمر (الإسعاف)', '140', 'help.unhcr.org/lebanon (2026)'),
  line('LB', 'emergency', 'Civil Defence', 'الدفاع المدني', '125', 'help.unhcr.org/lebanon (2026)'),
  line('LB', 'emergency', 'Police', 'الشرطة', '112', 'um.dk/libanon', { likely: true }),
  line('LB', 'emergency', 'Fire brigade', 'فوج الإطفاء', '175', 'um.dk/libanon', { likely: true }),
  line('LB', 'crisis', 'National Lifeline for Emotional Support & Suicide Prevention', 'الخط الوطني للدعم النفسي والوقاية من الانتحار', '1564', 'embracelebanon.org (2025); help.unhcr.org/lebanon (Apr 2026)', {
    hours: H24,
    extra: { en: 'Arabic, English, French', ar: 'بالعربية والإنجليزية والفرنسية' },
  }),
  line('LB', 'violence', 'ABAAD Emergency Safe Line', 'خط الطوارئ الآمن – أبعاد', '81 78 81 78', 'abaadmena.org'),
  line('LB', 'violence', 'KAFA helpline', 'خط المساعدة – كفى', '03 018 019', 'kafa.org.lb'),
  line('LB', 'child', 'Child protection line (Himaya)', 'خط حماية الطفل (حماية)', '79 300 410', 'help.unhcr.org/lebanon (2026)', { area: { en: 'North', ar: 'الشمال' } }),
  line('LB', 'child', 'Child protection line (Caritas)', 'خط حماية الطفل (كاريتاس)', '81 559 495', 'help.unhcr.org/lebanon (2026)', {
    area: { en: 'Beirut and Mount Lebanon', ar: 'بيروت وجبل لبنان' },
  }),
  line('LB', 'child', 'Child protection line (IRC)', 'خط حماية الطفل (لجنة الإنقاذ الدولية)', '81 600 048', 'help.unhcr.org/lebanon (2026)', {
    area: { en: 'Bekaa and Baalbek-Hermel', ar: 'البقاع وبعلبك الهرمل' },
  }),
  line('LB', 'child', 'Child protection line (Terre des Hommes)', 'خط حماية الطفل (أرض البشر)', '81 616 637', 'help.unhcr.org/lebanon (2026)', {
    area: { en: 'South and Nabatieh', ar: 'الجنوب والنبطية' },
  }),
  line('LB', 'addiction', 'Skoun addiction centre', 'مركز سكون للإدمان', '01 845 512', 'skoun.org'),

  // ── Jordan ──
  line('JO', 'emergency', 'Unified emergency', 'الطوارئ الموحد', '911', 'jordantimes.com (Dec 2024)', {
    hours: H24,
    extra: { en: 'Also the 911 app', ar: 'وتطبيق 911' },
  }),
  line('JO', 'child', '110 Family & Child Helpline', 'خط 110 للأسرة والطفل', '110', 'jordanriver.jo; childhelplineinternational.org', {
    hours: { en: 'Sun–Thu 8am–8pm, Fri–Sat 9am–5pm', ar: 'الأحد–الخميس ٨ص–٨م، الجمعة–السبت ٩ص–٥م' },
  }),
  line('JO', 'violence', "Arab Women's Organization", 'منظمة النساء العربيات', '077 111 2013', 'help.unhcr.org/jordan', {
    hours: { en: 'Sun–Thu 8am–4pm', ar: 'الأحد–الخميس ٨ص–٤م' },
  }),
  line('JO', 'support', 'Institute for Family Health (Noor Al Hussein Foundation)', 'معهد العناية بصحة الأسرة (مؤسسة نور الحسين)', '0790211701', 'help.unhcr.org/jordan', {
    hours: { en: 'Sun–Thu 8am–3:30pm', ar: 'الأحد–الخميس ٨ص–٣:٣٠م' },
    area: { en: 'Amman', ar: 'عمّان' },
    extra: { en: 'Irbid 0798758201 · Zaatari 0791565082 · Azraq 0795595762', ar: 'إربد 0798758201 · الزعتري 0791565082 · الأزرق 0795595762' },
  }),

  // ── Palestine ──
  line('PS', 'emergency', 'Police', 'الشرطة', '100', 'info.wafa.ps'),
  line('PS', 'emergency', 'Ambulance', 'الإسعاف', '101', 'info.wafa.ps'),
  line('PS', 'emergency', 'Civil Defence', 'الدفاع المدني', '102', 'info.wafa.ps'),
  line('PS', 'crisis', 'Sawa helpline', 'مؤسسة سوا', '164', 'sawa.ps; OCHA (Aug 2025)', {
    hours: H24,
    extra: { en: 'East Jerusalem: 1-800-500-121 · web chat at chat.sawa164.org', ar: 'القدس الشرقية: 1-800-500-121 · محادثة على chat.sawa164.org' },
  }),

  // ── Syria ──
  line('SY', 'emergency', 'Ambulance', 'الإسعاف', '110', 'moh.gov.sy'),
  line('SY', 'child', 'UNICEF helpline: children and psychological support', 'خط مساعدة اليونيسف: الأطفال والدعم النفسي', '0952 535 262', 'unicef.org/syria (Sep 2025)', {
    hours: { en: 'Sun–Thu 9am–7pm', ar: 'الأحد–الخميس ٩ص–٧م' },
  }),

  // ── Iraq ──
  line('IQ', 'emergency', 'Unified emergency', 'الطوارئ الموحد', '911', 'iraqinews.com (Aug 2025); help.unhcr.org/iraq', {
    likely: true,
    area: { en: 'Baghdad', ar: 'بغداد' },
  }),
  line('IQ', 'emergency', 'Police', 'النجدة', '104', 'iq.zain.com; help.krd (Jun 2026)', { likely: true }),
  line('IQ', 'emergency', 'Ambulance', 'الإسعاف', '122', 'iq.zain.com; help.krd (Jun 2026)', { likely: true }),
  line('IQ', 'emergency', 'Civil Defence', 'الدفاع المدني', '115', 'iq.zain.com; help.krd', { likely: true }),
  line('IQ', 'violence', 'Hotline 119 against violence to women and families', 'الخط الساخن 119 لمناهضة العنف ضد المرأة والأسرة', '119', 'kurdistan24.net (Nov 2024)', {
    hours: H24,
    area: { en: 'Kurdistan Region', ar: 'إقليم كردستان' },
  }),

  // ── Egypt ──
  line('EG', 'emergency', 'Police', 'شرطة النجدة', '122', 'orange.eg emergency numbers', { hours: H24 }),
  line('EG', 'emergency', 'Ambulance', 'الإسعاف', '123', 'orange.eg emergency numbers', { hours: H24 }),
  line('EG', 'emergency', 'Fire', 'المطافئ', '180', 'orange.eg emergency numbers', { hours: H24 }),
  line('EG', 'crisis', 'Mental health hotline (Ministry of Health)', 'الخط الساخن للصحة النفسية وعلاج الإدمان (وزارة الصحة)', '16328', 'help.unhcr.org/egypt (2026); elwatannews.com (Apr 2026)', {
    hours: H24,
    extra: { en: 'Also 02 2081 6831', ar: 'وأيضًا 02 2081 6831' },
  }),
  line('EG', 'refugee', 'Etijah violence support (WhatsApp)', 'اتجاه – دعم ضحايا العنف (واتساب)', '01015450440', 'help.unhcr.org/egypt', {
    hours: H24,
    area: { en: 'Refugees in Greater Cairo, Alexandria, North Coast', ar: 'اللاجئون في القاهرة الكبرى والإسكندرية والساحل الشمالي' },
  }),
  line('EG', 'refugee', 'CARE violence support', 'كير – دعم ضحايا العنف', '01039202357', 'help.unhcr.org/egypt', {
    hours: { en: 'Sun–Thu 9am–5pm', ar: 'الأحد–الخميس ٩ص–٥م' },
    area: { en: 'Refugees in Aswan', ar: 'اللاجئون في أسوان' },
    extra: { en: 'After hours: 01039205952', ar: 'خارج أوقات العمل: 01039205952' },
  }),
  line('EG', 'refugee', 'Plan International child protection', 'بلان إنترناشونال – حماية الطفل', '01064551183', 'help.unhcr.org/egypt', {
    hours: H24,
    area: { en: 'Refugee children, Greater Cairo', ar: 'الأطفال اللاجئون في القاهرة الكبرى' },
  }),

  // ── Sudan ──
  line('SD', 'emergency', 'Emergency', 'الطوارئ', '999', 'gov.uk Sudan travel advice', {
    likely: true,
    extra: { en: 'Often unresponsive because of the conflict', ar: 'كثيرًا ما لا يستجيب بسبب النزاع' },
  }),
  line('SD', 'refugee', 'UN humanitarian call centre (UNHCR and WFP)', 'مركز الاتصال المشترك (المفوضية وبرنامج الأغذية العالمي)', '1460', 'help.unhcr.org/sudan', {
    extra: { en: 'Toll-free · may be intermittently unavailable', ar: 'مجاني · قد يتعذر الوصول إليه أحيانًا' },
  }),

  // ── Libya ──
  line('LY', 'emergency', 'Emergency Medicine & Support Centre', 'مركز طب الطوارئ والدعم', '1412', 'emsc.gov.ly (2026)', { hours: H24 }),
  line('LY', 'emergency', 'Ambulance & Emergency Service', 'جهاز الإسعاف والطوارئ', '191', 'eanlibya.com (Sep 2026)', { likely: true }),
  line('LY', 'emergency', 'Emergency call centre', 'مركز اتصال الطوارئ', '1415', 'gov.uk Libya travel advice', {
    likely: true,
    hours: H24,
    area: { en: 'Tripoli and western municipalities', ar: 'طرابلس وبلديات الغرب' },
  }),
  line('LY', 'refugee', 'UNHCR protection hotline', 'خط الحماية – المفوضية', '0917127644', 'help.unhcr.org/libya', {
    hours: { en: 'Sun–Thu 8:30am–4:30pm', ar: 'الأحد–الخميس ٨:٣٠ص–٤:٣٠م' },
    area: { en: 'Refugees', ar: 'اللاجئون' },
  }),

  // ── Tunisia ──
  line('TN', 'emergency', 'Ambulance (SAMU)', 'الإسعاف', '190', 'diplomatie.gouv.fr (Sep 2026)', { hours: H24 }),
  line('TN', 'emergency', 'Police', 'شرطة النجدة', '197', 'diplomatie.gouv.fr (Sep 2026)', { hours: H24 }),
  line('TN', 'emergency', 'Civil protection', 'الحماية المدنية', '198', 'diplomatie.gouv.fr (Sep 2026)', { hours: H24 }),
  line('TN', 'emergency', 'National Guard', 'الحرس الوطني', '193', 'gov.uk; tuniscope.com (Jan 2026)', {
    hours: H24,
    area: { en: 'Rural areas', ar: 'المناطق الريفية' },
  }),
  line('TN', 'violence', 'Green line 1899 for women facing violence', 'الخط الأخضر 1899 للنساء ضحايا العنف', '1899', 'businessnews.com.tn (Mar 2026)', { hours: H24 }),

  // ── Morocco ──
  line('MA', 'emergency', 'Police', 'الشرطة', '19', 'diplomatie.gouv.fr (Sep 2026)', { hours: H24, area: { en: 'In towns', ar: 'داخل المدن' } }),
  line('MA', 'emergency', 'Royal Gendarmerie', 'الدرك الملكي', '177', 'diplomatie.gouv.fr (Sep 2026)', {
    hours: H24,
    area: { en: 'Outside towns', ar: 'خارج المدن' },
  }),
  line('MA', 'emergency', 'Civil protection: fire and ambulance', 'الوقاية المدنية: الإطفاء والإسعاف', '15', 'diplomatie.gouv.fr (Sep 2026)', { hours: H24 }),
  line('MA', 'emergency', 'Medical emergency (SAMU)', 'الإسعاف الطبي', '141', 'h24info (2020)', { likely: true }),

  // ── Algeria ──
  line('DZ', 'emergency', 'Civil protection: fire and ambulance', 'الحماية المدنية: الإطفاء والإسعاف', '14', 'gov.uk', { likely: true }),
  line('DZ', 'emergency', 'Police', 'الأمن الوطني', '17', 'gov.uk; reseauwassila-avife.com', { likely: true, extra: { en: 'Also 1548', ar: 'وأيضًا 1548' } }),
  line('DZ', 'emergency', 'Gendarmerie', 'الدرك الوطني', '1055', 'reseauwassila-avife.com', {
    likely: true,
    area: { en: 'Rural areas', ar: 'المناطق الريفية' },
  }),
  line('DZ', 'child', 'Child protection green number (ONPPE)', 'الرقم الأخضر لحماية الطفولة', '1111', 'education.gov.dz (Nov 2025); aps.dz', { hours: H24 }),

  // ── Yemen ──
  line('YE', 'emergency', 'Ambulance and fire', 'الإسعاف والإطفاء', '191', 'gov.uk', {
    likely: true,
    extra: { en: 'Unreliable, especially outside cities', ar: 'غير منتظم، خاصةً خارج المدن' },
  }),
];

/** The countries with lines, Gulf first (as elsewhere in the app), then the rest in this order. */
export const CRISIS_COUNTRIES = ['SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'EG', 'JO', 'LB', 'PS', 'SY', 'IQ', 'YE', 'SD', 'LY', 'TN', 'DZ', 'MA'] as const;

/** Everything shown for one country, emergency numbers first. */
export function crisisLinesFor(country: string | null): CrisisLine[] {
  if (!country) return [];
  return CRISIS_LINES.filter((l) => l.country === country);
}

/**
 * Which country to show: the one chosen on the crisis screen, else the Alias's own, else the
 * phone's region, as long as there are lines for it; otherwise none (the screen asks).
 */
export function resolveCrisisCountry(...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    const code = c?.toUpperCase();
    if (code && (CRISIS_COUNTRIES as readonly string[]).includes(code)) return code;
  }
  return null;
}

/** The number as dialled: digits and a leading +, nothing else. */
export function dialString(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}
