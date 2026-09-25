import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Square, CheckCircle2 } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import type { PhaseVisualProps } from './types';

interface Props extends PhaseVisualProps {
  accentColor: string;
  readyLabel: string;
  secSuffix: string;
  phaseCount: number;
}

const SQUARE = 200;
/** Keeps the tracing dot's path inside the dashed border instead of sitting directly on it. */
const TRACK_INSET = 16;
const TRACK_SIZE = SQUARE - TRACK_INSET * 2;

/** Square with a dot tracing the perimeter (one edge per phase) — for box/4x4 breathing. */
export default function TracingSquareVisual({
  phase,
  phaseIndex,
  progressInPhase,
  isRunning,
  isComplete,
  accentColor,
  readyLabel,
  secSuffix,
  phaseCount,
}: Props) {
  const { colors } = useTheme();
  const { isRTL, fonts } = useLanguage();

  let dotX = SQUARE / 2;
  let dotY = SQUARE / 2;
  if (!isComplete) {
    const p = progressInPhase;
    switch (phaseIndex % 4) {
      case 0: dotX = TRACK_INSET + p * TRACK_SIZE; dotY = TRACK_INSET; break;
      case 1: dotX = SQUARE - TRACK_INSET; dotY = TRACK_INSET + p * TRACK_SIZE; break;
      case 2: dotX = TRACK_INSET + (1 - p) * TRACK_SIZE; dotY = SQUARE - TRACK_INSET; break;
      case 3: dotX = TRACK_INSET; dotY = TRACK_INSET + (1 - p) * TRACK_SIZE; break;
    }
  }

  const secondsLeft = Math.max(Math.ceil(phase.duration * (1 - progressInPhase)), 0);
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  return (
    <View style={styles.wrap}>
      <View style={[styles.square, { borderColor: accentColor + '40' }]} />

      {isComplete && (
        <View style={[styles.square, styles.completeFill, { backgroundColor: accentColor + '18' }]} />
      )}

      {!isComplete && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: accentColor,
              left: dotX,
              top: dotY,
              opacity: isRunning ? 1 : 0.4,
            },
          ]}
        />
      )}

      <View style={styles.content}>
        {isComplete ? (
          <CheckCircle2 size={48} color={accentColor} strokeWidth={1.5} />
        ) : isRunning ? (
          <>
            <Text style={[styles.phaseLabel, { color: colors.text, fontFamily: fonts.bold }]}>
              {phase.label}
            </Text>
            <Text style={[styles.phaseTime, { color: accentColor, fontFamily: fonts.semiBold }]}>
              {num(secondsLeft)}
              {secSuffix}
            </Text>
          </>
        ) : (
          <>
            <Square size={30} color={accentColor} strokeWidth={1.5} />
            <Text style={[styles.readyLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {readyLabel}
            </Text>
          </>
        )}
      </View>

      {isRunning && (
        <View style={styles.pips}>
          {Array.from({ length: phaseCount }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.pip,
                {
                  width: i === phaseIndex ? 26 : 14,
                  backgroundColor:
                    i === phaseIndex ? accentColor : i < phaseIndex ? accentColor + '55' : colors.border,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SQUARE,
    height: SQUARE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  square: {
    position: 'absolute',
    width: SQUARE,
    height: SQUARE,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  completeFill: {
    borderWidth: 0,
  },
  dot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    marginTop: -8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: typography.fontSize.xl,
  },
  phaseTime: {
    fontSize: typography.fontSize.body,
    marginTop: 2,
  },
  readyLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: 8,
  },
  pips: {
    position: 'absolute',
    bottom: -32,
    flexDirection: 'row',
    gap: 6,
  },
  pip: {
    height: 6,
    borderRadius: 3,
  },
});
