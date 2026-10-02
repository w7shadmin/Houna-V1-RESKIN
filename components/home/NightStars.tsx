import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Night sky on a 390×380 tile, repeated down the screen: the canvas's seven
 * stars, plus a scatter of fainter, smaller ones (fixed seed, so the sky is
 * the same every visit) for depth.
 */
const CANVAS_STARS: { x: number; y: number; r: number; o: number }[] = [
  { x: 24, y: 40, r: 1.3, o: 0.55 },
  { x: 150, y: 96, r: 1.3, o: 0.35 },
  { x: 300, y: 30, r: 1.5, o: 0.5 },
  { x: 80, y: 230, r: 1.3, o: 0.3 },
  { x: 350, y: 190, r: 1.3, o: 0.45 },
  { x: 220, y: 300, r: 1.3, o: 0.25 },
  { x: 120, y: 350, r: 1.1, o: 0.4 },
];

const FAINT_STARS = (() => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 16 }, () => ({
    x: Math.round(rand() * 390),
    y: Math.round(rand() * 380),
    r: +(0.6 + rand() * 0.6).toFixed(2),
    o: +(0.12 + rand() * 0.28).toFixed(2),
  }));
})();

const STAR_TILE = [...CANVAS_STARS, ...FAINT_STARS];

export default function NightStars() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const tilesX = Math.ceil(width / 390);
  const tilesY = Math.ceil(height / 380);
  const stars = [];
  for (let ty = 0; ty < tilesY; ty++)
    for (let tx = 0; tx < tilesX; tx++)
      for (const s of STAR_TILE) stars.push({ ...s, x: s.x + tx * 390, y: s.y + ty * 380 });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        {stars.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={colors.text} opacity={s.o} />
        ))}
      </Svg>
    </View>
  );
}
