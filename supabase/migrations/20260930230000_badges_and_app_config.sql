-- 1. Badges go through one door, which checks what the server can.
-- 2. app_config: settings the app reads at launch, changeable without a new build.

-- ── 1. Badges ──
-- Before, the app inserted badges itself, so anyone could grant themselves any badge. Now
-- claim_badges() does it: streak badges only when the sessions stored here show that many days in a
-- row (counted in the phone's own timezone, as the app counts); the first-session and exploring
-- badges as the app claims them, because which exercise someone did stays on their phone (the
-- privacy policy says so) and the server can't see it. Returns the badges newly awarded.
CREATE OR REPLACE FUNCTION public.claim_badges(p_codes text[], p_tz text DEFAULT 'UTC')
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  tz text := 'UTC';
  active date[];
  cur date;
  streak int := 0;
  code text;
  awarded text[] := '{}';
BEGIN
  IF uid IS NULL OR NOT EXISTS (SELECT 1 FROM profiles WHERE id = uid) THEN
    RETURN awarded;
  END IF;
  IF p_tz IS NOT NULL AND EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_tz) THEN
    tz := p_tz;
  END IF;

  -- The current streak: days in a row ending today (or yesterday, if today has none yet).
  SELECT coalesce(array_agg(DISTINCT (s.started_at AT TIME ZONE tz)::date), '{}') INTO active
  FROM tanafas_sessions s
  WHERE s.user_id = uid AND s.started_at > now() - interval '120 days';
  cur := (now() AT TIME ZONE tz)::date;
  IF NOT cur = ANY (active) THEN
    cur := cur - 1;
  END IF;
  WHILE cur = ANY (active) LOOP
    streak := streak + 1;
    cur := cur - 1;
  END LOOP;

  FOREACH code IN ARRAY coalesce(p_codes[1:9], '{}') LOOP
    CONTINUE WHEN code NOT IN ('streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_100',
                               'first_session', 'all_breathing', 'all_scenes', 'all_skies');
    CONTINUE WHEN code LIKE 'streak\_%' AND streak < substring(code FROM 8)::int;
    INSERT INTO badges_earned (user_id, badge_code) VALUES (uid, code)
    ON CONFLICT (user_id, badge_code) DO NOTHING;
    IF FOUND THEN
      awarded := awarded || code;
    END IF;
  END LOOP;
  RETURN awarded;
END;
$$;
REVOKE ALL ON FUNCTION public.claim_badges(text[], text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_badges(text[], text) TO authenticated;

DROP POLICY IF EXISTS badges_earned_insert_own ON public.badges_earned;
REVOKE INSERT, UPDATE, DELETE ON public.badges_earned FROM anon, authenticated;

-- ── 2. app_config ──
-- Read by everyone (the app, Guests included), written only from the dashboard or SQL. Public
-- values only: never a secret. The Houna Console will manage these (docs/console, its `config`
-- schema); until then, change a value with an UPDATE.
--   min_version: the oldest version allowed per platform ("0.0.0" = none), and where to update.
--   turnstile: Cloudflare Turnstile's site key (public; the secret stays in Supabase Auth), or null.
CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_config_read ON public.app_config;
CREATE POLICY app_config_read ON public.app_config FOR SELECT TO anon, authenticated USING (true);
REVOKE ALL ON public.app_config FROM anon, authenticated;
GRANT SELECT ON public.app_config TO anon, authenticated;

INSERT INTO public.app_config (key, value) VALUES
  ('min_version', '{"android": "0.0.0", "ios": "0.0.0", "android_url": null, "ios_url": null}'),
  ('turnstile', '{"site_key": null}')
ON CONFLICT (key) DO NOTHING;
