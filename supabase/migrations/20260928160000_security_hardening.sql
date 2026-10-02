-- Security hardening from the pre-release audit (28 Sep 2026). Nothing here deletes data.

-- ── Practice sessions: plausible values only, so the leaderboard and streaks can't be forged ──
-- A session ends after it starts and lasts at most 8 hours (a "no limit" meditation included;
-- the longest real one so far is about 7).
ALTER TABLE public.tanafas_sessions
  ADD CONSTRAINT tanafas_sessions_duration_check
  CHECK (duration_seconds BETWEEN 0 AND 28800 AND (completed_at IS NULL OR completed_at >= started_at));

-- The app records a session as it ends: it must have started within the last day and not be in the future.
DROP POLICY IF EXISTS tanafas_sessions_insert_own ON public.tanafas_sessions;
CREATE POLICY tanafas_sessions_insert_own ON public.tanafas_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND started_at >= now() - interval '1 day'
    AND started_at <= now() + interval '5 minutes'
    AND (completed_at IS NULL OR completed_at <= now() + interval '5 minutes')
  );

-- One person can't be in two sessions at once: an overlapping insert is refused, which caps
-- anyone's counted practice at the hours that actually passed.
CREATE OR REPLACE FUNCTION public.refuse_overlapping_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tanafas_sessions s
    WHERE s.user_id = NEW.user_id
      AND s.started_at < COALESCE(NEW.completed_at, NEW.started_at + make_interval(secs => NEW.duration_seconds))
      AND COALESCE(s.completed_at, s.started_at + make_interval(secs => s.duration_seconds)) > NEW.started_at
  ) THEN
    RAISE EXCEPTION 'overlapping_session' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.refuse_overlapping_session() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tanafas_sessions_no_overlap ON public.tanafas_sessions;
CREATE TRIGGER tanafas_sessions_no_overlap
  BEFORE INSERT ON public.tanafas_sessions
  FOR EACH ROW EXECUTE FUNCTION public.refuse_overlapping_session();

-- ── Badges: only the app's own badge codes ──
ALTER TABLE public.badges_earned
  ADD CONSTRAINT badges_earned_code_check
  CHECK (badge_code IN ('streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_100',
                        'first_session', 'all_breathing', 'all_scenes', 'all_skies'));

-- ── The leaderboard lists usernames: signed-in Aliases only, not the whole internet ──
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text) TO authenticated;

-- ── Photos: images only, sensibly sized ──
UPDATE storage.buckets
  SET file_size_limit = 5 * 1024 * 1024,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  WHERE id = 'avatars';
UPDATE storage.buckets
  SET file_size_limit = 10 * 1024 * 1024,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  WHERE id = 'voices';

-- The buckets stay public, so a photo's own link still works for everyone. But the public
-- SELECT policies also let anyone LIST every file (every user's folder, and Voices photos still
-- waiting for moderation). Reading through the API is now limited to your own folder; public
-- links don't need a policy.
DROP POLICY IF EXISTS avatar_public_read ON storage.objects;
DROP POLICY IF EXISTS voices_public_read ON storage.objects;
CREATE POLICY avatar_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY voices_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'voices' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ── Image links must point at the owner's own folder in this project's storage ──
-- (Otherwise a direct API call could make everyone's phone load an image from any server.)
ALTER TABLE public.voice_posts
  ADD CONSTRAINT voice_posts_image_url_check
  CHECK (image_url IS NULL
         OR image_url LIKE 'https://jzvwbfvimjdjlikseqec.supabase.co/storage/v1/object/public/voices/' || user_id::text || '/%');
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_avatar_url_check
  CHECK (avatar_url IS NULL
         OR avatar_url LIKE 'https://jzvwbfvimjdjlikseqec.supabase.co/storage/v1/object/public/avatars/' || id::text || '/%');
