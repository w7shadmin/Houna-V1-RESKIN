import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { WORLD_DOTS_HEIGHT, WORLD_DOTS_PATH, WORLD_DOTS_WIDTH, snapToLand } from '@/constants/worldDots';
import { WORLD_LAND_HEIGHT, WORLD_LAND_PATH, WORLD_LAND_WIDTH } from '@/constants/worldLand';
import { getCountry } from '@/lib/countries';

export interface CountryCount {
  country: string;
  count: number;
}

/* ──────────────── Community dot map (Nightlight Home) ──────────────── */

interface CommunityDotMapProps {
  /** Countries to light up. */
  lit: readonly string[];
  /** Colour (and glow) of lit countries. */
  accent: string;
  /** Colour of the land: dots, or the filled silhouette. */
  dotColor: string;
  /** Halftone dots (default) or the traced solid silhouette. */
  variant?: 'dots' | 'solid';
}

/**
 * Home's community card map: a halftone dot world map (constants/worldDots.ts)
 * with active countries lit as accent dots with a soft glow, each snapped
 * onto the nearest land dot so it always sits on the drawn coastline. One
 * path for all land dots; scales with its width through the viewBox. No
 * labels or touch targets — it's ambience, the numbers beside it carry the
 * meaning.
 */
export function CommunityDotMap({ lit, accent, dotColor, variant = 'dots' }: CommunityDotMapProps) {
  const solid = variant === 'solid';
  const width = solid ? WORLD_LAND_WIDTH : WORLD_DOTS_WIDTH;
  const height = solid ? WORLD_LAND_HEIGHT : WORLD_DOTS_HEIGHT;
  const markers = useMemo(
    () =>
      lit
        .map((code) => {
          const c = getCountry(code);
          if (!c) return null;
          return { code, ...snapToLand(c.lat, c.lon) };
        })
        .filter((m): m is NonNullable<typeof m> => m !== null),
    [lit],
  );

  return (
    <View
      style={{ width: '100%', aspectRatio: width / height }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {solid ? (
          <Path d={WORLD_LAND_PATH} fill={dotColor} fillRule="evenodd" />
        ) : (
          <Path d={WORLD_DOTS_PATH} fill={dotColor} />
        )}
        {markers.map((m) => (
          <G key={m.code}>
            {/* CSS `0 0 8px accent` approximated as two soft halo rings. */}
            <Circle cx={m.x} cy={m.y} r={3.6} fill={accent} opacity={0.12} />
            <Circle cx={m.x} cy={m.y} r={2.4} fill={accent} opacity={0.25} />
            <Circle cx={m.x} cy={m.y} r={1.3} fill={accent} />
          </G>
        ))}
      </Svg>
    </View>
  );
}
