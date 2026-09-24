import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, MessageCircle, Sparkles, ImageIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import { fetchApprovedPosts, fetchMyPosts, type VoicePost } from '@/lib/voices';

type Tab = 'feed' | 'mine';

export default function VoicesScreen() {
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const { session, isGuest } = useAuth();
  const s = t.tanafas.voices;

  const [tab, setTab] = useState<Tab>('feed');
  const [feed, setFeed] = useState<VoicePost[]>([]);
  const [mine, setMine] = useState<VoicePost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const posts = await fetchApprovedPosts();
    setFeed(posts);
    if (session) setMine(await fetchMyPosts(session.user.id));
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSubmitPress = () => {
    if (isGuest) {
      router.push('/account/sign-in');
      return;
    }
    router.push('/tanafas/voices/submit');
  };

  const statusLabel = (status: VoicePost['status']) =>
    status === 'pending' ? s.statusPending : status === 'approved' ? s.statusApproved : s.statusRejected;
  const statusColor = (status: VoicePost['status']) =>
    status === 'approved' ? colors.primary : status === 'rejected' ? colors.textTertiary : colors.accent;

  const list = tab === 'feed' ? feed : mine;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{s.feedTitle}</Text>
        <Pressable
          onPress={handleSubmitPress}
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.85 }]}
        >
          <Plus size={16} color={colors.onPrimary} strokeWidth={2.4} />
          <Text style={[styles.submitBtnText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>{s.submit}</Text>
        </Pressable>
      </View>

      {!!session && (
        <View style={[styles.tabRow, { borderColor: colors.border }]}>
          <Pressable onPress={() => setTab('feed')} style={[styles.tabBtn, tab === 'feed' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: tab === 'feed' ? colors.primary : colors.textSecondary, fontFamily: fonts.semiBold }]}>
              {s.feedTitle}
            </Text>
          </Pressable>
          <Pressable onPress={() => setTab('mine')} style={[styles.tabBtn, tab === 'mine' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: tab === 'mine' ? colors.primary : colors.textSecondary, fontFamily: fonts.semiBold }]}>
              {s.mySubmissions}
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        ) : list.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageCircle size={28} color={colors.textTertiary} strokeWidth={1.5} />
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{s.feedEmpty}</Text>
          </View>
        ) : (
          list.map((post) => {
            const displayTitle = post.title || (post.body ? post.body.slice(0, 60) : null);
            return (
              <Pressable
                key={post.id}
                onPress={() => router.push({ pathname: '/tanafas/voices/[id]', params: { id: post.id } })}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.cardImage, { backgroundColor: colors.surface }]}>
                  {post.image_url ? (
                    <Image source={{ uri: post.image_url }} style={styles.cardImageImg} resizeMode="cover" />
                  ) : (
                    <ImageIcon size={20} color={colors.textTertiary} strokeWidth={1.6} />
                  )}
                </View>
                <View style={styles.cardText}>
                  {!!displayTitle && (
                    <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.text, fontFamily: fonts.bold }]}>
                      {displayTitle}
                    </Text>
                  )}
                  {tab === 'feed' ? (
                    <Text numberOfLines={1} style={[styles.cardUsername, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                      @{post.username}
                    </Text>
                  ) : (
                    <Text style={[styles.cardStatus, { color: statusColor(post.status), fontFamily: fonts.semiBold }]}>
                      {statusLabel(post.status)}
                    </Text>
                  )}
                  {!!post.for_meditation && (
                    <View style={styles.badgeRow}>
                      <Sparkles size={11} color={colors.textTertiary} strokeWidth={2} />
                      <Text style={[styles.badgeText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                        {s.forMeditationBadge}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xxl,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  submitBtnText: {
    fontSize: typography.fontSize.sm,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.lg,
  },
  tabBtn: {
    paddingVertical: spacing.sm,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm + 4,
  },
  loading: {
    paddingVertical: spacing.xxl,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 4,
  },
  pressed: {
    opacity: 0.85,
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardImageImg: {
    width: '100%',
    height: '100%',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
  },
  cardUsername: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  cardStatus: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xxs + 2,
  },
  badgeText: {
    fontSize: 10,
  },
});
