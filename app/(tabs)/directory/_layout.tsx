import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

/** Nested stack for the Directory tab — hub, then per-category list & detail. */
export default function DirectoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="professionals/index" />
      <Stack.Screen name="professionals/[slug]" />
      <Stack.Screen name="organizations/index" />
      <Stack.Screen name="organizations/[id]" />
      <Stack.Screen name="wellness-centers/index" />
      <Stack.Screen name="wellness-centers/[id]" />
      <Stack.Screen name="articles/index" />
      <Stack.Screen name="podcasts/index" />
      <Stack.Screen name="resources/index" />
      <Stack.Screen name="resources/[slug]" />
    </Stack>
  );
}
