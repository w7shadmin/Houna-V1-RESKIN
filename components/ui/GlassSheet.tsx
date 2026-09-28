import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, layout } from '@/constants/theme';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { useDragToClose } from '@/hooks/useDragToClose';

const IN_MS = 650;
const OUT_MS = 360;
const SETTLE = Easing.bezier(0.2, 0.9, 0.25, 1);

interface GlassSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Tracked eyebrow and display title at the top of the sheet. */
  eyebrow: string;
  title: string;
  /** Spoken name of the backdrop that closes it. */
  closeLabel: string;
  children: React.ReactNode;
  /** Called once the sheet has sunk away after `visible` went false (a route can leave then). */
  onHidden?: () => void;
}

/**
 * A glass sheet over the current screen (canvas "Motion — the check-in as a glass sheet"):
 * the screen behind softens and dims, the frosted sheet rises from the bottom, and it sinks
 * back when closed, when the backdrop is tapped or when it is dragged down. For choices made in place, like the
 * Meditate hero's scene and length; the check-in is its own route with the same look.
 */
export default function GlassSheet({ visible, onClose, eyebrow, title, closeLabel, children, onHidden }: GlassSheetProps) {
  const { colors, isNight } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const enter = useRef(new Animated.Value(0)).current;
  // Stays mounted through the sinking animation, then goes.
  const [mounted, setMounted] = useState(visible);
  // Dragged down far or fast enough, it closes (from where the finger left it).
  const { drag, panHandlers } = useDragToClose(onClose, visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.setValue(0);
    }
    const anim = Animated.timing(enter, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : visible ? IN_MS : OUT_MS,
      easing: visible ? SETTLE : Easing.in(Easing.cubic),
      useNativeDriver: NATIVE,
    });
    anim.start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        onHidden?.();
      }
    });
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, enter, reduceMotion]);

  if (!mounted) return null;
  const tint = isNight ? 'dark' : 'light';
  const latin = fonts.labelTracked;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: enter }]}>
        <BlurView intensity={isNight ? 30 : 24} tint={tint} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: isNight ? alpha(colors.background, 0.45) : alpha(colors.text, 0.16) }]}
        />
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        {...panHandlers}
        style={[
          styles.sheet,
          {
            borderColor: colors.borderLight,
            paddingBottom: 24 + insets.bottom,
            transform: [{ translateY: Animated.add(enter.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }), drag) }],
          },
        ]}
      >
        <BlurView intensity={isNight ? 40 : 34} tint={tint} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.sheet, isNight ? 0.8 : 0.76) }]} />
        <View style={[styles.grabber, { backgroundColor: colors.faint }]} />
        <View style={styles.head}>
          <Text
            style={[
              latin ? styles.eyebrowLatin : styles.eyebrowArabic,
              { color: colors.tones.glow.text, fontFamily: latin ? fonts.labelRegular : fonts.label },
            ]}
          >
            {eyebrow}
          </Text>
          <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {title}
          </Text>
        </View>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    borderTopStartRadius: 30,
    borderTopEndRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    paddingTop: 12,
    paddingHorizontal: layout.screenPadding,
    gap: 16,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  head: {
    gap: 4,
    paddingHorizontal: 8,
  },
  eyebrowLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  titleArabic: {
    lineHeight: 44,
  },
});
