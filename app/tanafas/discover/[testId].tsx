import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, layout, nightPalette } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import { getTest } from '@/constants/psychometrics';
import { scoreTest } from '@/lib/psychometrics/score';
import { saveResultLocally } from '@/lib/psychometrics/results';
import type { Answers } from '@/lib/psychometrics/types';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import ScreenGlow from '@/components/ui/ScreenGlow';
import CanvasIcon from '@/components/ui/CanvasIcon';

/** ~10 seconds a statement, for the "~N min left" estimate. */
const SECONDS_PER_ITEM = 10;

/**
 * One self-reflection test (canvas "Self-reflection — question"). An intro
 * with the source and the not-a-diagnosis disclaimer comes first, then one
 * statement per screen. Leaving never asks "are you sure?" — no pressure.
 * On finish, scores are computed and stored on this phone only.
 */
export default function TestScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL, language } = useLanguage();
  const s = t.discover.test;
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const test = getTest(testId ?? '');
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  /** -1 = intro. */
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [finishing, setFinishing] = useState(false);

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/tanafas'));

  if (!test) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.inner}>
          <IconButton variant="subtle" accessibilityLabel={s.leave} onPress={leave} renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />} />
          <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.notFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const total = test.items.length;
  const item = step >= 0 ? test.items[step] : null;
  const chosen = item ? answers[item.id] : undefined;
  const labels = test.scale.labels[language];
  const dusk = colors.tones.dusk.fg;
  const labelLatin = fonts.labelTracked;

  const finish = async () => {
    setFinishing(true);
    try {
      const result = await saveResultLocally(test.id, test.version, scoreTest(test, answers));
      router.replace({ pathname: '/tanafas/discover/result/[resultId]', params: { resultId: result.id } });
    } catch {
      setFinishing(false);
    }
  };

  const next = () => (step === total - 1 ? finish() : setStep(step + 1));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScreenGlow color={alpha(nightPalette.dusk, 0.2)} rx={80} ry={36} cy={22} />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <IconButton
            variant="subtle"
            accessibilityLabel={s.leave}
            onPress={leave}
            renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />}
          />
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
            {test.title[language]}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {!item ? (
          <>
            <Text accessibilityRole="header" style={[styles.introTitle, isRTL && styles.introTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
              {test.title[language]}
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{test.description[language]}</Text>
            <Text style={[styles.source, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {s.source}: {test.source.citation}
            </Text>
            <View style={[styles.disclaimer, { backgroundColor: colors.crisis.bg, borderColor: colors.crisis.borderSoft }]}>
              <CanvasIcon name="shield" size={20} strokeWidth={1.7} color={colors.tones.dawn.fg} />
              <Text style={[styles.disclaimerText, { color: colors.text, fontFamily: fonts.regular }]}>{s.disclaimer}</Text>
            </View>
            <View style={styles.footer}>
              <Button label={s.begin} onPress={() => setStep(0)} block style={styles.primary} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.progressWrap}>
              <View style={styles.progressText}>
                {[
                  s.progress.replace('{i}', num(step + 1)).replace('{n}', num(total)),
                  s.minutesLeft.replace('{n}', num(Math.max(1, Math.ceil(((total - step) * SECONDS_PER_ITEM) / 60)))),
                ].map((txt) => (
                  <Text
                    key={txt}
                    style={[
                      labelLatin ? styles.metaLatin : styles.metaArabic,
                      { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
                    ]}
                  >
                    {txt}
                  </Text>
                ))}
              </View>
              <View
                accessibilityRole="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={step + 1}
                style={[styles.track, { backgroundColor: colors.borderControl }]}
              >
                <View style={[styles.trackFill, { width: `${((step + 1) / total) * 100}%`, backgroundColor: dusk }]} />
              </View>
            </View>

            <View style={styles.question}>
              {test.prompt && (
                <Text
                  style={[
                    labelLatin ? styles.promptLatin : styles.promptArabic,
                    { color: dusk, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
                  ]}
                >
                  {test.prompt[language]}
                </Text>
              )}
              <Text accessibilityRole="header" style={[styles.statement, isRTL && styles.statementArabic, { color: colors.text, fontFamily: fonts.display }]}>
                {item.text[language]}
              </Text>
            </View>

            <View accessibilityRole="radiogroup" accessibilityLabel={s.answerLabel} style={styles.options}>
              {labels.map((label, k) => {
                const value = test.scale.min + k;
                const selected = chosen === value;
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="radio"
                    aria-checked={selected}
                    onPress={() => setAnswers((a) => ({ ...a, [item.id]: value }))}
                    style={({ pressed }) => [
                      styles.option,
                      selected
                        ? { backgroundColor: alpha(nightPalette.dusk, 0.14), borderColor: dusk }
                        : { backgroundColor: colors.card, borderColor: colors.border },
                      pressed && !selected && styles.pressed,
                    ]}
                  >
                    <View style={[styles.radio, { borderColor: selected ? dusk : colors.ringIdle, backgroundColor: selected ? dusk : 'transparent' }]} />
                    <Text style={[styles.optionText, { color: colors.text, fontFamily: fonts.medium }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.footer, styles.navRow]}>
              <Button label={s.back} variant="secondary" onPress={() => setStep(step - 1)} style={styles.back} />
              <Button
                label={step === total - 1 ? s.seeResults : s.next}
                onPress={next}
                disabled={chosen === undefined}
                loading={finishing}
                style={styles.next}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    paddingBottom: 40,
    gap: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  introTitle: {
    fontSize: 30,
    lineHeight: 34,
  },
  introTitleArabic: {
    lineHeight: 46,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 14.5 * 1.5,
  },
  source: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  progressWrap: {
    gap: 10,
  },
  progressText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.12,
    textTransform: 'uppercase',
  },
  metaArabic: {
    fontSize: 13,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
  },
  question: {
    gap: 10,
    paddingTop: 18,
  },
  promptLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.14,
    textTransform: 'uppercase',
  },
  promptArabic: {
    fontSize: 13,
  },
  statement: {
    fontSize: 28,
    lineHeight: 28 * 1.22,
  },
  statementArabic: {
    lineHeight: 44,
  },
  options: {
    gap: 10,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 15.5,
  },
  pressed: {
    opacity: 0.85,
  },
  footer: {
    marginTop: 'auto',
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    height: 56,
  },
  back: {
    flex: 1,
    height: 54,
    alignSelf: 'auto',
  },
  next: {
    flex: 2,
    height: 54,
    alignSelf: 'auto',
  },
});
