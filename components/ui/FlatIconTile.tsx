import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { radius } from '@/constants/theme';
import GradientTile from '@/components/GradientTile';

interface FlatIconTileProps {
  icon: LucideIcon;
  /** Full-saturation icon color — an `OLD_MVP_ICON_HEX` value. */
  color: string;
  /** Pale tile background paired with `color` — the matching `OLD_MVP_ICON_HEX_PALE` value. */
  bg: string;
  size?: number;
  iconSize?: number;
  borderRadius?: number;
  /** Glossy bevel-gradient tile (reusing GradientTile's recipe on the pale `bg`) instead of a flat fill. */
  bevel?: boolean;
  style?: ViewStyle;
}

/**
 * Pale-background-plus-saturated-icon tile, pixel-matched to the reference
 * app's own icon treatment (see `OLD_MVP_ICON_HEX`/`_PALE` in lib/color.ts)
 * — as opposed to `IconTile3D`'s glossy bevel-plus-white-icon one, which
 * diluted the tile color 60% toward white at render time (`tileTint`) and
 * forced a white icon. That collapsed close hues — e.g. turquoise,
 * teal-dark, light-cyan — into near-identical pale tones with no
 * icon-color left to tell them apart.
 *
 * `bevel` adds the glossy 3D look back in, but on the pale `bg` rather
 * than the saturated `color` — it feeds `bg` into `GradientTile`'s
 * existing lighter-to-darker diagonal recipe and keeps the icon in its
 * saturated color (not forced white), so the fix above still holds: the
 * tile is dimensional, but distinguishable by hue at a glance.
 */
export default function FlatIconTile({ icon: Icon, color, bg, size = 56, iconSize, borderRadius: br, bevel, style }: FlatIconTileProps) {
  const resolvedIconSize = iconSize ?? Math.round(size * 0.46);
  const resolvedRadius = br ?? radius.lg;

  if (bevel) {
    return (
      <GradientTile color={bg} size={size} borderRadius={resolvedRadius} style={style}>
        <Icon size={resolvedIconSize} color={color} strokeWidth={2} />
      </GradientTile>
    );
  }

  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: resolvedRadius, backgroundColor: bg }, style]}>
      <Icon size={resolvedIconSize} color={color} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
