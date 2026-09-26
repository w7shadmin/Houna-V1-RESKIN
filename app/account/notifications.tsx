import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AccountScreen, FormMessage, SettingsGroup, SettingsRow, ThemedSwitch } from '@/components/account/AccountKit';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';
import {
  isDailyReminderEnabled,
  setDailyReminderEnabled,
  registerPushToken,
  updatePushPrefs,
} from '@/lib/notifications';

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { session, isGuest } = useAuth();
  const s = t.account.notifications;

  const [reminderOn, setReminderOn] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [storyHighlights, setStoryHighlights] = useState(true);
  const [communityStats, setCommunityStats] = useState(true);

  useEffect(() => {
    isDailyReminderEnabled().then(setReminderOn);
  }, []);

  const handleReminderToggle = async (value: boolean) => {
    setPermissionBlocked(false);
    setReminderOn(value); // optimistic — reverted below if the permission prompt is declined
    const applied = await setDailyReminderEnabled(value, {
      title: s.reminderNotificationTitle,
      body: s.reminderNotificationBody,
    });
    if (value && !applied) {
      setReminderOn(false);
      setPermissionBlocked(true);
    }
  };

  const handleRemoteToggle = async (key: 'story' | 'stats', value: boolean) => {
    if (key === 'story') setStoryHighlights(value);
    else setCommunityStats(value);
    if (!session) return;

    const prefs = {
      wantsStoryHighlights: key === 'story' ? value : storyHighlights,
      wantsCommunityStats: key === 'stats' ? value : communityStats,
    };
    // Either path upserts/updates the same row — registerPushToken covers a
    // device that hasn't registered a token yet, updatePushPrefs is the
    // lighter path once one exists. Both are safe to call redundantly.
    await registerPushToken(session.user.id, prefs);
    await updatePushPrefs(session.user.id, prefs);
  };

  return (
    <AccountScreen title={s.title} subtitle={s.subtitle}>
      <SettingsGroup label={s.onDevice}>
        <SettingsRow
          title={s.reminderTitle}
          body={s.reminderBody}
          trailing={<ThemedSwitch label={s.reminderTitle} value={reminderOn} onValueChange={handleReminderToggle} />}
        />
      </SettingsGroup>
      {!!permissionBlocked && <FormMessage message={s.permissionDenied} />}

      {isGuest ? (
        <View style={[styles.guest, { backgroundColor: colors.tones.glow.bg, borderColor: colors.tones.glow.border }]}>
          <Text style={[styles.guestText, { color: colors.text, fontFamily: fonts.regular }]}>{s.guestNote}</Text>
          <View style={styles.guestAction}>
            <Button variant="secondary" label={s.signIn} onPress={() => router.push('/account/sign-in')} />
          </View>
        </View>
      ) : (
        <SettingsGroup label={s.remoteHeading}>
          <SettingsRow
            title={s.storyHighlightsTitle}
            body={s.storyHighlightsBody}
            trailing={<ThemedSwitch label={s.storyHighlightsTitle} value={storyHighlights} onValueChange={(v) => handleRemoteToggle('story', v)} />}
          />
          <SettingsRow
            title={s.communityStatsTitle}
            body={s.communityStatsBody}
            trailing={<ThemedSwitch label={s.communityStatsTitle} value={communityStats} onValueChange={(v) => handleRemoteToggle('stats', v)} />}
          />
        </SettingsGroup>
      )}
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  guest: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: grid(2),
    gap: grid(1.5),
    marginTop: grid(1),
  },
  guestText: {
    fontSize: 15,
    lineHeight: 22,
  },
  guestAction: {
    flexDirection: 'row',
  },
});
