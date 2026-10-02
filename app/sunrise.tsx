import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { sunriseScene } from '@/constants/theme';
import SunScene from '@/components/sunrise/SunScene';

/**
 * The Houna sunrise (Sunrise only, opened by tapping Home's mark): the sky deepens
 * to pre-dawn, and the mark glides to the middle as the starfield's moon does,
 * becoming a small pale-gold sun with short rays as the sky warms to morning.
 */
export default function SunriseScreen() {
  const { t } = useLanguage();
  return <SunScene scene={sunriseScene} session="sunrise" closeLabel={t.home.sunrise.close} />;
}
