import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { spacing, radius, typography } from '@/constants/theme';
import type { MeditationScene } from './scenes';

interface SceneCardProps {
  scene: MeditationScene;
  title: string;
  description: string;
  fontBold: string;
  fontRegular: string;
  onPress: () => void;
}

/**
 * Scene-picker card. Rests on a still frame pulled from the scene's own
 * video (falling back to the flat brand gradient for scenes without real
 * footage yet). Hovering — mouse on web, press-and-hold on touch, since
 * there's no true hover on a phone — swaps in the real muted, looping video
 * as a quick preview, reverting to the still frame the moment the pointer
 * leaves or lifts.
 */
export default function SceneCard({ scene, title, description, fontBold, fontRegular, onPress }: SceneCardProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const canPreview = !!scene.video;

  const showPreview = () => {
    if (canPreview) setIsPreviewing(true);
  };
  const hidePreview = () => setIsPreviewing(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={showPreview}
      onHoverOut={hidePreview}
      onPressIn={showPreview}
      onPressOut={hidePreview}
      style={({ pressed }) => [styles.card, pressed && !isPreviewing && styles.cardPressed]}
    >
      {isPreviewing && scene.video ? (
        <ScenePreviewVideo source={scene.video} />
      ) : scene.thumbnail ? (
        <Image source={scene.thumbnail} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <LinearGradient colors={scene.gradient} style={StyleSheet.absoluteFillObject} />
      )}

      {/* Scrim so the title/description stay legible regardless of how
          bright the underlying photo or video frame is — the old flat
          brand-gradient background never needed this, but real footage
          does. */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.cardOverlay}>
        <Text style={[styles.cardTitle, { fontFamily: fontBold }]}>{title}</Text>
        <Text style={[styles.cardDesc, { fontFamily: fontRegular }]} numberOfLines={2}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

/** Mounted only while previewing — starts fresh from the top each time, so a quick hover always shows the same clean few seconds rather than wherever a persistent player happened to be. */
function ScenePreviewVideo({ source }: { source: number }) {
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    p.muted = true;
  });

  // Calling play() inside useVideoPlayer's own setup callback doesn't
  // reliably start playback — see AmbientVisual.tsx, which defers it to an
  // effect after the player exists for the same reason.
  useEffect(() => {
    player.play();
  }, [player]);

  return <VideoView player={player} style={styles.thumbnail} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
  },
  thumbnail: {
    // `absoluteFillObject` alone (inset: 0) isn't enough for an <img> tag
    // on web — a replaced element positioned only via inset falls back to
    // its intrinsic size instead of stretching, so it overflows the card
    // and only the image's own top-left corner ends up visible. Same fix
    // as the video's own style in AmbientVisual.tsx.
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: typography.fontSize.md,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
});
