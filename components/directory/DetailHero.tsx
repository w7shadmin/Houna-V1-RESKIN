import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, radius } from '@/constants/theme';

interface DetailHeroProps {
  imageUrl: string | null;
  imageResizeMode?: 'cover' | 'contain';
  height?: number;
}

export default function DetailHero({ imageUrl, imageResizeMode = 'cover', height = 200 }: DetailHeroProps) {
  const router = useRouter();
  const { isRTL } = useLanguage();

  return (
    <View style={[styles.hero, { height, backgroundColor: palette.turquoise }]}>
      {imageUrl && imageResizeMode === 'contain' ? (
        <View style={styles.imageContainWrap}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        </View>
      ) : (
        imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={({ pressed }) => [
          styles.backBtn,
          { backgroundColor: pressed ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.9)' },
        ]}
      >
        <ArrowLeft size={20} color={colors.text} style={isRTL ? styles.flip : undefined} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageContainWrap: {
    width: '100%',
    height: '100%',
    padding: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    start: 16,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
});
