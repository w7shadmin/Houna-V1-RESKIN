import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { moonPhase } from '@/lib/moonPhase';

interface MoonGlyphProps {
  /** The moon of this moment, in its real phase (lib/moonPhase.ts). */
  date: Date;
  /** Diameter. */
  size: number;
  lit: string;
  /** The unlit face. */
  dark: string;
  /** Never thinner than this lit share: the first evening's hilal is too thin to see at glyph size. */
  minFraction?: number;
}

/**
 * A small moon in its phase, as a flat glyph (Home's Hijri date, the month of moons): the
 * dark face, then the lit part, the limb's half-disc joined to the terminator's
 * half-ellipse; lit on the right while waxing, as seen from the Gulf.
 */
export default function MoonGlyph({ date, size, lit, dark, minFraction = 0 }: MoonGlyphProps) {
  const phase = moonPhase(date);
  const { waxing } = phase;
  const fraction = Math.max(phase.fraction, minFraction);
  const r = size / 2;
  const rx = Math.abs(1 - 2 * fraction) * r;
  const limb = waxing ? 1 : 0;
  const inner = fraction > 0.5 ? (waxing ? 1 : 0) : waxing ? 0 : 1;
  const d = `M${r} 0 A${r} ${r} 0 0 ${limb} ${r} ${size} A${rx.toFixed(2)} ${r} 0 0 ${inner} ${r} 0 Z`;
  return (
    <Svg width={size} height={size}>
      <Circle cx={r} cy={r} r={r} fill={dark} />
      {fraction > 0.01 && <Path d={d} fill={lit} />}
    </Svg>
  );
}
