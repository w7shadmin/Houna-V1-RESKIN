import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wind, Sparkles, ArrowRight, ArrowLeft, Stethoscope, Building2, HeartPulse, ChevronRight } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, layout, spacing, radius, typography, shadows } from '@/constants/theme';
import { hexToRgba } from '@/lib/color';
import Logo from '@/components/Logo';
import IconTile3D from '@/components/IconTile3D';
import LanguageSwitcherButton from '@/components/LanguageSwitcherButton';
import HomeMoodCard from '@/components/home/HomeMoodCard';
import ResourcesRail from '@/components/home/ResourcesRail';
import ArticlesRail from '@/components/home/ArticlesRail';
import PodcastsRail from '@/components/home/PodcastsRail';

/**
 * Exact gradient from the old MVP's `.calm-card-gradient` (index.css) — not
 * brand-palette colors, ported as literal hex values per explicit request.
 */
const TANAFAS_GRADIENT: readonly [string, string, ...string[]] = [
  '#ffc6b2',
  '#ffd2c6',
  '#ffded8',
  '#ffe9e2',
  '#fff0e2',
  '#f5deb0',
  '#eedc90',
  '#e2cc78',
];
const TANAFAS_GRADIENT_LOCATIONS: readonly [number, number, ...number[]] = [0, 0.18, 0.35, 0.5, 0.6, 0.72, 0.86, 1];

/** Exact text/icon color from the old MVP's calm card. */
const TANAFAS_TEXT_COLOR = '#7a3340';
/** The old MVP used a slightly different shade for the body copy specifically. */
const TANAFAS_BODY_COLOR = '#8a4050';

interface ResourceRow {
  id: 'professionals' | 'organizations' | 'wellness';
  icon: typeof Stethoscope;
  title: string;
  desc: string;
  color: string;
  href: '/directory/professionals' | '/directory/organizations' | '/directory/wellness-centers';
}

