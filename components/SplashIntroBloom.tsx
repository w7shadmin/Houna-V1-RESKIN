/**
 * SplashIntroBloom.tsx — Houna animated splash, variant C
 *
 * The mark opens like a flower, then the word is sketched.
 *
 * The two pale "wings" in the Houna mark are negative space — they don't exist
 * as shapes in the logo file. They're derived here by subtracting the figure
 * from the inner circle, then split down the centre into two petals that share
 * a base. Folded shut they cover the figure; opening them reveals it.
 *
 * Sequence:
 *   1. The turquoise disc arrives, plain and closed.
 *   2. The two petals unfold from their shared base, uncovering the figure.
 *   3. The head appears as the petals settle.
 *   4. The mark travels into the lockup's o position.
 *   5. h / u / n / a are drawn as outlines, then inked in, one after another.
 *   6. هنا sweeps in right to left, then its dots are added.
 *   7. Held beat, then the overlay dissolves.
 *
 * Requires: react-native-svg, react-native-reanimated
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

const GROUND = '#EFF0EE'; // Broken White
const LETTER = '#3BAAA7'; // Turquoise
const MARK = '#36A9A7'; // the disc, as exported
const INK = '#525052'; // Arabic wordmark

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const VB_W = 93.339;
const VB_H = 44.094;
const VB = `0 0 ${VB_W} ${VB_H}`;

const DISC = { cx: 27.364, cy: 15.615, r: 8.824 };
const HEAD = { cx: 27.281, cy: 12.359, r: 2.672 };

/** Where the two petals meet. Everything folds about this point. */
const PIVOT = { x: 27.225, y: 22.2 };

/** Derived: (inner circle − figure), split down the middle with a hair of
 *  overlap so the two halves don't leave a seam when closed. */
const PETAL_L =
  'M21.110,13.142C21.371,16.418 27.225,18.662 27.225,21.601C27.225,21.405 27.251,21.211 27.300,21.021L27.300,22.215C23.630,22.210 20.656,19.233 20.656,15.562C20.656,14.708 20.817,13.892 21.110,13.142Z';
const PETAL_R =
  'M27.150,22.213L27.150,21.021C27.199,21.211 27.225,21.405 27.225,21.601C27.225,18.595 33.349,16.312 33.349,12.916C33.349,12.866 33.348,12.815 33.347,12.765C33.742,13.615 33.962,14.563 33.962,15.562C33.962,19.236 30.983,22.215 27.309,22.215C27.256,22.215 27.203,22.214 27.150,22.213Z';

