import React, { useId, useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useStarfield } from '@/contexts/StarfieldContext';
import { alpha } from '@/constants/theme';
import { stopProps } from '@/lib/svgStop';

/** The layers, as MarkHalo's: slightly oval, each turning its own laps per turn of the clock. */
const LAYERS = [
  { sx: 1.04, sy: 0.96, from: 0, turns: 1 },
  { sx: 0.96, sy: 1.04, from: 45, turns: -1 },
  { sx: 1.03, sy: 0.97, from: 100, turns: 2 },
];

interface EdgeHaloProps {
  /** The halo's square, centred on the disc. */
  size: number;
  /** The disc's radius: the light begins just under its edge and never reaches inside. */
  edge: number;
  color: string;
  /** Where all three layers overlap, their light adds up to this at the edge. */
  strength: number;
}

/**
 * A halo joined to a disc's edge (the sunrise and dusk suns, the starfield's moon):
 * clear inside, brightest just outside the edge, fading outward, in three slightly
 * oval layers turning at their own pace on the shared clock, so its outline shifts
 * a little. The breathing is its parent's.
 */
export default function EdgeHalo({ size, edge, color, strength }: EdgeHaloProps) {
  const { turn } = useStarfield()!.clock;
  const id = `edgeHalo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const layerTurns = useMemo(
    () => LAYERS.map((l) => turn.interpolate({ inputRange: [0, 1], outputRange: [`${l.from}deg`, `${l.from + l.turns * 360}deg`] })),
    [turn],
  );
  const layerStrength = 1 - Math.pow(1 - strength, 1 / LAYERS.length);
  const r = size / 2;

  return (
    <View style={{ width: size, height: size }} pointerEvents="none">
      {LAYERS.map((layer, k) => (
        <Animated.View key={k} style={[StyleSheet.absoluteFill, { transform: [{ rotate: layerTurns[k] }, { scaleX: layer.sx }, { scaleY: layer.sy }] }]}>
          <Svg width={size} height={size}>
            <Defs>
              <RadialGradient id={`${id}${k}`} cx="50%" cy="50%" r="50%">
                <Stop offset={(edge - 4) / r} {...stopProps(alpha(color, 0))} />
                <Stop offset={(edge + 4) / r} {...stopProps(alpha(color, layerStrength))} />
                <Stop offset="1" {...stopProps(alpha(color, 0))} />
              </RadialGradient>
            </Defs>
            <Circle cx={r} cy={r} r={r} fill={`url(#${id}${k})`} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}
