import React, { useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { NATIVE, useCalmLoop } from '@/hooks/useCalmLoop';
import { stopProps } from '@/lib/svgStop';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'glow';

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
 * quiet control fill with a hairline border. `glow` is the primary fill in a
 * slowly turning ring of the four tones with a soft haze beneath: one per
 * screen, for the step that matters (canvas "Motion — one glowing pill per
 * screen"). All dim via opacity on press — one change, never a second colour on top.
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
  if (variant === 'glow') return <GlowButton label={label} onPress={onPress} disabled={disabled} loading={loading} block={block} style={style} />;
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

/** The glowing pill: the primary fill inside a turning ring of the tones, over a soft haze. */
function GlowButton({ label, onPress, disabled, loading, block, style }: Omit<ButtonProps, 'variant'>) {
  const { fonts } = useLanguage();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const turn = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: NATIVE })));
  const pulse = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: 5000, easing: Easing.linear, useNativeDriver: NATIVE })));
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const hazeOpacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.55, 1, 0.55] });
  const { glow, dusk, dawn, bloom } = colors.tones;
  // The ring is a gradient square turning behind a rounded window a little bigger than the pill.
  const side = Math.hypot(size.w, size.h) + 8;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      aria-disabled={!!isDisabled}
      aria-busy={!!loading}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={({ pressed }) => [styles.base, styles.glowBase, block && styles.block, pressed && !isDisabled && styles.pressed, isDisabled && styles.disabled, style]}
    >
      <Animated.View pointerEvents="none" style={[styles.haze, { opacity: hazeOpacity }]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
          <Defs>
            {[glow, dusk, dawn, bloom].map((tone, i) => (
              <RadialGradient key={i} id={`haze${i}`} cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0" {...stopProps(tone.hue, 0.5)} />
                <Stop offset="1" {...stopProps(tone.hue, 0)} />
              </RadialGradient>
            ))}
          </Defs>
          {[15, 38, 62, 85].map((cx, i) => (
            <Ellipse key={i} cx={cx} cy={22} rx={24} ry={18} fill={`url(#haze${i})`} />
          ))}
        </Svg>
      </Animated.View>
      <View pointerEvents="none" style={styles.ring}>
        {side > 8 && (
          <Animated.View style={{ position: 'absolute', width: side, height: side, left: (size.w + 4 - side) / 2, top: (size.h + 4 - side) / 2, transform: [{ rotate }] }}>
            <LinearGradient colors={[glow.fg, dusk.fg, dawn.fg, bloom.fg, glow.fg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
      </View>
      <View style={[styles.glowFill, { backgroundColor: colors.action }]}>
        {loading ? (
          <ActivityIndicator color={colors.onAction} />
        ) : (
          <Text style={[styles.label, { color: colors.onAction, fontFamily: fonts.semiBold }]}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // At least 52: at the largest text sizes the pill grows rather than clipping its label.
  base: {
    minHeight: 52,
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
  glowBase: {
    height: 56,
  },
  haze: {
    position: 'absolute',
    left: -10,
    right: -10,
    top: 4,
    bottom: -14,
  },
  ring: {
    position: 'absolute',
    left: -2,
    right: -2,
    top: -2,
    bottom: -2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  glowFill: {
    alignSelf: 'stretch',
    flexGrow: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
});
