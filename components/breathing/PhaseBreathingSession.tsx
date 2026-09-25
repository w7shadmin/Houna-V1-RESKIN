import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { pingActivity, recordTanafasSession } from '@/lib/usageTracking';
import { logSession } from '@/lib/sessionLog';
import ExerciseHeader from './ExerciseHeader';
import type { BreathingPhase, PhaseVisualProps } from './types';

interface PhaseBreathingSessionProps {
  /** Route id (e.g. 'steady-mind') — recorded in the on-device session log for Recap. */
  exerciseId: string;
  title: string;
  subtitle: string;
  accentColor: string;
  phases: BreathingPhase[];
  sessionOptions: readonly number[];
  defaultSessionMinutes: number;
  completionBody: string;
  onExit: () => void;
  renderVisual: (props: PhaseVisualProps) => React.ReactNode;
}

const TICK_MS = 100;

/**
 * Reusable session shell for breathing exercises that cycle through a fixed
 * set of timed phases (inhale/hold/exhale/…) for a chosen session length.
 * Owns the whole state machine — session length, running/paused/complete,
 * round + progress tracking — and the shared chrome (header, selector,
 * progress bar, completion message, controls). Exercises plug in only
 * their phase config and a visual (renderVisual); never hardcode one
 * exercise's timings in here.
 *
 * Doesn't fit exercises whose interaction isn't phase-cycling (grounding's
 * step-through, PMR's per-group tense/release) — those are bespoke screens.
 */
