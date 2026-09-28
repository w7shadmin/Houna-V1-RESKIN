import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, layout } from '@/constants/theme';
import { NATIVE, useReduceMotion } from '@/hooks/useCalmLoop';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { currentMood, getTodayEntry, logMoodForToday, localDateString, type MoodTag } from '@/lib/journal';
import { pingMoodAndGetCount } from '@/lib/moodPings';
import { supabase } from '@/lib/supabase';
import { BLOOM_ORDER, BreathingBloom } from '@/components/mood/MoodBloom';
import MoodSlider from '@/components/mood/MoodSlider';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon from '@/components/ui/CanvasIcon';
import KeyboardSafeView from '@/components/ui/KeyboardSafeView';
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';
import { useDragToClose } from '@/hooks/useDragToClose';

/** Neutral — the starting point when today has no mood yet (never presume "calm"). */
const DEFAULT_INDEX = BLOOM_ORDER.indexOf('neutral');

const IN_MS = 700;
const OUT_MS = 380;
/** The sheet's settle: fast out of the gate, a long soft landing. */
const SETTLE = Easing.bezier(0.2, 0.9, 0.25, 1);

/**
 * One part of the sheet arriving: it fades up a little after the one before, riding the
 * sheet's own entrance, so on the way out they leave together with it.
 */
