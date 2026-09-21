import { palette } from '@/constants/theme';

export type SceneId = 'fire' | 'rain' | 'forest' | 'ocean';

export interface MeditationScene {
  id: SceneId;
  /** Gradient stops for the scene picker card, and the ambient fallback for scenes without real video. */
  gradient: [string, string];
  /** Real ambient video — muted, looped, visual only. Only sourced for 'fire' so far. */
  video?: number;
  /** Real ambient audio — looped, independent of the video track. Only sourced for 'fire' so far. */
  audio?: number;
}

// "Four scenes — fire, rain, nature" per build-notes.md; nature split into
// forest + ocean to make four distinct scenes rather than one generic
// "nature" (a judgment call — the doc doesn't specify the fourth).
export const MEDITATION_SCENES: MeditationScene[] = [
  {
    id: 'fire',
    gradient: [palette.peach, palette.raspberry],
    video: require('@/assets/video/fire.mp4'),
    audio: require('@/assets/audio/fire.m4a'),
  },
  { id: 'rain', gradient: [palette.lightCyan, palette.turquoise] },
  { id: 'forest', gradient: [palette.turquoise, palette.turquoiseDark] },
  { id: 'ocean', gradient: [palette.turquoiseDark, palette.black] },
];
