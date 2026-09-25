import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Share, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Award, Share2 } from 'lucide-react-native';
import DetailScreen from '@/components/DetailScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { palette, spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
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

  return (
    <DetailScreen title={s.title}>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.subtitle}</Text>

      <View style={[styles.streakCard, { backgroundColor: palette.turquoiseDark }]}>
        <View style={styles.streakMain}>
          <Text style={[styles.streakNumber, { fontFamily: fonts.bold }]}>{streak ? num(streak.current) : '—'}</Text>
          <Text style={[styles.streakLabel, { fontFamily: fonts.semiBold }]}>{s.currentStreak}</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakSecondary}>
          <Text style={[styles.longestNumber, { fontFamily: fonts.semiBold }]}>{streak ? num(streak.longest) : '—'}</Text>
          <Text style={[styles.longestLabel, { fontFamily: fonts.regular }]}>{s.longestStreak}</Text>
        </View>
      </View>

      {!!streak && streak.current === 0 && (
        <Text style={[styles.emptyNote, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.noStreakYet}</Text>
      )}

      {!!streak && streak.current > 0 && (
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [styles.shareBtn, { borderColor: colors.border }, pressed && { backgroundColor: colors.cardPressed }]}
        >
          <Share2 size={16} color={colors.primary} strokeWidth={2} />
          <Text style={[styles.shareBtnText, { color: colors.primary, fontFamily: fonts.semiBold }]}>{s.share}</Text>
        </Pressable>
      )}

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{s.badgesTitle}</Text>
      <View style={styles.badgeGrid}>
        {BADGE_THRESHOLDS.map((days) => {
          const earned = earnedBadges.has(badgeCodeForThreshold(days));
          return (
            <View
              key={days}
              style={[
                styles.badgeCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                earned && shadows.card,
                !earned && styles.badgeCardLocked,
              ]}
            >
              <View style={[styles.badgeIcon, { backgroundColor: earned ? colors.primaryLightest : colors.surface }]}>
                <Award size={20} color={earned ? colors.primary : colors.textTertiary} strokeWidth={1.8} />
              </View>
              <Text
                numberOfLines={2}
                style={[styles.badgeLabel, { color: earned ? colors.text : colors.textTertiary, fontFamily: fonts.semiBold }]}
              >
                {arabicPlural(days, s.badgeName).replace('{n}', num(days))}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{s.leaderboardTitle}</Text>
      <Text style={[styles.leaderboardSubtitle, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
        {s.leaderboardSubtitle}
      </Text>

      <View style={[styles.periodSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {(['week', 'all'] as Period[]).map((p) => {
          const active = p === period;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={[styles.periodOption, active && { backgroundColor: colors.primary }]}
            >
              <Text
                style={[
                  styles.periodOptionText,
                  { color: active ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold },
                ]}
              >
                {p === 'week' ? s.thisWeek : s.allTime}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loadingBoard ? (
        <ActivityIndicator style={styles.boardLoading} color={colors.primary} />
      ) : leaderboard.length === 0 ? (
        <Text style={[styles.emptyNote, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.leaderboardEmpty}</Text>
      ) : (
        <View style={[styles.boardCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card }]}>
          {leaderboard.map((row, i) => {
            const isYou = profile?.username === row.username;
            return (
              <View
                key={row.username}
                style={[
                  styles.boardRow,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderLight },
                  isYou && { backgroundColor: colors.primaryLightest },
                ]}
              >
                <Text style={[styles.boardRank, { color: colors.textTertiary, fontFamily: fonts.semiBold }]}>{num(i + 1)}</Text>
                <Text
                  numberOfLines={1}
                  style={[styles.boardUsername, { color: colors.text, fontFamily: fonts.semiBold }]}
                >
                  {row.username}
                  {isYou ? ` (${s.you})` : ''}
                </Text>
                <Text style={[styles.boardCount, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                  {num(row.session_count)}
                </Text>
              </View>
            );
          })}
        </View>
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
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  streakMain: {
    flex: 1.2,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 44,
    color: palette.white,
    lineHeight: 50,
  },
  streakLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xxs,
  },
  streakDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  streakSecondary: {
    flex: 1,
    alignItems: 'center',
  },
  longestNumber: {
    fontSize: typography.fontSize.xxl,
    color: palette.white,
  },
  longestLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  emptyNote: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  shareBtnText: {
    fontSize: typography.fontSize.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  badgeCard: {
    width: '31%',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm,
  },
  badgeCardLocked: {
    opacity: 0.55,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  badgeLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
  },
  leaderboardSubtitle: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  periodSwitcher: {
    flexDirection: 'row',
    borderRadius: radius.full,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.md,
  },
  periodOption: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  periodOptionText: {
    fontSize: typography.fontSize.sm,
  },
  boardLoading: {
    paddingVertical: spacing.lg,
  },
  boardCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  boardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  boardRank: {
    width: 22,
    fontSize: typography.fontSize.sm,
  },
  boardUsername: {
    flex: 1,
    fontSize: typography.fontSize.body,
  },
  boardCount: {
    fontSize: typography.fontSize.sm,
  },
});
