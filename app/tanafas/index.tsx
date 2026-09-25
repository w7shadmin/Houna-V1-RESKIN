import React, { useId, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, layout, nightPalette } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { MEDITATION_SCENES, SCENE_ORBS, type SceneId } from '@/components/meditation/scenes';
import { TESTS } from '@/constants/psychometrics';
import IconButton from '@/components/ui/IconButton';
import IconTile, { type IconTileTone } from '@/components/ui/IconTile';
import Card from '@/components/ui/Card';
import ScreenGlow from '@/components/ui/ScreenGlow';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';

type Tab = 'breathe' | 'meditate' | 'discover';

interface CarouselItem {
  key: string;
  title: string;
  tag: string;
  desc: string;
  tiles: [{ label: string; value: string }, { label: string; value: string }];
  safety: boolean;
  href: Href;
}

/** Discover's test tiles cycle through the canvas's three tones. */
const TEST_TONES: IconTileTone[] = ['dusk', 'glow', 'dawn'];

/**
 * Tanafas hub (canvas "Tanafas — Breathe · Meditate · Discover"), opened
 * from the raised tab-bar button as a modal. Breathe and Meditate are
 * one-at-a-time carousels with a big Begin button; Discover lists the
 * self-reflection tests. The journal is one tap away in the header.
 */
