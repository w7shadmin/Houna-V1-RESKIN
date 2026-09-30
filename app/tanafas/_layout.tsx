import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider, useTheme as useNavigationTheme } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { nightPalette } from '@/constants/theme';

/** Internal stack for everything opened from the raised Tanafas button — the
 * whole group is presented as one modal (see app/_layout.tsx), and this
 * navigator handles hub → journal, meditation and tests within it. */
export default function TanafasLayout() {
  const { colors } = useTheme();
  const navTheme = useNavigationTheme();
  // No default ground under the screens (the web paints one), so Home shows as the hub is dragged
  // down; every screen here sets its own (screenOptions.contentStyle, or the hub itself).
  return (
    <ThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: 'transparent' } }}>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      {/* The hub paints its own ground, so Home shows as it's dragged down (app/_layout.tsx). */}
      <Stack.Screen name="index" options={{ contentStyle: { backgroundColor: 'transparent' } }} />
      <Stack.Screen name="meditation/index" />
      <Stack.Screen
        name="meditation/[scene]"
        options={{ animation: 'fade', contentStyle: { backgroundColor: nightPalette.midnight } }}
      />
      <Stack.Screen name="discover/[testId]" />
      <Stack.Screen name="discover/result/[resultId]" />
      <Stack.Screen name="journal/index" />
      <Stack.Screen name="journal/entry/[id]" />
    </Stack>
    </ThemeProvider>
  );
}
