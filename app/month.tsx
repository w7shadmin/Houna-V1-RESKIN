import React, { useEffect, useRef, useState } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import { currentHijri } from '@/lib/hijri';
import GlassSheet from '@/components/ui/GlassSheet';
import MonthRing from '@/components/home/MonthRing';

/**
 * The month of moons, over Home as a glass sheet (a transparent modal, like the check-in):
 * opened from Home's Hijri date. Its title is this Hijri month and year. It sinks away on
 * a tap outside, the backdrop's close, or Back, then leaves.
 */
export default function MonthScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t, isRTL } = useLanguage();
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const { hijri } = currentHijri(new Date());
  const [visible, setVisible] = useState(true);
  // Back (or a gesture) waits for the sheet to sink first; the action it held is sent after.
  const pending = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const gone = useRef(false);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (gone.current) return;
        e.preventDefault();
        pending.current = e.data.action;
        setVisible(false);
      }),
    [navigation],
  );

  const leave = () => {
    gone.current = true;
    if (pending.current) navigation.dispatch(pending.current);
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  return (
    <GlassSheet
      visible={visible}
      onClose={() => setVisible(false)}
      onHidden={leave}
      eyebrow={t.home.month.eyebrow}
      title={`${t.home.hijri.months[hijri.month - 1]} ${num(hijri.year)}`}
      closeLabel={t.home.month.close}
    >
      <MonthRing />
    </GlassSheet>
  );
}
