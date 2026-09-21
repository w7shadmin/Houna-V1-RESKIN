import React from 'react';
import DetailScreen from '@/components/DetailScreen';
import ComingSoon from '@/components/ComingSoon';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ContactScreen() {
  const { t } = useLanguage();
  return (
    <DetailScreen title={t.more.contact}>
      <ComingSoon />
    </DetailScreen>
  );
}
