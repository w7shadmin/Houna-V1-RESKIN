import React, { useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

const THUMB = 24;
const TRACK = 4;

interface MoodSliderProps {
  /** Index into the six moods, heavy (0) → light (5). */
  value: number;
  steps: number;
  onChange: (index: number) => void;
  accessibilityLabel: string;
  /** Read-out for the current step, e.g. "Calm / Happy". */
  valueText: string;
  heavierLabel: string;
  lighterLabel: string;
}

/**
 * Snapping mood slider from the check-in artboard: a track filled up to the
 * thumb, six tick dots under it, "Heavier · Lighter" beneath. Heavier sits
 * at the reading start, so it mirrors in Arabic — done with flex order (the
 * filled segment, thumb and remainder are a row), never physical offsets.
 */
export default function MoodSlider({
  value,
  steps,
  onChange,
  accessibilityLabel,
  valueText,
  heavierLabel,
  lighterLabel,
}: MoodSliderProps) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const [width, setWidth] = useState(0);

  // PanResponder callbacks are created once; read live values through refs.
  const live = useRef({ width, isRTL, value, onChange, steps });
  live.current = { width, isRTL, value, onChange, steps };

  const pick = (e: GestureResponderEvent) => {
    const { width: w, isRTL: rtl, value: v, onChange: cb, steps: n } = live.current;
    if (w <= 0) return;
    const x = Math.min(Math.max(e.nativeEvent.locationX - THUMB / 2, 0), w - THUMB);
    let f = x / (w - THUMB);
    if (rtl) f = 1 - f;
    const next = Math.round(f * (n - 1));
    if (next !== v) {
      if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
      cb(next);
    }
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Keep the gesture while dragging instead of yielding it to the sheet's scroll.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: pick,
      onPanResponderMove: pick,
    }),
  ).current;

  const fraction = steps > 1 ? value / (steps - 1) : 0;
  const filled = Math.max(0, width - THUMB) * fraction;

  const labelLatin = fonts.labelTracked;

  return (
    <View style={styles.wrap}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        aria-valuemin={1}
        aria-valuemax={steps}
        aria-valuenow={value + 1}
        aria-valuetext={valueText}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && value < steps - 1) onChange(value + 1);
          if (e.nativeEvent.actionName === 'decrement' && value > 0) onChange(value - 1);
        }}
        style={styles.hit}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...responder.panHandlers}
      >
        {/* Unfilled track behind everything (symmetric, so direction-free). */}
        <View pointerEvents="none" style={[styles.trackBg, { backgroundColor: colors.faint }]} />
        <View pointerEvents="none" style={styles.row}>
          <View style={[styles.fill, { width: filled, backgroundColor: colors.action }]} />
          <View style={[styles.thumb, { backgroundColor: colors.action, borderColor: colors.sheet }]} />
        </View>
      </View>

      <View style={styles.ticks} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length: steps }, (_, i) => (
          <View key={i} style={[styles.tick, { backgroundColor: i === value ? colors.text : colors.faint }]} />
        ))}
      </View>

      <View style={styles.ends} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {[heavierLabel, lighterLabel].map((l) => (
          <Text
            key={l}
            style={[
              labelLatin ? styles.endLatin : styles.endArabic,
              { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
            ]}
          >
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  hit: {
    height: 32,
    justifyContent: 'center',
  },
  trackBg: {
    position: 'absolute',
    top: (32 - TRACK) / 2,
    height: TRACK,
    width: '100%',
    borderRadius: TRACK / 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fill: {
    height: TRACK,
    borderRadius: TRACK / 2,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
  },
  ticks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tick: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  endLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.14,
    textTransform: 'uppercase',
  },
  endArabic: {
    fontSize: 12.5,
  },
});
