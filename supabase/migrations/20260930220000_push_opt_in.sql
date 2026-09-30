-- Broadcasts are opt-in (Apple 4.5.4): a push_tokens row no longer assumes "yes" to each kind.
-- The app always sends both choices; this only changes what a row without them would mean.
ALTER TABLE public.push_tokens ALTER COLUMN wants_story_highlights SET DEFAULT false;
ALTER TABLE public.push_tokens ALTER COLUMN wants_community_stats SET DEFAULT false;
