import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { stopProps } from '@/lib/svgStop';
import { star8Points } from '@/lib/khatam';
import { alpha, flatten } from '@/constants/theme';
import Orb from '@/components/ui/Orb';
import PressedMark from '@/components/ui/PressedMark';
import HounaMark from '@/components/HounaMark';
import { useStarfield } from '@/contexts/StarfieldContext';
import { WAVE_STEPS, useCalmLoop, wave } from '@/hooks/useCalmLoop';
import type { IconTileTone } from '@/components/ui/IconTile';
import { BREATH_PATTERNS } from '@/constants/breathPatterns';

/** Animations on the stage and the screen glow stay on the UI thread on native. */
export const NATIVE_DRIVER = Platform.OS !== 'web';

const SIZE = 250;
const C = SIZE / 2;
/** Radius of the ring of dots. */
const R = 110;
const DOTS = 28;
/** The orb is drawn at full size and scaled down: at rest it's the canvas's 74px pearl. */
const ORB = 176;
const REST = 74 / ORB;
/** The Houna mark pressed into the orb, in the orb's full-size frame (so ~27px at rest). */
const MARK = 64;
/** The hairline "middle" outline. */
const MIDDLE = 137;
/** The rim that flashes as the orb reaches full size: its width in the orb's full-size frame. */
const RIM = 2.5;

interface BreathStageProps {
  tone: IconTileTone;
  /** 0 at rest → 1 filling the ring. Shared with the hub's screen glow. */
  breath: Animated.Value;
  /** Light the dots up to this fraction, clockwise from the top (grounding steps). */
  progress?: number;
  /** The orb is full: its rim lights, and stays lit while this holds (a breath held at the top). */
  full?: boolean;
  /** Centred over the orb (a count, in ink). */
  children?: React.ReactNode;
}

/**
 * The Breathe stage from the canvas (grounding, muscle relaxation): a ring of
 * dots graded in size and light, a hairline middle outline, and a
 * lit orb that inflates and deflates with `breath`. While the player says
 * the orb is `full`, its rim and the Houna mark in it are lit: they light
 * as the orb fills, hold through a held breath, and fade as the orb lets go.
 */
export function BreathStage({ tone, breath, progress, full = false, children }: BreathStageProps) {
  const { colors } = useTheme();
  const fg = colors.tones[tone].fg;
  // The canvas ring pairs Houna glow with dusk; the other tones keep to their own colour.
  const partner = tone === 'glow' ? colors.tones.dusk.fg : fg;

  const dots = useMemo(
    () =>
      Array.from({ length: DOTS }, (_, k) => {
        const tt = k / DOTS;
        const lit = progress !== undefined && (k + 0.5) / DOTS <= progress;
        const s = lit ? 7 : 3 + 4 * Math.sin(tt * Math.PI);
        const o = lit ? 1 : (0.2 + 0.8 * Math.sin(tt * Math.PI)) * (progress !== undefined ? 0.4 : 1);
        return { ...position(tt), tt, s, o, c: lit || k < DOTS / 2 ? fg : partner };
      }),
    [progress, fg, partner],
  );
  // The ring turns as Home's does, but not while grounding lights it from the top.
  const turns = progress === undefined;

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [REST, 1] });
  const rim = useRimLight(full);
  // Glass rather than solid: the same lit sphere (highlight at the top left, the tone deepening
  // to the rim), but translucent, so the sky and the dots show faintly through it.
  const stops: [string, number][] = [
    [alpha('#FFFFFF', 0.76), 0],
    [alpha(flatten(alpha(fg, 0.35), '#FFFFFF'), 0.52), 0.4],
    [alpha(fg, 0.43), 1],
  ];

  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <DriftingDots dots={dots} turns={turns} />
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={C - 0.5} cy={C - 0.5} r={MIDDLE / 2} fill="none" stroke={colors.text} strokeOpacity={0.14} strokeWidth={1} />
      </Svg>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Orb
          size={ORB}
          fx={0.34}
          fy={0.3}
          stops={stops}
          glow={`0 0 90px ${alpha(fg, 0.38)}`}
        />
        {/* Inside the breathing scale, so the mark grows and shrinks as one with the shape. */}
        <PressedMark size={MARK} surface={fg} />
        {/* The mark lit with the rim: drawn solid and faded as one layer, as the pressed mark is. */}
        <Animated.View style={[styles.centre, { opacity: rim }]} pointerEvents="none" needsOffscreenAlphaCompositing>
          <HounaMark size={MARK} color={fg} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.rim,
            {
              borderRadius: ORB / 2,
              borderColor: fg,
              boxShadow: `0 0 16px ${alpha(fg, 0.8)}`,
              opacity: rim,
            },
          ]}
        />
      </Animated.View>
      {!!children && <View style={styles.centre}>{children}</View>}
    </View>
  );
}

