import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { Award, HeartHandshake, Users, RotateCw, ChevronRight } from 'lucide-react-native';
import DetailScreen from '@/components/DetailScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchAbout, resolveImageUrl, type AboutData, type TeamMember } from '@/lib/hounaApi';

/** Freepik's license requires crediting the Home community map's source art (constants/worldDots.ts). */
const FREEPIK_URL = 'https://www.freepik.com';

// Members who've left since this content was scraped — filtered client-side
// rather than waiting on the source site to update, matching the old MVP.
const REMOVED = new Set([
  'Dania Haffar Bazzy', 'Jinky Salcedo', 'Laila Ibrahim',
  'دانيا حفار بزي', 'جينكي سالسيدو', 'ليلى إبراهيم',
]);

export default function AboutScreen() {
  const { colors } = useTheme();
  const { t, language, fonts } = useLanguage();
  const s = t.about;

  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAbout(language));
    } catch (err) {
      setError(err instanceof Error ? err.message : s.error);
    } finally {
      setLoading(false);
    }
  }, [language, s.error]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRetry = () => {
    setData(null);
    load();
  };

  const renderMember = (member: TeamMember) => (
    <View
      key={`${member.name}-${member.profileId}`}
      style={[styles.memberRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.memberAvatar, { backgroundColor: colors.surface }]}>
        {!!resolveImageUrl(member.imageUrl) && (
          <Image source={{ uri: resolveImageUrl(member.imageUrl)! }} style={styles.memberAvatarImg} resizeMode="cover" />
        )}
      </View>
      <View style={styles.memberText}>
        <Text style={[styles.memberName, { color: colors.text, fontFamily: fonts.bold }]}>{member.name}</Text>
        {!!member.role && (
          <Text style={[styles.memberRole, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            {member.role}
          </Text>
        )}
        {!!member.bio && (
          <Text
            numberOfLines={2}
            style={[styles.memberBio, { color: colors.textTertiary, fontFamily: fonts.regular }]}
          >
            {member.bio}
          </Text>
        )}
      </View>
      {!!member.profileId && <ChevronRight size={18} color={colors.textTertiary} />}
    </View>
  );

  const renderSection = (title: string, Icon: typeof Award, members: TeamMember[]) => {
    if (members.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon size={18} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fonts.bold }]}>{title}</Text>
        </View>
        <View style={styles.memberList}>{members.map(renderMember)}</View>
      </View>
    );
  };

  let content: React.ReactNode;

  if (loading && !data) {
    content = (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.stateText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
          {s.loading}
        </Text>
      </View>
    );
  } else if (error && !data) {
    content = (
      <View style={styles.centerState}>
        <View style={[styles.errorIcon, { backgroundColor: colors.accent + '18' }]}>
          <RotateCw size={24} color={colors.accent} />
        </View>
        <Text style={[styles.stateText, { color: colors.text, fontFamily: fonts.semiBold }]}>{error}</Text>
        <Pressable
          onPress={handleRetry}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.9 },
          ]}
        >
          <RotateCw size={16} color={colors.onPrimary} />
          <Text style={[styles.retryText, { color: colors.onPrimary, fontFamily: fonts.semiBold, lineHeight: typography.lineHeight.sm }]}>{s.retry}</Text>
        </Pressable>
      </View>
    );
  } else if (data) {
    const founder = data.members.filter((m) => m.section === 'founder' && !REMOVED.has(m.name));
    const advisor = data.members.filter((m) => m.section === 'advisor' && !REMOVED.has(m.name));
    const team = data.members.filter((m) => m.section === 'team' && !REMOVED.has(m.name));

    content = (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!!data.youAreHouna && (
          <View style={[styles.introCard, { backgroundColor: colors.primaryLightest }]}>
            <Text style={[styles.introTitle, { color: colors.primary, fontFamily: fonts.bold }]}>
              {s.youAreHouna}
            </Text>
            <Text style={[styles.introBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {data.youAreHouna}
            </Text>
          </View>
        )}

        {!!data.vision && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.primary, fontFamily: fonts.bold }]}>{s.vision}</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {data.vision}
            </Text>
          </View>
        )}
        {!!data.mission && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.primary, fontFamily: fonts.bold }]}>{s.mission}</Text>
            <Text style={[styles.cardBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
              {data.mission}
            </Text>
          </View>
        )}

        {renderSection(s.founder, Award, founder)}
        {renderSection(s.advisor, HeartHandshake, advisor)}
        {renderSection(s.team, Users, team)}

        {!!(error && data) && (
          <View style={[styles.inlineError, { backgroundColor: colors.accent + '14', borderColor: colors.accent + '30' }]}>
            <Text style={[styles.inlineErrorText, { color: colors.accent, fontFamily: fonts.regular }]}>{error}</Text>
            <Pressable onPress={handleRetry} style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <Text style={[styles.inlineRetryText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                {s.retry}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.credits}>
          <Text style={[styles.creditsTitle, { color: colors.textTertiary, fontFamily: fonts.semiBold }]}>{s.credits}</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL(FREEPIK_URL).catch(() => {})}
            style={({ pressed }) => pressed && { opacity: 0.6 }}
          >
            <Text style={[styles.creditsText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.mapCredit}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <DetailScreen title={t.more.about}>
      {content}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: spacing.xxl,
  },
  credits: {
    marginTop: spacing.xl,
    gap: spacing.xs,
    alignItems: 'center',
  },
  creditsTitle: {
    fontSize: typography.fontSize.xs,
  },
  creditsText: {
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  stateText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  errorIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  retryBtn: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  retryText: {
    fontSize: typography.fontSize.sm,
  },
  introCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: typography.fontSize.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  introBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
  },
  memberList: {
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 4,
  },
  memberAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  memberAvatarImg: {
    width: '100%',
    height: '100%',
  },
  memberText: {
    flex: 1,
  },
  memberName: {
    fontSize: typography.fontSize.sm,
  },
  memberRole: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  memberBio: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    marginTop: 2,
  },
  inlineError: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  inlineErrorText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  inlineRetryText: {
    fontSize: typography.fontSize.xs,
  },
});
