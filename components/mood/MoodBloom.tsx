import React, { useEffect, useId, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import type { MoodTag } from '@/lib/journal';

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

/**
 * The eight mood states from the canvas's "Houna bloom — mood states"
 * sheet (identical in Night and Day), heavy → light — the same order as
 * `MOOD_VALUES` in lib/journal.ts. Angry and joyful extend the original six
 * at each end: angry folds tightest, joyful opens widest.
 */
export const MOOD_BLOOMS: Record<MoodTag, BloomStyle> = {
  angry: { color: '#E36F5E', hi: '#FFE1DA', glow: 'rgba(227,111,94,0.42)', fold: 38, headY: 76, ringOpacity: 0.4 },
  frustrated: { color: '#EA90A8', hi: '#FFE3EB', glow: 'rgba(234,144,168,0.42)', fold: 30, headY: 74, ringOpacity: 0.45 },
  anxious: { color: '#F0B27A', hi: '#FFEEDC', glow: 'rgba(240,178,122,0.42)', fold: 20, headY: 71, ringOpacity: 0.5 },
  sad: { color: '#82A4EE', hi: '#E2EBFF', glow: 'rgba(130,164,238,0.42)', fold: 12, headY: 78, ringOpacity: 0.5 },
  tired: { color: '#AE9FF2', hi: '#EEEAFF', glow: 'rgba(174,159,242,0.42)', fold: 4, headY: 72, ringOpacity: 0.6 },
  neutral: { color: '#D2CBB9', hi: '#FFFFFF', glow: 'rgba(210,203,185,0.34)', fold: -6, headY: 66, ringOpacity: 0.7 },
  calm: { color: '#62D2C9', hi: '#E4FBF7', glow: 'rgba(98,210,201,0.48)', fold: -22, headY: 62, ringOpacity: 0.9 },
  joyful: { color: '#F2C76B', hi: '#FFF3D6', glow: 'rgba(242,199,107,0.46)', fold: -32, headY: 58, ringOpacity: 1 },
};

/** Heavy → light, the slider's order. */
export const BLOOM_ORDER: MoodTag[] = ['angry', 'frustrated', 'anxious', 'sad', 'tired', 'neutral', 'calm', 'joyful'];

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
            <Stop offset="0" stopColor={hi} />
            <Stop offset="1" stopColor={color} />
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
  mood: MoodTag;
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
              <Stop offset="0" stopColor={style.glow} />
              <Stop offset="1" stopColor={style.glow} stopOpacity={0} />
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
