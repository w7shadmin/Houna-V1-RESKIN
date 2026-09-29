import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { layout, radius } from '@/constants/theme';
import { CRISIS_COUNTRIES, crisisLinesFor, dialString, resolveCrisisCountry, type CrisisKind, type CrisisLine } from '@/lib/crisisLines';
import { getCountryName } from '@/lib/countries';
import { arabicNumber } from '@/lib/arabicNumerals';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';

/** The country chosen on this screen, kept on the phone (a Guest has no profile country). */
const COUNTRY_KEY = 'houna-crisis-country';

/** The groups after the emergency numbers, in order. Crisis and support lines share the first. */
const GROUPS: { key: 'lines' | Exclude<CrisisKind, 'emergency' | 'crisis' | 'support'>; kinds: CrisisKind[] }[] = [
  { key: 'lines', kinds: ['crisis', 'support'] },
  { key: 'child', kinds: ['child'] },
  { key: 'violence', kinds: ['violence'] },
  { key: 'addiction', kinds: ['addiction'] },
  { key: 'refugee', kinds: ['refugee'] },
];

/**
 * A number kept left-to-right inside Arabic text (LRI … PDI), in Arabic-Indic digits there. The
 * isolate alone isn't enough: a space between two groups of Arabic-Indic digits resolves
 * right-to-left and swaps the groups ("٧٩ ٣٠٠ ٤١٠" showing as "٤١٠ ٣٠٠ ٧٩"), so every space and
 * hyphen is held between left-to-right marks. A right-to-left mark leads, so the line itself stays
 * right-to-left (aligned with the Arabic around it) rather than taking its direction from those marks.
 */
function shownNumber(text: string, isRTL: boolean) {
  if (!isRTL) return text;
  return `‏⁦${arabicNumber(text).replace(/[\s-]/g, (c) => `‎${c}‎`)}⁩`;
}

/** Numbers inside a sentence (not those inside a web address), shown as `shownNumber` does. */
function withNumbers(text: string, isRTL: boolean) {
  if (!isRTL) return text;
  return text.replace(/(^|[^\w.])(\+?\d[\d\s-]*\d|\d)(?=$|[^\w.])/g, (_, before: string, num: string) => before + shownNumber(num, true));
}

/**
 * "Need to talk now?" — the destination of Home's crisis button and the crisis cards elsewhere.
 * Emergency guidance is always first, with the country's emergency numbers in it; then the
 * country's crisis and support lines, and the lines for children, violence, addiction and
 * refugees (lib/crisisLines.ts: verified lines only, plus emergency numbers rated likely). The
 * country is the one chosen here, else the Alias's, else the phone's region; otherwise it asks.
 */
