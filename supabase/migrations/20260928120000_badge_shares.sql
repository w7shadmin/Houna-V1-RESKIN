-- "Held by N% of Houna" on each badge (canvas "Phase 6 — Badges"): the share of
-- Aliases holding each badge, as a whole percentage. Counts only, never names or
-- ids; badges_earned stays readable only by its owner (its RLS is unchanged).
CREATE OR REPLACE FUNCTION public.get_badge_shares()
 RETURNS TABLE(badge_code text, share integer)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT b.badge_code,
         round(100.0 * count(DISTINCT b.user_id) / greatest((SELECT count(*) FROM profiles), 1))::integer
  FROM badges_earned b
  JOIN profiles p ON p.id = b.user_id
  GROUP BY b.badge_code;
$function$;

REVOKE ALL ON FUNCTION public.get_badge_shares() FROM public;
GRANT EXECUTE ON FUNCTION public.get_badge_shares() TO anon, authenticated;
