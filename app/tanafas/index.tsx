import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, layout } from '@/constants/theme';
import { BREATHE_ORDER, BREATHE_TONE, DEFAULT_MEDITATION_MINUTES } from '@/constants/breathPatterns';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { MEDITATION_SCENES, SCENE_ORBS, type SceneId } from '@/components/meditation/scenes';
import { TESTS } from '@/constants/psychometrics';
import IconButton from '@/components/ui/IconButton';
import IconTile, { type IconTileTone } from '@/components/ui/IconTile';
import Card from '@/components/ui/Card';
import ScreenGlow from '@/components/ui/ScreenGlow';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';
import BreathePlayer, { toneGlow } from '@/components/tanafas/BreathePlayers';
import GlowTabs from '@/components/ui/GlowTabs';
import GlassSheet from '@/components/ui/GlassSheet';
import MeditateHero from '@/components/tanafas/MeditateHero';
import ScenePicker from '@/components/tanafas/ScenePicker';
import MinutesWheel from '@/components/tanafas/MinutesWheel';
import { useControlsAway } from '@/hooks/useControlsAway';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';

type Tab = 'breathe' | 'meditate' | 'discover';

/** Discover's test tiles cycle through the canvas's three tones. */
const TEST_TONES: IconTileTone[] = ['dusk', 'glow', 'dawn'];

/**
 * Tanafas hub (canvas "Tanafas — Breathe · Meditate · Discover"), opened
 * from the raised tab-bar button as a modal. Breathe and Meditate are
 * one-at-a-time carousels with a big round button: breathing exercises run
 * right here (components/tanafas/BreathePlayers.tsx), a meditation opens its
 * full-screen scene. Discover lists the self-reflection tests. The journal is
 * one tap away in the header. A search result can open it at one exercise or
 * scene (`tab` + `exercise` / `scene` params); otherwise it opens on Breathe.
 */
