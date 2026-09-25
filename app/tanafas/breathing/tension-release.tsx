import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Pause, Play, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { palette, spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { useSessionLog } from '@/hooks/useSessionLog';
import ExerciseHeader from '@/components/breathing/ExerciseHeader';

const RELEASE_COLOR = palette.peach; // #F9A980
const TENSE_COLOR = '#C97654'; // peach, darkened — deep vs. soft, not a new hue
const TENSE_MS = 5000;
const RELEASE_MS = 7000;

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function blend(from: string, to: string, t: number): string {
  const f = hexToRgb(from);
  const g = hexToRgb(to);
  const r = Math.round(f.r + (g.r - f.r) * t);
  const gr = Math.round(f.g + (g.g - f.g) * t);
  const b = Math.round(f.b + (g.b - f.b) * t);
  return `rgb(${r}, ${gr}, ${b})`;
}

export default function TensionReleaseScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const ex = t.tanafas.exercises.tensionRelease;
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
  const secondsLeft = Math.max(Math.ceil((phaseDuration - elapsed) / 1000), 0);
  const isTense = phase === 'tense';
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const minScale = 0.55;
  const scale = isTense ? 1 - progress * (1 - minScale) : minScale + progress * (1 - minScale);
  const fillColor = isTense ? blend(RELEASE_COLOR, TENSE_COLOR, progress) : blend(TENSE_COLOR, RELEASE_COLOR, progress);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ExerciseHeader
        title={ex.title}
        exitLabel={ex.exit}
        onExit={handleExit}
        accentColor={RELEASE_COLOR}
      />

      {!isComplete && (
        <View style={styles.dots}>
          {groups.map((_, i) => (
            <Pressable key={i} onPress={() => goToGroup(i)} hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  {
                    width: i === groupIndex ? 22 : 6,
                    backgroundColor:
                      i === groupIndex ? RELEASE_COLOR : i < groupIndex ? RELEASE_COLOR + '66' : colors.border,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.main}>
        {isComplete ? (
          <View style={styles.completionWrap}>
            <View style={[styles.completionBadge, { backgroundColor: RELEASE_COLOR + '22' }]}>
              <CheckCircle2 size={52} color={TENSE_COLOR} strokeWidth={1.5} />
            </View>
            <Text style={[styles.completionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
              {ex.wellDone}
            </Text>
            <Text style={[styles.completionSubtitle, { color: TENSE_COLOR, fontFamily: fonts.semiBold }]}>
              {ex.releasedTension}
            </Text>
            <Text style={[styles.completionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {ex.completionBody}
            </Text>
          </View>
        ) : (
          <View style={styles.groupWrap}>
            <Text style={[styles.groupName, { color: colors.text, fontFamily: fonts.bold }]}>
              {currentGroup.name}
            </Text>
            <Text style={[styles.phaseLabel, { color: isTense ? TENSE_COLOR : RELEASE_COLOR, fontFamily: fonts.bold }]}>
              {isTense ? ex.tense : ex.release}
            </Text>

            <View style={styles.circleWrap}>
              <View style={[styles.circleGuide, { borderColor: RELEASE_COLOR + '40' }]} />
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: fillColor,
                    transform: [{ scale }],
                  },
                ]}
              />
              <View style={styles.circleContent}>
                <Text style={[styles.countdown, { fontFamily: fonts.bold }]}>{num(secondsLeft)}</Text>
                <Text style={[styles.countdownLabel, { fontFamily: fonts.semiBold }]}>
                  {isTense ? ex.holdTight : ex.letGo}
                </Text>
              </View>
            </View>

            <Text style={[styles.guidance, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {isTense ? currentGroup.tensePrompt : currentGroup.releasePrompt}
            </Text>

            {isRunning && !isPaused && (
              <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%`, backgroundColor: isTense ? TENSE_COLOR : RELEASE_COLOR },
                  ]}
                />
              </View>
            )}

            <Text style={[styles.groupCounter, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {ex.groupOf} {num(groupIndex + 1)} {ex.ofTotal} {num(groups.length)}
            </Text>

            {isPaused && (
              <Text style={[styles.pausedLabel, { color: RELEASE_COLOR, fontFamily: fonts.semiBold }]}>
                {ex.paused}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {isComplete ? (
          <Pressable
            onPress={handleStartAgain}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: RELEASE_COLOR, ...shadows.cardLg },
              pressed && styles.pressed,
            ]}
          >
            <RotateCcw size={20} color={colors.onPrimary} />
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {ex.startAgain}
            </Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={handleBack}
              disabled={groupIndex === 0 && phase === 'tense'}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: groupIndex === 0 && phase === 'tense' ? 0.5 : 1,
                },
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeft size={20} color={colors.textSecondary} style={isRTL ? styles.flip : undefined} />
            </Pressable>

            <Pressable
              onPress={() => setIsPaused((p) => !p)}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: colors.card, borderColor: RELEASE_COLOR },
                pressed && styles.pressed,
              ]}
            >
              {isPaused ? (
                <Play size={20} color={RELEASE_COLOR} fill={RELEASE_COLOR} />
              ) : (
                <Pause size={20} color={RELEASE_COLOR} fill={RELEASE_COLOR} />
              )}
            </Pressable>

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: RELEASE_COLOR, ...shadows.cardLg },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
                {isLastGroup && phase === 'release' ? ex.finish : ex.next}
              </Text>
              {!(isLastGroup && phase === 'release') && (
                <ArrowRight size={20} color={colors.onPrimary} style={isRTL ? styles.flip : undefined} />
              )}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  groupWrap: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  groupName: {
    fontSize: typography.fontSize.lg,
  },
  phaseLabel: {
    fontSize: typography.fontSize.body,
    marginTop: 2,
  },
  circleWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  circleGuide: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  circle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdown: {
    fontSize: 40,
    lineHeight: 44,
    color: '#ffffff',
  },
  countdownLabel: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  guidance: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  progressTrack: {
    width: 160,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  groupCounter: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
  },
  pausedLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  completionWrap: {
    alignItems: 'center',
    maxWidth: 320,
  },
  completionBadge: {
    width: 120,
    height: 120,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    fontSize: typography.fontSize.xxl,
    marginTop: spacing.xl,
  },
  completionSubtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing.xs,
  },
  completionBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
    marginTop: spacing.md,
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
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  pressed: {
    opacity: 0.85,
  },
});
