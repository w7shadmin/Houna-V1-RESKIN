-- The check-in's moods changed after device testing: seven moods on one
-- pleasantness scale (angry, anxious, sad, neutral, calm, hopeful, joyful).
-- 'angry', 'hopeful' and 'joyful' are new to mood_pings; 'frustrated' and
-- 'tired' are no longer offered but stay allowed so existing rows (and any
-- app still on an older build) remain valid. Until this runs, pings for the
-- new moods fail quietly and the check-in just skips the "you're not alone"
-- count (see lib/moodPings.ts).
alter table public.mood_pings drop constraint if exists mood_pings_tag_check;
alter table public.mood_pings add constraint mood_pings_tag_check
  check (mood_tag = any (array['angry', 'anxious', 'sad', 'neutral', 'calm', 'hopeful', 'joyful', 'frustrated', 'tired']));