export default function CrisisScreen() {
  const { colors } = useTheme();
  const { t, fonts, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const router = useRouter();
  const s = t.crisis;

  const [chosen, setChosen] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(COUNTRY_KEY)
      .then((v) => v && setChosen(v))
      .catch(() => {});
  }, []);

  const region = Localization.getLocales()[0]?.regionCode ?? null;
  const country = resolveCrisisCountry(chosen, profile?.country, region);
  const countryName = country ? getCountryName(country, language) ?? country : '';
  const lines = crisisLinesFor(country);
  const emergency = lines.filter((l) => l.kind === 'emergency');

  const choose = (code: string) => {
    setChosen(code);
    setPicking(false);
    AsyncStorage.setItem(COUNTRY_KEY, code).catch(() => {});
  };

  const countries = useMemo(
    () => CRISIS_COUNTRIES.map((code) => ({ code, name: getCountryName(code, language) ?? code })),
    [language],
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const call = (line: CrisisLine) => Linking.openURL(`tel:${dialString(line.phone)}`).catch(() => {});
  const fill = (text: string) => text.replace('{country}', countryName);

  /** Hours and where it applies, on one quiet line. */
  const meta = (l: CrisisLine) =>
    [l.hours?.[language], l.area ? withNumbers(l.area[language], isRTL) : null].filter(Boolean).join(' · ');

  const lineRow = (l: CrisisLine, onEmergency = false) => (
    <View key={`${l.kind}-${l.phone}`} style={styles.lineRow}>
      <View style={styles.lineText}>
        <Text style={[styles.lineName, { color: colors.text, fontFamily: fonts.semiBold }]}>{l.name[language]}</Text>
        <Text style={[styles.linePhone, { color: colors.text, fontFamily: fonts.medium }]}>{shownNumber(l.phone, isRTL)}</Text>
        {!!meta(l) && (
          <Text style={[styles.lineMeta, { color: onEmergency ? colors.text : colors.textSecondary, fontFamily: fonts.regular }]}>{meta(l)}</Text>
        )}
        {!!l.extra && (
          <Text style={[styles.lineMeta, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{withNumbers(l.extra[language], isRTL)}</Text>
        )}
      </View>
      <Button label={s.call} onPress={() => call(l)} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <IconButton
          variant="subtle"
          accessibilityLabel={t.common.back}
          onPress={goBack}
          renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
        />

        <View style={styles.header}>
          <Text
            accessibilityRole="header"
            style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}
          >
            {s.title}
          </Text>
          <Text style={[styles.intro, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.intro}</Text>
        </View>

        {/* Which country's numbers: named, with a way to change it; asked outright when unknown. */}
        {country && !picking ? (
          <View style={styles.countryRow}>
            <Text style={[styles.countryText, { color: colors.text, fontFamily: fonts.semiBold }]}>{fill(s.numbersFor)}</Text>
            <Chip label={s.change} size="sm" onPress={() => setPicking(true)} />
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.body, { color: colors.text, fontFamily: fonts.medium }]}>{s.chooseCountry}</Text>
            <View style={styles.chips}>
              {countries.map((c) => (
                <Chip key={c.code} label={c.name} size="sm" selected={c.code === country} onPress={() => choose(c.code)} />
              ))}
            </View>
          </View>
        )}

        <View style={[styles.emergency, { backgroundColor: colors.crisis.bg, borderColor: colors.crisis.border }]}>
          <View style={styles.emergencyHead}>
            <CanvasIcon name="phone" size={18} strokeWidth={1.8} color={colors.crisis.icon} />
            <Text style={[styles.emergencyTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
              {s.emergencyHeading}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontFamily: fonts.regular }]}>{s.emergencyBody}</Text>
          {emergency.length > 0 && (
            <View style={[styles.emergencyLines, { borderTopColor: colors.crisis.borderSoft }]}>
              {emergency.map((l) => lineRow(l, true))}
            </View>
          )}
        </View>

        {country &&
          GROUPS.map((g) => {
            const group = lines.filter((l) => g.kinds.includes(l.kind));
            // The first group always shows: without a mental-health line, it says so.
            if (!group.length && g.key !== 'lines') return null;
            return (
              <View key={g.key} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                  {g.key === 'lines' ? s.linesHeading : s.groups[g.key]}
                </Text>
                {group.length ? (
                  group.map((l) => <Card key={`${l.kind}-${l.phone}`}>{lineRow(l)}</Card>)
                ) : (
                  <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{fill(s.noCrisisLine)}</Text>
                )}
              </View>
            );
          })}

        {country && <Text style={[styles.note, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.checked}</Text>}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{s.talkHeading}</Text>
          <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.talkBody}</Text>
          <Card onPress={() => router.push('/directory/professionals')} style={styles.linkRow}>
            <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.medium }]}>{s.findProfessional}</Text>
            <DirectionalIcon isRTL={isRTL} name="chevron" size={18} color={colors.textTertiary} />
          </Card>
          <Card onPress={() => router.push('/directory/resources/suicide-and-self-harm')} style={styles.linkRow}>
            <Text style={[styles.linkText, { color: colors.text, fontFamily: fonts.medium }]}>{s.readSupport}</Text>
            <DirectionalIcon isRTL={isRTL} name="chevron" size={18} color={colors.textTertiary} />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 34,
    lineHeight: 37,
  },
  titleArabic: {
    lineHeight: 48,
  },
  intro: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  countryText: {
    flex: 1,
    fontSize: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emergency: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 16,
    gap: 8,
  },
  emergencyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyTitle: {
    fontSize: 16,
  },
  emergencyLines: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    paddingTop: 16,
    gap: 16,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lineText: {
    flex: 1,
    gap: 4,
  },
  lineName: {
    fontSize: 15.5,
  },
  linePhone: {
    fontSize: 17,
  },
  lineMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  note: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 15,
  },
});
