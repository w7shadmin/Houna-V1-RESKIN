import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, Modal, SectionList, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { User, Camera, ChevronRight, X, Check } from 'lucide-react-native';
import DetailScreen from '@/components/DetailScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GCC_CODES, getCountryList, getCountryName } from '@/lib/countries';
import { uploadToBucket } from '@/lib/storageUpload';
import { spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, language, isRTL, fonts } = useLanguage();
  const { loading: authLoading, session, profile, updateProfile, signOut } = useAuth();
  const s = t.account.profile;

  const [uploading, setUploading] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);

  // Guards a stale route rather than an expected state — session/profile can
  // only go missing here after sign-out or an expired token, never on a
  // normal visit (More only links here once both exist).
  useEffect(() => {
    if (!authLoading && (!session || !profile)) {
      router.replace('/(tabs)/more');
    }
  }, [authLoading, session, profile, router]);

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

  const handleSignOut = () => {
    Alert.alert(s.signOutConfirmTitle, s.signOutConfirmBody, [
      { text: s.cancel, style: 'cancel' },
      {
        text: s.signOut,
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(tabs)/more');
        },
      },
    ]);
  };

  const countryName = profile.country ? getCountryName(profile.country, language) : null;
  const gccSet = new Set<string>(GCC_CODES);
  const sections = [
    { title: s.gccGroup, data: getCountryList(language).filter((c) => gccSet.has(c.code)) },
    { title: s.allCountries, data: getCountryList(language).filter((c) => !gccSet.has(c.code)) },
  ];

  return (
    <DetailScreen title={s.title}>
      <View style={styles.avatarSection}>
        <Pressable onPress={handlePickAvatar} disabled={uploading} style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLightest }]}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <User size={36} color={colors.primary} />
            )}
            {uploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color={colors.onPrimary} />
              </View>
            )}
          </View>
          <View style={[styles.avatarBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
            <Camera size={14} color={colors.onPrimary} />
          </View>
        </Pressable>
        <Text style={[styles.changePhoto, { color: colors.primary, fontFamily: fonts.semiBold }]}>{s.changePhoto}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabelFixed, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.username}</Text>
          <Text
            numberOfLines={1}
            style={[styles.rowValue, styles.rowValueShrink, { color: colors.text, fontFamily: fonts.semiBold }]}
          >
            {profile.username}
          </Text>
        </View>

        <Pressable
          onPress={() => setCountryModalOpen(true)}
          style={({ pressed }) => [
            styles.row,
            styles.rowPressable,
            { borderTopColor: colors.borderLight },
            pressed && { backgroundColor: colors.cardPressed },
          ]}
        >
          <Text style={[styles.rowLabelFixed, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.country}</Text>
          <View style={styles.rowValueGroup}>
            <Text
              numberOfLines={1}
              style={[styles.rowValue, styles.rowValueShrink, { color: countryName ? colors.text : colors.placeholder, fontFamily: fonts.semiBold }]}
            >
              {countryName ?? s.selectCountry}
            </Text>
            <ChevronRight size={16} color={colors.textTertiary} style={isRTL ? styles.flip : undefined} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/account/community')}
          style={({ pressed }) => [
            styles.row,
            styles.rowPressable,
            { borderTopColor: colors.borderLight },
            pressed && { backgroundColor: colors.cardPressed },
          ]}
        >
          <Text style={[styles.rowLabelFixed, styles.rowLabelGrow, { color: colors.text, fontFamily: fonts.semiBold }]}>
            {s.communityMap}
          </Text>
          <ChevronRight size={16} color={colors.textTertiary} style={isRTL ? styles.flip : undefined} />
        </Pressable>

        <Pressable
          onPress={() => router.push('/account/stats')}
          style={({ pressed }) => [
            styles.row,
            styles.rowPressable,
            { borderTopColor: colors.borderLight },
            pressed && { backgroundColor: colors.cardPressed },
          ]}
        >
          <Text style={[styles.rowLabelFixed, styles.rowLabelGrow, { color: colors.text, fontFamily: fonts.semiBold }]}>
            {s.streakStats}
          </Text>
          <ChevronRight size={16} color={colors.textTertiary} style={isRTL ? styles.flip : undefined} />
        </Pressable>
      </View>

      <Pressable
        onPress={handleSignOut}
        style={({ pressed }) => [
          styles.signOutBtn,
          { borderColor: colors.border },
          pressed && { backgroundColor: colors.cardPressed },
        ]}
      >
        <Text style={[styles.signOutText, { color: colors.accent, fontFamily: fonts.semiBold }]}>{s.signOut}</Text>
      </Pressable>

      <Modal visible={countryModalOpen} animationType="slide" onRequestClose={() => setCountryModalOpen(false)}>
        <View style={[styles.modalSafe, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: fonts.bold }]}>{s.selectCountry}</Text>
            <Pressable onPress={() => setCountryModalOpen(false)} hitSlop={12} style={styles.modalClose}>
              <X size={22} color={colors.text} />
            </Pressable>
          </View>
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.modalList}
            renderSectionHeader={({ section }) => (
              <Text style={[styles.sectionHeader, { color: colors.textTertiary, backgroundColor: colors.background, fontFamily: fonts.semiBold }]}>
                {section.title.toUpperCase()}
              </Text>
            )}
            renderItem={({ item }) => {
              const active = profile.country === item.code;
              return (
                <Pressable
                  onPress={() => handleSelectCountry(item.code)}
                  style={({ pressed }) => [styles.countryRow, pressed && { backgroundColor: colors.cardPressed }]}
                >
                  <Text style={[styles.countryLabel, { color: colors.text, fontFamily: fonts.regular }]}>{item[language]}</Text>
                  {active && <Check size={18} color={colors.primary} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    end: 0,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhoto: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.sm,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowPressable: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  /** Fixed on its natural width — the value side is what shrinks/truncates when space is tight. */
  rowLabelFixed: {
    flexShrink: 0,
    fontSize: typography.fontSize.sm,
    marginEnd: spacing.md,
  },
  /** For a row whose label is the only real content (no value text, just a chevron) — let it fill the row. */
  rowLabelGrow: {
    flex: 1,
    fontSize: typography.fontSize.body,
  },
  rowValue: {
    fontSize: typography.fontSize.body,
  },
  /** minWidth:0 is what actually lets a flex child shrink below its text's intrinsic width on RN-Web — without it, flexShrink alone is ignored and the row overflows instead of truncating. */
  rowValueShrink: {
    flexShrink: 1,
    minWidth: 0,
  },
  rowValueGroup: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  signOutBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: typography.fontSize.body,
  },
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
  },
  modalClose: {
    padding: spacing.xs,
  },
  modalList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    letterSpacing: 0.8,
    paddingVertical: spacing.sm,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 4,
  },
  countryLabel: {
    fontSize: typography.fontSize.body,
  },
});
