import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_ENABLED_KEY = 'houna-reminder-enabled';
const REMINDER_IDENTIFIER = 'houna-daily-reminder';
/** 7pm local — a reasonable, non-intrusive default; not yet user-configurable (see plan). */
const REMINDER_HOUR = 19;
const REMINDER_MINUTE = 0;

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function isDailyReminderEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(REMINDER_ENABLED_KEY)) === 'true';
}

/**
 * Local-only, device-side scheduling — works identically for Guest and
 * Alias, no backend involved. Returns false (without changing the stored
 * preference) if the user declines the permission prompt, so the UI can
 * reflect that the toggle didn't actually take.
 */
export async function setDailyReminderEnabled(
  enabled: boolean,
  content: { title: string; body: string },
): Promise<boolean> {
  if (enabled) {
    const granted = await requestNotificationPermissions();
    if (!granted) return false;

    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: REMINDER_IDENTIFIER,
        content: { ...content, data: { url: '/tanafas' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: REMINDER_HOUR,
          minute: REMINDER_MINUTE,
        },
      });
    } catch {
      // Web in particular has no real background scheduler — the
      // preference still saves; it just won't fire until a platform that
      // supports it.
    }
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
    return true;
  }

  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
  return true;
}

export interface RemotePushPrefs {
  wantsStoryHighlights: boolean;
  wantsCommunityStats: boolean;
}

/** Nothing until the person switches a kind on (Apple 4.5.4: broadcasts are opt-in). */
export const NO_REMOTE_PUSH: RemotePushPrefs = { wantsStoryHighlights: false, wantsCommunityStats: false };

const wantsAny = (p: RemotePushPrefs) => p.wantsStoryHighlights || p.wantsCommunityStats;

/** This phone's Expo push token, or null (web, simulator, no project, no permission). */
async function devicePushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

/**
 * The Alias's broadcast choices, as saved (they apply to every phone the Alias registered).
 * Nothing saved means nothing chosen.
 */
export async function getRemotePushPrefs(userId: string): Promise<RemotePushPrefs> {
  const { data } = await supabase
    .from('push_tokens')
    .select('wants_story_highlights, wants_community_stats')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (!data) return NO_REMOTE_PUSH;
  return { wantsStoryHighlights: !!data.wants_story_highlights, wantsCommunityStats: !!data.wants_community_stats };
}

/**
 * Saves the Alias's broadcast choices. Anything on registers this phone (asking for permission if
 * needed) and updates the Alias's other phones; everything off removes the Alias's tokens, so
 * nothing is kept that isn't used. Returns false if the permission was refused.
 */
export async function setRemotePushPrefs(userId: string, prefs: RemotePushPrefs): Promise<boolean> {
  if (!wantsAny(prefs)) {
    await supabase.from('push_tokens').delete().eq('user_id', userId).then(undefined, () => {});
    return true;
  }
  if (Device.isDevice && !(await requestNotificationPermissions())) return false;
  await registerPushToken(userId, prefs);
  await updatePushPrefs(userId, prefs);
  return true;
}

/**
 * On launch, for a signed-in Alias who opted in: re-saves this phone's token (tokens can change,
 * and a phone that has none yet gets one). Never asks for permission here.
 */
export async function refreshPushToken(userId: string): Promise<void> {
  try {
    const prefs = await getRemotePushPrefs(userId);
    if (!wantsAny(prefs)) return;
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await registerPushToken(userId, prefs);
  } catch {
    // Non-fatal.
  }
}

export { notificationPath } from './pushPath';

/**
 * Registers this device for remote push and stores the token against the
 * signed-in Alias (see push_tokens table) — Guests have no identity to
 * target a push at, so this is Alias-only, unlike the local reminder above.
 * Silently no-ops on web or in a simulator (no real push token there) and
 * on any other failure — push setup is a nice-to-have, never worth
 * surfacing an error over.
 */
export async function registerPushToken(userId: string, prefs: RemotePushPrefs): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    const data = await devicePushToken();
    if (!data) return;

    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token: data,
        platform: Platform.OS,
        wants_story_highlights: prefs.wantsStoryHighlights,
        wants_community_stats: prefs.wantsCommunityStats,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
  } catch {
    // See doc comment — never worth surfacing.
  }
}

/**
 * Removes this phone's push token (on sign-out), so the Alias's pushes stop coming to a phone
 * someone else may use next. Only this device's token: the Alias's other phones keep theirs.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const data = await devicePushToken();
    if (!data) return;
    await supabase.from('push_tokens').delete().eq('token', data);
  } catch {
    // Non-fatal: signing out must never fail over this.
  }
}

/** Updates just the category prefs on an already-registered token, e.g. when the user flips a toggle without needing to re-register. */
export async function updatePushPrefs(userId: string, prefs: RemotePushPrefs): Promise<void> {
  try {
    await supabase
      .from('push_tokens')
      .update({
        wants_story_highlights: prefs.wantsStoryHighlights,
        wants_community_stats: prefs.wantsCommunityStats,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch {
    // Non-fatal.
  }
}
