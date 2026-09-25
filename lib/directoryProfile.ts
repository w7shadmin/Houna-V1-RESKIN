import { safeUrl, type ContactInfo, type SocialLink } from './hounaApi';

/**
 * Helpers for the directory's profile pages (professionals, organizations,
 * wellness centers). The proxy scrapes houna.org, so some fields carry
 * site furniture that isn't the profile's own.
 */

/**
 * Houna's own accounts, which the scraper picks up from every page's footer
 * and returns as if they were the profile's socials.
 */
const HOUNA_OWN_SOCIALS = ['hounainitiative', 'UCgqcVmqDZOTzRGixRzRgK0Q'];

/** The profile's own social links: Houna's footer accounts removed, duplicates dropped. */
export function ownSocials(socials: SocialLink[]): SocialLink[] {
  const seen = new Set<string>();
  return socials.filter((s) => {
    const url = safeUrl(s.url);
    if (!url || HOUNA_OWN_SOCIALS.some((h) => url.includes(h))) return false;
    const key = url.replace(/[?#].*$/, '').replace(/\/+$/, '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Short mark for a social button (the canvas's "IG" / "IN"). */
export function socialMark(platform: string): string {
  const marks: Record<string, string> = {
    instagram: 'IG',
    linkedin: 'IN',
    facebook: 'FB',
    twitter: 'X',
    x: 'X',
    youtube: 'YT',
    tiktok: 'TT',
    whatsapp: 'WA',
    snapchat: 'SC',
  };
  return marks[platform.toLowerCase()] ?? platform.slice(0, 2).toUpperCase();
}

/** In-app organization id from a houna.org organization URL (".../organizations/28"). */
export function organizationIdFromUrl(url: string | null | undefined): string | null {
  const m = url?.match(/\/organizations\/(\d+)/);
  return m ? m[1] : null;
}

/**
 * A tappable link for a contact. Emails behind Cloudflare's
 * "email-protection" wrapper are rebuilt from the plain address.
 */
export function contactLink(c: ContactInfo): string | null {
  if (c.type === 'email' && c.value.includes('@')) return `mailto:${c.value.trim()}`;
  const href = safeUrl(c.href);
  if (href && !href.includes('email-protection')) return href;
  if (c.type === 'phone' && /\d/.test(c.value)) return `tel:${c.value.replace(/[^+\d]/g, '')}`;
  return null;
}

export type FactId = 'location' | 'languages' | 'organizations' | 'workWith' | 'experience' | 'countries';

/** The site's info labels (English and Arabic pages) mapped to one id each. */
const FACT_KEYS: Record<string, FactId> = {
  location: 'location',
  'الموقع': 'location',
  languages: 'languages',
  language: 'languages',
  'اللغات': 'languages',
  'اللغة': 'languages',
  organizations: 'organizations',
  organization: 'organizations',
  'المنظمات': 'organizations',
  'المنظمة': 'organizations',
  'work with': 'workWith',
  'works with': 'workWith',
  'يعمل مع': 'workWith',
  'تعمل مع': 'workWith',
  experience: 'experience',
  'الخبرة': 'experience',
  countries: 'countries',
  country: 'countries',
  'الدول': 'countries',
  'الدولة': 'countries',
};

export interface Fact {
  /** Known fact, or null for a label the app doesn't recognise (shown as the site wrote it). */
  id: FactId | null;
  rawLabel: string;
  value: string;
}

/**
 * The profile's info rows, minus websites (any URL value — surfaced as a
 * link instead) and any fact ids in `exclude`.
 */
export function profileFacts(info: Record<string, string>, exclude: FactId[] = []): Fact[] {
  return Object.entries(info)
    .map(([label, value]) => ({
      id: FACT_KEYS[label.trim().toLowerCase()] ?? null,
      rawLabel: label.trim(),
      value: decodeEntities(String(value).trim()),
    }))
    .filter((f) => f.value && !/^https?:\/\//i.test(f.value) && !(f.id && exclude.includes(f.id)));
}

/** First website-looking value in the info rows, if any. */
export function infoWebsite(info: Record<string, string>): string | null {
  const url = Object.values(info).find((v) => /^https?:\/\//i.test(String(v).trim()));
  return safeUrl(url ?? null);
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  reg: '®',
  copy: '©',
  trade: '™',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
};

/** Scraped text sometimes keeps HTML entities ("RBT&reg;"); turn them back into characters. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}
