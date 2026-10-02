-- Store compliance fixes (the "Houna app — store compliance pack", decided 30 Sep 2026).
--
--  1. Mood check-ins stay on the phone: the anonymous mood pings and their count go.
--  2. Questionnaire results stay on the phone: the server copy ("Save to my profile") goes.
--  3. Google sign-in keeps the email only: the name and photo are stripped as they arrive.
--  4. Activity pings are kept 13 months, purged nightly.
--  5. The leaderboard is opt-in; a Voices post never exposes its author's account id.
--  9. The old account-linked 'mood' session rows go, and the kind with them.
-- 10. Voices can be reported and its authors blocked, by anyone (Guests too), per phone.

-- 1. ──────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_mood_ping_count(text, date);
DROP TABLE IF EXISTS public.mood_pings;

-- 2. ──────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.psychometric_results;

-- 9. ──────────────────────────────────────────────────────────────────────────
DELETE FROM public.tanafas_sessions WHERE kind = 'mood';
ALTER TABLE public.tanafas_sessions DROP CONSTRAINT IF EXISTS tanafas_sessions_kind_check;
ALTER TABLE public.tanafas_sessions ADD CONSTRAINT tanafas_sessions_kind_check CHECK (kind IN ('breathing', 'meditation'));

-- 3. ──────────────────────────────────────────────────────────────────────────
-- What an identity provider says about the person, minus their name and picture.
CREATE OR REPLACE FUNCTION public.strip_identity_profile(meta jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
AS $function$
  SELECT coalesce(meta, '{}'::jsonb)
    - ARRAY['name', 'full_name', 'given_name', 'family_name', 'nickname', 'preferred_username', 'avatar_url', 'picture', 'locale'];
$function$;

CREATE OR REPLACE FUNCTION public.houna_users_email_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.raw_user_meta_data := public.strip_identity_profile(NEW.raw_user_meta_data);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.houna_identities_email_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.identity_data := public.strip_identity_profile(NEW.identity_data);
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.strip_identity_profile(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.houna_users_email_only() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.houna_identities_email_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS houna_email_only ON auth.users;
CREATE TRIGGER houna_email_only
  BEFORE INSERT OR UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.houna_users_email_only();

DROP TRIGGER IF EXISTS houna_email_only ON auth.identities;
CREATE TRIGGER houna_email_only
  BEFORE INSERT OR UPDATE OF identity_data ON auth.identities
  FOR EACH ROW EXECUTE FUNCTION public.houna_identities_email_only();

-- Those already signed in with Google.
UPDATE auth.users SET raw_user_meta_data = public.strip_identity_profile(raw_user_meta_data)
WHERE raw_user_meta_data ?| ARRAY['name', 'full_name', 'given_name', 'family_name', 'nickname', 'preferred_username', 'avatar_url', 'picture', 'locale'];
UPDATE auth.identities SET identity_data = public.strip_identity_profile(identity_data)
WHERE identity_data ?| ARRAY['name', 'full_name', 'given_name', 'family_name', 'nickname', 'preferred_username', 'avatar_url', 'picture', 'locale'];

-- 4. ──────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'houna-purge-activity-pings';
SELECT cron.schedule(
  'houna-purge-activity-pings',
  '17 3 * * *',
  $$DELETE FROM public.activity_pings WHERE pinged_at < now() - interval '13 months'$$
);

-- 5. ──────────────────────────────────────────────────────────────────────────
-- The leaderboard shows only those who chose to be on it (account settings).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_on_leaderboard boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.get_leaderboard(period text DEFAULT 'week')
RETURNS TABLE(username text, session_count bigint, total_minutes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  win text := CASE WHEN period = 'all' THEN 'all' ELSE 'week' END;
  cache_key text := 'leaderboard:' || win;
  cached jsonb;
BEGIN
  SELECT s.data INTO cached FROM stats_cache s
  WHERE s.key = cache_key AND s.computed_at > now() - interval '2 minutes';

  IF cached IS NULL THEN
    SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY r.session_count DESC), '[]'::jsonb) INTO cached
    FROM (
      SELECT p.username, count(ts.id) AS session_count, floor(coalesce(sum(ts.duration_seconds), 0) / 60)::bigint AS total_minutes
      FROM tanafas_sessions ts
      JOIN profiles p ON p.id = ts.user_id
      WHERE p.show_on_leaderboard
        AND (win = 'all' OR ts.started_at >= now() - interval '7 days')
      GROUP BY p.username
      ORDER BY count(ts.id) DESC
      LIMIT 50
    ) r;

    INSERT INTO stats_cache (key, data, computed_at) VALUES (cache_key, cached, now())
    ON CONFLICT (key) DO UPDATE SET data = excluded.data, computed_at = excluded.computed_at;
  END IF;

  RETURN QUERY
  SELECT x.username, x.session_count, x.total_minutes
  FROM jsonb_to_recordset(cached) AS x(username text, session_count bigint, total_minutes bigint)
  ORDER BY x.session_count DESC;
END;
$function$;
DELETE FROM public.stats_cache WHERE key LIKE 'leaderboard:%';

-- Approved posts are read only through the feed functions, which never return the author's id.
DROP POLICY IF EXISTS voice_posts_select_approved ON public.voice_posts;

-- 10. ─────────────────────────────────────────────────────────────────────────
-- Both keyed by the phone's anonymous id (lib/activityActor.ts), so Guests can report and block.
-- RLS on, no policies: written and read only through the functions below.
CREATE TABLE IF NOT EXISTS public.voice_reports (
  post_id uuid NOT NULL REFERENCES public.voice_posts(id) ON DELETE CASCADE,
  actor uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('harmful', 'harassment', 'spam', 'personal', 'other')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, actor)
);
ALTER TABLE public.voice_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.voice_reports FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.voice_blocks (
  actor uuid NOT NULL,
  author uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (actor, author)
);
ALTER TABLE public.voice_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.voice_blocks FROM anon, authenticated;