/* ──────────────── 4-7-8: the glass orb ──────────────── */

/** The glass orb's full size, and its size at rest as a fraction of that. */
const GLASS = 240;
const GLASS_REST = 0.6;
/** The mark pressed into the glass, in the orb's full-size frame. It stays at the stage's centre, the anchor. */
const GLASS_MARK = 72;
/** How far below the middle the phase word sits (unscaled): under the mark, which no longer lifts. */
const WORD_DROP = 54;

interface OrbStageProps {
  tone: IconTileTone;
  /** 0 at rest → 1 full. Shared with the hub's screen glow. */
  breath: Animated.Value;
  /** The orb is full (the hold at the top): its rim lights. */
  full?: boolean;
  /** The phase, written inside the orb (shown only during a session). */
  word?: string;
}

/**
 * 4-7-8's stage (canvas "Players — 4-7-8 with the glass orb"): a large glass orb, no dots,
 * filling and emptying with `breath`, the Houna mark pressed into it and the phase word beneath
 * the mark (it stays at the stage's centre, the anchor), a soft halo that breathes with it, and motes drifting up past it. Its rim and the
 * mark light through the hold, as the other stages' orbs do.
 */
export function OrbStage({ tone, breath, full = false, word }: OrbStageProps) {
  const { colors, isNight } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const fg = colors.tones[tone].fg;
  const hue = colors.tones[tone].hue;
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [GLASS_REST, 1] });
  // Never past the stage's edge, where a short screen's scroll view would cut it straight.
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const haloOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const rim = useRimLight(full);
  // The glass as the mark is pressed into it: the tone faintly over the ground.
  const surface = flatten(alpha(hue, 0.22), colors.background);
  // Clear glass: a white highlight up and to the left, the tone faint through the middle and
  // deepening a little at the edge. Brighter by day, where the ground is pale.
  const stops: [string, number][] = [
    [alpha('#FFFFFF', isNight ? 0.32 : 0.85), 0],
    [alpha(hue, 0.16), 0.45],
    [alpha(hue, 0.26), 1],
  ];

  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Motes color={alpha(hue, 0.7)} />
      <Animated.View pointerEvents="none" style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="orbHalo" cx="50%" cy="50%" r="50%">
              <Stop offset={0} {...stopProps(alpha(hue, 0.32))} />
              <Stop offset={1} {...stopProps(alpha(hue, 0))} />
            </RadialGradient>
          </Defs>
          <Circle cx={C} cy={C} r={C} fill="url(#orbHalo)" />
        </Svg>
      </Animated.View>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Orb size={GLASS} fx={0.35} fy={0.3} stops={stops} glow={`0 0 40px ${alpha(hue, 0.25)}`} />
        <View pointerEvents="none" style={[styles.glassEdge, { borderColor: alpha(hue, 0.45) }]} />
        {/* Inside the breathing scale, so the mark grows and shrinks as one with the glass. */}
        <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <PressedMark size={GLASS_MARK} surface={surface} />
          <Animated.View style={[styles.centre, { opacity: rim }]} needsOffscreenAlphaCompositing>
            <HounaMark size={GLASS_MARK} color={fg} />
          </Animated.View>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[styles.glassEdge, styles.glassRim, { borderColor: fg, boxShadow: `0 0 16px ${alpha(fg, 0.8)}`, opacity: rim }]}
        />
      </Animated.View>
      {!!word && (
        <View style={[styles.centre, styles.wordPlace]} pointerEvents="none">
          <ArrivingWord key={word}>
            <Text
              style={[
                isRTL ? styles.wordArabic : styles.word,
                { color: isNight ? '#FFFFFF' : colors.text, fontFamily: isRTL ? fonts.regular : fonts.numeral },
              ]}
            >
              {word}
            </Text>
          </ArrivingWord>
        </View>
      )}
    </View>
  );
}

/** Fades its child in as it mounts: key it on what it shows. */
function ArrivingWord({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE_DRIVER });
    anim.start();
    return () => anim.stop();
  }, [v]);
  return <Animated.View style={{ opacity: v }}>{children}</Animated.View>;
}

