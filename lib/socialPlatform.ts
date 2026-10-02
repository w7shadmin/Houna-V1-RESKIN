/**
 * Which social platform a link belongs to, for the directory profiles'
 * Follow buttons (components/directory/SocialIcon.tsx draws the marks).
 */

/** Platforms with a recognisable brand mark . */
export type SocialPlatform =
  | 'instagram'
  | 'tiktok'
  | 'snapchat'
  | 'whatsapp'
  | 'x'
  | 'facebook'
  | 'youtube'
  | 'linkedin'
  | 'telegram'
  | 'threads'
  | 'pinterest'
  | 'web';

/** Display names, for accessibility labels. Brand names aren't translated. */
export const PLATFORM_NAME: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  whatsapp: 'WhatsApp',
  x: 'X',
  facebook: 'Facebook',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  threads: 'Threads',
  pinterest: 'Pinterest',
  web: 'Website',
};

/** Host fragments → platform. The link is more reliable than the scraper's platform label. */
const HOSTS: [RegExp, SocialPlatform][] = [
  [/(^|\.)instagram\.com$|(^|\.)instagr\.am$/, 'instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)snapchat\.com$/, 'snapchat'],
  [/(^|\.)whatsapp\.com$|^wa\.me$/, 'whatsapp'],
  [/(^|\.)twitter\.com$|(^|\.)x\.com$/, 'x'],
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.me$/, 'facebook'],
  [/(^|\.)youtube\.com$|^youtu\.be$/, 'youtube'],
  [/(^|\.)linkedin\.com$/, 'linkedin'],
  [/^t\.me$|(^|\.)telegram\.(me|org)$/, 'telegram'],
  [/(^|\.)threads\.(net|com)$/, 'threads'],
  [/(^|\.)pinterest\.[a-z.]+$|^pin\.it$/, 'pinterest'],
];

const LABELS: Record<string, SocialPlatform> = {
  instagram: 'instagram',
  tiktok: 'tiktok',
  snapchat: 'snapchat',
  whatsapp: 'whatsapp',
  twitter: 'x',
  x: 'x',
  facebook: 'facebook',
  youtube: 'youtube',
  linkedin: 'linkedin',
  telegram: 'telegram',
  threads: 'threads',
  pinterest: 'pinterest',
};

/** Which platform a social link belongs to — by its URL first, then the scraped label. */
export function platformOf(url: string, label?: string): SocialPlatform {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase().replace(/^www\.|^m\./, '');
  } catch {
    // not a URL — fall through to the label
  }
  if (url.startsWith('whatsapp:')) return 'whatsapp';
  const byHost = HOSTS.find(([re]) => re.test(host));
  if (byHost) return byHost[1];
  return LABELS[(label ?? '').trim().toLowerCase()] ?? 'web';
}

