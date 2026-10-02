import React from 'react';
import { KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Makes room for the on-screen keyboard on both platforms.
 *
 * Android runs edge-to-edge (RN 0.81), where the system no longer resizes
 * the window for the keyboard (`adjustResize` is ignored), so the app has to
 * pad itself — the usual `Platform.OS === 'ios' ? 'padding' : undefined`
 * leaves text fields behind the keyboard on Android. If a device does
 * resize the window, the measured overlap is zero and this adds nothing.
 */
export default function KeyboardSafeView({
  children,
  style,
  offset = 0,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Space above this view that the keyboard's height is measured past (e.g. a fixed header). */
  offset?: number;
}) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
