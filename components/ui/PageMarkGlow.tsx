import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, FeGaussianBlur, Filter, G } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { HounaMarkShape } from '@/components/HounaMark';

/** The mark's width, and the canvas round it that the blur spreads into. */
const MARK = 300;
const BOX = 420;
/** The mark's frame (HounaMark's viewBox, 20.6 units square from 17, 5.4), widened to the box. */
const UNIT = 20.6 / MARK;
const PAD = ((BOX - MARK) / 2) * UNIT;
const VIEWBOX = `${17 - PAD} ${5.4 - PAD} ${BOX * UNIT} ${BOX * UNIT}`;
/** The blur: about 10px, in the mark's units (at 22 the shape was lost, only a cloud). */
const BLUR = 10 * UNIT;

/**
 * The mark as a soft glow of the glow colour behind a plain page's header (Design studies "E4"),
 * with the mark itself faintly over it so the shape reads (a cloud alone went unseen), so pages without art of their own (the Directory, Events) still
 * carry Houna. Fixed behind the content, never scrolling, and never in the way of touches.
 */
export default function PageMarkGlow() {
  const { colors, isNight } = useTheme();
  return (
    <View pointerEvents="none" style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* Solid fills, each layer faded as a whole: the mark's ring and figure overlap at the top,
          and a translucent fill doubled up there, drawing the top thicker than the rest. */}
      <View style={[styles.layer, { opacity: isNight ? 0.2 : 0.24 }]} needsOffscreenAlphaCompositing>
        <Svg width={BOX} height={BOX} viewBox={VIEWBOX}>
          <Defs>
            <Filter id="pageMarkGlow" x="-30%" y="-30%" width="160%" height="160%">
              <FeGaussianBlur stdDeviation={BLUR} />
            </Filter>
          </Defs>
          <G filter="url(#pageMarkGlow)">
            <HounaMarkShape fill={colors.tones.glow.hue} />
          </G>
        </Svg>
      </View>
      <View style={[styles.layer, { opacity: isNight ? 0.12 : 0.16 }]} needsOffscreenAlphaCompositing>
        <Svg width={BOX} height={BOX} viewBox={VIEWBOX}>
          <HounaMarkShape fill={colors.tones.glow.hue} />
        </Svg>
      </View>
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
    height: BOX,
  },
  layer: {
    position: 'absolute',
    width: BOX,
    height: BOX,
  },
});
