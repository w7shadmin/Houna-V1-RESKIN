import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Play, Pause, RotateCcw } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { pingActivity, recordTanafasSession } from '@/lib/usageTracking';
import { logSession } from '@/lib/sessionLog';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import type { IconTileTone } from '@/components/ui/IconTile';
import SessionScaffold, { SessionCompletion, SessionLabel, useSessionAccent } from './SessionScaffold';
import type { BreathingPhase, PhaseVisualProps } from './types';

interface PhaseBreathingSessionProps {
  /** Route id (e.g. 'steady-mind') — recorded in the on-device session log for Recap. */
  exerciseId: string;
  title: string;
  subtitle: string;
  /** The exercise's canvas tone: its accent, glows and progress colour. */
  tone: IconTileTone;
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
 * round + progress tracking — and the canvas's session layout (SessionScaffold:
 * length chips, round label, phase row, progress, completion, play/pause). Exercises plug in only
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
  tone,
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
  const accent = useSessionAccent(tone);

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const clock = `${num(Math.floor(secondsRemaining / 60))}:${num(secondsRemaining % 60).padStart(2, num(0))}`;
  const labelLatin = fonts.labelTracked;

  const footer = isComplete ? (
    <Button label={s.startAgain} onPress={handleStart} />
  ) : (
    <>
      {isRunning ? (
        <IconButton
          variant="control"
          size={56}
          accessibilityLabel={s.startAgain}
          onPress={handleStopReset}
          renderIcon={(c) => <RotateCcw size={22} color={c} strokeWidth={1.7} />}
        />
      ) : (
        <View style={styles.sideSlot} />
      )}
      <IconButton
        variant="primary"
        size={80}
        accessibilityLabel={isActive ? s.pause : isPaused ? s.resume : s.begin}
        onPress={isActive ? handlePause : isPaused ? handleResume : handleStart}
        renderIcon={(c) => (isActive ? <Pause size={26} color={c} fill={c} /> : <Play size={28} color={c} fill={c} />)}
      />
      <View style={styles.sideSlot} />
    </>
  );

  return (
    <SessionScaffold title={title} technique={subtitle} tone={tone} exitLabel={s.exit} onExit={handleExit} footer={footer}>
      {isComplete ? (
        <SessionCompletion
          tone={tone}
          title={s.wellDone}
          subtitle={`${s.completedPrefix} ${num(round - 1)} ${round - 1 === 1 ? s.roundSingular : s.roundPlural}`}
          body={completionBody}
        />
      ) : (
        <>
          {isRunning ? (
            <SessionLabel color={accent}>{`${s.round} ${num(round)} ${s.ofTotal} ${num(totalRounds)}`}</SessionLabel>
          ) : (
            <View style={styles.lengths}>
              <SessionLabel color={colors.textTertiary}>{s.chooseSession}</SessionLabel>
              <View style={styles.chips}>
                {sessionOptions.map((mins) => (
                  <Chip
                    key={mins}
                    size="sm"
                    label={`${num(mins)} ${mins === 1 ? s.min : s.minPlural}`}
                    selected={mins === sessionMinutes}
                    onPress={() => setSessionMinutes(mins)}
                  />
                ))}
              </View>
            </View>
          )}

          {renderVisual({ phase: currentPhase, phaseIndex, progressInPhase, isRunning, isPaused, isComplete })}

          {isRunning && (
            <View style={styles.progress}>
              <View style={styles.phaseRow}>
                {phases.map((ph, i) => (
                  <Text
                    key={ph.key}
                    style={[
                      labelLatin ? styles.phaseNameLatin : styles.phaseNameArabic,
                      { color: i === phaseIndex ? colors.text : colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
                    ]}
                  >
                    {ph.label}
                  </Text>
                ))}
              </View>
              <View
                style={[styles.track, { backgroundColor: colors.borderControl }]}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(sessionProgress * 100)}
              >
                <View style={[styles.fill, { width: `${sessionProgress * 100}%`, backgroundColor: accent }]} />
              </View>
              <SessionLabel color={colors.textTertiary}>{isPaused ? s.pause : s.timeLeft.replace('{t}', clock)}</SessionLabel>
            </View>
          )}
        </>
      )}
    </SessionScaffold>
  );
}

const styles = StyleSheet.create({
  sideSlot: {
    width: 56,
  },
  lengths: {
    alignItems: 'center',
    gap: grid(1.5),
  },
  chips: {
    flexDirection: 'row',
    gap: grid(1),
  },
  progress: {
    width: 280,
    alignItems: 'center',
    gap: grid(1.5),
  },
  phaseRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: grid(1.5),
  },
  phaseNameLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    textTransform: 'uppercase',
  },
  phaseNameArabic: {
    fontSize: 13,
  },
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
