import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

// Ensures a direct deep link into a subpage (e.g. Home linking straight
// into /directory/professionals) still gets the hub route synthesized
// beneath it, so `router.back()` from the subpage has somewhere to land.
export const unstable_settings = {
  initialRouteName: 'index',
};

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
