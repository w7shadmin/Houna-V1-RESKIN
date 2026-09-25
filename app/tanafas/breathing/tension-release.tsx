import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, Pause, Play } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { alpha, grid } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { useSessionLog } from '@/hooks/useSessionLog';
import SessionScaffold, { SessionCompletion, SessionLabel, useSessionAccent } from '@/components/breathing/SessionScaffold';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';

const TONE = 'glow' as const;
const TENSE_MS = 5000;
const RELEASE_MS = 7000;

/**
 * Progressive muscle relaxation: each group tensed, then released, on a
 * timer, with the orb drawing in as you tense and opening as you let go.
 */
export default function TensionReleaseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const ex = t.tanafas.exercises.tensionRelease;
  const accent = useSessionAccent(TONE);
  const groups = ex.groups;

  const [groupIndex, setGroupIndex] = useState(0);
  const [phase, setPhase] = useState<'tense' | 'release'>('tense');
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // On-device session log for Recap: a session runs from opening (or
  // starting again) until completion or leaving the screen.
  const sessionLog = useSessionLog('breathing', 'tension-release');
  const { start: startLog, end: endLog } = sessionLog;
  useEffect(() => {
    if (isComplete) endLog();
    else startLog();
  }, [isComplete, startLog, endLog]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const phaseDuration = phase === 'tense' ? TENSE_MS : RELEASE_MS;

  useEffect(() => {
    if (!isRunning || isPaused || isComplete) {
      clearTimer();
      return;
    }
    const startedAt = Date.now() - elapsed;
    timerRef.current = setInterval(() => {
      const newElapsed = Date.now() - startedAt;
      setElapsed(newElapsed);
      if (newElapsed >= phaseDuration) {
        clearTimer();
        if (phase === 'tense') {
          setPhase('release');
          setElapsed(0);
        } else if (groupIndex >= groups.length - 1) {
          setIsComplete(true);
          setIsRunning(false);
        } else {
          setGroupIndex((i) => i + 1);
          setPhase('tense');
          setElapsed(0);
        }
      }
    }, 50);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isPaused, isComplete, phase, groupIndex]);

  const goToGroup = (index: number, startPhase: 'tense' | 'release' = 'tense') => {
    clearTimer();
    setGroupIndex(index);
    setPhase(startPhase);
    setElapsed(0);
    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);
  };

  const handleNext = () => {
    if (phase === 'tense') {
      clearTimer();
      setPhase('release');
      setElapsed(0);
    } else if (groupIndex >= groups.length - 1) {
      clearTimer();
      setIsComplete(true);
      setIsRunning(false);
    } else {
      goToGroup(groupIndex + 1);
    }
  };

  const handleBack = () => {
    if (isComplete) {
      clearTimer();
      setIsComplete(false);
      setIsRunning(true);
      setGroupIndex(groups.length - 1);
      setPhase('release');
      setElapsed(0);
    } else if (phase === 'release') {
      clearTimer();
      setPhase('tense');
      setElapsed(0);
    } else if (groupIndex > 0) {
      goToGroup(groupIndex - 1, 'release');
    }
  };

  const handleStartAgain = () => goToGroup(0);
  const handleExit = () => {
    clearTimer();
    router.back();
  };

  const currentGroup = groups[groupIndex];
  const progress = Math.min(elapsed / phaseDuration, 1);
  const isLastGroup = groupIndex === groups.length - 1;
  const isFinalStep = isLastGroup && phase === 'release';
  const secondsLeft = Math.max(Math.ceil((phaseDuration - elapsed) / 1000), 0);
  const isTense = phase === 'tense';
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  // Tensing draws the orb in and deepens it; releasing lets it open and soften.
  const scale = isTense ? 1 - progress * 0.4 : 0.6 + progress * 0.4;
  const fill = isTense ? 0.18 + progress * 0.4 : 0.58 - progress * 0.4;

  const footer = isComplete ? (
    <Button label={ex.startAgain} onPress={handleStartAgain} />
  ) : (
    <>
      <IconButton
        variant="control"
        size={56}
        accessibilityLabel={t.directory.common.goBack}
        onPress={handleBack}
        disabled={groupIndex === 0 && isTense}
        renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={22} strokeWidth={1.8} color={c} />}
      />
      <IconButton
        variant="primary"
        size={80}
        accessibilityLabel={isPaused ? t.tanafas.session.resume : t.tanafas.session.pause}
        onPress={() => setIsPaused((v) => !v)}
        renderIcon={(c) => (isPaused ? <Play size={28} color={c} fill={c} /> : <Pause size={26} color={c} fill={c} />)}
      />
      <IconButton
        variant="control"
        size={56}
        accessibilityLabel={isFinalStep ? ex.finish : ex.next}
        onPress={handleNext}
        renderIcon={(c) =>
          isFinalStep ? <Check size={22} color={c} strokeWidth={1.8} /> : <DirectionalIcon isRTL={isRTL} name="arrow" size={22} strokeWidth={1.8} color={c} />
        }
      />
    </>
  );

  return (
    <SessionScaffold title={ex.title} tone={TONE} exitLabel={ex.exit} onExit={handleExit} footer={footer}>
      {isComplete ? (
        <SessionCompletion tone={TONE} title={ex.wellDone} subtitle={ex.releasedTension} body={ex.completionBody} />
      ) : (
        <>
          <View style={styles.groupHead}>
            <SessionLabel color={accent}>{isTense ? ex.tense : ex.release}</SessionLabel>
            <Text style={[styles.groupName, isRTL && styles.groupNameArabic, { color: colors.text, fontFamily: fonts.display }]}>
              {currentGroup.name}
            </Text>
          </View>

          <View style={styles.box} accessibilityLiveRegion="polite">
            <View style={[styles.dotted, { borderColor: alpha(accent, 0.4) }]} />
            <View style={[styles.inner, { borderColor: colors.borderControl }]} />
            <View
              style={[
                styles.orb,
                {
                  backgroundColor: alpha(accent, fill),
                  borderColor: alpha(accent, 0.5),
                  boxShadow: `0 0 42px ${alpha(accent, 0.45)}`,
                  transform: [{ scale }],
                },
              ]}
            />
            <View style={styles.centre}>
              <Text style={[styles.countdown, isRTL && styles.countdownArabic, { color: colors.text, fontFamily: fonts.display }]}>
                {num(secondsLeft)}
              </Text>
              <Text style={[styles.cue, { color: colors.textSecondary, fontFamily: fonts.medium }]}>{isTense ? ex.holdTight : ex.letGo}</Text>
            </View>
          </View>

          <Text style={[styles.guidance, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
            {isTense ? currentGroup.tensePrompt : currentGroup.releasePrompt}
          </Text>

          <View style={styles.progress}>
            <View style={[styles.track, { backgroundColor: colors.borderControl }]}>
              <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
            </View>
            <SessionLabel color={colors.textTertiary}>
              {isPaused ? ex.paused : `${ex.groupOf} ${num(groupIndex + 1)} ${ex.ofTotal} ${num(groups.length)}`}
            </SessionLabel>
          </View>
        </>
      )}
    </SessionScaffold>
  );
}

const styles = StyleSheet.create({
  groupHead: {
    alignItems: 'center',
    gap: grid(1),
  },
  groupName: {
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
  },
  groupNameArabic: {
    lineHeight: 48,
  },
  box: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotted: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: 'dotted',
  },
  inner: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
  },
  orb: {
    position: 'absolute',
    width: 184,
    height: 184,
    borderRadius: 92,
    borderWidth: 1,
  },
  centre: {
    alignItems: 'center',
    gap: 4,
  },
  countdown: {
    fontSize: 46,
    lineHeight: 52,
  },
  countdownArabic: {
    lineHeight: 72,
  },
  cue: {
    fontSize: 14,
  },
  guidance: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  progress: {
    width: 240,
    alignItems: 'center',
    gap: grid(1.5),
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
