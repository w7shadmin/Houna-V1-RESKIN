import React from 'react';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { palette } from '@/constants/theme';
import PhaseBreathingSession from '@/components/breathing/PhaseBreathingSession';
import PulsingCircleVisual from '@/components/breathing/PulsingCircleVisual';
import type { BreathingPhase } from '@/components/breathing/types';

const SESSION_OPTIONS = [1, 3, 5] as const;

export default function AnxietyReliefBreathingScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const ex = t.tanafas.exercises.anxietyRelief;
  const s = t.tanafas.session;
  const accent = palette.turquoise;

  const phases: BreathingPhase[] = [
    { key: 'inhale', label: ex.inhale, duration: 4 },
    { key: 'hold', label: ex.hold, duration: 7 },
    { key: 'exhale', label: ex.exhale, duration: 8 },
  ];

  return (
    <PhaseBreathingSession
      title={ex.title}
      subtitle={ex.subtitle}
      accentColor={accent}
      phases={phases}
      sessionOptions={SESSION_OPTIONS}
      defaultSessionMinutes={3}
      completionBody={ex.completionBody}
      onExit={() => router.back()}
      renderVisual={(visual) => (
        <PulsingCircleVisual
          {...visual}
          accentColor={accent}
          readyLabel={s.ready}
          secSuffix={s.sec}
        />
      )}
    />
  );
}
