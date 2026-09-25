import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { spacing, radius, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export default function AuthField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: AuthFieldProps) {
  const { colors } = useTheme();
  const { isRTL, fonts } = useLanguage();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.textSecondary, fontFamily: fonts.semiBold }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        textAlign={isRTL ? 'right' : 'left'}
        style={[
          styles.input,
          { borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, fontFamily: fonts.regular },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
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
  },
});
