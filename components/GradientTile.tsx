import React from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, radius } from '@/constants/theme';
import { mix, hexToRgba } from '@/lib/color';

interface GradientTileProps {
  color: string;
  size?: number;
  borderRadius?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}

/**
 * The raised, glossy tile background shared by IconTile3D (Lucide icons)
 * and the Lottie topic tiles — a lighter-to-base-to-darker diagonal
 * gradient plus a light top/start edge and dark bottom/end edge to fake a
 * bevel, instead of a flat solid or tinted fill.
 */
export default function GradientTile({ color, size = 52, borderRadius = radius.lg, style, children }: GradientTileProps) {
  return (
    <LinearGradient
      colors={[mix(color, palette.white, 0.55), color, mix(color, palette.black, 0.12)]}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius,
          borderTopColor: hexToRgba(palette.white, 0.75),
          borderStartColor: hexToRgba(palette.white, 0.4),
          borderBottomColor: hexToRgba(palette.black, 0.35),
          borderEndColor: hexToRgba(palette.black, 0.2),
          shadowColor: color,
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderStartWidth: 1,
    borderBottomWidth: 3,
    borderEndWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
});
