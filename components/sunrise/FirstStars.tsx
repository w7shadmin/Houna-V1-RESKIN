import React, { useMemo } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { NATIVE, WAVE_STEPS, useCalmLoop, wave } from '@/hooks/useCalmLoop';

/** One cycle of the twinkling, as the starfield's. */
const TWINKLE_MS = 9000;
const COUNT = 26;

/** A fixed seed, so the same stars come out every visit. */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

interface FirstStarsProps {
  width: number;
  height: number;
  color: string;
  /** 0 → 1: the stars coming out (once the evening sun has settled). */
  shown: Animated.Value;
}

/**
 * The Houna dusk's first stars: a faint few, high in the violet (thinning toward
 * the horizon), each twinkling slowly on its own phase of one shared loop, as
 * the starfield's twinkling stars do. A nod to Night next door; held still under
 * Reduce Motion.
 */
export default function FirstStars({ width, height, color, shown }: FirstStarsProps) {
  const twinkle = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: TWINKLE_MS, easing: Easing.linear, useNativeDriver: NATIVE })));

  const stars = useMemo(() => {
    const rand = seeded(23);
    return Array.from({ length: COUNT }, (_, i) => {
      const r = (rand() < 0.8 ? 1 + rand() * 0.8 : 1.8 + rand() * 0.6) / 2;
      const o = 0.3 + rand() * 0.4;
      return {
        x: 12 + rand() * (width - 24),
        // Most high up, fewer lower down.
        y: height * (0.02 + Math.pow(rand(), 1.4) * 0.36),
        r,
        o,
        phase: (i * 0.37) % 1,
      };
    });
  }, [width, height]);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: shown }]}>
      {stars.map((s, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            {
              // Placed in the scene's physical pixels (it lays out left-to-right), hence left/top.
              left: s.x - s.r,
              top: s.y - s.r,
              width: s.r * 2,
              height: s.r * 2,
              borderRadius: s.r,
              backgroundColor: color,
              boxShadow: `0 0 ${(s.r * 4).toFixed(1)}px ${color}`,
              opacity: twinkle.interpolate({ inputRange: WAVE_STEPS, outputRange: wave(s.phase).map((w) => s.o * (0.35 + 0.65 * (0.5 + 0.5 * w))) }),
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
  },
});
