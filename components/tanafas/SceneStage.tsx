import React, { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { SCENE_ORBS, type MeditationScene } from '@/components/meditation/scenes';
import Orb from '@/components/ui/Orb';

const SIZE = 250;
const ORB = 176;
/** The footage is portrait 9:16: drawn at the orb's width, its height overflows and is cropped. */
const VIDEO_H = Math.round((ORB * 16) / 9);

/**
 * The Meditate carousel's stage: a hairline halo around the scene's orb.
 * Scenes with real footage play it inside the orb — muted, looping, cropped
 * to where the scene's interest sits — with the rim fading into the scene's
 * own shade and a soft highlight on top, so it still reads as a lit sphere
 * with the scene inside it rather than a video cut into a circle.
 */
export default function SceneStage({ scene }: { scene: MeditationScene }) {
  const { colors } = useTheme();
  const orb = SCENE_ORBS[scene.id];
  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={124} cy={124} r={119.5} fill="none" stroke={colors.text} strokeOpacity={0.16} strokeWidth={1} />
      </Svg>
      {/* The plain orb sits underneath, so there's colour before the first frame arrives. */}
      <Orb
        size={ORB}
        fx={0.38}
        fy={0.32}
        stops={[
          [orb.hi, 0],
          [orb.c, 0.48],
          [orb.lo, 1],
        ]}
        glow={`0 0 70px ${orb.glow}`}
      />
      {!!scene.video && <OrbVideo key={scene.id} source={scene.video} focus={scene.videoFocus ?? 0.5} tint={orb.lo} />}
    </View>
  );
}

function OrbVideo({ source, focus, tint }: { source: number; focus: number; tint: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const focused = useIsFocused();
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Plays only while the hub is on screen — not under the full-screen player.
  useEffect(() => {
    if (focused) player.play();
    else player.pause();
  }, [focused, player]);

  // Slide the tall frame so its focal point sits in the middle of the orb.
  const top = Math.min(0, Math.max(ORB - VIDEO_H, ORB / 2 - focus * VIDEO_H));

  return (
    <View style={styles.video}>
      <VideoView
        player={player}
        style={[styles.frame, { top }]}
        contentFit="cover"
        nativeControls={false}
        // Android's default SurfaceView ignores the rounded clip; a TextureView respects it.
        surfaceType="textureView"
      />
      <Svg width={ORB} height={ORB} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Rim: the footage fades into the scene's shade at the edge, as the plain orb does. */}
          <RadialGradient id={`rim${uid}`} cx="50%" cy="50%" r="50%">
            <Stop offset={0.62} stopColor={tint} stopOpacity={0} />
            <Stop offset={0.88} stopColor={tint} stopOpacity={0.35} />
            <Stop offset={1} stopColor={tint} stopOpacity={0.8} />
          </RadialGradient>
          {/* Highlight: the orb's lit upper-left, kept faint so the scene shows through. */}
          <RadialGradient id={`hi${uid}`} cx="38%" cy="32%" fx="38%" fy="32%" r="45%">
            <Stop offset={0} stopColor="#FFFFFF" stopOpacity={0.22} />
            <Stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={ORB / 2} cy={ORB / 2} r={ORB / 2} fill={`url(#rim${uid})`} />
        <Circle cx={ORB / 2} cy={ORB / 2} r={ORB / 2} fill={`url(#hi${uid})`} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    position: 'absolute',
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    overflow: 'hidden',
  },
  frame: {
    position: 'absolute',
    width: ORB,
    height: VIDEO_H,
  },
});
