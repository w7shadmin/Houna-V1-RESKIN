import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Card from '@/components/ui/Card';
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
  const { colors } = useTheme();
  const common = t.directory.common;
  const visibleTags = tags?.slice(0, MAX_VISIBLE_TAGS) ?? [];
  const hiddenTagCount = (tags?.length ?? 0) - visibleTags.length;
  const resolvedImageUrl = resolveImageUrl(imageUrl);

  return (
    <Card onPress={onPress} accessibilityLabel={title} style={styles.card}>
      <View style={[styles.image, { backgroundColor: colors.control }]}>
        {!!resolvedImageUrl && (
          <Image source={{ uri: resolvedImageUrl }} style={styles.imageImg} resizeMode={imageResizeMode} />
        )}
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.title, { color: colors.text, fontFamily: fonts.semiBold }]}>
          {title}
        </Text>
        {!!subtitle && (
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.primary, fontFamily: fonts.medium }]}>
            {subtitle}
          </Text>
        )}
        {visibleTags.length > 0 && (
          <View style={styles.tagRow}>
            {visibleTags.map((tag, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: colors.tones.glow.bg, borderColor: colors.tones.glow.border }]}>
                <Text numberOfLines={1} style={[styles.tagText, { color: colors.tones.glow.fg, fontFamily: fonts.medium }]}>
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
    </Card>
  );
});

// Values from the canvas's "Professionals list" artboard.
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 22,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  imageImg: {
    width: '100%',
    height: '100%',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 13.5,
  },
  description: {
    fontSize: 13,
    lineHeight: 13 * 1.45,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  tag: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 12,
  },
  moreTagsText: {
    fontSize: 12,
  },
});
