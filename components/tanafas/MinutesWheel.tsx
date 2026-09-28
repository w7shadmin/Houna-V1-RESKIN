import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MEDITATION_MINUTES } from '@/constants/breathPatterns';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import Button from '@/components/ui/Button';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';

const ROW = 70;
const VIEW = ROW * 4;

type Minutes = (typeof MEDITATION_MINUTES)[number];

/**
 * The meditation lengths on a wheel (canvas "Players — choosing a length"): the chosen one
 * large in the middle with its unit, its neighbours smaller and fainter above and below. Tap a
 * length to bring it to the middle; Done takes it.
 */
export default function MinutesWheel({ value, onDone }: { value: Minutes; onDone: (m: Minutes) => void }) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const h = t.discover.hub;
  const reduceMotion = useReduceMotion();
  const [picked, setPicked] = useState(Math.max(0, MEDITATION_MINUTES.indexOf(value)));
  useEffect(() => setPicked(Math.max(0, MEDITATION_MINUTES.indexOf(value))), [value]);

  const offset = (i: number) => (VIEW - ROW) / 2 - i * ROW;
  const y = useRef(new Animated.Value(offset(picked))).current;
  useEffect(() => {
    Animated.timing(y, { toValue: offset(picked), duration: reduceMotion ? 0 : 500, easing: Easing.bezier(0.25, 1.1, 0.4, 1), useNativeDriver: NATIVE }).start();
  }, [picked, y, reduceMotion]);

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const unit = (m: Minutes) => (m === null ? h.noLimit : arabicPlural(m, t.tanafas.meditation.player.min).replace('{n}', '').trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.window} accessibilityRole="radiogroup">
        <Animated.View style={{ transform: [{ translateY: y }] }}>
          {MEDITATION_MINUTES.map((m, i) => {
            const d = Math.abs(i - picked);
            return (
              <Pressable
                key={String(m)}
                accessibilityRole="radio"
                aria-checked={d === 0}
                accessibilityLabel={m === null ? h.noLimit : `${num(m)} ${unit(m)}`}
                onPress={() => setPicked(i)}
                style={[styles.row, { opacity: d === 0 ? 1 : d === 1 ? 0.45 : 0.2 }]}
              >
                <Text style={[styles.number, d === 0 && styles.numberOn, { color: colors.text, fontFamily: isRTL ? fonts.display : fonts.numeral }]}>
                  {m === null ? '∞' : num(m)}
                </Text>
                {d === 0 && <Text style={[styles.unit, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{unit(m)}</Text>}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>
      <Button block label={h.done} onPress={() => onDone(MEDITATION_MINUTES[picked])} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  window: {
    height: VIEW,
    overflow: 'hidden',
  },
  row: {
    height: ROW,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  number: {
    fontSize: 40,
  },
  numberOn: {
    fontSize: 52,
  },
  unit: {
    fontSize: 20,
  },
});
