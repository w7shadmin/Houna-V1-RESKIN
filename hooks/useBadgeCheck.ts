import { useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { awardBadges, getMyStreak } from '@/lib/streaks';
import { sessionsBetween } from '@/lib/sessionLog';
import { useIntroDone } from '@/hooks/useIntroDone';

/** One check at a time across screens, so two focusing together can't award (and show) a badge twice. */
let checking = false;

/**
 * Awards any badges now earned (lib/badges.ts, Aliases only) whenever the screen comes into
 * focus, and opens the unlock moment (app/badge.tsx) for the new ones. Home uses it (so a badge
 * arrives on returning from a session), and Profile and Stats. `onAwarded` lets a screen reload
 * what it shows.
 */
export function useBadgeCheck(onAwarded?: () => void) {
  const { session, profile } = useAuth();
  const router = useRouter();
  const introDone = useIntroDone();
  const userId = profile ? session?.user.id : undefined;

  useFocusEffect(
    useCallback(() => {
      if (!userId || !introDone || checking) return;
      checking = true;
      let alive = true;
      Promise.all([getMyStreak(), sessionsBetween(new Date(0), new Date(Date.now() + 86400000))])
        .then(([streak, sessions]) => awardBadges(streak.current, sessions))
        .then((fresh) => {
          if (!alive || fresh.length === 0) return;
          onAwarded?.();
          router.push({ pathname: '/badge', params: { codes: fresh.join(',') } });
        })
        .catch(() => {})
        .finally(() => {
          checking = false;
        });
      return () => {
        alive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, introDone]),
  );
}
