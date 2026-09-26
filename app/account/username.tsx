import React, { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { AccountScreen, Field, FormMessage } from '@/components/account/AccountKit';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

type Status = 'idle' | 'invalid' | 'checking' | 'available' | 'taken';

export default function UsernameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useLanguage();
  const { claimUsername } = useAuth();
  const s = t.account.username;

  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (username.length === 0) {
      setStatus('idle');
      return;
    }
    if (!USERNAME_PATTERN.test(username)) {
      setStatus('invalid');
      return;
    }
    setStatus('checking');
    const handle = setTimeout(async () => {
      const { data } = await supabase.rpc('is_username_available', { candidate: username });
      setStatus(data ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(handle);
  }, [username]);

  const handleSubmit = async () => {
    if (status !== 'available') return;
    setSubmitting(true);
    const result = await claimUsername(username);
    setSubmitting(false);
    if (!result.error) {
      router.replace('/profile');
    } else {
      setStatus(result.error === 'username_taken' ? 'taken' : 'invalid');
    }
  };

  const statusIcon =
    status === 'checking' ? (
      <ActivityIndicator size="small" color={colors.textTertiary} />
    ) : status === 'available' ? (
      <Check size={20} color={colors.primary} strokeWidth={2} />
    ) : status === 'taken' ? (
      <X size={20} color={colors.danger} strokeWidth={2} />
    ) : null;

  const statusLabel =
    status === 'checking' ? s.checking : status === 'available' ? s.available : status === 'taken' ? s.taken : status === 'invalid' ? s.invalid : '';
  const statusTone = status === 'available' ? 'ok' : status === 'taken' || status === 'invalid' ? 'error' : 'muted';

  return (
    <AccountScreen title={s.title} subtitle={s.subtitle}>
      <Field
        label={s.label}
        value={username}
        onChangeText={(text) => setUsername(text.trim())}
        placeholder={s.placeholder}
        autoCapitalize="none"
        autoComplete="username"
        trailing={statusIcon}
      />
      {!!statusLabel && <FormMessage message={statusLabel} tone={statusTone} />}
      <Button block label={s.submit} onPress={handleSubmit} disabled={status !== 'available'} loading={submitting} />
    </AccountScreen>
  );
}
