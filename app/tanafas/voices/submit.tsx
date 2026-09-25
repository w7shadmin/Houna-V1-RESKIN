import React, { useState } from 'react';
import { View, Text, Image, TextInput, Pressable, Switch, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X, CheckCircle2 } from 'lucide-react-native';
import DetailScreen from '@/components/DetailScreen';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { submitPost } from '@/lib/voices';

export default function VoicesSubmitScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, isRTL, fonts } = useLanguage();
  const { session } = useAuth();
  const s = t.tanafas.voices;
  const errors = t.account.errors;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [forMeditation, setForMeditation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (result.canceled || !result.assets[0]) return;
    setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!session) return;
    if (!body.trim() && !image) {
      setError(s.emptyPostError);
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await submitPost({
      userId: session.user.id,
      title,
      body,
      imageUri: image?.uri ?? null,
      imageMimeType: image?.mimeType ?? null,
      forMeditation: !!image && forMeditation,
    });
    setSubmitting(false);
    if (result.error) {
      setError(errors.unknown);
      return;
    }
    setDone(true);
  };

  if (!session) return null;

  if (done) {
    return (
      <DetailScreen title={s.submitTitle}>
        <View style={styles.doneWrap}>
          <View style={[styles.doneIcon, { backgroundColor: colors.primaryLightest }]}>
            <CheckCircle2 size={28} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.doneTitle, { color: colors.text, fontFamily: fonts.bold }]}>{s.submittedTitle}</Text>
          <Text style={[styles.doneBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.submittedBody}</Text>
          <Pressable
            onPress={() => router.replace('/tanafas/voices')}
            style={({ pressed }) => [styles.doneBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.85 }]}
          >
            <Text style={[styles.doneBtnText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>{s.done}</Text>
          </Pressable>
        </View>
      </DetailScreen>
    );
  }

  return (
    <DetailScreen title={s.submitTitle}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{s.submitSubtitle}</Text>

          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>{s.titleLabel}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={s.titlePlaceholder}
            placeholderTextColor={colors.placeholder}
            textAlign={isRTL ? 'right' : 'left'}
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, fontFamily: fonts.regular }]}
          />

          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>{s.bodyLabel}</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={s.bodyPlaceholder}
            placeholderTextColor={colors.placeholder}
            multiline
            textAlign={isRTL ? 'right' : 'left'}
            style={[styles.input, styles.textArea, { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, fontFamily: fonts.regular }]}
          />

          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>{s.photoLabel}</Text>
          {image ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
              <Pressable
                onPress={() => {
                  setImage(null);
                  setForMeditation(false);
                }}
                style={[styles.removeImageBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <X size={14} color={colors.text} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handlePickImage}
              style={({ pressed }) => [styles.addPhotoBtn, { borderColor: colors.border }, pressed && { backgroundColor: colors.cardPressed }]}
            >
              <ImagePlus size={18} color={colors.primary} strokeWidth={1.8} />
              <Text style={[styles.addPhotoText, { color: colors.primary, fontFamily: fonts.semiBold }]}>{s.addPhoto}</Text>
            </Pressable>
          )}

          {!!image && (
            <View style={[styles.forMeditationRow, { borderColor: colors.border }]}>
              <View style={styles.forMeditationText}>
                <Text style={[styles.forMeditationLabel, { color: colors.text, fontFamily: fonts.semiBold }]}>
                  {s.forMeditationLabel}
                </Text>
                <Text style={[styles.forMeditationBody, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                  {s.forMeditationBody}
                </Text>
              </View>
              <Switch
                value={forMeditation}
                onValueChange={setForMeditation}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          )}

          {!!error && <Text style={[styles.error, { color: colors.accent, fontFamily: fonts.regular }]}>{error}</Text>}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [styles.submitBtn, { backgroundColor: colors.primary }, (pressed || submitting) && { opacity: 0.7 }]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={[styles.submitBtnText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>{s.submitAction}</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.fontSize.body,
    marginBottom: spacing.md,
  },
  textArea: {
    height: 140,
    paddingTop: spacing.sm + 4,
    textAlignVertical: 'top',
  },
  addPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  addPhotoText: {
    fontSize: typography.fontSize.sm,
  },
  imagePreviewWrap: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: spacing.sm,
    end: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forMeditationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  forMeditationText: {
    flex: 1,
  },
  forMeditationLabel: {
    fontSize: typography.fontSize.sm,
  },
  forMeditationBody: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  error: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  submitBtn: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  submitBtnText: {
    fontSize: typography.fontSize.body,
  },
  doneWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  doneIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  doneTitle: {
    fontSize: typography.fontSize.lg,
  },
  doneBody: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    lineHeight: typography.lineHeight.body,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  doneBtn: {
    height: 44,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  doneBtnText: {
    fontSize: typography.fontSize.sm,
  },
});
