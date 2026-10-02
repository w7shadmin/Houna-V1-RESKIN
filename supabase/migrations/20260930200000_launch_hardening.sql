-- Launch hardening, from the 30 Sep 2026 security audit.
--
--   1. The leaderboard can't be forged with empty sessions.
--   2. Voices is gone from the server (it was taken out of the app the same day; phase II, if it
--      comes, starts again from the git history).
--   3. Profiles: only the fields the app edits can be written, and a country is a real code.
--   4. Community-map pings go through one function that limits each phone.
--   5. The public roles lose table rights no API call needs.

-- ── 1. Sessions: at least 10 seconds, honestly timed, at most 50 a day ──
-- The overlap trigger already refuses sessions that overlap, but a 0-second session overlaps
-- nothing, so thousands could be posted to top the leaderboard (which ranks by count). The app
-- itself never counts a session under 10 seconds (lib/sessionLog.ts MIN_SESSION_SECONDS).
-- Rows already stored are left as they are; these rules apply to new ones.
CREATE OR REPLACE FUNCTION public.check_session_values()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.duration_seconds < 10 THEN
    RAISE EXCEPTION 'session_too_short' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.completed_at IS NULL
     OR abs(extract(epoch FROM (NEW.completed_at - NEW.started_at)) - NEW.duration_seconds) > 5 THEN
    RAISE EXCEPTION 'session_times_disagree' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.completed_at > now() + interval '5 minutes' THEN
    RAISE EXCEPTION 'session_in_future' USING ERRCODE = 'check_violation';
  END IF;
  IF (SELECT count(*) FROM public.tanafas_sessions s
      WHERE s.user_id = NEW.user_id AND s.started_at > NEW.started_at - interval '24 hours') >= 50 THEN
    RAISE EXCEPTION 'session_daily_limit' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.check_session_values() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tanafas_sessions_values ON public.tanafas_sessions;
CREATE TRIGGER tanafas_sessions_values
  BEFORE INSERT ON public.tanafas_sessions
  FOR EACH ROW EXECUTE FUNCTION public.check_session_values();

-- ── 2. Voices, gone ──
DROP FUNCTION IF EXISTS public.get_voice_feed(uuid);
DROP FUNCTION IF EXISTS public.get_voice_feed();
DROP FUNCTION IF EXISTS public.get_voice_post(uuid);
DROP FUNCTION IF EXISTS public.report_voice_post(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.block_voice_author(uuid, uuid);
DROP FUNCTION IF EXISTS public.unblock_voice_authors(uuid);
DROP FUNCTION IF EXISTS public.count_voice_blocks(uuid);
DROP TABLE IF EXISTS public.voice_reports;
DROP TABLE IF EXISTS public.voice_blocks;
DROP TABLE IF EXISTS public.voice_posts CASCADE;
DROP POLICY IF EXISTS voices_owner_read ON storage.objects;
DROP POLICY IF EXISTS voices_owner_insert ON storage.objects;
DROP POLICY IF EXISTS voices_owner_update ON storage.objects;
DROP POLICY IF EXISTS voices_owner_delete ON storage.objects;
-- The `voices` bucket itself (empty) is deleted through the Storage API: storage refuses direct
-- deletes from its tables.

-- Unused since Home's map moved to get_community_activity, and it handed profiles' countries to
-- anyone.
DROP FUNCTION IF EXISTS public.get_country_counts();

-- ── 3. Profiles ──
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_country_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_country_check CHECK (country IS NULL OR country ~ '^[A-Z]{2}$');

-- Row security already limits each person to their own row; these limit the columns. Guests
-- (anon) never touch profiles. id and created_at can't be rewritten.
REVOKE ALL ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT (id, username) ON public.profiles TO authenticated;
GRANT UPDATE (username, avatar_url, country, show_on_leaderboard) ON public.profiles TO authenticated;

-- ── 4. Community-map pings, through one door ──
-- Before, anyone could insert pings straight into the table, as many as they liked. Now the app
-- calls record_activity: one ping a minute per phone at most, 60 a day, and nothing without the
-- phone's id. A new random id each time still gets past it, so the map's numbers are a fair
-- picture, not a guarantee; they only ever feed Home's count.
CREATE OR REPLACE FUNCTION public.record_activity(p_kind text, p_actor uuid, p_country text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_actor IS NULL OR p_kind NOT IN ('breathing', 'meditation') THEN
    RETURN;
  END IF;
  IF p_country IS NOT NULL AND p_country !~ '^[A-Z]{2}$' THEN
    p_country := NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM activity_pings WHERE actor = p_actor AND pinged_at > now() - interval '1 minute')
     OR (SELECT count(*) FROM activity_pings WHERE actor = p_actor AND pinged_at > now() - interval '24 hours') >= 60 THEN
    RETURN;
  END IF;
  INSERT INTO activity_pings (kind, country, actor, pinged_at) VALUES (p_kind, p_country, p_actor, now());
END;
$$;
REVOKE ALL ON FUNCTION public.record_activity(text, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_activity(text, uuid, text) TO anon, authenticated;

DROP POLICY IF EXISTS activity_pings_insert_anyone ON public.activity_pings;
REVOKE ALL ON public.activity_pings FROM anon, authenticated;

-- Changing country moves the phone's pings (it never adds any). Only clear the cached figures
-- when something actually moved, so repeated calls can't force endless recounts.
CREATE OR REPLACE FUNCTION public.move_my_activity(p_actor uuid, p_country text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_actor IS NULL THEN
    RETURN;
  END IF;
  IF p_country IS NOT NULL AND p_country !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'invalid country';
  END IF;
  UPDATE activity_pings SET country = p_country
  WHERE actor = p_actor AND pinged_at >= now() - interval '31 days' AND country IS DISTINCT FROM p_country;
  IF FOUND THEN
    DELETE FROM stats_cache WHERE key LIKE 'community:%';
  END IF;
END;
$function$;

-- ── 5. Table rights no API call needs ──
-- PostgREST never truncates or creates triggers, and row security doesn't cover TRUNCATE.
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- ── 6. Two functions only signed-in Aliases call ──
-- Username availability is checked on the username screen, after sign-in; badge shares show on
-- the badges page and the unlock moment, Aliases only. Guests needn't reach either (and anonymous
-- callers could list which usernames exist).
REVOKE EXECUTE ON FUNCTION public.is_username_available(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_username_available(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_badge_shares() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_badge_shares() TO authenticated;
