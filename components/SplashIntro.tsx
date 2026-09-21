/**
 * SplashIntro.tsx — Houna animated splash
 *
 * A code-driven intro built from the real logo geometry. No video, no image
 * assets, no Lottie. Vector only, so it stays sharp at any density and adds
 * ~0 KB to the bundle.
 *
 * Sequence (see TIMELINE below):
 *   1. The "o" — the mark that carries the figure — arrives alone at centre.
 *   2. One breath: a single ring expands out from it while the mark inhales.
 *   3. h / u / n / a settle in around the o, which stays fixed as the anchor.
 *   4. هنا draws right-to-left as one continuous stroke.
 *   5. The two dots are added after the stroke completes — the order Arabic
 *      is actually written in.
 *   6. A held beat, then the whole overlay dissolves into the home screen.
 *
 * Requires: react-native-svg, react-native-reanimated
 *   npx expo install react-native-svg react-native-reanimated
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';

/* ------------------------------------------------------------------ */
/* Brand                                                               */
/* ------------------------------------------------------------------ */

const GROUND = '#F2F7F5'; // Broken White
const LETTER = '#3BAAA7'; // Primary Turquoise — Latin letterforms
const MARK = '#36A9A7'; // the o + figure (as exported in the source SVG)
const INK = '#525052'; // Arabic wordmark

/* ------------------------------------------------------------------ */
/* Geometry, taken straight from logo-green.svg                        */
/* ------------------------------------------------------------------ */

const VB_W = 93.339;
const VB_H = 44.094;
const VB = `0 0 ${VB_W} ${VB_H}`;

// Centre + radius of the "o", in viewBox units. Used to place the breath ring.
const O_CX = 26.6;
const O_CY = 15.5;
const O_R = 8.1;

