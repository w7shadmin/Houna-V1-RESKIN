import React, { useCallback, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AccountScreen } from '@/components/account/AccountKit';
import BadgeGem from '@/components/badges/BadgeGem';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, grid, layout } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { BADGE_ORDER, nextStreakBadge, type BadgeCode } from '@/lib/badges';
import { getBadgeShares, getMyBadges, getMyStreak } from '@/lib/streaks';
import { formatDayMonth } from '@/lib/journal';
import { NATIVE, useCalmLoop } from '@/hooks/useCalmLoop';
import { useBadgeCheck } from '@/hooks/useBadgeCheck';

const BIG = 104;

/**
 * The badges (canvas "Phase 6 — Badges: skies inside gems"), from Profile's "See all" and Stats'
 * badges row. The ones held float on their pedestals, each its own sky in a lit gem: when it was
 * earned, and how many of Houna hold it (a percentage, never names). Still ahead: the same gems,
 * unlit, with what each asks; the next streak badge says how many days remain.
 */
export default function BadgesScreen() {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const b = t.badges;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const [held, setHeld] = useState<Map<string, string> | null>(null);
  const [shares, setShares] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState(0);

  const load = useCallback(() => {
    getMyBadges().then(setHeld).catch(() => setHeld(new Map()));
    getBadgeShares().then(setShares).catch(() => {});
    getMyStreak()
      .then((s) => setStreak(s.current))
      .catch(() => {});
  }, []);
  useFocusEffect(load);
  useBadgeCheck(load);

  const earned = BADGE_ORDER.filter((c) => held?.has(c));
  const ahead = BADGE_ORDER.filter((c) => !held?.has(c));
  const next = held ? nextStreakBadge(held, streak) : null;
  const heldBy = (c: BadgeCode, short = false) =>
    shares[c] !== undefined ? (short ? b.heldShort : b.held).replace('{n}', num(shares[c])) : '';

  return (
    <AccountScreen eyebrow={b.count.replace('{n}', num(earned.length)).replace('{m}', num(BADGE_ORDER.length))} title={b.title}>
      {held && earned.length === 0 && (
        <Text style={[styles.empty, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{b.empty}</Text>
      )}
      {earned.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.shelf}
          contentContainerStyle={styles.shelfContent}
        >
          {earned.map((c, i) => (
            <View
              key={c}
              style={styles.held}
              accessible
              accessibilityLabel={`${b.names[c]}. ${formatDayMonth(new Date(held!.get(c)!), t.journal.dateNames, num)}. ${heldBy(c)}`}
            >
              <Floating index={i}>
                <BadgeGem code={c} size={BIG} />
              </Floating>
              <View style={[styles.pedestal, { backgroundColor: alpha(colors.text, 0.1), boxShadow: `0 0 14px 6px ${alpha(colors.text, 0.07)}` }]} />
              <Text style={[styles.heldName, { color: colors.text, fontFamily: fonts.semiBold }]}>{b.names[c]}</Text>
              <Text style={[styles.heldNote, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {formatDayMonth(new Date(held!.get(c)!), t.journal.dateNames, num)}
              </Text>
              {!!heldBy(c) && <Text style={[styles.heldNote, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{heldBy(c)}</Text>}
            </View>
          ))}
        </ScrollView>
      )}
      {held && ahead.length > 0 && (
        <View style={styles.ahead}>
          <Text
            style={[
              fonts.labelTracked ? styles.labelLatin : styles.labelArabic,
              { color: colors.textTertiary, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label },
            ]}
          >
            {b.stillAhead}
          </Text>
          {ahead.map((c) => (
            <View key={c} style={styles.aheadRow} accessible accessibilityLabel={b.locked.replace('{name}', b.names[c]).replace('{how}', b.how[c])}>
              <BadgeGem code={c} size={44} locked />
              <View style={styles.aheadText}>
                <Text style={[styles.aheadName, { color: colors.text, fontFamily: fonts.medium }]}>{b.names[c]}</Text>
                <Text style={[styles.aheadHow, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                  {b.how[c]}
                  {next?.code === c ? ` · ${arabicPlural(next.remaining, b.remaining).replace('{n}', num(next.remaining))}` : ''}
                </Text>
              </View>
              {!!heldBy(c, true) && <Text style={[styles.aheadHeld, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{heldBy(c, true)}</Text>}
            </View>
          ))}
        </View>
      )}
    </AccountScreen>
  );
}

/** A gem floating gently on its pedestal, each a little out of step with the next (still under Reduce Motion). */
function Floating({ index, children }: { index: number; children: React.ReactNode }) {
  const loop = useCalmLoop((v) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 2500 + index * 500, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 2500 + index * 500, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    ),
  );
  return <Animated.View style={{ transform: [{ translateY: loop.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 15,
    lineHeight: 22,
  },
  shelf: {
    marginHorizontal: -layout.screenPadding,
  },
  shelfContent: {
    // Room for the gems' light, which the scroll view would otherwise cut straight.
    paddingTop: grid(5),
    paddingBottom: grid(1),
    paddingHorizontal: grid(1),
    gap: grid(0.5),
  },
  held: {
    width: 150,
    alignItems: 'center',
    gap: grid(1),
  },
  pedestal: {
    width: 88,
    height: 12,
    borderRadius: 44,
    marginTop: -2,
    transform: [{ scaleY: 0.6 }],
  },
  heldName: {
    fontSize: 17,
  },
  heldNote: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  ahead: {
    gap: grid(1),
  },
  labelLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
  },
  labelArabic: {
    fontSize: 13,
  },
  aheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
    paddingVertical: grid(1),
  },
  aheadText: {
    flex: 1,
    gap: 2,
  },
  aheadName: {
    fontSize: 15,
  },
  aheadHow: {
    fontSize: 13,
    lineHeight: 18,
  },
  aheadHeld: {
    fontSize: 12,
  },
});
