import React, { useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, FeGaussianBlur, Filter, G, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';
import PressedMark from '@/components/ui/PressedMark';
import Orb from '@/components/ui/Orb';
import { HALO_BOX } from '@/components/starfield/MarkHalo';
import EdgeHalo from '@/components/starfield/EdgeHalo';
import { useStarfield } from '@/contexts/StarfieldContext';
import { alpha, type SunScene } from '@/constants/theme';
import { stopProps } from '@/lib/svgStop';
import { star8Points } from '@/lib/khatam';
import { NATIVE, useCalmLoop } from '@/hooks/useCalmLoop';

/** The disc (the canvas's 132px in the mark's 190px box) and the mark held in it. */
const DISC = 132;
const MARK = 70;
/** The halo joined to the disc's edge, and the short rays: both breathe. */
const HALO = 240;
const RAYS = 380;
const RAY_COUNT = 24;
/** Rays run from under the disc to about 55px past its edge, fading out as they go. */
const RAY_INNER = 36;
const RAY_OUTER = 121;
/** The wide, faint sunglow in the sky behind. */
const GLOW = 420;

/** Where the halo's layers overlap, their light adds up to this at the disc's edge. */
const HALO_STRENGTH = 0.6;

/**
 * The star lattice (canvas "Phase 3 — Sunrise: the star-lattice sun"): four eight-point stars,
 * radii in disc radii, in two pairs turning opposite ways, a lap in 90s and 120s.
 */
const LATTICE_STARS = [
  { r: 3.08, rot: 0, width: 1, deep: true, opacity: 0.35, pair: 0 },
  { r: 2.46, rot: 22.5, width: 1, deep: false, opacity: 0.5, pair: 0 },
  { r: 3.77, rot: 11.25, width: 0.8, deep: true, opacity: 0.2, pair: 1 },
  { r: 1.92, rot: 0, width: 1.2, deep: false, opacity: 0.6, pair: 1 },
];
const LATTICE = Math.ceil(3.77 * DISC) + 8;
/** One loop of six minutes: four laps one way (90s), three the other (120s). */
const LATTICE_LOOP_MS = 360_000;
/** On Home the lattice draws in closer round the sun, clear of the logo and the date. */
export const HOME_LATTICE = 0.64;

interface SunDiscProps {
  /** 0 → 1: from nothing to the full sun (the disc, its halo, rays and glow). */
  form: Animated.Value | Animated.AnimatedInterpolation<number>;
  /** Its colours, and whether it has rays (Sunrise's does; Dusk's evening sun is a glow). */
  scene: SunScene;
  /** How far out the star lattice reaches (1 in the scene; `HOME_LATTICE` on Home). */
  latticeScale?: number;
}

/**
 * The sun Home's mark becomes in the Houna sunrise (a pale-gold disc) and the Houna
 * dusk (an amber one), with the mark pressed into it as the breathing orbs press it:
 * one solid object, still and crisp. Around it, breathing the way
 * the starfield's moon does, on the same shared clock (StarfieldContext): a halo
 * joined to the disc's edge, in three slightly oval layers turning at their own
 * pace, and (Sunrise) short rays turning slowly, which swell out on the in-breath and mostly
 * fade on the out-breath; behind, a wide, faint sunglow breathing with them.
 * Drawn in the mark's own 190px box, so it can take the mark's place exactly.
 */
export default function SunDisc({ form, scene, latticeScale = 1 }: SunDiscProps) {
  const { breath, turn } = useStarfield()!.clock;

  // The moon's breath: most of the light ebbs away on the out-breath.
  const haloOpacity = Animated.multiply(form, breath.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }));
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] });
  const glowOpacity = Animated.multiply(form, breath.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }));
  const glowScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });
  const rayTurn = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const rays = useMemo(() => {
    const c = RAYS / 2;
    const half = (1.5 * Math.PI) / 180;
    const at = (r: number, a: number) => `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
    return Array.from({ length: RAY_COUNT }, (_, k) => {
      const a = (k / RAY_COUNT) * Math.PI * 2;
      return `M${at(RAY_INNER, a - half)}L${at(RAY_OUTER, a - half)}L${at(RAY_OUTER, a + half)}L${at(RAY_INNER, a + half)}Z`;
    });
  }, []);

  return (
    <View style={styles.box} pointerEvents="none">
      <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}>
        <Svg width={GLOW} height={GLOW}>
          <Defs>
            <RadialGradient id="sunglow" cx="50%" cy="50%" r="50%">
              <Stop offset="0.2" {...stopProps(alpha(scene.glow, 0.28))} />
              <Stop offset="1" {...stopProps(alpha(scene.glow, 0))} />
            </RadialGradient>
          </Defs>
          <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill="url(#sunglow)" />
        </Svg>
      </Animated.View>

      {scene.lattice && <Lattice colors={scene.lattice} form={form} scale={latticeScale} />}

      <Animated.View style={[styles.breathing, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
        {scene.rays && !scene.lattice && (
        <Animated.View style={[styles.rays, { transform: [{ rotate: rayTurn }] }]}>
          <Svg width={RAYS} height={RAYS}>
            <Defs>
              <RadialGradient id="sunrays" gradientUnits="userSpaceOnUse" cx={RAYS / 2} cy={RAYS / 2} r={RAY_OUTER} fx={RAYS / 2} fy={RAYS / 2}>
                <Stop offset={RAY_INNER / RAY_OUTER} {...stopProps(alpha(scene.rays ?? scene.glow, 0.45))} />
                <Stop offset="1" {...stopProps(alpha(scene.rays ?? scene.glow, 0))} />
              </RadialGradient>
            </Defs>
            {rays.map((d, k) => (
              <Path key={k} d={d} fill="url(#sunrays)" />
            ))}
          </Svg>
        </Animated.View>
        )}
        <EdgeHalo size={HALO} edge={DISC / 2} color={scene.halo} strength={HALO_STRENGTH} />
      </Animated.View>

      {/* The disc and the mark: still, only fading in as the sun forms. */}
      <Animated.View style={[styles.disc, { opacity: form }]}>
        <Orb size={DISC} stops={scene.disc} fx={0.5} fy={0.45} glow={`0 0 14px ${alpha(scene.glow, 0.45)}`} />
        <View style={styles.mark}>
          <PressedMark size={MARK} surface={scene.surface} />
        </View>
      </Animated.View>
    </View>
  );
}

/**
 * Sunrise's rays, woven: the stars turning slowly, drawn as lines of light (Design studies "A2"): each
 * a soft blurred glow in the pale core colour with a faint crisp line under it, so they read as the
 * sun's light catching rather than a drawing, swelling a touch and brightening with the breath.
 */
function Lattice({ colors, form, scale }: { colors: { deep: string; light: string; core: string }; form: SunDiscProps['form']; scale: number }) {
  const { breath } = useStarfield()!.clock;
  const lap = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: LATTICE_LOOP_MS, easing: Easing.linear, useNativeDriver: NATIVE })));
  const turns = [lap.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1440deg'] }), lap.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-1080deg'] })];
  const opacity = Animated.multiply(form, breath.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }));
  const swell = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const c = LATTICE / 2;
  // Drawn in, the lines would thin: keep them about as fine as in the scene.
  const w = 1 / Math.sqrt(scale);
  return (
    <Animated.View style={[styles.lattice, { opacity, transform: [{ scale }] }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: swell }] }]}>
        {turns.map((rotate, pair) => (
          <Animated.View key={pair} style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
            <Svg width={LATTICE} height={LATTICE}>
              <Defs>
                <Filter id={`latticeLight${pair}`} x="-10%" y="-10%" width="120%" height="120%">
                  <FeGaussianBlur stdDeviation={1.6 * w} />
                </Filter>
              </Defs>
              {LATTICE_STARS.filter((st) => st.pair === pair).map((st, k) => {
                const points = star8Points(c, c, (st.r * DISC) / 2, st.rot);
                return (
                  <G key={k}>
                    {/* The faint line itself. */}
                    <Polygon points={points} fill="none" stroke={st.deep ? colors.deep : colors.light} strokeOpacity={st.opacity * 0.4} strokeWidth={st.width * w} />
                    {/* Its light: soft and pale. */}
                    <Polygon points={points} fill="none" stroke={colors.core} strokeOpacity={Math.min(1, st.opacity * 1.8)} strokeWidth={2.4 * st.width * w} filter={`url(#latticeLight${pair})`} />
                  </G>
                );
              })}
            </Svg>
          </Animated.View>
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lattice: {
    position: 'absolute',
    width: LATTICE,
    height: LATTICE,
  },
  box: {
    width: HALO_BOX,
    height: HALO_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
  },
  breathing: {
    position: 'absolute',
    width: RAYS,
    height: RAYS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rays: {
    position: 'absolute',
    width: RAYS,
    height: RAYS,
  },
  disc: {
    position: 'absolute',
    width: DISC,
    height: DISC,
  },
  mark: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
