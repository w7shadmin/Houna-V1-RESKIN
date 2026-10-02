-- Live events (2 Oct 2026): a Houna event streamed on YouTube, shown in the app while it's on.
--
-- 1. `app_config.live_event`: the stream the app shows. Empty ({}) means nothing is live. Set it
--    from the SQL editor (or, later, the Console) a little before the event:
--      UPDATE app_config SET value = jsonb_build_object(
--        'video_id', 'YOUTUBE_ID', 'title_en', 'Event title', 'title_ar', 'عنوان الفعالية',
--        'starts_at', '2026-10-10T16:00:00Z', 'ends_at', '2026-10-10T18:00:00Z',
--        'event_slug', 'houna-org-event-slug'), updated_at = now()
--      WHERE key = 'live_event';
--    The app shows "Starting at …" from an hour before `starts_at`, "Live now" until `ends_at`.
-- 2. `push_tokens.wants_events`: a fourth broadcast kind, "Live events", off until the Alias
--    switches it on (Apple 4.5.4), like the others.

INSERT INTO public.app_config (key, value)
VALUES ('live_event', '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS wants_events boolean NOT NULL DEFAULT false;
GRANT SELECT (wants_events), INSERT (wants_events), UPDATE (wants_events) ON public.push_tokens TO authenticated;
