import React from 'react';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

export interface RadarAxis {
  label: string;
  /** 0–1 */
  value: number;
}

interface RadarChartProps {
  axes: RadarAxis[];
  /** Series colour (fill at 28%, 2px stroke). */
  color: string;
  /** Width of the chart; height follows the canvas's 350:320 frame. */
  width?: number;
  /** Small version (Profile) — no labels, no point dots. */
  compact?: boolean;
}

/**
 * Radar chart for self-reflection results, hand-drawn in react-native-svg
 * like `MoodTrendChart` (no chart library). Geometry is the canvas
 * results artboard's: N axes from the top clockwise, three grid rings at
 * ⅓ / ⅔ / full radius, labels just outside the outer ring. Labels are SVG
 * text, so RTL layout never moves them.
 */
export default function RadarChart({ axes, color, width = 350, compact = false }: RadarChartProps) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const scale = width / 350;
  const height = (compact ? 300 : 320) * scale;
  const cx = width / 2;
  const cy = (compact ? 150 : 160) * scale;
  const R = 108 * scale * (compact ? 1.25 : 1);
  const labelR = 134 * scale;
  const n = axes.length;
  if (n < 3) return null;

  const at = (k: number, r: number) => {
    const a = (-90 + (k * 360) / n) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const ring = (f: number) =>
    axes.map((_, k) => at(k, R * f)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const points = axes.map((a, k) => at(k, R * Math.max(0, Math.min(1, a.value))));

  return (
    <Svg width={width} height={height} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Polygon points={ring(1)} fill={colors.text} fillOpacity={0.03} stroke={colors.text} strokeOpacity={0.18} strokeWidth={1} />
      <Polygon points={ring(2 / 3)} fill="none" stroke={colors.text} strokeOpacity={0.12} strokeWidth={1} />
      <Polygon points={ring(1 / 3)} fill="none" stroke={colors.text} strokeOpacity={0.1} strokeWidth={1} />
      {axes.map((_, k) => {
        const p = at(k, R);
        return <Line key={k} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={colors.text} strokeOpacity={0.12} />;
      })}
      <Polygon
        points={points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill={color}
        fillOpacity={0.28}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {!compact && points.map((p, k) => <Circle key={k} cx={p.x} cy={p.y} r={4} fill={colors.text} />)}
      {!compact &&
        axes.map((a, k) => {
          const p = at(k, labelR);
          return (
            <SvgText
              key={k}
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              fill={colors.textSecondary}
              fontSize={fonts.labelTracked ? 11 : 12.5}
              fontFamily={fonts.labelTracked ? fonts.labelRegular : fonts.label}
              letterSpacing={fonts.labelTracked ? 0.88 : 0}
            >
              {fonts.labelTracked ? a.label.toUpperCase() : a.label}
            </SvgText>
          );
        })}
    </Svg>
  );
}
