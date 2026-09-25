// Must be the first import — polyfills the global `URL`, required by
// @supabase/supabase-js and lib/hounaApi.ts's URL parsing on native.
import 'react-native-url-polyfill/auto';

import { useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
} from '@expo-google-fonts/figtree';
import { Marcellus_400Regular } from '@expo-google-fonts/marcellus';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import * as SplashScreen from 'expo-splash-screen';

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import SplashIntro from '@/components/SplashIntro';

SplashScreen.preventAutoHideAsync();

// Must run before anything renders — RN reads this once at native init.
I18nManager.allowRTL(true);

function InnerLayout() {
  const { colors, isNight } = useTheme();
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
        <Stack.Screen
          name="check-in"
          options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="crisis" />
        <Stack.Screen name="about" />
        <Stack.Screen name="get-involved" />
        <Stack.Screen name="contact" />
        <Stack.Screen name="account" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isNight ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [introDone, setIntroDone] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Marcellus_400Regular,
    DMMono_400Regular,
    DMMono_500Medium,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    Amiri_400Regular,
    Amiri_700Bold,
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
      <AuthProvider>
        <ThemeProvider>
          <InnerLayout />
          {!introDone && <SplashIntro onFinish={() => setIntroDone(true)} />}
        </ThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
