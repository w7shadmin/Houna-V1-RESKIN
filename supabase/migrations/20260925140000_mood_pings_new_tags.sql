-- Two moods joined the check-in after the first device test: 'angry'
-- (heavier than frustrated) and 'joyful' (lighter than calm). Widen the
-- mood_pings tag check so their anonymous "you're not alone" pings are
-- accepted. Until this runs, pings for those two moods fail quietly and the
-- check-in just skips the count (see lib/moodPings.ts).
alter table public.mood_pings drop constraint if exists mood_pings_tag_check;
alter table public.mood_pings add constraint mood_pings_tag_check
  check (mood_tag = any (array['joyful', 'calm', 'neutral', 'sad', 'anxious', 'frustrated', 'angry', 'tired']));
