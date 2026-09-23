import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { RotateCw } from 'lucide-react-native';
import DetailScreen from '@/components/DetailScreen';
import WorldMap, { type CountryCount } from '@/components/community/WorldMap';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { arabicNumber } from '@/lib/arabicNumerals';
import { colors, spacing, radius, typography } from '@/constants/theme';

export default function CommunityMapScreen() {
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.account.community;

  const [counts, setCounts] = useState<CountryCount[] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error: rpcError } = await supabase.rpc('get_country_counts');
    if (rpcError || !data) {
      setError(true);
    } else {
      setCounts(data as CountryCount[]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const totalMembers = counts?.reduce((sum, c) => sum + c.count, 0) ?? 0;
  const totalCountries = counts?.length ?? 0;

  return (
    <DetailScreen title={s.title}>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.subtitle}</Text>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.loading}</Text>
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={[styles.stateText, { color: colors.text, fontFamily: fonts.semiBold }]}>{s.error}</Text>
          <Pressable
            onPress={load}
            style={({ pressed }) => [styles.retryBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.9 }]}
          >
            <RotateCw size={16} color={colors.onPrimary} />
          </Pressable>
        </View>
      ) : (
        <>
          <WorldMap
            counts={counts ?? []}
            language={language}
            isRTL={isRTL}
            fontRegular={fonts.regular}
            fontSemiBold={fonts.semiBold}
            emptyLabel={s.empty}
          />

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.primary, fontFamily: fonts.bold }]}>{num(totalMembers)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.totalLabel}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.primary, fontFamily: fonts.bold }]}>{num(totalCountries)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.countriesLabel}</Text>
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
    lineHeight: typography.lineHeight.body,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  retryBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize.xxl,
    lineHeight: typography.lineHeight.xxl,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.xxs,
  },
});
