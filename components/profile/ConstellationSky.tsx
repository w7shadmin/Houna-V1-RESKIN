import React, { useMemo } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import { NATIVE, useCalmLoop } from '@/hooks/useCalmLoop';
import { projectStars, starRadius, type Constellation } from '@/lib/constellations';

interface ConstellationSkyProps {
  constellation: Constellation;
  /** How many of its stars are lit (in their order). */
  lit: number;
  width: number;
  height: number;
  /** The whole screen: larger stars, each one tappable. */
  big?: boolean;
  selected?: number;
  onPick?: (index: number) => void;
  /** A star's accessible name, for the tappable ones. */
  starLabel?: (index: number) => string;
  /** Hide the "next star" pulse (a picker's preview). */
  still?: boolean;
}

/** Placed in physical pixels (the sky doesn't mirror in Arabic), so native lays it out left to right. */
const PHYSICAL = Platform.OS === 'web' ? null : ({ direction: 'ltr' } as const);

/**
 * A constellation as Your sky draws it: the real figure traced faintly, its lit stars glowing and
 * the lines between two lit stars drawn in light, the next star to light breathing softly. With
 * every star lit the whole figure glows.
 */
export default function ConstellationSky({ constellation, lit, width, height, big = false, selected, onPick, starLabel, still = false }: ConstellationSkyProps) {
  const { colors, isNight } = useTheme();
  const pts = useMemo(() => projectStars(constellation.stars, width, height, big ? 28 : 16), [constellation, width, height, big]);
  const pulse = useCalmLoop((v) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    ),
  );
  const light = isNight ? colors.text : colors.tones.glow.fg;
  const glow = colors.tones.glow;
  const base = big ? 4.2 : 2.8;
  const n = constellation.stars.length;
  const next = lit < n ? lit : -1;
  const done = lit >= n;

  return (
    <View style={[{ width, height }, PHYSICAL]}>
      <Svg width={width} height={height}>
        {constellation.lines.map(([a, b]) => {
          const on = a < lit && b < lit;
          return (
            <Line
              key={`${a}-${b}`}
              x1={pts[a].x}
              y1={pts[a].y}
              x2={pts[b].x}
              y2={pts[b].y}
              stroke={on ? glow.fg : light}
              strokeOpacity={on ? (done ? 0.85 : 0.6) : 0.16}
              strokeWidth={on ? (big ? 1.6 : 1.2) : 1}
              strokeDasharray={on ? undefined : '3 4'}
            />
          );
        })}
        {constellation.stars.map((st, i) => {
          const r = starRadius(st.mag, base);
          const on = i < lit;
          return (
            <React.Fragment key={i}>
              {on && <Circle cx={pts[i].x} cy={pts[i].y} r={r * 3} fill={isNight ? light : glow.hue} opacity={isNight ? 0.14 : 0.22} />}
              <Circle
                cx={pts[i].x}
                cy={pts[i].y}
                r={on ? r : r * 0.8}
                fill={on ? (i === selected ? glow.fg : light) : 'none'}
                stroke={on ? 'none' : light}
                strokeOpacity={0.35}
                strokeWidth={1}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      {next >= 0 && !still && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.next,
            {
              left: pts[next].x - base * 2,
              top: pts[next].y - base * 2,
              width: base * 4,
              height: base * 4,
              borderRadius: base * 2,
              borderColor: glow.fg,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.9] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.2] }) }],
            },
          ]}
        />
      )}
      {big &&
        selected !== undefined &&
        selected < n && (
          <View
            pointerEvents="none"
            style={[styles.ring, { left: pts[selected].x - 12, top: pts[selected].y - 12, borderColor: glow.fg }]}
          />
        )}
      {big &&
        onPick &&
        pts.map((p, i) => (
          <Pressable
            key={i}
            onPress={() => onPick(i)}
            accessibilityRole="button"
            accessibilityLabel={starLabel?.(i)}
            aria-selected={i === selected}
            hitSlop={4}
            style={[styles.hit, { left: p.x - 20, top: p.y - 20 }]}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  next: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  ring: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  hit: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
