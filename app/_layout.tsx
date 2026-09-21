// Must be the first import — polyfills the global `URL`, required by
// @supabase/supabase-js and lib/hounaApi.ts's URL parsing on native.
import 'react-native-url-polyfill/auto';

import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  ScheherazadeNew_400Regular,
  ScheherazadeNew_500Medium,
  ScheherazadeNew_600SemiBold,
  ScheherazadeNew_700Bold,
} from '@expo-google-fonts/scheherazade-new';
import * as SplashScreen from 'expo-splash-screen';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { colors } from '@/constants/theme';
import SplashIntro from '@/components/SplashIntro';

SplashScreen.preventAutoHideAsync();

// Must run before anything renders — RN reads this once at native init.
I18nManager.allowRTL(true);

function InnerLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="entry" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="tanafas"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="about" />
        <Stack.Screen name="get-involved" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* Default status bar for light backgrounds. Tanafas overrides this
          locally (dark background) with its own <StatusBar>. */}
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [introDone, setIntroDone] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    ScheherazadeNew_400Regular,
    ScheherazadeNew_500Medium,
    ScheherazadeNew_600SemiBold,
    ScheherazadeNew_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <LanguageProvider>
      <InnerLayout />
      {!introDone && <SplashIntro onFinish={() => setIntroDone(true)} />}
    </LanguageProvider>
  );
}
