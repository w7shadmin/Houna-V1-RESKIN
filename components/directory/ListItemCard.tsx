import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, radius, typography, shadows } from '@/constants/theme';

interface ListItemCardProps {
  imageUrl: string | null;
  title: string;
  subtitle?: string;
  description?: string;
  onPress: () => void;
  imageResizeMode?: 'cover' | 'contain';
}

export default function ListItemCard({
  imageUrl,
  title,
  subtitle,
  description,
  onPress,
  imageResizeMode = 'cover',
}: ListItemCardProps) {
  const { fonts } = useLanguage();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
        pressed && { backgroundColor: colors.cardPressed },
      ]}
    >
      <View style={[styles.image, { backgroundColor: colors.surface }]}>
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.imageImg} resizeMode={imageResizeMode} />
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
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm + 4,
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
});
