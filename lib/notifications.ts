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
        content,
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

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return; // no EAS project configured yet — see plan's "what's needed from you"

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

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
