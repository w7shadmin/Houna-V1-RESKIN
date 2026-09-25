import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Building2, Headphones, HeartPulse, Newspaper, Users, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { layout } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { safeUrl } from '@/lib/hounaApi';
import { searchItems, type SearchItem } from '@/lib/directorySearch';
import { useDirectorySearch } from '@/hooks/useDirectorySearch';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import IconTile, { type IconTileTone } from '@/components/ui/IconTile';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';
import {
  CrisisRow,
  PlaceCountCard,
  ResultRow,
  SectionHeader,
  TopicResultCard,
} from '@/components/directory/SearchResults';

/**
 * The search bar's own accent border shows focus, so the browser's focus
 * ring would be a second, competing highlight. `outlineStyle: 'none'` is
 * valid on react-native-web but missing from RN's style types.
 */
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

type Filter = 'all' | 'topics' | 'articles' | 'professionals' | 'podcasts';
const FILTERS: Filter[] = ['all', 'topics', 'articles', 'professionals', 'podcasts'];

/** How many of each group "All" shows before "See all" (canvas). */
const PREVIEW = { topics: 1, articles: 2, professionals: 2, podcasts: 1, places: 0 } as const;
type Group = keyof typeof PREVIEW;

interface HubRow {
  href:
    | '/directory/professionals'
    | '/directory/organizations'
    | '/directory/wellness-centers'
    | '/directory/articles'
    | '/directory/podcasts'
    | '/directory/resources';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: IconTileTone;
}

/**
 * Directory hub = unified search (canvas "Directory search"). With no query
 * it shows the category rows (the hub the subpages' back buttons
 * `router.replace` to — CLAUDE.md's hub-first navigation); typing shows
 * results grouped Topic → Articles → Professionals → Podcasts →
 * Organizations & wellness centers, always closed by a crisis line.
 */
