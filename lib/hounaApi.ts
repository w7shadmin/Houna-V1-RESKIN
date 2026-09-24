/**
 * Client for the houna-proxy Supabase edge function — scrapes and caches
 * content from houna.org. Ported from the old MVP's src/lib/houna-api.ts;
 * this is the exact same REST-like surface, just re-pointed at Expo's
 * public env vars instead of Vite's.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — set them in .env (see .env.example).',
  );
}

const BASE_URL = `${SUPABASE_URL}/functions/v1/houna-proxy`;

const headers = {
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

/**
 * Scheme allowlist for any URL that reaches Linking.openURL. Content on
 * these screens is scraped from a third-party site, so an unvalidated
 * value could otherwise carry a dangerous scheme. Returns the URL when
 * it's safe to open, otherwise null. Relative URLs are resolved against
 * houna.org, matching the edge function's own sanitizer.
 */
const SAFE_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];

export function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  try {
    const parsed = new URL(value, 'https://houna.org');
    return SAFE_URL_SCHEMES.includes(parsed.protocol) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Resolves a possibly-relative image path from the scraped content against
 * houna.org, unlike `safeUrl` which passes the original value through
 * as-is. The proxy sometimes returns a relative fallback-avatar path (e.g.
 * `/assets/images/avatar-female.jpg`, used when a professional has no real
 * photo) instead of a full URL — `<Image>` needs the resolved absolute URL
 * or it 404s by resolving against this app's own origin instead.
 */
export function resolveImageUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  try {
    const parsed = new URL(value, 'https://houna.org');
    return SAFE_URL_SCHEMES.includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export interface Therapist {
  name: string;
  role: string;
  summary: string;
  profileUrl: string;
  slug: string;
  imageUrl: string | null;
}

export interface Organization {
  name: string;
  summary: string;
  profileUrl: string;
  id: string;
  imageUrl: string | null;
}

export interface CountryOption {
  value: string;
  label: string;
}

export interface TherapistListResponse {
  therapists: Therapist[];
  currentPage: number;
  lastPage: number;
  countries: CountryOption[];
}

export interface OrgListResponse {
  organizations: Organization[];
  currentPage: number;
  lastPage: number;
}

export interface ContactInfo {
  type: 'phone' | 'email';
  value: string;
  href: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface TherapistDetail {
  name: string;
  role: string;
  summary: string;
  fullBio: string;
  specialties: string | null;
  imageUrl: string | null;
  info: Record<string, string>;
  contacts: ContactInfo[];
  socials: SocialLink[];
  organization: { url: string; name: string } | null;
}

export interface OrgRosterMember {
  name: string;
  role: string;
  summary: string;
  profileUrl: string;
  slug: string;
  imageUrl: string | null;
}

export interface OrganizationDetail {
  name: string;
  summary: string;
  fullBio: string;
  imageUrl: string | null;
  info: Record<string, string>;
  contacts: ContactInfo[];
  socials: SocialLink[];
  website: string | null;
  roster: OrgRosterMember[];
}

async function apiFetch(path: string, params?: Record<string, string>): Promise<Response> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
  }
  return fetch(url.toString(), { headers });
}

export async function fetchTherapists(
  page: number,
  filters: { availability?: string; profession?: string; country?: string; sort?: string },
  lang: 'en' | 'ar' = 'en',
): Promise<TherapistListResponse> {
  const resp = await apiFetch('/therapists', {
    page: String(page),
    availability: filters.availability || '',
    profession: filters.profession || '',
    country: filters.country || '',
    sort: filters.sort || 'name-ASC',
    lang,
  });
  if (!resp.ok) throw new Error(`Failed to load professionals (${resp.status})`);
  return resp.json();
}

export async function fetchTherapistDetail(slug: string, lang: 'en' | 'ar' = 'en'): Promise<TherapistDetail> {
  const resp = await apiFetch(`/therapists/${slug}`, { lang });
  if (!resp.ok) throw new Error(`Failed to load profile (${resp.status})`);
  return resp.json();
}

export async function fetchOrganizations(country?: string, lang: 'en' | 'ar' = 'en'): Promise<OrgListResponse> {
  const resp = await apiFetch('/organizations', { country: country || '', lang });
  if (!resp.ok) throw new Error(`Failed to load organizations (${resp.status})`);
  return resp.json();
}

export async function fetchOrganizationDetail(id: string, lang: 'en' | 'ar' = 'en'): Promise<OrganizationDetail> {
  const resp = await apiFetch(`/organizations/${id}`, { lang });
  if (!resp.ok) throw new Error(`Failed to load organization (${resp.status})`);
  return resp.json();
}

export interface WellnessCenter {
  name: string;
  summary: string;
  services: string[];
  profileUrl: string;
  id: string;
  imageUrl: string | null;
}

export interface WellnessCenterListResponse {
  centers: WellnessCenter[];
  countries: CountryOption[];
}

export interface WellnessCenterDetail {
  name: string;
  summary: string;
  fullBio: string;
  services: string[];
  imageUrl: string | null;
  info: Record<string, string>;
  contacts: ContactInfo[];
  socials: SocialLink[];
}

export async function fetchWellnessCenters(
  country?: string,
  lang: 'en' | 'ar' = 'en',
): Promise<WellnessCenterListResponse> {
  const resp = await apiFetch('/wellness-centers', { country: country || '', lang });
  if (!resp.ok) throw new Error(`Failed to load wellness centers (${resp.status})`);
  return resp.json();
}

export async function fetchWellnessCenterDetail(id: string, lang: 'en' | 'ar' = 'en'): Promise<WellnessCenterDetail> {
  const resp = await apiFetch(`/wellness-centers/${id}`, { lang });
  if (!resp.ok) throw new Error(`Failed to load wellness center (${resp.status})`);
  return resp.json();
}

export interface Article {
  title: string;
  blurb: string;
  url: string;
  isExternal: boolean;
  sourceDomain: string;
  imageUrl: string | null;
}

export interface ArticleListResponse {
  articles: Article[];
}

export async function fetchArticles(lang: 'en' | 'ar' = 'en'): Promise<ArticleListResponse> {
  const resp = await apiFetch('/articles', { lang });
  if (!resp.ok) throw new Error(`Failed to load articles (${resp.status})`);
  return resp.json();
}

// ===== Events =====

export interface EventItem {
  title: string;
  date: string;
  description: string;
  status: string;
  slug: string;
  imageUrl: string | null;
  isVirtual: boolean;
}

export interface EventListResponse {
  events: EventItem[];
}

export interface EventDetail {
  title: string;
  date: string;
  description: string;
  imageUrl: string | null;
  info: Record<string, string>;
  youtubeEmbeds: string[];
}

export async function fetchEvents(lang: 'en' | 'ar' = 'en'): Promise<EventListResponse> {
  const resp = await apiFetch('/events', { lang });
  if (!resp.ok) throw new Error(`Failed to load events (${resp.status})`);
  return resp.json();
}

export async function fetchEventDetail(slug: string, lang: 'en' | 'ar' = 'en'): Promise<EventDetail> {
  const resp = await apiFetch(`/events/${slug}`, { lang });
  if (!resp.ok) throw new Error(`Failed to load event (${resp.status})`);
  return resp.json();
}

// ===== Speakers =====

export interface Speaker {
  name: string;
  role: string;
  bio: string;
  slug: string;
  imageUrl: string | null;
}

export interface SpeakerListResponse {
  speakers: Speaker[];
}

export interface SpeakerDetail {
  name: string;
  role: string;
  bio: string;
  imageUrl: string | null;
  info: Record<string, string>;
  socials: SocialLink[];
}

export async function fetchSpeakers(lang: 'en' | 'ar' = 'en'): Promise<SpeakerListResponse> {
  const resp = await apiFetch('/speakers', { lang });
  if (!resp.ok) throw new Error(`Failed to load speakers (${resp.status})`);
  return resp.json();
}

export async function fetchSpeakerDetail(slug: string, lang: 'en' | 'ar' = 'en'): Promise<SpeakerDetail> {
  const resp = await apiFetch(`/speakers/${slug}`, { lang });
  if (!resp.ok) throw new Error(`Failed to load speaker (${resp.status})`);
  return resp.json();
}

// ===== Podcasts =====

export interface Podcast {
  title: string;
  description: string;
  host: string;
  url: string;
  sourceDomain: string;
  imageUrl: string | null;
}

export interface PodcastListResponse {
  podcasts: Podcast[];
}

export async function fetchPodcasts(lang: 'en' | 'ar' = 'en'): Promise<PodcastListResponse> {
  const resp = await apiFetch('/podcasts', { lang });
  if (!resp.ok) throw new Error(`Failed to load podcasts (${resp.status})`);
  return resp.json();
}

// ===== About =====

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  profileId: string;
  imageUrl: string | null;
  section: string;
}

