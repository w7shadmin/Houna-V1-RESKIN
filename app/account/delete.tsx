import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AccountScreen, Field, FormMessage, SettingsGroup, SettingsRow } from '@/components/account/AccountKit';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, grid, radius } from '@/constants/theme';

/**
 * Deleting an Alias, for good (the App Store requires it; `AuthContext.deleteAlias`, the
 * `delete-account` Edge Function). What goes, what stays on the phone, and the Alias name typed
 * to confirm: a guard against a slip, and against a passer-by on a shared phone (a password
 * wouldn't cover Google accounts). Capitals don't matter, as they don't for the name itself.
 */
export default function DeleteAliasScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { profile, deleteAlias } = useAuth();
  const s = t.account.deleteAlias;

  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!profile) return null;
  const matches = typed.trim().toLowerCase() === profile.username.toLowerCase();

  const handleDelete = async () => {
    if (!matches || deleting) return;
    setDeleting(true);
    setFailed(false);
    const result = await deleteAlias();
    if (result.error) {
      setDeleting(false);
      setFailed(true);
      return;
    }
    router.replace({ pathname: '/profile', params: { deleted: '1' } });
  };

  return (
    <AccountScreen title={s.title} subtitle={s.subtitle} fallback="/profile">
      <SettingsGroup>
        {s.items.map((item) => (
          <SettingsRow key={item} title={item} />
        ))}
      </SettingsGroup>

      <SettingsGroup label={s.staysTitle}>
        <SettingsRow title={s.staysBody} />
      </SettingsGroup>

      <Text style={[styles.prompt, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
        {/* The name isolated left-to-right (LRI … PDI): in an Arabic line, "Layla_22" otherwise reorders round its "_". */}
        {s.prompt} <Text style={{ color: colors.text, fontFamily: fonts.semiBold }}>{`⁦${profile.username}⁩`}</Text>
      </Text>
      <Field label={s.field} value={typed} onChangeText={setTyped} autoCapitalize="none" autoComplete="off" />
      {failed && <FormMessage message={s.failed} />}

      <Pressable
        onPress={handleDelete}
        disabled={!matches || deleting}
        accessibilityRole="button"
        accessibilityState={{ disabled: !matches || deleting, busy: deleting }}
        style={({ pressed }) => [
          styles.delete,
          { borderColor: alpha(colors.danger, 0.45) },
          (!matches || deleting) && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {deleting ? (
          <ActivityIndicator color={colors.danger} />
        ) : (
          <Text style={[styles.deleteText, { color: colors.danger, fontFamily: fonts.semiBold }]}>{s.button}</Text>
        )}
      </Pressable>
      <View style={styles.cancel}>
        <Button block variant="secondary" label={s.cancel} onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))} disabled={deleting} />
      </View>
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  prompt: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: grid(1),
  },
  // As Account settings' Sign out: the outlined pill in the danger colour.
  delete: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: grid(1),
  },
  deleteText: {
    fontSize: 16,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  cancel: {
    marginTop: grid(-1),
  },
});
