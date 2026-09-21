import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wind, Moon, BookOpen, CheckCircle2, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, spacing, radius, typography, shadows } from '@/constants/theme';
import { mix } from '@/lib/color';
import IconTile3D from '@/components/IconTile3D';

interface HubCard {
  id: 'breathing' | 'meditation' | 'journal';
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  available: boolean;
}

export default function TanafasHubScreen() {
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const hub = t.tanafas.hub;
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  const cards: HubCard[] = [
    {
      id: 'breathing',
      title: hub.breathingTitle,
      subtitle: hub.breathingSubtitle,
      description: hub.breathingDescription,
      icon: Wind,
      color: palette.lightCyan,
      available: true,
    },
    {
      id: 'meditation',
      title: hub.meditationTitle,
      subtitle: hub.meditationSubtitle,
      description: hub.meditationDescription,
      icon: Moon,
      color: palette.peach,
      available: true,
    },
    {
      id: 'journal',
      title: hub.journalTitle,
      subtitle: hub.journalSubtitle,
      description: hub.journalDescription,
      icon: BookOpen,
      color: palette.raspberry,
      available: true,
    },
  ];

  const handlePress = (card: HubCard) => {
    if (!card.available) {
      setComingSoon(card.title);
      return;
    }
    if (card.id === 'breathing') {
      router.push('/tanafas/breathing');
    } else if (card.id === 'meditation') {
      router.push('/tanafas/meditation');
    } else if (card.id === 'journal') {
      router.push('/tanafas/journal');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
                key={card.id}
                onPress={() => handlePress(card)}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                  pressed && { backgroundColor: colors.cardPressed },
                ]}
              >
                <IconTile3D icon={Icon} color={card.color} size={52} />
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                    {card.subtitle}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[styles.cardDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}
                  >
                    {card.description}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} strokeWidth={1.8} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={comingSoon !== null} transparent animationType="fade" onRequestClose={() => setComingSoon(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setComingSoon(null)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalIcon, { backgroundColor: colors.primaryLightest }]}>
              <CheckCircle2 size={32} color={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.bold }]}>
              {hub.comingSoonTitle}
            </Text>
            <Text style={[styles.modalBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {comingSoon ? hub.comingSoonBody(comingSoon) : ''}
            </Text>
            <Pressable
              onPress={() => setComingSoon(null)}
              style={({ pressed }) => [
                styles.modalBtn,
                { backgroundColor: colors.primary },
                pressed && { backgroundColor: mix(colors.primary, palette.black, 0.15) },
              ]}
            >
              <Text style={[styles.modalBtnText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>
                {hub.gotIt}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginTop: spacing.md,
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
  cardText: {
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
  },
  modalBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  modalBtn: {
    width: '100%',
    height: 42,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  modalBtnText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
