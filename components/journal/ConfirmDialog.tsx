import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { grid } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/ui/Button';

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

/** A small confirm sheet in the app's style; `destructive` fills the confirm in the theme's danger colour. */
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
  const { fonts, isRTL } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onCancel} accessibilityLabel={cancelLabel}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.sheet, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alert"
        >
          <Text style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{body}</Text>
          <View style={styles.actions}>
            {/* Equal slots, so the two buttons split the row evenly. */}
            <View style={styles.slot}>
              <Button variant="secondary" label={cancelLabel} onPress={onCancel} block />
            </View>
            <View style={styles.slot}>
              {destructive ? (
                <Pressable
                  onPress={onConfirm}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.danger, { backgroundColor: colors.danger }, pressed && styles.pressed]}
                >
                  <Text style={[styles.dangerText, { color: colors.onDanger, fontFamily: fonts.semiBold }]}>{confirmLabel}</Text>
                </Pressable>
              ) : (
                <Button label={confirmLabel} onPress={onConfirm} block />
              )}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: grid(3),
  },
  card: {
    width: '100%',
    maxWidth: 360,
    gap: grid(1.5),
    borderRadius: 24,
    borderWidth: 1,
    padding: grid(3),
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  titleArabic: {
    lineHeight: 40,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: grid(1.5),
    marginTop: grid(1),
  },
  slot: {
    flex: 1,
    minWidth: 0,
  },
  danger: {
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: grid(2),
  },
  dangerText: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
