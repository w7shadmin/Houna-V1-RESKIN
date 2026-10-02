import React from 'react';
import { StyleSheet, View } from 'react-native';
import HounaMark from '@/components/HounaMark';
import { alpha, flatten, nightPalette } from '@/constants/theme';

interface PressedMarkProps {
  size: number;
  /** The colour of the surface it's pressed into. */
  surface: string;
}

/**
 * The Houna mark pressed into a surface (the breathing orbs, the sunrise and dusk
 * suns, the starfield's moon): one even shape, a shade deeper than the surface
 * (the surface with a quarter of Midnight, at 0.7), so it reads as a hollow in the
 * same material, not a separate colour. Centre it in its parent.
 *
 * The mark is two shapes that overlap (the pin's top sits on the ring), so it's
 * drawn solid and faded as one layer: a translucent fill would double up where
 * they overlap and draw the top of the ring darker than the rest.
 */
export default function PressedMark({ size, surface }: PressedMarkProps) {
  const pressed = flatten(alpha(nightPalette.midnight, 0.25), surface);
  return (
    <View style={styles.centre} pointerEvents="none">
      <View style={styles.layer} needsOffscreenAlphaCompositing>
        <HounaMark size={size} color={pressed} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    opacity: 0.7,
  },
});
