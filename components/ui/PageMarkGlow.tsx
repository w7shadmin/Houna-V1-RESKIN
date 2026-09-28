import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, FeGaussianBlur, Filter, G } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import { HounaMarkShape } from '@/components/HounaMark';

/** The mark's width, and the canvas round it that the blur spreads into. */
const MARK = 300;
const BOX = 420;
/** The mark's frame (HounaMark's viewBox, 20.6 units square from 17, 5.4), widened to the box. */
const UNIT = 20.6 / MARK;
const PAD = ((BOX - MARK) / 2) * UNIT;
const VIEWBOX = `${17 - PAD} ${5.4 - PAD} ${BOX * UNIT} ${BOX * UNIT}`;
/** The blur: about 22px, in the mark's units. */
const BLUR = 22 * UNIT;

/**
 * The mark as a soft cloud of the glow colour behind a plain page's header (Design studies "E4"):
 * no outline, felt more than seen, so pages without art of their own (the Directory, Events) still
 * carry Houna. Fixed behind the content, never scrolling, and never in the way of touches.
 */
export default function PageMarkGlow() {
  const { colors, isNight } = useTheme();
  return (
    <View pointerEvents="none" style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={BOX} height={BOX} viewBox={VIEWBOX}>
        <Defs>
          <Filter id="pageMarkGlow" x="-30%" y="-30%" width="160%" height="160%">
            <FeGaussianBlur stdDeviation={BLUR} />
          </Filter>
        </Defs>
        <G filter="url(#pageMarkGlow)">
          <HounaMarkShape fill={alpha(colors.tones.glow.hue, isNight ? 0.35 : 0.4)} />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  // Centred across the screen, its middle 150 below the top (behind the header), as the study drew it.
  wrap: {
    position: 'absolute',
    top: 150 - BOX / 2,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
