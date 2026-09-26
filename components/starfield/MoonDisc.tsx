import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Orb from '@/components/ui/Orb';
import PressedMark from '@/components/ui/PressedMark';
import { HALO_BOX } from '@/components/starfield/MarkHalo';
import EdgeHalo from '@/components/starfield/EdgeHalo';
import { useStarfield } from '@/contexts/StarfieldContext';
import { alpha, nightPalette } from '@/constants/theme';

/**
 * The moon stays about the size Home's mark is (a 70px mark): a small disc just
 * round a slightly smaller mark, pressed in.
 */
const DISC = 84;
const MARK = 58;
const HALO = 150;
/** The moon's halo strength, as Home's Night mark. */
const HALO_STRENGTH = 0.4;

/** A solid teal moon: the Profile avatar's lit orb, highlight a touch above centre. */
const STOPS: [string, number][] = [
  ['#D9FAF6', 0],
  [nightPalette.hounaGlow, 0.55],
  ['#2E8F8A', 1],
];

/**
 * The starfield's moon: Home's mark becoming one solid object with the moon, a
 * teal disc with the mark pressed into it as the breathing orbs press it, still
 * and crisp. Round it, a halo joined to the disc's edge breathes on the shared
 * clock exactly as the mark's halo does (most of its light ebbing away on the
 * out-breath). Drawn in the mark's 190px box, so it can take the mark's place.
 */
export default function MoonDisc({ form }: { form: Animated.Value | Animated.AnimatedInterpolation<number> }) {
  const { breath } = useStarfield()!.clock;
  const haloOpacity = Animated.multiply(form, breath.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }));
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.1] });

  return (
    <View style={styles.box} pointerEvents="none">
      <Animated.View style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
        <EdgeHalo size={HALO} edge={DISC / 2} color={nightPalette.hounaGlow} strength={HALO_STRENGTH} />
      </Animated.View>
      <Animated.View style={[styles.disc, { opacity: form }]}>
        <Orb size={DISC} stops={STOPS} fx={0.5} fy={0.45} glow={`0 0 14px ${alpha(nightPalette.hounaGlow, 0.45)}`} />
        <PressedMark size={MARK} surface={nightPalette.hounaGlow} />
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
});
