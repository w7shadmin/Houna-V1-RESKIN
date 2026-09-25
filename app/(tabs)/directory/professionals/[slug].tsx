import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2 } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout } from '@/constants/theme';
import { fetchTherapistDetail, type TherapistDetail } from '@/lib/hounaApi';
import { organizationIdFromUrl, ownSocials, profileFacts } from '@/lib/directoryProfile';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import ScreenGlow from '@/components/ui/ScreenGlow';
import {
  BodyText,
  ContactActions,
  FactGrid,
  FollowRow,
  LinkRow,
  ProfileHero,
  ProfileTopBar,
  SectionCard,
} from '@/components/directory/ProfileKit';
import { useContactActions } from '@/components/directory/useContactActions';

/** A professional's profile, drawn to the canvas's "Professional profile" artboard. */
export default function ProfessionalDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, language } = useLanguage();
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
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : s.errorProfile))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, language, s.errorProfile]);

  const actions = useContactActions(detail?.contacts ?? []);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/directory/professionals'));

  if (loading || error || !detail) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.stateWrap}>
          <ProfileTopBar onBack={back} />
          {loading ? (
            <LoadingState label={s.loadingProfile} />
          ) : (
            <ErrorState message={error || common.notFound} retryLabel={common.goBack} onRetry={back} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const orgId = organizationIdFromUrl(detail.organization?.url);
  // With a linked organization, it gets its own tappable row instead of a fact tile.
  const facts = profileFacts(detail.info, orgId ? ['organizations'] : []);
  const socials = ownSocials(detail.socials);
  const bio = detail.fullBio.trim() || detail.summary.trim();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <ScreenGlow color={colors.glow} rx={60} ry={55} cy={55} />
          <ProfileTopBar onBack={back} />
          <ProfileHero name={detail.name} role={detail.role} imageUrl={detail.imageUrl} kind="person" />
        </View>

        {facts.length > 0 && <FactGrid facts={facts} />}

        {orgId && detail.organization && (
          <LinkRow
            label={common.partOf}
            value={detail.organization.name}
            icon={Building2}
            tone="dawn"
            onPress={() => router.push({ pathname: '/directory/organizations/[id]', params: { id: orgId } })}
          />
        )}

        {!!bio && (
          <SectionCard title={common.about}>
            <BodyText>{bio}</BodyText>
          </SectionCard>
        )}

        {!!detail.specialties?.trim() && (
          <SectionCard title={s.specialties}>
            <BodyText>{detail.specialties.trim()}</BodyText>
          </SectionCard>
        )}

        <FollowRow socials={socials} />
      </ScrollView>

      <ContactActions primary={actions.primary} secondary={actions.secondary} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  stateWrap: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(4),
    gap: grid(3),
  },
  top: {
    gap: grid(2),
  },
});
