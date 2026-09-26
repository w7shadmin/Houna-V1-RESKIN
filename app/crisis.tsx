import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { layout, radius } from '@/constants/theme';
import { crisisLinesFor } from '@/lib/crisisLines';
import { arabicNumber } from '@/lib/arabicNumerals';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';

/**
 * "Need to talk now?" — the destination of Home's crisis button. Emergency
 * guidance is always shown first; per-country crisis lines appear only once
 * verified numbers exist in lib/crisisLines.ts (never invented).
 */
export default function CrisisScreen() {
  const { colors } = useTheme();
  const { t, fonts, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const router = useRouter();
  const s = t.crisis;
  const lines = crisisLinesFor(profile?.country ?? null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

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

        <View style={[styles.emergency, { backgroundColor: colors.crisis.bg, borderColor: colors.crisis.border }]}>
          <View style={styles.emergencyHead}>
            <CanvasIcon name="phone" size={18} strokeWidth={1.8} color={colors.crisis.icon} />
            <Text style={[styles.emergencyTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
              {s.emergencyHeading}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.text, fontFamily: fonts.regular }]}>{s.emergencyBody}</Text>
        </View>

        {lines.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{s.linesHeading}</Text>
            {lines.map((line) => (
              <Card key={`${line.country}-${line.phone}`} style={styles.lineRow}>
                <View style={styles.lineText}>
                  <Text style={[styles.lineName, { color: colors.text, fontFamily: fonts.semiBold }]}>
                    {line.name[language]}
                  </Text>
                  <Text style={[styles.linePhone, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                    {isRTL ? arabicNumber(line.phone) : line.phone}
                  </Text>
                </View>
                <Button label={s.call} onPress={() => Linking.openURL(`tel:${line.phone.replace(/\s/g, '')}`)} />
              </Card>
            ))}
          </View>
        )}

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
    fontSize: 14,
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
