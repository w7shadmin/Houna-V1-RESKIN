import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle, G, Path } from 'react-native-svg';
import { WORLD_DOTS_HEIGHT, WORLD_DOTS_PATH, WORLD_DOTS_WIDTH, snapToLand } from '@/constants/worldDots';
import { getCountry } from '@/lib/countries';
import { palette, spacing, radius, typography } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';

export interface CountryCount {
  country: string;
  count: number;
}

interface WorldMapProps {
  counts: CountryCount[];
  language: 'en' | 'ar';
  isRTL: boolean;
  fontRegular: string;
  fontSemiBold: string;
  emptyLabel: string;
}

/**
 * A deliberately un-cartographic "world map": no coastline data (this app
 * has none, and a real one is a lot of data for a "lightweight" community
 * dot map) — just a lat/lon graticule and a dot per country sized by count,
 * positioned via a plain equirectangular projection of `lib/countries.ts`'s
 * capital-city coordinates. Good enough to convey "people all over the
 * world," not meant to be geographically precise.
 */
export default function WorldMap({ counts, language, isRTL, fontRegular, fontSemiBold, emptyLabel }: WorldMapProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const points = useMemo(() => {
    const maxCount = Math.max(1, ...counts.map((c) => c.count));
    return counts
      .map(({ country, count }) => {
        const info = getCountry(country);
        if (!info) return null;
        return {
          code: country,
          count,
          name: info[language],
          x: info.lon + 180,
          y: 90 - info.lat,
          // Area-proportional radius (sqrt of count), clamped to a readable range.
          r: Math.min(9, Math.max(3, 3 + 6 * Math.sqrt(count / maxCount))),
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [counts, language]);

  const selectedPoint = points.find((p) => p.code === selected) ?? null;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const graticuleLines = [];
  for (let lon = -180; lon <= 180; lon += 30) graticuleLines.push({ x1: lon + 180, y1: 0, x2: lon + 180, y2: 180 });
  for (let lat = -60; lat <= 60; lat += 30) graticuleLines.push({ x1: 0, y1: 90 - lat, x2: 360, y2: 90 - lat });

  return (
    <View>
      <View style={[styles.mapCard, { backgroundColor: palette.turquoiseDark }]}>
        <Svg viewBox="0 0 360 180" width="100%" height="100%">
          {graticuleLines.map((l, i) => (
            <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
          ))}
          {points.map((p) => (
            <Circle
              key={p.code}
              cx={p.x}
              cy={p.y}
              r={p.code === selected ? p.r + 1.5 : p.r}
              fill={p.code === selected ? palette.yellow : palette.white}
              fillOpacity={p.code === selected ? 1 : 0.85}
              onPress={() => setSelected(p.code === selected ? null : p.code)}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.caption}>
        {selectedPoint ? (
          <Text style={[styles.captionText, { fontFamily: fontSemiBold, color: palette.turquoiseDark }]}>
            {selectedPoint.name} — {num(selectedPoint.count)}
          </Text>
        ) : points.length === 0 ? (
          <Text style={[styles.captionText, { fontFamily: fontRegular, color: palette.grey50 }]}>{emptyLabel}</Text>
        ) : (
          <Text style={[styles.captionText, { fontFamily: fontRegular, color: palette.grey50 }]} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    aspectRatio: 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  caption: {
    minHeight: typography.lineHeight.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  captionText: {
    fontSize: typography.fontSize.sm,
  },
});

/* ──────────────── Community dot map (Nightlight Home) ──────────────── */

interface CommunityDotMapProps {
  /** Countries to light up. */
  lit: readonly string[];
  /** Colour (and glow) of lit countries. */
  accent: string;
  /** Colour of the land dots. */
  dotColor: string;
}

/**
 * Home's community card map: a halftone dot world map (constants/worldDots.ts)
 * with active countries lit as accent dots with a soft glow, each snapped
 * onto the nearest land dot so it always sits on the drawn coastline. One
 * path for all land dots; scales with its width through the viewBox. No
 * labels or touch targets — it's ambience, the numbers beside it carry the
 * meaning.
 */
export function CommunityDotMap({ lit, accent, dotColor }: CommunityDotMapProps) {
  const markers = useMemo(
    () =>
      lit
        .map((code) => {
          const c = getCountry(code);
          return c ? { code, ...snapToLand(c.lat, c.lon) } : null;
        })
        .filter((m): m is NonNullable<typeof m> => m !== null),
    [lit],
  );

  return (
    <View
      style={{ width: '100%', aspectRatio: WORLD_DOTS_WIDTH / WORLD_DOTS_HEIGHT }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox={`0 0 ${WORLD_DOTS_WIDTH} ${WORLD_DOTS_HEIGHT}`}>
        <Path d={WORLD_DOTS_PATH} fill={dotColor} />
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
