import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { alpha, layout, nightPalette } from '@/constants/theme';
import { getTest } from '@/constants/psychometrics';
import { getResult, saveResultToProfile, type StoredResult } from '@/lib/psychometrics/results';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import ScreenGlow from '@/components/ui/ScreenGlow';
import CanvasIcon from '@/components/ui/CanvasIcon';
import RadarChart from '@/components/discover/RadarChart';

/**
 * Self-reflection results (canvas "Self-reflection — results"): radar,
 * one card per trait (highest first) with its band, the not-a-diagnosis
 * disclaimer, then "Find a professional" as the primary action. Results
 * stay on the phone; "Save to my profile" is an explicit, Alias-only opt-in.
 */
export default function ResultScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const r = t.discover.results;
  const { resultId } = useLocalSearchParams<{ resultId: string }>();

  const [result, setResult] = useState<StoredResult | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    getResult(resultId ?? '')
      .then(setResult)
      .catch(() => setResult(null));
  }, [resultId]);

  const test = result ? getTest(result.testId) : undefined;
  const close = () => (router.canGoBack() ? router.back() : router.replace('/tanafas'));
  const dusk = colors.tones.dusk.fg;
  const labelLatin = fonts.labelTracked;

  const header = (
    <View style={styles.header}>
      <IconButton
        variant="subtle"
        accessibilityLabel={r.close}
        onPress={close}
        renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />}
      />
    </View>
  );

  if (result === undefined) return <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} />;

  if (!result || !test) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.inner}>
          {header}
          <Text style={[styles.traitDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{r.notFound}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const traits = test.traits
    .filter((tr) => result.scores[tr.key])
    .map((tr) => ({ ...tr, score: result.scores[tr.key] }))
    .sort((a, b) => b.score.normalised0to1 - a.score.normalised0to1);

  const save = async () => {
    setSaving(true);
    setSaveFailed(false);
    const ok = await saveResultToProfile(result);
    setSaving(false);
    if (ok) setResult({ ...result, savedToProfile: true });
    else setSaveFailed(true);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScreenGlow color={alpha(nightPalette.dusk, 0.2)} rx={90} ry={30} cy={22} />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        {header}

        <View style={styles.titleBlock}>
          <Text
            style={[
              labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
              { color: dusk, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
            ]}
          >
            {r.eyebrow.replace('{test}', test.title[language])}
          </Text>
          <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {r.title}
          </Text>
        </View>

        {traits.length >= 3 && (
          <View style={styles.radar}>
            <RadarChart
              color={dusk}
              axes={test.traits
                .filter((tr) => result.scores[tr.key])
                .map((tr) => ({ label: tr.label[language], value: result.scores[tr.key].normalised0to1 }))}
            />
          </View>
        )}

        <View style={styles.traits}>
          {traits.map((tr) => (
            <View key={tr.key} style={[styles.trait, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.traitHead}>
                <Text style={[styles.traitName, { color: colors.text, fontFamily: fonts.semiBold }]}>{tr.label[language]}</Text>
                <Text
                  style={[
                    labelLatin ? styles.bandLatin : styles.bandArabic,
                    { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
                  ]}
                >
                  {tr.score.band[language]}
                </Text>
              </View>
              <View style={[styles.bar, { backgroundColor: colors.border }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <View style={[styles.barFill, { width: `${Math.round(tr.score.normalised0to1 * 100)}%`, backgroundColor: dusk }]} />
              </View>
              <Text style={[styles.traitDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{tr.description[language]}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.disclaimer, { backgroundColor: colors.crisis.bg, borderColor: colors.crisis.borderSoft }]}>
          <CanvasIcon name="shield" size={20} strokeWidth={1.7} color={colors.tones.dawn.fg} />
          <Text style={[styles.disclaimerText, { color: colors.text, fontFamily: fonts.regular }]}>{t.discover.test.disclaimer}</Text>
        </View>

        <View style={styles.actions}>
          <Button label={r.findProfessional} onPress={() => router.navigate('/directory/professionals')} block style={styles.primary} />
          {profile ? (
            <Button
              label={result.savedToProfile ? r.savedToProfile : r.saveToProfile}
              variant="secondary"
              onPress={save}
              disabled={result.savedToProfile}
              loading={saving}
              block
            />
          ) : null}
          <Text style={[styles.caption, { color: saveFailed ? colors.accent : colors.textTertiary, fontFamily: fonts.regular }]}>
            {saveFailed ? r.saveFailed : profile ? r.staysOnPhone : `${r.staysOnPhone} ${r.signInToSave}`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleBlock: {
    alignItems: 'center',
    gap: 8,
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  eyebrowArabic: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 32 * 1.12,
    textAlign: 'center',
  },
  titleArabic: {
    lineHeight: 48,
  },
  radar: {
    alignItems: 'center',
  },
  traits: {
    gap: 12,
  },
  trait: {
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  traitHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  traitName: {
    flexShrink: 1,
    fontSize: 15.5,
  },
  bandLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.1,
    textTransform: 'uppercase',
  },
  bandArabic: {
    fontSize: 12.5,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  traitDesc: {
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
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
  actions: {
    gap: 12,
  },
  primary: {
    height: 56,
  },
  caption: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
  },
});
