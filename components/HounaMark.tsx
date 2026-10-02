import React, { useId } from 'react';
import Svg, { Defs, G, Mask, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { FIGURE_WITH_HEAD_HOLE_D } from '@/constants/logoSvg';

interface HounaMarkProps {
  size: number;
  /** Fill override (the breathing orbs' pressed-in mark); defaults to the theme's logo colour. */
  color?: string;
  /** Drawn as an outline this many pixels wide, in `color`, instead of filled (the moon's dark part). */
  outline?: number;
}

/**
 * The Houna pin on its own — ring, heart, and knocked-out head — cropped
 * from the official logo. Paths and transforms are the logo's own (same as
 * the canvas "Houna mark" asset); only the fills follow the theme. The head
 * is a real hole, so glows behind the mark show through it.
 */
export default function HounaMark({ size, color, outline }: HounaMarkProps) {
  const { colors } = useTheme();
  const fill = color ?? colors.logo.primary;
  const maskId = `markOutline${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <Svg width={size} height={size} viewBox={HOUNA_MARK_VIEWBOX}>
      {outline ? (
        // The outline of the mark as one shape: the ring and the figure overlap at the top, so
        // stroking each drew a second line through the overlap. Each is stroked twice as wide, and
        // the mark's own filled shape masks the inner half away, leaving one line round the outside
        // of the whole (the head's hole and the ring's middle keep theirs). 20.6 units span `size` px.
        <>
          <Defs>
            <Mask id={maskId} maskUnits="userSpaceOnUse" x="15" y="3.4" width="24.6" height="24.6">
              <Rect x="15" y="3.4" width="24.6" height="24.6" fill="#FFFFFF" />
              <HounaMarkShape fill="#000000" />
            </Mask>
          </Defs>
          <G mask={`url(#${maskId})`}>
            <HounaMarkShape fill="none" stroke={fill} strokeWidth={(2 * outline * 20.6) / size} />
          </G>
        </>
      ) : (
        <HounaMarkShape fill={fill} />
      )}
    </Svg>
  );
}

/** The mark's own frame: it fills a square this viewBox, in the logo's units. */
export const HOUNA_MARK_VIEWBOX = '17 5.4 20.6 20.6';

/** The mark's paths alone, for drawing it inside another SVG (through a filter, say). */
export function HounaMarkShape({ fill, stroke, strokeWidth }: { fill: string; stroke?: string; strokeWidth?: number }) {
  const line = stroke ? { stroke, strokeWidth, strokeLinejoin: 'round' as const } : {};
  return (
      <G transform="translate(-10.7 -6.6)">
        <G transform="translate(29.24 13.384)">
          <Path
            d="M50.18,33.714a6.82,6.82,0,0,1-2.116-1.448,7.132,7.132,0,0,1-1.448-2.116,6.565,6.565,0,0,1-.5-2.561,7.052,7.052,0,0,1,.5-2.617,6.228,6.228,0,0,1,1.448-2.116A7.132,7.132,0,0,1,50.18,21.41a6.565,6.565,0,0,1,2.561-.5,7.052,7.052,0,0,1,2.617.5,6.228,6.228,0,0,1,2.116,1.448,7.132,7.132,0,0,1,1.448,2.116,6.843,6.843,0,0,1,.5,2.617,6.565,6.565,0,0,1-.5,2.561,6.82,6.82,0,0,1-1.448,2.116,7.132,7.132,0,0,1-2.116,1.448,6.843,6.843,0,0,1-2.617.5,6.769,6.769,0,0,1-2.561-.5m-.835-14.253a8.809,8.809,0,0,0-2.784,1.893,8.2,8.2,0,0,0-1.893,2.839A8.871,8.871,0,0,0,44,27.646a9.074,9.074,0,0,0,.668,3.452,8.224,8.224,0,0,0,1.893,2.784,8.525,8.525,0,0,0,2.784,1.893,9.251,9.251,0,0,0,6.9,0,9.744,9.744,0,0,0,2.839-1.893A8.525,8.525,0,0,0,60.981,31.1a9.251,9.251,0,0,0,0-6.9,9.744,9.744,0,0,0-1.893-2.839,8.2,8.2,0,0,0-2.839-1.893,8.871,8.871,0,0,0-3.452-.668,7.232,7.232,0,0,0-3.452.668"
            transform="translate(-44 -18.785)"
            fill={fill}
            {...line}
          />
        </G>
        <G transform="translate(31.801 13.392)">
          <Path d={FIGURE_WITH_HEAD_HOLE_D} transform="translate(-48.6 -18.8)" fill={fill} fillRule="evenodd" {...line} />
        </G>
      </G>
  );
}
