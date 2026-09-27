import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, Share, StyleSheet, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { AccountScreen, FormMessage } from '@/components/account/AccountKit';
import { GroupLabel } from '@/components/directory/ProfileKit';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';
import BadgeGem from '@/components/badges/BadgeGem';
import WeekMoons from '@/components/stats/WeekMoons';
import WeekArc from '@/components/stats/WeekArc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout, radius } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { getMyStreak, getMyBadges, getLeaderboard, type StreakInfo, type LeaderboardRow } from '@/lib/streaks';
import { BADGE_ORDER } from '@/lib/badges';
import { useBadgeCheck } from '@/hooks/useBadgeCheck';
import { sessionsBetween } from '@/lib/sessionLog';
import { dayKey, minutesByGroup, weekBounds, type PracticeGroup } from '@/lib/practice';

type Period = 'week' | 'all';

export default function StatsScreen() {
  const { colors } = useTheme();
  const { t, isRTL, fonts } = useLanguage();
  const { session, profile } = useAuth();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const s = t.account.stats;

  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<Period>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  // The week's minutes by part, and last week's, from the phone's own session log.
  const [week, setWeek] = useState<{ parts: Record<PracticeGroup, number>; last: number; days: boolean[]; monday: Date } | null>(null);

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const loadStreak = useCallback(async () => {
    if (!session) return;
    setStreak(await getMyStreak());
    setEarnedBadges(new Set((await getMyBadges()).keys()));
  }, [session]);
  // New badges arrive with the unlock moment, and the row here follows.
  useBadgeCheck(loadStreak);

  useFocusEffect(
    useCallback(() => {
      loadStreak();
    }, [loadStreak]),
  );

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const { from, to, lastFrom } = weekBounds(new Date());
      sessionsBetween(lastFrom, to)
        .then((all) => {
          if (!alive) return;
          const thisWeek = all.filter((x) => x.startedAt >= from.getTime());
          const last = minutesByGroup(all.filter((x) => x.startedAt < from.getTime()));
          const practised = new Set(thisWeek.map((x) => dayKey(new Date(x.startedAt))));
          const days = Array.from({ length: 7 }, (_, i) => practised.has(dayKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + i))));
          setWeek({ parts: minutesByGroup(thisWeek), last: Object.values(last).reduce((a, b) => a + b, 0), days, monday: from });
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      setLoadingBoard(true);
      getLeaderboard(period)
        .then(setLeaderboard)
        .finally(() => setLoadingBoard(false));
    }, [period]),
  );

  const handleShare = () => {
    if (!streak || streak.current === 0) return;
    const message = arabicPlural(streak.current, s.shareMessage).replace('{n}', num(streak.current));
    Share.share({ message }).catch(() => {});
  };

  if (!session) return null;

  const labelLatin = fonts.labelTracked;
  const label = [labelLatin ? styles.labelLatin : styles.labelArabic, { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label }];

  return (
    <AccountScreen title={s.title} subtitle={s.subtitle}>
      {week && <WeekArc week={week.parts} lastWeek={week.last} />}

      {/* The streak as the week in moons (canvas "Phase 6 — Stats: the week in moons"). */}
      {week && streak && (
        <WeekMoons
          streak={streak.current}
          practised={week.days}
          monday={week.monday}
          today={(new Date().getDay() + 6) % 7}
          width={Math.min(width, layout.maxContentWidth) - layout.screenPadding * 2}
        />
      )}
      {!!streak && streak.current === 0 && <FormMessage message={s.noStreakYet} tone="muted" />}
      <View style={[styles.line, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={label}>{s.longestStreak}</Text>
        <Text style={[styles.longestNumber, isRTL && styles.longestNumberArabic, { color: colors.text, fontFamily: fonts.numeral }]}>
          {streak ? num(streak.longest) : '—'}
        </Text>
      </View>
      {!!streak && streak.current > 0 && (
        <View style={styles.shareRow}>
          <Button variant="secondary" label={s.share} onPress={handleShare} />
        </View>
      )}

      {/* The gems held, opening the badges page. */}
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/account/badges')}
        style={({ pressed }) => [styles.line, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
      >
        {BADGE_ORDER.filter((c) => earnedBadges.has(c)).map((c) => (
          <BadgeGem key={c} code={c} size={26} />
        ))}
        <Text style={[styles.badgesLabel, { color: colors.text, fontFamily: fonts.medium }]}>{t.badges.title}</Text>
        <Text style={[styles.note, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
          {t.badges.count.replace('{n}', num(BADGE_ORDER.filter((c) => earnedBadges.has(c)).length)).replace('{m}', num(BADGE_ORDER.length))}
        </Text>
        <DirectionalIcon isRTL={isRTL} name="chevron" size={18} color={colors.textTertiary} />
      </Pressable>

      <View style={styles.section}>
        <GroupLabel>{s.leaderboardTitle}</GroupLabel>
        <Text style={[styles.note, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.leaderboardSubtitle}</Text>
        <View style={styles.chips}>
          <Chip size="sm" label={s.thisWeek} selected={period === 'week'} onPress={() => setPeriod('week')} />
          <Chip size="sm" label={s.allTime} selected={period === 'all'} onPress={() => setPeriod('all')} />
        </View>

        {loadingBoard ? (
          <ActivityIndicator style={styles.boardLoading} color={colors.primary} />
        ) : leaderboard.length === 0 ? (
          <FormMessage message={s.leaderboardEmpty} tone="muted" />
        ) : (
          <View style={[styles.board, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {leaderboard.map((row, i) => {
              const isYou = profile?.username === row.username;
              return (
                <View
                  key={row.username}
                  style={[
                    styles.boardRow,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                    isYou && { backgroundColor: colors.tones.glow.bg },
                  ]}
                >
                  <Text style={[styles.rank, { color: i < 3 ? colors.primary : colors.textTertiary, fontFamily: fonts.numeral }]}>{num(i + 1)}</Text>
                  <Text numberOfLines={1} style={[styles.boardName, { color: colors.text, fontFamily: isYou ? fonts.semiBold : fonts.medium }]}>
                    {row.username}
                    {isYou ? ` · ${s.you}` : ''}
                  </Text>
                  <Text style={[styles.boardCount, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{num(row.session_count)}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  labelLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.14,
    textTransform: 'uppercase',
  },
  labelArabic: {
    fontSize: 13,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: grid(1.5),
    minHeight: grid(8),
    paddingHorizontal: grid(2),
    borderWidth: 1,
    borderRadius: radius.card,
  },
  badgesLabel: {
    flex: 1,
    fontSize: 15,
  },
  longestNumber: {
    fontSize: 32,
    lineHeight: 40,
  },
  longestNumberArabic: {
    lineHeight: 52,
  },
  shareRow: {
    flexDirection: 'row',
  },
  section: {
    gap: grid(1.5),
    marginTop: grid(1),
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
  chips: {
    flexDirection: 'row',
    gap: grid(1),
  },
  boardLoading: {
    marginVertical: grid(3),
  },
  board: {
    borderWidth: 1,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  boardRow: {
    minHeight: grid(7),
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(2),
    paddingHorizontal: grid(2),
  },
  rank: {
    width: grid(3),
    fontSize: 20,
    textAlign: 'center',
  },
  boardName: {
    flex: 1,
    minWidth: 0,
    fontSize: 15.5,
  },
  boardCount: {
    fontSize: 15,
  },
});
