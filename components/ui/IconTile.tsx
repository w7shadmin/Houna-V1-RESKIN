import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/constants/theme';

export type IconTileTone = 'glow' | 'dawn' | 'dusk' | 'bloom';

interface IconTileProps {
  /** Receives the tone's icon colour. */
  renderIcon: (color: string, iconSize: number) => React.ReactNode;
  tone?: IconTileTone;
  /** Canvas sizes: 52 (standalone), 48 (test cards), 46 (inside a row card). */
  size?: 52 | 48 | 46;
  style?: StyleProp<ViewStyle>;
}

/**
 * The one icon-tile pattern for Nightlight/Daylight: a 12% tint of the
 * tone with a slightly stronger border, icon in the tone colour (deepened
 * on Day for contrast).
 */
export default function IconTile({ renderIcon, tone = 'glow', size = 52, style }: IconTileProps) {
  const { colors } = useTheme();
  const t = colors.tones[tone];
  const iconSize = size >= 52 ? 24 : 22;

  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size >= 52 ? radius.tile : radius.tileSm,
          backgroundColor: t.bg,
          borderColor: t.border,
        },
        style,
      ]}
    >
      {renderIcon(t.fg, iconSize)}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexShrink: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
