import React, { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { MOOD_STYLE } from '@/constants/moods';
import { MOOD_ORDER, type Mood } from '@/lib/journal';
import { stopProps } from '@/lib/svgStop';

export interface BloomShape {
  /** Leaf rotation in degrees about the leaf base; negative opens the bloom. */
  fold: number;
  /** Head centre y in the 200×200 viewBox. */
  headY: number;
}

export interface BloomStyle extends BloomShape {
  /** Ring and leaf base colour. */
  color: string;
  /** Leaf highlight and head colour. */
  hi: string;
  /** Halo colour (already includes its alpha). */
  glow: string;
  ringOpacity: number;
}

/** How far each mood's bloom opens: leaves fold shut when heavy, open wide when light. */
const SHAPES: Record<Mood, BloomShape & { ringOpacity: number }> = {
  angry: { fold: 38, headY: 76, ringOpacity: 0.4 },
  anxious: { fold: 24, headY: 72, ringOpacity: 0.48 },
  sad: { fold: 12, headY: 78, ringOpacity: 0.55 },
  neutral: { fold: -6, headY: 66, ringOpacity: 0.7 },
  calm: { fold: -18, headY: 63, ringOpacity: 0.85 },
  hopeful: { fold: -26, headY: 60, ringOpacity: 0.95 },
  joyful: { fold: -34, headY: 57, ringOpacity: 1 },
};

/**
 * The seven mood states, heavy → light (`MOOD_ORDER`): the canvas's
 * "Houna bloom — mood states" sheet, identical in Night and Day, with
 * colours from constants/moods.ts.
 */
export const MOOD_BLOOMS = Object.fromEntries(
  MOOD_ORDER.map((m) => [m, { ...SHAPES[m], color: MOOD_STYLE[m].color, hi: MOOD_STYLE[m].hi, glow: MOOD_STYLE[m].glow }]),
) as Record<Mood, BloomStyle>;

/** Heavy → light, the slider's order. */
export const BLOOM_ORDER: Mood[] = MOOD_ORDER;

/** The Home top-bar glyph from the canvas: a gently opened bloom. */
export const HOME_BLOOM: BloomShape = { fold: -14, headY: 64 };

interface MoodBloomProps {
  size: number;
  color: string;
  shape: BloomShape;
  /** Leaf highlight/head colour — when set, leaves get the canvas's radial gradient. */
  hi?: string;
  /** Ring stroke; the canvas uses 14 for the small Home glyph, 12 in the check-in. */
  ringWidth?: number;
  ringOpacity?: number;
}

/**
 * "Houna bloom" — the mark as a mood figure: ring, two leaves, head. Leaf
 * geometry is copied from the canvas: the left leaf rotates by `fold` about
 * its base (100,152), the right by `-fold`.
 */
export default function MoodBloom({ size, color, shape, hi, ringWidth = 14, ringOpacity = 1 }: MoodBloomProps) {
  const gradId = `leaf${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { fold, headY } = shape;
  const leafFill = hi ? `url(#${gradId})` : color;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {hi && (
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="40%" r="60%">
            <Stop offset="0" {...stopProps(hi)} />
            <Stop offset="1" {...stopProps(color)} />
          </RadialGradient>
        </Defs>
      )}
      <Circle cx={100} cy={100} r={84} fill="none" stroke={color} strokeWidth={ringWidth} opacity={ringOpacity} />
      <Path d="M100 152 C 72 142 50 116 54 84 C 80 90 98 116 100 152 Z" fill={leafFill} transform={`rotate(${fold} 100 152)`} />
      <Path d="M100 152 C 128 142 150 116 146 84 C 120 90 102 116 100 152 Z" fill={leafFill} transform={`rotate(${-fold} 100 152)`} />
      <Circle cx={100} cy={headY} r={16} fill={hi ?? color} />
    </Svg>
  );
}

/* ──────────────── Animated bloom (check-in sheet, journal) ──────────────── */

/** Canvas `breathe` / `glowpulse` loop: 6s, scale .95↔1.05, halo opacity .65↔1. */
const BREATH_MS = 6000;
const MORPH_MS = 420;

function parseColor(c: string): [number, number, number, number] {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = c.match(/[\d.]+/g) ?? ['0', '0', '0', '1'];
  return [Number(m[0]), Number(m[1]), Number(m[2]), m[3] !== undefined ? Number(m[3]) : 1];
}

function mixColor(a: string, b: string, t: number): string {
  const x = parseColor(a);
  const y = parseColor(b);
  const v = x.map((n, i) => n + (y[i] - n) * t);
  return `rgba(${Math.round(v[0])},${Math.round(v[1])},${Math.round(v[2])},${v[3].toFixed(3)})`;
}

function mixStyle(a: BloomStyle, b: BloomStyle, t: number): BloomStyle {
  return {
    color: mixColor(a.color, b.color, t),
    hi: mixColor(a.hi, b.hi, t),
    glow: mixColor(a.glow, b.glow, t),
    fold: a.fold + (b.fold - a.fold) * t,
    headY: a.headY + (b.headY - a.headY) * t,
    ringOpacity: a.ringOpacity + (b.ringOpacity - a.ringOpacity) * t,
  };
}

interface BreathingBloomProps {
  mood: Mood;
  /** Halo box; the bloom itself is 80% of it (canvas: 250 halo, 200 bloom). */
  size: number;
}

/**
 * The check-in figure: morphs between moods (leaves fold/open, colour
 * cools/warms) and breathes on the canvas's slow 6s loop. With Reduce
 * Motion on, it neither breathes nor morphs — it just changes state.
 */
export function BreathingBloom({ mood, size }: BreathingBloomProps) {
  const target = MOOD_BLOOMS[mood];
  const [style, setStyle] = useState<BloomStyle>(target);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fromRef = useRef<BloomStyle>(target);
  const breath = useRef(new Animated.Value(0)).current;
  const haloId = `halo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  // Morph from wherever the figure currently is to the new mood.
  useEffect(() => {
    if (reduceMotion) {
      fromRef.current = target;
      setStyle(target);
      return;
    }
    const from = fromRef.current;
    const start = Date.now();
    let frame = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / MORPH_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = mixStyle(from, target, eased);
      fromRef.current = next;
      setStyle(next);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `target` is derived from `mood`; re-run only when the mood changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      breath.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: BREATH_MS / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, reduceMotion]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] });
  const haloOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const bloomSize = size * 0.8;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: haloOpacity }]}>
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id={haloId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" {...stopProps(style.glow)} />
              <Stop offset="1" {...stopProps(style.glow, 0)} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${haloId})`} />
        </Svg>
      </Animated.View>
      <Animated.View style={{ transform: [{ scale }] }}>
        <MoodBloom
          size={bloomSize}
          color={style.color}
          hi={style.hi}
          shape={style}
          ringWidth={12}
          ringOpacity={style.ringOpacity}
        />
      </Animated.View>
    </View>
  );
}
