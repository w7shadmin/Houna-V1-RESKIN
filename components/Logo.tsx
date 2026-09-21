import React from 'react';
import { SvgXml } from 'react-native-svg';
import {
  LOGO_GREEN_XML,
  LOGO_WHITE_XML,
  LOGO_SOURCE_WIDTH,
  LOGO_SOURCE_HEIGHT,
} from '@/constants/logoSvg';

type LogoSize = 'small' | 'medium' | 'large';
type LogoVariant = 'green' | 'white';

interface LogoProps {
  size?: LogoSize;
  /** 'green' for light backgrounds, 'white' for dark ones (splash, Tanafas). */
  variant?: LogoVariant;
}

const widthMap: Record<LogoSize, number> = {
  small: 64,
  medium: 110,
  large: 160,
};

const ASPECT_RATIO = LOGO_SOURCE_HEIGHT / LOGO_SOURCE_WIDTH;

export default function Logo({ size = 'medium', variant = 'green' }: LogoProps) {
  const width = widthMap[size];
  const height = width * ASPECT_RATIO;

  return (
    <SvgXml
      xml={variant === 'white' ? LOGO_WHITE_XML : LOGO_GREEN_XML}
      width={width}
      height={height}
    />
  );
}
