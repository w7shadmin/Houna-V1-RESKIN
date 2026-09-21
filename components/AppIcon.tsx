// PLACEHOLDER: Replace with real Houna app icon asset
// Square with rounded corners, suitable for app-store style previews.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, radius } from '@/constants/theme';

type IconSize = 'small' | 'medium' | 'large';

interface AppIconProps {
  size?: IconSize;
}

const sizeMap: Record<IconSize, { box: number; font: number; r: number }> = {
  small: { box: 48, font: 16, r: radius.md },
  medium: { box: 80, font: 28, r: radius.lg },
  large: { box: 120, font: 42, r: radius.xl },
};

export default function AppIcon({ size = 'medium' }: AppIconProps) {
  const { box, font, r } = sizeMap[size];

  return (
    <View
      style={[
        styles.box,
        {
          width: box,
          height: box,
          borderRadius: r,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: font }]}>هـُنا</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: palette.turquoise,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#ffffff',
    fontWeight: '700',
    includeFontPadding: false,
  },
});