export default function TanafasHubScreen() {
  const { colors, isNight } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL } = useLanguage();
  const h = t.discover.hub;
  const scenesText = t.tanafas.meditation.scenes;

  const params = useLocalSearchParams<{ tab?: string; exercise?: string; scene?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'meditate' || params.tab === 'discover' ? params.tab : 'breathe');
  const [breatheIndex, setBreatheIndex] = useState(() => Math.max(0, BREATHE_ORDER.findIndex((k) => k === params.exercise)));
  const [sceneIndex, setSceneIndex] = useState(() => Math.max(0, MEDITATION_SCENES.findIndex((sc) => sc.id === params.scene)));
  // Meditation length, chosen here so the player can open straight into the session.
  const [meditateMinutes, setMeditateMinutes] = useState<number | null>(DEFAULT_MEDITATION_MINUTES);
  // The Meditate hero's glass sheets: choosing a scene, or a length.
  const [sheet, setSheet] = useState<'scene' | 'length' | null>(null);
  // How full the breathing orb is (0 rest → 1); the screen glow breathes with it.
  const breath = useRef(new Animated.Value(0)).current;
  // While a breathing session runs on its own, the header and the player's controls step aside.
  const [sessionActive, setSessionActive] = useState(false);
  const away = useControlsAway(tab === 'breathe' && sessionActive);
  // Behind a breathing session, running or paused, the dawn backdrop fades in.
  const [inSession, setInSession] = useState(false);
  const breathing = tab === 'breathe' && inSession;
  const ground = useSessionGround(breathing);
  // A session is truly full screen: the system bars go, the screen stays awake, and the header
  // keeps only its icons (the tabs would end the session anyway).
  useFullScreen(breathing);
  const tabsShown = useFade(!breathing);
  const insets = useSteadyInsets();

  const exercise = BREATHE_ORDER[breatheIndex];
  const scene = MEDITATION_SCENES[sceneIndex];
  const sceneOrb = SCENE_ORBS[scene.id as SceneId];
  const glow =
    tab === 'discover' ? alpha(colors.tones.dusk.hue, 0.22) : tab === 'breathe' ? toneGlow(colors, BREATHE_TONE[exercise], 0.36) : sceneOrb.glow;
  const glowOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  const cycle = (n: number, count: number, d: number) => (n + d + count) % count;
  const switchTab = (next: Tab) => {
    breath.stopAnimation();
    breath.setValue(0);
    setTab(next);
  };
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <View
      style={[styles.safe, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}
      // A touch or click anywhere brings stepped-aside controls back; returning false leaves it for whatever is under it.
      onStartShouldSetResponderCapture={() => {
        away.wake();
        return false;
      }}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: tab === 'breathe' ? glowOpacity : 1 }]}>
        <ScreenGlow color={glow} rx={70} ry={38} cy={30} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: ground }]}>
        <LinearGradient colors={colors.sessionGround.colors} locations={colors.sessionGround.locations} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={styles.inner}>
        {/* Header: close · tabs · journal (steps aside during a breathing session) */}
        <Animated.View style={[styles.header, { opacity: away.opacity }]} pointerEvents={away.interactive ? 'auto' : 'none'}>
          <IconButton
            variant="subtle"
            accessibilityLabel={h.close}
            onPress={close}
            renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />}
          />
          <Animated.View
            style={{ opacity: tabsShown }}
            pointerEvents={breathing ? 'none' : 'auto'}
            accessibilityElementsHidden={breathing}
            importantForAccessibility={breathing ? 'no-hide-descendants' : 'auto'}
          >
            <GlowTabs
              accessibilityLabel={h.tabsLabel}
              items={(['breathe', 'meditate', 'discover'] as Tab[]).map((key) => ({ key, label: h.tabs[key] }))}
              value={tab}
              onChange={switchTab}
            />
          </Animated.View>
          <IconButton
            variant="subtle"
            accessibilityLabel={h.journal}
            onPress={() => router.push('/tanafas/journal')}
            renderIcon={(c) => <CanvasIcon name="journal" size={20} color={c} />}
          />
        </Animated.View>

        {tab === 'discover' ? (
          <DiscoverPanel />
        ) : tab === 'breathe' ? (
          <BreathePlayer
            key={exercise}
            exercise={exercise}
            onSessionActive={setSessionActive}
            onInSession={setInSession}
            away={away}
            breath={breath}
            nav={{
              count: BREATHE_ORDER.length,
              index: breatheIndex,
              onPrev: () => setBreatheIndex((i) => cycle(i, BREATHE_ORDER.length, -1)),
              onNext: () => setBreatheIndex((i) => cycle(i, BREATHE_ORDER.length, 1)),
            }}
          />
        ) : (
          <MeditateHero
            scene={scene}
            minutes={meditateMinutes}
            onScene={() => setSheet('scene')}
            onLength={() => setSheet('length')}
            onBegin={() =>
              router.push({ pathname: '/tanafas/meditation/[scene]', params: { scene: scene.id, minutes: meditateMinutes === null ? 'none' : String(meditateMinutes) } })
            }
          />
        )}
      </View>

      {/* The Meditate hero's choices, as glass sheets over the hub. */}
      <GlassSheet visible={sheet === 'scene'} onClose={() => setSheet(null)} eyebrow={h.scene} title={h.chooseSceneTitle} closeLabel={t.checkIn.close}>
        <ScenePicker
          value={sceneIndex}
          onChoose={(i) => {
            setSceneIndex(i);
            setSheet(null);
          }}
        />
      </GlassSheet>
      <GlassSheet visible={sheet === 'length'} onClose={() => setSheet(null)} eyebrow={h.length} title={h.lengthTitle} closeLabel={t.checkIn.close}>
        <MinutesWheel
          value={meditateMinutes}
          onDone={(m) => {
            setMeditateMinutes(m);
            setSheet(null);
          }}
        />
      </GlassSheet>
      <StatusBar hidden={breathing} style={isNight ? 'light' : 'dark'} />
    </View>
  );
}

/**
 * The safe-area insets, held at the largest seen: hiding the system bars for a session would
 * otherwise shrink them to nothing and jump the whole layout up and down.
 */
function useSteadyInsets(): EdgeInsets {
  const insets = useSafeAreaInsets();
  const most = useRef(insets);
  most.current = {
    top: Math.max(most.current.top, insets.top),
    bottom: Math.max(most.current.bottom, insets.bottom),
    left: Math.max(most.current.left, insets.left),
    right: Math.max(most.current.right, insets.right),
  };
  return most.current;
}

/** Hides Android's navigation bar and keeps the screen awake while `on` (the status bar is the StatusBar element's). */
function useFullScreen(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const tag = 'tanafas-breathe';
    activateKeepAwakeAsync(tag).catch(() => {});
    if (Platform.OS === 'android') NavigationBar.setVisibilityAsync('hidden').catch(() => {});
    return () => {
      deactivateKeepAwake(tag).catch(() => {});
      if (Platform.OS === 'android') NavigationBar.setVisibilityAsync('visible').catch(() => {});
    };
  }, [on]);
}

