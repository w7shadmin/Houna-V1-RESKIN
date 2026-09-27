import React from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { formatEntryDateLong } from '@/lib/journal';
import { currentHijri, formatHijri } from '@/lib/hijri';
import { SCENE_ORBS, type MeditationScene, type SceneId } from '@/components/meditation/scenes';
import CanvasIcon, { DirectionalIcon } from '@/components/ui/CanvasIcon';
import { NATIVE, useCalmLoop } from '@/hooks/useCalmLoop';

interface MeditateHeroProps {
  scene: MeditationScene;
  minutes: number | null;
  onScene: () => void;
  onLength: () => void;
  onBegin: () => void;
}

/**
 * The Tanafas hub's Meditate tab (canvas "Players — the Meditate tab as a hero"): the chosen
 * scene's own photo, softened and slowly drifting, behind today's date (Gregorian and Hijri), a
 * line to sit with, and a glowing play ring; below, Scene and Length open their glass sheets.
 * At night the photo shows deep; by day a pale wash keeps the screen light.
 */
export default function MeditateHero({ scene, minutes, onScene, onLength, onBegin }: MeditateHeroProps) {
  const { colors, isNight } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const h = t.discover.hub;
  const names = t.tanafas.meditation.scenes;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const orb = SCENE_ORBS[scene.id as SceneId];

  const drift = useCalmLoop((v) =>
    Animated.loop(Animated.timing(v, { toValue: 1, duration: 18000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE })),
  );
  const move = drift.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] });
  const translateX = move.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const translateY = move.interpolate({ inputRange: [0, 1], outputRange: [0, 14] });
  const scale = move.interpolate({ inputRange: [0, 1], outputRange: [1.05, 1.12] });

  const now = new Date();
  // The Hijri day turns at sunset, as on Home.
  const hijri = formatHijri(currentHijri(now).hijri, t.home.hijri.months, num);
  const length =
    minutes === null ? h.noLimit : `${num(minutes)} ${arabicPlural(minutes, t.tanafas.meditation.player.min)}`;
  const ink = colors.text;
  const soft = colors.textSecondary;

  return (
    <View style={styles.hero}>
      {/* The sky: the scene's photo (or its colours), blurred, drifting, washed and faded into the ground. */}
      <View style={styles.sky} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={[styles.photo, { transform: [{ translateX }, { translateY }, { scale }] }]}>
          {scene.thumbnail ? (
            <Image source={scene.thumbnail} blurRadius={28} resizeMode="cover" style={styles.fill} />
          ) : (
            <LinearGradient colors={[orb.hi, orb.c, orb.lo]} style={StyleSheet.absoluteFill} />
          )}
        </Animated.View>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isNight ? 'rgba(11,16,38,0.35)' : alpha(colors.background, 0.55) }]} />
        <LinearGradient colors={[alpha(colors.background, 0), colors.background]} locations={[0, 0.85]} style={styles.fade} />
      </View>

      <View style={styles.date}>
        <Text style={[styles.dateLabel, { color: soft, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label }, fonts.labelTracked && styles.tracked]}>
          {formatEntryDateLong(now, t.journal.dateNames, num)}
        </Text>
        {!!hijri && <Text style={[styles.hijri, { color: ink, fontFamily: isRTL ? fonts.display : fonts.numeral }]}>{hijri}</Text>}
      </View>

      <View style={styles.bottom}>
        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: soft, fontFamily: fonts.regular }]}>{`${h.meditate} · ${length}`}</Text>
          <Text accessibilityRole="header" style={[isRTL ? styles.lineArabic : styles.line, { color: ink, fontFamily: fonts.display }]}>
            {h.sceneLines[scene.id as SceneId]}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${h.begin} — ${names[scene.id as SceneId].name}`}
          onPress={onBegin}
          style={({ pressed }) => [
            styles.play,
            {
              borderColor: ink,
              backgroundColor: isNight ? alpha(colors.text, 0.05) : alpha('#FFFFFF', 0.35),
              boxShadow: `0 0 26px ${alpha(colors.tones.glow.hue, 0.45)}`,
            },
            pressed && styles.pressed,
          ]}
        >
          <CanvasIcon name="play" size={26} color={ink} />
        </Pressable>
      </View>

      <View style={styles.rows}>
        <Row label={h.scene} value={names[scene.id as SceneId].name} onPress={onScene} />
        <Row label={h.length} value={length} onPress={onLength} />
        <Text style={[styles.note, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{scene.video ? h.withVideo : h.soundOnly}</Text>
      </View>
    </View>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const { colors, isNight } = useTheme();
  const { fonts, isRTL } = useLanguage();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: isNight ? alpha(colors.text, 0.06) : alpha('#FFFFFF', 0.6), borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.rowLabel, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text, fontFamily: fonts.semiBold, textAlign: isRTL ? 'left' : 'right' }]}>{value}</Text>
      <DirectionalIcon isRTL={isRTL} name="chevron" size={18} strokeWidth={2} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: 'space-between',
  },
  sky: {
    position: 'absolute',
    left: -16,
    right: -16,
    top: -120,
    height: 640,
    overflow: 'hidden',
  },
  photo: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -40,
    bottom: -40,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -2,
    height: 322,
  },
  date: {
    paddingTop: 16,
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
  },
  tracked: {
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
  },
  hijri: {
    fontSize: 20,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  titleBlock: {
    flex: 1,
    gap: 8,
  },
  eyebrow: {
    fontSize: 15,
  },
  line: {
    fontSize: 40,
    lineHeight: 42,
    textTransform: 'uppercase',
  },
  lineArabic: {
    fontSize: 42,
    lineHeight: 56,
  },
  play: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rows: {
    gap: 12,
    paddingBottom: 8,
  },
  row: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  rowLabel: {
    fontSize: 15.5,
  },
  rowValue: {
    flex: 1,
    fontSize: 15.5,
  },
  note: {
    fontSize: 13,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
