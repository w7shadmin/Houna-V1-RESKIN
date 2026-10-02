/**
 * A Houna event streamed live on YouTube (`app_config.live_event`, migration
 * 20261002100000_live_events.sql). Home and Events show it from an hour before it starts until it
 * ends, and `app/live.tsx` plays it. Pure, so it's tested; the fetching is in hooks/useLiveEvent.ts.
 */

export interface LiveEvent {
  videoId: string;
  titleEn: string;
  titleAr: string;
  startsAt: number;
  endsAt: number;
  /** The event's houna.org page, when it has one in the app's Events. */
  eventSlug: string | null;
}

/** How long before the start the "Starting at …" banner shows. */
export const LIVE_LEAD_MS = 60 * 60 * 1000;
/** A stream longer than this is a mistake in the settings; it isn't shown. */
const LONGEST_MS = 12 * 60 * 60 * 1000;
/** The same check YouTubePlayer makes, kept here so this file stays free of native imports. */
const VIDEO_ID = /^[A-Za-z0-9_-]{6,20}$/;
const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

const text = (v: unknown, max = 140) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** The setting as stored, or null when it's empty, incomplete or doesn't make sense. */
export function parseLiveEvent(value: unknown): LiveEvent | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const videoId = text(v.video_id, 20);
  const startsAt = Date.parse(text(v.starts_at, 40));
  const endsAt = Date.parse(text(v.ends_at, 40));
  if (!VIDEO_ID.test(videoId) || !Number.isFinite(startsAt) || !Number.isFinite(endsAt)) return null;
  if (endsAt <= startsAt || endsAt - startsAt > LONGEST_MS) return null;
  const titleEn = text(v.title_en), titleAr = text(v.title_ar);
  if (!titleEn && !titleAr) return null;
  const slug = text(v.event_slug, 128);
  return { videoId, titleEn: titleEn || titleAr, titleAr: titleAr || titleEn, startsAt, endsAt, eventSlug: SLUG.test(slug) ? slug : null };
}

export type LiveState = 'soon' | 'live';

/** Where the event stands at `now`: starting within the hour, on now, or (null) not shown. */
export function liveState(event: LiveEvent | null, now: number): LiveState | null {
  if (!event) return null;
  if (now >= event.startsAt && now < event.endsAt) return 'live';
  if (now >= event.startsAt - LIVE_LEAD_MS && now < event.startsAt) return 'soon';
  return null;
}
