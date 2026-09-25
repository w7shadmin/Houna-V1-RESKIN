import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, typography, radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface DetailScreenProps {
  title: string;
  children: React.ReactNode;
}

/** Shared shell for pushed detail screens: header with a back button + title. */
export default function DetailScreen({ title, children }: DetailScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          accessibilityLabel={t.common.back}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <ArrowLeft
            size={20}
            color={colors.text}
            strokeWidth={2}
            style={isRTL ? styles.flip : undefined}
          />
        </Pressable>
        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: fonts.bold },
          ]}
        >
          {title}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  title: {
    fontSize: typography.fontSize.md,
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
});
