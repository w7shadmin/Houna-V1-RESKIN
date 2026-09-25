import React, { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, layout, nightPalette } from '@/constants/theme';
import { BREATHE_ORDER, BREATHE_TONE } from '@/constants/breathPatterns';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { MEDITATION_SCENES, SCENE_ORBS, type SceneId } from '@/components/meditation/scenes';
import { TESTS } from '@/constants/psychometrics';
import IconButton from '@/components/ui/IconButton';
import IconTile, { type IconTileTone } from '@/components/ui/IconTile';
import Card from '@/components/ui/Card';
import ScreenGlow from '@/components/ui/ScreenGlow';
import Orb from '@/components/ui/Orb';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';
import BreathePlayer, { toneGlow } from '@/components/tanafas/BreathePlayers';
import PlayerFrame, { Body, Heading, InfoTiles, MainButton, SideSpacer, Tag, Tile } from '@/components/tanafas/PlayerFrame';

type Tab = 'breathe' | 'meditate' | 'discover';

/** Discover's test tiles cycle through the canvas's three tones. */
const TEST_TONES: IconTileTone[] = ['dusk', 'glow', 'dawn'];

/**
 * Tanafas hub (canvas "Tanafas — Breathe · Meditate · Discover"), opened
 * from the raised tab-bar button as a modal. Breathe and Meditate are
 * one-at-a-time carousels with a big round button: breathing exercises run
 * right here (components/tanafas/BreathePlayers.tsx), a meditation opens its
 * full-screen scene. Discover lists the self-reflection tests. The journal is
 * one tap away in the header.
 */
export default function TanafasHubScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const h = t.discover.hub;
  const scenesText = t.tanafas.meditation.scenes;

  const [tab, setTab] = useState<Tab>('breathe');
  const [breatheIndex, setBreatheIndex] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);
  // How full the breathing orb is (0 rest → 1); the screen glow breathes with it.
  const breath = useRef(new Animated.Value(0)).current;

  const exercise = BREATHE_ORDER[breatheIndex];
  const scene = MEDITATION_SCENES[sceneIndex];
  const sceneOrb = SCENE_ORBS[scene.id as SceneId];
  const glow =
    tab === 'discover' ? alpha(nightPalette.dusk, 0.22) : tab === 'breathe' ? toneGlow(BREATHE_TONE[exercise], 0.36) : sceneOrb.glow;
  const glowOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });

  const cycle = (n: number, count: number, d: number) => (n + d + count) % count;
  const switchTab = (next: Tab) => {
    breath.stopAnimation();
    breath.setValue(0);
    setTab(next);
  };
  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: tab === 'breathe' ? glowOpacity : 1 }]}>
        <ScreenGlow color={glow} rx={70} ry={38} cy={30} />
      </Animated.View>

      <View style={styles.inner}>
        {/* Header: close · tabs · journal */}
        <View style={styles.header}>
          <IconButton
            variant="subtle"
            accessibilityLabel={h.close}
            onPress={close}
            renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />}
          />
          <View accessibilityRole="tablist" accessibilityLabel={h.tabsLabel} style={styles.tabs}>
            {(['breathe', 'meditate', 'discover'] as Tab[]).map((key) => {
              const selected = tab === key;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="tab"
                  aria-selected={selected}
                  onPress={() => switchTab(key)}
                  style={[styles.tab, { borderBottomColor: selected ? colors.primary : 'transparent' }]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: selected ? colors.text : colors.textTertiary, fontFamily: fonts.semiBold },
                    ]}
                  >
                    {h.tabs[key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <IconButton
            variant="subtle"
            accessibilityLabel={h.journal}
            onPress={() => router.push('/tanafas/journal')}
            renderIcon={(c) => <CanvasIcon name="journal" size={20} color={c} />}
          />
        </View>

        {tab === 'discover' ? (
          <DiscoverPanel />
        ) : tab === 'breathe' ? (
          <BreathePlayer
            key={exercise}
            exercise={exercise}
            breath={breath}
            nav={{
              count: BREATHE_ORDER.length,
              index: breatheIndex,
              onPrev: () => setBreatheIndex((i) => cycle(i, BREATHE_ORDER.length, -1)),
              onNext: () => setBreatheIndex((i) => cycle(i, BREATHE_ORDER.length, 1)),
            }}
          />
        ) : (
          <PlayerFrame
            mode={scene.id}
            nav={{
              count: MEDITATION_SCENES.length,
              index: sceneIndex,
              onPrev: () => setSceneIndex((i) => cycle(i, MEDITATION_SCENES.length, -1)),
              onNext: () => setSceneIndex((i) => cycle(i, MEDITATION_SCENES.length, 1)),
            }}
            stage={<MeditateStage sceneId={scene.id} />}
            heading={<Heading>{scenesText[scene.id].name}</Heading>}
            label={<Tag label={h.ambientScene} tone="glow" />}
            body={<Body>{scenesText[scene.id].description}</Body>}
            info={
              <InfoTiles>
                <Tile label={h.duration}>{h.noLimit}</Tile>
                <Tile label={h.video}>{scene.video ? h.on : h.off}</Tile>
              </InfoTiles>
            }
            controls={
              <>
                <SideSpacer />
                <MainButton
                  label={`${h.begin} — ${scenesText[scene.id].name}`}
                  glow={glow}
                  onPress={() => router.push({ pathname: '/tanafas/meditation/[scene]', params: { scene: scene.id } })}
                  renderIcon={(c) => <CanvasIcon name="play" size={28} color={c} />}
                />
                <SideSpacer />
              </>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/** Meditate: a hairline halo around the scene's coloured orb. */
function MeditateStage({ sceneId }: { sceneId: SceneId }) {
  const { colors } = useTheme();
  const orb = SCENE_ORBS[sceneId];
  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={250} height={250} style={StyleSheet.absoluteFill}>
        <Circle cx={124} cy={124} r={119.5} fill="none" stroke={colors.text} strokeOpacity={0.16} strokeWidth={1} />
      </Svg>
      <Orb
        size={176}
        fx={0.38}
        fy={0.32}
        stops={[
          [orb.hi, 0],
          [orb.c, 0.48],
          [orb.lo, 1],
        ]}
        glow={`0 0 70px ${orb.glow}`}
      />
    </View>
  );
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
            { color: colors.tones.dusk.fg, fontFamily: latin ? fonts.labelRegular : fonts.label },
          ]}
        >
          {d.eyebrow}
        </Text>
        <Text accessibilityRole="header" style={[styles.discoverTitle, isRTL && styles.discoverTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
          {d.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{d.body}</Text>
      </View>

      <View style={[styles.note, { backgroundColor: alpha(nightPalette.dusk, 0.08), borderColor: colors.tones.dusk.border }]}>
        <CanvasIcon name="info" size={20} strokeWidth={1.7} color={colors.tones.dusk.fg} />
        <View style={styles.noteText}>
          <Text style={[styles.noteBody, { color: colors.text, fontFamily: fonts.regular }]}>{d.disclaimer}</Text>
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/directory/professionals')} hitSlop={8}>
            <Text style={[styles.noteLink, { color: colors.tones.dusk.fg, fontFamily: fonts.semiBold }]}>{d.findProfessional}</Text>
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
  },
  tabs: {
    flexDirection: 'row',
    gap: 16,
  },
  tab: {
    height: 44,
    paddingHorizontal: 4,
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
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
