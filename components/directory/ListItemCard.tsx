import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';
import { resolveImageUrl } from '@/lib/hounaApi';

/** Tags beyond this many collapse into a "+N more" label rather than wrapping indefinitely. */
const MAX_VISIBLE_TAGS = 3;

interface ListItemCardProps {
  imageUrl: string | null;
  title: string;
  subtitle?: string;
  description?: string;
  /** Service/specialty pills shown under the title instead of `description` — e.g. a wellness center's services. */
  tags?: string[];
  onPress: () => void;
  imageResizeMode?: 'cover' | 'contain';
}

/**
 * Memoized — this renders inside long FlatLists (professionals can run to
 * ~300 rows via infinite scroll), and without this every already-mounted
 * row re-renders whenever the list's backing array changes (e.g. on each
 * page appended), which is exactly what triggers RN's own "large list slow
 * to update" warning.
 */
export default React.memo(function ListItemCard({
  imageUrl,
  title,
  subtitle,
  description,
  tags,
  onPress,
  imageResizeMode = 'cover',
}: ListItemCardProps) {
  const { t, isRTL, fonts } = useLanguage();
  const common = t.directory.common;
  const visibleTags = tags?.slice(0, MAX_VISIBLE_TAGS) ?? [];
  const hiddenTagCount = (tags?.length ?? 0) - visibleTags.length;
  const resolvedImageUrl = resolveImageUrl(imageUrl);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.image, { backgroundColor: colors.surface }]}>
        {!!resolvedImageUrl && (
          <Image source={{ uri: resolvedImageUrl }} style={styles.imageImg} resizeMode={imageResizeMode} />
        )}
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>
          {title}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.primary, fontFamily: fonts.semiBold }]}>
            {subtitle}
          </Text>
        )}
        {visibleTags.length > 0 && (
          <View style={styles.tagRow}>
            {visibleTags.map((tag, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: colors.primaryLightest }]}>
                <Text numberOfLines={1} style={[styles.tagText, { color: colors.primary, fontFamily: fonts.medium }]}>
                  {tag}
                </Text>
              </View>
            ))}
            {hiddenTagCount > 0 && (
              <Text style={[styles.moreTagsText, { color: colors.textTertiary, fontFamily: fonts.medium }]}>
                {common.moreCount(isRTL ? arabicNumber(hiddenTagCount) : String(hiddenTagCount))}
              </Text>
            )}
          </View>
        )}
        {!!description && (
          <Text
            numberOfLines={2}
            style={[styles.description, { color: colors.textTertiary, fontFamily: fonts.regular }]}
          >
            {description}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
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
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  imageImg: {
    width: '100%',
    height: '100%',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  description: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xxs + 2,
    marginTop: spacing.xxs + 2,
  },
  tag: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
  },
  moreTagsText: {
    fontSize: typography.fontSize.xs,
  },
});
