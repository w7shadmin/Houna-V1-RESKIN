import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { radius, shadows } from '@/constants/theme';

type IconButtonVariant = 'primary' | 'control' | 'subtle';

interface IconButtonProps {
  /** Receives the colour the icon should draw in. */
  renderIcon: (color: string) => React.ReactNode;
  onPress: () => void;
  /** Required — an icon-only control has no other accessible name. */
  accessibilityLabel: string;
  /**
   * `primary` — Moonlight/Ink fill with the brand glow (play/pause).
   * `control` — the player controls' fill and border (close, restart, sound).
   * `subtle` — the Home top-bar treatment (mood check-in, profile).
   */
  variant?: IconButtonVariant;
  /** Diameter. Canvas uses 44 (top bar, close), 56 (secondary player controls), 80 (play). */
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Round icon-only button from the Nightlight/Daylight sheets. */
export default function IconButton({
  renderIcon,
  onPress,
  accessibilityLabel,
  variant = 'control',
  size = 44,
  disabled,
  style,
}: IconButtonProps) {
  const { colors } = useTheme();

  const fill =
    variant === 'primary'
      ? { backgroundColor: colors.action, ...shadows.glow }
      : variant === 'control'
        ? { backgroundColor: colors.controlStrong, borderWidth: 1, borderColor: colors.borderControlStrong }
        : { backgroundColor: colors.control, borderWidth: 1, borderColor: colors.borderControl };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={size < 44 ? (44 - size) / 2 : undefined}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        fill,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {renderIcon(variant === 'primary' ? colors.onAction : colors.text)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
