import React, { useId } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Mask, RadialGradient, Rect, Stop } from 'react-native-svg';
import HounaMark from '@/components/HounaMark';
import { HALO_BOX } from '@/components/starfield/MarkHalo';
import { useStarfield } from '@/contexts/StarfieldContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, crescentBowl } from '@/constants/theme';
import { stopProps } from '@/lib/svgStop';

/** The mark resting in the cup: its size, and how far below the box's centre it sits. */
export const BOWL_MARK = 32;
export const BOWL_MARK_DROP = 22;
/** The glow round the cup. */
const GLOW = 280;

interface CrescentBowlProps {
  /** The cup's opacity (the mark stays): it fades with Home's chrome as the starfield opens. */
  cupOpacity?: Animated.Value | Animated.AnimatedInterpolation<number>;
}

/**
 * Night's Home body in "Sun & moon" (canvas "Phase 3 — Night: the crescent bowl"): a crescent
 * cup lit like dawn, and the Houna mark resting in its hollow, floating up a little on Home's
 * 5s breath as the cup's glow swells. Tapping it, the cup fades and the mark lifts out to
 * become the starfield's moon. Drawn in the mark's 190px box, so it takes the mark's place.
 */
export default function CrescentBowl({ cupOpacity }: CrescentBowlProps) {
  const { colors } = useTheme();
  const { breath } = useStarfield()!.clock;
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const glowOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const glowScale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.06] });
  const float = breath.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  return (
    <View style={styles.box} pointerEvents="none">
      <Animated.View style={[styles.cupLayer, cupOpacity !== undefined && { opacity: cupOpacity }]}>
        <Animated.View style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}>
          <Svg width={GLOW} height={GLOW}>
            <Defs>
              <RadialGradient id={`bowlGlow${id}`} cx="50%" cy="60%" r="50%">
                <Stop offset={0.3} {...stopProps(alpha(crescentBowl.glow, 0.3))} />
                <Stop offset={0.62} {...stopProps(alpha(crescentBowl.glow, 0.12))} />
                <Stop offset={1} {...stopProps(alpha(crescentBowl.glow, 0))} />
              </RadialGradient>
            </Defs>
            <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill={`url(#bowlGlow${id})`} />
          </Svg>
        </Animated.View>
        {/* The canvas's 240px drawing in the 190px box: a disc less a larger one above it. */}
        <Svg width={HALO_BOX} height={HALO_BOX} viewBox="0 0 240 240">
          <Defs>
            <RadialGradient id={`bowl${id}`} cx="50%" cy="72%" r="60%">
              {crescentBowl.stops.map(([c, o]) => (
                <Stop key={o} offset={o} {...stopProps(c)} />
              ))}
            </RadialGradient>
            <Mask id={`cup${id}`}>
              <Rect x={0} y={0} width={240} height={240} fill="#FFFFFF" />
              <Circle cx={120} cy={58} r={118} fill="#000000" />
            </Mask>
          </Defs>
          <Circle cx={120} cy={120} r={112} fill={`url(#bowl${id})`} mask={`url(#cup${id})`} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.mark, { transform: [{ translateY: float }] }]}>
        <HounaMark size={BOWL_MARK} color={colors.primary} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: HALO_BOX,
    height: HALO_BOX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
  },
  mark: {
    position: 'absolute',
    top: HALO_BOX / 2 + BOWL_MARK_DROP - BOWL_MARK / 2,
    width: BOWL_MARK,
    height: BOWL_MARK,
  },
});
