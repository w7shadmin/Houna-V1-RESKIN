import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, grid } from '@/constants/theme';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon from '@/components/ui/CanvasIcon';
import ScreenGlow from '@/components/ui/ScreenGlow';
import MoodBloom, { HOME_BLOOM } from '@/components/mood/MoodBloom';
import type { IconTileTone } from '@/components/ui/IconTile';

/**
 * The frame every Tanafas exercise session shares, from the canvas's
 * "Breathing session" artboard: two soft glows in the exercise's tone, a
 * close button, the exercise name with its technique as a tracked label,
 * then the exercise's own centre and controls.
 */

/** The exercise's accent: its canvas tone's foreground colour (deepened on Day). */
export function useSessionAccent(tone: IconTileTone): string {
  const { colors } = useTheme();
  return colors.tones[tone].fg;
}

interface SessionScaffoldProps {
  title: string;
  technique?: string;
  tone: IconTileTone;
  exitLabel: string;
  onExit: () => void;
  children: React.ReactNode;
  /** Controls row at the bottom. */
  footer: React.ReactNode;
}

export default function SessionScaffold({ title, technique, tone, exitLabel, onExit, children, footer }: SessionScaffoldProps) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const insets = useSafeAreaInsets();
  const accent = colors.tones[tone].fg;
  const labelLatin = fonts.labelTracked;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + grid(2), paddingBottom: insets.bottom + grid(4) }]}>
      <ScreenGlow color={alpha(accent, 0.24)} rx={70} ry={45} cy={44} />
      <ScreenGlow color={alpha(accent, 0.18)} rx={90} ry={40} cy={105} />

      <View style={styles.header}>
        <IconButton
          variant="control"
          accessibilityLabel={exitLabel}
          onPress={onExit}
          renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />}
        />
        <View style={styles.titleWrap}>
          <Text numberOfLines={1} accessibilityRole="header" style={[styles.title, { color: colors.text, fontFamily: fonts.semiBold }]}>
            {title}
          </Text>
          {!!technique && (
            <Text
              numberOfLines={1}
              style={[
                labelLatin ? styles.techniqueLatin : styles.techniqueArabic,
                { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
              ]}
            >
              {technique}
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.centre}>{children}</View>
      <View style={styles.footer}>{footer}</View>
    </View>
  );
}

/** A tracked label in the session's tone ("ROUND 1 OF 12"). */
export function SessionLabel({ children, color }: { children: string; color: string }) {
  const { fonts } = useLanguage();
  const labelLatin = fonts.labelTracked;
  return (
    <Text
      style={[
        labelLatin ? styles.labelLatin : styles.labelArabic,
        { color, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
      ]}
    >
      {children}
    </Text>
  );
}

/** End-of-session message: an opened bloom in the tone, display title, a line in the tone, then the body. */
export function SessionCompletion({ tone, title, subtitle, body }: { tone: IconTileTone; title: string; subtitle?: string; body: string }) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const accent = colors.tones[tone].fg;
  return (
    <View style={styles.completion}>
      <MoodBloom size={grid(12)} color={accent} shape={HOME_BLOOM} ringOpacity={0.6} />
      <Text style={[styles.completionTitle, isRTL && styles.completionTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
        {title}
      </Text>
      {!!subtitle && <Text style={[styles.completionSubtitle, { color: accent, fontFamily: fonts.medium }]}>{subtitle}</Text>}
      <Text style={[styles.completionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: grid(2),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: grid(0.5),
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  techniqueLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
  },
  techniqueArabic: {
    fontSize: 12.5,
  },
  headerSpacer: {
    width: 44,
  },
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: grid(3),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: grid(3),
  },
  labelLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
  },
  labelArabic: {
    fontSize: 13.5,
  },
  completion: {
    alignItems: 'center',
    gap: grid(1.5),
    maxWidth: 340,
  },
  completionTitle: {
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
  },
  completionTitleArabic: {
    lineHeight: 56,
  },
  completionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  completionBody: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
});