export default function HomeScreen() {
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const hero = t.home.hero;
  const tanafasCard = t.home.tanafasCard;
  const pro = t.home.proResources;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const RESOURCE_ROWS: ResourceRow[] = [
    {
      id: 'professionals',
      icon: Stethoscope,
      title: pro.professionals,
      desc: pro.professionalsDesc,
      color: palette.raspberry,
      href: '/directory/professionals',
    },
    {
      id: 'organizations',
      icon: Building2,
      title: pro.organizations,
      desc: pro.organizationsDesc,
      color: palette.peach,
      href: '/directory/organizations',
    },
    {
      id: 'wellness',
      icon: HeartPulse,
      title: pro.wellness,
      desc: pro.wellnessDesc,
      color: palette.lightCyan,
      href: '/directory/wellness-centers',
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <LanguageSwitcherButton />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.heroOuter}>
          <View style={styles.heroClip}>
            <View style={[styles.heroCircle, styles.heroCircleTop]} />
            <View style={[styles.heroCircle, styles.heroCircleBottom]} />

            <View style={styles.heroContent}>
              <Logo variant="white" size="small" />

              <View style={styles.heroBadge}>
                <Sparkles size={13} color="#ffffff" strokeWidth={2} />
                <Text style={[styles.heroBadgeText, { fontFamily: fonts.semiBold, lineHeight: typography.lineHeight.xs }]}>{hero.badge}</Text>
              </View>

              <Text style={[styles.heroHeadline, { fontFamily: fonts.bold }]}>{hero.headline}</Text>
              <Text style={[styles.heroBody, { fontFamily: fonts.regular }]}>{hero.body}</Text>

              <Pressable
                onPress={() => router.push('/directory')}
                style={({ pressed }) => [styles.heroCta, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.heroCtaText, { fontFamily: fonts.semiBold, lineHeight: typography.lineHeight.sm }]}>{hero.cta}</Text>
                <ArrowIcon size={18} color={palette.turquoiseDark} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Tanafas card */}
          <Pressable
            onPress={() => router.push('/tanafas')}
            style={({ pressed }) => [styles.tanafasOuter, pressed && { opacity: 0.92 }]}
          >
            <LinearGradient
              colors={TANAFAS_GRADIENT}
              locations={TANAFAS_GRADIENT_LOCATIONS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tanafasGradient}
            >
              <View style={[styles.tanafasCircle, styles.tanafasCircleTop]} />
              <View style={[styles.tanafasCircle, styles.tanafasCircleBottom]} />

              <View style={styles.tanafasRow}>
                <View style={styles.tanafasIconTile}>
                  <Wind size={26} color={TANAFAS_TEXT_COLOR} strokeWidth={1.8} />
                </View>
                <View style={styles.tanafasText}>
                  <Text style={[styles.tanafasEyebrow, { fontFamily: fonts.semiBold }]}>{tanafasCard.eyebrow}</Text>
                  <Text style={[styles.tanafasTitle, { fontFamily: fonts.bold }]}>{tanafasCard.title}</Text>
                  <Text style={[styles.tanafasBody, { color: TANAFAS_BODY_COLOR, fontFamily: fonts.regular }]}>{tanafasCard.body}</Text>
                </View>
                <View style={styles.tanafasArrowBtn}>
                  <ArrowIcon size={18} color={TANAFAS_TEXT_COLOR} strokeWidth={2.2} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          {/* Mental Health Directory topics */}
          <ResourcesRail />

          {/* Quick mood check-in */}
          <HomeMoodCard />

          {/* Professional resources */}
          <View style={styles.proSection}>
            <View style={styles.proHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text, fontFamily: fonts.bold }]}>
                {pro.heading}
              </Text>
              <Pressable
                onPress={() => router.push('/directory')}
                style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={[styles.seeAllText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                  {pro.seeAll}
                </Text>
                <ArrowIcon size={14} color={colors.primary} strokeWidth={2.2} />
              </Pressable>
            </View>

            <View style={styles.proList}>
              {RESOURCE_ROWS.map((row) => {
                const Icon = row.icon;
                return (
                  <Pressable
                    key={row.id}
                    onPress={() => router.push(row.href)}
                    style={({ pressed }) => [
                      styles.proRow,
                      { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <IconTile3D icon={Icon} color={row.color} size={44} borderRadius={radius.md} />
                    <View style={styles.proTextWrap}>
                      <Text
                        numberOfLines={1}
                        style={[styles.proTitle, { color: colors.text, fontFamily: fonts.bold }]}
                      >
                        {row.title}
                      </Text>
                      <Text
                        numberOfLines={2}
                        style={[styles.proDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}
                      >
                        {row.desc}
                      </Text>
                    </View>
                    <ChevronRight
                      size={20}
                      color={colors.textTertiary}
                      strokeWidth={1.8}
                      style={isRTL ? styles.flip : undefined}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Latest articles / podcasts */}
          <ArticlesRail />
          <PodcastsRail />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },

  /* Hero */
  heroOuter: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  heroClip: {
    backgroundColor: palette.turquoise,
    borderBottomLeftRadius: radius.xl + 8,
    borderBottomRightRadius: radius.xl + 8,
    overflow: 'hidden',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  heroCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.full,
  },
  heroCircleTop: {
    width: 208,
    height: 208,
    top: -60,
    end: -50,
  },
  heroCircleBottom: {
    width: 224,
    height: 224,
    bottom: -90,
    end: -60,
  },
  heroContent: {
    gap: spacing.sm + 6,
  },
  heroBadge: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: typography.fontSize.xs,
  },
  heroHeadline: {
    color: '#ffffff',
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    letterSpacing: 0.3,
  },
  heroBody: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
  },
  heroCta: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#ffffff',
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  heroCtaText: {
    color: palette.turquoiseDark,
    fontSize: typography.fontSize.sm,
  },

  /* Body */
  body: {
    paddingHorizontal: spacing.lg,
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },

  /* Tanafas card — peach-to-yellow gradient (the old MVP's version used an
     8-stop off-brand gradient and a custom maroon text color; restructured
     here with real brand colors: palette.peach/yellow and turquoiseDark). */
  tanafasOuter: {
    marginTop: spacing.lg,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  tanafasGradient: {
    padding: spacing.md + 4,
    overflow: 'hidden',
  },
  tanafasCircle: {
    position: 'absolute',
    borderRadius: radius.full,
  },
  tanafasCircleTop: {
    width: 128,
    height: 128,
    top: -40,
    end: -30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tanafasCircleBottom: {
    width: 160,
    height: 160,
    bottom: -60,
    end: -50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tanafasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 6,
  },
  tanafasIconTile: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tanafasText: {
    flex: 1,
    gap: 2,
  },
  tanafasEyebrow: {
    color: TANAFAS_TEXT_COLOR,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  tanafasTitle: {
    color: TANAFAS_TEXT_COLOR,
    fontSize: typography.fontSize.lg,
    lineHeight: typography.lineHeight.lg,
  },
  tanafasBody: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.sm,
  },
  tanafasArrowBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: hexToRgba(TANAFAS_TEXT_COLOR, 0.15),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Shared section heading */
  sectionHeading: {
    fontSize: typography.fontSize.md,
  },

  /* Professional resources */
  proSection: {
    marginTop: spacing.xl,
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
  },
  proList: {
    gap: spacing.sm + 4,
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm + 6,
  },
  proTextWrap: {
    flex: 1,
    gap: 2,
  },
  proTitle: {
    fontSize: typography.fontSize.body,
  },
  proDesc: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
