import React, { useMemo } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { NATIVE, WAVE_STEPS, useCalmLoop, wave } from '@/hooks/useCalmLoop';

/** One cycle of the twinkling, as the starfield's. */
const TWINKLE_MS = 9000;
/**
 * One screen-width of drift: ~5px a second on a phone, the pace of the
 * starfield's turning sky (a lap every eight minutes) high above its moon.
 */
const DRIFT_MS = 80000;
/** Raised from 72 (Sep 2026: "more stars in the Dusk scene"); each is two views (the strip is doubled). */
const COUNT = 120;

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
 * The Houna dusk's first stars: a scatter through the violet, down past the middle
 * (thinning and fading toward the warm horizon), each twinkling slowly on its own phase of one shared loop, as
 * the starfield's twinkling stars do, and all drifting slowly left to right as
 * the starfield's sky turns. The drift is two copies of one screen-wide strip
 * side by side, so it loops without a seam. A nod to Night next door; held still
 * under Reduce Motion.
 */
export default function FirstStars({ width, height, color, shown }: FirstStarsProps) {
  const twinkle = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: TWINKLE_MS, easing: Easing.linear, useNativeDriver: NATIVE })));
  const drift = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: DRIFT_MS, easing: Easing.linear, useNativeDriver: NATIVE })));

  const stars = useMemo(() => {
    const rand = seeded(23);
    const strip = Array.from({ length: COUNT }, (_, i) => {
      // Mostly fine points, a few brighter ones (about one in twelve) so the sky has depth.
      const bright = rand() < 0.08;
      const r = (bright ? 2.4 + rand() * 0.6 : rand() < 0.8 ? 1 + rand() * 0.8 : 1.8 + rand() * 0.6) / 2;
      const o = bright ? 0.75 + rand() * 0.25 : 0.4 + rand() * 0.4;
      // Down to nearly nine-tenths of the sky, most high up, thinning and fainter toward the warm horizon.
      const depth = Math.pow(rand(), 1.2);
      return {
        x: rand() * width,
        y: height * (0.02 + depth * 0.86),
        r,
        o: o * (1 - 0.45 * depth),
        phase: (i * 0.37) % 1,
      };
    });
    return [...strip, ...strip.map((s) => ({ ...s, x: s.x + width }))];
  }, [width, height]);

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: shown }]}>
      <Animated.View
        style={[
          styles.strip,
          { width: width * 2, height, transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-width, 0] }) }] },
        ]}
      >
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  star: {
    position: 'absolute',
  },
});
