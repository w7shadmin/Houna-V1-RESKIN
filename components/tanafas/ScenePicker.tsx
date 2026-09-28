import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import { MEDITATION_SCENES, SCENE_ORBS, type SceneId } from '@/components/meditation/scenes';
import Button from '@/components/ui/Button';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { stopProps } from '@/lib/svgStop';

/** The window: one large mihrab arch. */
const W = 236;
const H = 300;
/** The round windows beneath, one per scene. */
const ORB = 56;

/** A mihrab arch w×h: two arcs of radius 0.7w meeting at a point, on straight sides. */
function archPath(w: number, h: number) {
  const r = 0.7 * w;
  const rise = Math.sqrt(r * r - (w / 2 - r) ** 2);
  return `M0 ${h} L0 ${rise} A${r} ${r} 0 0 1 ${w / 2} 0 A${r} ${r} 0 0 1 ${w} ${rise} L${w} ${h} Z`;
}
const ARCH = archPath(W, H);

/**
 * Choosing a scene, as one window (canvas "Round 2 — the scene sheet", option A): the chosen scene
 * large in an arch, in its own light, its name and line on it and the bars of its sound; the four
 * scenes as round windows beneath to switch between. The button begins it ("Begin by the fire"),
 * so choosing and starting are one step.
 */
export default function ScenePicker({ value, onBegin }: { value: number; onBegin: (index: number) => void }) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const h = t.discover.hub;
  const names = t.tanafas.meditation.scenes;
  const [picked, setPicked] = useState(value);
  useEffect(() => setPicked(value), [value]);
  const scene = MEDITATION_SCENES[picked];
  const id = scene.id as SceneId;
  const orb = SCENE_ORBS[id];

  return (
    <View style={styles.wrap}>
      <View style={styles.window} accessible accessibilityLabel={`${names[id].name}. ${h.sceneLines[id]}`}>
        <View pointerEvents="none" style={[styles.light, { boxShadow: `0 0 60px 10px ${orb.glow}` }]} />
        {/* Keyed on the scene, so a new one fades in rather than swapping. */}
        <FadeIn key={id}>
          <Svg width={W} height={H}>
            <Defs>
              <ClipPath id="sceneArch">
                <Path d={ARCH} />
              </ClipPath>
              <LinearGradient id="sceneFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" {...stopProps(orb.hi)} />
                <Stop offset="0.5" {...stopProps(orb.c)} />
                <Stop offset="1" {...stopProps(orb.lo)} />
              </LinearGradient>
              <LinearGradient id="sceneShade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0.55" {...stopProps('#000000', 0)} />
                <Stop offset="1" {...stopProps('#000000', 0.5)} />
              </LinearGradient>
            </Defs>
            {scene.thumbnail ? (
              <SvgImage href={scene.thumbnail} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" clipPath="url(#sceneArch)" />
            ) : (
              <Rect x={0} y={0} width={W} height={H} fill="url(#sceneFill)" clipPath="url(#sceneArch)" />
            )}
            <Rect x={0} y={0} width={W} height={H} fill="url(#sceneShade)" clipPath="url(#sceneArch)" />
          </Svg>
          <View style={styles.caption} pointerEvents="none">
            <Text style={[styles.sceneName, { fontFamily: fonts.display }]}>{names[id].name}</Text>
            <Text style={[styles.sceneLine, { fontFamily: fonts.regular }]}>{h.sceneLines[id]}</Text>
          </View>
          <View style={styles.bars}>
            <Bars />
          </View>
        </FadeIn>
      </View>

      <View style={styles.orbs} accessibilityRole="radiogroup">
        {MEDITATION_SCENES.map((s, k) => {
          const selected = k === picked;
          const o = SCENE_ORBS[s.id as SceneId];
          return (
            <Pressable
              key={s.id}
              accessibilityRole="radio"
              aria-checked={selected}
              accessibilityLabel={names[s.id].name}
              onPress={() => setPicked(k)}
              style={({ pressed }) => [styles.orbCell, pressed && styles.pressed]}
            >
              <View
                style={[
                  styles.orb,
                  selected
                    ? { borderColor: colors.text, boxShadow: `0 0 18px ${o.glow}` }
                    : { borderColor: alpha(colors.text, 0.12) },
                ]}
              >
                {s.thumbnail ? (
                  <Image source={s.thumbnail} style={styles.orbImage} accessibilityIgnoresInvertColors />
                ) : (
                  <View style={[styles.orbImage, { backgroundColor: o.c }]} />
                )}
              </View>
              <Text style={[styles.orbName, { color: selected ? colors.text : colors.textSecondary, fontFamily: selected ? fonts.semiBold : fonts.regular }]}>
                {names[s.id].name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button block label={h.beginWith[id]} onPress={() => onBegin(picked)} />
    </View>
  );
}

/** Fades its child in as it mounts: key it on what it shows. */
function FadeIn({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(v, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE });
    anim.start();
    return () => anim.stop();
  }, [v]);
  return <Animated.View style={{ opacity: v }}>{children}</Animated.View>;
}

/** Four little bars rising and falling: the scene's sound. Still under Reduce Motion. */
function Bars() {
  const reduceMotion = useReduceMotion();
  const vs = useRef([0, 1, 2, 3].map(() => new Animated.Value(0.6))).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loops = vs.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: 400 + i * 90, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
          Animated.timing(v, { toValue: 0.35, duration: 400 + i * 90, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [vs, reduceMotion]);
  return (
    <View pointerEvents="none" style={styles.barRow}>
      {vs.map((v, i) => (
        <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: v }] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 24,
  },
  window: {
    alignSelf: 'center',
    width: W,
    height: H,
    marginTop: 8,
  },
  light: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 48,
    bottom: 24,
    borderRadius: W / 2,
  },
  caption: {
    position: 'absolute',
    start: 20,
    bottom: 16,
    gap: 4,
  },
  sceneName: {
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
  },
  sceneLine: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13.5,
  },
  bars: {
    position: 'absolute',
    end: 20,
    bottom: 24,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 18,
  },
  bar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  orbs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  orbCell: {
    width: 72,
    alignItems: 'center',
    gap: 8,
  },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    borderWidth: 2,
    overflow: 'hidden',
  },
  orbImage: {
    width: '100%',
    height: '100%',
  },
  orbName: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
});
