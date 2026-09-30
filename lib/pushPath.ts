/**
 * Which screen a tapped notification may open (lib/notifications.ts, hooks/usePushNotifications.ts).
 * Kept apart, with no native imports, so it can be tested.
 */

/** The screens a notification may open: Houna's own paths only, never an outside address. */
const PUSH_PATH_ROOTS = ['', 'tanafas', 'events', 'directory', 'crisis', 'recap', 'profile', 'month', 'your-sky', 'results', 'about', 'account'];

/** The in-app path a notification carries (`data.url`), if it's one the app may open. */
export function notificationPath(data: unknown): string | null {
  const url = (data as { url?: unknown } | null)?.url;
  if (typeof url !== 'string' || url.length > 200 || !url.startsWith('/') || url.startsWith('//') || url.includes('://')) return null;
  const root = url.slice(1).split(/[/?#]/)[0];
  return PUSH_PATH_ROOTS.includes(root) ? url : null;
}
