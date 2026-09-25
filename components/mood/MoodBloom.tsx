import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export interface BloomShape {
  /** Leaf rotation in degrees about the leaf base; negative opens the bloom. */
  fold: number;
  /** Head centre y in the 200×200 viewBox. */
  headY: number;
}

interface MoodBloomProps {
  size: number;
  color: string;
  shape: BloomShape;
  /** Ring stroke; the canvas uses 14 for the small Home glyph, 12 in the check-in. */
  ringWidth?: number;
  ringOpacity?: number;
}

/** The Home top-bar glyph from the canvas: a gently opened bloom. */
export const HOME_BLOOM: BloomShape = { fold: -14, headY: 64 };

/**
 * "Houna bloom" — the mark as a mood figure: ring, two leaves, head. Leaf
 * geometry is copied from the canvas's "Houna bloom — mood states" sheet:
 * the left leaf rotates by `fold` about its base (100,152), the right by
 * `-fold`. Static for now; the check-in sheet animates `shape` between
 * moods.
 */
export default function MoodBloom({ size, color, shape, ringWidth = 14, ringOpacity = 1 }: MoodBloomProps) {
  const { fold, headY } = shape;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={84} fill="none" stroke={color} strokeWidth={ringWidth} opacity={ringOpacity} />
      <Path d="M100 152 C 72 142 50 116 54 84 C 80 90 98 116 100 152 Z" fill={color} transform={`rotate(${fold} 100 152)`} />
      <Path d="M100 152 C 128 142 150 116 146 84 C 120 90 102 116 100 152 Z" fill={color} transform={`rotate(${-fold} 100 152)`} />
      <Circle cx={100} cy={headY} r={16} fill={color} />
    </Svg>
  );
}
