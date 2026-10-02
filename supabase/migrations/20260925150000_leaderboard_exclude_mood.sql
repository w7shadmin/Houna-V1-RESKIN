-- Mood logging must never feed streaks or the leaderboard (CLAUDE.md safety
-- requirement). The app no longer writes kind = 'mood' rows, but older ones
-- remain in tanafas_sessions, so the leaderboard ignores them explicitly.
CREATE OR REPLACE FUNCTION public.get_leaderboard(period text DEFAULT 'week'::text)
 RETURNS TABLE(username text, session_count bigint, total_minutes bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.username, count(ts.id), floor(coalesce(sum(ts.duration_seconds), 0) / 60)
  FROM tanafas_sessions ts
  JOIN profiles p ON p.id = ts.user_id
  WHERE ts.kind <> 'mood'
    AND (period = 'all' OR ts.started_at >= now() - interval '7 days')
  GROUP BY p.username
  ORDER BY count(ts.id) DESC
  LIMIT 50;
$function$;
