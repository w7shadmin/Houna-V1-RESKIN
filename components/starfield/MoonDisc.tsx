import React, { useId, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import Orb from '@/components/ui/Orb';
import HounaMark from '@/components/HounaMark';
import PressedMark from '@/components/ui/PressedMark';
import { HALO_BOX } from '@/components/starfield/MarkHalo';
import EdgeHalo from '@/components/starfield/EdgeHalo';
import { useStarfield } from '@/contexts/StarfieldContext';
import { alpha, flatten, nightPalette } from '@/constants/theme';
import { moonPhase, terminatorBreath } from '@/lib/moonPhase';
import { stopProps } from '@/lib/svgStop';

/**
 * The moon stays about the size Home's mark is (a 70px mark): a small disc just
 * round a slightly smaller mark, pressed in.
 */
const DISC = 84;
const MARK = 58;
const HALO = 150;
/** The moon's halo: cool moonlight, softer than the teal it was. */
const HALO_STRENGTH = 0.3;
/** The narrowest the terminator ellipse gets, so its counter-scale stays finite (under a pixel wide). */
const MIN_TERMINATOR = 0.02;

/**
 * A glass moon (Design studies "F4"), like the 4-7-8 orb in cool silver: a white highlight up and to
 * the left, clear through the middle, a little deeper at the edge, a silver rim. Its stops are the
 * study's glass laid over the night's ground, so the faces are solid and can be stacked in the phase
 * windows without showing through one another.
 */
const SILVER = '#BED2F5';
const RIM = alpha('#DCE6FF', 0.55);
const over = (c: string) => flatten(c, nightPalette.midnight);
const LIT: [string, number][] = [
  [over(alpha('#FFFFFF', 0.6)), 0],
  [over(alpha('#D2DEF5', 0.2)), 0.45],
  [over(alpha('#AABEE6', 0.32)), 1],
];
/** The unlit part: the same glass in shadow (the night laid over it at 0.82), the mark just visible. */
const shade = (c: string) => flatten(alpha(nightPalette.midnight, 0.82), c);
const EARTHSHINE: [string, number][] = LIT.map(([c, o]) => [shade(c), o]);
/** The mark as pressed into the glass. */
const MARK_SURFACE = '#AFC0DE';

/** The full moon's ring, well clear of the disc (the canvas "Moon halo": 176 round a 76 disc). */
const RING = 192;
/** Its bands, as the canvas: a warm inner edge, then the moon's silver, then lavender, fading out. */
const RING_BANDS: [string, number, number][] = [
  [SILVER, 0, 0.8],
  ['#FFD2BE', 0.22, 0.86],
  [SILVER, 0.42, 0.9],
  [nightPalette.dusk, 0.2, 0.94],
  [SILVER, 0, 1],
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

/** The glass's soft inner light, round its edge. */
function InnerLight() {
  const id = `moonInner${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={DISC} height={DISC} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset={0.78} {...stopProps('#FFFFFF', 0)} />
          <Stop offset={1} {...stopProps('#FFFFFF', 0.25)} />
        </RadialGradient>
      </Defs>
      <Circle cx={DISC / 2} cy={DISC / 2} r={DISC / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** The lit moon: the glass with the mark pressed in. */
function LitFace() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Orb size={DISC} stops={LIT} fx={0.35} fy={0.3} />
      <InnerLight />
      <View style={[styles.rim, { borderColor: RIM }]} />
      <PressedMark size={MARK} surface={MARK_SURFACE} />
    </View>
  );
}

/** The dark moon in earthshine, the mark just visible in it. */
function DarkFace() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Orb size={DISC} stops={EARTHSHINE} fx={0.35} fy={0.3} />
      <View style={[styles.rim, { borderColor: alpha(SILVER, 0.3) }]} />
      <View style={[styles.centre, styles.faint]} needsOffscreenAlphaCompositing>
        <HounaMark size={MARK} color={SILVER} />
      </View>
    </View>
  );
}

/**
 * The starfield's moon, in tonight's real phase (`lib/moonPhase.ts`), a glass moon in cool silver
 * (Design studies "F4"): Home's mark becoming one solid object with the moon, the mark pressed into its lit
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
        <EdgeHalo size={HALO} edge={DISC / 2} color={SILVER} strength={HALO_STRENGTH} />
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
    boxShadow: `0 0 21px ${alpha(SILVER, 0.35)}`,
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
