import { palette } from '@/constants/theme';
import { OLD_MVP_ICON_HEX } from '@/lib/color';

export type SceneId = 'fire' | 'rain' | 'forest' | 'ocean';

export interface MeditationScene {
  id: SceneId;
  /** Gradient stops for the scene picker card, and the ambient fallback for scenes without real video. */
  gradient: [string, string];
  /** Still frame pulled from `video` — the scene picker card's resting background, before any preview plays. */
  thumbnail?: number;
  /** Real ambient video — muted, looped, visual only. Only sourced for 'fire', 'rain', and 'forest' so far. */
  video?: number;
  /** Real ambient audio — looped, independent of the video track. Only sourced for 'fire', 'rain', and 'forest' so far. */
  audio?: number;
}

/**
 * The Tanafas hub's Meditate orb for each scene — highlight, body, shade and
 * glow, verbatim from the canvas "Tanafas" artboard (same in Night and Day).
 */
export const SCENE_ORBS: Record<SceneId, { hi: string; c: string; lo: string; glow: string }> = {
  fire: { hi: '#FFE9CF', c: '#F0A868', lo: '#9A4F22', glow: 'rgba(240,168,104,0.45)' },
  rain: { hi: '#E4EDFF', c: '#7FA2EC', lo: '#33509E', glow: 'rgba(127,162,236,0.45)' },
  forest: { hi: '#DDFAF5', c: '#63CFC7', lo: '#1F7A74', glow: 'rgba(99,207,199,0.45)' },
  ocean: { hi: '#E6E8FF', c: '#8F9BF0', lo: '#39439E', glow: 'rgba(143,155,240,0.45)' },
};

// "Four scenes — fire, rain, nature" per build-notes.md; nature split into
// forest + ocean to make four distinct scenes rather than one generic
// "nature" (a judgment call — the doc doesn't specify the fourth).
export const MEDITATION_SCENES: MeditationScene[] = [
  {
    id: 'fire',
    gradient: [OLD_MVP_ICON_HEX.peach, OLD_MVP_ICON_HEX.raspberry],
    thumbnail: require('@/assets/images/meditation/fire.jpg'),
    video: require('@/assets/video/fire.mp4'),
    // WAV, not AAC — see the note on 'rain' below.
    audio: require('@/assets/audio/fire.wav'),
  },
  {
    id: 'rain',
    gradient: [OLD_MVP_ICON_HEX.lightCyan, palette.turquoise],
    thumbnail: require('@/assets/images/meditation/rain.jpg'),
    video: require('@/assets/video/rain.mp4'),
    // WAV, not AAC — a compressed codec needs to re-init its decoder each
    // time the player loops, which reads as a brief dropout at the seam.
    // Uncompressed PCM loops instantly instead.
    audio: require('@/assets/audio/rain.wav'),
  },
  {
    id: 'forest',
    gradient: [palette.turquoise, palette.turquoiseDark],
    thumbnail: require('@/assets/images/meditation/forest.jpg'),
    video: require('@/assets/video/forest.mp4'),
    audio: require('@/assets/audio/forest.wav'),
  },
  { id: 'ocean', gradient: [palette.turquoiseDark, palette.black] },
];
