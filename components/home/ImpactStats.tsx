import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Stethoscope, BookOpen, FileText, Calendar, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, spacing, radius, typography } from '@/constants/theme';
import { tileTint } from '@/lib/color';
import { arabicNumber } from '@/lib/arabicNumerals';
import { fetchTherapists, fetchResourceDirectory, fetchArticles, fetchEvents } from '@/lib/hounaApi';
import IconTile3D from '@/components/IconTile3D';

interface ImpactCounts {
  professionals: number | null;
  directory: number | null;
  articles: number | null;
  events: number | null;
}

const EMPTY_COUNTS: ImpactCounts = { professionals: null, directory: null, articles: null, events: null };

/** Hard cap so a backend bug in `lastPage` can't trigger unbounded requests. */
const MAX_THERAPIST_PAGES = 50;

/** `fetchTherapists` is paginated with no total-count field — page through everything and sum. Sequential, not parallel: this is a scraper-backed proxy with no known rate-limit tolerance, and `lastPage` is only known after page 1 resolves anyway. */
async function countAllTherapists(language: 'en' | 'ar'): Promise<number> {
  const first = await fetchTherapists(1, {}, language);
  let total = first.therapists.length;
  const lastPage = Math.min(first.lastPage, MAX_THERAPIST_PAGES);
  for (let page = 2; page <= lastPage; page++) {
    total += (await fetchTherapists(page, {}, language)).therapists.length;
  }
  return total;
}

interface StatRow {
  id: keyof ImpactCounts;
  icon: LucideIcon;
  label: string;
  color: string;
  href: '/directory/professionals' | '/directory/resources' | '/directory/articles' | '/events';
}

/**
 * "Our Impact in Numbers" — real counts pulled from the same houna-proxy
 * endpoints every other screen uses, not the hardcoded numbers the old MVP
 * shipped. Refetches whenever Home regains focus (matching HomeMoodCard's
 * useFocusEffect pattern) — nothing in this app does true realtime, so this
 * is the closest "live" precedent already established here.
 */
export default function ImpactStats() {
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.home.impactStats;

  const [counts, setCounts] = useState<ImpactCounts>(EMPTY_COUNTS);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      countAllTherapists(language),
      fetchResourceDirectory(language).then((d) => d.topics.length),
      fetchArticles(language).then((d) => d.articles.length),
      fetchEvents(language).then((d) => d.events.length),
    ]);
    setCounts((prev) => ({
      professionals: results[0].status === 'fulfilled' ? results[0].value : prev.professionals,
      directory: results[1].status === 'fulfilled' ? results[1].value : prev.directory,
      articles: results[2].status === 'fulfilled' ? results[2].value : prev.articles,
      events: results[3].status === 'fulfilled' ? results[3].value : prev.events,
    }));
    setHasLoadedOnce(true);
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const rows: StatRow[] = [
    { id: 'professionals', icon: Stethoscope, label: s.professionals, color: palette.turquoise, href: '/directory/professionals' },
    { id: 'directory', icon: BookOpen, label: s.directory, color: palette.turquoiseDark, href: '/directory/resources' },
    { id: 'articles', icon: FileText, label: s.articles, color: palette.lightCyan, href: '/directory/articles' },
    { id: 'events', icon: Calendar, label: s.events, color: palette.peach, href: '/events' },
  ];

  const num = (n: number | null) => (n === null ? '—' : isRTL ? arabicNumber(n) : String(n));

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.text, fontFamily: fonts.bold }]}>{s.heading}</Text>

      {!hasLoadedOnce ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <View style={styles.grid}>
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <Pressable
                key={row.id}
                onPress={() => router.push(row.href)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {({ pressed }) => (
                  <>
                    <IconTile3D icon={Icon} color={tileTint(row.color, pressed)} size={44} borderRadius={radius.md} style={styles.cardIcon} />
                    <Text style={[styles.cardNumber, { color: colors.text, fontFamily: fonts.bold }]}>
                      {num(counts[row.id])}
                    </Text>
                    <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                      {row.label}
                    </Text>
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  heading: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,
  },
  loading: {
    paddingVertical: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 4,
  },
  card: {
    width: '47%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 4,
  },
  cardIcon: {
    marginBottom: spacing.sm,
  },
  cardNumber: {
    fontSize: typography.fontSize.xxl,
    lineHeight: typography.lineHeight.xxl,
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginTop: 2,
  },
});
