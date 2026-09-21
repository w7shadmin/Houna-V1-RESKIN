import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wind, Square, Footprints, Snowflake, Activity, Clock, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, spacing, radius, typography, shadows } from '@/constants/theme';
import IconTile3D from '@/components/IconTile3D';

interface ExerciseEntry {
  id: string;
  href: Href;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  accent: string;
}

export default function BreathingGroundingListScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const ex = t.tanafas.exercises;
  const list = t.tanafas.breathingList;

  const exercises: ExerciseEntry[] = [
    {
      id: 'anxiety-relief',
      href: '/tanafas/breathing/anxiety-relief',
      title: ex.anxietyRelief.title,
      subtitle: ex.anxietyRelief.subtitle,
      description: ex.anxietyRelief.description,
      duration: ex.anxietyRelief.duration,
      icon: Wind,
      accent: palette.turquoise,
    },
    {
      id: 'steady-mind',
      href: '/tanafas/breathing/steady-mind',
      title: ex.steadyMind.title,
      subtitle: ex.steadyMind.subtitle,
      description: ex.steadyMind.description,
      duration: ex.steadyMind.duration,
      icon: Square,
      accent: '#C9A600', // Yellow (#FFF200) darkened for legibility as an icon-badge fill
    },
    {
      id: 'panic-relief',
      href: '/tanafas/breathing/panic-relief',
      title: ex.panicRelief.title,
      subtitle: ex.panicRelief.subtitle,
      description: ex.panicRelief.description,
      duration: ex.panicRelief.duration,
      icon: Footprints,
      accent: palette.raspberry,
    },
    {
      id: 'nervous-system-reset',
      href: '/tanafas/breathing/nervous-system-reset',
      title: ex.nervousSystemReset.title,
      subtitle: ex.nervousSystemReset.subtitle,
      description: ex.nervousSystemReset.description,
      duration: ex.nervousSystemReset.duration,
      icon: Snowflake,
      accent: palette.lightCyan,
    },
    {
      id: 'tension-release',
      href: '/tanafas/breathing/tension-release',
      title: ex.tensionRelease.title,
      subtitle: ex.tensionRelease.subtitle,
      description: ex.tensionRelease.description,
      duration: ex.tensionRelease.duration,
      icon: Activity,
      accent: palette.peach,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backRow, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.backText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            {t.common.back}
          </Text>
        </Pressable>

        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{list.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
          {list.subtitle}
        </Text>

        <View style={styles.list}>
          {exercises.map((item) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.href)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                  pressed && { backgroundColor: colors.cardPressed },
                ]}
              >
                <IconTile3D icon={Icon} color={item.accent} size={56} iconSize={22} />
                <View style={styles.text}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: item.accent, fontFamily: fonts.semiBold }]}>
                    {item.subtitle}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.cardDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}
                  >
                    {item.description}
                  </Text>
                  <View style={styles.durationRow}>
                    <Clock size={11} color={colors.textTertiary} />
                    <Text style={[styles.duration, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                      {item.duration}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
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
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  backRow: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  backText: {
    fontSize: typography.fontSize.sm,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  text: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.body,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  cardDesc: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.sm,
    marginTop: spacing.xs,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  duration: {
    fontSize: typography.fontSize.xs,
  },
});
