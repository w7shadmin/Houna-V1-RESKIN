import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { layout } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { getTodayEntry, logMoodForToday, localDateString, type MoodTag } from '@/lib/journal';
import { pingMoodAndGetCount } from '@/lib/moodPings';
import { supabase } from '@/lib/supabase';
import { BLOOM_ORDER, BreathingBloom } from '@/components/mood/MoodBloom';
import MoodSlider from '@/components/mood/MoodSlider';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import CanvasIcon from '@/components/ui/CanvasIcon';
import KeyboardSafeView from '@/components/ui/KeyboardSafeView';
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';

/** Neutral — the starting point when today has no mood yet (never presume "calm"). */
const DEFAULT_INDEX = BLOOM_ORDER.indexOf('neutral');

/**
 * Houna bloom mood check-in (FEATURES_BRIEF §2), opened from Home's
 * top-left button. The slider snaps across the six existing moods and Save
 * calls the existing `logMoodForToday`, so the journal and mood history
 * keep working unchanged. No streaks, counts of your own, or pressure — the
 * only number shown is how many others felt the same today.
 */
export default function CheckInScreen() {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = t.checkIn;

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
        setIndex(BLOOM_ORDER.indexOf(entry.mood));
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

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

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

  return (
    <View style={[styles.scrim, { backgroundColor: colors.scrim, paddingTop: Math.max(insets.top + 8, 28) }]}>
      <KeyboardSafeView>
        <View style={[styles.sheet, { backgroundColor: colors.sheet, borderColor: colors.borderLight }]}>
          <ScrollView
            ref={keyboard.scrollRef}
            {...keyboard.scrollProps}
            contentContainerStyle={[styles.content, { paddingBottom: 36 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={[styles.grabber, { backgroundColor: colors.faint }]} />
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

            <View style={styles.figure}>
              <BreathingBloom mood={mood} size={250} />
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.moodLabel, isRTL && styles.moodLabelArabic, { color: colors.text, fontFamily: fonts.display }]}
              >
                {moodLabel}
              </Text>
            </View>

            <MoodSlider
              value={index}
              steps={BLOOM_ORDER.length}
              onChange={setIndex}
              accessibilityLabel={s.sliderLabel}
              valueText={moodLabel}
              heavierLabel={s.heavier}
              lighterLabel={s.lighter}
            />

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

            <View style={styles.footer}>
              <Button label={s.save} onPress={save} loading={saving} block style={styles.saveButton} />
              <Text
                style={[styles.caption, { color: error ? colors.accent : colors.textTertiary, fontFamily: fonts.regular }]}
              >
                {error ? s.saveError : s.savedPrivately}
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardSafeView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  header: {
    alignItems: 'center',
    gap: 10,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  closeRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  title: {
    maxWidth: 300,
    fontSize: 29,
    lineHeight: 29 * 1.15,
    textAlign: 'center',
  },
  titleArabic: {
    lineHeight: 44,
  },
  figure: {
    alignItems: 'center',
    gap: 6,
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
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
