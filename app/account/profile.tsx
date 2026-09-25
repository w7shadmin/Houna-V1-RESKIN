import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, Modal, SectionList, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Check } from 'lucide-react-native';
import { AccountScreen, SettingsGroup, SettingsRow } from '@/components/account/AccountKit';
import ConfirmDialog from '@/components/journal/ConfirmDialog';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon from '@/components/ui/CanvasIcon';
import { GroupLabel } from '@/components/directory/ProfileKit';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { GCC_CODES, getCountryList, getCountryName } from '@/lib/countries';
import { uploadToBucket } from '@/lib/storageUpload';
import { alpha, grid, layout, radius } from '@/constants/theme';

const AVATAR = 96;

export default function AccountProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const { loading: authLoading, session, profile, updateProfile, signOut } = useAuth();
  const s = t.account.profile;

  const [uploading, setUploading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  // Guards a stale route rather than an expected state — session/profile can
  // only go missing here after sign-out or an expired token, never on a
  // normal visit (Profile only links here once both exist).
  useEffect(() => {
    if (!authLoading && (!session || !profile)) {
      router.replace('/profile');
    }
  }, [authLoading, session, profile, router]);

  const sections = useMemo(() => {
    const gccSet = new Set<string>(GCC_CODES);
    const list = getCountryList(language);
    return [
      { title: s.gccGroup, data: list.filter((c) => gccSet.has(c.code)) },
      { title: s.allCountries, data: list.filter((c) => !gccSet.has(c.code)) },
    ];
  }, [language, s.gccGroup, s.allCountries]);

  if (!session || !profile) return null;

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${session.user.id}/avatar.${ext}`;
      const publicUrl = await uploadToBucket('avatars', path, asset.uri, asset.mimeType ?? null);
      // Cache-bust — the path is stable per user, so a reused filename won't
      // otherwise pick up the new image from any CDN/browser cache.
      await updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });
    } catch {
      Alert.alert(t.account.errors.unknown);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectCountry = async (code: string) => {
    setCountryModalOpen(false);
    await updateProfile({ country: code });
  };

  const handleSignOut = async () => {
    setConfirmSignOut(false);
    await signOut();
    router.replace('/profile');
  };

  const countryName = profile.country ? getCountryName(profile.country, language) : null;
  const initial = profile.username.charAt(0).toUpperCase();

  return (
    <AccountScreen title={s.title}>
      <View style={styles.avatarSection}>
        <Pressable
          onPress={handlePickAvatar}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel={s.changePhoto}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <View style={[styles.halo, { borderColor: alpha(colors.primary, 0.35) }]}>
            <View style={[styles.avatar, { backgroundColor: colors.tones.glow.bg, borderColor: colors.tones.glow.border }]}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} resizeMode="cover" />
              ) : (
                <Text style={[styles.initial, { color: colors.tones.glow.fg, fontFamily: fonts.display }]}>{initial}</Text>
              )}
              {uploading && (
                <View style={[styles.avatarOverlay, { backgroundColor: colors.scrim }]}>
                  <ActivityIndicator color={colors.text} />
                </View>
              )}
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Camera size={15} color={colors.onPrimary} strokeWidth={2} />
          </View>
        </Pressable>
        <Text style={[styles.username, { color: colors.text, fontFamily: fonts.semiBold }]}>{profile.username}</Text>
        <Pressable onPress={handlePickAvatar} disabled={uploading} hitSlop={8} style={({ pressed }) => pressed && styles.pressed}>
          <Text style={[styles.changePhoto, { color: colors.primary, fontFamily: fonts.medium }]}>{s.changePhoto}</Text>
        </Pressable>
      </View>

      <SettingsGroup label={s.details}>
        <SettingsRow title={s.username} value={profile.username} />
        <SettingsRow title={s.country} value={countryName ?? s.notSet} valueMuted={!countryName} onPress={() => setCountryModalOpen(true)} />
      </SettingsGroup>

      <SettingsGroup label={s.activity}>
        <SettingsRow title={s.streakStats} onPress={() => router.push('/account/stats')} />
      </SettingsGroup>

      <Pressable
        onPress={() => setConfirmSignOut(true)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.signOut, { borderColor: alpha(colors.danger, 0.45) }, pressed && styles.pressed]}
      >
        <Text style={[styles.signOutText, { color: colors.danger, fontFamily: fonts.semiBold }]}>{s.signOut}</Text>
      </Pressable>

      <ConfirmDialog
        visible={confirmSignOut}
        title={s.signOutConfirmTitle}
        body={s.signOutConfirmBody}
        cancelLabel={s.cancel}
        confirmLabel={s.signOut}
        destructive
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={handleSignOut}
      />

      <Modal visible={countryModalOpen} animationType="slide" onRequestClose={() => setCountryModalOpen(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <View style={styles.modalInner}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && styles.modalTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
                {s.selectCountry}
              </Text>
              <IconButton
                variant="control"
                accessibilityLabel={s.cancel}
                onPress={() => setCountryModalOpen(false)}
                renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />}
              />
            </View>
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.code}
              contentContainerStyle={styles.modalList}
              stickySectionHeadersEnabled
              renderSectionHeader={({ section }) => (
                <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                  <GroupLabel>{section.title}</GroupLabel>
                </View>
              )}
              renderItem={({ item }) => {
                const active = profile.country === item.code;
                return (
                  <Pressable
                    onPress={() => handleSelectCountry(item.code)}
                    accessibilityRole="button"
                    aria-selected={active}
                    style={({ pressed }) => [
                      styles.countryRow,
                      active && { backgroundColor: colors.tones.glow.bg },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.countryLabel, { color: colors.text, fontFamily: active ? fonts.semiBold : fonts.regular }]}>
                      {item[language]}
                    </Text>
                    {active && <Check size={18} color={colors.primary} strokeWidth={2} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  avatarSection: {
    alignItems: 'center',
    gap: grid(1),
    marginBottom: grid(1),
  },
  halo: {
    padding: grid(0.75),
    borderRadius: radius.full,
    borderWidth: 1,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  initial: {
    fontSize: 40,
    lineHeight: 48,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    end: 2,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    marginTop: grid(1),
  },
  changePhoto: {
    fontSize: 14,
  },
  signOut: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: grid(1),
  },
  signOutText: {
    fontSize: 16,
  },
  modalSafe: {
    flex: 1,
  },
  modalInner: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: grid(2),
    padding: grid(2),
  },
  modalTitle: {
    flex: 1,
    fontSize: 26,
    lineHeight: 32,
  },
  modalTitleArabic: {
    lineHeight: 44,
  },
  modalList: {
    paddingHorizontal: grid(2),
    paddingBottom: grid(5),
  },
  sectionHeader: {
    paddingTop: grid(2),
    paddingBottom: grid(1),
  },
  countryRow: {
    minHeight: grid(6),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: grid(1.5),
    borderRadius: radius.md,
  },
  countryLabel: {
    fontSize: 16,
  },
});
