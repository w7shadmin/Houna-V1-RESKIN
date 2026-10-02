import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useIntroDone } from '@/hooks/useIntroDone';
import { notificationPath, refreshPushToken } from '@/lib/notifications';

/**
 * Push, app-wide (app/_layout.tsx):
 * - on launch, a signed-in Alias who opted in has this phone's token saved again (tokens change,
 *   and a new phone gets one), without asking for permission;
 * - a tapped notification opens the screen its `data.url` names, one of Houna's own paths only
 *   (`notificationPath`), once the splash has lifted; a cold start from a tap included.
 */
export function usePushNotifications() {
  const { session } = useAuth();
  const router = useRouter();
  const introDone = useIntroDone();
  const userId = session?.user.id;
  // Phones only: the web has no notification responses (the call throws there). The platform never
  // changes while the app runs, so the hook order stays the same.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const last = Platform.OS === 'web' ? null : Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (userId && Platform.OS !== 'web') refreshPushToken(userId);
  }, [userId]);

  useEffect(() => {
    if (!introDone || !last) return;
    const id = last.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const path = notificationPath(last.notification.request.content.data);
    if (path) router.push(path as Href);
  }, [introDone, last, router]);
}
