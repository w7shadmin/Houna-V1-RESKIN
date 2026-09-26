import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout } from '@/constants/theme';
import { fetchOrganizationDetail, safeUrl, type OrganizationDetail } from '@/lib/hounaApi';
import { infoWebsite, ownSocials, profileFacts } from '@/lib/directoryProfile';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import ListItemCard from '@/components/directory/ListItemCard';
import ScreenGlow from '@/components/ui/ScreenGlow';
import {
  BodyText,
  ContactActions,
  FactGrid,
  FollowRow,
  GroupLabel,
  LinkRow,
  ProfileHero,
  ProfileTopBar,
  SectionCard,
} from '@/components/directory/ProfileKit';
import { useContactActions } from '@/components/directory/useContactActions';

/** An organization's profile, in the same language as a professional's. */
export default function OrganizationDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useLanguage();
  const s = t.directory.organizations;
  const common = t.directory.common;

  const [detail, setDetail] = useState<OrganizationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchOrganizationDetail(id, language)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : s.errorDetail))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, language, s.errorDetail]);

  const actions = useContactActions(detail?.contacts ?? []);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/directory/organizations'));

  if (loading || error || !detail) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.stateWrap}>
          <ProfileTopBar onBack={back} />
          {loading ? (
            <LoadingState label={s.loadingDetail} />
          ) : (
            <ErrorState message={error || common.notFound} retryLabel={common.goBack} onRetry={back} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const facts = profileFacts(detail.info);
  const website = safeUrl(detail.website) ?? infoWebsite(detail.info);
  const socials = ownSocials(detail.socials);
  const bio = detail.fullBio.trim() || detail.summary.trim();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <ScreenGlow color={colors.glow} rx={60} ry={55} cy={55} />
          <ProfileTopBar onBack={back} />
          <ProfileHero name={detail.name} imageUrl={detail.imageUrl} kind="logo" />
        </View>

        {facts.length > 0 && <FactGrid facts={facts} />}

        {!!website && (
          <LinkRow
            label={common.website}
            value={website.replace(/^https?:\/\/(www\.)?/, '').replace(/[/?#].*$/, '')}
            icon={Globe}
            tone="glow"
            external
            onPress={() => Linking.openURL(website).catch(() => {})}
          />
        )}

        {!!bio && (
          <SectionCard title={common.about}>
            <BodyText>{bio}</BodyText>
          </SectionCard>
        )}

        {detail.roster.length > 0 && (
          <View style={styles.group}>
            <GroupLabel>{s.roster}</GroupLabel>
            {detail.roster.map((member, i) => (
              <ListItemCard
                key={`${member.slug}-${i}`}
                imageUrl={member.imageUrl}
                title={member.name}
                subtitle={member.role}
                description={member.summary}
                onPress={() => router.push({ pathname: '/directory/professionals/[slug]', params: { slug: member.slug } })}
              />
            ))}
          </View>
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
  group: {
    gap: grid(1.5),
  },
});