/** The motes drifting up past the orb. */
const MOTES = Array.from({ length: 12 }, (_, i) => ({
  // Spread across the stage and a little beyond it, low down.
  x: ((i * 53 + 23) % 330) - 165,
  y: 60 + ((i * 97) % 90),
  size: 1.5 + (i % 3),
  // Rises per minute (so 12–20s each) and where in its rise it starts.
  laps: [5, 4, 3, 4, 5][i % 5],
  offset: (i * 0.37) % 1,
}));
const MOTE_RISE = 240;

/**
 * Motes rising and fading, all from one minute-long loop: each mote's rise is a sawtooth of it,
 * so they run natively from a single value. Still under Reduce Motion (useCalmLoop).
 */
function Motes({ color }: { color: string }) {
  const clock = useCalmLoop((v) =>
    Animated.loop(Animated.timing(v, { toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: NATIVE_DRIVER })),
  );
  const motes = useMemo(
    () =>
      MOTES.map((m) => {
        const rise = clock.interpolate(sawtooth(m.laps, m.offset));
        return {
          ...m,
          translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [m.y, m.y - MOTE_RISE] }),
          opacity: rise.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.7, 0] }),
        };
      }),
    [clock],
  );
  return (
    <View style={styles.centre} pointerEvents="none">
      {motes.map((m, k) => (
        <Animated.View
          key={k}
          style={[
            styles.dot,
            {
              width: m.size,
              height: m.size,
              borderRadius: m.size / 2,
              backgroundColor: color,
              opacity: m.opacity,
              transform: [{ translateX: m.x }, { translateY: m.translateY }],
            },
          ]}
        />
      ))}
    </View>
  );
}

/** Interpolation for frac(laps · t + offset) as t runs 0 → 1: a rise that starts over `laps` times. */
function sawtooth(laps: number, offset: number) {
  const inputRange = [0];
  const outputRange = [offset];
  for (let j = 1; j <= laps; j++) {
    const t = (j - offset) / laps;
    if (t <= 0 || t >= 1) continue;
    inputRange.push(t - 1e-4, t);
    outputRange.push(1, 0);
  }
  inputRange.push(1);
  outputRange.push(offset);
  return { inputRange, outputRange };
}

/* ──────────────── The physiological sigh: two lines to rise to ──────────────── */

/** Where the sigh's first breath stops, as the glass's scale (its fill, on the orb's rest-to-full range). */
const SIGH_FIRST = GLASS_REST + (1 - GLASS_REST) * BREATH_PATTERNS['physiological-sigh'][0].fill;

/**
 * The physiological sigh's stage (canvas "Round 2 — the physiological sigh"): 4-7-8's glass orb
 * with two lines to rise to. The first breath fills it to the dashed line; the short top-up takes
 * it to the outer ring, which lights, with the mark, as the glass meets it (read from `breath`
 * itself, so it lights exactly there); then the long, slow fall. The mark is pressed in at the
 * stage's centre, where the others' sit. Phase words sit beneath, as box breathing's do.
 */
export function SighStage({ tone, breath }: { tone: IconTileTone; breath: Animated.Value }) {
  const { colors, isNight } = useTheme();
  const fg = colors.tones[tone].fg;
  const hue = colors.tones[tone].hue;
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [GLASS_REST, 1] });
  const haloScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const haloOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const lit = breath.interpolate({ inputRange: [0, 0.9, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' });
  const surface = flatten(alpha(hue, 0.22), colors.background);
  const stops: [string, number][] = [
    [alpha('#FFFFFF', isNight ? 0.32 : 0.85), 0],
    [alpha(hue, 0.16), 0.45],
    [alpha(hue, 0.26), 1],
  ];
  const line = isNight ? alpha(colors.text, 0.22) : alpha(colors.text, 0.2);
  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View pointerEvents="none" style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
        <Svg width={SIZE} height={SIZE}>
          <Defs>
            <RadialGradient id="sighHalo" cx="50%" cy="50%" r="50%">
              <Stop offset={0} {...stopProps(alpha(hue, 0.3))} />
              <Stop offset={1} {...stopProps(alpha(hue, 0))} />
            </RadialGradient>
          </Defs>
          <Circle cx={C} cy={C} r={C} fill="url(#sighHalo)" />
        </Svg>
      </Animated.View>
      {/* The two lines: the first breath's (dashed), the top-up's (the outer ring). */}
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Circle cx={C} cy={C} r={(GLASS * SIGH_FIRST) / 2} fill="none" stroke={line} strokeWidth={1} strokeDasharray="4 5" />
        <Circle cx={C} cy={C} r={GLASS / 2} fill="none" stroke={line} strokeOpacity={0.75} strokeWidth={1} />
      </Svg>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Orb size={GLASS} fx={0.35} fy={0.3} stops={stops} glow={`0 0 40px ${alpha(hue, 0.25)}`} />
        <View pointerEvents="none" style={[styles.glassEdge, { borderColor: alpha(hue, 0.45) }]} />
      </Animated.View>
      {/* Not inside the scale: the mark stays its size, pressed into the glass at the centre. */}
      <PressedMark size={SIGH_MARK} surface={surface} />
      <Animated.View style={[styles.centre, { opacity: lit }]} pointerEvents="none" needsOffscreenAlphaCompositing>
        <HounaMark size={SIGH_MARK} color={fg} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.sighRing, { borderColor: fg, boxShadow: `0 0 18px ${alpha(fg, 0.8)}`, opacity: lit }]}
      />
    </View>
  );
}
/** The sigh's mark: the size 4-7-8's rests at, as the star's. */
const SIGH_MARK = 44;

