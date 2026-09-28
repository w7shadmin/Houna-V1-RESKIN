import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, arabicFontFamily, grid, latinFontFamily, layout } from '@/constants/theme';
import { FIRST_BREATH } from '@/constants/breathPatterns';
import type { Language } from '@/constants/strings';
import { OrbStage } from '@/components/tanafas/BreatheStages';
import ScreenGlow from '@/components/ui/ScreenGlow';
import Button from '@/components/ui/Button';
import NightStars from '@/components/home/NightStars';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { useIntroDone } from '@/hooks/useIntroDone';
import { markFirstBreathDone } from '@/lib/firstRun';

/** The story's cues (ms from the start): a welcome, the invitation, the orb, then the breath. */
const WELCOME_AT = 300;
const INVITE_AT = 3400;
const ORB_AT = 6000;
const BREATH_AT = 6400;
const FADE_IN = 800;
const FADE_OUT = 600;

type LineKey = 'welcome' | 'invite' | 'inhale' | 'hold' | 'exhale' | 'end';
interface Cue {
  key: LineKey;
  from: number;
  /** When it has gone; the last line stays. */
  to?: number;
}

/** The breath's lines follow FIRST_BREATH's phases, each for as long as its phase. */
const BREATH_CUES: Cue[] = [];
let at = BREATH_AT;
for (const phase of FIRST_BREATH) {
  BREATH_CUES.push({ key: phase.key as 'inhale' | 'hold' | 'exhale', from: at, to: at + phase.seconds * 1000 });
  at += phase.seconds * 1000;
}
const END_AT = at + 200;
const CUES: Cue[] = [
  { key: 'welcome', from: WELCOME_AT, to: INVITE_AT - 200 },
  { key: 'invite', from: INVITE_AT, to: BREATH_AT },
  ...BREATH_CUES,
  { key: 'end', from: END_AT },
];

/**
 * The first breath (canvas "Phase 5 — one breath together, once"): shown once, before anything
 * is asked (`app/index.tsx` sends a first launch here). A welcome, then one guided breath on
 * 4-7-8's glass orb (FIRST_BREATH: in 4, hold 2, out 6), then Continue to Home. Nothing is
 * counted; "Not now" skips it at any moment, and either way it never shows again
 * (`lib/firstRun.ts`). Choosing the other language restarts the app in it, as the setting does,
 * and the breath begins again. Under Reduce Motion the words come without the orb moving.
 */
