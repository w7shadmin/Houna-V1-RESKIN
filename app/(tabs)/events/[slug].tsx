import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Play } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout, radius, shadows } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import { decodeEntities, profileFacts } from '@/lib/directoryProfile';
import { formatEventDate } from '@/lib/eventDate';
import { fetchEventDetail, resolveImageUrl, type EventDetail } from '@/lib/hounaApi';
import { stripHtml } from '@/lib/html';
import { useReduceMotion } from '@/hooks/useCalmLoop';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import { BodyText, FactGrid, GroupLabel, ProfileTopBar, SectionCard } from '@/components/directory/ProfileKit';

const GROW_MS = 650;
const SHRINK_MS = 480;
const SETTLE = Easing.bezier(0.2, 0.9, 0.25, 1);

type Rect = { x: number; y: number; w: number; h: number };

/** The travelling photo is placed by measured, physical pixels, so it mustn't mirror in Arabic (native only; the web never swaps). */
const PHYSICAL = Platform.OS === 'web' ? null : ({ direction: 'ltr' } as const);

/**
 * An event, in the profile pages' language: rounded cover image, date,
 * display title, fact tiles (where, which language), About card, and any
 * recordings as video cards.
 *
 * Opened from a card, it grows from it (canvas "Motion — an event card grows into its
 * page"): the list stays in view while the card's photo travels to become the cover, the
 * page's ground fades up round it and the rest arrives; Back shrinks it into its card again.
 * The screen is a transparent modal for this (events/_layout.tsx). Opened any other way, or
 * with Reduce Motion, it simply fades in.
 */
