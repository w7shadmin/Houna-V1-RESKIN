import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { AccountScreen, Field, FormMessage, OrDivider, SwitchLink } from '@/components/account/AccountKit';
import GoogleButton from '@/components/account/GoogleButton';
import Button from '@/components/ui/Button';
import IconTile from '@/components/ui/IconTile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL } = useLanguage();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const s = t.account.signUp;
  const errors = t.account.errors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    const result = await signUpWithEmail(email.trim(), password);
    setSubmitting(false);
    if (result.error) {
      setError(errors[result.error]);
      return;
    }
    if (result.needsEmailConfirmation) {
      setCheckEmail(true);
      return;
    }
    router.replace('/account/username');
  };

  const handleGoogle = async () => {
    setError('');
    const result = await signInWithGoogle();
    if (result.error && result.error !== 'cancelled') {
      setError(errors.unknown);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  if (checkEmail) {
    return (
      <AccountScreen title={s.title}>
        <View style={[styles.sent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <IconTile tone="glow" renderIcon={(c, size) => <MailCheck size={size} color={c} strokeWidth={1.6} />} />
          <Text style={[styles.sentTitle, isRTL && styles.sentTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {s.checkEmailTitle}
          </Text>
          <Text style={[styles.sentBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.checkEmailBody}</Text>
        </View>
        <Button block label={s.backToSignIn} onPress={() => router.replace('/account/sign-in')} />
      </AccountScreen>
    );
  }

  return (
    <AccountScreen title={s.title} subtitle={s.subtitle}>
      <Field
        label={s.email}
        value={email}
        onChangeText={setEmail}
        placeholder={s.emailPlaceholder}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Field
        label={s.password}
        value={password}
        onChangeText={setPassword}
        placeholder={s.passwordPlaceholder}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
      />
      {!!error && <FormMessage message={error} />}
      <Button block label={s.submit} onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
      <OrDivider label={s.or} />
      <GoogleButton label={s.google} onPress={handleGoogle} />
      <SwitchLink text={s.haveAccount} link={s.signInInstead} onPress={() => router.replace('/account/sign-in')} />
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  sent: {
    alignItems: 'center',
    gap: grid(1.5),
    borderWidth: 1,
    borderRadius: radius.card,
    padding: grid(3),
  },
  sentTitle: {
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
  sentTitleArabic: {
    lineHeight: 40,
  },
  sentBody: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
});