export default function Welcome() {
  const { colors, isNight } = useTheme();
  const { t, language, setLanguage, fonts, isRTL } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const w = t.firstRun.welcome;
  const leaving = useRef(false);

  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    markFirstBreathDone().finally(() => router.replace('/(tabs)'));
  };

  const pick = (lang: Language) => {
    if (lang !== language) setLanguage(lang);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {isNight && <NightStars />}
      <ScreenGlow color={alpha(colors.tones.glow.hue, isNight ? 0.14 : 0.22)} rx={70} ry={45} cy={40} />
      <View style={styles.column}>
        <View style={styles.top}>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={w.language}
            style={[styles.switch, { backgroundColor: colors.control, borderColor: colors.border }]}
          >
            {(['en', 'ar'] as const).map((lang) => {
              const chosen = lang === language;
              return (
                <Pressable
                  key={lang}
                  onPress={() => pick(lang)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: chosen }}
                  accessibilityLanguage={lang}
                  hitSlop={{ top: 8, bottom: 8 }}
                  style={({ pressed }) => [styles.option, chosen && { backgroundColor: colors.action }, pressed && styles.pressed]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: chosen ? colors.onAction : colors.textSecondary,
                        fontFamily: (lang === 'ar' ? arabicFontFamily : latinFontFamily).semiBold,
                      },
                    ]}
                  >
                    {w.languageNames[lang]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={leave} accessibilityRole="button" hitSlop={12} style={({ pressed }) => pressed && styles.pressed}>
            <Text style={[styles.notNow, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{w.notNow}</Text>
          </Pressable>
        </View>
        {/* Keyed on the language: on the web, where no reload happens, the breath begins again. */}
        <Breath key={language} onContinue={leave} isRTL={isRTL} />
      </View>
    </View>
  );
}

function Breath({ onContinue, isRTL }: { onContinue: () => void; isRTL: boolean }) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const w = t.firstRun.welcome;
  const run = useIntroDone();
  const reduceMotion = useReduceMotion();
  const breath = useRef(new Animated.Value(0)).current;
  const orbIn = useRef(new Animated.Value(0)).current;
  const endIn = useRef(new Animated.Value(0)).current;
  const [full, setFull] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (!run) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    // Each line is said to a screen reader as it arrives.
    CUES.forEach((c) => later(c.from, () => AccessibilityInfo.announceForAccessibility(w.lines[c.key].replace('\n', ' '))));
    BREATH_CUES.forEach((c) => {
      if (c.key !== 'hold') return;
      later(c.from, () => setFull(true));
      later(c.to!, () => setFull(false));
    });
    later(END_AT, () => setEnded(true));

    const fade = (v: Animated.Value, from: number) =>
      Animated.sequence([Animated.delay(from), Animated.timing(v, { toValue: 1, duration: FADE_IN, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE })]);
    const anims = [fade(orbIn, ORB_AT), fade(endIn, END_AT)];
    if (!reduceMotion) {
      anims.push(
        Animated.sequence([
          Animated.delay(BREATH_AT),
          ...FIRST_BREATH.map((p) =>
            Animated.timing(breath, { toValue: p.fill, duration: p.seconds * 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
          ),
        ]),
      );
    }
    const all = Animated.parallel(anims);
    all.start();
    return () => {
      timers.forEach(clearTimeout);
      all.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, reduceMotion]);

  return (
    <>
      <View style={styles.stage}>
        <Animated.View style={{ opacity: orbIn }}>
          <OrbStage tone="glow" breath={breath} full={full} />
        </Animated.View>
      </View>
      <View style={styles.words} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {CUES.map((c) => (
          <Line key={c.key} cue={c} run={run} still={reduceMotion}>
            <Text style={[isRTL ? styles.lineArabic : styles.line, { color: colors.text, fontFamily: fonts.display }]}>{w.lines[c.key]}</Text>
          </Line>
        ))}
      </View>
      <View style={styles.spacer} />
      <Animated.View style={[styles.action, { opacity: endIn }]} pointerEvents={ended ? 'auto' : 'none'}>
        <Button label={w.continue} onPress={onContinue} block disabled={!ended} />
      </Animated.View>
    </>
  );
}

/** One line of the story: fades up at its cue and away before the next. */
function Line({ cue, run, still, children }: { cue: Cue; run: boolean; still: boolean; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!run) return;
    const steps = [
      Animated.delay(cue.from),
      Animated.timing(v, { toValue: 1, duration: FADE_IN, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
    ];
    if (cue.to !== undefined) {
      steps.push(
        Animated.delay(Math.max(0, cue.to - FADE_OUT - cue.from - FADE_IN)),
        Animated.timing(v, { toValue: 0, duration: FADE_OUT, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }),
      );
    }
    const anim = Animated.sequence(steps);
    anim.start();
    return () => anim.stop();
  }, [run, cue, v]);
  const rise = still ? [] : [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }];
  return <Animated.View style={[styles.lineBox, { opacity: v, transform: rise }]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
  },
  top: {
    height: grid(7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switch: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  option: {
    paddingHorizontal: grid(1.5),
    height: grid(4),
    borderRadius: 999,
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 13,
  },
  notNow: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.85,
  },
  // The orb's centre on the mark's anchor (canvas "Round 3"): the top bar is grid(7) tall, the stage 250.
  stage: {
    marginTop: layout.markAnchor - grid(7) - 250 / 2,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  words: {
    height: grid(14),
    marginTop: grid(2),
    marginHorizontal: grid(2),
  },
  spacer: {
    flex: 1,
  },
  lineBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    fontSize: 28,
    lineHeight: 38,
    textAlign: 'center',
  },
  lineArabic: {
    fontSize: 30,
    lineHeight: 48,
    textAlign: 'center',
  },
  action: {
    paddingHorizontal: grid(2),
    paddingTop: grid(2),
    paddingBottom: grid(3),
  },
});