/** 1 when shown, 0 when not, faded between; instant under Reduce Motion. */
function useFade(shown: boolean) {
  const v = useRef(new Animated.Value(shown ? 1 : 0)).current;
  const reduceMotion = useReduceMotion();
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: shown ? 1 : 0, duration: reduceMotion ? 0 : 400, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE });
    anim.start();
    return () => anim.stop();
  }, [shown, v, reduceMotion]);
  return v;
}

/** The session backdrop's opacity: in over a breath's length as a session begins, out as it ends. */
function useSessionGround(on: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();
  useEffect(() => {
    const anim = Animated.timing(v, {
      toValue: on ? 1 : 0,
      duration: reduceMotion ? 0 : on ? 2400 : 900,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: NATIVE,
    });
    anim.start();
    return () => anim.stop();
  }, [on, v, reduceMotion]);
  return v;
}

function DiscoverPanel() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL, language } = useLanguage();
  const d = t.discover.discover;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const latin = fonts.labelTracked;

  return (
    <ScrollView contentContainerStyle={styles.discover} showsVerticalScrollIndicator={false}>
      <View style={styles.discoverHead}>
        <Text
          style={[
            latin ? styles.eyebrowLatin : styles.eyebrowArabic,
            { color: colors.tones.dusk.text, fontFamily: latin ? fonts.labelRegular : fonts.label },
          ]}
        >
          {d.eyebrow}
        </Text>
        <Text accessibilityRole="header" style={[styles.discoverTitle, isRTL && styles.discoverTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
          {d.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{d.body}</Text>
      </View>

      <View style={[styles.note, { backgroundColor: alpha(colors.tones.dusk.hue, 0.08), borderColor: colors.tones.dusk.border }]}>
        <CanvasIcon name="info" size={20} strokeWidth={1.7} color={colors.tones.dusk.fg} />
        <View style={styles.noteText}>
          <Text style={[styles.noteBody, { color: colors.text, fontFamily: fonts.regular }]}>{d.disclaimer}</Text>
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/directory/professionals')} hitSlop={8}>
            <Text style={[styles.noteLink, { color: colors.tones.dusk.text, fontFamily: fonts.semiBold }]}>{d.findProfessional}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.tests}>
        {TESTS.length === 0 && (
          <Text style={[styles.body, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{d.empty}</Text>
        )}
        {TESTS.map((test, k) => {
          const n = test.items.length;
          const minutes = Math.max(1, Math.ceil((n * 10) / 60));
          const meta = `${arabicPlural(n, d.questions).replace('{n}', num(n))} · ${d.minutes.replace('{n}', num(minutes))}`;
          return (
            <Card
              key={test.id}
              onPress={() => router.push({ pathname: '/tanafas/discover/[testId]', params: { testId: test.id } })}
              accessibilityLabel={`${test.title[language]}, ${meta}`}
              style={styles.testCard}
            >
              <IconTile
                size={48}
                tone={TEST_TONES[k % TEST_TONES.length]}
                renderIcon={(c) => <CanvasIcon name="reflection" size={22} strokeWidth={1.6} color={c} />}
              />
              <View style={styles.testText}>
                <Text style={[styles.testTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{test.title[language]}</Text>
                <Text
                  style={[
                    latin ? styles.testMetaLatin : styles.testMetaArabic,
                    { color: colors.textTertiary, fontFamily: latin ? fonts.labelRegular : fonts.regular },
                  ]}
                >
                  {meta}
                </Text>
              </View>
              <DirectionalIcon isRTL={isRTL} name="chevron" size={18} color={colors.textTertiary} />
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingTop: 16,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    // Above the Meditate hero's sky, which reaches up behind it.
    zIndex: 2,
  },
  stage: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discover: {
    paddingTop: 24,
    gap: 16,
  },
  discoverHead: {
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
  discoverTitle: {
    fontSize: 30,
    lineHeight: 30 * 1.12,
  },
  discoverTitleArabic: {
    lineHeight: 44,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 14.5 * 1.5,
  },
  note: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    gap: 8,
  },
  noteBody: {
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
  },
  noteLink: {
    fontSize: 13.5,
  },
  tests: {
    gap: 12,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  testText: {
    flex: 1,
    gap: 4,
  },
  testTitle: {
    fontSize: 16,
  },
  testMetaLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.1,
    textTransform: 'uppercase',
  },
  testMetaArabic: {
    fontSize: 12.5,
  },
});
