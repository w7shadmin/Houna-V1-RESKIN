import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { radius } from '@/constants/theme';

interface FlatIconTileProps {
  icon: LucideIcon;
  /** Full-saturation icon color — an `OLD_MVP_ICON_HEX` value. */
  color: string;
  /** Pale tile background paired with `color` — the matching `OLD_MVP_ICON_HEX_PALE` value. */
  bg: string;
  size?: number;
  iconSize?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Flat pale-background-plus-saturated-icon tile, pixel-matched to the
 * reference app's own icon treatment (see `OLD_MVP_ICON_HEX`/`_PALE` in
 * lib/color.ts) — as opposed to `IconTile3D`'s glossy bevel-plus-white-icon
 * one. Diluting a single saturated hue toward white at render time (as
 * `tileTint` does for `IconTile3D`) collapses close hues — e.g. turquoise,
 * teal-dark, light-cyan — into near-identical pale tones with no icon-color
 * left to tell them apart; using the reference's own fixed pale shade
 * avoids that.
 */
export default function FlatIconTile({ icon: Icon, color, bg, size = 56, iconSize, borderRadius: br, style }: FlatIconTileProps) {
  const resolvedIconSize = iconSize ?? Math.round(size * 0.46);
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: br ?? radius.lg, backgroundColor: bg }, style]}>
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
