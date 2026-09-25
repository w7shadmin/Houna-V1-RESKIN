import React, { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import DetailScreen from '@/components/DetailScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
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
    <DetailScreen title={s.title}>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.subtitle}</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card }]}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{s.reminderTitle}</Text>
            <Text style={[styles.rowBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.reminderBody}</Text>
          </View>
          <Switch
            value={reminderOn}
            onValueChange={handleReminderToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
      </View>

      {!!permissionBlocked && (
        <Text style={[styles.permissionNote, { color: colors.accent, fontFamily: fonts.regular }]}>{s.permissionDenied}</Text>
      )}

      {isGuest ? (
        <Pressable
          onPress={() => router.push('/account/sign-in')}
          style={({ pressed }) => [styles.guestNote, { backgroundColor: colors.primaryLightest }, pressed && { opacity: 0.85 }]}
        >
          <Text style={[styles.guestNoteText, { color: colors.primary, fontFamily: fonts.regular }]}>{s.guestNote}</Text>
        </Pressable>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontFamily: fonts.semiBold }]}>{s.remoteHeading}</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card }]}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{s.storyHighlightsTitle}</Text>
                <Text style={[styles.rowBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.storyHighlightsBody}</Text>
              </View>
              <Switch
                value={storyHighlights}
                onValueChange={(v) => handleRemoteToggle('story', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <View style={[styles.row, styles.rowDivider, { borderTopColor: colors.borderLight }]}>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{s.communityStatsTitle}</Text>
                <Text style={[styles.rowBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.communityStatsBody}</Text>
              </View>
              <Switch
                value={communityStats}
                onValueChange={(v) => handleRemoteToggle('stats', v)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          </View>
        </>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.fontSize.body,
  },
  rowBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginTop: 2,
  },
  permissionNote: {
    fontSize: typography.fontSize.sm,
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  guestNote: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  guestNoteText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
