import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Share,
  StyleSheet,
  type TextStyle,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { alpha, grid, layout, radius } from '@/constants/theme';
import { MOOD_STYLE } from '@/constants/moods';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import KeyboardSafeView from '@/components/ui/KeyboardSafeView';
import { useKeyboardScroll } from '@/hooks/useKeyboardScroll';
import {
  getEntry,
  saveEntry,
  updateEntry,
  deleteEntry,
  getPromptForToday,
  formatEntryDateLong,
  type JournalEntry,
  type MoodTag,
} from '@/lib/journal';
import MoodPicker from '@/components/journal/MoodPicker';
import ConfirmDialog from '@/components/journal/ConfirmDialog';
import MoodGlyph from '@/components/mood/MoodGlyph';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';
import { GroupLabel } from '@/components/directory/ProfileKit';

/** The field's own border shows focus; the browser's focus ring would be a second one (web only). */
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

export default function JournalEntryScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const e = t.journal.entry;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));

  const [loading, setLoading] = useState(!isNew);
  const [existing, setExisting] = useState<JournalEntry | null>(null);
  const [text, setText] = useState('');
  // Where the text field sits in the scroll content, so typing stays above the keyboard:
  // the whole field when it fits, otherwise its bottom (where the cursor usually is).
  const field = useRef({ y: 0, h: 0 });
  const keyboard = useKeyboardScroll((visible) =>
    Math.max(field.current.y - 16, field.current.y + field.current.h + 16 - visible),
  );
  const [mood, setMood] = useState<MoodTag | null>(null);
  const [isEditing, setIsEditing] = useState(isNew);
  const [promptVisible, setPromptVisible] = useState(isNew);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    getEntry(id).then((entry) => {
      if (cancelled) return;
      setExisting(entry);
      setText(entry?.text ?? '');
      setMood(entry?.mood ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const prompt = useMemo(() => getPromptForToday(t.journal.prompts), [t.journal.prompts]);

  const hasUnsavedChanges = !existing
    ? text.trim().length > 0 || mood !== null
    : (text !== existing.text || mood !== existing.mood) && !saved;

  const canSave = text.trim().length > 0 && mood !== null;
  const displayEntry = savedEntry ?? existing;

  const handleBack = () => {
    if (hasUnsavedChanges && !saved) {
      setShowDiscardConfirm(true);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!canSave || !mood) return;
    if (existing) {
      await updateEntry(existing.id, text, mood);
      setSavedEntry({ ...existing, text, mood, updatedAt: Date.now() });
    } else {
      const entry = await saveEntry(text, mood);
      setSavedEntry(entry);
    }
    setSaved(true);
    setIsEditing(false);
    // Deliberately no streak/leaderboard signal: mood logging never feeds a streak.
  };

  const handleDelete = async () => {
    if (existing) await deleteEntry(existing.id);
    router.back();
  };

  const handleShare = async () => {
    if (!displayEntry) return;
    try {
      await Share.share({ message: displayEntry.text });
    } catch {
      // user cancelled or share sheet unavailable — non-fatal
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  const labelLatin = fonts.labelTracked;
  const eyebrow = formatEntryDateLong(displayEntry ? new Date(displayEntry.date + 'T00:00:00') : new Date(), t.journal.dateNames, num);
  const heading = !displayEntry ? e.newEntry : isEditing ? e.editEntry : e.yourEntry;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <IconButton
          variant="control"
          accessibilityLabel={t.directory.common.goBack}
          onPress={handleBack}
          renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
        />
        {existing && isEditing && (
          <IconButton
            variant="control"
            accessibilityLabel={e.delete}
            onPress={() => setShowDeleteConfirm(true)}
            renderIcon={() => <Trash2 size={18} color={colors.danger} strokeWidth={1.8} />}
          />
        )}
      </View>

      <KeyboardSafeView>
        <ScrollView
          ref={keyboard.scrollRef}
          {...keyboard.scrollProps}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.eyebrowRow}>
              {displayEntry && <MoodGlyph mood={displayEntry.mood} size={grid(2.5)} />}
              <Text
                style={[
                  labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
                  { color: colors.primary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
                ]}
              >
                {eyebrow}
              </Text>
            </View>
            <Text accessibilityRole="header" style={[styles.heading, isRTL && styles.headingArabic, { color: colors.text, fontFamily: fonts.display }]}>
              {heading}
            </Text>
          </View>

          {isEditing && promptVisible && (
            <View style={[styles.prompt, { backgroundColor: colors.tones.dusk.bg, borderColor: colors.tones.dusk.border }]}>
              <Text style={[styles.promptText, isRTL && styles.promptTextArabic, { color: colors.text, fontFamily: fonts.display }]}>{prompt}</Text>
              <Pressable
                onPress={() => setPromptVisible(false)}
                accessibilityRole="button"
                hitSlop={8}
                style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
              >
                <Text style={[styles.skipText, { color: colors.tones.dusk.fg, fontFamily: fonts.medium }]}>{e.writeFreely}</Text>
              </Pressable>
            </View>
          )}

          <TextInput
            value={text}
            onChangeText={setText}
            {...keyboard.inputProps}
            onLayout={(ev) => {
              const { y, height } = ev.nativeEvent.layout;
              const grew = height > field.current.h;
              field.current = { y, h: height };
              if (grew) keyboard.reveal();
            }}
            editable={isEditing}
            multiline
            textAlign={isRTL ? 'right' : 'left'}
            placeholder={isEditing ? e.placeholder : ''}
            placeholderTextColor={colors.placeholder}
            accessibilityLabel={e.placeholder}
            style={[
              styles.textArea,
              isEditing && styles.textAreaEditing,
              WEB_NO_OUTLINE,
              isEditing
                ? { borderColor: colors.borderControl, backgroundColor: colors.inputBackground }
                : styles.textRead,
              { color: colors.text, fontFamily: fonts.regular },
            ]}
          />

          <View style={styles.moodSection}>
            <GroupLabel>{e.howFeeling}</GroupLabel>
            {isEditing ? (
              <MoodPicker value={mood} onChange={setMood} />
            ) : (
              mood && (
                <View style={[styles.moodPill, { backgroundColor: alpha(MOOD_STYLE[mood].color, 0.16), borderColor: MOOD_STYLE[mood].color }]}>
                  <MoodGlyph mood={mood} size={grid(2.5)} />
                  <Text style={[styles.moodPillText, { color: colors.text, fontFamily: fonts.medium }]}>{t.journal.moodLabels[mood]}</Text>
                </View>
              )
            )}
          </View>

          {isEditing ? (
            <Button label={e.save} onPress={handleSave} disabled={!canSave} block />
          ) : (
            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button variant="secondary" label={e.edit} onPress={() => setIsEditing(true)} block />
              </View>
              <View style={styles.flex}>
                <Button label={e.share} onPress={handleShare} block />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardSafeView>

      <ConfirmDialog
        visible={showDiscardConfirm}
        title={e.discardTitle}
        body={e.discardBody}
        cancelLabel={e.keepWriting}
        confirmLabel={e.discard}
        destructive
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={() => {
          setShowDiscardConfirm(false);
          router.back();
        }}
      />
      <ConfirmDialog
        visible={showDeleteConfirm}
        title={e.deleteTitle}
        body={e.deleteBody}
        cancelLabel={e.cancel}
        confirmLabel={e.delete}
        destructive
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDelete();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: grid(2),
    paddingTop: grid(2),
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(5),
    gap: grid(2),
  },
  header: {
    gap: grid(1),
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13.5,
  },
  heading: {
    fontSize: 32,
    lineHeight: 40,
  },
  headingArabic: {
    lineHeight: 48,
  },
  prompt: {
    gap: grid(1.5),
    borderWidth: 1,
    borderRadius: radius.cardLg,
    padding: 20,
  },
  promptText: {
    fontSize: 20,
    lineHeight: 28,
  },
  promptTextArabic: {
    lineHeight: 36,
  },
  skip: {
    alignSelf: 'flex-start',
  },
  skipText: {
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: grid(2),
    fontSize: 16,
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  textAreaEditing: {
    minHeight: 240,
  },
  /** Reading: the text sits on the page, no box. */
  textRead: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    // A hair of inset so the first glyph isn't clipped at the field's edge.
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  moodSection: {
    gap: grid(1.5),
  },
  moodPill: {
    alignSelf: 'flex-start',
    height: grid(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
    borderWidth: 1,
    borderRadius: 999,
    paddingStart: grid(1),
    paddingEnd: grid(2),
  },
  moodPillText: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: grid(1.5),
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.6,
  },
});
