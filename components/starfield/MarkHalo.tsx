import React, { useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import HounaMark from '@/components/HounaMark';
import { NATIVE, WAVE_STEPS, useCalmLoop, wave } from '@/hooks/useCalmLoop';

/** One lap of the dots' drift, one breath of the ring (open + close), one slow turn of the ring. */
const DRIFT_MS = 8000;
export const BREATH_MS = 5000;
const TURN_MS = 120000;
/** The whole mark with its ring. */
export const HALO_BOX = 190;
/** The halo round the mark (70px): clear inside its ring, brightest at its outer edge, ~26px of falloff. */
const HALO = 112;
/**
 * The halo's layers: each a few % oval, turning a whole number of laps per
 * TURN_MS (so the loop is seamless), at its own pace and direction.
 */
const HALO_LAYERS = [
  { sx: 1.04, sy: 0.96, from: 0, turns: 1 },
  { sx: 0.96, sy: 1.04, from: 45, turns: -1 },
  { sx: 1.03, sy: 0.97, from: 100, turns: 2 },
];

/** How the mark and its halo are lit. */
export interface MarkLight {
  /** The mark's fill; defaults to the theme's logo colour. */
  mark?: string;
  glow: string;
  /** The halo's peak opacity at the mark's edge. */
  glowStrength: number;
}

interface MarkHaloProps {
  accent: string;
  dusk: string;
  light: MarkLight;
  /** A second lighting (the starfield's silver moon), crossfaded in as `mix` goes 0 → 1. */
  alt?: { light: MarkLight; mix: Animated.Value | Animated.AnimatedInterpolation<number> };
}

/**
 * The Houna mark with its 28-dot ring (first half brand accent, second half
 * Dusk, swelling toward the sides): Home's centrepiece and the starfield's
 * moon. Each dot drifts gently up and down and fades out and back in, a
 * little behind its neighbour, so a slow ripple travels round the ring. The
 * whole ring turns slowly and breathes, opening out and drawing back in, with
 * a halo of light breathing outward from the mark's edge; the mark itself
 * stays crisp and still.
 */
export default function MarkHalo({ accent, dusk, light, alt }: MarkHaloProps) {
  const N = 28;
  const R = 86;
  const drift = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: DRIFT_MS, easing: Easing.linear, useNativeDriver: NATIVE })));
  const turn = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: TURN_MS, easing: Easing.linear, useNativeDriver: NATIVE })));
  const breath = useCalmLoop((v) =>
    Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(v, { toValue: 0, duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ]),
    ),
  );

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
  const baseOpacity = alt ? alt.mix.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) : 1;

  const lit = (l: MarkLight, id: string, opacity: typeof baseOpacity) => (
    <Animated.View key={id} style={[styles.lit, { opacity }]} pointerEvents="none">
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
                <RadialGradient id={`markGlow${id}${k}`} cx="50%" cy="50%" r="50%">
                  {/* The mark's ring runs ~22.5–30px from its centre: the light begins under it (so
                      it's always joined to the edge) and never reaches the inside, round the heart. */}
                  <Stop offset={25.5 / (HALO / 2)} stopColor={l.glow} stopOpacity={0} />
                  {/* Where all three overlap their light adds up; each is set so the sum is glowStrength. */}
                  <Stop offset={31 / (HALO / 2)} stopColor={l.glow} stopOpacity={1 - Math.pow(1 - l.glowStrength, 1 / HALO_LAYERS.length)} />
                  <Stop offset="1" stopColor={l.glow} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={HALO / 2} cy={HALO / 2} r={HALO / 2} fill={`url(#markGlow${id}${k})`} />
            </Svg>
          </Animated.View>
        ))}
      </Animated.View>
      <HounaMark size={70} color={l.mark} />
    </Animated.View>
  );

  return (
    <View style={styles.halo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* The ring turns slowly (a lap every two minutes) and breathes, opening out and drawing back. */}
      <Animated.View style={[styles.ring, { transform: [{ rotate: ringTurn }, { scale: ringScale }] }]}>
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
      {lit(light, 'a', baseOpacity)}
      {alt && lit(alt.light, 'b', alt.mix)}
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
  lit: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGlow: {
    position: 'absolute',
    width: HALO,
    height: HALO,
  },
});