/* ──────────────── Box breathing: the star ──────────────── */

/** The squares' half-diagonal; the bead runs round the squares' sides. */
const STAR_R = 112;
const STAR_HALF = STAR_R / Math.SQRT2;

const STAR = star8Points(C, C, STAR_R);
const SQUARE = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]
  .map(([x, y]) => `${(C + x * STAR_HALF).toFixed(2)},${(C + y * STAR_HALF).toFixed(2)}`)
  .join(' ');

interface StarStageProps {
  tone: IconTileTone;
  /** 0 → 4 around the square, one side per phase. */
  trace: Animated.Value;
  showTracer?: boolean;
  /** Holds so far, 0 → 4: the second square turns 22.5° through each hold, and at 2 they make the star. */
  turn: Animated.Value;
  /** A hold: the squares' edges and the mark light, as the orbs' rims do at the top of a breath. */
  full?: boolean;
}

/** The mark pressed into the star's middle: the size 4-7-8's glass mark rests at (72 × 0.6), in the same place, the stage's centre. */
const STAR_MARK = 44;

/**
 * Box breathing's stage (canvas "Players — box breathing with the star"): the light traces a
 * square, one side a phase; a second square in the tone turns in by 22.5° through each hold, and
 * every other round the two meet as the eight-point star, which lights. The mark is pressed into the
 * middle, where the other stages' marks sit; through each hold the squares' edges and the mark
 * light in the tone, as the orbs' rims do (`full`).
 */
export function StarStage({ tone, trace, showTracer, turn, full = false }: StarStageProps) {
  const { colors, isNight } = useTheme();
  const fg = colors.tones[tone].fg;
  const hue = colors.tones[tone].hue;
  const rotate = turn.interpolate({ inputRange: [0, 4], outputRange: ['0deg', '90deg'] });
  const starOpacity = turn.interpolate({ inputRange: [1.5, 2, 2.5], outputRange: [0, 0.9, 0], extrapolate: 'clamp' });
  const rim = useRimLight(full);
  // As the glass is pressed: the tone faintly over the ground.
  const surface = flatten(alpha(hue, 0.22), colors.background);
  // An edge lit: a soft wide stroke under a bright one.
  const litSquare = (
    <Svg width={SIZE} height={SIZE}>
      <Polygon points={SQUARE} fill="none" stroke={hue} strokeOpacity={0.35} strokeWidth={7} strokeLinejoin="round" />
      <Polygon points={SQUARE} fill="none" stroke={fg} strokeWidth={2.5} strokeLinejoin="round" />
    </Svg>
  );

  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: starOpacity }]}>
        <Svg width={SIZE} height={SIZE}>
          <Polygon points={STAR} fill={alpha(hue, 0.2)} stroke={fg} strokeWidth={1.5} strokeLinejoin="round" />
        </Svg>
      </Animated.View>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Polygon points={SQUARE} fill="none" stroke={colors.text} strokeOpacity={0.4} strokeWidth={1.2} />
      </Svg>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: rim }]}>
        {litSquare}
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={SIZE} height={SIZE}>
          <Polygon points={SQUARE} fill="none" stroke={fg} strokeOpacity={0.85} strokeWidth={1.2} />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: rim }]}>{litSquare}</Animated.View>
      </Animated.View>
      <PressedMark size={STAR_MARK} surface={surface} />
      {/* The mark lit with the edges: drawn solid and faded as one layer, as the pressed mark is. */}
      <Animated.View style={[styles.centre, { opacity: rim }]} pointerEvents="none" needsOffscreenAlphaCompositing>
        <HounaMark size={STAR_MARK} color={fg} />
      </Animated.View>
      {showTracer && <Tracer trace={trace} color={isNight ? '#FFFFFF' : fg} glow={hue} half={STAR_HALF} />}
    </View>
  );
}

