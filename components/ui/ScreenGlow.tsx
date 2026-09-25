import React, { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface ScreenGlowProps {
  /** Glow colour, alpha included (e.g. `rgba(179,167,245,0.20)`). */
  color: string;
  /** CSS-style ellipse: radii and centre as % of the screen's width / height. */
  rx: number;
  ry: number;
  cy: number;
  /** Where the glow has faded out, 0–1 (canvas uses 0.72). */
  fade?: number;
}

/**
 * Soft light behind the top of a screen — the canvas's
 * `radial-gradient(rx% ry% at 50% cy%, color, transparent fade)` as SVG,
 * stretched to the screen so the percentages mean the same thing.
 */
export default function ScreenGlow({ color, rx, ry, cy, fade = 0.72 }: ScreenGlowProps) {
  const id = `glow${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={id} gradientUnits="userSpaceOnUse" cx={50} cy={cy} rx={rx} ry={ry} fx={50} fy={cy}>
            <Stop offset="0" stopColor={color} />
            <Stop offset={fade} stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
