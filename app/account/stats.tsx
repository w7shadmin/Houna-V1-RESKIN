import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, Share, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Award } from 'lucide-react-native';
import { AccountScreen, FormMessage } from '@/components/account/AccountKit';
import { GroupLabel } from '@/components/directory/ProfileKit';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import IconTile from '@/components/ui/IconTile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import {
  getMyStreak,
  checkAndAwardBadges,
  getMyEarnedBadgeCodes,
  getLeaderboard,
  BADGE_THRESHOLDS,
  badgeCodeForThreshold,
  type StreakInfo,
  type LeaderboardRow,
} from '@/lib/streaks';

type Period = 'week' | 'all';

export default function StatsScreen() {
  const { colors } = useTheme();
  const { t, isRTL, fonts } = useLanguage();
  const { session, profile } = useAuth();
  const s = t.account.stats;

  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<Period>('week');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const daysText = (n: number) => arabicPlural(n, s.days).replace('{n}', num(n));

  const loadStreak = useCallback(async () => {
    if (!session) return;
    const info = await getMyStreak();
    setStreak(info);
    await checkAndAwardBadges(session.user.id, info.current);
    setEarnedBadges(await getMyEarnedBadgeCodes());
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadStreak();
    }, [loadStreak]),
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
      <View style={[styles.streakCard, { backgroundColor: colors.tones.glow.bg, borderColor: colors.tones.glow.border }]}>
        <View style={styles.streakMain}>
          <Text style={label}>{s.currentStreak}</Text>
          <Text style={[styles.streakNumber, isRTL && styles.streakNumberArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {streak ? num(streak.current) : '—'}
          </Text>
          {!!streak && <Text style={[styles.streakDays, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{daysText(streak.current)}</Text>}
        </View>
        <View style={[styles.streakDivider, { backgroundColor: colors.tones.glow.border }]} />
        <View style={styles.streakSide}>
          <Text style={label}>{s.longestStreak}</Text>
          <Text style={[styles.longestNumber, isRTL && styles.longestNumberArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {streak ? num(streak.longest) : '—'}
          </Text>
        </View>
      </View>

      {!!streak && streak.current === 0 && <FormMessage message={s.noStreakYet} tone="muted" />}
      {!!streak && streak.current > 0 && (
        <View style={styles.shareRow}>
          <Button variant="secondary" label={s.share} onPress={handleShare} />
        </View>
      )}

      <View style={styles.section}>
        <GroupLabel>{s.badgesTitle}</GroupLabel>
        <View style={styles.badges}>
          {BADGE_THRESHOLDS.map((days) => {
            const earned = earnedBadges.has(badgeCodeForThreshold(days));
            return (
              <View key={days} style={[styles.badge, !earned && styles.badgeLocked]}>
                <IconTile
                  size={46}
                  tone={earned ? 'glow' : 'dusk'}
                  renderIcon={(c, size) => <Award size={size} color={earned ? c : colors.textTertiary} strokeWidth={1.6} />}
                />
                <Text numberOfLines={1} style={[styles.badgeLabel, { color: earned ? colors.text : colors.textTertiary, fontFamily: fonts.medium }]}>
                  {arabicPlural(days, s.badgeName).replace('{n}', num(days))}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

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
                  <Text style={[styles.rank, { color: i < 3 ? colors.primary : colors.textTertiary, fontFamily: fonts.display }]}>{num(i + 1)}</Text>
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
  streakCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderRadius: radius.cardLg,
    padding: grid(3),
    gap: grid(3),
  },
  streakMain: {
    flex: 1,
    gap: grid(0.5),
  },
  streakNumber: {
    fontSize: 64,
    lineHeight: 72,
  },
  streakNumberArabic: {
    lineHeight: 96,
  },
  streakDays: {
    fontSize: 15,
  },
  streakDivider: {
    width: 1,
  },
  streakSide: {
    minWidth: grid(9),
    gap: grid(0.5),
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
  badges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    alignItems: 'center',
    gap: grid(1),
  },
  badgeLocked: {
    opacity: 0.55,
  },
  badgeLabel: {
    fontSize: 12.5,
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