/** The rim's light: up quickly as the orb is full, down more slowly as it lets go. */
function useRimLight(full: boolean) {
  const light = useRef(new Animated.Value(full ? 1 : 0)).current;
  useEffect(() => {
    const anim = Animated.timing(light, {
      toValue: full ? 1 : 0,
      duration: full ? 150 : 500,
      easing: full ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
      useNativeDriver: NATIVE_DRIVER,
    });
    anim.start();
    return () => anim.stop();
  }, [full, light]);
  return light;
}

/**
 * The dots, moving as Home's ring does and on the same clock (StarfieldContext): each drifts
 * gently up and down and fades a little and back, a step behind its neighbour, so a slow ripple
 * travels round; a ring also turns, a lap every two minutes. It doesn't breathe with Home's 5s
 * rhythm: the orb breathes at the exercise's own pace, and two rhythms would pull against it.
 */
function DriftingDots({ dots, turns }: { dots: { cx: number; cy: number; tt: number; s: number; o: number; c: string }[]; turns: boolean }) {
  const { drift, turn } = useStarfield()!.clock;
  const animated = useMemo(
    () =>
      dots.map((d) => ({
        ...d,
        // Drift: 3px either way, one lap behind the next dot round the ring.
        translateY: drift.interpolate({ inputRange: WAVE_STEPS, outputRange: wave(-d.tt).map((w) => d.cy - C + 3 * w) }),
        // Fade: down to three-fifths of its light and back, twice round the ring per lap.
        opacity: drift.interpolate({ inputRange: WAVE_STEPS, outputRange: wave(-2 * d.tt + 0.25).map((w) => d.o * (0.6 + 0.4 * w)) }),
      })),
    [dots, drift],
  );
  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={[styles.centre, turns && { transform: [{ rotate }] }]} pointerEvents="none">
      {animated.map((d, k) => (
        <Animated.View
          key={k}
          style={[
            styles.dot,
            {
              width: d.s,
              height: d.s,
              borderRadius: d.s / 2,
              backgroundColor: d.c,
              opacity: d.opacity,
              // Offsets from the centre, not left/top, so it draws the same in either direction.
              transform: [{ translateX: d.cx - C }, { translateY: d.translateY }],
            },
          ]}
        />
      ))}
    </Animated.View>
  );
}

/** A bright bead travelling a square — one side per box-breathing phase. */
function Tracer({ trace, color, glow, half }: { trace: Animated.Value; color: string; glow: string; half: number }) {
  // Offsets from the centre, not start/left, so it draws the same in either direction.
  const translateX = trace.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: [-half, half, half, -half, -half] });
  const translateY = trace.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: [-half, -half, half, half, -half] });
  return (
    <View style={styles.centre} pointerEvents="none">
      <Animated.View
        style={[
          styles.tracer,
          { backgroundColor: color, boxShadow: `0 0 14px ${alpha(glow, 0.9)}`, transform: [{ translateX }, { translateY }] },
        ]}
      />
    </View>
  );
}

/** Clockwise round the ring from 12 o'clock. */
function position(tt: number) {
  const a = tt * Math.PI * 2 - Math.PI / 2;
  return { cx: C + R * Math.cos(a), cy: C + R * Math.sin(a) };
}

const styles = StyleSheet.create({
  stage: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centre: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: RIM,
  },
  tracer: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
  },
  glassEdge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: GLASS / 2,
    borderWidth: 1,
  },
  glassRim: {
    borderWidth: RIM,
  },
  word: {
    fontSize: 30,
    textAlign: 'center',
  },
  wordArabic: {
    fontSize: 28,
    lineHeight: 44,
    textAlign: 'center',
  },
  sighRing: {
    position: 'absolute',
    left: C - GLASS / 2 - 1,
    top: C - GLASS / 2 - 1,
    width: GLASS + 2,
    height: GLASS + 2,
    borderRadius: GLASS / 2 + 1,
    borderWidth: RIM,
  },
  wordPlace: {
    transform: [{ translateY: WORD_DROP }],
  },
});
