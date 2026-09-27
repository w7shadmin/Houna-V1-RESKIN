import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { alpha, layout } from '@/constants/theme';
import { isBadgeCode, type BadgeCode } from '@/lib/badges';
import { getBadgeShares } from '@/lib/streaks';
import { arabicNumber } from '@/lib/arabicNumerals';
import BadgeGem from '@/components/badges/BadgeGem';
import Button from '@/components/ui/Button';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';

const GEM = 160;
const PARTS = 14;
/** Each badge's light, for its bloom and the sparks. */
const BLOOM: Record<BadgeCode, string> = {
  streak_3: '#F9A980',
  streak_7: '#F9A980',
  streak_14: '#F9A980',
  streak_30: '#6FD6CF',
  streak_100: '#6FD6CF',
  first_session: '#6FD6CF',
  all_breathing: '#B3A7F5',
  all_scenes: '#8F9BF0',
  all_skies: '#EA90A8',
};

/**
 * The unlock moment (canvas "Phase 6 — the unlock moment"), opened by useBadgeCheck with the
 * badges just earned (`codes`): the screen behind softens, the gem rises into a bloom of its own
 * light with sparks, and the words arrive: "New badge", its name, its line, how many of Houna
 * hold it. "Lovely" moves to the next, or closes. Nothing else is asked. Under Reduce Motion it
 * simply appears.
 */
export default function BadgeUnlock() {
  const { colors, isNight } = useTheme();
  const { t, isRTL } = useLanguage();
  const b = t.badges;
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const params = useLocalSearchParams<{ codes?: string }>();
  const codes = (params.codes ?? '').split(',').filter(isBadgeCode);
  const [index, setIndex] = useState(0);
  const [shares, setShares] = useState<Record<string, number>>({});
  const code = codes[index];

  const veil = useRef(new Animated.Value(0)).current;
  const leaving = useRef(false);
  useEffect(() => {
    Animated.timing(veil, { toValue: 1, duration: reduceMotion ? 0 : 700, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start();
    getBadgeShares().then(setShares).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Back (or the last "Lovely") lifts the veil first.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (leaving.current) return;
        e.preventDefault();
        leaving.current = true;
        Animated.timing(veil, { toValue: 0, duration: reduceMotion ? 0 : 400, easing: Easing.in(Easing.quad), useNativeDriver: NATIVE }).start(() =>
          navigation.dispatch(e.data.action),
        );
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, reduceMotion],
  );

  const next = () => {
    if (index < codes.length - 1) setIndex(index + 1);
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  if (!code) return null;
  const share = shares[code];
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: veil }]}>
      <BlurView intensity={isNight ? 30 : 24} tint={isNight ? 'dark' : 'light'} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.background, isNight ? 0.62 : 0.7) }]} />
      <Moment
        key={`${code}${index}`}
        code={code}
        still={reduceMotion}
        name={b.names[code]}
        line={b.lines[code]}
        held={share !== undefined ? b.held.replace('{n}', isRTL ? arabicNumber(share) : String(share)) : ''}
        eyebrow={b.newBadge}
      />
      <View style={[styles.action, { paddingBottom: insets.bottom + 32 }]}>
        <Button variant="glow" label={b.lovely} onPress={next} block />
      </View>
    </Animated.View>
  );
}

function Moment({
  code,
  still,
  name,
  line,
  held,
  eyebrow,
}: {
  code: BadgeCode;
  still: boolean;
  name: string;
  line: string;
  held: string;
  eyebrow: string;
}) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const rise = useRef(new Animated.Value(still ? 1 : 0)).current;
  const bloom = useRef(new Animated.Value(still ? 1 : 0)).current;
  const spark = useRef(new Animated.Value(still ? 1 : 0)).current;
  const words = useRef([0, 1, 2, 3].map(() => new Animated.Value(still ? 1 : 0))).current;

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${eyebrow}. ${name}. ${line}`);
    if (still) return;
    const t = (v: Animated.Value, delay: number, duration: number, easing = Easing.bezier(0.2, 0.8, 0.2, 1)) =>
      Animated.sequence([Animated.delay(delay), Animated.timing(v, { toValue: 1, duration, easing, useNativeDriver: NATIVE })]);
    const anim = Animated.parallel([
      t(rise, 300, 1100),
      t(bloom, 700, 1600, Easing.out(Easing.quad)),
      t(spark, 800, 1600, Easing.bezier(0.2, 0.7, 0.3, 1)),
      ...words.map((v, i) => t(v, 1300 + i * 200, 700, Easing.out(Easing.quad))),
    ]);
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const light = BLOOM[code];
  const up = (v: Animated.Value) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] });

  return (
    <View style={styles.moment} pointerEvents="none">
      <View style={styles.stage}>
        <Animated.View
          style={[
            styles.bloom,
            {
              backgroundColor: alpha(light, 0.35),
              boxShadow: `0 0 90px 40px ${alpha(light, 0.35)}`,
              opacity: bloom.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0.55] }),
              transform: [{ scale: bloom.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.3] }) }],
            },
          ]}
        />
        {!still &&
          Array.from({ length: PARTS }, (_, i) => {
            const a = (i / PARTS) * 2 * Math.PI;
            const d = 110 + (i % 3) * 30;
            return (
              <Animated.View
                key={i}
                style={[
                  styles.spark,
                  {
                    backgroundColor: [light, colors.text, colors.tones.bloom.hue][i % 3],
                    boxShadow: `0 0 8px ${light}`,
                    opacity: spark.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                    transform: [
                      { translateX: spark.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(a) * d] }) },
                      { translateY: spark.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(a) * d] }) },
                      { scale: spark.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) },
                    ],
                  },
                ]}
              />
            );
          })}
        <Animated.View
          style={{
            opacity: rise.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
            transform: [
              { translateY: rise.interpolate({ inputRange: [0, 0.6, 1], outputRange: [70, -6, 0] }) },
              { scale: rise.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.6, 1.04, 1] }) },
            ],
          }}
        >
          <BadgeGem code={code} size={GEM} />
        </Animated.View>
      </View>
      <View style={styles.words}>
        <Animated.Text
          style={[
            fonts.labelTracked ? styles.eyebrowLatin : styles.eyebrowArabic,
            { color: colors.tones.dawn.text, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label },
            up(words[0]),
          ]}
        >
          {eyebrow}
        </Animated.Text>
        <Animated.Text style={[styles.name, isRTL && styles.nameArabic, { color: colors.text, fontFamily: fonts.display }, up(words[1])]}>{name}</Animated.Text>
        <Animated.Text style={[styles.line, { color: colors.textSecondary, fontFamily: fonts.regular }, up(words[2])]}>{line}</Animated.Text>
        {!!held && <Animated.Text style={[styles.held, { color: colors.textTertiary, fontFamily: fonts.regular }, up(words[3])]}>{held}</Animated.Text>}
      </View>
      {/* Keeps the words clear of the button. */}
      <Text style={styles.spacer}> </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  moment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    paddingHorizontal: layout.screenPadding,
  },
  stage: {
    width: GEM,
    height: GEM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloom: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  spark: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  words: {
    alignItems: 'center',
    gap: 8,
    maxWidth: 320,
  },
  eyebrowLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13,
  },
  name: {
    fontSize: 40,
    lineHeight: 48,
    textAlign: 'center',
  },
  nameArabic: {
    lineHeight: 64,
  },
  line: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  held: {
    fontSize: 13,
    textAlign: 'center',
  },
  spacer: {
    height: 88,
  },
  action: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 60,
  },
});