const D = {
  h: 'M23.895,21.576a7.809,7.809,0,0,0-.334-2.283,5.773,5.773,0,0,0-.946-1.949A4.728,4.728,0,0,0,21,16.009a5.245,5.245,0,0,0-2.394-.5,5.42,5.42,0,0,0-3.619,1.281,6.55,6.55,0,0,0-2.116,3.173V30.54H10.7V6.6h2.171V16.677a8.71,8.71,0,0,1,2.394-2.338,5.872,5.872,0,0,1,3.452-1,7.865,7.865,0,0,1,3.173.612,7.1,7.1,0,0,1,2.338,1.726,6.956,6.956,0,0,1,1.392,2.617,10.17,10.17,0,0,1,.5,3.285V30.6H23.951V21.576Z',
  oRing:
    'M50.18,33.714a6.82,6.82,0,0,1-2.116-1.448,7.132,7.132,0,0,1-1.448-2.116,6.565,6.565,0,0,1-.5-2.561,7.052,7.052,0,0,1,.5-2.617,6.228,6.228,0,0,1,1.448-2.116A7.132,7.132,0,0,1,50.18,21.41a6.565,6.565,0,0,1,2.561-.5,7.052,7.052,0,0,1,2.617.5,6.228,6.228,0,0,1,2.116,1.448,7.132,7.132,0,0,1,1.448,2.116,6.843,6.843,0,0,1,.5,2.617,6.565,6.565,0,0,1-.5,2.561,6.82,6.82,0,0,1-1.448,2.116,7.132,7.132,0,0,1-2.116,1.448,6.843,6.843,0,0,1-2.617.5,6.769,6.769,0,0,1-2.561-.5m-.835-14.253a8.809,8.809,0,0,0-2.784,1.893,8.2,8.2,0,0,0-1.893,2.839A8.871,8.871,0,0,0,44,27.646a9.074,9.074,0,0,0,.668,3.452,8.224,8.224,0,0,0,1.893,2.784,8.525,8.525,0,0,0,2.784,1.893,9.251,9.251,0,0,0,6.9,0,9.744,9.744,0,0,0,2.839-1.893A8.525,8.525,0,0,0,60.981,31.1a9.251,9.251,0,0,0,0-6.9,9.744,9.744,0,0,0-1.893-2.839,8.2,8.2,0,0,0-2.839-1.893,8.871,8.871,0,0,0-3.452-.668,7.232,7.232,0,0,0-3.452.668',
  figure:
    'M48.6,24.924c0,3.4,6.124,5.679,6.124,8.685,0-3.006,6.124-5.289,6.124-8.685a6.124,6.124,0,0,0-12.248,0',
  head: 'M60.245,26.672A2.672,2.672,0,1,1,57.572,24a2.71,2.71,0,0,1,2.672,2.672',
  u: 'M82.271,28.519a7.809,7.809,0,0,0,.334,2.283,5.773,5.773,0,0,0,.946,1.949,4.728,4.728,0,0,0,1.615,1.336,5.245,5.245,0,0,0,2.394.5,5.42,5.42,0,0,0,3.619-1.281,6.55,6.55,0,0,0,2.116-3.173V19.556h2.171V36.369H93.295V33.419A8.71,8.71,0,0,1,90.9,35.757a5.872,5.872,0,0,1-3.452,1,7.865,7.865,0,0,1-3.173-.612,6.366,6.366,0,0,1-2.283-1.726A6.956,6.956,0,0,1,80.6,31.8a10.169,10.169,0,0,1-.5-3.285V19.5h2.171Z',
  n: 'M128.595,26.984a7.809,7.809,0,0,0-.334-2.283,5.773,5.773,0,0,0-.946-1.949,4.728,4.728,0,0,0-1.615-1.336,5.245,5.245,0,0,0-2.394-.5,5.42,5.42,0,0,0-3.619,1.281,6.55,6.55,0,0,0-2.116,3.173V35.948H115.4V19.19h2.171V22.14a8.711,8.711,0,0,1,2.394-2.338,5.872,5.872,0,0,1,3.452-1,7.865,7.865,0,0,1,3.173.612,7.1,7.1,0,0,1,2.338,1.726,6.956,6.956,0,0,1,1.392,2.617,11.958,11.958,0,0,1,.5,3.285v9.019h-2.171V26.984Z',
  a: 'M149.571,27.6a6.565,6.565,0,0,0,.5,2.561,6.82,6.82,0,0,0,1.448,2.116,7.133,7.133,0,0,0,2.116,1.448,6.1,6.1,0,0,0,6.9-1.336,6.186,6.186,0,0,0,1.281-2,7.117,7.117,0,0,0,.5-2.45v-.557a9.1,9.1,0,0,0-.5-2.505,7.124,7.124,0,0,0-1.281-2.06,6.483,6.483,0,0,0-1.893-1.336,5.84,5.84,0,0,0-2.45-.5,6.565,6.565,0,0,0-2.561.5,6.821,6.821,0,0,0-2.116,1.448,7.133,7.133,0,0,0-1.448,2.116,6.565,6.565,0,0,0-.5,2.561m12.805-8.407h2.171V36h-2.171V33.164A8.162,8.162,0,0,1,159.76,35.5a6.951,6.951,0,0,1-3.563.946,9.074,9.074,0,0,1-3.452-.668,8.809,8.809,0,0,1-2.784-1.893,8.524,8.524,0,0,1-1.893-2.784,9.251,9.251,0,0,1,0-6.9,9.744,9.744,0,0,1,1.893-2.839,8.525,8.525,0,0,1,2.784-1.893A8.871,8.871,0,0,1,156.2,18.8a6.677,6.677,0,0,1,3.619,1,8.7,8.7,0,0,1,2.561,2.338Z',
  arabic:
    'M96.606,67.454a2.425,2.425,0,0,1-.557.891,3.154,3.154,0,0,1-.835.668,2.268,2.268,0,0,1-1,.278H94.1a2.259,2.259,0,0,1-1.058-.223,3.4,3.4,0,0,1-.891-.668,5.046,5.046,0,0,1-.612-.891,2.413,2.413,0,0,1-.223-1.058,2.259,2.259,0,0,1,.223-1.058,3.182,3.182,0,0,1,.612-.891,2.544,2.544,0,0,1,.891-.612,2.624,2.624,0,0,1,2.116,0,3.182,3.182,0,0,1,.891.612,5.046,5.046,0,0,1,.612.891,2.259,2.259,0,0,1,.223,1.058c-.111.278-.167.612-.278,1m6.9-4.955A7.564,7.564,0,0,0,99.5,58.49a7.251,7.251,0,0,0-2.9-.557H91.873v1.837h4.732a5.6,5.6,0,0,1,2.171.445,4.865,4.865,0,0,1,1.726,1.225,5.5,5.5,0,0,1,1.169,1.782,5.6,5.6,0,0,1,.445,2.171v3.842H97.663A5.421,5.421,0,0,0,98.5,67.9a4.83,4.83,0,0,0,.278-1.559,3.8,3.8,0,0,0-.39-1.782,5.566,5.566,0,0,0-1-1.448,5.279,5.279,0,0,0-1.5-.946,4.9,4.9,0,0,0-1.837-.334,4.822,4.822,0,0,0-1.782.334,5.279,5.279,0,0,0-1.5.946,3.766,3.766,0,0,0-1,1.448,4.374,4.374,0,0,0-.111,3.34,5.265,5.265,0,0,0,.779,1.336H54.237A3.614,3.614,0,0,1,51.4,68.066a4.26,4.26,0,0,1-1-2.9V62H48.447v2.171a11.038,11.038,0,0,1-.167,1.949,3.822,3.822,0,0,1-.668,1.615,3.39,3.39,0,0,1-1.225,1.113,4.053,4.053,0,0,1-1.949.39H16.156a3.5,3.5,0,0,1-2.728-.891,3.863,3.863,0,0,1-.779-2.617V52.7H10.7V65.783a5.444,5.444,0,0,0,1.336,4.009,4.919,4.919,0,0,0,3.619,1.336H44.383a5.606,5.606,0,0,0,3.173-.835,5.444,5.444,0,0,0,1.893-2.283,4.751,4.751,0,0,0,.779,1.169,5.064,5.064,0,0,0,1.169,1,6.406,6.406,0,0,0,1.392.668,4.413,4.413,0,0,0,1.392.278h49.773l.056-5.734a5.708,5.708,0,0,0-.5-2.9',
  dotNoon: 'M78.936,59.572a1.331,1.331,0,1,0-.946-.39,1.147,1.147,0,0,0,.946.39',
  dotHeh:
    'M141.618,60.936a.715.715,0,0,1,.557-.223.989.989,0,0,1,.557.223.715.715,0,0,1,.223.557.837.837,0,0,1-.223.612.7.7,0,0,1-1.113,0,.837.837,0,0,1-.223-.612.715.715,0,0,1,.223-.557m-2.839,3.507,3.507-1.113a4.654,4.654,0,0,0,1.281-.668,1.567,1.567,0,0,0,.557-1.169,1.809,1.809,0,0,0-.557-1.336,2.054,2.054,0,0,0-1.336-.557,1.612,1.612,0,0,0-1.281.557,1.651,1.651,0,0,0-.557,1.336,1.8,1.8,0,0,0,.445,1.169L138.5,63.5Z',
};

