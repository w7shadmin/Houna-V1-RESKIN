import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { nightPalette } from '@/constants/theme';

/** Internal stack for everything opened from the raised Tanafas button — the
 * whole group is presented as one modal (see app/_layout.tsx), and this
 * navigator handles hub → exercise within it. */
export default function TanafasLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="breathing/anxiety-relief" />
      <Stack.Screen name="breathing/steady-mind" />
      <Stack.Screen name="breathing/panic-relief" />
      <Stack.Screen name="breathing/tension-release" />
      <Stack.Screen name="meditation/index" />
      <Stack.Screen
        name="meditation/[scene]"
        options={{ animation: 'fade', contentStyle: { backgroundColor: nightPalette.midnight } }}
      />
      <Stack.Screen name="discover/[testId]" />
      <Stack.Screen name="discover/result/[resultId]" />
      <Stack.Screen name="journal/index" />
      <Stack.Screen name="journal/entry/[id]" />
      <Stack.Screen name="voices/index" />
      <Stack.Screen name="voices/submit" />
      <Stack.Screen name="voices/[id]" />
    </Stack>
  );
}
