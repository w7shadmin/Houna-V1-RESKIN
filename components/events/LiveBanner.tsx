import React from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid } from '@/constants/theme';
import { NATIVE, useCalmLoop } from '@/hooks/useCalmLoop';
import { arabicNumber } from '@/lib/arabicNumerals';
import type { LiveEvent, LiveState } from '@/lib/liveEvent';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';

/** "7:00 PM" / "٧:٠٠ م", in the phone's own time zone. */
export function liveTime(ms: number, isRTL: boolean, am: string, pm: string): string {
  const d = new Date(ms);
  const h = d.getHours(), m = d.getMinutes();
  const hh = String(h % 12 || 12), mm = String(m).padStart(2, '0');
  return isRTL ? `${arabicNumber(Number(hh))}:${arabicNumber(Number(mm[0]))}${arabicNumber(Number(mm[1]))} ${h < 12 ? am : pm}` : `${hh}:${mm} ${h < 12 ? am : pm}`;
}

/**
 * A Houna event streaming on YouTube (app_config.live_event): "Live now" with a breathing dot while
 * it's on, "Starting at 7:00 PM" in the hour before. Opens the stream (app/live.tsx). Home and
 * Events show it; nothing renders when no event is set or it's outside its window.
 */
export default function LiveBanner({ event, state, style }: { event: LiveEvent | null; state: LiveState | null; style?: object }) {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const s = t.events.live;
  const pulse = useCalmLoop((v) =>
    Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
      Animated.timing(v, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE }),
    ])),
  );
  if (!event || !state) return null;

  const live = state === 'live';
  const title = isRTL ? event.titleAr : event.titleEn;
  const time = liveTime(event.startsAt, isRTL, t.events.list.am, t.events.list.pm);
  const status = live ? s.now : s.soon.replace('{time}', time);
  const tone = colors.tones.dawn;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={(live ? s.a11yNow : s.a11ySoon).replace('{time}', time).replace('{title}', title)}
      onPress={() => router.push('/live')}
      style={({ pressed }) => [styles.banner, { backgroundColor: tone.bg, borderColor: tone.border }, pressed && styles.pressed, style]}
    >
      <View style={styles.dotBox}>
        {live && (
          <Animated.View
            style={[styles.dotHalo, { backgroundColor: tone.fg, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }] }]}
          />
        )}
        <View style={[styles.dot, live ? { backgroundColor: tone.fg } : { borderWidth: 2, borderColor: tone.fg }]} />
      </View>
      <View style={styles.text}>
        <Text
          style={[fonts.labelTracked ? styles.statusLatin : styles.statusArabic, { color: tone.text, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.semiBold }]}
          numberOfLines={1}
        >
          {status}
        </Text>
        <Text style={[styles.title, { color: colors.text, fontFamily: fonts.medium }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <DirectionalIcon isRTL={isRTL} name="chevron" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 56,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
    paddingVertical: grid(1),
    paddingStart: grid(2),
    paddingEnd: grid(2),
  },
  pressed: {
    opacity: 0.85,
  },
  dotBox: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotHalo: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    flex: 1,
    gap: grid(0.5),
  },
  statusLatin: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  statusArabic: {
    fontSize: 13,
  },
  title: {
    fontSize: 15,
  },
});
