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
import { formatEntryDateLong } from '@/lib/journal';
import { arabicNumber } from '@/lib/arabicNumerals';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

type Status = 'idle' | 'same' | 'invalid' | 'checking' | 'available' | 'taken';

export default function UsernameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL } = useLanguage();
  const { profile, claimUsername, changeUsername } = useAuth();
  const s = t.account.username;
  // Signed in with a name already: this screen renames it; otherwise it's the one-time claim at sign-up.
  const current = profile?.username;

  const [username, setUsername] = useState(current ?? '');
  const [status, setStatus] = useState<Status>('idle');
  const [submitting, setSubmitting] = useState(false);
  // Renames left in the current 30 days (twice in any 30, enforced in the database); null until known.
  const [allowance, setAllowance] = useState<{ remaining: number; nextAt: string | null } | null>(null);

  const loadAllowance = React.useCallback(async () => {
    const { data } = await supabase.rpc('get_username_change_allowance');
    const row = Array.isArray(data) ? data[0] : data;
    if (row) setAllowance({ remaining: row.remaining, nextAt: row.next_at });
  }, []);

  useEffect(() => {
    if (current) loadAllowance();
  }, [current, loadAllowance]);
  const limited = !!current && allowance?.remaining === 0;

  useEffect(() => {
    if (username.length === 0) {
      setStatus('idle');
      return;
    }
    if (current && username === current) {
      setStatus('same');
      return;
    }
    if (!USERNAME_PATTERN.test(username)) {
      setStatus('invalid');
      return;
    }
    // Only the case changed: still this person's own name.
    if (current && username.toLowerCase() === current.toLowerCase()) {
      setStatus('available');
      return;
    }
    setStatus('checking');
    const handle = setTimeout(async () => {
      const { data } = await supabase.rpc('is_username_available', { candidate: username });
      setStatus(data ? 'available' : 'taken');
    }, 400);
    return () => clearTimeout(handle);
  }, [username, current]);

  const handleSubmit = async () => {
    if (status !== 'available') return;
    setSubmitting(true);
    const result = current ? await changeUsername(username) : await claimUsername(username);
    setSubmitting(false);
    if (!result.error) {
      if (current) router.back();
      else router.replace('/profile');
    } else if (result.error === 'username_change_limit') {
      await loadAllowance();
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
    status === 'same' ? s.same : status === 'checking' ? s.checking : status === 'available' ? s.available : status === 'taken' ? s.taken : status === 'invalid' ? s.invalid : '';
  const statusTone = status === 'available' ? 'ok' : status === 'taken' || status === 'invalid' ? 'error' : 'muted';

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const limitNote = !current || !allowance
    ? ''
    : allowance.remaining >= 2
      ? s.limitTwo
      : allowance.remaining === 1
        ? s.limitOne
        : s.limitNone.replace('{date}', allowance.nextAt ? formatEntryDateLong(new Date(allowance.nextAt), t.journal.dateNames, num) : '');

  return (
    <AccountScreen title={current ? s.changeTitle : s.title} subtitle={current ? s.changeSubtitle : s.subtitle}>
      <Field
        label={s.label}
        value={username}
        onChangeText={(text) => setUsername(text.trim())}
        placeholder={s.placeholder}
        autoCapitalize="none"
        autoComplete="username"
        trailing={statusIcon}
      />
      {!!statusLabel && !limited && <FormMessage message={statusLabel} tone={statusTone} />}
      {!!limitNote && <FormMessage message={limitNote} tone={limited ? 'error' : 'muted'} />}
      <Button block label={current ? s.save : s.submit} onPress={handleSubmit} disabled={status !== 'available' || limited} loading={submitting} />
    </AccountScreen>
  );
}
