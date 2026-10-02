import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';
import { openInApp } from '@/lib/inAppBrowser';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import PageMarkGlow from '@/components/ui/PageMarkGlow';
import { BookOpen, Building2, HeartPulse, Newspaper, Users, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { layout } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { formatEventDate } from '@/lib/eventDate';
import { BREATHE_ORDER, BREATHE_TONE } from '@/constants/breathPatterns';
import { MEDITATION_SCENES } from '@/components/meditation/scenes';
import { EXERCISE_TEXT } from '@/components/tanafas/BreathePlayers';
import { buildSearchIndex, tanafasItems, type LocalExercise, type SearchItem } from '@/lib/directorySearch';
import { whyLine } from '@/lib/searchHighlight';
import { isCrisisQuery } from '@/lib/crisisIntent';
import { useDirectorySearch, type LocalContent } from '@/hooks/useDirectorySearch';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import IconTile, { type IconTileTone } from '@/components/ui/IconTile';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';
import {
  CrisisCard,
  CrisisRow,
  LitText,
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

type Filter = 'all' | 'topics' | 'tanafas' | 'articles' | 'professionals' | 'places' | 'podcasts' | 'events';
const FILTERS: Filter[] = ['all', 'topics', 'tanafas', 'articles', 'professionals', 'places', 'podcasts', 'events'];

/** The topics offered before typing and when nothing matched (slugs of `t.home.resourcesRail.topics`). */
const SUGGESTED_TOPICS = ['anxiety', 'depression', 'attention-deficit-hyperactivity-adhd', 'autism', 'eating-disorders', 'abuse'];

/** How many of each group "All" shows before "See all" (canvas; Tanafas and events added after). */
const PREVIEW = { topics: 1, tanafas: 2, articles: 2, professionals: 2, podcasts: 1, events: 2, places: 0 } as const;
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
 * Directory hub = unified search (canvas "Directory search", and "Directory
 * search — phase 3"). With no query it shows the category rows (the hub the
 * subpages' back buttons `router.replace` to — CLAUDE.md's hub-first
 * navigation), with a few topics and an exercise to try once the box has been
 * tapped. Typing shows results grouped Topic → Tanafas → Articles →
 * Professionals → Podcasts → Events → Places, the matched words lit and each
 * professional's reason for coming up, chips counting each kind, and a
 * corrected spelling said out loud; always closed by a crisis line. Nothing
 * anyone searched for is kept (no recent searches, by decision).
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
  /** "Search for … instead": this query, searched exactly as typed (no spelling correction). */
  const [exactFor, setExactFor] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Partial<Record<Group | 'organizations' | 'wellness', boolean>>>({});

  // The app's own content in the results: the topics, and Tanafas' exercises and scenes.
  const local = useMemo<LocalContent>(() => {
    const exercises: LocalExercise[] = [
      ...BREATHE_ORDER.map((key) => {
        const e = t.tanafas.exercises[EXERCISE_TEXT[key]];
        return { kind: 'breathe' as const, id: key, title: e.title, subtitle: e.subtitle, description: e.description, tone: BREATHE_TONE[key] };
      }),
      ...MEDITATION_SCENES.map((scene) => {
        const text = t.tanafas.meditation.scenes[scene.id];
        return { kind: 'meditate' as const, id: scene.id, title: s.meditateTitle.replace('{name}', text.name), subtitle: text.description, description: '', tone: 'glow' as const };
      }),
    ];
    return { topics: t.home.resourcesRail.topics, exercises, kindWords: s.kindWords };
  }, [t, s]);

  const index = useDirectorySearch(language, profile?.country ?? null, local, armed);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(id);
  }, [query]);

  // A new query starts collapsed.
  useEffect(() => setExpanded({}), [debounced]);

  // Built when the loaded items change (each source as it arrives), not on every keystroke.
  const searchIndex = useMemo(() => buildSearchIndex(index.items), [index.items]);

  const groups = useMemo(() => {
    const result = searchIndex.query(debounced, { exact: exactFor === debounced });
    const hits = result.items;
    const of = (type: SearchItem['type']) => hits.filter((h) => h.type === type);
    let professionals = of('professional');
    if (index.near) {
      const near = index.near.slugs;
      professionals = [...professionals].sort((a, b) => Number(near.has(b.key)) - Number(near.has(a.key)));
    }
    return {
      topics: of('topic'),
      tanafas: of('tanafas'),
      articles: of('article'),
      professionals,
      podcasts: of('podcast'),
      organizations: of('organization'),
      wellness: of('wellness'),
      events: hits.filter((h) => h.type === 'event' || h.type === 'speaker'),
      total: hits.length,
      lit: result.lit,
      corrected: result.corrected,
    };
  }, [searchIndex, index.near, debounced, exactFor]);

  /** How many of each kind matched, for the chips (kinds with none are hidden). */
  const counts: Record<Filter, number> = {
    all: groups.total,
    topics: groups.topics.length,
    tanafas: groups.tanafas.length,
    articles: groups.articles.length,
    professionals: groups.professionals.length,
    places: groups.organizations.length + groups.wellness.length,
    podcasts: groups.podcasts.length,
    events: groups.events.length,
  };

  // Before typing (and when nothing matched): a few topics, and one exercise.
  const suggestions = useMemo(
    () => SUGGESTED_TOPICS.map((slug) => t.home.resourcesRail.topics.find((tp) => tp.slug === slug)).filter((tp) => !!tp),
    [t],
  );
  const breatheNow = useMemo(() => tanafasItems(local.exercises.slice(0, 1), local.kindWords)[0], [local]);
  const suggest = (label: string) => {
    setArmed(true);
    setQuery(label);
  };

  /** A search that sounds like someone in crisis puts the crisis card first. */
  const crisis = useMemo(() => isCrisisQuery(debounced), [debounced]);

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
      case 'event':
        router.push({ pathname: '/events/[slug]', params: { slug: item.key } });
        break;
      case 'speaker':
        router.push({ pathname: '/events/speakers/[slug]', params: { slug: item.key } });
        break;
      case 'tanafas': {
        // Opens Tanafas at that exercise or scene ("breathe:anxiety-relief", "meditate:rain").
        const [kind, id] = item.key.split(':');
        router.push({ pathname: '/tanafas', params: kind === 'breathe' ? { tab: 'breathe', exercise: id } : { tab: 'meditate', scene: id } });
        break;
      }
      default:
        // Articles and podcasts open inside Houna (lib/inAppBrowser.ts).
        openInApp(item.key, colors.background);
    }
  };

  const shown = (group: Group, list: SearchItem[]) =>
    filter !== 'all' || expanded[group] ? list : list.slice(0, PREVIEW[group]);

  const toggle = (key: Group | 'organizations' | 'wellness') => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const sectionAction = (group: Group, list: SearchItem[]) =>
    filter === 'all' && list.length > PREVIEW[group] ? (expanded[group] ? s.showLess : s.seeAll) : undefined;

  const metaFor = (item: SearchItem) => {
    if (item.type === 'tanafas') return item.subtitle;
    if (item.type === 'event') {
      return formatEventDate(item.subtitle, { monthsLong: t.journal.dateNames.monthsLong, am: t.events.list.am, pm: t.events.list.pm }, num);
    }
    return (item.type === 'podcast' ? s.podcastMeta : s.articleMeta).replace('{source}', item.source ?? '');
  };

  const hubRows: HubRow[] = [
    { href: '/directory/professionals', title: hub.professionalsTitle, subtitle: hub.professionalsSubtitle, icon: Users, tone: 'glow' },
    { href: '/directory/organizations', title: hub.organizationsTitle, subtitle: hub.organizationsSubtitle, icon: Building2, tone: 'dawn' },
    { href: '/directory/wellness-centers', title: hub.wellnessTitle, subtitle: hub.wellnessSubtitle, icon: HeartPulse, tone: 'dusk' },
    // Read & listen: articles and podcasts in one place (components/directory/MediaHub.tsx).
    { href: '/directory/articles', title: hub.mediaTitle, subtitle: hub.mediaSubtitle, icon: Newspaper, tone: 'glow' },
    { href: '/directory/resources', title: hub.resourcesTitle, subtitle: hub.resourcesSubtitle, icon: BookOpen, tone: 'dawn' },
  ];

  // In your own words: for anyone who doesn't know the clinical name for what they feel.
  const ownWords = (
    <View style={styles.section}>
      <SectionHeader label={s.ownWords} />
      <Text style={[styles.ownIntro, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.ownWordsIntro}</Text>
      <View style={styles.suggestions}>
        {s.feelings.map((f) => (
          <Chip key={f.query} plain label={f.label} onPress={() => suggest(f.query)} />
        ))}
      </View>
    </View>
  );

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
  const chipLabel = (f: Filter) => `${f === 'tanafas' ? t.tabs.tanafas : s.filters[f]} ${num(counts[f])}`;
  const [showingBefore, showingAfter = ''] = s.showingFor.split('{word}');
  const topicChips = (list: typeof suggestions) => (
    <View style={styles.suggestions}>
      {list.map((tp) => (
        <Chip key={tp.slug} label={tp.label} onPress={() => suggest(tp.label)} />
      ))}
    </View>
  );
  const q = debounced.trim();
  const labelLatin = fonts.labelTracked;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* The mark as a soft glow behind the header (Design studies "E4"). */}
      <PageMarkGlow />
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
          <>
            {armed && (
              <>
                <View style={styles.section}>
                  <SectionHeader label={s.tryTopic} />
                  {topicChips(suggestions)}
                </View>
                {breatheNow && (
                  <View style={styles.section}>
                    <SectionHeader label={s.breatheNow} />
                    <ResultRow item={breatheNow} meta={breatheNow.subtitle} onPress={() => open(breatheNow)} />
                  </View>
                )}
              </>
            )}
            {ownWords}
            {browse}
          </>
        ) : (
          <>
            {groups.corrected && (
              <View style={styles.corrected}>
                <Text style={[styles.correctedText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                  {showingBefore}
                  <Text style={{ color: colors.primary, fontFamily: fonts.semiBold }}>{groups.corrected}</Text>
                  {showingAfter}
                </Text>
                <Pressable onPress={() => setExactFor(debounced)} accessibilityRole="button" hitSlop={8}>
                  <Text style={[styles.instead, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                    {s.searchInstead.replace('{q}', q)}
                  </Text>
                </Pressable>
              </View>
            )}

            {crisis && (
              <CrisisCard
                title={s.crisisCard.title}
                body={s.crisisCard.body}
                action={s.crisisCard.action}
                onPress={() => router.push('/crisis')}
              />
            )}

            {groups.total > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                accessibilityRole="tablist"
                accessibilityLabel={s.filtersLabel}
                contentContainerStyle={styles.filters}
              >
                {FILTERS.filter((f) => f === 'all' || f === filter || counts[f] > 0).map((f) => (
                  <Chip key={f} size="sm" label={chipLabel(f)} selected={filter === f} onPress={() => setFilter(f)} />
                ))}
              </ScrollView>
            )}

            {show('topics') && groups.topics.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  label={s.sections.topic}
                  action={sectionAction('topics', groups.topics)}
                  onAction={() => toggle('topics')}
                />
                {shown('topics', groups.topics).map((item) => (
                  <TopicResultCard key={item.key} item={item} learnMore={s.learnMore} lit={groups.lit} onPress={() => open(item)} />
                ))}
              </View>
            )}

            {show('tanafas') && groups.tanafas.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  label={t.tabs.tanafas}
                  action={sectionAction('tanafas', groups.tanafas)}
                  onAction={() => toggle('tanafas')}
                />
                {shown('tanafas', groups.tanafas).map((item) => (
                  <ResultRow key={item.key} item={item} meta={metaFor(item)} lit={groups.lit} onPress={() => open(item)} />
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
                  <ResultRow key={item.key} item={item} meta={metaFor(item)} lit={groups.lit} onPress={() => open(item)} />
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
                  <ResultRow key={item.key} item={item} lit={groups.lit} why={whyLine(item.profile, groups.lit)} onPress={() => open(item)} />
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
                  <ResultRow key={item.key} item={item} meta={metaFor(item)} lit={groups.lit} onPress={() => open(item)} />
                ))}
              </View>
            )}

            {show('events') && groups.events.length > 0 && (
              <View style={styles.section}>
                <SectionHeader
                  label={s.sections.events}
                  action={sectionAction('events', groups.events)}
                  onAction={() => toggle('events')}
                />
                {shown('events', groups.events).map((item) => (
                  <ResultRow key={`${item.type}:${item.key}`} item={item} meta={metaFor(item)} lit={groups.lit} onPress={() => open(item)} />
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
                  groups.organizations.map((item) => <ResultRow key={item.key} item={item} lit={groups.lit} onPress={() => open(item)} />)}
                {expanded.wellness &&
                  groups.wellness.map((item) => <ResultRow key={item.key} item={item} lit={groups.lit} onPress={() => open(item)} />)}
              </View>
            )}

            {/* The Places chip: organizations and wellness centers, in full. */}
            {filter === 'places' && counts.places > 0 && (
              <View style={styles.section}>
                <SectionHeader label={s.sections.places} />
                {[...groups.organizations, ...groups.wellness].map((item) => (
                  <ResultRow key={`${item.type}:${item.key}`} item={item} lit={groups.lit} onPress={() => open(item)} />
                ))}
              </View>
            )}

            {index.loading && (
              <Text style={[styles.status, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.loading}</Text>
            )}
            {!index.loading && index.failed.length > 0 && (
              <Text style={[styles.status, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.partialError}</Text>
            )}

            {!index.loading && groups.total === 0 && !crisis && (
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>
                  {s.noResults.replace('{q}', q)}
                </Text>
                <Text style={[styles.emptyHint, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.noResultsHint}</Text>
                {topicChips(suggestions.slice(0, 3))}
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
    gap: 16,
  },
  header: {
    gap: 8,
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
    gap: 12,
    paddingStart: 16,
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
  ownIntro: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  corrected: {
    gap: 4,
    marginTop: -4,
  },
  correctedText: {
    fontSize: 14.5,
  },
  instead: {
    fontSize: 13.5,
    textDecorationLine: 'underline',
  },
  filters: {
    gap: 8,
  },
  section: {
    gap: 12,
  },
  places: {
    flexDirection: 'row',
    gap: 12,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  hubText: {
    flex: 1,
    gap: 4,
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
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
  },
  emptyHint: {
    fontSize: 14,
    lineHeight: 20,
  },
});