export default function TanafasHubScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL } = useLanguage();
  const h = t.discover.hub;
  const ex = t.tanafas.exercises;
  const scenesText = t.tanafas.meditation.scenes;

  const [tab, setTab] = useState<Tab>('breathe');
  const [breatheIndex, setBreatheIndex] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(0);

  const clean = (s: string) => s.replace(/[()]/g, '').trim();

  const breathe: CarouselItem[] = [
    { key: 'anxiety-relief', e: ex.anxietyRelief, pattern: h.patterns.anxietyRelief, safety: false },
    { key: 'steady-mind', e: ex.steadyMind, pattern: h.patterns.steadyMind, safety: false },
    { key: 'panic-relief', e: ex.panicRelief, pattern: h.patterns.panicRelief, safety: false },
    { key: 'nervous-system-reset', e: ex.nervousSystemReset, pattern: h.patterns.nervousSystemReset, safety: true },
    { key: 'tension-release', e: ex.tensionRelease, pattern: h.patterns.tensionRelease, safety: false },
  ].map(({ key, e, pattern, safety }) => ({
    key,
    title: e.title,
    tag: clean(e.subtitle),
    desc: e.description,
    tiles: [
      { label: h.pattern, value: pattern },
      { label: h.duration, value: e.duration },
    ],
    safety,
    href: `/tanafas/breathing/${key}` as Href,
  }));

  const scenes: CarouselItem[] = MEDITATION_SCENES.map((scene) => ({
    key: scene.id,
    title: scenesText[scene.id].name,
    tag: h.ambientScene,
    desc: scenesText[scene.id].description,
    tiles: [
      { label: h.duration, value: h.noLimit },
      { label: h.video, value: scene.video ? h.on : h.off },
    ],
    safety: false,
    href: { pathname: '/tanafas/meditation/[scene]', params: { scene: scene.id } },
  }));

  const isBreathe = tab === 'breathe';
  const list = isBreathe ? breathe : scenes;
  const index = isBreathe ? breatheIndex : sceneIndex;
  const setIndex = isBreathe ? setBreatheIndex : setSceneIndex;
  const item = list[index];
  const go = (d: number) => setIndex((index + d + list.length) % list.length);

  const sceneOrb = SCENE_ORBS[(MEDITATION_SCENES[sceneIndex]?.id ?? 'fire') as SceneId];
  const glow =
    tab === 'discover'
      ? alpha(nightPalette.dusk, 0.22)
      : tab === 'breathe'
        ? alpha(nightPalette.hounaGlow, 0.3)
        : sceneOrb.glow;

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScreenGlow color={glow} rx={70} ry={38} cy={30} />

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
                  onPress={() => setTab(key)}
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
        ) : (
          <View style={styles.player}>
            <View style={styles.stageArea}>
              {isBreathe ? <BreatheStage /> : <MeditateStage sceneId={MEDITATION_SCENES[sceneIndex].id} />}

              <View style={styles.titleRow}>
                <Pressable accessibilityRole="button" accessibilityLabel={h.previous} onPress={() => go(-1)} style={styles.arrow}>
                  <DirectionalIcon isRTL={isRTL} name="chevronStart" size={20} strokeWidth={1.8} color={colors.textSecondary} />
                </Pressable>
                <View style={styles.titleBlock} accessibilityLiveRegion="polite">
                  <Text style={[styles.itemTitle, isRTL && styles.itemTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
                    {item.title}
                  </Text>
                  <Tag label={item.tag} safety={item.safety} />
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={h.next} onPress={() => go(1)} style={styles.arrow}>
                  <DirectionalIcon isRTL={isRTL} name="chevron" size={20} strokeWidth={1.8} color={colors.textSecondary} />
                </Pressable>
              </View>

              <Text style={[styles.desc, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{item.desc}</Text>

              <View style={styles.pager} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {list.map((it, k) => (
                  <View
                    key={it.key}
                    style={[
                      styles.pagerDot,
                      k === index
                        ? { width: 22, backgroundColor: colors.text }
                        : { backgroundColor: colors.textTertiary, opacity: 0.45 },
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.bottom}>
              {item.safety && (
                <View style={[styles.safety, { backgroundColor: colors.crisis.bg, borderColor: colors.crisis.borderSoft }]}>
                  <CanvasIcon name="shield" size={18} strokeWidth={1.7} color={colors.tones.dawn.fg} />
                  <Text style={[styles.safetyText, { color: colors.text, fontFamily: fonts.regular }]}>{h.safetyNote}</Text>
                </View>
              )}
              <View style={styles.tiles}>
                {item.tiles.map((tile) => (
                  <View key={tile.label} style={[styles.tile, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
                    <Text
                      style={[
                        fonts.labelTracked ? styles.tileLabelLatin : styles.tileLabelArabic,
                        { color: colors.textTertiary, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label },
                      ]}
                    >
                      {tile.label}
                    </Text>
                    <Text style={[styles.tileValue, { color: colors.text, fontFamily: fonts.medium }]}>{tile.value}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.beginRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${h.begin} — ${item.title}`}
                  onPress={() => router.push(item.href)}
                  style={({ pressed }) => [
                    styles.begin,
                    { backgroundColor: colors.action, boxShadow: `0 0 36px ${glow}` },
                    pressed && styles.pressed,
                  ]}
                >
                  <CanvasIcon name="play" size={28} color={colors.onAction} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function Tag({ label, safety }: { label: string; safety: boolean }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const latin = fonts.labelTracked;
  return (
    <View
      style={[
        styles.tag,
        safety
          ? { backgroundColor: alpha(nightPalette.dawn, 0.14), borderColor: alpha(nightPalette.dawn, 0.4) }
          : { backgroundColor: alpha(nightPalette.hounaGlow, 0.12), borderColor: alpha(nightPalette.hounaGlow, 0.32) },
      ]}
    >
      <Text
        style={[
          latin ? styles.tagLatin : styles.tagArabic,
          {
            color: safety ? colors.tones.dawn.fg : colors.primary,
            fontFamily: latin ? fonts.labelRegular : fonts.label,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/** Radial-gradient sphere, CSS `circle at X% Y%` → SVG focal point at the same spot. */
function Orb({ size, stops, fx, fy, glow }: { size: number; stops: [string, number][]; fx: number; fy: number; glow: string }) {
  const id = `orb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  // CSS default radius for `circle at …` is the farthest corner.
  const r = Math.hypot(Math.max(fx, 1 - fx), Math.max(fy, 1 - fy));
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, boxShadow: glow }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx={`${fx * 100}%`} cy={`${fy * 100}%`} fx={`${fx * 100}%`} fy={`${fy * 100}%`} r={`${r * 100}%`}>
            {stops.map(([c, o]) => (
              <Stop key={o} offset={o} stopColor={c} />
            ))}
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Breathe: the 28-dot ring, a hairline circle, and a glowing pearl. */
function BreatheStage() {
  const { colors } = useTheme();
  const N = 28;
  const R = 110;
  const C = 125;
  const dots = Array.from({ length: N }, (_, k) => {
    const tt = k / N;
    const a = tt * Math.PI * 2 - Math.PI / 2;
    const s = 3 + 4 * Math.sin(tt * Math.PI);
    return { cx: C + R * Math.cos(a), cy: C + R * Math.sin(a), r: s / 2, o: 0.2 + 0.8 * Math.sin(tt * Math.PI), c: k < N / 2 ? colors.primary : colors.tones.dusk.fg };
  });
  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={250} height={250} style={StyleSheet.absoluteFill}>
        {dots.map((d, k) => (
          <Circle key={k} cx={d.cx} cy={d.cy} r={d.r} fill={d.c} opacity={d.o} />
        ))}
        <Circle cx={124} cy={124} r={68.5} fill="none" stroke={colors.text} strokeOpacity={0.14} strokeWidth={1} />
      </Svg>
      <Orb
        size={74}
        fx={0.34}
        fy={0.3}
        stops={[
          ['#FFFFFF', 0],
          ['#CFF6F2', 0.4],
          [colors.primary, 1],
        ]}
        glow={`0 0 40px ${alpha(nightPalette.hounaGlow, 0.55)}`}
      />
    </View>
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
    paddingTop: 20,
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
    paddingHorizontal: 2,
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
  },
  player: {
    flex: 1,
  },
  stageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  stage: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  itemTitle: {
    fontSize: 27,
    lineHeight: 27 * 1.12,
    textAlign: 'center',
  },
  itemTitleArabic: {
    lineHeight: 40,
  },
  tag: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.12,
    textTransform: 'uppercase',
  },
  tagArabic: {
    fontSize: 12.5,
  },
  desc: {
    maxWidth: 310,
    minHeight: 44,
    fontSize: 14.5,
    lineHeight: 14.5 * 1.5,
    textAlign: 'center',
  },
  pager: {
    flexDirection: 'row',
    gap: 6,
  },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bottom: {
    gap: 16,
  },
  safety: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  safetyText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 13.5 * 1.4,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    gap: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  tileLabelLatin: {
    fontSize: 10.5,
    letterSpacing: 10.5 * 0.14,
    textTransform: 'uppercase',
  },
  tileLabelArabic: {
    fontSize: 12,
  },
  tileValue: {
    fontSize: 16,
  },
  beginRow: {
    alignItems: 'center',
  },
  begin: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  discover: {
    paddingTop: 22,
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
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    gap: 6,
  },
  noteBody: {
    fontSize: 13.5,
    lineHeight: 13.5 * 1.45,
  },
  noteLink: {
    fontSize: 13.5,
  },
  tests: {
    gap: 10,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
