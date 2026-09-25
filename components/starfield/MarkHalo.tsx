import React, { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import HounaMark from '@/components/HounaMark';
import { useStarfield } from '@/contexts/StarfieldContext';
import { WAVE_STEPS, wave } from '@/hooks/useCalmLoop';

/** The whole mark with its ring. */
export const HALO_BOX = 190;
/** The halo round the mark (70px): clear inside its ring, brightest at its outer edge, ~26px of falloff. */
const HALO = 112;
/**
 * The halo's layers: each a few % oval, turning a whole number of laps per
 * turn of the clock (so the loop is seamless), at its own pace and direction.
 */
const HALO_LAYERS = [
  { sx: 1.04, sy: 0.96, from: 0, turns: 1 },
  { sx: 0.96, sy: 1.04, from: 45, turns: -1 },
  { sx: 1.03, sy: 0.97, from: 100, turns: 2 },
];

interface MarkHaloProps {
  accent: string;
  dusk: string;
  glow: string;
  /** The halo's peak opacity at the mark's edge. */
  glowStrength: number;
  /** The dot ring's opacity: it fades with Home's chrome when the starfield opens. Leave out for fully shown. */
  ringOpacity?: Animated.Value | Animated.AnimatedInterpolation<number>;
  /** False drops the ring altogether (the starfield's moon). */
  showRing?: boolean;
}

/**
 * The Houna mark with its 28-dot ring (first half brand accent, second half
 * Dusk, swelling toward the sides): Home's centrepiece and the starfield's
 * moon. Each dot drifts gently up and down and fades out and back in, a
 * little behind its neighbour, so a slow ripple travels round the ring. The
 * whole ring turns slowly and breathes, opening out and drawing back in, with
 * a halo of light breathing outward from the mark's edge; the mark itself
 * stays crisp and still. Every copy runs on the one shared clock (see
 * StarfieldContext), so Home's mark and the starfield's moon match exactly.
 */
export default function MarkHalo({ accent, dusk, glow, glowStrength, ringOpacity, showRing = true }: MarkHaloProps) {
  const N = 28;
  const R = 86;
  const { drift, turn, breath } = useStarfield()!.clock;

  const dots = useMemo(
    () =>
      Array.from({ length: N }, (_, i) => {
        const t = i / N;
        const a = t * Math.PI * 2 - Math.PI / 2;
        const s = 2.5 + 4 * Math.sin(t * Math.PI);
        const o = 0.22 + 0.78 * Math.sin(t * Math.PI);
        const x = R * Math.cos(a);
        const y = R * Math.sin(a);
        return {
          s,
          c: i < N / 2 ? accent : dusk,
          x,
          // Drift: 3px either way, one lap behind the next dot round the ring.
          translateY: drift.interpolate({ inputRange: WAVE_STEPS, outputRange: wave(-t).map((w) => y + 3 * w) }),
          // Fade: down to a fifth of its light and back, twice round the ring per lap.
          opacity: drift.interpolate({ inputRange: WAVE_STEPS, outputRange: wave(-2 * t + 0.25).map((w) => o * (0.6 + 0.4 * w)) }),
        };
      }),
    [accent, dusk, drift],
  );

  const ringScale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const ringTurn = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] });
  const haloOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const layerTurns = useMemo(
    () => HALO_LAYERS.map((l) => turn.interpolate({ inputRange: [0, 1], outputRange: [`${l.from}deg`, `${l.from + l.turns * 360}deg`] })),
    [turn],
  );
  // Where all three overlap their light adds up; each is set so the sum is glowStrength.
  const layerStrength = 1 - Math.pow(1 - glowStrength, 1 / HALO_LAYERS.length);

  return (
    <View style={styles.halo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {showRing && (
        // The ring turns slowly (a lap every two minutes) and breathes, opening out and drawing back.
        <Animated.View style={[styles.ring, { opacity: ringOpacity ?? 1, transform: [{ rotate: ringTurn }, { scale: ringScale }] }]}>
          {dots.map((d, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: d.s,
                  height: d.s,
                  borderRadius: d.s / 2,
                  backgroundColor: d.c,
                  opacity: d.opacity,
                  // Offsets from the centre rather than left/top, so it draws the same in either direction.
                  transform: [{ translateX: d.x }, { translateY: d.translateY }],
                },
              ]}
            />
          ))}
        </Animated.View>
      )}
      {/* A halo, not a disc: clear inside the mark's ring so it stays crisp, the light joined
          to its edge. Three slightly oval layers turn at their own pace, so the outline shifts
          a little round the mark, and all three breathe out and in together. */}
      <Animated.View style={[styles.markGlow, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
        {HALO_LAYERS.map((layer, k) => (
          <Animated.View
            key={k}
            style={[StyleSheet.absoluteFill, { transform: [{ rotate: layerTurns[k] }, { scaleX: layer.sx }, { scaleY: layer.sy }] }]}
          >
            <Svg width={HALO} height={HALO}>
              <Defs>
                <RadialGradient id={`markGlow${k}`} cx="50%" cy="50%" r="50%">
                  {/* The mark's ring runs ~22.5–30px from its centre: the light begins under it (so
                      it's always joined to the edge) and never reaches the inside, round the heart. */}
                  <Stop offset={25.5 / (HALO / 2)} stopColor={glow} stopOpacity={0} />
                  <Stop offset={31 / (HALO / 2)} stopColor={glow} stopOpacity={layerStrength} />
                  <Stop offset="1" stopColor={glow} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={HALO / 2} cy={HALO / 2} r={HALO / 2} fill={`url(#markGlow${k})`} />
            </Svg>
          </Animated.View>
        ))}
      </Animated.View>
      <HounaMark size={70} />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    width: HALO_BOX,
    height: HALO_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
  markGlow: {
    position: 'absolute',
    width: HALO,
    height: HALO,
  },
});
