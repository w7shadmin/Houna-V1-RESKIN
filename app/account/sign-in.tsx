import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { AccountScreen, Field, FormMessage, OrDivider, SwitchLink } from '@/components/account/AccountKit';
import GoogleButton from '@/components/account/GoogleButton';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useLanguage();
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
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  const handleGoogle = async () => {
    setError('');
    const result = await signInWithGoogle();
    if (result.error && result.error !== 'cancelled') {
      setError(errors.unknown);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0;

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
        autoComplete="password"
      />
      {!!error && <FormMessage message={error} />}
      <Button block label={s.submit} onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
      <OrDivider label={s.or} />
      <GoogleButton label={s.google} onPress={handleGoogle} />
      <SwitchLink text={s.noAccount} link={s.createOne} onPress={() => router.replace('/account/sign-up')} />
    </AccountScreen>
  );
}