function Arrive({ enter, index, children }: { enter: Animated.Value; index: number; children: React.ReactNode }) {
  const from = 0.3 + index * 0.1;
  const to = Math.min(from + 0.4, 1);
  return (
    <Animated.View
      style={{
        opacity: enter.interpolate({ inputRange: [0, from, to], outputRange: [0, 0, 1], extrapolate: 'clamp' }),
        transform: [{ translateY: enter.interpolate({ inputRange: [0, from, to], outputRange: [18, 18, 0], extrapolate: 'clamp' }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Houna bloom mood check-in (FEATURES_BRIEF §2), opened from Home's
 * top-left button. The slider snaps across the seven moods (`MOOD_ORDER`,
 * heavy → light) and Save calls `logMoodForToday`; older entries with a
 * retired mood keep it, and open here at its place on today's scale. No streaks, counts of your own, or pressure — the
 * only number shown is how many others felt the same today.
 *
 * It's a glass sheet (canvas "Motion — the check-in as a glass sheet"): the screen that
 * opened it stays in view, softened and dimmed, and the frosted sheet rises over it, its
 * parts arriving one after another. Tapping outside, closing or saving sinks it back.
 */
export default function CheckInScreen() {
  const { colors, isNight } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const s = t.checkIn;

  // 0 → 1: the backdrop softens and the sheet rises; back to 0 on the way out.
  const enter = useRef(new Animated.Value(0)).current;
  const leaving = useRef(false);
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: reduceMotion ? 0 : IN_MS, easing: SETTLE, useNativeDriver: NATIVE }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const sinkThen = (then: () => void) => {
    if (leaving.current) return;
    leaving.current = true;
    Animated.timing(enter, { toValue: 0, duration: reduceMotion ? 0 : OUT_MS, easing: Easing.in(Easing.cubic), useNativeDriver: NATIVE }).start(() => then());
  };
  // Back gestures and the hardware back button sink it too, rather than cutting it away.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (leaving.current) return;
        e.preventDefault();
        sinkThen(() => navigation.dispatch(e.data.action));
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation],
  );

  const [index, setIndex] = useState(DEFAULT_INDEX);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [othersToday, setOthersToday] = useState<number | null>(null);
  /** The mood already logged today, if any — its own anonymous ping is in the count. */
  const [savedMood, setSavedMood] = useState<MoodTag | null>(null);

  const mood = BLOOM_ORDER[index];
  const moodLabel = t.journal.moodLabelsFull[mood];

  // Start from today's mood if one is already logged.
  useEffect(() => {
    getTodayEntry()
      .then((entry) => {
        if (!entry) return;
        setSavedMood(entry.mood);
        // An older entry may hold a retired mood; start from its place on today's scale.
        setIndex(BLOOM_ORDER.indexOf(currentMood(entry.mood)));
      })
      .catch(() => {});
  }, []);

  // "You're not alone": how many others logged this mood today. Read-only
  // here — the anonymous ping itself is only sent on save.
  useEffect(() => {
    let alive = true;
    setOthersToday(null);
    const id = setTimeout(() => {
      supabase
        .rpc('get_mood_ping_count', { p_mood_tag: mood, p_date: localDateString(new Date()) })
        .then(({ data, error: rpcError }) => {
          if (alive && !rpcError && typeof data === 'number') setOthersToday(data - (savedMood === mood ? 1 : 0));
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [mood, savedMood]);

  const close = () => sinkThen(() => (router.canGoBack() ? router.back() : router.replace('/(tabs)')));
  // Drag the sheet down by its top (the grabber, the title, the bloom) to close it.
  const dragClose = useDragToClose(close);

  const save = async () => {
    setSaving(true);
    setError(false);
    try {
      await logMoodForToday(mood, note);
      // One anonymous ping per mood per day — re-saving the same mood must not
      // inflate the "you're not alone" count.
      if (savedMood !== mood) pingMoodAndGetCount(mood).catch(() => {});
      close();
    } catch {
      setError(true);
      setSaving(false);
    }
  };

  const notAlone =
    othersToday !== null && othersToday > 0
      ? arabicPlural(othersToday, t.home.mood.notAlone).replace(
          '{n}',
          isRTL ? arabicNumber(othersToday) : String(othersToday),
        )
      : null;

  const labelLatin = fonts.labelTracked;
  // The note sits near the end of the sheet: scroll to the end so it and Save clear the keyboard.
  const keyboard = useKeyboardScroll('end');

  const sheetY = enter.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });
  // One screen, no scrolling (the ScrollView stays for the keyboard and the smallest phones): the
  // sheet starts a little below the status bar, and the bloom takes what room the rest leaves.
  const sheetTop = insets.top + SHEET_GAP;
  const bloom = Math.round(Math.max(BLOOM_MIN, Math.min(BLOOM_MAX, height - sheetTop - insets.bottom - FIXED_HEIGHT)));
  const blurTint = isNight ? 'dark' : 'light';

  return (
    <View style={styles.root}>
      {/* The screen behind, softened and dimmed; tapping it closes. */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: enter }]}>
        <BlurView intensity={isNight ? 30 : 24} tint={blurTint} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={s.close}
          onPress={close}
          style={[StyleSheet.absoluteFill, { backgroundColor: isNight ? alpha(colors.background, 0.45) : alpha(colors.text, 0.16) }]}
        />
      </Animated.View>
      <View style={[styles.scrim, { paddingTop: sheetTop }]} pointerEvents="box-none">
      <KeyboardSafeView>
        <Animated.View style={[styles.sheet, { borderColor: colors.borderLight, transform: [{ translateY: Animated.add(sheetY, dragClose.drag) }] }]}>
          {/* Frosted glass: the blurred screen through a wash of the sheet colour. */}
          <BlurView intensity={isNight ? 40 : 34} tint={blurTint} experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: alpha(colors.sheet, isNight ? 0.8 : 0.76) }]} />
          <ScrollView
            ref={keyboard.scrollRef}
            {...keyboard.scrollProps}
            contentContainerStyle={[styles.content, { paddingBottom: 16 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.dragArea} {...dragClose.panHandlers}>
            <Arrive enter={enter} index={0}>
            <View style={styles.header}>
              <View style={[styles.grabber, { backgroundColor: colors.faint }]} />
              {/* Beside the title, not above it: a row of its own cost the bloom its room. */}
              <View style={styles.closeRow}>
                <IconButton
                  accessibilityLabel={s.close}
                  onPress={close}
                  renderIcon={(c) => <CanvasIcon name="close" size={18} strokeWidth={1.8} color={c} />}
                />
              </View>
              <Text
                accessibilityRole="header"
                style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}
              >
                {s.title}
              </Text>
            </View>
            </Arrive>

            <Arrive enter={enter} index={1}>
            <View style={styles.figure}>
              <BreathingBloom mood={mood} size={bloom} />
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.moodLabel, isRTL && styles.moodLabelArabic, { color: colors.text, fontFamily: fonts.display }]}
              >
                {moodLabel}
              </Text>
            </View>
            </Arrive>
            </View>

            <Arrive enter={enter} index={2}>
            <MoodSlider
              value={index}
              steps={BLOOM_ORDER.length}
              onChange={setIndex}
              accessibilityLabel={s.sliderLabel}
              valueText={moodLabel}
              heavierLabel={s.heavier}
              lighterLabel={s.lighter}
            />
            </Arrive>

            <Arrive enter={enter} index={3}>
            <View style={styles.notAlone}>
              {notAlone && (
                <>
                  <View style={[styles.notAloneDot, { backgroundColor: colors.tones.dusk.fg }]} />
                  <Text style={[styles.notAloneText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                    {notAlone}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.noteWrap}>
              <Text
                nativeID="checkInNoteLabel"
                style={[
                  labelLatin ? styles.noteLabelLatin : styles.noteLabelArabic,
                  { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
                ]}
              >
                {s.noteLabel}
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={s.notePlaceholder}
                placeholderTextColor={colors.placeholder}
                accessibilityLabelledBy="checkInNoteLabel"
                {...keyboard.inputProps}
                textAlign={isRTL ? 'right' : 'left'}
                multiline
                numberOfLines={2}
                style={[
                  styles.note,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.borderControl,
                    color: colors.text,
                    fontFamily: fonts.regular,
                  },
                ]}
              />
            </View>
            </Arrive>

            <Arrive enter={enter} index={4}>
            <View style={styles.footer}>
              <Button label={s.save} onPress={save} loading={saving} block style={styles.saveButton} />
              <Text
                style={[styles.caption, { color: error ? colors.accent : colors.textTertiary, fontFamily: fonts.regular }]}
              >
                {error ? s.saveError : s.savedPrivately}
              </Text>
            </View>
            </Arrive>
          </ScrollView>
        </Animated.View>
      </KeyboardSafeView>
      </View>
    </View>
  );
}

/** The sheet's gap below the status bar; the bloom's size range; everything else on the sheet, its paddings and gaps, which the bloom fits round. */
const SHEET_GAP = 24;
const BLOOM_MIN = 152;
const BLOOM_MAX = 248;
const FIXED_HEIGHT = 540;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    borderTopStartRadius: 30,
    borderTopEndRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  content: {
    flexGrow: 1,
    paddingTop: 12,
    paddingHorizontal: layout.screenPadding,
    gap: 16,
  },
  // The header and the bloom: the sheet's handle for dragging (same gap as the rest of the sheet).
  dragArea: {
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  closeRow: {
    position: 'absolute',
    top: 4,
    end: 0,
  },
  title: {
    maxWidth: 256,
    fontSize: 29,
    lineHeight: 29 * 1.15,
    textAlign: 'center',
  },
  titleArabic: {
    lineHeight: 44,
  },
  figure: {
    alignItems: 'center',
    gap: 8,
  },
  moodLabel: {
    fontSize: 30,
    lineHeight: 36,
  },
  moodLabelArabic: {
    lineHeight: 46,
  },
  notAlone: {
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notAloneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notAloneText: {
    fontSize: 13.5,
  },
  noteWrap: {
    gap: 8,
  },
  noteLabelLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.14,
    textTransform: 'uppercase',
  },
  noteLabelArabic: {
    fontSize: 13,
  },
  note: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    height: 56,
  },
  caption: {
    fontSize: 12.5,
    textAlign: 'center',
  },
});
