/**
 * Read & listen's topics: houna.org gives articles and podcasts no categories, so each is sorted by
 * the words in its title and summary, English and Arabic. A piece can sit under several; one that
 * says nothing recognisable sits under none (it still shows under All). Pure, so it's tested.
 */

export type MediaTopic = 'help' | 'anxiety' | 'mood' | 'children' | 'relationships' | 'trauma' | 'neurodiversity' | 'addiction' | 'work' | 'wellbeing';

export const MEDIA_TOPICS: readonly MediaTopic[] = ['help', 'anxiety', 'mood', 'children', 'relationships', 'trauma', 'neurodiversity', 'addiction', 'work', 'wellbeing'];

const fold = (s: string) => s.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');

const RULES: [MediaTopic, RegExp][] = [
  ['help', /therap|counsel|101|basics|support program|psychosocial|علاج|العلاج|ارشاد|الدعم النفسي/],
  ['anxiety', /anxi|stress|panic|worr|fear|phobia|قلق|توتر|ضغط|هلع|خوف|رهاب/],
  ['mood', /depress|low mood|sad|grief|bereave|suicid|hopeless|اكتئاب|مزاج|حزن|فقد|انتحار|ياس/],
  ['children', /child|kid|parent|adolesc|teen|youth|school|student|famil|اطفال|طفل|الطفل|اسره|الاهل|والدين|مراهق|مدرس|طلاب|تربيه/],
  ['relationships', /relationship|marri|couple|divorce|partner|loneli|علاقات|علاقه|زواج|طلاق|وحده/],
  ['trauma', /trauma|ptsd|abuse|violence|war|conflict|refugee|صدمه|صدمات|عنف|اساءه|حرب|نزاع|لاجئ/],
  ['neurodiversity', /autis|adhd|dyslex|learning (dis|diff)|neurodiver|speech|توحد|تشتت|فرط الحركه|عسر القراءه|صعوبات التعلم|نطق/],
  ['addiction', /addict|alcohol|substance|drug|gambl|ادمان|كحول|مخدرات|قمار/],
  ['work', /work|burnout|career|employ|job|workplace|عمل|وظيف|احتراق|الموظف/],
  ['wellbeing', /wellbeing|well-being|wellness|mindful|meditat|silence|brain|ramadan|aging|ageing|elderly|sleep|exercise|nutrition|self-care|self care|heart|تامل|رمضان|كبار السن|الشيخوخه|عافيه|رفاه|نوم|يقظه|رياض|تغذيه|العنايه بالذات|قلب/],
];

/** The topics a piece is about, from its title and summary. */
export function mediaTopics(...texts: (string | null | undefined)[]): MediaTopic[] {
  const t = fold(texts.filter(Boolean).join(' \n '));
  return RULES.filter(([, re]) => re.test(t)).map(([topic]) => topic);
}