export default function EventDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ slug: string; x?: string; y?: string; w?: string; h?: string; img?: string }>();
  const { slug } = params;
  const { t, language, isRTL, fonts } = useLanguage();
  const reduceMotion = useReduceMotion();
  const s = t.events.detail;
  const list = t.events.list;
  const common = t.directory.common;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEventDetail(slug, language)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : common.notFound))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, language, common.notFound]);

  /* ── Growing from the card ── */
  const card: Rect | null = params.x && params.w ? { x: Number(params.x), y: Number(params.y), w: Number(params.w), h: Number(params.h) } : null;
  // 0: the photo where the card is, the list in view; 1: the page, the photo as its cover.
  const grow = useRef(new Animated.Value(0)).current;
  const rootRef = useRef<View>(null);
  const coverRef = useRef<View>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [cover, setCover] = useState<Rect | null>(null);
  // The travelling photo is drawn while it moves; the real cover takes over once it lands.
  const [flying, setFlying] = useState(!!card);
  const started = useRef(false);
  const leaving = useRef(false);
  const flies = !!card && !reduceMotion;

  const measureCover = (then?: (r: Rect) => void) =>
    coverRef.current?.measureInWindow((x, y, w, h) => {
      const r = { x, y, w, h };
      setCover(r);
      then?.(r);
    });

  useEffect(() => {
    if (started.current) return;
    if (flies && (!origin || !cover)) return;
    started.current = true;
    Animated.timing(grow, { toValue: 1, duration: flies ? GROW_MS : reduceMotion ? 0 : 300, easing: SETTLE, useNativeDriver: false }).start(() => setFlying(false));
  }, [flies, origin, cover, grow, reduceMotion]);

  // Back (the button, a gesture or the hardware key) shrinks the page into its card first.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (leaving.current || !flies) return;
        e.preventDefault();
        leaving.current = true;
        measureCover(() => {
          setFlying(true);
          Animated.timing(grow, { toValue: 0, duration: SHRINK_MS, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start(() =>
            navigation.dispatch(e.data.action),
          );
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, flies],
  );

  const back = () => (router.canGoBack() ? router.back() : router.replace('/events'));

  const uri = resolveImageUrl(detail?.imageUrl ?? '') || params.img || '';
  const pageOpacity = grow.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const restOpacity = grow.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 1] });
  const restLift = grow.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const between = (a: number, b: number) => grow.interpolate({ inputRange: [0, 1], outputRange: [a, b] });
  const flyer =
    flies && flying && origin && cover && card && uri ? (
      <Animated.View
        pointerEvents="none"
        style={[
          styles.flyer,
          {
            left: between(card.x - origin.x, cover.x - origin.x),
            top: between(card.y - origin.y, cover.y - origin.y),
            width: between(card.w, cover.w),
            height: between(card.h, cover.h),
            // The card's photo has square lower corners (the card's body is below it); the cover's are round.
            borderBottomLeftRadius: between(0, radius.cardLg),
            borderBottomRightRadius: between(0, radius.cardLg),
          },
        ]}
      >
        <Image source={{ uri }} style={styles.fill} resizeMode="cover" />
      </Animated.View>
    ) : null;

  const facts = detail ? profileFacts(detail.info) : [];
  const description = detail?.description ? decodeEntities(stripHtml(detail.description)) : '';
  const date = detail?.date ? formatEventDate(detail.date, { monthsLong: t.journal.dateNames.monthsLong, am: list.am, pm: list.pm }, num) : '';
  const videos = (detail?.youtubeEmbeds ?? []).map((u) => u.match(/embed\/([^?/]+)/)?.[1]).filter((id): id is string => !!id);

  return (
    <View
      ref={rootRef}
      collapsable={false}
      style={styles.root}
      onLayout={() => rootRef.current?.measureInWindow((x, y) => setOrigin({ x, y }))}
    >
      {/* The page's ground fades up round the travelling photo, so the list shows through at first. */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: pageOpacity }]} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: restOpacity }}>
            <ProfileTopBar onBack={back} />
          </Animated.View>

          {!!uri && (
            <View
              ref={coverRef}
              collapsable={false}
              onLayout={() => measureCover()}
              style={[styles.cover, { backgroundColor: colors.control, borderColor: colors.border }, flies && flying && styles.hidden]}
            >
              <Image source={{ uri }} style={styles.fill} resizeMode="cover" />
            </View>
          )}

          <Animated.View style={[styles.rest, { opacity: restOpacity, transform: [{ translateY: restLift }] }]}>
            {loading || error || !detail ? (
              loading ? (
                <LoadingState label={s.loading} />
              ) : (
                <ErrorState message={error || common.notFound} retryLabel={common.goBack} onRetry={back} />
              )
            ) : (
              <>
                <View style={styles.titleBlock}>
                  {!!date && (
                    <View style={styles.dateRow}>
                      <Calendar size={16} color={colors.primary} strokeWidth={1.8} />
                      <Text style={[styles.date, { color: colors.primary, fontFamily: fonts.medium }]}>{date}</Text>
                    </View>
                  )}
                  <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
                    {decodeEntities(detail.title)}
                  </Text>
                </View>

                {facts.length > 0 && <FactGrid facts={facts} />}

                {!!description && (
                  <SectionCard title={s.aboutEvent}>
                    <BodyText>{description}</BodyText>
                  </SectionCard>
                )}

                {videos.length > 0 && (
                  <View style={styles.group}>
                    <GroupLabel>{s.watch}</GroupLabel>
                    {videos.map((id) => (
                      <Pressable
                        key={id}
                        onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${id}`).catch(() => {})}
                        accessibilityRole="link"
                        accessibilityLabel={`${s.watch}: ${detail.title}`}
                        style={({ pressed }) => [styles.video, { backgroundColor: colors.control, borderColor: colors.border }, pressed && styles.pressed]}
                      >
                        <Image source={{ uri: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }} style={styles.fill} resizeMode="cover" />
                        <View style={styles.videoShade}>
                          <View style={[styles.play, { backgroundColor: colors.action }, shadows.glow]}>
                            <Play size={22} color={colors.onAction} fill={colors.onAction} />
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, PHYSICAL]}>
        {flyer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(5),
    gap: grid(3),
  },
  rest: {
    gap: grid(3),
  },
  cover: {
    aspectRatio: 16 / 10,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  hidden: {
    opacity: 0,
  },
  flyer: {
    position: 'absolute',
    borderTopLeftRadius: radius.cardLg,
    borderTopRightRadius: radius.cardLg,
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  titleBlock: {
    gap: grid(1),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
  },
  date: {
    fontSize: 14,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleArabic: {
    lineHeight: 46,
  },
  group: {
    gap: grid(1.5),
  },
  video: {
    aspectRatio: 16 / 9,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  videoShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  play: {
    width: grid(7),
    height: grid(7),
    borderRadius: grid(3.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
