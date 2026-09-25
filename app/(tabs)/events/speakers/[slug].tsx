import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MapPin, Globe, Users } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { palette, spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchSpeakerDetail, safeUrl, resolveImageUrl, type SpeakerDetail } from '@/lib/hounaApi';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import InfoRow from '@/components/directory/InfoRow';

const INFO_ICONS: Record<string, typeof MapPin> = {
  location: MapPin,
  language: Globe,
  'work with': Users,
  workwith: Users,
};

export default function SpeakerDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, language, isRTL, fonts } = useLanguage();
  const s = t.events.speaker;
  const common = t.directory.common;

  const [detail, setDetail] = useState<SpeakerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchSpeakerDetail(slug, language)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : common.notFound);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, language, common.notFound]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState label={s.loading} />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState message={error || common.notFound} retryLabel={common.goBack} onRetry={() => router.back()} />
      </View>
    );
  }

  const infoEntries = Object.entries(detail.info);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: palette.turquoise }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: pressed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)' },
            ]}
          >
            <View style={isRTL ? styles.flip : undefined}>
<ArrowLeft size={20} color={colors.text} />
</View>
          </Pressable>
          <View style={[styles.avatar, { borderColor: 'rgba(255,255,255,0.8)', backgroundColor: colors.card }]}>
            {!!resolveImageUrl(detail.imageUrl) && (
              <Image source={{ uri: resolveImageUrl(detail.imageUrl)! }} style={styles.avatarImg} resizeMode="cover" />
            )}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.text, fontFamily: fonts.bold }]}>{detail.name}</Text>
          {!!detail.role && (
            <Text style={[styles.role, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {detail.role}
            </Text>
          )}

          {infoEntries.length > 0 && (
            <View style={styles.infoGrid}>
              {infoEntries.map(([key, value]) => (
                <InfoRow key={key} icon={INFO_ICONS[key.toLowerCase()] ?? MapPin} label={key} value={value} />
              ))}
            </View>
          )}

          {!!detail.bio && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{s.about}</Text>
              <Text style={[styles.sectionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {detail.bio}
              </Text>
            </View>
          )}

          {detail.socials.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                {common.follow}
              </Text>
              <View style={styles.socialRow}>
                {detail.socials.map((social, i) => (
                  <Pressable
                    key={i}
                    onPress={() => {
                      const url = safeUrl(social.url);
                      if (url) Linking.openURL(url);
                    }}
                    style={({ pressed }) => [
                      styles.socialBtn,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      pressed && { backgroundColor: colors.cardPressed },
                    ]}
                  >
                    <Text style={[styles.socialText, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>
                      {social.platform.slice(0, 2).toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.md,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    start: 16,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: radius.full,
    borderWidth: 4,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  name: {
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
  },
  role: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  infoGrid: {
    marginTop: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  socialBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    fontSize: typography.fontSize.xs,
  },
});
