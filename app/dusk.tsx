import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { duskScene } from '@/constants/theme';
import SunScene from '@/components/sunrise/SunScene';

/**
 * The Houna dusk (Dusk only, opened by tapping Home's mark): the light turns to
 * golden hour, and the mark glides down as the starfield's moon does, settling
 * lower, as a setting sun, and becoming a low amber sun (no rays) as the sky
 * deepens to violet dusk and the first faint stars come out.
 */
export default function DuskScreen() {
  const { t } = useLanguage();
  return <SunScene scene={duskScene} session="dusk" closeLabel={t.home.dusk.close} />;
}
