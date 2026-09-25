import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { fetchResourceDetail, type ResourceDetailData } from '@/lib/hounaApi';
import { LoadingState, ErrorState } from '@/components/directory/AsyncState';

/**
 * `react-native-render-html`'s style engine doesn't support RN's logical
 * `marginStart`/`marginEnd` (it only maps physical CSS-style properties) —
 * unlike plain RN StyleSheet, it won't auto-flip these for RTL, so this is
 * one of the few places `isRTL` has to pick the physical side by hand.
 */
function getHtmlTagsStyles(isRTL: boolean) {
  const listIndent = isRTL ? { marginRight: 16 } : { marginLeft: 16 };
  return {
    p: { marginBottom: 10, marginTop: 0 },
    h1: { fontSize: 18, fontWeight: '700' as const, marginBottom: 8 },
    h2: { fontSize: 16, fontWeight: '700' as const, marginBottom: 8 },
    h3: { fontSize: 15, fontWeight: '600' as const, marginBottom: 6 },
    ul: { ...listIndent, marginBottom: 10 },
    ol: { ...listIndent, marginBottom: 10 },
    li: { marginBottom: 4 },
    strong: { fontWeight: '600' as const },
    a: { textDecorationLine: 'underline' as const },
  };
}

export default function ResourceDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, language, isRTL, fonts } = useLanguage();
  const { width } = useWindowDimensions();
  const s = t.directory.resources;
  const common = t.directory.common;

  const [detail, setDetail] = useState<ResourceDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    setActiveSection(0);
    try {
      const result = await fetchResourceDetail(slug, language);
      setDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : s.detailError);
    } finally {
      setLoading(false);
    }
  }, [slug, language, s.detailError]);

  useEffect(() => {
    load();
  }, [load]);

  const section = detail?.sections[activeSection];
  const contentWidth = Math.min(width, 430) - spacing.lg * 2 - (spacing.md + 4) * 2;
  const htmlTagsStyles = useMemo(() => getHtmlTagsStyles(isRTL), [isRTL]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { backgroundColor: colors.cardPressed },
          ]}
        >
          <View style={isRTL ? styles.flip : undefined}>
<ArrowLeft size={18} color={colors.text} />
</View>
        </Pressable>
      </View>

      {loading && !detail ? (
        <LoadingState label={s.detailLoading} />
      ) : (error || !detail) ? (
        <ErrorState message={error || s.detailError} retryLabel={common.tryAgain} onRetry={load} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{detail.title}</Text>

          {detail.sections.length > 0 && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScroll}
                contentContainerStyle={styles.tabsRow}
              >
                {detail.sections.map((sec, i) => {
                  const active = activeSection === i;
                  return (
                    <Pressable
                      key={sec.id}
                      onPress={() => setActiveSection(i)}
                      style={({ pressed }) => [
                        styles.tab,
                        active
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                        pressed && !active && { backgroundColor: colors.cardPressed },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          { fontFamily: fonts.semiBold, color: active ? colors.onPrimary : colors.textSecondary, lineHeight: typography.lineHeight.xs },
                        ]}
                      >
                        {sec.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {section && (
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card }]}>
                  <Text style={[styles.sectionHeading, { color: colors.primary, fontFamily: fonts.bold }]}>
                    {section.heading}
                  </Text>
                  <RenderHTML
                    contentWidth={contentWidth}
                    source={{ html: section.content }}
                    tagsStyles={htmlTagsStyles}
                    baseStyle={{
                      color: colors.textSecondary,
                      fontFamily: fonts.regular,
                      fontSize: typography.fontSize.sm,
                      lineHeight: typography.lineHeight.body,
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  />
                </View>
              )}
            </>
          )}

          {detail.sections.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                {s.noContent}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xl,
  },
  tabsScroll: {
    marginTop: spacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  tab: {
    height: 32,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: typography.fontSize.xs,
  },
  sectionCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md + 4,
    marginTop: spacing.sm,
  },
  sectionHeading: {
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.sm,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