/** Reports a post; three different phones reporting it send it back to moderation. */
CREATE OR REPLACE FUNCTION public.report_voice_post(p_post_id uuid, p_actor uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_actor IS NULL OR p_post_id IS NULL THEN
    RAISE EXCEPTION 'missing post or actor';
  END IF;
  INSERT INTO voice_reports (post_id, actor, reason) VALUES (p_post_id, p_actor, p_reason)
  ON CONFLICT (post_id, actor) DO NOTHING;
  IF (SELECT count(*) FROM voice_reports WHERE post_id = p_post_id) >= 3 THEN
    UPDATE voice_posts SET status = 'pending', reviewed_at = NULL WHERE id = p_post_id AND status = 'approved';
  END IF;
END;
$function$;

/** Hides every post by this post's author from this phone's feed. */
CREATE OR REPLACE FUNCTION public.block_voice_author(p_post_id uuid, p_actor uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  who uuid;
BEGIN
  IF p_actor IS NULL THEN
    RAISE EXCEPTION 'missing actor';
  END IF;
  SELECT user_id INTO who FROM voice_posts WHERE id = p_post_id;
  IF who IS NOT NULL AND who IS DISTINCT FROM auth.uid() THEN
    INSERT INTO voice_blocks (actor, author) VALUES (p_actor, who) ON CONFLICT DO NOTHING;
  END IF;
END;
$function$;

/** How many authors this phone has blocked. */
CREATE OR REPLACE FUNCTION public.count_voice_blocks(p_actor uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT count(*)::integer FROM voice_blocks WHERE actor = p_actor;
$function$;

/** Unblocks everyone this phone blocked. */
CREATE OR REPLACE FUNCTION public.unblock_voice_authors(p_actor uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  DELETE FROM voice_blocks WHERE actor = p_actor;
$function$;

-- The feed, less what this phone blocked or reported. (Called without an id, as older builds do, it's the whole feed.)
DROP FUNCTION IF EXISTS public.get_voice_feed();
CREATE OR REPLACE FUNCTION public.get_voice_feed(p_actor uuid DEFAULT NULL)
RETURNS TABLE(id uuid, username text, title text, body text, image_url text, for_meditation boolean, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT vp.id, p.username, vp.title, vp.body, vp.image_url, vp.for_meditation, vp.created_at
  FROM voice_posts vp
  JOIN profiles p ON p.id = vp.user_id
  WHERE vp.status = 'approved'
    AND NOT EXISTS (SELECT 1 FROM voice_blocks b WHERE b.actor = p_actor AND b.author = vp.user_id)
    AND NOT EXISTS (SELECT 1 FROM voice_reports r WHERE r.actor = p_actor AND r.post_id = vp.id)
  ORDER BY vp.created_at DESC;
$function$;

-- One post: whether it's the caller's own, never whose it is.
DROP FUNCTION IF EXISTS public.get_voice_post(uuid);
CREATE OR REPLACE FUNCTION public.get_voice_post(p_id uuid)
RETURNS TABLE(id uuid, is_mine boolean, username text, title text, body text, image_url text, for_meditation boolean, status text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT vp.id, (vp.user_id = auth.uid()) AS is_mine, p.username, vp.title, vp.body, vp.image_url, vp.for_meditation, vp.status, vp.created_at
  FROM voice_posts vp
  JOIN profiles p ON p.id = vp.user_id
  WHERE vp.id = p_id AND (vp.status = 'approved' OR vp.user_id = auth.uid());
$function$;

REVOKE ALL ON FUNCTION public.report_voice_post(uuid, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.block_voice_author(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.count_voice_blocks(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.unblock_voice_authors(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_voice_feed(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_voice_post(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.report_voice_post(uuid, uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.block_voice_author(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_voice_blocks(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_voice_authors(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_voice_feed(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_voice_post(uuid) TO anon, authenticated;
