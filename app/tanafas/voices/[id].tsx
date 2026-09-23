import React, { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sparkles, Trash2 } from 'lucide-react-native';
import DetailScreen from '@/components/DetailScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { fetchPost, deletePost, type VoicePost } from '@/lib/voices';

export default function VoicePostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, fonts } = useLanguage();
  const { session } = useAuth();
  const s = t.tanafas.voices;

  const [post, setPost] = useState<VoicePost | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    fetchPost(id).then(setPost);
  }, [id]);

  const isOwnPending = !!post && !!session && post.user_id === session.user.id && post.status === 'pending';

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
    gap: spacing.xxs,
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
});
