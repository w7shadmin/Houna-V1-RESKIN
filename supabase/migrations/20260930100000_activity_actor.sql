-- The community map counts each person once, in the country they're in now.
--
-- Before: each activity ping carried the country its sender had then, and the map counted pings
-- by country, so someone who changed their country showed up in both (Home read "1 person ... in
-- 3 countries"). Now each install sends a random, anonymous id with its pings (`actor`: made on the
-- phone, never linked to the account, unreadable here: the table has no SELECT policy):
--   * the map counts each actor once, in the country of its latest ping in the period, and the
--     headline counts actors;
--   * changing your country moves your recent pings with you (`move_my_activity`), so your star
--     moves at once;
--   * pings from before this (no actor) still count as sessions, but no longer on the map.

ALTER TABLE public.activity_pings ADD COLUMN IF NOT EXISTS actor uuid;
CREATE INDEX IF NOT EXISTS activity_pings_actor_idx ON public.activity_pings (actor, pinged_at DESC);

/** Moves one install's recent pings to its new country (or none). Only someone holding the id can. */
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
  -- The cached figures would otherwise show the old country for up to two minutes.
  DELETE FROM stats_cache WHERE key LIKE 'community:%';
END;
$function$;
REVOKE ALL ON FUNCTION public.move_my_activity(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.move_my_activity(uuid, text) TO anon, authenticated;

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
      SELECT ap.actor, ap.country, ap.pinged_at FROM activity_pings ap, bounds b WHERE ap.pinged_at >= b.since
    ),
    -- Each person once, where they were last.
    latest AS (
      SELECT DISTINCT ON (p.actor) p.actor, p.country
      FROM pings p WHERE p.actor IS NOT NULL
      ORDER BY p.actor, p.pinged_at DESC
    )
    SELECT jsonb_build_object(
      'total_sessions', (SELECT count(*) FROM pings),
      'total_people', (SELECT count(*) FROM latest),
      'countries', coalesce(
        (SELECT jsonb_agg(jsonb_build_object('country', g.country, 'count', g.c) ORDER BY g.c DESC)
         FROM (SELECT l.country, count(*) AS c FROM latest l WHERE l.country IS NOT NULL GROUP BY l.country) g),
        '[]'::jsonb)
    ) INTO cached;

    INSERT INTO stats_cache (key, data, computed_at) VALUES (cache_key, cached, now())
    ON CONFLICT (key) DO UPDATE SET data = excluded.data, computed_at = excluded.computed_at;
  END IF;

  RETURN QUERY SELECT (cached->>'total_sessions')::bigint, (cached->>'total_people')::bigint, cached->'countries';
END;
$function$;
