import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { AccountScreen, Field, FormMessage, OrDivider, SwitchLink } from '@/components/account/AccountKit';
import Captcha from '@/components/account/Captcha';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';
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
  // The bot check, when app_config has its key: a token per try, then a fresh widget.
  const { turnstileSiteKey } = useRemoteConfig();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    const result = await signInWithEmail(email.trim(), password, captchaToken ?? undefined);
    setSubmitting(false);
    if (turnstileSiteKey) {
      setCaptchaToken(null);
      setCaptchaRound((r) => r + 1);
    }
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

  const canSubmit = email.trim().length > 0 && password.length > 0 && (!turnstileSiteKey || !!captchaToken);

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
      {!!turnstileSiteKey && (
        <Captcha key={captchaRound} siteKey={turnstileSiteKey} onToken={setCaptchaToken} onError={() => setError(errors.captcha_failed)} />
      )}
      {!!error && <FormMessage message={error} />}
      <Button block label={s.submit} onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
      <OrDivider label={s.or} />
      <GoogleButton label={s.google} onPress={handleGoogle} />
      <SwitchLink text={s.noAccount} link={s.createOne} onPress={() => router.replace('/account/sign-up')} />
    </AccountScreen>
  );
}
