import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Phone, Mail, Globe, MapPin, Award, Users, ExternalLink } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchTherapistDetail, safeUrl, type TherapistDetail } from '@/lib/hounaApi';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import DetailHero from '@/components/directory/DetailHero';
import InfoRow from '@/components/directory/InfoRow';
import ContactBar from '@/components/directory/ContactBar';

const INFO_ICONS: Record<string, typeof MapPin> = {
  location: MapPin,
  languages: Globe,
  organizations: Users,
};

export default function ProfessionalDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, language, fonts } = useLanguage();
  const s = t.directory.professionals;
  const common = t.directory.common;

  const [detail, setDetail] = useState<TherapistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTherapistDetail(slug, language)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : s.errorProfile);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, language, s.errorProfile]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState label={s.loadingProfile} />
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

  const primaryContact = detail.contacts.find((c) => c.type === 'phone') || detail.contacts.find((c) => c.type === 'email');
  const contactHref = safeUrl(primaryContact?.href || detail.contacts[0]?.href || null);
  const fallbackUrl = language === 'ar' ? 'https://houna.org/ar/contact-us' : 'https://houna.org/contact-us';

  const handleContact = () => {
    if (contactHref?.includes('email-protection') && primaryContact?.value) {
      Linking.openURL(`mailto:${primaryContact.value}`);
      return;
    }
    Linking.openURL(contactHref || fallbackUrl);
  };

  const contactIcon = primaryContact?.type === 'phone' ? Phone : primaryContact?.type === 'email' ? Mail : ExternalLink;
  const contactLabel =
    primaryContact?.type === 'phone' ? common.call : primaryContact?.type === 'email' ? common.sendEmail : common.contact;

  const infoEntries = Object.entries(detail.info);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DetailHero imageUrl={detail.imageUrl} />

        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.text, fontFamily: fonts.bold }]}>{detail.name}</Text>
          {!!detail.role && (
            <Text style={[styles.role, { color: colors.primary, fontFamily: fonts.semiBold }]}>{detail.role}</Text>
          )}
          {!!detail.summary && (
            <Text style={[styles.summary, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {detail.summary}
            </Text>
          )}

          {infoEntries.length > 0 && (
            <View style={styles.infoGrid}>
              {infoEntries.map(([key, value]) => (
                <InfoRow key={key} icon={INFO_ICONS[key] ?? Award} label={key} value={value} />
              ))}
            </View>
          )}

          {!!detail.fullBio && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{common.profile}</Text>
              <Text style={[styles.sectionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {detail.fullBio}
              </Text>
            </View>
          )}

          {!!detail.specialties && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{s.specialties}</Text>
              <Text style={[styles.sectionBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {detail.specialties}
              </Text>
            </View>
          )}

          {detail.socials.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{common.follow}</Text>
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

      <ContactBar icon={contactIcon} label={contactLabel} onPress={handleContact} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  name: {
    fontSize: typography.fontSize.xl,
  },
  role: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  summary: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    marginTop: spacing.sm,
  },
  infoGrid: {
    marginTop: spacing.md,
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
