import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';

const LETTER_MS = 40;
const WORD_MS = 260;
const RISE = 8;

interface ArrivingTextProps {
  children: string;
  /** Arabic arrives word by word (its letters join); Latin letter by letter. */
  isRTL: boolean;
  style: StyleProp<TextStyle>;
  /** Centre the lines (default) or start them at the reading edge. */
  align?: 'center' | 'start';
  /** Milliseconds before the first letter or word. */
  delay?: number;
}

/**
 * Words that arrive (canvas "Motion — Home's line arrives"): each letter (Latin) or word
 * (Arabic, whose letters must stay joined) fades up in turn, and again whenever the text
 * changes. Screen readers get the whole line at once; Reduce Motion shows it still.
 */
export default function ArrivingText({ children, isRTL, style, align = 'center', delay = 150 }: ArrivingTextProps) {
  const reduceMotion = useReduceMotion();
  const words = useMemo(() => children.split(' ').filter(Boolean), [children]);
  const count = isRTL ? words.length : words.reduce((n, w) => n + [...w].length, 0);
  const values = useRef<Animated.Value[]>([]);
  if (values.current.length !== count) values.current = Array.from({ length: count }, () => new Animated.Value(0));

  useEffect(() => {
    const vs = values.current;
    if (reduceMotion) {
      vs.forEach((v) => v.setValue(1));
      return;
    }
    vs.forEach((v) => v.setValue(0));
    const step = isRTL ? WORD_MS : LETTER_MS;
    const anim = Animated.stagger(
      step,
      vs.map((v) => Animated.timing(v, { toValue: 1, duration: isRTL ? 900 : 700, useNativeDriver: NATIVE })),
    );
    const id = setTimeout(() => anim.start(), delay);
    return () => {
      clearTimeout(id);
      anim.stop();
    };
  }, [children, isRTL, reduceMotion, delay, count]);

  if (reduceMotion) {
    return <Text style={[style, align === 'center' && styles.centerText]}>{children}</Text>;
  }

  let k = 0;
  const unit = (text: string) => {
    const v = values.current[k++];
    return (
      <Animated.Text
        key={k}
        style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [RISE, 0] }) }] }]}
      >
        {text}
      </Animated.Text>
    );
  };

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={children}
      style={[styles.lines, align === 'center' ? styles.center : styles.start]}
    >
      {words.map((w, i) => (
        <View key={`${i}-${w}`} style={styles.word} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {isRTL ? unit(w) : [...w].map((ch) => unit(ch))}
          {i < words.length - 1 && <Text style={style}> </Text>}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lines: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  center: {
    justifyContent: 'center',
  },
  start: {
    justifyContent: 'flex-start',
  },
  word: {
    flexDirection: 'row',
  },
  centerText: {
    textAlign: 'center',
  },
});
