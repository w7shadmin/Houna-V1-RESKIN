import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout } from '@/constants/theme';
import { fetchSpeakerDetail, type SpeakerDetail } from '@/lib/hounaApi';
import { ownSocials, profileFacts } from '@/lib/directoryProfile';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';
import { BodyText, FactGrid, FollowRow, ProfileHero, ProfileTopBar, SectionCard } from '@/components/directory/ProfileKit';
import { tidyRole } from '@/components/events/EventPills';
import ScreenGlow from '@/components/ui/ScreenGlow';

/** A speaker's profile, in the same language as a professional's (no contact actions). */
export default function SpeakerDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, language } = useLanguage();
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
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : common.notFound))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [slug, language, common.notFound]);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/events'));

  if (loading || error || !detail) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.stateWrap}>
          <ProfileTopBar onBack={back} />
          {loading ? (
            <LoadingState label={s.loading} />
          ) : (
            <ErrorState message={error || common.notFound} retryLabel={common.goBack} onRetry={back} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const facts = profileFacts(detail.info);
  const socials = ownSocials(detail.socials);
  const bio = detail.bio.trim();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <ScreenGlow color={colors.glow} rx={60} ry={55} cy={55} />
          <ProfileTopBar onBack={back} />
          <ProfileHero name={detail.name} role={tidyRole(detail.role)} imageUrl={detail.imageUrl} kind="person" />
        </View>

        {facts.length > 0 && <FactGrid facts={facts} />}

        {!!bio && (
          <SectionCard title={s.about}>
            <BodyText>{bio}</BodyText>
          </SectionCard>
        )}

        <FollowRow socials={socials} />
      </ScrollView>
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
    paddingBottom: grid(5),
    gap: grid(3),
  },
  top: {
    gap: grid(2),
  },
});