export interface AboutData {
  youAreHouna: string;
  vision: string;
  mission: string;
  members: TeamMember[];
}

export async function fetchAbout(lang: 'en' | 'ar' = 'en'): Promise<AboutData> {
  const resp = await apiFetch('/about', { lang });
  if (!resp.ok) throw new Error(`Failed to load about (${resp.status})`);
  return resp.json();
}

// ===== Mental Health Directory =====

export interface ResourceTopic {
  title: string;
  description: string;
  slug: string;
  url: string;
}

export interface ResourceArticle {
  title: string;
  blurb: string;
  url: string;
  imageUrl: string | null;
  sourceDomain: string;
}

export interface ResourceDirectoryData {
  bannerImage: string;
  heading: string;
  topics: ResourceTopic[];
  importantArticles: ResourceArticle[];
}

export interface ResourceSection {
  id: string;
  label: string;
  heading: string;
  content: string;
}

export interface ResourceDetailData {
  title: string;
  sections: ResourceSection[];
}

export async function fetchResourceDirectory(lang: 'en' | 'ar' = 'en'): Promise<ResourceDirectoryData> {
  const resp = await apiFetch('/resources', { lang });
  if (!resp.ok) throw new Error(`Failed to load directory (${resp.status})`);
  return resp.json();
}

export async function fetchResourceDetail(slug: string, lang: 'en' | 'ar' = 'en'): Promise<ResourceDetailData> {
  const resp = await apiFetch(`/resources/${slug}`, { lang });
  if (!resp.ok) throw new Error(`Failed to load topic (${resp.status})`);
  return resp.json();
}

