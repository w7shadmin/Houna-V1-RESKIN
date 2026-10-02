-- The community figures, kept for a moment instead of recounted on every open.
--
-- Home asks get_community_activity three times each time it opens (24 hours, week, month), the
-- leaderboard and the badges' "held by N%" count on every visit, and each recounted every session
-- and ping in its window. With a few thousand people a day that's the database's heaviest work, on
-- the free plan's smallest machine. Now:
--   * sessions are indexed by when they started (the windows filter on it);
--   * each result is kept in stats_cache and reused while it's fresh: 2 minutes for the community
--     figures and the leaderboard (a session you've just done shows within two minutes), 10 for
--     the badge shares (they move slowly).
-- The functions keep their signatures, results and grants; only where the answer comes from changes.

CREATE INDEX IF NOT EXISTS tanafas_sessions_started_at_idx ON public.tanafas_sessions (started_at);

CREATE TABLE IF NOT EXISTS public.stats_cache (
  key text PRIMARY KEY,
  data jsonb NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);
-- Read and written only by the SECURITY DEFINER functions below: RLS on, no policies, no grants.
ALTER TABLE public.stats_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stats_cache FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_community_activity(period text DEFAULT '24h')
RETURNS TABLE(total_sessions bigint, total_people bigint, countries jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  win text := CASE WHEN period IN ('week', 'month') THEN period ELSE '24h' END;
  cache_key text := 'community:' || win;
  cached jsonb;
BEGIN
  SELECT s.data INTO cached FROM stats_cache s
  WHERE s.key = cache_key AND s.computed_at > now() - interval '2 minutes';

  IF cached IS NULL THEN
    WITH bounds AS (
      SELECT now() - CASE win
        WHEN 'week' THEN interval '7 days'
        WHEN 'month' THEN interval '30 days'
        ELSE interval '24 hours'
      END AS since
    ),
    pings AS (
      SELECT ap.country FROM activity_pings ap, bounds b WHERE ap.pinged_at >= b.since
    ),
    people AS (
      SELECT count(DISTINCT ts.user_id) AS n
      FROM tanafas_sessions ts, bounds b
      WHERE ts.started_at >= b.since AND ts.kind IN ('breathing', 'meditation')
    )
    SELECT jsonb_build_object(
      'total_sessions', (SELECT count(*) FROM pings),
      'total_people', (SELECT n FROM people),
      'countries', coalesce(
        (SELECT jsonb_agg(jsonb_build_object('country', g.country, 'count', g.c) ORDER BY g.c DESC)
         FROM (SELECT p.country, count(*) AS c FROM pings p WHERE p.country IS NOT NULL GROUP BY p.country) g),
        '[]'::jsonb)
    ) INTO cached;

    INSERT INTO stats_cache (key, data, computed_at) VALUES (cache_key, cached, now())
    ON CONFLICT (key) DO UPDATE SET data = excluded.data, computed_at = excluded.computed_at;
  END IF;

  RETURN QUERY SELECT (cached->>'total_sessions')::bigint, (cached->>'total_people')::bigint, cached->'countries';
END;
$function$;

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
      WHERE ts.kind <> 'mood'
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

CREATE OR REPLACE FUNCTION public.get_badge_shares()
RETURNS TABLE(badge_code text, share integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
#variable_conflict use_column
DECLARE
  cached jsonb;
BEGIN
  SELECT s.data INTO cached FROM stats_cache s
  WHERE s.key = 'badge_shares' AND s.computed_at > now() - interval '10 minutes';

  IF cached IS NULL THEN
    SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb) INTO cached
    FROM (
      SELECT b.badge_code,
             round(100.0 * count(DISTINCT b.user_id) / greatest((SELECT count(*) FROM profiles), 1))::integer AS share
      FROM badges_earned b
      JOIN profiles p ON p.id = b.user_id
      GROUP BY b.badge_code
    ) r;

    INSERT INTO stats_cache (key, data, computed_at) VALUES ('badge_shares', cached, now())
    ON CONFLICT (key) DO UPDATE SET data = excluded.data, computed_at = excluded.computed_at;
  END IF;

  RETURN QUERY SELECT x.badge_code, x.share FROM jsonb_to_recordset(cached) AS x(badge_code text, share integer);
END;
$function$;
