import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import { hexToRgba } from '@/lib/color';
import { getTodayEntry, logMoodForToday, MOOD_TAGS, MOOD_EMOJI, MOOD_COLORS, type MoodTag } from '@/lib/journal';

/** Quick one-tap mood check-in — logs (or updates) today's journal entry's mood without requiring any text. */
export default function HomeMoodCard() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const m = t.home.mood;
  const labels = t.journal.moodLabels;

  const [todayMood, setTodayMood] = useState<MoodTag | null>(null);
  const [justLogged, setJustLogged] = useState(false);
  const loggedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    };
  }, []);

  const handlePress = async (mood: MoodTag) => {
    setTodayMood(mood);
    await logMoodForToday(mood);
    setJustLogged(true);
    if (loggedTimeoutRef.current) clearTimeout(loggedTimeoutRef.current);
    loggedTimeoutRef.current = setTimeout(() => setJustLogged(false), 2500);
  };

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
