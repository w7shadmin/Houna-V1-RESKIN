import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { alpha, nightPalette } from '@/constants/theme';
import { NATIVE } from '@/hooks/useCalmLoop';

interface Streak {
  key: number;
  x: number;
  y: number;
  angle: number;
  length: number;
  travel: number;
  duration: number;
}

/**
 * Now and then a shooting star: one at a time, every 3–9s at random, from
 * somewhere in the upper two-thirds of the sky, slanting 15–35° down to the
 * left or right, crossing ~220px in under a second with a fading tail.
 * Off while `active` is false (opening, closing, Reduce Motion).
 */
export default function ShootingStars({ width, height, active }: { width: number; height: number; active: boolean }) {
  const [streak, setStreak] = useState<Streak | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = useRef(0);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const schedule = () => {
      timer.current = setTimeout(() => {
        if (!alive) return;
        const rightward = Math.random() < 0.5;
        const slant = 15 + Math.random() * 20;
        const next: Streak = {
          key: ++count.current,
          x: width * (0.1 + Math.random() * 0.8),
          y: height * (0.05 + Math.random() * 0.6),
          angle: rightward ? slant : 180 - slant,
          length: 80 + Math.random() * 60,
          travel: 180 + Math.random() * 80,
          duration: 750 + Math.random() * 350,
        };
        setStreak(next);
        progress.setValue(0);
        Animated.timing(progress, { toValue: 1, duration: next.duration, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start(() => {
          if (alive) setStreak(null);
          if (alive) schedule();
        });
      }, 3000 + Math.random() * 6000);
    };
    schedule();
    return () => {
      alive = false;
      if (timer.current) clearTimeout(timer.current);
      progress.stopAnimation();
      setStreak(null);
    };
  }, [active, width, height, progress]);

  if (!streak) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.streak,
          {
            width: streak.length,
            left: streak.x - streak.length / 2,
            top: streak.y,
            opacity: progress.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
            // Along its own heading: rotate first, then travel.
            transform: [{ rotate: `${streak.angle}deg` }, { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, streak.travel] }) }],
          },
        ]}
      >
        {/* The tail fades behind the bright head, which leads. */}
        <LinearGradient
          colors={[alpha(nightPalette.moonlight, 0), alpha(nightPalette.moonlight, 0.9)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.tail}
        />
        <View style={styles.head} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tail then head along its heading: placed by left/right, which (unlike start/end or a row)
  // don't swap in Arabic, since the heading, not the layout, sets the way.
  streak: {
    position: 'absolute',
    height: 3,
  },
  tail: {
    position: 'absolute',
    left: 0,
    right: 2,
    top: 0.75,
    height: 1.5,
    borderRadius: 1,
  },
  head: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: nightPalette.moonlight,
    boxShadow: `0 0 6px ${nightPalette.moonlight}`,
  },
});
