import React, { useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import PressedMark from '@/components/ui/PressedMark';
import { stopProps } from '@/lib/svgStop';
import type { BadgeCode } from '@/lib/badges';

/** Each badge's own light, round an earned gem. */
const GLOW: Record<BadgeCode, string> = {
  streak_3: '#F9A980',
  streak_7: '#F9A980',
  streak_14: '#F9A980',
  streak_30: '#6FD6CF',
  streak_100: '#6FD6CF',
  first_session: '#6FD6CF',
  all_breathing: '#B3A7F5',
  all_scenes: '#8F9BF0',
  all_skies: '#EA90A8',
};

/** The practice tones and the meditation scenes, as the badges draw them (the same lit hues in every theme). */
const TONE = { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EA90A8' };
const SCENE = { fire: '#F0A868', rain: '#7FA2EC', forest: '#63CFC7', ocean: '#8F9BF0' };
/** The lit discs: centre to rim (pressed-kit's sunrise, dusk and teal). */
const DISC = {
  sunrise: { stops: [['#FFF9F1', 0], ['#FFE9D3', 0.52], ['#FBC8A3', 0.82], ['#F9A980', 1]] as const, surface: '#FBC8A3' },
  dusk: { stops: [['#FFF3E4', 0], ['#FFD9B3', 0.5], ['#F5B08A', 0.8], ['#E4826A', 1]] as const, surface: '#F5B08A' },
  teal: { stops: [['#D9FAF6', 0], ['#6FD6CF', 0.55], ['#2E8F8A', 1]] as const, surface: '#6FD6CF' },
};

/** Grey of the same lightness, for a gem not yet earned. */
function grey(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
    .toString(16)
    .padStart(2, '0');
  return `#${l}${l}${l}`;
}

/** A few stars, the same every time for a badge (seeded). */
function starsFor(seedStart: number, n: number, bottom: number) {
  let seed = seedStart;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: n }, () => ({ x: rnd() * 100, y: rnd() * 100 * bottom, r: 0.5 + rnd() * 0.7, o: 0.4 + rnd() * 0.5 }));
}

interface BadgeGemProps {
  code: BadgeCode;
  size: number;
  /** Not yet earned: the same gem unlit, the sky greyed and faint, no light. */
  locked?: boolean;
}

/**
 * A badge (canvas "Phase 6 — nine skies, set in gems"): its own small sky (the held plan's badge
 * art: the day's journey for streaks, what each celebrates for exploring) set in a sphere of glass,
 * a highlight up and to the left, a deeper edge low to the right, a rim, and its own light round it.
 * Drawn in a 100-unit frame; the mark, where there is one, is the shared PressedMark.
 */
