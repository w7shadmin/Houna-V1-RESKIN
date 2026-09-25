import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to the parent's width instead of hugging the label. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Pill button from the Nightlight/Daylight sheets: 52px tall, fully round.
 * `primary` is the Moonlight (Night) / Ink (Day) fill; `secondary` is the
 * quiet control fill with a hairline border. Both dim via opacity on press
 * — one change, never a second colour on top.
 */
export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  block,
  style,
}: ButtonProps) {
  const { fonts } = useLanguage();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? colors.onAction : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      aria-disabled={!!isDisabled}
      aria-busy={!!loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary
          ? { backgroundColor: colors.action, paddingHorizontal: 24 }
          : {
              backgroundColor: colors.control,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              paddingHorizontal: 24,
            },
        block && styles.block,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: textColor, fontFamily: isPrimary ? fonts.semiBold : fonts.medium },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  block: {
    alignSelf: 'stretch',
  },
  label: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
