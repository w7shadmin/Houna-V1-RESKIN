import React, { useMemo } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, flatten } from '@/constants/theme';
import Orb from '@/components/ui/Orb';
import PressedMark from '@/components/ui/PressedMark';
import { useStarfield } from '@/contexts/StarfieldContext';
import { WAVE_STEPS, wave } from '@/hooks/useCalmLoop';
import type { IconTileTone } from '@/components/ui/IconTile';

/** Animations on the stage and the screen glow stay on the UI thread on native. */
export const NATIVE_DRIVER = Platform.OS !== 'web';

const SIZE = 250;
const C = SIZE / 2;
/** Radius of the ring of dots; half-side of the square of dots. */
const R = 110;
const DOTS = 28;
/** The orb is drawn at full size and scaled down: at rest it's the canvas's 74px pearl. */
const ORB = 176;
const REST = 74 / ORB;
/** The Houna mark pressed into the orb, in the orb's full-size frame (so ~27px at rest). */
const MARK = 64;
/** The hairline "middle" outline. */
const MIDDLE = 137;

export type StageShape = 'ring' | 'square';

interface BreathStageProps {
  shape: StageShape;
  tone: IconTileTone;
  /** 0 at rest → 1 filling the ring. Shared with the hub's screen glow. */
  breath: Animated.Value;
  /** Box breathing: 0 → 4 around the square, one side per phase. */
  trace?: Animated.Value;
  showTracer?: boolean;
  /** Light the dots up to this fraction, clockwise from the top (grounding steps). */
  progress?: number;
  /** Centred over the orb (a count, in ink). */
  children?: React.ReactNode;
}

/**
 * The Breathe stage from the canvas: a ring (or, for box breathing, a
 * square) of dots graded in size and light, a hairline middle outline, and a
 * lit orb that inflates and deflates with `breath`.
 */
export function BreathStage({ shape, tone, breath, trace, showTracer, progress, children }: BreathStageProps) {
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
        return { ...position(shape, tt), tt, s, o, c: lit || k < DOTS / 2 ? fg : partner };
      }),
    [shape, progress, fg, partner],
  );
  // The ring turns as Home's does, but not while grounding lights it from the top, and never
  // the square, whose corners the box-breathing bead follows.
  const turns = shape === 'ring' && progress === undefined;

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [REST, 1] });
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
        {shape === 'ring' ? (
          <Circle cx={C - 0.5} cy={C - 0.5} r={MIDDLE / 2} fill="none" stroke={colors.text} strokeOpacity={0.14} strokeWidth={1} />
        ) : (
          <Rect
            x={C - MIDDLE / 2}
            y={C - MIDDLE / 2}
            width={MIDDLE}
            height={MIDDLE}
            rx={28}
            fill="none"
            stroke={colors.text}
            strokeOpacity={0.14}
            strokeWidth={1}
          />
        )}
      </Svg>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Orb
          size={ORB}
          // Box breathing breathes a rounded square, echoing its square of dots.
          radius={shape === 'square' ? ORB * 0.22 : undefined}
          fx={0.34}
          fy={0.3}
          stops={stops}
          glow={`0 0 90px ${alpha(fg, 0.38)}`}
        />
        {/* Inside the breathing scale, so the mark grows and shrinks as one with the shape. */}
        <PressedMark size={MARK} surface={fg} />
      </Animated.View>
      {shape === 'square' && trace && showTracer && <Tracer trace={trace} color={fg} />}
      {!!children && <View style={styles.centre}>{children}</View>}
    </View>
  );
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

/** A bright bead travelling the square of dots — one side per box-breathing phase. */
function Tracer({ trace, color }: { trace: Animated.Value; color: string }) {
  // Offsets from the centre, not start/left, so it draws the same in either direction.
  const translateX = trace.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: [-R, R, R, -R, -R] });
  const translateY = trace.interpolate({ inputRange: [0, 1, 2, 3, 4], outputRange: [-R, -R, R, R, -R] });
  return (
    <View style={styles.centre} pointerEvents="none">
      <Animated.View
        style={[
          styles.tracer,
          { backgroundColor: color, boxShadow: `0 0 14px ${alpha(color, 0.9)}`, transform: [{ translateX }, { translateY }] },
        ]}
      />
    </View>
  );
}

/** Clockwise from the top: the ring from 12 o'clock, the square from its top-left corner. */
function position(shape: StageShape, tt: number) {
  if (shape === 'ring') {
    const a = tt * Math.PI * 2 - Math.PI / 2;
    return { cx: C + R * Math.cos(a), cy: C + R * Math.sin(a) };
  }
  const side = Math.floor(tt * 4);
  const f = tt * 4 - side;
  const along = -R + 2 * R * f;
  const [x, y] = side === 0 ? [along, -R] : side === 1 ? [R, along] : side === 2 ? [-along, R] : [-R, -along];
  return { cx: C + x, cy: C + y };
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
  tracer: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
