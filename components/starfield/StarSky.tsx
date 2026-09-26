import React, { useMemo } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { nightPalette } from '@/constants/theme';
import { NATIVE, WAVE_STEPS, useCalmLoop, wave } from '@/hooks/useCalmLoop';

/** One lap of the whole sky round the moon, and one cycle of the twinkling. */
const TURN_MS = 480000;
const TWINKLE_MS = 9000;

/** A fixed seed, so the sky is the same every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

interface Star {
  x: number;
  y: number;
  r: number;
  o: number;
}

/**
 * The starfield's sky: a square wider than the screen's diagonal, centred on
 * the moon, so it can turn slowly round it (a lap every eight minutes)
 * without ever showing a corner. Three depths of static stars (many faint
 * and small far away, fewer brighter ones near) in one SVG, plus a scatter of
 * twinkling stars, each fading on its own phase of one shared loop.
 */
export default function StarSky({ cx, cy, diagonal }: { cx: number; cy: number; diagonal: number }) {
  const D = Math.ceil(diagonal + 80);
  const turn = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: TURN_MS, easing: Easing.linear, useNativeDriver: NATIVE })));
  const twinkle = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: TWINKLE_MS, easing: Easing.linear, useNativeDriver: NATIVE })));

  const { still, twinklers } = useMemo(() => {
    const rand = seeded(11);
    const scatter = (n: number, r: [number, number], o: [number, number]): Star[] =>
      Array.from({ length: n }, () => ({
        x: rand() * D,
        y: rand() * D,
        r: r[0] + rand() * (r[1] - r[0]),
        o: o[0] + rand() * (o[1] - o[0]),
      }));
    // Density scales with the sky's area (tuned for a phone: ~160 still stars on screen).
    const k = (D * D) / (900 * 900);
    return {
      still: [...scatter(Math.round(200 * k), [0.35, 0.75], [0.12, 0.38]), ...scatter(Math.round(80 * k), [0.75, 1.15], [0.3, 0.6]), ...scatter(Math.round(18 * k), [1.15, 1.7], [0.55, 0.85])],
      twinklers: scatter(Math.round(36 * k), [1, 1.6], [0.6, 1]).map((s, i) => ({ ...s, phase: (i * 0.37) % 1 })),
    };
  }, [D]);

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      // Placed by its centre on the moon, in screen coordinates (the handoff from Home is measured
      // in physical pixels), hence left/top rather than start/end.
      style={[styles.sky, { width: D, height: D, left: cx - D / 2, top: cy - D / 2, transform: [{ rotate }] }]}
    >
      <Svg width={D} height={D} style={StyleSheet.absoluteFill}>
        {still.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={nightPalette.moonlight} opacity={s.o} />
        ))}
      </Svg>
      {twinklers.map((s, i) => (
        <Animated.View
          key={i}
          style={[
            styles.twinkler,
            {
              width: s.r * 2,
              height: s.r * 2,
              borderRadius: s.r,
              left: s.x - s.r,
              top: s.y - s.r,
              opacity: twinkle.interpolate({ inputRange: WAVE_STEPS, outputRange: wave(s.phase).map((w) => s.o * (0.3 + 0.7 * (0.5 + 0.5 * w))) }),
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sky: {
    position: 'absolute',
  },
  twinkler: {
    position: 'absolute',
    backgroundColor: nightPalette.moonlight,
    boxShadow: `0 0 4px ${nightPalette.moonlight}`,
  },
});