export default function PhaseBreathingSession({
  exerciseId,
  title,
  subtitle,
  accentColor,
  phases,
  sessionOptions,
  defaultSessionMinutes,
  completionBody,
  onExit,
  renderVisual,
}: PhaseBreathingSessionProps) {
  const { colors } = useTheme();
  const { t, isRTL, fonts } = useLanguage();
  const s = t.tanafas.session;

  const [sessionMinutes, setSessionMinutes] = useState(defaultSessionMinutes);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsedInPhase, setElapsedInPhase] = useState(0);
  const [round, setRound] = useState(1);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const totalSeconds = sessionMinutes * 60;
  const totalPhaseDuration = phases.reduce((sum, p) => sum + p.duration, 0);
  const totalRounds = Math.ceil(totalSeconds / totalPhaseDuration);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Usage tracking (Alias users only — see lib/usageTracking.ts): set at the
  // moment a session actually starts, recorded and cleared at whichever of
  // the several ways it can end happens first — natural completion, a
  // manual stop/restart, or exiting outright — so a session is counted
  // exactly once whether it finished or was abandoned.
  const sessionStartRef = useRef<Date | null>(null);
  const recordIfStarted = useCallback((endedAt: Date) => {
    if (sessionStartRef.current) {
      recordTanafasSession('breathing', sessionStartRef.current, endedAt).catch(() => {});
      logSession('breathing', exerciseId, sessionStartRef.current, endedAt).catch(() => {});
      sessionStartRef.current = null;
    }
  }, [exerciseId]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    recordIfStarted(new Date());
    setIsRunning(false);
    setIsPaused(false);
    setPhaseIndex(0);
    setElapsedInPhase(0);
    setRound(1);
    setTotalElapsed(0);
    setIsComplete(false);
  }, [stop, recordIfStarted]);

  // Main clock: advances elapsed time in 100ms ticks while running.
  useEffect(() => {
    if (!isRunning || isPaused) return;

    intervalRef.current = setInterval(() => {
      setElapsedInPhase((prev) => prev + TICK_MS / 1000);
      setTotalElapsed((prev) => {
        const next = prev + TICK_MS / 1000;
        if (next >= totalSeconds) {
          stop();
          setIsRunning(false);
          setIsComplete(true);
          recordIfStarted(new Date());
          return totalSeconds;
        }
        return next;
      });
    }, TICK_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, totalSeconds, stop, recordIfStarted]);

  // Phase advance: once the current phase's duration elapses, move to the
  // next phase, wrapping to a new round after the last one.
  useEffect(() => {
    if (!isRunning || isPaused) return;
    const currentPhase = phases[phaseIndex];
    if (elapsedInPhase >= currentPhase.duration) {
      setElapsedInPhase(0);
      if (phaseIndex === phases.length - 1) {
        setRound((r) => r + 1);
        setPhaseIndex(0);
      } else {
        setPhaseIndex((i) => i + 1);
      }
    }
  }, [elapsedInPhase, phaseIndex, isRunning, isPaused, phases]);

  const handleStart = () => {
    if (isComplete) reset();
    sessionStartRef.current = new Date();
    pingActivity('breathing').catch(() => {});
    setIsRunning(true);
    setIsPaused(false);
  };
  const handlePause = () => setIsPaused(true);
  const handleResume = () => setIsPaused(false);
  const handleStopReset = () => reset();
  const handleExit = () => {
    stop();
    recordIfStarted(new Date());
    onExit();
  };

  const currentPhase = phases[phaseIndex];
  const progressInPhase = Math.min(elapsedInPhase / currentPhase.duration, 1);
  const sessionProgress = Math.min(totalElapsed / totalSeconds, 1);
  const secondsRemaining = Math.max(Math.ceil(totalSeconds - totalElapsed), 0);
  const isActive = isRunning && !isPaused;

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ExerciseHeader
        title={title}
        subtitle={subtitle}
        exitLabel={s.exit}
        onExit={handleExit}
        accentColor={accentColor}
      />

      {!isRunning && !isComplete && (
        <View style={styles.selectorWrap}>
          <Text
            style={[styles.selectorLabel, { color: colors.textTertiary, fontFamily: fonts.semiBold }]}
          >
            {s.chooseSession}
          </Text>
          <View style={styles.selectorRow}>
            {sessionOptions.map((mins) => {
              const active = mins === sessionMinutes;
              const unit = mins === 1 ? s.min : s.minPlural;
              return (
                <Pressable
                  key={mins}
                  onPress={() => setSessionMinutes(mins)}
                  style={({ pressed }) => [
                    styles.selectorPill,
                    {
                      backgroundColor: active ? accentColor : colors.card,
                      borderColor: active ? accentColor : colors.border,
                    },
                    pressed && { backgroundColor: colors.cardPressed },
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorPillText,
                      {
                        color: active ? colors.onPrimary : colors.textSecondary,
                        fontFamily: fonts.semiBold,
                      },
                    ]}
                  >
                    {num(mins)} {unit}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.main}>
        {isRunning && (
          <View style={styles.roundRow}>
            <Text style={[styles.roundLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {s.round}
            </Text>
            <Text style={[styles.roundValue, { color: accentColor, fontFamily: fonts.bold }]}>
              {num(round)}
            </Text>
            <Text style={[styles.roundLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {s.ofTotal} {num(totalRounds)}
            </Text>
          </View>
        )}

        {renderVisual({ phase: currentPhase, phaseIndex, progressInPhase, isRunning, isPaused, isComplete })}

        {isRunning && (
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${sessionProgress * 100}%`, backgroundColor: accentColor },
                ]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {num(secondsRemaining)}
              {s.remainingSuffix}
            </Text>
          </View>
        )}

        {isComplete && (
          <View style={styles.completionWrap}>
            <Text style={[styles.completionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
              {s.wellDone}
            </Text>
            <Text style={[styles.completionRounds, { color: accentColor, fontFamily: fonts.semiBold }]}>
              {s.completedPrefix} {num(round - 1)} {round - 1 === 1 ? s.roundSingular : s.roundPlural}
            </Text>
            <Text style={[styles.completionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {completionBody}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: spacing.xxl + insets.bottom }]}>
        {!isRunning && !isComplete && (
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: accentColor, ...shadows.cardLg },
              pressed && styles.pressed,
            ]}
          >
            <Play size={20} color={colors.onPrimary} fill={colors.onPrimary} />
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {s.begin}
            </Text>
          </Pressable>
        )}

        {isActive && (
          <Pressable
            onPress={handlePause}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: accentColor, backgroundColor: colors.card },
              pressed && styles.pressed,
            ]}
          >
            <Pause size={20} color={accentColor} fill={accentColor} />
            <Text style={[styles.secondaryBtnText, { color: accentColor, fontFamily: fonts.bold }]}>
              {s.pause}
            </Text>
          </Pressable>
        )}

        {isPaused && (
          <Pressable
            onPress={handleResume}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: accentColor, ...shadows.cardLg },
              pressed && styles.pressed,
            ]}
          >
            <Play size={20} color={colors.onPrimary} fill={colors.onPrimary} />
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {s.resume}
            </Text>
          </Pressable>
        )}

        {isRunning && (
          <Pressable
            onPress={handleStopReset}
            accessibilityLabel={s.startAgain}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <RotateCcw size={20} color={colors.textTertiary} />
          </Pressable>
        )}

        {isComplete && (
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: accentColor, ...shadows.cardLg },
              pressed && styles.pressed,
            ]}
          >
            <RotateCcw size={20} color={colors.onPrimary} />
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {s.startAgain}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectorWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  selectorLabel: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.sm,
  },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  selectorPill: {
    height: 34,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorPillText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  roundLabel: {
    fontSize: typography.fontSize.xs,
  },
  roundValue: {
    fontSize: typography.fontSize.md,
  },
  progressWrap: {
    width: '100%',
    maxWidth: 320,
    marginTop: spacing.xl,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressLabel: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
  },
  completionWrap: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  completionTitle: {
    fontSize: typography.fontSize.xxl,
  },
  completionRounds: {
    fontSize: typography.fontSize.body,
    marginTop: spacing.xs,
  },
  completionBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 320,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  primaryBtn: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
  },
  primaryBtnText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  secondaryBtn: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
