import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, spacing, radius, typography } from '@/constants/theme';
import { mix, tileTint } from '@/lib/color';
import LottieTopicIcon from '@/components/directory/LottieTopicIcon';

/**
 * Same lighter→base→darker recipe as GradientTile (including its rest-state
 * lightening and press-state saturation via `tileTint`), without the bevel
 * border/shadow — this is a full-bleed banner strip clipped by the card's
 * own overflow:hidden, not a floating badge.
 */
function railIconGradient(pressed: boolean): readonly [string, string, string] {
  const base = tileTint(palette.turquoise, pressed);
  return [mix(base, palette.white, 0.55), base, mix(base, palette.black, 0.12)];
}

const RAIL_CARD_W = 150;
const RAIL_ICON_AREA_H = 100;

/** Curated topic rail for the Mental Health Directory — full grid lives at /directory/resources. */
export default function ResourcesRail() {
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const s = t.home.resourcesRail;
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.text, fontFamily: fonts.bold }]}>{s.heading}</Text>
        <Pressable
          onPress={() => router.push('/directory/resources')}
          style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.seeAllText, { color: colors.primary, fontFamily: fonts.semiBold }]}>{s.seeAll}</Text>
          <ArrowIcon size={14} color={colors.primary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {s.topics.map((topic) => (
          <Pressable
            key={topic.slug}
            onPress={() => router.push({ pathname: '/directory/resources/[slug]', params: { slug: topic.slug } })}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            {({ pressed }) => (
              <>
                <LinearGradient
                  colors={railIconGradient(pressed)}
                  locations={[0, 0.55, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIconArea}
                >
                  <LottieTopicIcon slug={topic.slug} size={48} />
                </LinearGradient>
                <View style={styles.cardText}>
                  <Text numberOfLines={2} style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                    {topic.label}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.cardDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}
                  >
                    {topic.description}
                  </Text>
                </View>
              </>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: typography.fontSize.md,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
  },
  seeAllText: {
    fontSize: typography.fontSize.sm,
  },
  rail: {
    gap: spacing.sm + 4,
  },
  card: {
    width: RAIL_CARD_W,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardIconArea: {
    width: '100%',
    height: RAIL_ICON_AREA_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    padding: spacing.sm + 2,
    gap: spacing.xxs + 2,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  cardDesc: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
