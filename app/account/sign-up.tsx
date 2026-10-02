import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MailCheck } from 'lucide-react-native';
import { AccountScreen, Field, FormMessage, OrDivider, SwitchLink } from '@/components/account/AccountKit';
import Captcha from '@/components/account/Captcha';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';
import GoogleButton from '@/components/account/GoogleButton';
import { openLegal } from '@/lib/legalLinks';
import Button from '@/components/ui/Button';
import IconTile from '@/components/ui/IconTile';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL, language } = useLanguage();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const s = t.account.signUp;
  const errors = t.account.errors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // The bot check, when app_config has its key: a token per try, then a fresh widget.
  const { turnstileSiteKey } = useRemoteConfig();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRound, setCaptchaRound] = useState(0);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    const result = await signUpWithEmail(email.trim(), password, captchaToken ?? undefined);
    setSubmitting(false);
    if (turnstileSiteKey) {
      setCaptchaToken(null);
      setCaptchaRound((r) => r + 1);
    }
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

  const canSubmit = email.trim().length > 0 && password.length >= 8 && (!turnstileSiteKey || !!captchaToken);

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
      {!!turnstileSiteKey && (
        <Captcha key={captchaRound} siteKey={turnstileSiteKey} onToken={setCaptchaToken} onError={() => setError(errors.captcha_failed)} />
      )}
      {!!error && <FormMessage message={error} />}
      <Text style={[styles.agree, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
        {s.agreeText}{' '}
        <Text style={{ color: colors.primary, fontFamily: fonts.semiBold }} onPress={() => openLegal('terms', language)}>
          {t.account.profile.terms}
        </Text>{' '}
        {s.agreeAnd}{' '}
        <Text style={{ color: colors.primary, fontFamily: fonts.semiBold }} onPress={() => openLegal('privacy', language)}>
          {t.account.profile.privacyPolicy}
        </Text>
        .
      </Text>
      <Button block label={s.submit} onPress={handleSubmit} disabled={!canSubmit} loading={submitting} />
      <OrDivider label={s.or} />
      <GoogleButton label={s.google} onPress={handleGoogle} />
      <SwitchLink text={s.haveAccount} link={s.signInInstead} onPress={() => router.replace('/account/sign-in')} />
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  agree: {
    fontSize: 13,
    lineHeight: 19,
  },
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
