import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SplashIntro from '@/components/SplashIntro';
import SplashIntroDoodle from '@/components/SplashIntroDoodle';
import SplashIntroBloom from '@/components/SplashIntroBloom';
import BodySplash from '@/components/splash/BodySplash';

/**
 * TEMPORARY, while the client picks a splash: every animated splash in the app, one per cold
 * start, in turn, each labelled "Variant N" so a tester can say which they liked. Once one is
 * chosen, render it directly in app/_layout.tsx, and delete this file, the others and the
 * `houna-splash-next` key. The label is for testers, not the public, so it isn't translated.
 */
const VARIANTS = [
  { label: 'Variant 1 · wordmark', Splash: SplashIntro },
  { label: 'Variant 2 · doodle', Splash: SplashIntroDoodle },
  { label: 'Variant 3 · bloom', Splash: SplashIntroBloom },
  { label: 'Variant 4 · the theme’s body', Splash: BodySplash },
] as const;

const NEXT_KEY = 'houna-splash-next';

export default function SplashCycle({ onFinish }: { onFinish: () => void }) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(NEXT_KEY)
      .then((v) => {
        const i = Math.abs(parseInt(v ?? '0', 10) || 0) % VARIANTS.length;
        if (alive) setIndex(i);
        return AsyncStorage.setItem(NEXT_KEY, String((i + 1) % VARIANTS.length));
      })
      .catch(() => alive && setIndex(0));
    return () => {
      alive = false;
    };
  }, []);

  // The native splash stays up for the moment the choice takes to read.
  if (index === null) return null;
  const { label, Splash } = VARIANTS[index];
  return (
    <>
      <Splash onFinish={onFinish} />
      <View style={[styles.labelWrap, { bottom: insets.bottom + 24 }]} pointerEvents="none">
        <Text style={styles.label}>{label}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  labelWrap: {
    position: 'absolute',
    start: 0,
    end: 0,
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    color: '#8A93A8',
    backgroundColor: 'rgba(11,16,38,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
