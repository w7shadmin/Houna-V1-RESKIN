import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Stroke icons drawn exactly as on the redesign canvas (24×24 viewBox,
 * round caps/joins). Lucide's near-equivalents differ in small details —
 * e.g. its house has a rounded roof — so the tab bar and core controls use
 * the canvas paths directly. Add a new glyph here by copying its <svg>
 * children from the canvas artboard. Directional glyphs (`back`,
 * `chevron`) are drawn for LTR — mirror them in RTL with a wrapping View
 * (see `DirectionalIcon`), never a transform on the Svg itself.
 */
export type CanvasIconName =
  | 'home'
  | 'search'
  | 'tanafas'
  | 'events'
  | 'more'
  | 'close'
  | 'play'
  | 'pause'
  | 'profile'
  | 'phone'
  | 'back'
  | 'chevron';

interface CanvasIconProps {
  name: CanvasIconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export default function CanvasIcon({ name, size = 24, color, strokeWidth = 1.6 }: CanvasIconProps) {
  const stroke = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  let body: React.ReactNode;
  switch (name) {
    case 'home':
      body = (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...stroke} />
          <Path d="M5 9.5V21h14V9.5" {...stroke} />
          <Path d="M10 21v-6h4v6" {...stroke} />
        </>
      );
      break;
    case 'search':
      body = (
        <>
          <Circle cx={11} cy={11} r={7} {...stroke} />
          <Path d="m20 20-3.5-3.5" {...stroke} />
        </>
      );
      break;
    case 'tanafas':
      body = (
        <>
          <Path d="M3 8h10a3 3 0 1 0-3-3" {...stroke} />
          <Path d="M3 12h15a3 3 0 1 1-3 3" {...stroke} />
          <Path d="M3 16h7" {...stroke} />
        </>
      );
      break;
    case 'events':
      body = (
        <>
          <Rect x={3.5} y={5} width={17} height={15} rx={2.5} {...stroke} />
          <Path d="M3.5 10h17M8 3v4M16 3v4" {...stroke} />
        </>
      );
      break;
    case 'more':
      body = <Path d="M4 7h16M4 12h16M4 17h16" {...stroke} />;
      break;
    case 'close':
      body = <Path d="M6 6l12 12M18 6 6 18" {...stroke} />;
      break;
    case 'play':
      body = <Path d="M8 5.5v13l10.5-6.5z" fill={color} />;
      break;
    case 'pause':
      body = (
        <>
          <Rect x={6} y={5} width={4} height={14} rx={1.2} fill={color} />
          <Rect x={14} y={5} width={4} height={14} rx={1.2} fill={color} />
        </>
      );
      break;
    case 'profile':
      body = (
        <>
          <Circle cx={12} cy={8} r={4} {...stroke} />
          <Path d="M4 21a8 8 0 0 1 16 0" {...stroke} />
        </>
      );
      break;
    case 'phone':
      body = (
        <Path
          d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"
          {...stroke}
        />
      );
      break;
    case 'back':
      body = <Path d="M19 12H5m6-6-6 6 6 6" {...stroke} />;
      break;
    case 'chevron':
      body = <Path d="m9 6 6 6-6 6" {...stroke} />;
      break;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {body}
    </Svg>
  );
}

/** A directional glyph that mirrors itself in RTL. */
export function DirectionalIcon({ isRTL, ...props }: CanvasIconProps & { isRTL: boolean }) {
  return (
    <View style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}>
      <CanvasIcon {...props} />
    </View>
  );
}
