import React, { useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { stopProps } from '@/lib/svgStop';

const GLOW_W = 130;
/** Native only: the web never swaps offsets in RTL and rejects the style. */
const LTR = Platform.OS === 'web' ? null : ({ direction: 'ltr' } as const);
const GLOW_H = 68;

interface GlowTabsProps<K extends string> {
  items: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  accessibilityLabel: string;
}

/**
 * Tabs with a soft glow under the selected one that slides, overshooting a touch and
 * settling, when another is chosen (canvas "Motion — the Tanafas tabs", the glow style).
 * The glow is the theme's glow hue; the labels stay plain text. Reduce Motion moves it
 * without the slide.
 */
export default function GlowTabs<K extends string>({ items, value, onChange, accessibilityLabel }: GlowTabsProps<K>) {
  const { colors, isNight } = useTheme();
  const { fonts } = useLanguage();
  const reduceMotion = useReduceMotion();
  // Each tab's centre along the row, in physical pixels from the row's left edge.
  const [centres, setCentres] = useState<Partial<Record<K, number>>>({});
  const x = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);

  const target = centres[value];
  useEffect(() => {
    if (target === undefined) return;
    const to = target - GLOW_W / 2;
    if (!placed.current || reduceMotion) {
      placed.current = true;
      x.setValue(to);
      return;
    }
    Animated.spring(x, { toValue: to, friction: 7, tension: 70, useNativeDriver: NATIVE }).start();
  }, [target, reduceMotion, x]);

  const onTabLayout = (key: K) => (e: LayoutChangeEvent) => {
    const { x: left, width } = e.nativeEvent.layout;
    setCentres((c) => (c[key] === left + width / 2 ? c : { ...c, [key]: left + width / 2 }));
  };

  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.row}>
      {/* The glow layer is placed by measured, physical offsets, so it doesn't mirror in Arabic (native only; web never swaps). */}
      <View pointerEvents="none" style={[styles.glowLayer, LTR]}>
        <Animated.View style={[styles.glow, { opacity: target === undefined ? 0 : 1, transform: [{ translateX: x }] }]}>
          <Svg width={GLOW_W} height={GLOW_H}>
            <Defs>
              <RadialGradient id="tabGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset="0" {...stopProps(colors.tones.glow.hue, isNight ? 0.34 : 0.3)} />
                <Stop offset="1" {...stopProps(colors.tones.glow.hue, 0)} />
              </RadialGradient>
            </Defs>
            <Ellipse cx={GLOW_W / 2} cy={GLOW_H / 2} rx={GLOW_W / 2} ry={GLOW_H / 2} fill="url(#tabGlow)" />
          </Svg>
        </Animated.View>
      </View>
      {items.map(({ key, label }) => {
        const selected = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            aria-selected={selected}
            onPress={() => onChange(key)}
            onLayout={onTabLayout(key)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <Text style={[styles.label, { color: selected ? colors.text : colors.textTertiary, fontFamily: fonts.semiBold }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    left: 0,
    top: (44 - GLOW_H) / 2,
    width: GLOW_W,
    height: GLOW_H,
  },
  tab: {
    height: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
