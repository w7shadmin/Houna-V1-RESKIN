import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { MeditationScene } from './scenes';
import { useReduceMotion } from '@/hooks/useCalmLoop';

interface AmbientVisualProps {
  scene: MeditationScene;
  /** Playing = motion (real video plays, or the gradient breathes). Paused/off = still frame (battery-friendly fallback per build-notes.md §4). */
  animate: boolean;
}

/** Real ambient video when the scene has one (currently only 'fire'); otherwise the gradient placeholder. */
export default function AmbientVisual({ scene, animate }: AmbientVisualProps) {
  if (scene.video) {
    return <VideoAmbient scene={scene} animate={animate} />;
  }
  return <GradientAmbient scene={scene} animate={animate} />;
}

function VideoAmbient({ scene, animate }: AmbientVisualProps) {
  const player = useVideoPlayer(scene.video!, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    if (animate) player.play();
    else player.pause();
  }, [animate, player]);

  const frame = scene.videoFrame;
  if (frame?.kind === 'base') {
    // The whole width (or `scale` of it, centred), on the bottom edge; the dark top of the footage
    // fades into the ground above, and when it's drawn narrower, its sides do too.
    const scale = frame.scale ?? 1;
    const clear = `${frame.ground}00`;
    return (
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: frame.ground }]}>
        <View style={[styles.base, { width: `${scale * 100}%`, left: `${((1 - scale) / 2) * 100}%` }]}>
          <VideoView player={player} style={styles.video} contentFit="cover" nativeControls={false} />
          <LinearGradient colors={[frame.ground, clear]} style={styles.baseFade} pointerEvents="none" />
          {scale < 1 && (
            <>
              <LinearGradient colors={[frame.ground, `${frame.ground}AA`, clear]} locations={[0, 0.4, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.sideFade, styles.sideStart]} pointerEvents="none" />
              <LinearGradient colors={[clear, `${frame.ground}AA`, frame.ground]} locations={[0, 0.6, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.sideFade, styles.sideEnd]} pointerEvents="none" />
            </>
          )}
        </View>
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />
    </View>
  );
}

/** Placeholder ambient background for scenes without real video yet — a soft, slowly-breathing gradient tinted per scene. */
function GradientAmbient({ scene, animate }: AmbientVisualProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  // Under Reduce Motion the glow rests at its middle instead of breathing.
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (reduceMotion) {
      pulse.stopAnimation();
      pulse.setValue(0.5);
      return;
    }
    if (!animate) {
      pulse.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 6000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 6000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, pulse, reduceMotion]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient colors={scene.gradient} style={StyleSheet.absoluteFillObject} />
      <Animated.View
        style={[
          styles.glow,
          { backgroundColor: scene.gradient[1], transform: [{ scale }], opacity },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * `absoluteFillObject` alone (inset: 0) isn't enough for a <video> tag on
   * web — a replaced element positioned only via inset falls back to its
   * intrinsic size (e.g. the source file's native 720x1280) instead of
   * stretching, so the video overflows its container. Explicit 100%
   * width/height forces it to actually fill the box.
   */
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  base: {
    position: 'absolute',
    left: 0,
    width: '100%',
    bottom: 0,
    // The footage's own shape (9:16).
    aspectRatio: 9 / 16,
  },
  // Physical sides (the footage doesn't mirror in Arabic; the fades are symmetrical anyway).
  sideFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    // Wide and eased (dark for the first stretch), or the flames at the footage's edge show a seam.
    width: '30%',
  },
  sideStart: {
    left: 0,
  },
  sideEnd: {
    right: 0,
  },
  baseFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '24%',
  },
  glow: {
    position: 'absolute',
    width: '140%',
    height: '60%',
    bottom: '-20%',
    left: '-20%',
    borderRadius: 999,
  },
});
