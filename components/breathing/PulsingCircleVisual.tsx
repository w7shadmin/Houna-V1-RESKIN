import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wind, CheckCircle2 } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, typography } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import type { PhaseVisualProps } from './types';

interface Props extends PhaseVisualProps {
  accentColor: string;
  readyLabel: string;
  secSuffix: string;
}

const SIZE = 220;

/** Circle that expands on inhale, holds, contracts on exhale — for the 4-7-8 exercise. */
export default function PulsingCircleVisual({
  phase,
  progressInPhase,
  isRunning,
  isComplete,
  accentColor,
  readyLabel,
  secSuffix,
}: Props) {
  const { isRTL, fonts } = useLanguage();

  let scale = 1;
  let opacity = 1;
  if (phase.key === 'inhale') {
    scale = 0.5 + progressInPhase * 0.5;
    opacity = 0.4 + progressInPhase * 0.6;
  } else if (phase.key === 'hold') {
    scale = 1;
    opacity = 1;
  } else if (phase.key === 'exhale') {
    scale = 1 - progressInPhase * 0.5;
    opacity = 1 - progressInPhase * 0.6;
  }

  const secondsLeft = Math.max(Math.ceil(phase.duration * (1 - progressInPhase)), 0);
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  return (
    <View style={styles.wrap}>
      <View style={[styles.guideRing, { borderColor: accentColor + '40' }]} />
      <View
        style={[
          styles.circle,
          {
            backgroundColor: isComplete ? accentColor + '22' : accentColor,
            transform: [{ scale: isComplete ? 0.85 : scale }],
            opacity: isComplete ? 1 : opacity,
          },
        ]}
      />
      <View style={styles.content}>
        {isComplete ? (
          <CheckCircle2 size={52} color={accentColor} strokeWidth={1.5} />
        ) : isRunning ? (
          <>
            <Text style={[styles.phaseLabel, { fontFamily: fonts.bold }]}>{phase.label}</Text>
            <Text style={[styles.phaseTime, { fontFamily: fonts.semiBold }]}>
              {num(secondsLeft)}
              {secSuffix}
            </Text>
          </>
        ) : (
          <>
            <Wind size={32} color={accentColor} strokeWidth={1.5} />
            <Text style={[styles.readyLabel, { fontFamily: fonts.regular }]}>{readyLabel}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE + 40,
    height: SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideRing: {
    position: 'absolute',
    width: SIZE + 40,
    height: SIZE + 40,
    borderRadius: (SIZE + 40) / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  circle: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: typography.fontSize.xl,
    color: '#ffffff',
  },
  phaseTime: {
    fontSize: typography.fontSize.body,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  readyLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
    marginTop: 8,
  },
});
