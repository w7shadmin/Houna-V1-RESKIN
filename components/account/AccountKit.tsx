import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout, radius } from '@/constants/theme';
import IconButton from '@/components/ui/IconButton';
import KeyboardSafeView from '@/components/ui/KeyboardSafeView';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';

/*
 * Building blocks for the account screens (sign in / up, username, account
 * profile, streaks, notifications), in the app's canvas language: round back
 * button, tracked eyebrow, display-font title, pill fields and buttons,
 * grouped settings rows.
 */

/** The field's own border shows focus; the browser's focus ring would be a second one (web only). */
const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

interface AccountScreenProps {
  title: string;
  subtitle?: string;
  /** Tracked label above the title; defaults to "Account". */
  eyebrow?: string;
  children: React.ReactNode;
  /** Where back goes when there's no history (a deep link); defaults to Profile. */
  fallback?: '/profile' | '/(tabs)/more';
}

export function AccountScreen({ title, subtitle, eyebrow, children, fallback = '/profile' }: AccountScreenProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { t, fonts, isRTL } = useLanguage();
  const labelLatin = fonts.labelTracked;
  const back = () => (router.canGoBack() ? router.back() : router.replace(fallback));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardSafeView>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <IconButton
              variant="control"
              accessibilityLabel={t.directory.common.goBack}
              onPress={back}
              renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
            />
          </View>
          <View style={styles.header}>
            <Text
              style={[
                labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
                { color: colors.primary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
              ]}
            >
              {eyebrow ?? t.account.eyebrow}
            </Text>
            <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
              {title}
            </Text>
            {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{subtitle}</Text>}
          </View>
          {children}
        </ScrollView>
      </KeyboardSafeView>
    </SafeAreaView>
  );
}

/* ── Form pieces ── */

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: 'email' | 'password' | 'new-password' | 'username' | 'off';
  /** Drawn at the end of the field (a status icon). */
  trailing?: React.ReactNode;
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default', autoCapitalize = 'sentences', autoComplete, trailing }: FieldProps) {
  const { colors } = useTheme();
  const { isRTL, fonts } = useLanguage();
  const [focused, setFocused] = useState(false);
  const labelLatin = fonts.labelTracked;

  return (
    <View style={styles.field}>
      <Text
        style={[
          labelLatin ? styles.fieldLabelLatin : styles.fieldLabelArabic,
          { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
        ]}
      >
        {label}
      </Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.controlStrong, borderColor: focused ? colors.primary : colors.borderControl }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          autoCorrect={false}
          accessibilityLabel={label}
          textAlign={isRTL ? 'right' : 'left'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, WEB_NO_OUTLINE, { color: colors.text, fontFamily: fonts.regular }]}
        />
        {trailing}
      </View>
    </View>
  );
}

export function FormMessage({ message, tone = 'error' }: { message: string; tone?: 'error' | 'ok' | 'muted' }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const color = tone === 'error' ? colors.danger : tone === 'ok' ? colors.primary : colors.textTertiary;
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.message, { color, fontFamily: fonts.regular }]}>
      {message}
    </Text>
  );
}

export function OrDivider({ label }: { label: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      <Text style={[styles.dividerText, { color: colors.textTertiary, fontFamily: fonts.regular }]}>{label}</Text>
      <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
    </View>
  );
}

/** "No account yet? Create one" — a line of text with a link at its end. */
export function SwitchLink({ text, link, onPress }: { text: string; link: string; onPress: () => void }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchText, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{text}</Text>
      <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link" style={({ pressed }) => pressed && styles.pressedLink}>
        <Text style={[styles.switchText, { color: colors.primary, fontFamily: fonts.semiBold }]}>{link}</Text>
      </Pressable>
    </View>
  );
}

/* ── Settings rows ── */

export function SettingsGroup({ label, children }: { label?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const labelLatin = fonts.labelTracked;
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.group}>
      {!!label && (
        <Text
          style={[
            labelLatin ? styles.fieldLabelLatin : styles.fieldLabelArabic,
            { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
          ]}
        >
          {label}
        </Text>
      )}
      <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {rows.map((row, i) => (
          <View key={i} style={i > 0 && [styles.rowDivider, { borderTopColor: colors.border }]}>
            {row}
          </View>
        ))}
      </View>
    </View>
  );
}

interface SettingsRowProps {
  title: string;
  body?: string;
  /** A value shown at the end (a username, a country). */
  value?: string;
  valueMuted?: boolean;
  /** Tappable rows get a chevron. */
  onPress?: () => void;
  /** Replaces the chevron (a Switch). */
  trailing?: React.ReactNode;
}

export function SettingsRow({ title, body, value, valueMuted, onPress, trailing }: SettingsRowProps) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const content = (
    <>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: colors.text, fontFamily: fonts.medium }]}>{title}</Text>
        {!!body && <Text style={[styles.rowBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{body}</Text>}
      </View>
      {!!value && (
        <Text numberOfLines={1} style={[styles.rowValue, { color: valueMuted ? colors.textTertiary : colors.textSecondary, fontFamily: fonts.regular }]}>
          {value}
        </Text>
      )}
      {trailing ?? (onPress ? <DirectionalIcon isRTL={isRTL} name="chevron" size={18} color={colors.textTertiary} /> : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressedRow]}>
      {content}
    </Pressable>
  );
}

/** A Switch in the theme's colours: the knob takes the on-primary colour when lit, mist when off. */
export function ThemedSwitch({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={label}
      trackColor={{ false: colors.borderControlStrong, true: colors.primary }}
      thumbColor={value ? colors.onPrimary : colors.textSecondary}
      ios_backgroundColor={colors.borderControlStrong}
      {...(Platform.OS === 'web' ? { activeThumbColor: colors.onPrimary } : null)}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: grid(2),
    paddingBottom: grid(5),
    gap: grid(2),
  },
  topBar: {
    flexDirection: 'row',
  },
  header: {
    gap: grid(1),
    marginBottom: grid(1),
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13.5,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  titleArabic: {
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
  },
  field: {
    gap: grid(1),
  },
  fieldLabelLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.14,
    textTransform: 'uppercase',
  },
  fieldLabelArabic: {
    fontSize: 13,
  },
  inputWrap: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1),
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: grid(2),
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontSize: 16,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: grid(0.5),
    marginTop: grid(1),
  },
  switchText: {
    fontSize: 14,
  },
  pressedLink: {
    opacity: 0.6,
  },
  group: {
    gap: grid(1),
  },
  groupCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    minHeight: grid(7),
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
    paddingHorizontal: grid(2),
    paddingVertical: grid(1.5),
  },
  pressedRow: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15.5,
  },
  rowBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  rowValue: {
    flexShrink: 1,
    maxWidth: '50%',
    fontSize: 15,
  },
});
