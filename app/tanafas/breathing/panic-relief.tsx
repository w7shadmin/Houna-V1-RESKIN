import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Eye,
  Hand,
  Ear,
  Flower2,
  Coffee,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { palette, spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import ExerciseHeader from '@/components/breathing/ExerciseHeader';

const ACCENT = palette.raspberry;
const STEP_ICONS: LucideIcon[] = [Eye, Hand, Ear, Flower2, Coffee];

export default function PanicReliefGroundingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const ex = t.tanafas.exercises.panicRelief;
  const steps = ex.steps;

  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (isComplete) {
      setIsComplete(false);
      setStepIndex(steps.length - 1);
    } else if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  };

  const handleStartAgain = () => {
    setStepIndex(0);
    setIsComplete(false);
  };

  const handleExit = () => router.back();

  const currentStep = steps[stepIndex];
  const Icon = STEP_ICONS[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const isFirstStep = stepIndex === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ExerciseHeader
        title={ex.title}
        subtitle={ex.subtitle}
        exitLabel={ex.exit}
        onExit={handleExit}
        accentColor={ACCENT}
      />

      {!isComplete && (
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <Pressable key={i} onPress={() => setStepIndex(i)} hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  {
                    width: i === stepIndex ? 26 : 8,
                    backgroundColor:
                      i === stepIndex ? ACCENT : i < stepIndex ? ACCENT + '66' : colors.border,
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
            <View style={[styles.completionBadge, { backgroundColor: ACCENT + '18' }]}>
              <CheckCircle2 size={52} color={ACCENT} strokeWidth={1.5} />
            </View>
            <Text style={[styles.completionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
              {ex.completionTitle}
            </Text>
            <Text style={[styles.completionSubtitle, { color: ACCENT, fontFamily: fonts.semiBold }]}>
              {ex.completionSubtitle}
            </Text>
            <Text style={[styles.completionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {ex.completionBody}
            </Text>
          </View>
        ) : (
          <View style={styles.stepWrap}>
            <View style={[styles.iconBadge, { backgroundColor: ACCENT }]}>
              <Icon size={22} color={colors.onPrimary} strokeWidth={1.8} />
            </View>

            <Text style={[styles.count, { color: colors.text, fontFamily: fonts.bold }]}>
              {num(currentStep.count)}
            </Text>

            <Text style={[styles.prompt, { color: colors.text, fontFamily: fonts.bold }]}>
              {currentStep.prompt}
            </Text>
            <Text style={[styles.hint, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {ex.takeYourTime}
            </Text>

            <Text style={[styles.stepCounter, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {ex.stepCounter(stepIndex + 1, steps.length, currentStep.sense)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {isComplete ? (
          <Pressable
            onPress={handleStartAgain}
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
        ) : (
          <>
            <Pressable
              onPress={handleBack}
              disabled={isFirstStep}
              style={({ pressed }) => [
                styles.iconBtn,
                {
                  backgroundColor: isFirstStep ? colors.surface : colors.card,
                  borderColor: colors.border,
                  opacity: isFirstStep ? 0.5 : 1,
                },
                pressed && !isFirstStep && styles.pressed,
              ]}
            >
              <ArrowLeft size={20} color={colors.textSecondary} style={isRTL ? styles.flip : undefined} />
            </Pressable>

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: ACCENT, ...shadows.cardLg },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
                {isLastStep ? ex.finish : ex.next}
              </Text>
              {!isLastStep && (
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
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  stepWrap: {
    alignItems: 'center',
    maxWidth: 340,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 104,
    lineHeight: 112,
    marginTop: spacing.md,
  },
  prompt: {
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  hint: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  stepCounter: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.lg,
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
