import React from 'react';
import { type ViewStyle } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import { palette } from '@/constants/theme';
import GradientTile from './GradientTile';

interface IconTile3DProps {
  icon: LucideIcon;
  color: string;
  size?: number;
  iconSize?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/** A GradientTile wrapping a single Lucide icon, forced white for contrast. */
export default function IconTile3D({ icon: Icon, color, size = 52, iconSize, borderRadius, style }: IconTile3DProps) {
  const resolvedIconSize = iconSize ?? Math.round(size * 0.46);
  return (
    <GradientTile color={color} size={size} borderRadius={borderRadius} style={style}>
      <Icon size={resolvedIconSize} color={palette.white} strokeWidth={1.8} />
    </GradientTile>
  );
}
