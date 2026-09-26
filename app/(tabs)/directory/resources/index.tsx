import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout, radius } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { fetchResourceDirectory, type ResourceDirectoryData, type ResourceTopic } from '@/lib/hounaApi';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import { CrisisRow } from '@/components/directory/SearchResults';
import LottieTopicIcon from '@/components/directory/LottieTopicIcon';
import PageHeader from '@/components/directory/PageHeader';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';

/**
 * Mental health topics (the Directory's "Mental Health Directory" row), in
 * the Nightlight/Daylight language rather than the website's layout: canvas
 * header, then a two-column grid of topic cards whose animated icons sit on
 * the same themed stage as topic search results (`topicStage`/`topicGlow`,
 * Night and Day). Closes with the crisis line, like the Directory hub. The
 * source page's banner photo, slogan and "Important Articles" are dropped.
 */
export default function ResourceDirectoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.directory.resources;
  const common = t.directory.common;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [data, setData] = useState<ResourceDirectoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchResourceDirectory(language));
    } catch (err) {
      setError(err instanceof Error ? err.message : s.error);
    } finally {
      setLoading(false);
    }
  }, [language, s.error]);

  useEffect(() => {
    load();
  }, [load]);

  const open = (topic: ResourceTopic) =>
    router.push({ pathname: '/directory/resources/[slug]', params: { slug: topic.slug } });
  const header = <PageHeader title={t.directory.hub.resourcesTitle} intro={s.intro} />;

  // Pairs, so each row's two cards share a height; `row` mirrors itself in RTL.
  const rows: ResourceTopic[][] = [];
  data?.topics.forEach((topic, i) => (i % 2 ? rows[rows.length - 1].push(topic) : rows.push([topic])));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {loading && !data ? (
        <View style={styles.stateWrap}>
          {header}
          <LoadingState label={s.loading} />
        </View>
      ) : error && !data ? (
        <View style={styles.stateWrap}>
          {header}
          <ErrorState message={error} retryLabel={common.tryAgain} onRetry={load} />
        </View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {header}

          <Text style={[styles.count, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
            {arabicPlural(data.topics.length, s.topicCount).replace('{n}', num(data.topics.length))}
          </Text>

          <View style={styles.grid}>
            {rows.map((pair) => (
              <View key={pair[0].slug} style={styles.row}>
                {pair.map((topic) => (
                  <TopicCard key={topic.slug} topic={topic} learnMore={s.learnMore} onPress={() => open(topic)} />
                ))}
                {pair.length === 1 && <View style={styles.cardSpacer} />}
              </View>
            ))}
          </View>

          <CrisisRow label={t.directory.search.crisis} onPress={() => router.push('/crisis')} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

/**
 * Some of the site's blurbs open with the title pasted in front of a
 * sentence that itself starts with the title ("AI Dependence AI dependence
 * refers to…"); drop that first copy. A real sentence that merely starts
 * with the title ("Abuse comes in…") is left alone.
 */
function blurbFor(topic: ResourceTopic): string {
  const desc = topic.description.trim();
  const title = topic.title.trim().toLowerCase();
  if (!desc.toLowerCase().startsWith(title)) return desc;
  const rest = desc.slice(title.length).replace(/^[\s:.,–—-]+/, '');
  return rest.toLowerCase().startsWith(title) ? rest : desc;
}

function TopicCard({ topic, learnMore, onPress }: { topic: ResourceTopic; learnMore: string; onPress: () => void }) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const blurb = blurbFor(topic);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={topic.title}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.borderControl },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.stage, { backgroundColor: colors.topicStage }]}>
        {/* Same soft glow rising from the bottom as the search's topic card. */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="topicGlow" gradientUnits="userSpaceOnUse" cx={50} cy={110} rx={60} ry={100} fx={50} fy={110}>
              <Stop offset="0" stopColor={colors.topicGlow} stopOpacity={0.45} />
              <Stop offset="0.7" stopColor={colors.topicGlow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#topicGlow)" />
        </Svg>
        <LottieTopicIcon slug={topic.slug} size={grid(8)} />
      </View>
      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[styles.cardTitle, isRTL && styles.cardTitleArabic, { color: colors.text, fontFamily: fonts.display }]}
        >
          {topic.title}
        </Text>
        {!!blurb && (
          <Text numberOfLines={2} style={[styles.cardDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
            {blurb}
          </Text>
        )}
        <View style={styles.learnMoreRow}>
          <Text style={[styles.learnMore, { color: colors.primary, fontFamily: fonts.medium }]}>{learnMore}</Text>
          <DirectionalIcon isRTL={isRTL} name="chevron" size={14} strokeWidth={2} color={colors.primary} />
        </View>
      </View>
    </Pressable>
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
    padding: grid(2),
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(5),
    gap: grid(2),
  },
  count: {
    fontSize: 13,
    lineHeight: 16,
  },
  grid: {
    gap: grid(2),
  },
  row: {
    flexDirection: 'row',
    gap: grid(2),
  },
  cardSpacer: {
    flex: 1,
  },
  card: {
    flex: 1,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stage: {
    height: grid(12),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  body: {
    flex: 1,
    padding: grid(2),
    gap: grid(1),
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  cardTitleArabic: {
    lineHeight: 32,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  learnMoreRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(0.5),
  },
  learnMore: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
});
