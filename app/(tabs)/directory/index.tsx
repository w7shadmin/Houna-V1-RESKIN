import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Building2, HeartPulse, Newspaper, Headphones, BookOpen, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, spacing, radius, typography, shadows } from '@/constants/theme';
import { OLD_MVP_ICON_HEX, OLD_MVP_ICON_HEX_PALE } from '@/lib/color';
import FlatIconTile from '@/components/ui/FlatIconTile';

interface HubCard {
  href:
    | '/directory/professionals'
    | '/directory/organizations'
    | '/directory/wellness-centers'
    | '/directory/articles'
    | '/directory/podcasts'
    | '/directory/resources';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default function DirectoryHubScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const hub = t.directory.hub;

  const cards: HubCard[] = [
    {
      href: '/directory/professionals',
      title: hub.professionalsTitle,
      subtitle: hub.professionalsSubtitle,
      icon: Users,
      color: palette.turquoise,
      bg: OLD_MVP_ICON_HEX_PALE.primary,
    },
    {
      href: '/directory/organizations',
      title: hub.organizationsTitle,
      subtitle: hub.organizationsSubtitle,
      icon: Building2,
      color: OLD_MVP_ICON_HEX.gold,
      bg: OLD_MVP_ICON_HEX_PALE.gold,
    },
    {
      href: '/directory/wellness-centers',
      title: hub.wellnessTitle,
      subtitle: hub.wellnessSubtitle,
      icon: HeartPulse,
      color: OLD_MVP_ICON_HEX.peach,
      bg: OLD_MVP_ICON_HEX_PALE.peach,
    },
    {
      href: '/directory/articles',
      title: hub.articlesTitle,
      subtitle: hub.articlesSubtitle,
      icon: Newspaper,
      color: OLD_MVP_ICON_HEX.lightCyan,
      bg: OLD_MVP_ICON_HEX_PALE.lightCyan,
    },
    {
      href: '/directory/podcasts',
      title: hub.podcastsTitle,
      subtitle: hub.podcastsSubtitle,
      icon: Headphones,
      color: OLD_MVP_ICON_HEX.raspberry,
      bg: OLD_MVP_ICON_HEX_PALE.raspberry,
    },
    {
      href: '/directory/resources',
      title: hub.resourcesTitle,
      subtitle: hub.resourcesSubtitle,
      icon: BookOpen,
      color: OLD_MVP_ICON_HEX.tealDark,
      bg: OLD_MVP_ICON_HEX_PALE.tealDark,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{hub.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
          {hub.subtitle}
        </Text>

        <View style={styles.cards}>
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Pressable
                key={card.href}
                onPress={() => router.push(card.href)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                  pressed && styles.pressed,
                ]}
              >
                <FlatIconTile icon={Icon} color={card.color} bg={card.bg} size={56} iconSize={26} />
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                    {card.subtitle}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={1.8} />
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
  title: {
    fontSize: typography.fontSize.xxl,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  cards: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.body,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
    lineHeight: typography.lineHeight.xs,
  },
});
