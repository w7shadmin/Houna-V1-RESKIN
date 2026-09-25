import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, Hand, Ear, Flower2, Coffee, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, grid } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import { useSessionLog } from '@/hooks/useSessionLog';
import SessionScaffold, { SessionCompletion, SessionLabel, useSessionAccent } from '@/components/breathing/SessionScaffold';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import IconTile from '@/components/ui/IconTile';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';

const TONE = 'dawn' as const;
const STEP_ICONS: LucideIcon[] = [Eye, Hand, Ear, Flower2, Coffee];

/**
 * Five-senses grounding (5-4-3-2-1) for panic: one sense per step, the count
 * large in the display face, the prompt beneath. In the dawn tone — the
 * canvas's colour for warmth and urgent support.
 */
export default function PanicReliefGroundingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const ex = t.tanafas.exercises.panicRelief;
  const steps = ex.steps;
  const accent = useSessionAccent(TONE);

  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // On-device session log for Recap: a session runs from opening (or
  // starting again) until completion or leaving the screen.
  const sessionLog = useSessionLog('breathing', 'panic-relief');
  const { start: startLog, end: endLog } = sessionLog;
  useEffect(() => {
    if (isComplete) endLog();
    else startLog();
  }, [isComplete, startLog, endLog]);

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const step = steps[stepIndex];
  const Icon = STEP_ICONS[stepIndex];

  const handleNext = () => (isLastStep ? setIsComplete(true) : setStepIndex((i) => i + 1));
  const handleBack = () => {
    if (isComplete) {
      setIsComplete(false);
      setStepIndex(steps.length - 1);
    } else if (!isFirstStep) {
      setStepIndex((i) => i - 1);
    }
  };
  const handleStartAgain = () => {
    setStepIndex(0);
    setIsComplete(false);
  };

  const footer = isComplete ? (
    <Button label={ex.startAgain} onPress={handleStartAgain} />
  ) : (
    <>
      <IconButton
        variant="control"
        size={56}
        accessibilityLabel={t.directory.common.goBack}
        onPress={handleBack}
        disabled={isFirstStep}
        renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={22} strokeWidth={1.8} color={c} />}
      />
      <Button label={isLastStep ? ex.finish : ex.next} onPress={handleNext} />
    </>
  );

  return (
    <SessionScaffold title={ex.title} technique={ex.subtitle} tone={TONE} exitLabel={ex.exit} onExit={() => router.back()} footer={footer}>
      {isComplete ? (
        <SessionCompletion tone={TONE} title={ex.completionTitle} subtitle={ex.completionSubtitle} body={ex.completionBody} />
      ) : (
        <>
          <View style={styles.steps} accessibilityRole="tablist">
            {steps.map((s, i) => (
              <Pressable
                key={i}
                onPress={() => setStepIndex(i)}
                hitSlop={8}
                accessibilityRole="tab"
                aria-selected={i === stepIndex}
                accessibilityLabel={ex.stepCounter(i + 1, steps.length, s.sense)}
              >
                <View
                  style={[
                    styles.step,
                    {
                      width: i === stepIndex ? grid(3) : grid(1),
                      backgroundColor: i === stepIndex ? accent : i < stepIndex ? alpha(accent, 0.45) : colors.borderControl,
                    },
                  ]}
                />
              </Pressable>
            ))}
          </View>

          <View style={styles.stepBody} accessibilityLiveRegion="polite">
            <IconTile tone={TONE} renderIcon={(c, size) => <Icon size={size} color={c} strokeWidth={1.6} />} />
            <Text style={[styles.count, isRTL && styles.countArabic, { color: colors.text, fontFamily: fonts.display }]}>{num(step.count)}</Text>
            <Text style={[styles.prompt, isRTL && styles.promptArabic, { color: colors.text, fontFamily: fonts.display }]}>{step.prompt}</Text>
            <Text style={[styles.hint, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{ex.takeYourTime}</Text>
          </View>

          <SessionLabel color={colors.textTertiary}>{ex.stepCounter(stepIndex + 1, steps.length, step.sense)}</SessionLabel>
        </>
      )}
    </SessionScaffold>
  );
}

const styles = StyleSheet.create({
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
  },
  step: {
    height: grid(1),
    borderRadius: grid(0.5),
  },
  stepBody: {
    alignItems: 'center',
    gap: grid(1.5),
    maxWidth: 340,
  },
  count: {
    fontSize: 96,
    lineHeight: 104,
  },
  countArabic: {
    lineHeight: 140,
  },
  prompt: {
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  promptArabic: {
    lineHeight: 44,
  },
  hint: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
});
