import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

/** Internal stack for the Account area, opened from More — sign in, sign up,
 * claim a username, and manage the profile once signed in. */
export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="username" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