const D = {
  h: 'M23.895,21.576a7.809,7.809,0,0,0-.334-2.283,5.773,5.773,0,0,0-.946-1.949A4.728,4.728,0,0,0,21,16.009a5.245,5.245,0,0,0-2.394-.5,5.42,5.42,0,0,0-3.619,1.281,6.55,6.55,0,0,0-2.116,3.173V30.54H10.7V6.6h2.171V16.677a8.71,8.71,0,0,1,2.394-2.338,5.872,5.872,0,0,1,3.452-1,7.865,7.865,0,0,1,3.173.612,7.1,7.1,0,0,1,2.338,1.726,6.956,6.956,0,0,1,1.392,2.617,10.17,10.17,0,0,1,.5,3.285V30.6H23.951V21.576Z',
  u: 'M82.271,28.519a7.809,7.809,0,0,0,.334,2.283,5.773,5.773,0,0,0,.946,1.949,4.728,4.728,0,0,0,1.615,1.336,5.245,5.245,0,0,0,2.394.5,5.42,5.42,0,0,0,3.619-1.281,6.55,6.55,0,0,0,2.116-3.173V19.556h2.171V36.369H93.295V33.419A8.71,8.71,0,0,1,90.9,35.757a5.872,5.872,0,0,1-3.452,1,7.865,7.865,0,0,1-3.173-.612,6.366,6.366,0,0,1-2.283-1.726A6.956,6.956,0,0,1,80.6,31.8a10.169,10.169,0,0,1-.5-3.285V19.5h2.171Z',
  n: 'M128.595,26.984a7.809,7.809,0,0,0-.334-2.283,5.773,5.773,0,0,0-.946-1.949,4.728,4.728,0,0,0-1.615-1.336,5.245,5.245,0,0,0-2.394-.5,5.42,5.42,0,0,0-3.619,1.281,6.55,6.55,0,0,0-2.116,3.173V35.948H115.4V19.19h2.171V22.14a8.711,8.711,0,0,1,2.394-2.338,5.872,5.872,0,0,1,3.452-1,7.865,7.865,0,0,1,3.173.612,7.1,7.1,0,0,1,2.338,1.726,6.956,6.956,0,0,1,1.392,2.617,11.958,11.958,0,0,1,.5,3.285v9.019h-2.171V26.984Z',
  a: 'M149.571,27.6a6.565,6.565,0,0,0,.5,2.561,6.82,6.82,0,0,0,1.448,2.116,7.133,7.133,0,0,0,2.116,1.448,6.1,6.1,0,0,0,6.9-1.336,6.186,6.186,0,0,0,1.281-2,7.117,7.117,0,0,0,.5-2.45v-.557a9.1,9.1,0,0,0-.5-2.505,7.124,7.124,0,0,0-1.281-2.06,6.483,6.483,0,0,0-1.893-1.336,5.84,5.84,0,0,0-2.45-.5,6.565,6.565,0,0,0-2.561.5,6.821,6.821,0,0,0-2.116,1.448,7.133,7.133,0,0,0-1.448,2.116,6.565,6.565,0,0,0-.5,2.561m12.805-8.407h2.171V36h-2.171V33.164A8.162,8.162,0,0,1,159.76,35.5a6.951,6.951,0,0,1-3.563.946,9.074,9.074,0,0,1-3.452-.668,8.809,8.809,0,0,1-2.784-1.893,8.524,8.524,0,0,1-1.893-2.784,9.251,9.251,0,0,1,0-6.9,9.744,9.744,0,0,1,1.893-2.839,8.525,8.525,0,0,1,2.784-1.893A8.871,8.871,0,0,1,156.2,18.8a6.677,6.677,0,0,1,3.619,1,8.7,8.7,0,0,1,2.561,2.338Z',
  arabic:
    'M96.606,67.454a2.425,2.425,0,0,1-.557.891,3.154,3.154,0,0,1-.835.668,2.268,2.268,0,0,1-1,.278H94.1a2.259,2.259,0,0,1-1.058-.223,3.4,3.4,0,0,1-.891-.668,5.046,5.046,0,0,1-.612-.891,2.413,2.413,0,0,1-.223-1.058,2.259,2.259,0,0,1,.223-1.058,3.182,3.182,0,0,1,.612-.891,2.544,2.544,0,0,1,.891-.612,2.624,2.624,0,0,1,2.116,0,3.182,3.182,0,0,1,.891.612,5.046,5.046,0,0,1,.612.891,2.259,2.259,0,0,1,.223,1.058c-.111.278-.167.612-.278,1m6.9-4.955A7.564,7.564,0,0,0,99.5,58.49a7.251,7.251,0,0,0-2.9-.557H91.873v1.837h4.732a5.6,5.6,0,0,1,2.171.445,4.865,4.865,0,0,1,1.726,1.225,5.5,5.5,0,0,1,1.169,1.782,5.6,5.6,0,0,1,.445,2.171v3.842H97.663A5.421,5.421,0,0,0,98.5,67.9a4.83,4.83,0,0,0,.278-1.559,3.8,3.8,0,0,0-.39-1.782,5.566,5.566,0,0,0-1-1.448,5.279,5.279,0,0,0-1.5-.946,4.9,4.9,0,0,0-1.837-.334,4.822,4.822,0,0,0-1.782.334,5.279,5.279,0,0,0-1.5.946,3.766,3.766,0,0,0-1,1.448,4.374,4.374,0,0,0-.111,3.34,5.265,5.265,0,0,0,.779,1.336H54.237A3.614,3.614,0,0,1,51.4,68.066a4.26,4.26,0,0,1-1-2.9V62H48.447v2.171a11.038,11.038,0,0,1-.167,1.949,3.822,3.822,0,0,1-.668,1.615,3.39,3.39,0,0,1-1.225,1.113,4.053,4.053,0,0,1-1.949.39H16.156a3.5,3.5,0,0,1-2.728-.891,3.863,3.863,0,0,1-.779-2.617V52.7H10.7V65.783a5.444,5.444,0,0,0,1.336,4.009,4.919,4.919,0,0,0,3.619,1.336H44.383a5.606,5.606,0,0,0,3.173-.835,5.444,5.444,0,0,0,1.893-2.283,4.751,4.751,0,0,0,.779,1.169,5.064,5.064,0,0,0,1.169,1,6.406,6.406,0,0,0,1.392.668,4.413,4.413,0,0,0,1.392.278h49.773l.056-5.734a5.708,5.708,0,0,0-.5-2.9',
  dotNoon: 'M78.936,59.572a1.331,1.331,0,1,0-.946-.39,1.147,1.147,0,0,0,.946.39',
  dotHeh:
    'M141.618,60.936a.715.715,0,0,1,.557-.223.989.989,0,0,1,.557.223.715.715,0,0,1,.223.557.837.837,0,0,1-.223.612.7.7,0,0,1-1.113,0,.837.837,0,0,1-.223-.612.715.715,0,0,1,.223-.557m-2.839,3.507,3.507-1.113a4.654,4.654,0,0,0,1.281-.668,1.567,1.567,0,0,0,.557-1.169,1.809,1.809,0,0,0-.557-1.336,2.054,2.054,0,0,0-1.336-.557,1.612,1.612,0,0,0-1.281.557,1.651,1.651,0,0,0-.557,1.336,1.8,1.8,0,0,0,.445,1.169L138.5,63.5Z',
};

