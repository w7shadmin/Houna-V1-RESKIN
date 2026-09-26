import React, { useId, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Orb from '@/components/ui/Orb';
import HounaMark from '@/components/HounaMark';
import PressedMark from '@/components/ui/PressedMark';
import { HALO_BOX } from '@/components/starfield/MarkHalo';
import EdgeHalo from '@/components/starfield/EdgeHalo';
import { useStarfield } from '@/contexts/StarfieldContext';
import { alpha, nightPalette } from '@/constants/theme';
import { moonPhase, terminatorBreath } from '@/lib/moonPhase';
import { stopProps } from '@/lib/svgStop';

/**
 * The moon stays about the size Home's mark is (a 70px mark): a small disc just
 * round a slightly smaller mark, pressed in.
 */
const DISC = 84;
const MARK = 58;
const HALO = 150;
/** The moon's halo strength, as Home's Night mark. */
const HALO_STRENGTH = 0.4;
/** The narrowest the terminator ellipse gets, so its counter-scale stays finite (under a pixel wide). */
const MIN_TERMINATOR = 0.02;

/** A solid teal moon: the Profile avatar's lit orb, highlight a touch above centre. */
const LIT: [string, number][] = [
  ['#D9FAF6', 0],
  [nightPalette.hounaGlow, 0.55],
  ['#2E8F8A', 1],
];
/** The unlit part, faintly lit by the Earth: a deep navy disc with a teal rim. */
const EARTHSHINE: [string, number][] = [
  ['#1D2E52', 0],
  ['#0F1838', 1],
];

/** The full moon's ring, well clear of the disc (the canvas "Moon halo": 176 round a 76 disc). */
const RING = 192;
/** Its bands, as the canvas: a warm inner edge, then teal, then lavender, fading out. */
const RING_BANDS: [string, number, number][] = [
  [nightPalette.hounaGlow, 0, 0.8],
  ['#FFD2BE', 0.22, 0.86],
  [nightPalette.hounaGlow, 0.42, 0.9],
  [nightPalette.dusk, 0.2, 0.94],
  [nightPalette.hounaGlow, 0, 1],
];

/**
 * The ring that circles the moon on a clear, cold night: wide, faint and
 * softly prismatic. Only on full-moon nights.
 */
function FullMoonRing() {
  const id = `moonRing${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={RING} height={RING}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          {RING_BANDS.map(([color, opacity, offset]) => (
            <Stop key={offset} offset={offset} {...stopProps(color, opacity)} />
          ))}
        </RadialGradient>
      </Defs>
      <Circle cx={RING / 2} cy={RING / 2} r={RING / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** The lit moon: the teal disc with the mark pressed in. */
function LitFace() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Orb size={DISC} stops={LIT} fx={0.5} fy={0.45} />
      <PressedMark size={MARK} surface={nightPalette.hounaGlow} />
    </View>
  );
}

/** The dark moon in earthshine, the mark just visible in it. */
function DarkFace() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Orb size={DISC} stops={EARTHSHINE} fx={0.5} fy={0.45} />
      <View style={styles.rim} />
      <View style={[styles.centre, styles.faint]} needsOffscreenAlphaCompositing>
        <HounaMark size={MARK} color={nightPalette.hounaGlow} />
      </View>
    </View>
  );
}

/**
 * The starfield's moon, in tonight's real phase (`lib/moonPhase.ts`): Home's
 * mark becoming one solid object with the moon, the mark pressed into its lit
 * part and just visible in the dark part (earthshine), so a new moon is never
 * an empty sky.
 *
 * The lit shape is the lit half-disc (on the right while waxing, as seen from
 * the Gulf) less a terminator ellipse for a crescent, plus one for a gibbous.
 * Both are windows clipping a whole face, so the faces never distort and the
 * pressed mark stays whole: the half is a window slid half a disc sideways, the
 * ellipse a round window squeezed across with its face counter-squeezed. On the
 * in-breath the lit part swells a little (the ellipse narrows on a crescent,
 * widens on a gibbous), never past the quarter line; a full moon can't grow, so
 * only its halo breathes. The halo is joined to the disc's edge and follows the
 * light: full on full-moon nights, faint round a thin crescent. On full-moon
 * nights (about three or four a month) a wide, faint ring circles it too.
 *
 * Drawn in the mark's 190px box, so it can take the mark's place. The sides are
 * physical, so placed with transforms, which RTL never mirrors.
 */
export default function MoonDisc({ form, date }: { form: Animated.Value | Animated.AnimatedInterpolation<number>; date?: Date }) {
  const { breath } = useStarfield()!.clock;
  const phase = useMemo(() => moonPhase(date ?? new Date()), [date]);

  const { terminator, inverse, light } = useMemo(() => {
    const [out, held] = terminatorBreath(phase).map((t) => Math.max(t, MIN_TERMINATOR));
    const width = breath.interpolate({ inputRange: [0, 1], outputRange: [out, held] });
    return { terminator: width, inverse: Animated.divide(1, width), light: 0.3 + 0.7 * phase.fraction };
  }, [breath, phase]);

  const haloOpacity = Animated.multiply(form, breath.interpolate({ inputRange: [0, 1], outputRange: [0.2 * light, light] }));
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] });
  const side = phase.waxing ? DISC / 2 : -DISC / 2;
  const ringOpacity = Animated.multiply(form, breath.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }));
  const ringScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });

  return (
    <View style={styles.box} pointerEvents="none">
      {phase.name === 'full' && (
        <Animated.View style={[styles.ring, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}>
          <FullMoonRing />
        </Animated.View>
      )}
      <Animated.View style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
        <EdgeHalo size={HALO} edge={DISC / 2} color={nightPalette.hounaGlow} strength={HALO_STRENGTH} />
      </Animated.View>
      {/* Faded as one layer: the faces are stacked, and Android otherwise fades each on its own,
          so mid-fade they show through one another and the moon seems to sweep through phases. */}
      <Animated.View style={[styles.disc, { opacity: form }]} needsOffscreenAlphaCompositing>
        <View style={[styles.glow, { opacity: light }]} />
        <DarkFace />
        <View style={[styles.window, { transform: [{ translateX: side }] }]}>
          <View style={[StyleSheet.absoluteFill, { transform: [{ translateX: -side }] }]}>
            <LitFace />
          </View>
        </View>
        <Animated.View style={[styles.window, styles.round, { transform: [{ scaleX: terminator }] }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scaleX: inverse }] }]}>
            {phase.crescent ? <DarkFace /> : <LitFace />}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: HALO_BOX,
    height: HALO_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
  },
  halo: {
    position: 'absolute',
    width: HALO,
    height: HALO,
  },
  disc: {
    position: 'absolute',
    width: DISC,
    height: DISC,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DISC / 2,
    boxShadow: `0 0 14px ${alpha(nightPalette.hounaGlow, 0.45)}`,
  },
  window: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  round: {
    borderRadius: DISC / 2,
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DISC / 2,
    borderWidth: 1,
    borderColor: alpha(nightPalette.hounaGlow, 0.35),
  },
  centre: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faint: {
    opacity: 0.22,
  },
});
