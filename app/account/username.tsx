import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import DetailScreen from '@/components/DetailScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

type Status = 'idle' | 'invalid' | 'checking' | 'available' | 'taken';

export default function UsernameScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
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
      router.replace('/(tabs)/more');
    } else {
      setStatus(result.error === 'username_taken' ? 'taken' : 'invalid');
    }
  };

  const statusColor =
    status === 'available' ? colors.primary : status === 'taken' || status === 'invalid' ? colors.accent : colors.textTertiary;

  const statusLabel =
    status === 'checking' ? s.checking : status === 'available' ? s.available : status === 'taken' ? s.taken : status === 'invalid' ? s.invalid : '';

  return (
    <DetailScreen title={s.title}>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.subtitle}</Text>

      <View style={styles.fieldWrap}>
        <TextInput
          value={username}
          onChangeText={(text) => setUsername(text.trim())}
          placeholder={s.placeholder}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          textAlign={isRTL ? 'right' : 'left'}
          style={[
            styles.input,
            { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, fontFamily: fonts.regular },
          ]}
        />
        {(status === 'checking' || status === 'available' || status === 'taken') && (
          <View style={styles.statusIcon}>
            {status === 'checking' && <ActivityIndicator size="small" color={colors.textTertiary} />}
            {status === 'available' && <Check size={20} color={colors.primary} />}
            {status === 'taken' && <X size={20} color={colors.accent} />}
          </View>
        )}
      </View>

      {!!statusLabel && (
        <Text style={[styles.statusLabel, { color: statusColor, fontFamily: fonts.regular }]}>{statusLabel}</Text>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={status !== 'available' || submitting}
        style={({ pressed }) => [
          styles.submitBtn,
          { backgroundColor: colors.primary },
          (pressed || status !== 'available' || submitting) && { opacity: 0.6 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[styles.submitText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>{s.submit}</Text>
        )}
      </Pressable>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  fieldWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingEnd: spacing.xl + spacing.sm,
    fontSize: typography.fontSize.body,
  },
  statusIcon: {
    position: 'absolute',
    end: spacing.md,
  },
  statusLabel: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  submitBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  submitText: {
    fontSize: typography.fontSize.body,
  },
});