// Each path carries its own offset in the source file. Flattened here.
const OFF = {
  h: 'translate(-10.7 -6.6)',
  oRing: 'translate(-25.46 -12.001)',
  figure: 'translate(-27.499 -12.008)',
  head: 'translate(-30.292 -14.313)',
  u: 'translate(-41.462 -12.318)',
  n: 'translate(-57.109 -12.008)',
  a: 'translate(-71.293 -12.008)',
  arabic: 'translate(-10.7 -27.034)',
  dotNoon: 'translate(-40.354 -28.896)',
  dotHeh: 'translate(-67.348 -30.093)',
};

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

/** Global tempo. 1 = ~3.2s. Current 1.15 = ~3.7s. Raise for slower. */
const SPEED = 1.15;
const t = (ms: number) => Math.round(ms * SPEED);

const TIMELINE = {
  markIn: { at: 0, dur: 620 },
  ripple: { at: 380, dur: 900 },
  inhale: { at: 420, up: 520, down: 480 },
  letters: { at: 820, dur: 420, stagger: 80 },
  arabic: { at: 1420, dur: 940 },
  dots: { at: 2300, dur: 260, stagger: 100 },
  exit: { at: 2760, dur: 420 },
};

const TOTAL = t(TIMELINE.exit.at + TIMELINE.exit.dur);

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SOFT = Easing.bezier(0.4, 0, 0.2, 1);

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type Props = {
  /** Fired once the intro has finished and faded out. */
  onFinish?: () => void;
};

