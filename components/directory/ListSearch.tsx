import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import CanvasIcon from '@/components/ui/CanvasIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';

/** The accent border shows focus, so the browser's own ring is off (it would be a second highlight). */
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

/**
 * A search box for one list (professionals, wellness centers, organizations, Read & listen): the same
 * field as the Directory hub's, matching on the phone as you type. The hub searches everything; this
 * searches only what's on the screen, so people needn't leave the list they're in.
 */
export default function ListSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.controlStrong, borderColor: focused || value ? colors.primary : colors.borderControl },
      ]}
    >
      <CanvasIcon name="search" size={20} strokeWidth={1.7} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        autoCorrect={false}
        textAlign={isRTL ? 'right' : 'left'}
        style={[styles.input, WEB_NO_OUTLINE, { color: colors.text, fontFamily: fonts.regular }]}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel={t.directory.search.clear}
          hitSlop={4}
          style={styles.clear}
        >
          <CanvasIcon name="close" size={14} strokeWidth={2} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
    height: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingStart: grid(2),
    paddingEnd: grid(1),
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 16,
  },
  clear: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