export default function DirectoryHubScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const hub = t.directory.hub;
  const s = t.directory.search;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [armed, setArmed] = useState(false);
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState<Partial<Record<Group | 'organizations' | 'wellness', boolean>>>({});

  const index = useDirectorySearch(language, profile?.country ?? null, t.home.resourcesRail.topics, armed);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(id);
  }, [query]);

  // A new query starts collapsed.
  useEffect(() => setExpanded({}), [debounced]);

  const groups = useMemo(() => {
    const hits = searchItems(index.items, debounced);
    const of = (type: SearchItem['type']) => hits.filter((h) => h.type === type);
    let professionals = of('professional');
    if (index.near) {
      const near = index.near.slugs;
      professionals = [...professionals].sort((a, b) => Number(near.has(b.key)) - Number(near.has(a.key)));
    }
    return {
      topics: of('topic'),
      articles: of('article'),
      professionals,
      podcasts: of('podcast'),
      organizations: of('organization'),
      wellness: of('wellness'),
      total: hits.length,
    };
  }, [index.items, index.near, debounced]);

  const searching = debounced.trim().length > 0;
  const nearCount = index.near ? groups.professionals.filter((p) => index.near!.slugs.has(p.key)).length : 0;

  const open = (item: SearchItem) => {
    switch (item.type) {
      case 'topic':
        router.push({ pathname: '/directory/resources/[slug]', params: { slug: item.key } });
        break;
      case 'professional':
        router.push({ pathname: '/directory/professionals/[slug]', params: { slug: item.key } });
        break;
      case 'organization':
        router.push({ pathname: '/directory/organizations/[id]', params: { id: item.key } });
        break;
      case 'wellness':
        router.push({ pathname: '/directory/wellness-centers/[id]', params: { id: item.key } });
        break;
      default: {
        const url = safeUrl(item.key);
        if (url) Linking.openURL(url);
      }
    }
  };

  const shown = (group: Group, list: SearchItem[]) =>
    filter !== 'all' || expanded[group] ? list : list.slice(0, PREVIEW[group]);

  const toggle = (key: Group | 'organizations' | 'wellness') => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const sectionAction = (group: Group, list: SearchItem[]) =>
    filter === 'all' && list.length > PREVIEW[group] ? (expanded[group] ? s.showLess : s.seeAll) : undefined;

  const metaFor = (item: SearchItem) =>
    (item.type === 'podcast' ? s.podcastMeta : s.articleMeta).replace('{source}', item.source ?? '');

  const hubRows: HubRow[] = [
    { href: '/directory/professionals', title: hub.professionalsTitle, subtitle: hub.professionalsSubtitle, icon: Users, tone: 'glow' },
    { href: '/directory/organizations', title: hub.organizationsTitle, subtitle: hub.organizationsSubtitle, icon: Building2, tone: 'dawn' },
    { href: '/directory/wellness-centers', title: hub.wellnessTitle, subtitle: hub.wellnessSubtitle, icon: HeartPulse, tone: 'dusk' },
    { href: '/directory/articles', title: hub.articlesTitle, subtitle: hub.articlesSubtitle, icon: Newspaper, tone: 'glow' },
    { href: '/directory/podcasts', title: hub.podcastsTitle, subtitle: hub.podcastsSubtitle, icon: Headphones, tone: 'dusk' },
    { href: '/directory/resources', title: hub.resourcesTitle, subtitle: hub.resourcesSubtitle, icon: BookOpen, tone: 'dawn' },
  ];

  const browse = (
    <View style={styles.section}>
      <SectionHeader label={s.browse} />
      {hubRows.map((row) => (
        <Card key={row.href} onPress={() => router.push(row.href)} accessibilityLabel={row.title} style={styles.hubRow}>
          <IconTile size={46} tone={row.tone} renderIcon={(c, size) => <row.icon size={size} color={c} strokeWidth={1.6} />} />
          <View style={styles.hubText}>
            <Text style={[styles.hubTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{row.title}</Text>
            <Text style={[styles.hubSubtitle, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{row.subtitle}</Text>
          </View>
          <DirectionalIcon isRTL={isRTL} name="chevron" size={18} color={colors.textTertiary} />
        </Card>
      ))}
    </View>
  );

  const show = (f: Filter) => filter === 'all' || filter === f;
  const q = debounced.trim();
  const labelLatin = fonts.labelTracked;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            style={[
              labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
              { color: colors.primary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
            ]}
          >
            {s.eyebrow}
          </Text>
          <Text
            accessibilityRole="header"
            style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}
          >
            {s.title}
          </Text>
        </View>

        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.controlStrong,
              borderColor: focused || query ? colors.primary : colors.borderControl,
            },
          ]}
        >
          <CanvasIcon name="search" size={20} strokeWidth={1.7} color={colors.textTertiary} />
          <TextInput
            value={query}
            onChangeText={(v) => {
              setArmed(true);
              setQuery(v);
            }}
            onFocus={() => {
              setArmed(true);
              setFocused(true);
            }}
            onBlur={() => setFocused(false)}
            placeholder={s.placeholder}
            placeholderTextColor={colors.textTertiary}
            accessibilityLabel={s.inputLabel}
            returnKeyType="search"
            autoCorrect={false}
            textAlign={isRTL ? 'right' : 'left'}
            style={[styles.input, WEB_NO_OUTLINE, { color: colors.text, fontFamily: fonts.regular }]}
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel={s.clear}
              style={[styles.clear, { backgroundColor: colors.controlStrong }]}
            >
              <CanvasIcon name="close" size={14} strokeWidth={2} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {!searching ? (
          browse
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              accessibilityRole="tablist"
              accessibilityLabel={s.filtersLabel}
              contentContainerStyle={styles.filters}
            >
              {FILTERS.map((f) => (
                <Chip key={f} size="sm" label={s.filters[f]} selected={filter === f} onPress={() => setFilter(f)} />
              ))}
            </ScrollView>

            {show('topics') && groups.topics.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  label={s.sections.topic}
                  action={sectionAction('topics', groups.topics)}
                  onAction={() => toggle('topics')}
                />
                {shown('topics', groups.topics).map((item) => (
                  <TopicResultCard key={item.key} item={item} learnMore={s.learnMore} onPress={() => open(item)} />
                ))}
              </View>
            )}

            {show('articles') && groups.articles.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  label={s.sections.articles}
                  action={sectionAction('articles', groups.articles)}
                  onAction={() => toggle('articles')}
                />
                {shown('articles', groups.articles).map((item) => (
                  <ResultRow key={item.key} item={item} meta={metaFor(item)} onPress={() => open(item)} />
                ))}
              </View>
            )}

            {show('professionals') && groups.professionals.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  label={
                    index.near && nearCount > 0
                      ? s.sections.professionalsNear.replace('{country}', index.near.countryName)
                      : s.sections.professionals
                  }
                  action={sectionAction('professionals', groups.professionals)}
                  onAction={() => toggle('professionals')}
                />
                {shown('professionals', groups.professionals).map((item) => (
                  <ResultRow key={item.key} item={item} onPress={() => open(item)} />
                ))}
              </View>
            )}

            {show('podcasts') && groups.podcasts.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  label={s.sections.podcasts}
                  action={sectionAction('podcasts', groups.podcasts)}
                  onAction={() => toggle('podcasts')}
                />
                {shown('podcasts', groups.podcasts).map((item) => (
                  <ResultRow key={item.key} item={item} meta={metaFor(item)} onPress={() => open(item)} />
                ))}
              </View>
            )}

            {filter === 'all' && groups.organizations.length + groups.wellness.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label={s.sections.places} />
                <View style={styles.places}>
                  {groups.organizations.length > 0 && (
                    <PlaceCountCard
                      kind="organization"
                      count={arabicPlural(groups.organizations.length, s.orgCount).replace('{n}', num(groups.organizations.length))}
                      sub={s.matching.replace('{q}', q)}
                      onPress={() => toggle('organizations')}
                    />
                  )}
                  {groups.wellness.length > 0 && (
                    <PlaceCountCard
                      kind="wellness"
                      count={arabicPlural(groups.wellness.length, s.wellnessCount).replace('{n}', num(groups.wellness.length))}
                      sub={s.matching.replace('{q}', q)}
                      onPress={() => toggle('wellness')}
                    />
                  )}
                </View>
                {expanded.organizations &&
                  groups.organizations.map((item) => <ResultRow key={item.key} item={item} onPress={() => open(item)} />)}
                {expanded.wellness &&
                  groups.wellness.map((item) => <ResultRow key={item.key} item={item} onPress={() => open(item)} />)}
              </View>
            )}

            {index.loading && (
              <Text style={[styles.status, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.loading}</Text>
            )}
            {!index.loading && index.failed.length > 0 && (
              <Text style={[styles.status, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.partialError}</Text>
            )}

            {!index.loading && groups.total === 0 && (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                  {s.noResults.replace('{q}', q)}
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.noResultsHint}</Text>
              </View>
            )}

            <CrisisRow label={s.crisis} onPress={() => router.push('/crisis')} />

            {!index.loading && groups.total === 0 && browse}
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
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    paddingBottom: 40,
    gap: 20,
  },
  header: {
    gap: 6,
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
    lineHeight: 35,
  },
  titleArabic: {
    lineHeight: 48,
  },
  searchBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingStart: 18,
    paddingEnd: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 16,
  },
  clear: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    gap: 8,
  },
  section: {
    gap: 10,
  },
  places: {
    flexDirection: 'row',
    gap: 10,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hubText: {
    flex: 1,
    gap: 3,
  },
  hubTitle: {
    fontSize: 15.5,
  },
  hubSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  status: {
    fontSize: 13.5,
    textAlign: 'center',
  },
  empty: {
    gap: 6,
  },
  emptyTitle: {
    fontSize: 16,
  },
  emptyHint: {
    fontSize: 14,
    lineHeight: 20,
  },
});
