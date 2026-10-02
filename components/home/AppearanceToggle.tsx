import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Logo from '@/components/Logo';
import CanvasIcon, { type CanvasIconName } from '@/components/ui/CanvasIcon';
import { APPEARANCE_OPTIONS, useTheme } from '@/contexts/ThemeContext';
import type { ColorScheme } from '@/constants/theme';
import { NATIVE } from '@/hooks/useCalmLoop';

const ICON: Record<ColorScheme, CanvasIconName> = { sunrise: 'sun', day: 'sunset', night: 'moon' };
const SIZE = 18;
const SLOT = 30;
/** How long the strip takes to turn one step. */
export const STRIP_TURN_MS = 400;

/**
 * Where a theme's icon sits when `current` is shown: in the middle; the next
 * theme on the left and the last on the right, so a change moves everything
 * left → right, as the sun and moon do. Physical, not mirrored in Arabic.
 */
const slotOf = (option: ColorScheme, current: ColorScheme) => {
  const n = APPEARANCE_OPTIONS.length;
  const rel = (APPEARANCE_OPTIONS.indexOf(option) - APPEARANCE_OPTIONS.indexOf(current) + n) % n;
  return rel === 0 ? 0 : rel === 1 ? -SLOT : SLOT;
};

interface AppearanceToggleProps {
  /** The theme shown, or being changed to: the strip turns as soon as a change starts. */
  current: ColorScheme;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

/**
 * Home's logo as the appearance toggle (both Home styles, canvas "Home —
 * appearance"): a strip of three icons above it (sun, setting sun, moon), the
 * current one lit in the middle. Each tap turns the strip one step; the icon
 * wrapping round fades in on the left rather than sweeping across.
 */
export default function AppearanceToggle({ current, onPress, accessibilityLabel, disabled }: AppearanceToggleProps) {
  const { colors } = useTheme();
  const turn = useRef(new Animated.Value(1)).current;
  // Where the strip turns from: kept until the turn has finished, whatever re-renders meanwhile.
  const [from, setFrom] = useState(current);

  useEffect(() => {
    if (from === current) return;
    turn.setValue(0);
    Animated.timing(turn, { toValue: 1, duration: STRIP_TURN_MS, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start(() => setFrom(current));
    // Only a new `current` starts a turn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
    >
      <View style={styles.strip} pointerEvents="none">
        {APPEARANCE_OPTIONS.map((option) => {
          const a = slotOf(option, from);
          const b = slotOf(option, current);
          const lit = b === 0;
          const wraps = a > b + SLOT; // from the right end round to the left
          const translateX = wraps || a === b ? b : turn.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
          const scale = turn.interpolate({ inputRange: [0, 1], outputRange: [a === 0 ? 1.25 : 0.9, lit ? 1.25 : 0.9] });
          const opacity = wraps
            ? turn.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] })
            : turn.interpolate({ inputRange: [0, 1], outputRange: [a === 0 ? 1 : 0.55, lit ? 1 : 0.55] });
          return (
            <Animated.View key={option} style={[styles.icon, { opacity, transform: [{ translateX }, { scale }] }]}>
              <CanvasIcon name={ICON[option]} size={SIZE} strokeWidth={1.8} color={lit ? colors.primary : colors.textTertiary} />
            </Animated.View>
          );
        })}
      </View>
      <Logo variant="themed" width={64} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The strip rides up into the top bar's padding, so the bar keeps its height (44) and
  // nothing below moves: "Need to talk now?" must stay clear of the tab bar.
  toggle: {
    alignItems: 'center',
    gap: 4,
    marginTop: -8,
  },
  pressed: {
    opacity: 0.85,
  },
  strip: {
    width: SIZE + 2 * SLOT,
    height: SIZE,
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    top: 0,
    width: SIZE,
    height: SIZE,
  },
});
