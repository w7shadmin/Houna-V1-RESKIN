import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Check, Users } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { hexToRgba } from '@/lib/color';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { getTodayEntry, logMoodForToday, MOOD_TAGS, MOOD_EMOJI, MOOD_COLORS, type MoodTag } from '@/lib/journal';
import { pingMoodAndGetCount } from '@/lib/moodPings';
import { recordTanafasSession } from '@/lib/usageTracking';

/** Quick one-tap mood check-in — logs (or updates) today's journal entry's mood without requiring any text. */
export default function HomeMoodCard() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const m = t.home.mood;
  const labels = t.journal.moodLabels;

  const [todayMood, setTodayMood] = useState<MoodTag | null>(null);
  const [justLogged, setJustLogged] = useState(false);
  /** Set only when at least one other person logged the same mood today — see lib/moodPings.ts. Works for Guests too, unlike the rest of this feature area. */
  const [notAloneCount, setNotAloneCount] = useState<number | null>(null);
  const loggedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notAloneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getTodayEntry().then((entry) => {
        if (!cancelled) setTodayMood(entry?.mood ?? null);
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    return () => {
      if (loggedTimeoutRef.current) clearTimeout(loggedTimeoutRef.current);
      if (notAloneTimeoutRef.current) clearTimeout(notAloneTimeoutRef.current);
    };
  }, []);

  const handlePress = async (mood: MoodTag) => {
    setTodayMood(mood);
    setNotAloneCount(null);
    await logMoodForToday(mood);
    setJustLogged(true);

    // Streak/leaderboard activity signal (Segment 5) — Alias-only, silent,
    // no UI here reacts to it. Deliberately never surfaced in this
    // check-in flow itself; see lib/streaks.ts and app/account/stats.tsx.
    recordTanafasSession('mood', new Date()).catch(() => {});
    if (loggedTimeoutRef.current) clearTimeout(loggedTimeoutRef.current);
    loggedTimeoutRef.current = setTimeout(() => setJustLogged(false), 2500);

    // Fire-and-forget: a slower or failed network round trip just means no
    // nudge shows, never a delay to the mood check-in itself.
    pingMoodAndGetCount(mood).then((count) => {
      if (count === null || count < 2) return;
      setNotAloneCount(count);
      if (notAloneTimeoutRef.current) clearTimeout(notAloneTimeoutRef.current);
      // Longer than the plain "Logged" checkmark — this one's a full
      // sentence, worth giving a beat longer to read.
      notAloneTimeoutRef.current = setTimeout(() => setNotAloneCount(null), 4000);
    });
  };

  const notAloneText = (() => {
    if (notAloneCount === null) return null;
    const forms = m.notAlone;
    const template = arabicPlural(notAloneCount, forms);
    const n = isRTL ? arabicNumber(notAloneCount) : String(notAloneCount);
    return template.replace('{n}', n);
  })();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.semiBold }]}>{m.heading}</Text>
        {justLogged && (
          <View style={[styles.loggedBadge, { backgroundColor: colors.primary }]}>
            <Check size={12} color={colors.onPrimary} strokeWidth={2.4} />
            <Text style={[styles.loggedText, { color: colors.onPrimary, fontFamily: fonts.semiBold, lineHeight: typography.lineHeight.xs }]}>
              {m.logged}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.moodRow}>
        {MOOD_TAGS.map((tag) => {
          const selected = todayMood === tag;
          return (
            <Pressable
              key={tag}
              onPress={() => handlePress(tag)}
              style={({ pressed }) => [
                styles.moodButton,
                {
                  backgroundColor: selected ? hexToRgba(MOOD_COLORS[tag], 0.16) : colors.inputBackground,
                  borderColor: selected ? MOOD_COLORS[tag] : 'transparent',
                },
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text style={styles.moodEmoji}>{MOOD_EMOJI[tag]}</Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.moodLabel,
                  { color: selected ? MOOD_COLORS[tag] : colors.textSecondary, fontFamily: fonts.semiBold },
                ]}
              >
                {labels[tag]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!notAloneText && (
        <Pressable
          onPress={() => router.push('/tanafas')}
          style={({ pressed }) => [
            styles.notAloneBanner,
            { backgroundColor: colors.primaryLightest },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Users size={16} color={colors.primary} strokeWidth={2} />
          <Text style={[styles.notAloneText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            {notAloneText}
          </Text>
        </Pressable>
      )}

      {todayMood && (
        <Pressable
          onPress={() => router.push({ pathname: '/tanafas/journal', params: { tab: 'insights' } })}
          style={({ pressed }) => [styles.historyLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.historyLinkText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            {m.viewHistory}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.md,
    flex: 1,
  },
  loggedBadge: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.full,
  },
  loggedText: {
    fontSize: typography.fontSize.xs,
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  notAloneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.md,
  },
  notAloneText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexGrow: 1,
    flexBasis: '30%',
  },
  moodEmoji: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.xxs + 2,
  },
  moodLabel: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  historyLink: {
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  historyLinkText: {
    fontSize: typography.fontSize.sm,
  },
});