const OFF = {
  h: 'translate(-10.7 -6.6)',
  u: 'translate(-41.462 -12.318)',
  n: 'translate(-57.109 -12.008)',
  a: 'translate(-71.293 -12.008)',
  arabic: 'translate(-10.7 -27.034)',
  dotNoon: 'translate(-40.354 -28.896)',
  dotHeh: 'translate(-67.348 -30.093)',
};

/** Outline lengths, for the sketch. Measured, not estimated. */
const LEN = { h: 105.602, u: 91.247, n: 91.342, a: 110.221 };

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

/** Global tempo. 1 = ~4.1s. Current 1.15 = ~4.7s. */
const SPEED = 1.15;
const t = (ms: number) => Math.round(ms * SPEED);

/** How much larger the mark is while it blooms. */
const ZOOM = 1.5;

/** Pen weight for the letter sketch, in viewBox units. */
const PEN = 0.34;

/** How far the petals are folded in at the start, in degrees. */
const FOLD = 46;

const TL = {
  disc: { at: 0, dur: 460 },
  petals: { at: 320, dur: 820 },
  head: { at: 980, dur: 300 },
  morph: { at: 1300, dur: 520 },
  draw: { at: 1560, dur: 460, stagger: 110 },
  ink: { after: 320, dur: 240 },
  arabic: { at: 2500, dur: 780 },
  dots: { at: 3280, dur: 240, stagger: 80 },
  exit: { at: 3700, dur: 400 },
};

const TOTAL = t(TL.exit.at + TL.exit.dur);

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SOFT = Easing.bezier(0.4, 0, 0.2, 1);
const EASE_PEN = Easing.bezier(0.45, 0.05, 0.35, 1);
/** Petals want a little life at the end without overshooting the artwork. */
const EASE_BLOOM = Easing.bezier(0.16, 0.9, 0.3, 1);

/* ------------------------------------------------------------------ */

type Props = { onFinish?: () => void };

