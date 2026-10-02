import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { MEDITATION_SCENES, type SceneId } from '@/components/meditation/scenes';
import MeditationPlayer from '@/components/meditation/MeditationPlayer';
import { DEFAULT_MEDITATION_MINUTES } from '@/constants/breathPatterns';

export default function MeditationPlayerScreen() {
  const router = useRouter();
  const { scene: sceneId, minutes: minutesParam } = useLocalSearchParams<{ scene: SceneId; minutes?: string }>();
  const { t } = useLanguage();

  const scene = MEDITATION_SCENES.find((s) => s.id === sceneId) ?? MEDITATION_SCENES[0];
  // Chosen on the Tanafas hub: a number of minutes, or "none" for no limit.
  const parsed = Number(minutesParam);
  const minutes = minutesParam === 'none' ? null : parsed > 0 ? parsed : DEFAULT_MEDITATION_MINUTES;

  return (
    <MeditationPlayer
      scene={scene}
      sceneName={t.tanafas.meditation.scenes[scene.id].name}
      minutes={minutes}
      placeholderNotice={t.tanafas.meditation.player.placeholderNotice}
      onExit={() => router.back()}
    />
  );
}
