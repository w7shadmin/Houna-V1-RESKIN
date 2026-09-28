import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { AccountScreen } from '@/components/account/AccountKit';
import Button from '@/components/ui/Button';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { formatDayMonth } from '@/lib/journal';
import { deleteResult, listResults, type StoredResult } from '@/lib/psychometrics/results';
import { getTest, testText } from '@/constants/psychometrics';

/**
 * My results (the held plan's, canvas "Phase 6 — My results"): every questionnaire taken, newest
 * first, with its date and a quiet band (a screener's own; a reflection's number of traits). One
 * tap from Profile, never on the Profile page itself (shared phones). Tap to reopen; press and
 * hold to delete, with a confirm. On the phone for everyone, so Guests have it too.
 */
export default function ResultsScreen() {
  const { colors } = useTheme();
  const { t, fonts, isRTL, language } = useLanguage();
  const r = t.results;
  const router = useRouter();
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const [results, setResults] = useState<StoredResult[] | null>(null);

  const load = useCallback(() => {
    listResults()
      .then((all) => setResults(all.filter((x) => getTest(x.testId))))
      .catch(() => setResults([]));
  }, []);
  useFocusEffect(load);

  const remove = (res: StoredResult) => {
    const go = () => deleteResult(res.id).then(load).catch(() => {});
    if (Platform.OS === 'web') {
      // react-native-web's Alert has no buttons.
      if (window.confirm(`${r.deleteTitle}\n${r.deleteBody}`)) go();
      return;
    }
    Alert.alert(r.deleteTitle, r.deleteBody, [
      { text: r.cancel, style: 'cancel' },
      { text: r.delete, style: 'destructive', onPress: go },
    ]);
  };

  const band = (res: StoredResult) => {
    const test = getTest(res.testId)!;
    const scores = Object.values(res.scores);
    if (test.traits.length === 1 && scores[0]) return testText(scores[0].band, language);
    return arabicPlural(scores.length, r.traits).replace('{n}', num(scores.length));
  };

  return (
    <AccountScreen eyebrow={r.eyebrow} title={r.title} subtitle={r.body}>
      {results && results.length === 0 && (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{r.emptyTitle}</Text>
          <Text style={[styles.emptyBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{r.emptyBody}</Text>
          <Button label={r.emptyAction} style={styles.emptyAction} onPress={() => router.push({ pathname: '/tanafas', params: { tab: 'discover' } })} />
        </View>
      )}
      {results && results.length > 0 && (
        <>
          <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {results.map((res, i) => {
              const test = getTest(res.testId)!;
              const date = formatDayMonth(new Date(res.takenAt), t.journal.dateNames, num);
              return (
                <Pressable
                  key={res.id}
                  accessibilityRole="button"
                  accessibilityHint={r.deleteHint}
                  onPress={() => router.push({ pathname: '/tanafas/discover/result/[resultId]', params: { resultId: res.id } })}
                  onLongPress={() => remove(res)}
                  accessibilityActions={[{ name: 'longpress', label: r.delete }]}
                  onAccessibilityAction={(e) => e.nativeEvent.actionName === 'longpress' && remove(res)}
                  style={({ pressed }) => [styles.row, i < results.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderLight }, pressed && { opacity: 0.85 }]}
                >
                  <View style={[styles.tile, { backgroundColor: colors.tones.dusk.bg, borderColor: colors.tones.dusk.border }]}>
                    <View style={[styles.tileDot, { borderColor: colors.tones.dusk.fg }]} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{testText(test.title, language)}</Text>
                    <Text style={[styles.rowNote, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                      {res.savedToProfile ? `${date} · ${r.saved}` : date}
                    </Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.band, { color: colors.textSecondary, borderColor: colors.border, fontFamily: fonts.regular }]}>
                    {band(res)}
                  </Text>
                  <DirectionalIcon isRTL={isRTL} name="chevron" size={18} color={colors.textTertiary} />
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{r.holdToDelete}</Text>
        </>
      )}
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: grid(1.5),
    paddingVertical: grid(3),
    paddingHorizontal: grid(2),
    borderRadius: 22,
    borderWidth: 1,
  },
  emptyAction: {
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 15.5,
  },
  emptyBody: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
  },
  list: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
    paddingVertical: grid(1.5),
    paddingHorizontal: grid(2),
    minHeight: grid(8),
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.6,
  },
  rowText: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
  },
  rowNote: {
    fontSize: 12.5,
  },
  band: {
    maxWidth: 110,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    fontSize: 12,
    overflow: 'hidden',
  },
  hint: {
    fontSize: 12.5,
    textAlign: 'center',
  },
});
