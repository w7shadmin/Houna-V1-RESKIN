import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface OrbProps {
  size: number;
  /** [colour, offset 0–1] pairs, highlight first. */
  stops: [string, number][];
  /** Highlight position as 0–1 of the box — CSS `circle at fx% fy%`. */
  fx: number;
  fy: number;
  /** CSS box-shadow for the halo, e.g. `0 0 40px rgba(...)`. */
  glow?: string;
  /** Corner radius; leave out for a sphere. A smaller one makes a lit rounded square. */
  radius?: number;
}

/**
 * A lit sphere — the canvas's `radial-gradient(circle at X% Y%, …)` orbs
 * (Tanafas stages, mood orbs in Recap). The gradient radius is CSS's
 * default `farthest-corner` from the highlight.
 */
export default function Orb({ size, stops, fx, fy, glow, radius = size / 2 }: OrbProps) {
  const id = `orb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const r = Math.hypot(Math.max(fx, 1 - fx), Math.max(fy, 1 - fy));
  return (
    <View style={{ width: size, height: size, borderRadius: radius, boxShadow: glow }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx={`${fx * 100}%`} cy={`${fy * 100}%`} fx={`${fx * 100}%`} fy={`${fy * 100}%`} r={`${r * 100}%`}>
            {stops.map(([c, o]) => (
              <Stop key={o} offset={o} stopColor={c} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} rx={radius} ry={radius} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
