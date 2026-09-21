import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { MeditationScene } from './scenes';

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

  useEffect(() => {
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
  }, [animate, pulse]);

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
  glow: {
    position: 'absolute',
    width: '140%',
    height: '60%',
    bottom: '-20%',
    left: '-20%',
    borderRadius: 999,
  },
});
