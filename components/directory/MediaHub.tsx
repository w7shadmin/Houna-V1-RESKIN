import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Headphones, Newspaper } from 'lucide-react-native';
import PageMarkGlow from '@/components/ui/PageMarkGlow';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import PageHeader from '@/components/directory/PageHeader';
import ListSearch from '@/components/directory/ListSearch';
import { SectionHeader } from '@/components/directory/SearchResults';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout } from '@/constants/theme';
import { resolveImageUrl } from '@/lib/hounaApi';
import { buildSearchIndex, listSearchItems, mediaLibrary, type MediaItem } from '@/lib/directorySearch';
import { MEDIA_TOPICS, mediaTopics, type MediaTopic } from '@/lib/mediaTopics';
import { openInApp } from '@/lib/inAppBrowser';

type Tab = 'all' | 'articles' | 'podcasts';

/**
 * Read & listen: houna.org's articles and podcasts in one place, as international media hubs do it
 * (one library, tabs by format, a featured piece, a rail to listen, topics to browse, search inside).
 * Both languages, the reader's first, with a small tag on what's only in the other. Topics come from
 * the words in each piece (lib/mediaTopics.ts; the site has no categories), shown once a topic holds
 * two or more. A piece opens inside Houna (lib/inAppBrowser.ts): the podcasts' own pages (Simplecast,
 * Omny) play there, so nobody's sent away to listen.
 */
