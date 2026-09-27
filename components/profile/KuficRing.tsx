import React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { KUFIC_RING } from '@/constants/kuficRing';
import { NATIVE, useCalmLoop } from '@/hooks/useCalmLoop';

/** One slow lap. */
const LAP_MS = 90000;

/**
 * Profile's Kufic ring (canvas "Phase 6 — Profile: the Kufic ring"): هُنا · نتنفّس معًا, "here · we
 * breathe together", round the avatar, turning slowly (still under Reduce Motion). Baked as one
 * outline (constants/kuficRing.ts) so the Arabic joins on every platform. Its children sit in the middle.
 */
export default function KuficRing({ color, children }: { color: string; children?: React.ReactNode }) {
  const lap = useCalmLoop((v) => Animated.loop(Animated.timing(v, { toValue: 1, duration: LAP_MS, easing: Easing.linear, useNativeDriver: NATIVE })));
  const rotate = lap.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.box}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={KUFIC_RING.box} height={KUFIC_RING.box}>
          <Path d={KUFIC_RING.d} fill={color} />
        </Svg>
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: KUFIC_RING.box,
    height: KUFIC_RING.box,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
