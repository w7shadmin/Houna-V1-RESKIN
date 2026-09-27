import React, { useMemo } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import { NATIVE, useCalmLoop } from '@/hooks/useCalmLoop';

interface YourSkyProps {
  /** The dates practised this month (1-based), in order. */
  dates: number[];
  /** Days in the month. */
  days: number;
  width: number;
  height: number;
  isRTL: boolean;
  /** The whole screen: larger stars, each one tappable. */
  big?: boolean;
  selected?: number;
  onPick?: (date: number) => void;
  /** A star's accessible name, for the tappable ones. */
  starLabel?: (date: number) => string;
}

/** A star's place: across the month by its date, rising through it, a little scattered (the same every time). */
function place(date: number, days: number, w: number, h: number, isRTL: boolean) {
  let seed = date * 7919;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  rnd();
  const t = days > 1 ? (date - 1) / (days - 1) : 0;
  const x = 14 + t * (w - 28);
  const y = h * 0.86 - t * h * 0.66 + Math.sin(date * 1.7) * h * 0.07 + (rnd() - 0.5) * h * 0.1;
  return { x: isRTL ? w - x : x, y: Math.max(8, Math.min(h - 8, y)) };
}

/**
 * Your sky (canvas "Phase 6 — Your sky"): a star for each day practised this month, joined in the
 * order they came, the newest the brightest. Days run across (from the right in Arabic). Each
 * star keeps its place as the month fills. On the whole screen (`big`) each star can be tapped.
 */
export default function YourSky({ dates, days, width, height, isRTL, big = false, selected, onPick, starLabel }: YourSkyProps) {
  const { colors, isNight } = useTheme();
  const pts = useMemo(() => dates.map((d) => ({ date: d, ...place(d, days, width, height, isRTL) })), [dates, days, width, height, isRTL]);
  const pulse = useCalmLoop((v) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    ),
  );
  const newest = pts[pts.length - 1];
  const star = colors.text;
  const glow = colors.tones.glow;
  const r = big ? 3.6 : 2.6;
  const R = big ? 7 : 5;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {pts.length > 1 && (
          <Path
            d={pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke={alpha(glow.fg, 0.45)}
            strokeWidth={1}
          />
        )}
        {pts.slice(0, -1).map((p) => (
          <React.Fragment key={p.date}>
            <Circle cx={p.x} cy={p.y} r={r * 2.2} fill={isNight ? star : glow.hue} opacity={isNight ? 0.12 : 0.18} />
            <Circle cx={p.x} cy={p.y} r={r} fill={p.date === selected ? glow.fg : star} />
          </React.Fragment>
        ))}
      </Svg>
      {newest && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.newest,
            {
              left: newest.x - R,
              top: newest.y - R,
              width: 2 * R,
              height: 2 * R,
              borderRadius: R,
              backgroundColor: glow.fg,
              boxShadow: `0 0 ${R * 2}px ${glow.hue}`,
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }],
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }),
            },
          ]}
        />
      )}
      {newest && selected === newest.date && big && (
        <View pointerEvents="none" style={[styles.ring, { left: newest.x - R - 5, top: newest.y - R - 5, width: 2 * R + 10, height: 2 * R + 10, borderRadius: R + 5, borderColor: glow.fg }]} />
      )}
      {big &&
        onPick &&
        pts.map((p) => (
          <Pressable
            key={p.date}
            onPress={() => onPick(p.date)}
            accessibilityRole="button"
            accessibilityLabel={starLabel?.(p.date)}
            aria-selected={p.date === selected}
            hitSlop={4}
            style={[styles.hit, { left: p.x - 20, top: p.y - 20 }]}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  newest: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  hit: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
