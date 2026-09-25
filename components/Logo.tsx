import React, { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import {
  LOGO_GREEN_XML,
  LOGO_WHITE_XML,
  LOGO_SOURCE_WIDTH,
  LOGO_SOURCE_HEIGHT,
  tintedLogoXml,
} from '@/constants/logoSvg';
import { useTheme } from '@/contexts/ThemeContext';

type LogoSize = 'small' | 'medium' | 'large';
/**
 * 'themed' — the Nightlight/Daylight wordmark, recoloured from the active
 * theme's `logo` tokens. 'green' / 'white' — the original fixed artwork.
 */
type LogoVariant = 'themed' | 'green' | 'white';

interface LogoProps {
  size?: LogoSize;
  /** Explicit width in px; overrides `size`. */
  width?: number;
  variant?: LogoVariant;
}

const widthMap: Record<LogoSize, number> = {
  small: 64,
  medium: 110,
  large: 160,
};

const ASPECT_RATIO = LOGO_SOURCE_HEIGHT / LOGO_SOURCE_WIDTH;

export default function Logo({ size = 'medium', width: explicitWidth, variant = 'green' }: LogoProps) {
  const { colors } = useTheme();
  const width = explicitWidth ?? widthMap[size];
  const height = width * ASPECT_RATIO;

  const xml = useMemo(() => {
    if (variant === 'white') return LOGO_WHITE_XML;
    if (variant === 'green') return LOGO_GREEN_XML;
    return tintedLogoXml(colors.logo.primary, colors.logo.secondary, colors.background);
  }, [variant, colors]);

  return <SvgXml xml={xml} width={width} height={height} />;
}
