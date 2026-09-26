import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { MEDITATION_SCENES } from '@/components/meditation/scenes';
import SceneCard from '@/components/meditation/SceneCard';

export default function MeditationSceneListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const list = t.tanafas.meditation.list;
  const sceneStrings = t.tanafas.meditation.scenes;

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

        <View style={styles.grid}>
          {MEDITATION_SCENES.map((scene) => {
            const strings = sceneStrings[scene.id];
            return (
              <SceneCard
                key={scene.id}
                scene={scene}
                title={strings.name}
                description={strings.description}
                fontBold={fonts.bold}
                fontRegular={fonts.regular}
                onPress={() => router.push({ pathname: '/tanafas/meditation/[scene]', params: { scene: scene.id } })}
              />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