export default function MediaHub({ initialTab = 'all' }: { initialTab?: Tab }) {
  const { colors } = useTheme();
  const { t, language, fonts } = useLanguage();
  const m = t.directory.media;

  const [library, setLibrary] = useState<{ articles: MediaItem[]; podcasts: MediaItem[] } | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [topic, setTopic] = useState<MediaTopic | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    setError(false);
    mediaLibrary(language)
      .then(setLibrary)
      .catch(() => setError(true));
  }, [language]);
  useEffect(load, [load]);

  const pool = useMemo(() => {
    if (!library) return [];
    return tab === 'articles' ? library.articles : tab === 'podcasts' ? library.podcasts : [...library.articles, ...library.podcasts];
  }, [library, tab]);
  const topicsOf = useMemo(() => new Map(pool.map((x) => [x.url, mediaTopics(x.title, x.text)])), [pool]);
  const topicsShown = MEDIA_TOPICS.filter((tp) => pool.filter((x) => topicsOf.get(x.url)?.includes(tp)).length >= 2);
  const index = useMemo(() => buildSearchIndex(listSearchItems(pool, (x) => ({ key: x.url, title: x.title, subtitle: x.text, extra: [x.source] }))), [pool]);

  const browsing = !query.trim() && !topic;
  const list = useMemo(() => {
    let items = pool;
    if (query.trim()) {
      const byUrl = new Map(pool.map((x) => [x.url, x]));
      items = index.query(query).items.map((it) => byUrl.get(it.key)).filter((x): x is MediaItem => !!x);
    }
    if (topic) items = items.filter((x) => topicsOf.get(x.url)?.includes(topic));
    return items;
  }, [pool, index, query, topic, topicsOf]);

  // Browsing All: the first article large, the podcasts as a rail, the other articles beneath.
  const featured = browsing && tab !== 'podcasts' ? list.find((x) => x.kind === 'article' && x.imageUrl) : undefined;
  const rail = browsing && tab === 'all' ? list.filter((x) => x.kind === 'podcast') : [];
  const rows = browsing && tab === 'all' ? list.filter((x) => x.kind === 'article' && x !== featured) : list.filter((x) => x !== featured);

  const open = (x: MediaItem) => openInApp(x.url, colors.background);
  const kindLabel = (x: MediaItem) => (x.kind === 'podcast' ? m.podcast : m.article);
  const a11y = (x: MediaItem) => `${kindLabel(x)}: ${x.title}, ${x.source}${x.otherLanguage ? `, ${m.otherLanguage}` : ''}`;

  const Meta = ({ x }: { x: MediaItem }) => (
    <View style={styles.meta}>
      {x.kind === 'podcast' ? <Headphones size={13} color={colors.textTertiary} /> : <Newspaper size={13} color={colors.textTertiary} />}
      <Text numberOfLines={1} style={[styles.metaText, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
        {x.source}
      </Text>
      {x.otherLanguage && (
        <View style={[styles.langTag, { borderColor: colors.borderControl }]}>
          <Text style={[styles.langText, { color: colors.textSecondary, fontFamily: fonts.medium }]}>{m.otherLanguage}</Text>
        </View>
      )}
    </View>
  );

  const header = (
    <View style={styles.header}>
      <PageHeader title={m.title} intro={m.intro} />
      {library && (
        <>
          <ListSearch value={query} onChange={setQuery} placeholder={m.searchPlaceholder} />
          <View style={styles.tabs} accessibilityRole="tablist">
            {(['all', 'articles', 'podcasts'] as const).map((k) => (
              <Chip
                key={k}
                size="sm"
                selected={tab === k}
                label={m.tabs[k]}
                onPress={() => {
                  setTab(k);
                  setTopic(null);
                }}
              />
            ))}
          </View>
          {topicsShown.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topics}>
              {topicsShown.map((tp) => (
                <Chip key={tp} plain size="sm" selected={topic === tp} label={m.topics[tp]} onPress={() => setTopic(topic === tp ? null : tp)} />
              ))}
            </ScrollView>
          )}
          {featured && (
            <Card onPress={() => open(featured)} accessibilityLabel={a11y(featured)} variant="feature" style={styles.featured}>
              <Image source={{ uri: resolveImageUrl(featured.imageUrl) ?? undefined }} style={[styles.featuredImg, { backgroundColor: colors.control }]} resizeMode="cover" />
              <Text style={[styles.eyebrow, { color: colors.primary, fontFamily: fonts.label }, fonts.labelTracked && styles.tracked]}>{m.featured}</Text>
              <Text numberOfLines={3} style={[styles.featuredTitle, { color: colors.text, fontFamily: fonts.display }]}>
                {featured.title}
              </Text>
              {!!featured.text && (
                <Text numberOfLines={2} style={[styles.featuredText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                  {featured.text}
                </Text>
              )}
              <Meta x={featured} />
            </Card>
          )}
          {rail.length > 0 && (
            <View style={styles.railWrap}>
              <SectionHeader label={m.listen} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
                {rail.map((x) => (
                  <Card key={x.url} onPress={() => open(x)} accessibilityLabel={a11y(x)} style={styles.railCard}>
                    <View style={[styles.railImg, { backgroundColor: colors.control }]}>
                      {x.imageUrl ? (
                        <Image source={{ uri: resolveImageUrl(x.imageUrl) ?? undefined }} style={styles.fill} resizeMode="cover" />
                      ) : (
                        <Headphones size={32} color={colors.textTertiary} />
                      )}
                    </View>
                    <Text numberOfLines={2} style={[styles.railTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                      {x.title}
                    </Text>
                    <Meta x={x} />
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}
          {rows.length > 0 && <SectionHeader label={browsing && tab === 'all' ? m.read : `${m.tabs[tab]} · ${rows.length}`} />}
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <PageMarkGlow />
      {!library && !error ? (
        <View style={styles.state}>
          {header}
          <LoadingState label={m.loading} />
        </View>
      ) : !library ? (
        <View style={styles.state}>
          {header}
          <ErrorState message={m.error} retryLabel={t.directory.common.tryAgain} onRetry={load} />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(x) => x.url}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={header}
          renderItem={({ item: x }) => (
            <Card onPress={() => open(x)} accessibilityLabel={a11y(x)} style={styles.row}>
              <View style={[styles.rowImg, { backgroundColor: colors.control }]}>
                {x.imageUrl ? (
                  <Image source={{ uri: resolveImageUrl(x.imageUrl) ?? undefined }} style={styles.fill} resizeMode="cover" />
                ) : x.kind === 'podcast' ? (
                  <Headphones size={24} color={colors.textTertiary} />
                ) : (
                  <Newspaper size={24} color={colors.textTertiary} />
                )}
              </View>
              <View style={styles.rowText}>
                <Text numberOfLines={3} style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                  {x.title}
                </Text>
                <Meta x={x} />
              </View>
            </Card>
          )}
          ListEmptyComponent={
            !featured && rail.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{m.empty}</Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  state: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
  },
  list: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(5),
    gap: grid(1.5),
  },
  header: {
    gap: grid(2),
    marginBottom: grid(0.5),
  },
  tabs: {
    flexDirection: 'row',
    gap: grid(1),
  },
  topics: {
    gap: grid(1),
    paddingEnd: grid(2),
  },
  featured: {
    gap: grid(1),
  },
  featuredImg: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    marginBottom: grid(0.5),
  },
  eyebrow: {
    fontSize: 11,
  },
  tracked: {
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    fontSize: 22,
    lineHeight: 30,
  },
  featuredText: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(0.5),
    marginTop: grid(0.5),
  },
  metaText: {
    fontSize: 12,
    flexShrink: 1,
  },
  langTag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: grid(1),
    paddingVertical: 2, // grid-ok: a hairline tag
  },
  langText: {
    fontSize: 11,
  },
  railWrap: {
    gap: grid(1),
  },
  rail: {
    gap: grid(1.5),
    paddingEnd: grid(2),
  },
  railCard: {
    width: 168,
    gap: grid(1),
  },
  railImg: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  railTitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: grid(2),
    alignItems: 'flex-start',
  },
  rowImg: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: grid(0.5),
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  empty: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: grid(6),
  },
});
