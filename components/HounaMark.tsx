import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { FIGURE_WITH_HEAD_HOLE_D } from '@/constants/logoSvg';

interface HounaMarkProps {
  size: number;
  /** Fill override (the breathing orbs' pressed-in mark); defaults to the theme's logo colour. */
  color?: string;
}

/**
 * The Houna pin on its own — ring, heart, and knocked-out head — cropped
 * from the official logo. Paths and transforms are the logo's own (same as
 * the canvas "Houna mark" asset); only the fills follow the theme. The head
 * is a real hole, so glows behind the mark show through it.
 */
export default function HounaMark({ size, color }: HounaMarkProps) {
  const { colors } = useTheme();
  const fill = color ?? colors.logo.primary;

  return (
    <Svg width={size} height={size} viewBox="17 5.4 20.6 20.6">
      <G transform="translate(-10.7 -6.6)">
        <G transform="translate(29.24 13.384)">
          <Path
            d="M50.18,33.714a6.82,6.82,0,0,1-2.116-1.448,7.132,7.132,0,0,1-1.448-2.116,6.565,6.565,0,0,1-.5-2.561,7.052,7.052,0,0,1,.5-2.617,6.228,6.228,0,0,1,1.448-2.116A7.132,7.132,0,0,1,50.18,21.41a6.565,6.565,0,0,1,2.561-.5,7.052,7.052,0,0,1,2.617.5,6.228,6.228,0,0,1,2.116,1.448,7.132,7.132,0,0,1,1.448,2.116,6.843,6.843,0,0,1,.5,2.617,6.565,6.565,0,0,1-.5,2.561,6.82,6.82,0,0,1-1.448,2.116,7.132,7.132,0,0,1-2.116,1.448,6.843,6.843,0,0,1-2.617.5,6.769,6.769,0,0,1-2.561-.5m-.835-14.253a8.809,8.809,0,0,0-2.784,1.893,8.2,8.2,0,0,0-1.893,2.839A8.871,8.871,0,0,0,44,27.646a9.074,9.074,0,0,0,.668,3.452,8.224,8.224,0,0,0,1.893,2.784,8.525,8.525,0,0,0,2.784,1.893,9.251,9.251,0,0,0,6.9,0,9.744,9.744,0,0,0,2.839-1.893A8.525,8.525,0,0,0,60.981,31.1a9.251,9.251,0,0,0,0-6.9,9.744,9.744,0,0,0-1.893-2.839,8.2,8.2,0,0,0-2.839-1.893,8.871,8.871,0,0,0-3.452-.668,7.232,7.232,0,0,0-3.452.668"
            transform="translate(-44 -18.785)"
            fill={fill}
          />
        </G>
        <G transform="translate(31.801 13.392)">
          <Path d={FIGURE_WITH_HEAD_HOLE_D} transform="translate(-48.6 -18.8)" fill={fill} fillRule="evenodd" />
        </G>
      </G>
    </Svg>
  );
}