export default function SplashIntro({ onFinish }: Props) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const LOGO_W = Math.min(width * 0.58, 268);
  const LOGO_H = LOGO_W * (VB_H / VB_W);
  const unit = LOGO_W / VB_W; // viewBox unit → px

  const ringSize = O_R * 2 * unit;
  const ringLeft = O_CX * unit - ringSize / 2;
  const ringTop = O_CY * unit - ringSize / 2;

  // Shared values
  const markOpacity = useSharedValue(0);
  const markScale = useSharedValue(0.86);
  const breath = useSharedValue(1);
  const rippleScale = useSharedValue(0.92);
  const rippleOpacity = useSharedValue(0);
  const letters = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ]; // h, u, n, a
  const arabicWidth = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const overlay = useSharedValue(1);

  useEffect(() => {
    const done = () => onFinish?.();

    if (reduceMotion) {
      // Straight to the finished lockup, hold, then dissolve.
      markOpacity.value = 1;
      markScale.value = 1;
      letters.forEach((v) => (v.value = 1));
      arabicWidth.value = LOGO_W;
      dot1.value = 1;
      dot2.value = 1;
      overlay.value = withDelay(
        900,
        withTiming(0, { duration: 400 }, (finished) => {
          if (finished) runOnJS(done)();
        })
      );
      return;
    }

    // 1 — the mark arrives
    markOpacity.value = withTiming(1, { duration: t(500), easing: EASE_SOFT });
    markScale.value = withTiming(1, {
      duration: t(TIMELINE.markIn.dur),
      easing: EASE_OUT,
    });

    // 2 — one breath out, one breath in
    rippleOpacity.value = withDelay(
      t(TIMELINE.ripple.at),
      withSequence(
        withTiming(0.22, { duration: t(220), easing: Easing.linear }),
        withTiming(0, { duration: t(TIMELINE.ripple.dur - 220), easing: EASE_SOFT })
      )
    );
    rippleScale.value = withDelay(
      t(TIMELINE.ripple.at),
      withTiming(2.6, { duration: t(TIMELINE.ripple.dur), easing: EASE_OUT })
    );
    breath.value = withDelay(
      t(TIMELINE.inhale.at),
      withSequence(
        withTiming(1.06, { duration: t(TIMELINE.inhale.up), easing: EASE_IN_OUT }),
        withTiming(1, { duration: t(TIMELINE.inhale.down), easing: EASE_IN_OUT })
      )
    );

    // 3 — h, then u / n / a outward from the o
    letters.forEach((v, i) => {
      v.value = withDelay(
        t(TIMELINE.letters.at + i * TIMELINE.letters.stagger),
        withTiming(1, { duration: t(TIMELINE.letters.dur), easing: EASE_OUT })
      );
    });

    // 4 — هنا draws right to left
    arabicWidth.value = withDelay(
      t(TIMELINE.arabic.at),
      withTiming(LOGO_W, {
        duration: t(TIMELINE.arabic.dur),
        easing: EASE_IN_OUT,
      })
    );

    // 5 — the dots, added after the stroke, as Arabic is written
    dot1.value = withDelay(
      t(TIMELINE.dots.at),
      withTiming(1, { duration: t(TIMELINE.dots.dur), easing: EASE_OUT })
    );
    dot2.value = withDelay(
      t(TIMELINE.dots.at + TIMELINE.dots.stagger),
      withTiming(1, { duration: t(TIMELINE.dots.dur), easing: EASE_OUT })
    );

    // 6 — dissolve into home
    overlay.value = withDelay(
      t(TIMELINE.exit.at),
      withTiming(0, { duration: t(TIMELINE.exit.dur), easing: EASE_SOFT }, (finished) => {
        if (finished) runOnJS(done)();
      })
    );
  }, [LOGO_W, reduceMotion]);

  /* ---- styles ---- */

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlay.value }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: markScale.value * breath.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  // h enters from the left; u / n / a settle outward to the right.
  const hStyle = useAnimatedStyle(() => ({
    opacity: letters[0].value,
    transform: [{ translateX: -14 * (1 - letters[0].value) }],
  }));
  const uStyle = useAnimatedStyle(() => ({
    opacity: letters[1].value,
    transform: [{ translateX: 10 * (1 - letters[1].value) }],
  }));
  const nStyle = useAnimatedStyle(() => ({
    opacity: letters[2].value,
    transform: [{ translateX: 12 * (1 - letters[2].value) }],
  }));
  const aStyle = useAnimatedStyle(() => ({
    opacity: letters[3].value,
    transform: [{ translateX: 14 * (1 - letters[3].value) }],
  }));

  const arabicClipStyle = useAnimatedStyle(() => ({ width: arabicWidth.value }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
    transform: [{ translateY: -3 * (1 - dot1.value) }],
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
    transform: [{ translateY: -3 * (1 - dot2.value) }],
  }));

  /* ---- one layer = one full-bleed Svg, so everything stays in register ---- */

  const Layer = ({ children }: { children: React.ReactNode }) => (
    <Svg width={LOGO_W} height={LOGO_H} viewBox={VB}>
      {children}
    </Svg>
  );

  return (
    <Animated.View style={[styles.root, overlayStyle]} pointerEvents="none">
      <View style={{ width: LOGO_W, height: LOGO_H }}>
        {/* breath ring, behind everything */}
        <Animated.View
          style={[
            styles.ripple,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              left: ringLeft,
              top: ringTop,
              borderWidth: Math.max(1, unit * 0.5),
            },
            rippleStyle,
          ]}
        />

        {/* the o — ring, figure, head */}
        <Animated.View style={[styles.layer, markStyle]}>
          <Layer>
            <G transform={OFF.oRing}>
              <Path d={D.oRing} fill={MARK} />
            </G>
            <G transform={OFF.figure}>
              <Path d={D.figure} fill={MARK} />
            </G>
            <G transform={OFF.head}>
              <Path d={D.head} fill="#FFFFFF" />
            </G>
          </Layer>
        </Animated.View>

        {/* Latin letterforms */}
        <Animated.View style={[styles.layer, hStyle]}>
          <Layer>
            <G transform={OFF.h}>
              <Path d={D.h} fill={LETTER} />
            </G>
          </Layer>
        </Animated.View>
        <Animated.View style={[styles.layer, uStyle]}>
          <Layer>
            <G transform={OFF.u}>
              <Path d={D.u} fill={LETTER} />
            </G>
          </Layer>
        </Animated.View>
        <Animated.View style={[styles.layer, nStyle]}>
          <Layer>
            <G transform={OFF.n}>
              <Path d={D.n} fill={LETTER} />
            </G>
          </Layer>
        </Animated.View>
        <Animated.View style={[styles.layer, aStyle]}>
          <Layer>
            <G transform={OFF.a}>
              <Path d={D.a} fill={LETTER} />
            </G>
          </Layer>
        </Animated.View>

        {/* هنا — clip pinned to the right edge, so widening reveals RTL */}
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

        {/* i'jām — the dots, last */}
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
      </View>
    </Animated.View>
  );
}

/** Total run time in ms, for callers that need to schedule around it. */
export const SPLASH_DURATION = TOTAL;

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: GROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  arabicClip: {
    position: 'absolute',
    right: 0,
    top: 0,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    borderColor: MARK,
  },
});
