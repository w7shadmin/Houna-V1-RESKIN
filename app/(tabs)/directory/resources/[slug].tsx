import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout, radius } from '@/constants/theme';
import { fetchResourceDetail, type ResourceDetailData } from '@/lib/hounaApi';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import { CrisisRow } from '@/components/directory/SearchResults';
import LottieTopicIcon from '@/components/directory/LottieTopicIcon';
import { ProfileTopBar } from '@/components/directory/ProfileKit';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';

const SCROLL_PADDING = grid(2);
const CARD_PADDING = 20;

/**
 * `react-native-render-html`'s style engine doesn't support RN's logical
 * `marginStart`/`marginEnd` (it only maps physical CSS-style properties) —
 * unlike plain RN StyleSheet, it won't auto-flip these for RTL, so this is
 * one of the few places `isRTL` has to pick the physical side by hand.
 */
function htmlTagsStyles(isRTL: boolean, heading: string, strong: string, text: string, link: string) {
  const listIndent = isRTL ? { marginRight: 16 } : { marginLeft: 16 };
  const h = { fontFamily: heading, fontWeight: 'normal' as const, color: text };
  return {
    p: { marginTop: 0, marginBottom: 12 },
    h1: { ...h, fontSize: 20, lineHeight: 28, marginTop: 8, marginBottom: 8 },
    h2: { ...h, fontSize: 18, lineHeight: 26, marginTop: 8, marginBottom: 8 },
    h3: { ...h, fontSize: 16, lineHeight: 24, marginTop: 4, marginBottom: 4 },
    ul: { ...listIndent, marginTop: 0, marginBottom: 12 },
    ol: { ...listIndent, marginTop: 0, marginBottom: 12 },
    li: { marginBottom: 4 },
    strong: { fontFamily: strong, fontWeight: 'normal' as const, color: text },
    b: { fontFamily: strong, fontWeight: 'normal' as const, color: text },
    a: { color: link, textDecorationLine: 'underline' as const },
  };
}

/** The site's editor opens every section with an empty `<p><br></p>` spacer; drop empty paragraphs. */
function cleanHtml(html: string): string {
  return html.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '').trim();
}

/**
 * A mental health topic (canvas language, not the website's): the topic's
 * animated icon on its themed stage, display title, the source sections as
 * chips, the active section as a card — then a way to a professional and
 * the crisis line, so reading about a condition never dead-ends.
 */
export default function ResourceDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, language, isRTL, fonts } = useLanguage();
  const { width } = useWindowDimensions();
  const s = t.directory.resources;
  const common = t.directory.common;

  const [detail, setDetail] = useState<ResourceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setActive(0);
    try {
      setDetail(await fetchResourceDetail(slug, language));
    } catch (err) {
      setError(err instanceof Error ? err.message : s.detailError);
    } finally {
      setLoading(false);
    }
  }, [slug, language, s.detailError]);

  useEffect(() => {
    load();
  }, [load]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/directory/resources'));
  const section = detail?.sections[active];
  const contentWidth = Math.min(width, layout.maxContentWidth) - SCROLL_PADDING * 2 - CARD_PADDING * 2;
  const tagsStyles = useMemo(
    () => htmlTagsStyles(isRTL, fonts.semiBold, fonts.semiBold, colors.text, colors.primary),
    [isRTL, fonts.semiBold, colors.text, colors.primary],
  );
  const systemFonts = useMemo(() => [fonts.regular, fonts.semiBold], [fonts.regular, fonts.semiBold]);
  const labelLatin = fonts.labelTracked;

  if (loading || error || !detail) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.stateWrap}>
          <ProfileTopBar onBack={back} />
          {loading ? (
            <LoadingState label={s.detailLoading} />
          ) : (
            <ErrorState message={error || s.detailError} retryLabel={common.tryAgain} onRetry={load} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileTopBar onBack={back} />

        <View style={[styles.stage, { backgroundColor: colors.topicStage, borderColor: colors.borderControl }]}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id="topicHeroGlow" gradientUnits="userSpaceOnUse" cx={50} cy={110} rx={60} ry={100} fx={50} fy={110}>
                <Stop offset="0" stopColor={colors.topicGlow} stopOpacity={0.45} />
                <Stop offset="0.7" stopColor={colors.topicGlow} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={100} height={100} fill="url(#topicHeroGlow)" />
          </Svg>
          <LottieTopicIcon slug={slug} size={grid(13)} />
        </View>

        <View style={styles.titleBlock}>
          <Text
            style={[
              labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
              { color: colors.primary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
            ]}
          >
            {s.topicEyebrow}
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}
          >
            {detail.title}
          </Text>
        </View>

        {detail.sections.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityRole="tablist"
            accessibilityLabel={s.sectionsLabel}
            contentContainerStyle={styles.chips}
          >
            {detail.sections.map((sec, i) => (
              <Chip key={sec.id} size="sm" label={sec.label} selected={active === i} onPress={() => setActive(i)} />
            ))}
          </ScrollView>
        )}

        {section ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {!!section.heading && (
              <Text style={[styles.sectionHeading, isRTL && styles.sectionHeadingArabic, { color: colors.text, fontFamily: fonts.display }]}>
                {section.heading}
              </Text>
            )}
            <RenderHTML
              contentWidth={contentWidth}
              source={{ html: cleanHtml(section.content) }}
              tagsStyles={tagsStyles}
              systemFonts={systemFonts}
              baseStyle={{
                color: colors.textSecondary,
                fontFamily: fonts.regular,
                fontSize: 15,
                lineHeight: 24,
                textAlign: isRTL ? 'right' : 'left',
              }}
            />
          </View>
        ) : (
          <Text style={[styles.empty, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.noContent}</Text>
        )}

        <Button
          variant="secondary"
          label={common.findProfessional}
          onPress={() => router.push('/directory/professionals')}
          block
        />
        <CrisisRow label={t.directory.search.crisis} onPress={() => router.push('/crisis')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  stateWrap: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: SCROLL_PADDING,
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: SCROLL_PADDING,
    paddingBottom: grid(5),
    gap: grid(2),
  },
  stage: {
    height: grid(20),
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: grid(1),
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13.5,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  titleArabic: {
    lineHeight: 48,
  },
  chips: {
    gap: grid(1),
  },
  sectionCard: {
    gap: grid(1.5),
    padding: CARD_PADDING,
    borderRadius: 22,
    borderWidth: 1,
  },
  sectionHeading: {
    fontSize: 22,
    lineHeight: 28,
  },
  sectionHeadingArabic: {
    lineHeight: 36,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: grid(4),
  },
});
