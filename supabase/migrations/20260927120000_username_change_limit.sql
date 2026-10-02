-- An Alias can be renamed twice in any 30 days. The limit lives here rather
-- than in the app, so it holds however `profiles` is updated. Claiming a name
-- at sign-up is an INSERT and doesn't count.

CREATE TABLE public.username_changes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX username_changes_user_time ON public.username_changes (user_id, changed_at DESC);

-- RLS on with no policies: only the SECURITY DEFINER functions below read or
-- write it, so nobody can clear their own history to get more changes.
ALTER TABLE public.username_changes ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.limit_username_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF (SELECT count(*) FROM username_changes
        WHERE user_id = NEW.id AND changed_at > now() - interval '30 days') >= 2 THEN
      RAISE EXCEPTION 'username_change_limit' USING ERRCODE = 'P0001';
    END IF;
    INSERT INTO username_changes (user_id) VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER profiles_limit_username_changes
  BEFORE UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.limit_username_changes();

-- What the rename screen shows: changes left in the current 30 days, and when
-- the next one frees up once none are left.
CREATE FUNCTION public.get_username_change_allowance()
 RETURNS TABLE(remaining integer, next_at timestamptz)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH recent AS (
    SELECT changed_at FROM username_changes
    WHERE user_id = auth.uid() AND changed_at > now() - interval '30 days'
  )
  SELECT greatest(0, 2 - (SELECT count(*) FROM recent))::integer,
         CASE WHEN (SELECT count(*) FROM recent) >= 2
              THEN (SELECT min(changed_at) FROM recent) + interval '30 days' END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_username_change_allowance() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_username_change_allowance() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.limit_username_changes() FROM anon, authenticated, public;