export default function BadgeGem({ code, size, locked = false }: BadgeGemProps) {
  const id = `gem${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const c = (hex: string) => (locked ? grey(hex) : hex);
  const art = useMemo(() => drawArt(code, id, c), [code, id, locked]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View
      style={[
        { width: size, height: size, borderRadius: size / 2 },
        !locked && { boxShadow: `0 0 ${Math.round(size * 0.3)}px ${GLOW[code]}8C` },
        locked && styles.locked,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <ClipPath id={`${id}clip`}>
            <Circle cx={50} cy={50} r={50} />
          </ClipPath>
          {art.defs}
        </Defs>
        <G clipPath={`url(#${id}clip)`}>{art.body}</G>
      </Svg>
      {art.mark && <PressedMark size={size * art.mark.size} surface={c(art.mark.surface)} />}
      {/* Over the mark: the half moon's shade, then the glass. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={`${id}hl`} cx="34%" cy="26%" r="46%">
              <Stop offset={0} {...stopProps('#FFFFFF', locked ? 0.16 : 0.34)} />
              <Stop offset={0.55} {...stopProps('#FFFFFF', 0.08)} />
              <Stop offset={1} {...stopProps('#FFFFFF', 0)} />
            </RadialGradient>
            <RadialGradient id={`${id}edge`} cx="40%" cy="34%" r="66%">
              <Stop offset={0.72} {...stopProps('#000000', 0)} />
              <Stop offset={1} {...stopProps('#000000', locked ? 0.18 : 0.38)} />
            </RadialGradient>
            <RadialGradient id={`${id}spec`} cx="50%" cy="50%" r="50%">
              <Stop offset={0} {...stopProps('#FFFFFF', locked ? 0.45 : 0.85)} />
              <Stop offset={1} {...stopProps('#FFFFFF', 0)} />
            </RadialGradient>
          </Defs>
          {code === 'streak_30' && <Path d="M50 22 A28 28 0 0 0 50 78 Z" fill="#0B1026" fillOpacity={0.74} />}
          <Circle cx={50} cy={50} r={50} fill={`url(#${id}hl)`} />
          <Circle cx={50} cy={50} r={50} fill={`url(#${id}edge)`} />
          <Ellipse cx={32} cy={21.5} rx={15} ry={8.5} fill={`url(#${id}spec)`} transform="rotate(-30 32 21.5)" />
          <Circle cx={50} cy={50} r={49.5} fill="none" stroke="#FFFFFF" strokeOpacity={locked ? 0.3 : 0.42} strokeWidth={1} />
        </Svg>
      </View>
    </View>
  );
}

type Art = { defs: React.ReactNode; body: React.ReactNode; mark?: { size: number; surface: string } };

/** The badge's sky, in the gem's 100-unit frame. `c` greys a colour when the gem is locked. */
function drawArt(code: BadgeCode, id: string, c: (hex: string) => string): Art {
  const u = (n: number) => `url(#${id}${n})`;
  const vertical = (n: number, stops: [string, number, number?][]) => (
    <LinearGradient id={`${id}${n}`} x1="0" y1="0" x2="0" y2="1">
      {stops.map(([col, o, a], k) => (
        <Stop key={k} offset={o} {...stopProps(c(col), a)} />
      ))}
    </LinearGradient>
  );
  const radial = (n: number, stops: readonly (readonly [string, number, number?])[], cx = '50%', cy = '45%', r = '50%') => (
    <RadialGradient id={`${id}${n}`} cx={cx} cy={cy} r={r}>
      {stops.map(([col, o, a], k) => (
        <Stop key={k} offset={o} {...stopProps(c(col), a)} />
      ))}
    </RadialGradient>
  );
  const stars = (seed: number, n: number, bottom: number, colour = '#F2ECDD') =>
    starsFor(seed, n, bottom).map((s, k) => <Circle key={k} cx={s.x} cy={s.y} r={s.r} fill={c(colour)} opacity={s.o} />);
  // Short rays round a point, fading outward (the canvas's repeating conic gradient, masked).
  const rays = (cx: number, cy: number, r0: number, r1: number, n: number, colour: string, opacity: number) =>
    Array.from({ length: n }, (_, k) => {
      const a = (k / n) * 2 * Math.PI;
      const w = (2 * Math.PI) / n / 4;
      const p = (ang: number, r: number) => `${(cx + r * Math.sin(ang)).toFixed(2)} ${(cy - r * Math.cos(ang)).toFixed(2)}`;
      return <Path key={k} d={`M${p(a - w, r0)} L${p(a, r1)} L${p(a + w, r0)} Z`} fill={c(colour)} opacity={opacity} />;
    });

  switch (code) {
    case 'streak_3': // First light: pre-dawn, a spark on the horizon
      return {
        defs: (
          <>
            {vertical(0, [['#1B2350', 0], ['#3A3470', 0.52], ['#D98C7A', 0.84], ['#F7C79A', 1]])}
            {radial(1, [['#FFECC8', 0, 0.95], ['#FFD2A0', 0.3, 0.5], ['#FFC896', 0.7, 0]], '50%', '50%', '50%')}
          </>
        ),
        body: (
          <>
            <Rect width={100} height={100} fill={u(0)} />
            {stars(11, 5, 0.45)}
            <Circle cx={50} cy={80} r={25} fill={u(1)} />
            <Rect x={0} y={80} width={100} height={1} fill={c('#FFECD2')} opacity={0.8} />
            <Rect x={0} y={81} width={100} height={19} fill={c('#282250')} opacity={0.55} />
          </>
        ),
      };
    case 'streak_7': // Sunrise: half the sun above the horizon, short rays
      return {
        defs: (
          <>
            {vertical(0, [['#7A76C0', 0], ['#E9A9A6', 0.55], ['#FFD9A8', 1]])}
            {radial(1, DISC.sunrise.stops)}
            {vertical(2, [['#8A6A9E', 0], ['#5A4A86', 1]])}
            <ClipPath id={`${id}sky`}>
              <Rect width={100} height={66} />
            </ClipPath>
          </>
        ),
        body: (
          <>
            <Rect width={100} height={100} fill={u(0)} />
            <G clipPath={`url(#${id}sky)`}>
              {rays(50, 66, 27, 42, 16, '#FFECC8', 0.55)}
              <Circle cx={50} cy={66} r={25} fill={u(1)} />
            </G>
            <Rect x={0} y={66} width={100} height={34} fill={u(2)} />
            <Rect x={0} y={66} width={100} height={1} fill={c('#FFF0DC')} opacity={0.9} />
          </>
        ),
      };
    case 'streak_14': // The sun: whole, in a morning sky, the mark pressed in
      return {
        defs: (
          <>
            {vertical(0, [['#A9D8EE', 0], ['#DDEFF2', 0.6], ['#FBEBD6', 1]])}
            {radial(1, DISC.sunrise.stops)}
          </>
        ),
        body: (
          <>
            <Rect width={100} height={100} fill={u(0)} />
            {rays(50, 50, 30, 46, 18, '#FFD6A0', 0.6)}
            <Circle cx={50} cy={50} r={28} fill={u(1)} />
          </>
        ),
        mark: { size: 0.3, surface: DISC.sunrise.surface },
      };
    case 'streak_30': // Half moon: night, the right half lit (the shade is drawn over the mark)
      return {
        defs: (
          <>
            {vertical(0, [['#0B1026', 0], ['#1A2150', 1]])}
            {radial(1, DISC.teal.stops)}
          </>
        ),
        body: (
          <>
            <Rect width={100} height={100} fill={u(0)} />
            {stars(23, 7, 0.7)}
            <Circle cx={50} cy={50} r={28} fill={u(1)} />
          </>
        ),
        mark: { size: 0.3, surface: DISC.teal.surface },
      };
    case 'streak_100': // Full moon among stars, its faint ring
      return {
        defs: (
          <>
            {radial(0, [['#1D2560', 0], ['#0B1026', 0.75]], '50%', '50%', '50%')}
            {radial(1, DISC.teal.stops)}
          </>
        ),
        body: (
          <>
            <Rect width={100} height={100} fill={u(0)} />
            {stars(37, 14, 1)}
            <Circle cx={50} cy={50} r={42} fill="none" stroke={c('#D6E8EC')} strokeOpacity={0.28} strokeWidth={1} />
            <Circle cx={50} cy={50} r={28} fill={u(1)} />
          </>
        ),
        mark: { size: 0.3, surface: DISC.teal.surface },
      };
    case 'first_session': // First breath: the glassy breathing orb
      return {
        defs: (
          <>
            {radial(0, [['#6FD6CF', 0, 0.28], ['#6FD6CF', 0.7, 0.06]], '50%', '50%', '50%')}
            {radial(1, [['#FFFFFF', 0, 0.8], ['#B9ECE8', 0.4, 0.55], ['#6FD6CF', 1, 0.5]], '34%', '30%', '60%')}
          </>
        ),
        body: (
          <>
            <Rect width={100} height={100} fill={c('#10183A')} />
            <Rect width={100} height={100} fill={u(0)} />
            <Circle cx={50} cy={50} r={29} fill={u(1)} />
          </>
        ),
        mark: { size: 0.3, surface: TONE.glow },
      };
    case 'all_breathing': // Every breath: the four exercises' tones round the mark
      return {
        defs: (
          <>
            {(['glow', 'dusk', 'dawn', 'bloom'] as const).map((k, n) => (
              <React.Fragment key={k}>{radial(n, [['#FFFFFF', 0], [TONE[k], 0.6]], '35%', '30%', '60%')}</React.Fragment>
            ))}
          </>
        ),
        body: (
          <>
            <Rect width={100} height={100} fill={c('#10183A')} />
            {[
              [0, -1],
              [1, 0],
              [0, 1],
              [-1, 0],
            ].map(([dx, dy], n) => (
              <Circle key={n} cx={50 + dx * 24} cy={50 + dy * 24} r={13} fill={u(n)} />
            ))}
          </>
        ),
        mark: { size: 0.22, surface: '#9FA6CC' },
      };
    case 'all_scenes': // Every scene: the four scenes' colours in one round
      return {
        defs: radial(0, [['#FFFFFF', 0, 0.45], ['#FFFFFF', 0.55, 0]], '35%', '30%', '50%'),
        body: (
          <>
            <Rect width={100} height={100} fill={c('#10183A')} />
            {([SCENE.fire, SCENE.rain, SCENE.forest, SCENE.ocean] as const).map((col, k) => {
              // Quarters clockwise from the top.
              const p = (q: number) => {
                const a = (q / 4) * 2 * Math.PI;
                return `${(50 + 31 * Math.sin(a)).toFixed(2)} ${(50 - 31 * Math.cos(a)).toFixed(2)}`;
              };
              return <Path key={k} d={`M50 50 L${p(k)} A31 31 0 0 1 ${p(k + 1)} Z`} fill={c(col)} />;
            })}
            <Circle cx={50} cy={50} r={31} fill={u(0)} />
          </>
        ),
        mark: { size: 0.3, surface: '#8C8FC0' },
      };
    case 'all_skies': // Every sky: morning sun, evening sun and moon along an arc
      return {
        defs: (
          <>
            <LinearGradient id={`${id}0`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset={0} {...stopProps(c('#BFE0EE'))} />
              <Stop offset={0.5} {...stopProps(c('#E9A9A6'))} />
              <Stop offset={1} {...stopProps(c('#1A2150'))} />
            </LinearGradient>
            {radial(1, DISC.sunrise.stops)}
            {radial(2, DISC.dusk.stops)}
            {radial(3, DISC.teal.stops)}
          </>
        ),
        body: (
          <>
            <Rect width={100} height={100} fill={u(0)} />
            <Circle cx={22} cy={60} r={13} fill={u(1)} />
            <Circle cx={50} cy={40} r={13} fill={u(2)} />
            <Circle cx={78} cy={60} r={13} fill={u(3)} />
          </>
        ),
      };
  }
}

const styles = StyleSheet.create({
  locked: {
    opacity: 0.45,
  },
});
