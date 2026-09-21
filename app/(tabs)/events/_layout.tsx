import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function EventsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[slug]" />
      <Stack.Screen name="speakers/[slug]" />
    </Stack>
  );
}
