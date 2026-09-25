import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import DetailScreen from '@/components/DetailScreen';
import AuthField from '@/components/account/AuthField';
import GoogleButton from '@/components/account/GoogleButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function SignInScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const s = t.account.signIn;
  const errors = t.account.errors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    const result = await signInWithEmail(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError(errors[result.error]);
      return;
    }
    router.back();
  };

  const handleGoogle = async () => {
    setError('');
    const result = await signInWithGoogle();
    if (result.error && result.error !== 'cancelled') {
      setError(errors.unknown);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <DetailScreen title={s.title}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
            {s.subtitle}
          </Text>

          <AuthField
            label={s.email}
            value={email}
            onChangeText={setEmail}
            placeholder={s.emailPlaceholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <AuthField
            label={s.password}
            value={password}
            onChangeText={setPassword}
            placeholder={s.passwordPlaceholder}
            secureTextEntry
            autoCapitalize="none"
          />

          {!!error && (
            <Text style={[styles.error, { color: colors.accent, fontFamily: fonts.regular }]}>{error}</Text>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary },
              (pressed || !canSubmit) && { opacity: 0.7 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.submitText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>
                {s.submit}
              </Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {s.or}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <GoogleButton label={s.google} onPress={handleGoogle} />

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {s.noAccount}
            </Text>
            <Pressable onPress={() => router.replace('/account/sign-up')} hitSlop={8}>
              <Text style={[styles.footerLink, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                {s.createOne}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    marginBottom: spacing.lg,
  },
  error: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  submitBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  submitText: {
    fontSize: typography.fontSize.body,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: typography.fontSize.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
  },
  footerLink: {
    fontSize: typography.fontSize.sm,
  },
});
