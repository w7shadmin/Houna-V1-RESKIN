import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Flag, Sparkles, Trash2, UserX } from 'lucide-react-native';
import DetailScreen from '@/components/DetailScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchPost, deletePost, reportPost, blockAuthor, REPORT_REASONS, type VoicePost, type ReportReason } from '@/lib/voices';

export default function VoicePostScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const s = t.tanafas.voices;

  const [post, setPost] = useState<VoicePost | null | undefined>(undefined);
  // Report: choosing a reason, then sent or failed. Block: done.
  const [reporting, setReporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPost(id).then(setPost);
  }, [id]);

  const isOwnPending = !!post && !!post.is_mine && post.status === 'pending';
  // Anyone (Guests too) can report or block someone else's approved post.
  const canReport = !!post && !post.is_mine && post.status === 'approved';

  const sendReport = async (reason: ReportReason) => {
    if (!post || busy) return;
    setBusy(true);
    const ok = await reportPost(post.id, reason);
    setBusy(false);
    setReporting(false);
    setNotice(ok ? s.reportSent : s.reportFailed);
  };

  const handleBlock = () => {
    if (!post) return;
    const name = post.username ?? '';
    Alert.alert(s.blockConfirmTitle.replace('{name}', name), s.blockConfirmBody, [
      { text: s.cancel, style: 'cancel' },
      {
        text: s.block.replace('{name}', name),
        style: 'destructive',
        onPress: async () => {
          const ok = await blockAuthor(post.id);
          setNotice(ok ? s.blocked : s.reportFailed);
        },
      },
    ]);
  };

  const handleWithdraw = () => {
    if (!post) return;
    Alert.alert(s.withdrawConfirmTitle, s.withdrawConfirmBody, [
      { text: s.cancel, style: 'cancel' },
      {
        text: s.withdraw,
        style: 'destructive',
        onPress: async () => {
          await deletePost(post.id);
          router.back();
        },
      },
    ]);
  };

  if (post === undefined) {
    return (
      <DetailScreen title={s.feedTitle}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </DetailScreen>
    );
  }

  if (post === null) {
    return (
      <DetailScreen title={s.feedTitle}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.feedEmpty}</Text>
        </View>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen title={post.title || s.feedTitle}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!!post.image_url && <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />}

        {!!post.title && (
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{post.title}</Text>
        )}
        <Text style={[styles.username, { color: colors.primary, fontFamily: fonts.semiBold }]}>@{post.username}</Text>

        {!!post.for_meditation && (
          <View style={styles.badgeRow}>
            <Sparkles size={12} color={colors.textTertiary} strokeWidth={2} />
            <Text style={[styles.badgeText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
              {s.forMeditationBadge}
            </Text>
          </View>
        )}

        {!!post.body && (
          <Text style={[styles.body, { color: colors.text, fontFamily: fonts.regular }]}>{post.body}</Text>
        )}

        {isOwnPending && (
          <Pressable
            onPress={handleWithdraw}
            style={({ pressed }) => [styles.withdrawBtn, { borderColor: colors.border }, pressed && { backgroundColor: colors.cardPressed }]}
          >
            <Trash2 size={16} color={colors.accent} strokeWidth={1.8} />
            <Text style={[styles.withdrawText, { color: colors.accent, fontFamily: fonts.semiBold }]}>{s.withdraw}</Text>
          </Pressable>
        )}

        {canReport && !notice && (
          <View style={styles.safety}>
            {reporting ? (
              <>
                <Text style={[styles.safetyTitle, { color: colors.text, fontFamily: fonts.semiBold }]}>{s.reportTitle}</Text>
                {REPORT_REASONS.map((reason) => (
                  <Pressable
                    key={reason}
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => sendReport(reason)}
                    style={({ pressed }) => [styles.reason, { borderColor: colors.border }, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={[styles.reasonText, { color: colors.text, fontFamily: fonts.regular }]}>{s.reportReasons[reason]}</Text>
                  </Pressable>
                ))}
                <Pressable accessibilityRole="button" onPress={() => setReporting(false)} hitSlop={8}>
                  <Text style={[styles.safetyLink, { color: colors.textSecondary, fontFamily: fonts.medium }]}>{s.cancel}</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.safetyRow}>
                <Pressable accessibilityRole="button" onPress={() => setReporting(true)} hitSlop={8} style={({ pressed }) => [styles.safetyAction, pressed && { opacity: 0.85 }]}>
                  <Flag size={16} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[styles.safetyLink, { color: colors.textSecondary, fontFamily: fonts.medium }]}>{s.report}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={handleBlock} hitSlop={8} style={({ pressed }) => [styles.safetyAction, pressed && { opacity: 0.85 }]}>
                  <UserX size={16} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[styles.safetyLink, { color: colors.textSecondary, fontFamily: fonts.medium }]}>
                    {s.block.replace('{name}', post.username ?? '')}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {!!notice && (
          <Text accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
            {notice}
          </Text>
        )}
      </ScrollView>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    marginTop: spacing.xxl,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
  },
  notFoundText: {
    fontSize: typography.fontSize.sm,
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.xs,
  },
  username: {
    fontSize: typography.fontSize.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
  },
  body: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.lg,
    marginTop: spacing.md,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },
  withdrawText: {
    fontSize: typography.fontSize.sm,
  },
  safety: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  safetyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  safetyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  safetyTitle: {
    fontSize: typography.fontSize.body,
  },
  safetyLink: {
    fontSize: typography.fontSize.sm,
  },
  reason: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  reasonText: {
    fontSize: typography.fontSize.sm,
  },
  notice: {
    marginTop: spacing.xl,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.md,
  },
});
