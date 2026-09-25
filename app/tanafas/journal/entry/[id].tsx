import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Check, Pencil, Share2, X } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { arabicNumber } from '@/lib/arabicNumerals';
import {
  getEntry,
  saveEntry,
  updateEntry,
  deleteEntry,
  getPromptForToday,
  formatEntryDateShort,
  formatEntryDateLong,
  MOOD_EMOJI,
  type JournalEntry,
  type MoodTag,
} from '@/lib/journal';
import { recordTanafasSession } from '@/lib/usageTracking';
import MoodPicker from '@/components/journal/MoodPicker';
import ConfirmDialog from '@/components/journal/ConfirmDialog';

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

    // Streak/leaderboard activity signal (Segment 5) — Alias-only, silent;
    // same 'mood' kind HomeMoodCard's quick check-in uses, since either one
    // marks the day as active for streak purposes.
    recordTanafasSession('mood', new Date()).catch(() => {});
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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && { backgroundColor: colors.cardPressed },
          ]}
        >
          <View style={isRTL ? styles.flip : undefined}>
<ArrowLeft size={18} color={colors.text} />
</View>
        </Pressable>
        <View style={{ flex: 1 }} />
        {existing && isEditing && (
          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            hitSlop={12}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && { backgroundColor: colors.cardPressed },
            ]}
            accessibilityLabel={e.delete}
          >
            <Trash2 size={18} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {displayEntry ? (
          <>
            <View style={[styles.badge, { backgroundColor: colors.primaryLightest }]}>
              <Text style={styles.badgeEmoji}>{MOOD_EMOJI[displayEntry.mood]}</Text>
              <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                {formatEntryDateShort(displayEntry.date, t.journal.dateNames, num)}
              </Text>
            </View>
            <Text style={[styles.heading, { color: colors.text, fontFamily: fonts.bold }]}>
              {isEditing ? e.editEntry : e.yourEntry}
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.badge, { backgroundColor: colors.primaryLightest }]}>
              <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fonts.semiBold }]}>
                {e.newEntry}
              </Text>
            </View>
            <Text style={[styles.heading, { color: colors.text, fontFamily: fonts.bold }]}>
              {formatEntryDateLong(new Date(), t.journal.dateNames, num)}
            </Text>
          </>
        )}

        {isEditing && promptVisible && (
          <View style={[styles.promptCard, { backgroundColor: colors.primaryLightest, borderColor: colors.border }]}>
            <View style={styles.promptRow}>
              <Text style={[styles.promptText, { color: colors.primary, fontFamily: fonts.medium }]}>{prompt}</Text>
              <Pressable
                onPress={() => setPromptVisible(false)}
                style={({ pressed }) => [
                  styles.skipBtn,
                  { backgroundColor: colors.card },
                  pressed && { backgroundColor: colors.cardPressed },
                ]}
              >
                <X size={12} color={colors.textSecondary} />
                <Text style={[styles.skipText, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>
                  {e.skipPrompt}
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setPromptVisible(false)}
              style={({ pressed }) => pressed && { opacity: 0.6 }}
            >
              <Text style={[styles.writeFreely, { color: colors.primary, fontFamily: fonts.medium }]}>
                {e.writeFreely}
              </Text>
            </Pressable>
          </View>
        )}

        <TextInput
          value={text}
          onChangeText={setText}
          editable={isEditing}
          multiline
          textAlign={isRTL ? 'right' : 'left'}
          placeholder={isEditing ? e.placeholder : ''}
          placeholderTextColor={colors.placeholder}
          style={[
            styles.textArea,
            { borderColor: colors.border, backgroundColor: colors.card, color: colors.text, fontFamily: fonts.regular },
          ]}
        />

        <View style={styles.moodSection}>
          <Text style={[styles.moodLabel, { color: colors.text, fontFamily: fonts.semiBold }]}>{e.howFeeling}</Text>
          <MoodPicker value={mood} onChange={isEditing ? setMood : () => {}} disabled={!isEditing} />
        </View>

        {isEditing ? (
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: canSave ? colors.primary : colors.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Check size={20} color={canSave ? colors.onPrimary : colors.textTertiary} />
            <Text
              style={[
                styles.primaryBtnText,
                { color: canSave ? colors.onPrimary : colors.textTertiary, fontFamily: fonts.bold },
              ]}
            >
              {e.save}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.actions}>
            <Pressable
              onPress={() => setIsEditing(true)}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Pencil size={18} color={colors.text} />
              <Text style={[styles.secondaryBtnText, { color: colors.text, fontFamily: fonts.bold }]}>{e.edit}</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Share2 size={18} color={colors.onPrimary} />
              <Text style={[styles.primaryBtnText, { color: colors.onPrimary, fontFamily: fonts.bold }]}>
                {e.share}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    transform: [{ scaleX: -1 }],
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 24,
    gap: spacing.xs + 2,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  badgeEmoji: {
    fontSize: typography.fontSize.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: typography.fontSize.lg,
    marginBottom: spacing.md,
  },
  promptCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  promptText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
  },
  skipBtn: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs + 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
  },
  writeFreely: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.sm,
  },
  textArea: {
    minHeight: 220,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
    textAlignVertical: 'top',
  },
  moodSection: {
    marginTop: spacing.lg,
  },
  moodLabel: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm + 2,
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  primaryBtnText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
  },
  secondaryBtn: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
  },
  secondaryBtnText: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
  },
});
