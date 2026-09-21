import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { MEDITATION_SCENES, type SceneId } from '@/components/meditation/scenes';
import MeditationPlayer from '@/components/meditation/MeditationPlayer';

export default function MeditationPlayerScreen() {
  const router = useRouter();
  const { scene: sceneId } = useLocalSearchParams<{ scene: SceneId }>();
  const { t } = useLanguage();

  const scene = MEDITATION_SCENES.find((s) => s.id === sceneId) ?? MEDITATION_SCENES[0];
  const strings = t.tanafas.meditation.scenes[scene.id];

  return (
    <MeditationPlayer
      scene={scene}
      sceneName={strings.name}
      sceneDescription={strings.description}
      placeholderNotice={t.tanafas.meditation.player.placeholderNotice}
      onExit={() => router.back()}
    />
  );
}
