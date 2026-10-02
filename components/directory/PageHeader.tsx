import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid } from '@/constants/theme';
import IconButton from '@/components/ui/IconButton';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';

interface PageHeaderProps {
  title: string;
  intro?: string;
  /** Tracked label above the title; defaults to "Directory". */
  eyebrow?: string;
  /**
   * Defaults to `router.replace('/directory')`: the directory's list pages
   * are always children of the hub (CLAUDE.md, hub-first navigation).
   */
  onBack?: () => void;
}

/**
 * Header for the Directory's subpages, drawn like the hub's: round back
 * button, tracked eyebrow, display-font title and an optional intro line.
 */
export default function PageHeader({ title, intro, eyebrow, onBack }: PageHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL } = useLanguage();
  const labelLatin = fonts.labelTracked;

  return (
    <View style={styles.header}>
      <IconButton
        variant="control"
        accessibilityLabel={t.directory.common.goBack}
        onPress={onBack ?? (() => router.replace('/directory'))}
        renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
      />
      <View style={styles.text}>
        <Text
          style={[
            labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
            { color: colors.primary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
          ]}
        >
          {eyebrow ?? t.directory.search.eyebrow}
        </Text>
        <Text
          accessibilityRole="header"
          style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}
        >
          {title}
        </Text>
        {!!intro && <Text style={[styles.intro, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{intro}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: grid(2),
    alignItems: 'flex-start',
  },
  text: {
    alignSelf: 'stretch',
    gap: grid(1),
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13.5,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  titleArabic: {
    lineHeight: 48,
  },
  intro: {
    fontSize: 15,
    lineHeight: 24,
  },
});
