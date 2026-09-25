import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ExerciseHeaderProps {
  title: string;
  subtitle?: string;
  exitLabel: string;
  onExit: () => void;
  accentColor: string;
}

/** Shared header for every Tanafas exercise screen: back arrow + title + text exit, matching the old MVP's pattern of two exits that do the same thing. */
export default function ExerciseHeader({
  title,
  subtitle,
  exitLabel,
  onExit,
  accentColor,
}: ExerciseHeaderProps) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  // None of this header's callers wrap themselves in a SafeAreaView (they're
  // plain flex:1 Views), so without this the header sits directly under the
  // status bar / notch on a real device.
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
      <Pressable
        onPress={onExit}
        hitSlop={12}
        accessibilityLabel={exitLabel}
        style={({ pressed }) => [
          styles.iconBtn,
          { backgroundColor: colors.card },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={isRTL ? styles.flip : undefined}>
<ArrowLeft
          size={20}
          color={colors.textSecondary}
          strokeWidth={2} />
</View>
      </Pressable>

      <View style={styles.titleWrap}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[styles.subtitle, { color: colors.textTertiary, fontFamily: fonts.regular }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onExit}
        hitSlop={12}
        style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.6 }]}
      >
        <Text style={[styles.exitText, { color: accentColor, fontFamily: fonts.semiBold }]}>
          {exitLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  exitBtn: {
    minWidth: 36,
    alignItems: 'flex-end',
  },
  exitText: {
    fontSize: typography.fontSize.sm,
  },
});
