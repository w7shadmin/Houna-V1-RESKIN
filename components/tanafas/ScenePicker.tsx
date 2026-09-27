import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MEDITATION_SCENES, SCENE_ORBS, type SceneId } from '@/components/meditation/scenes';
import Button from '@/components/ui/Button';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { stopProps } from '@/lib/svgStop';

const W = 118;
const H = 168;

/** A mihrab arch w×h: two arcs of radius 0.7w meeting at a point, on straight sides. */
function archPath(w: number, h: number) {
  const r = 0.7 * w;
  const rise = Math.sqrt(r * r - (w / 2 - r) ** 2);
  return `M0 ${h} L0 ${rise} A${r} ${r} 0 0 1 ${w / 2} 0 A${r} ${r} 0 0 1 ${w} ${rise} L${w} ${h} Z`;
}
const ARCH = archPath(W, H);

/**
 * The app's scenes in mihrab arches, two by two (canvas "Players — choosing a scene"): the
 * chosen one outlined, with little bars moving in it, and a button to take it.
 */
export default function ScenePicker({ value, onChoose }: { value: number; onChoose: (index: number) => void }) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const h = t.discover.hub;
  const names = t.tanafas.meditation.scenes;
  const [picked, setPicked] = useState(value);
  useEffect(() => setPicked(value), [value]);

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {MEDITATION_SCENES.map((scene, k) => {
          const selected = k === picked;
          const orb = SCENE_ORBS[scene.id as SceneId];
          return (
            <Pressable
              key={scene.id}
              accessibilityRole="radio"
              aria-checked={selected}
              accessibilityLabel={names[scene.id].name}
              onPress={() => setPicked(k)}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            >
              <View style={styles.archBox}>
                <Svg width={W + 8} height={H + 8} viewBox={`-4 -4 ${W + 8} ${H + 8}`}>
                  <Defs>
                    <ClipPath id={`arch-${scene.id}`}>
                      <Path d={ARCH} />
                    </ClipPath>
                    <LinearGradient id={`archFill-${scene.id}`} x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" {...stopProps(orb.hi)} />
                      <Stop offset="0.5" {...stopProps(orb.c)} />
                      <Stop offset="1" {...stopProps(orb.lo)} />
                    </LinearGradient>
                  </Defs>
                  {scene.thumbnail ? (
                    <SvgImage href={scene.thumbnail} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid slice" clipPath={`url(#arch-${scene.id})`} />
                  ) : (
                    <Rect x={0} y={0} width={W} height={H} fill={`url(#archFill-${scene.id})`} clipPath={`url(#arch-${scene.id})`} />
                  )}
                  {selected && <Path d={ARCH} fill="none" stroke={colors.text} strokeWidth={2.5} />}
                </Svg>
                {selected && <Bars />}
              </View>
              <Text style={[styles.name, { color: colors.text, fontFamily: selected ? fonts.semiBold : fonts.regular }]}>{names[scene.id].name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Button block label={h.choose.replace('{name}', names[MEDITATION_SCENES[picked].id].name)} onPress={() => onChoose(picked)} />
    </View>
  );
}

/** Four little bars rising and falling in the chosen arch. Still under Reduce Motion. */
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
    <View pointerEvents="none" style={styles.bars}>
      {vs.map((v, i) => (
        <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: v }] }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: 32,
    rowGap: 16,
  },
  cell: {
    alignItems: 'center',
    gap: 8,
  },
  archBox: {
    width: W + 8,
    height: H + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 22,
  },
  bar: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  name: {
    fontSize: 15,
  },
  pressed: {
    opacity: 0.85,
  },
});
