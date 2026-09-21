import React from 'react';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import PhaseBreathingSession from '@/components/breathing/PhaseBreathingSession';
import TracingSquareVisual from '@/components/breathing/TracingSquareVisual';
import type { BreathingPhase } from '@/components/breathing/types';

const SESSION_OPTIONS = [1, 3, 5] as const;
// Yellow (#FFF200) is a brand secondary color, but pure yellow reads poorly
// as a small dot/text accent on a light background — darkened for contrast
// while staying recognizably "yellow", not introducing a new hue.
const ACCENT = '#C9A600';

export default function SteadyMindBreathingScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const ex = t.tanafas.exercises.steadyMind;
  const s = t.tanafas.session;

  const phases: BreathingPhase[] = [
    { key: 'inhale', label: ex.inhale, duration: 4 },
    { key: 'hold-top', label: ex.hold, duration: 4 },
    { key: 'exhale', label: ex.exhale, duration: 4 },
    { key: 'hold-bottom', label: ex.hold, duration: 4 },
  ];

  return (
    <PhaseBreathingSession
      title={ex.title}
      subtitle={ex.subtitle}
      accentColor={ACCENT}
      phases={phases}
      sessionOptions={SESSION_OPTIONS}
      defaultSessionMinutes={3}
      completionBody={ex.completionBody}
      onExit={() => router.back()}
      renderVisual={(visual) => (
        <TracingSquareVisual
          {...visual}
          accentColor={ACCENT}
          readyLabel={s.ready}
          secSuffix={s.sec}
          phaseCount={phases.length}
        />
      )}
    />
  );
}
