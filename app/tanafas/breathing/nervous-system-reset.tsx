import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Play, Pause, RotateCcw, Snowflake, CheckCircle2, TriangleAlert } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { palette, spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { pingActivity } from '@/lib/usageTracking';
import ExerciseHeader from '@/components/breathing/ExerciseHeader';

const ACCENT = palette.lightCyan;
const BREATH_COUNT = 30;
const RECOVERY_DURATION = 15;
const TOTAL_ROUNDS = 3;
// Beginner progressive build-up: hold target increases each round. A guide
// only — the hold never auto-advances at this target, the user always ends
// it themselves (see handleEndHold).
const HOLD_TARGETS = [30, 60, 90];

const RING_SIZE = 240;
const RING_RADIUS = 98;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type Phase = 'breathe' | 'hold' | 'recovery';

export default function NervousSystemResetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const ex = t.tanafas.exercises.nervousSystemReset;

  const [acknowledged, setAcknowledged] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>('breathe');
  const [breathNum, setBreathNum] = useState(0);
  const [holdElapsed, setHoldElapsed] = useState(0);
  const [recoveryElapsed, setRecoveryElapsed] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [isComplete, setIsComplete] = useState(false);

  const timersRef = useRef<Array<ReturnType<typeof setInterval>>>([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearInterval);
    timersRef.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setIsRunning(false);
    setIsPaused(false);
    setPhase('breathe');
    setBreathNum(0);
    setHoldElapsed(0);
    setRecoveryElapsed(0);
    setCurrentRound(1);
    setIsComplete(false);
  }, [clearTimers]);

  const handleExit = () => {
    clearTimers();
    router.back();
  };

  // Breath counter — one full breath per second during the paced-breathing phase.
  useEffect(() => {
    if (!isRunning || isPaused || isComplete || phase !== 'breathe') return;
    const id = setInterval(() => {
      setBreathNum((b) => {
        const next = b + 1;
        if (next >= BREATH_COUNT) {
          setPhase('hold');
          setHoldElapsed(0);
          return BREATH_COUNT;
        }
        return next;
      });
    }, 1000);
    timersRef.current.push(id);
    return () => clearInterval(id);
  }, [isRunning, isPaused, isComplete, phase]);

  // Hold timer — counts UP every second. Never auto-advances; the user ends
  // it themselves via handleEndHold. This is a safety requirement, not a
  // preference — do not add a cap or auto-advance here.
  useEffect(() => {
    if (!isRunning || isPaused || isComplete || phase !== 'hold') return;
    const id = setInterval(() => setHoldElapsed((s) => s + 1), 1000);
    timersRef.current.push(id);
    return () => clearInterval(id);
  }, [isRunning, isPaused, isComplete, phase]);

  // Recovery breath — fixed duration, then advances the round or completes.
  useEffect(() => {
    if (!isRunning || isPaused || isComplete || phase !== 'recovery') return;
    const id = setInterval(() => {
      setRecoveryElapsed((s) => {
        const next = s + 1;
        if (next >= RECOVERY_DURATION) {
          if (currentRound >= TOTAL_ROUNDS) {
            setIsRunning(false);
            setIsComplete(true);
          } else {
            setCurrentRound((r) => r + 1);
            setPhase('breathe');
            setBreathNum(0);
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    timersRef.current.push(id);
    return () => clearInterval(id);
  }, [isRunning, isPaused, isComplete, phase, currentRound]);

  const handleStart = () => {
    if (isComplete) reset();
    // Community counter only — never recordTanafasSession, which feeds
    // streaks and the leaderboard (CLAUDE.md: no streaks on this exercise).
    pingActivity('breathing').catch(() => {});
    setIsRunning(true);
    setIsPaused(false);
    setPhase('breathe');
    setBreathNum(0);
  };
  const handlePause = () => {
    setIsPaused(true);
    clearTimers();
  };
  const handleResume = () => setIsPaused(false);
  const handleEndHold = () => {
    setPhase('recovery');
    setRecoveryElapsed(0);
  };
  const handleStopReset = () => reset();

  const isActive = isRunning && !isPaused;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  // ---- SAFETY WARNING — shown before every session, never persisted ----
  if (!acknowledged) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ExerciseHeader
          title={ex.title}
          exitLabel={ex.cancel}
          onExit={handleExit}
          accentColor={ACCENT}
        />
        <View style={styles.warningWrap}>
          <View style={[styles.warningIcon, { backgroundColor: '#FFF2CC' }]}>
            <TriangleAlert size={40} color="#B8860B" strokeWidth={1.8} />
          </View>
          <Text style={[styles.warningTitle, { color: colors.text, fontFamily: fonts.bold }]}>
            {ex.pleaseRead}
          </Text>
          <Text style={[styles.warningSubtitle, { color: '#B8860B', fontFamily: fonts.semiBold }]}>
            {ex.subtitle}
          </Text>
          <View style={[styles.warningCard, { backgroundColor: '#FFF9E8', borderColor: '#F0E0A8' }]}>
            <Text style={[styles.warningBody, { color: colors.text, fontFamily: fonts.regular }]}>
              {ex.warningBody}
            </Text>
          </View>
          <Pressable
            onPress={() => setAcknowledged(true)}
            style={({ pressed }) => [
              styles.warningBtn,
              { backgroundColor: ACCENT, ...shadows.cardLg },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.warningBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {ex.iUnderstand}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleExit}
            hitSlop={8}
            style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.cancelText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {ex.cancel}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---- MAIN EXERCISE ----
  const holdTarget = HOLD_TARGETS[currentRound - 1];
  const holdRingProgress = phase === 'hold' ? Math.min(holdElapsed / holdTarget, 1) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ExerciseHeader
        title={ex.title}
        subtitle={ex.subtitle}
        exitLabel={ex.exit}
        onExit={handleExit}
        accentColor={ACCENT}
      />

      {!isRunning && !isComplete && (
        <View style={styles.overviewWrap}>
          <Text style={[styles.overviewLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
            {ex.sessionOverview}
          </Text>
          <View style={styles.overviewRow}>
            {HOLD_TARGETS.map((target, i) => (
              <View
                key={i}
                style={[styles.overviewPill, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.overviewPillText, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>
                  {ex.roundN} {num(i + 1)} · {num(target)}
                  {ex.holdSuffix}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.main}>
        {isRunning && !isComplete && (
          <View style={styles.roundRow}>
            <Text style={[styles.roundLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {ex.round}
            </Text>
            <Text style={[styles.roundValue, { color: ACCENT, fontFamily: fonts.bold }]}>{num(currentRound)}</Text>
            <Text style={[styles.roundLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {ex.ofTotal} {num(TOTAL_ROUNDS)}
            </Text>
          </View>
        )}

        <View style={styles.ringWrap}>
          <View style={[styles.guideRing, { borderColor: ACCENT + '40' }]} />

          {isComplete && <View style={[styles.guideRing, { backgroundColor: ACCENT + '18', borderWidth: 0 }]} />}

          {isRunning && phase === 'hold' && (
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              style={StyleSheet.absoluteFillObject}
              // Rotate so progress starts at the top, matching the guide ring.
            >
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke={ACCENT + '20'}
                strokeWidth={3}
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke={ACCENT}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - holdRingProgress)}
                rotation={-90}
                originX={RING_SIZE / 2}
                originY={RING_SIZE / 2}
              />
            </Svg>
          )}

          <View style={styles.ringContent}>
            {isComplete ? (
              <CheckCircle2 size={48} color={ACCENT} strokeWidth={1.5} />
            ) : isRunning ? (
              <>
                <Text style={[styles.phaseLabel, { color: colors.text, fontFamily: fonts.bold }]}>
                  {phase === 'breathe' ? ex.breathe : phase === 'hold' ? ex.hold : ex.recoveryBreath}
                </Text>
                {phase === 'breathe' && (
                  <Text style={[styles.phaseValue, { color: ACCENT, fontFamily: fonts.bold }]}>
                    {num(breathNum)}
                    <Text style={[styles.phaseValueSuffix, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                      /{num(BREATH_COUNT)}
                    </Text>
                  </Text>
                )}
                {phase === 'hold' && (
                  <>
                    <Text style={[styles.phaseValue, { color: ACCENT, fontFamily: fonts.bold }]}>
                      {num(holdElapsed)}
                      <Text style={[styles.phaseValueSuffix, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                        {ex.sec}
                      </Text>
                    </Text>
                    <Text style={[styles.targetLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                      {ex.target} {num(holdTarget)}
                      {ex.sec}
                    </Text>
                  </>
                )}
                {phase === 'recovery' && (
                  <>
                    <Text style={[styles.recoveryLabel, { color: ACCENT, fontFamily: fonts.semiBold }]}>
                      {ex.holdTheBreathIn}
                    </Text>
                    <Text style={[styles.recoveryValue, { color: colors.textSecondary, fontFamily: fonts.bold }]}>
                      {num(Math.max(RECOVERY_DURATION - recoveryElapsed, 0))}
                      {ex.sec}
                    </Text>
                  </>
                )}
              </>
            ) : (
              <>
                <Snowflake size={32} color={ACCENT} strokeWidth={1.5} />
                <Text style={[styles.readyLabel, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                  {ex.ready}
                </Text>
              </>
            )}
          </View>
        </View>

        {isRunning && !isComplete && (
          <View style={styles.guideWrap}>
            {phase === 'breathe' && (
              <Text style={[styles.guideText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {ex.breatheGuide}
              </Text>
            )}
            {phase === 'hold' && (
              <>
                <Text style={[styles.guideText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                  {ex.holdGuide}
                </Text>
                <Pressable
                  onPress={handleEndHold}
                  style={({ pressed }) => [
                    styles.endHoldBtn,
                    { backgroundColor: ACCENT, ...shadows.cardLg },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.endHoldBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
                    {ex.imDoneHolding}
                  </Text>
                </Pressable>
              </>
            )}
            {phase === 'recovery' && (
              <Text style={[styles.guideText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {ex.recoveryGuide}
              </Text>
            )}
          </View>
        )}

        {isComplete && (
          <View style={styles.completionWrap}>
            <Text style={[styles.completionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
              {ex.wellDone}
            </Text>
            <Text style={[styles.completionSubtitle, { color: ACCENT, fontFamily: fonts.semiBold }]}>
              {ex.completedAll}
            </Text>
            <Text style={[styles.completionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {ex.completionBody}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {!isRunning && !isComplete && (
          <Pressable
            onPress={handleStart}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: ACCENT, ...shadows.cardLg },
              pressed && styles.pressed,
            ]}
          >
            <Play size={20} color={colors.onPrimary} fill={colors.onPrimary} />
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {ex.begin}
            </Text>
          </Pressable>
        )}

        {isActive && phase !== 'hold' && (
          <Pressable
            onPress={handlePause}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: ACCENT, backgroundColor: colors.card },
              pressed && styles.pressed,
            ]}
          >
            <Pause size={20} color={ACCENT} fill={ACCENT} />
            <Text style={[styles.secondaryBtnText, { color: ACCENT, fontFamily: fonts.bold }]}>{ex.pause}</Text>
          </Pressable>
        )}

        {isPaused && (
          <Pressable
            onPress={handleResume}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: ACCENT, ...shadows.cardLg },
              pressed && styles.pressed,
            ]}
          >
            <Play size={20} color={colors.onPrimary} fill={colors.onPrimary} />
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {ex.resume}
            </Text>
          </Pressable>
        )}

        {isRunning && (
          <Pressable
            onPress={handleStopReset}
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
              { backgroundColor: ACCENT, ...shadows.cardLg },
              pressed && styles.pressed,
            ]}
          >
            <RotateCcw size={20} color={colors.onPrimary} />
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
              {ex.startAgain}
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
  warningWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  warningIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    fontSize: typography.fontSize.xl,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  warningSubtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  warningCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  warningBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
  },
  warningBtn: {
    width: '100%',
    maxWidth: 320,
    height: 54,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  warningBtnText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  cancelBtn: {
    height: 34,
    marginTop: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
  overviewWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  overviewLabel: {
    textAlign: 'center',
    fontSize: typography.fontSize.xs,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  overviewPill: {
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewPillText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  roundRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  roundLabel: {
    fontSize: typography.fontSize.xs,
  },
  roundValue: {
    fontSize: typography.fontSize.md,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  ringContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: typography.fontSize.xl,
  },
  phaseValue: {
    fontSize: typography.fontSize.xxl,
    marginTop: 2,
  },
  phaseValueSuffix: {
    fontSize: typography.fontSize.sm,
  },
  targetLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  recoveryLabel: {
    fontSize: typography.fontSize.body,
    marginTop: 4,
  },
  recoveryValue: {
    fontSize: typography.fontSize.xl,
    marginTop: 2,
  },
  readyLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  guideWrap: {
    width: '100%',
    maxWidth: 320,
    marginTop: spacing.lg,
  },
  guideText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
  },
  endHoldBtn: {
    height: 54,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  endHoldBtnText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  completionWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
    maxWidth: 320,
  },
  completionTitle: {
    fontSize: typography.fontSize.xxl,
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