export default function SplashIntroBloom({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const LOGO_W = Math.min(width * 0.58, 268);
  const LOGO_H = LOGO_W * (VB_H / VB_W);

  // Offset of the mark from the centre of the lockup
  const dx = LOGO_W * (DISC.cx / VB_W - 0.5);
  const dy = LOGO_H * (DISC.cy / VB_H - 0.5);

  // Petal pivot, as an offset from the centre of the layer
  const px = LOGO_W * (PIVOT.x / VB_W) - LOGO_W / 2;
  const py = LOGO_H * (PIVOT.y / VB_H) - LOGO_H / 2;

  const disc = useSharedValue(0);
  const bloom = useSharedValue(0); // 0 = folded shut, 1 = open
  const head = useSharedValue(0);
  const morph = useSharedValue(0);

  const drawH = useSharedValue(0);
  const drawU = useSharedValue(0);
  const drawN = useSharedValue(0);
  const drawA = useSharedValue(0);
  const inkH = useSharedValue(0);
  const inkU = useSharedValue(0);
  const inkN = useSharedValue(0);
  const inkA = useSharedValue(0);

  const arabicWidth = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const overlay = useSharedValue(1);

  useEffect(() => {
    const done = () => onFinish?.();

    if (reduceMotion) {
      disc.value = 1;
      bloom.value = 1;
      head.value = 1;
      morph.value = 1;
      [drawH, drawU, drawN, drawA].forEach((v) => (v.value = 1));
      [inkH, inkU, inkN, inkA].forEach((v) => (v.value = 1));
      arabicWidth.value = LOGO_W;
      dot1.value = 1;
      dot2.value = 1;
      overlay.value = withDelay(
        900,
        withTiming(0, { duration: 400 }, (f) => {
          if (f) runOnJS(done)();
        })
      );
      return;
    }

    // 1 — the disc
    disc.value = withDelay(
      t(TL.disc.at),
      withTiming(1, { duration: t(TL.disc.dur), easing: EASE_OUT })
    );

    // 2 — the petals unfold
    bloom.value = withDelay(
      t(TL.petals.at),
      withTiming(1, { duration: t(TL.petals.dur), easing: EASE_BLOOM })
    );

    // 3 — the head
    head.value = withDelay(
      t(TL.head.at),
      withTiming(1, { duration: t(TL.head.dur), easing: EASE_OUT })
    );

    // 4 — the mark takes its place in the word
    morph.value = withDelay(
      t(TL.morph.at),
      withTiming(1, { duration: t(TL.morph.dur), easing: EASE_IN_OUT })
    );

    // 5 — each letter is outlined, then inked
    const draws = [drawH, drawU, drawN, drawA];
    const inks = [inkH, inkU, inkN, inkA];
    draws.forEach((v, i) => {
      const at = TL.draw.at + i * TL.draw.stagger;
      v.value = withDelay(
        t(at),
        withTiming(1, { duration: t(TL.draw.dur), easing: EASE_PEN })
      );
      inks[i].value = withDelay(
        t(at + TL.ink.after),
        withTiming(1, { duration: t(TL.ink.dur), easing: EASE_SOFT })
      );
    });

    // 6 — Arabic, then its dots
    arabicWidth.value = withDelay(
      t(TL.arabic.at),
      withTiming(LOGO_W, { duration: t(TL.arabic.dur), easing: EASE_IN_OUT })
    );
    dot1.value = withDelay(
      t(TL.dots.at),
      withTiming(1, { duration: t(TL.dots.dur), easing: EASE_OUT })
    );
    dot2.value = withDelay(
      t(TL.dots.at + TL.dots.stagger),
      withTiming(1, { duration: t(TL.dots.dur), easing: EASE_OUT })
    );

    // 7 — dissolve
    overlay.value = withDelay(
      t(TL.exit.at),
      withTiming(0, { duration: t(TL.exit.dur), easing: EASE_SOFT }, (f) => {
        if (f) runOnJS(done)();
      })
    );
  }, [LOGO_W, reduceMotion]);

  /* ---- styles ---- */

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));

  const stageStyle = useAnimatedStyle(() => {
    const p = morph.value;
    const s = ZOOM + (1 - ZOOM) * p;
    return {
      transform: [
        { translateX: -ZOOM * dx * (1 - p) },
        { translateY: -ZOOM * dy * (1 - p) },
        { scale: s },
      ],
    };
  });

  const discStyle = useAnimatedStyle(() => ({
    opacity: disc.value,
    transform: [{ scale: 0.9 + 0.1 * disc.value }],
  }));

  const headStyle = useAnimatedStyle(() => ({
    opacity: head.value,
    transform: [{ scale: 0.6 + 0.4 * head.value }],
  }));

  // Petals rotate open about their shared base, growing as they go.
  const petal = (sign: number) =>
    useAnimatedStyle(() => {
      const b = bloom.value;
      const angle = sign * FOLD * (1 - b);
      const s = 0.72 + 0.28 * b;
      return {
        opacity: disc.value,
        transform: [
          { translateX: px },
          { translateY: py },
          { rotate: `${angle}deg` },
          { scale: s },
          { translateX: -px },
          { translateY: -py },
        ],
      };
    });

  const petalLStyle = petal(1);
  const petalRStyle = petal(-1);

  const propsH = useAnimatedProps(() => ({
    strokeDashoffset: LEN.h * (1 - drawH.value),
  }));
  const propsU = useAnimatedProps(() => ({
    strokeDashoffset: LEN.u * (1 - drawU.value),
  }));
  const propsN = useAnimatedProps(() => ({
    strokeDashoffset: LEN.n * (1 - drawN.value),
  }));
  const propsA = useAnimatedProps(() => ({
    strokeDashoffset: LEN.a * (1 - drawA.value),
  }));

  // The outline fades as the fill arrives, so they cross over rather than pop.
  const penH = useAnimatedStyle(() => ({ opacity: 1 - inkH.value }));
  const penU = useAnimatedStyle(() => ({ opacity: 1 - inkU.value }));
  const penN = useAnimatedStyle(() => ({ opacity: 1 - inkN.value }));
  const penA = useAnimatedStyle(() => ({ opacity: 1 - inkA.value }));
  const inkHS = useAnimatedStyle(() => ({ opacity: inkH.value }));
  const inkUS = useAnimatedStyle(() => ({ opacity: inkU.value }));
  const inkNS = useAnimatedStyle(() => ({ opacity: inkN.value }));
  const inkAS = useAnimatedStyle(() => ({ opacity: inkA.value }));

  const arabicClipStyle = useAnimatedStyle(() => ({ width: arabicWidth.value }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
    transform: [{ translateY: -3 * (1 - dot1.value) }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
    transform: [{ translateY: -3 * (1 - dot2.value) }],
  }));

  const Layer = ({ children }: { children: React.ReactNode }) => (
    <Svg width={LOGO_W} height={LOGO_H} viewBox={VB}>
      {children}
    </Svg>
  );

  const sketch = (
    d: string,
    off: string,
    len: number,
    aProps: any,
    penStyle: any,
    inkStyle: any,
    key: string
  ) => (
    <React.Fragment key={key}>
      <Animated.View style={[styles.layer, penStyle]}>
        <Layer>
          <G transform={off}>
            <AnimatedPath
              d={d}
              fill="none"
              stroke={LETTER}
              strokeWidth={PEN}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={len}
              animatedProps={aProps}
            />
          </G>
        </Layer>
      </Animated.View>
      <Animated.View style={[styles.layer, inkStyle]}>
        <Layer>
          <G transform={off}>
            <Path d={d} fill={LETTER} />
          </G>
        </Layer>
      </Animated.View>
    </React.Fragment>
  );

  return (
    <Animated.View style={[styles.root, overlayStyle]} pointerEvents="none">
      <Animated.View style={[{ width: LOGO_W, height: LOGO_H }, stageStyle]}>
        {/* the disc */}
        <Animated.View style={[styles.layer, discStyle]}>
          <Layer>
            <Circle cx={DISC.cx} cy={DISC.cy} r={DISC.r} fill={MARK} />
          </Layer>
        </Animated.View>

        {/* the petals, carved out of it */}
        <Animated.View style={[styles.layer, petalLStyle]}>
          <Layer>
            <Path d={PETAL_L} fill={GROUND} />
          </Layer>
        </Animated.View>
        <Animated.View style={[styles.layer, petalRStyle]}>
          <Layer>
            <Path d={PETAL_R} fill={GROUND} />
          </Layer>
        </Animated.View>

        {/* the head */}
        <Animated.View style={[styles.layer, headStyle]}>
          <Layer>
            <Circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill="#FFFFFF" />
          </Layer>
        </Animated.View>

        {/* the word, drawn then inked */}
        {sketch(D.h, OFF.h, LEN.h, propsH, penH, inkHS, 'h')}
        {sketch(D.u, OFF.u, LEN.u, propsU, penU, inkUS, 'u')}
        {sketch(D.n, OFF.n, LEN.n, propsN, penN, inkNS, 'n')}
        {sketch(D.a, OFF.a, LEN.a, propsA, penA, inkAS, 'a')}

        {/* هنا, right to left */}
        <Animated.View
          style={[styles.arabicClip, { height: LOGO_H }, arabicClipStyle]}
        >
          <View style={{ position: 'absolute', right: 0, top: 0 }}>
            <Layer>
              <G transform={OFF.arabic}>
                <Path d={D.arabic} fill={INK} />
              </G>
            </Layer>
          </View>
        </Animated.View>

        {/* the dots, last */}
        <Animated.View style={[styles.layer, dot1Style]}>
          <Layer>
            <G transform={OFF.dotNoon}>
              <Path d={D.dotNoon} fill={INK} />
            </G>
          </Layer>
        </Animated.View>
        <Animated.View style={[styles.layer, dot2Style]}>
          <Layer>
            <G transform={OFF.dotHeh}>
              <Path d={D.dotHeh} fill={INK} />
            </G>
          </Layer>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

/** Total run time in ms. */
export const SPLASH_DURATION = TOTAL;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  layer: { position: 'absolute', left: 0, top: 0 },
  arabicClip: {
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
});
