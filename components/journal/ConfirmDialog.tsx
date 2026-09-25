import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { palette, spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { mix } from '@/lib/color';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  body,
  cancelLabel,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: colors.text, fontFamily: fonts.bold }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{body}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                { borderColor: colors.border, backgroundColor: colors.card },
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                styles.btnFilled,
                { backgroundColor: destructive ? palette.raspberry : colors.primary },
                pressed && {
                  backgroundColor: mix(destructive ? palette.raspberry : colors.primary, palette.black, 0.15),
                },
              ]}
            >
              <Text style={[styles.btnText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
  },
  body: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.body,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    marginTop: spacing.lg,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFilled: {
    borderColor: 'transparent',
  },
  btnText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
