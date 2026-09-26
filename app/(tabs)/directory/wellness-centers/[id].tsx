import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout } from '@/constants/theme';
import { fetchWellnessCenterDetail, type WellnessCenterDetail } from '@/lib/hounaApi';
import { infoWebsite, ownSocials, profileFacts } from '@/lib/directoryProfile';
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
  TagList,
} from '@/components/directory/ProfileKit';
import { useContactActions } from '@/components/directory/useContactActions';

/** A wellness center's profile, in the same language as a professional's. */
export default function WellnessCenterDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useLanguage();
  const s = t.directory.wellnessCenters;
  const common = t.directory.common;

  const [detail, setDetail] = useState<WellnessCenterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchWellnessCenterDetail(id, language)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : s.errorDetail))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, language, s.errorDetail]);

  const actions = useContactActions(detail?.contacts ?? []);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/directory/wellness-centers'));

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
  const website = infoWebsite(detail.info);
  // Don't repeat a website that's already one of the follow buttons.
  const socials = ownSocials(detail.socials);
  const showWebsite = !!website && !socials.some((x) => x.url === website);
  const bio = detail.fullBio.trim() || detail.summary.trim();
  const services = detail.services.map((x) => x.replace(/[.\s]+$/, '')).filter(Boolean);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <ScreenGlow color={colors.glow} rx={60} ry={55} cy={55} />
          <ProfileTopBar onBack={back} />
          <ProfileHero name={detail.name} eyebrow={s.badge} imageUrl={detail.imageUrl} kind="logo" />
        </View>

        {facts.length > 0 && <FactGrid facts={facts} />}

        {showWebsite && (
          <LinkRow
            label={common.website}
            value={website.replace(/^https?:\/\/(www\.)?/, '').replace(/[/?#].*$/, '')}
            icon={Globe}
            tone="glow"
            external
            onPress={() => Linking.openURL(website).catch(() => {})}
          />
        )}

        {services.length > 0 && (
          <SectionCard title={common.services}>
            <TagList items={services} />
          </SectionCard>
        )}

        {!!bio && (
          <SectionCard title={common.about}>
            <BodyText>{bio}</BodyText>
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
