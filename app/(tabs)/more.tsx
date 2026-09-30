import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Info,
  HandHeart,
  Phone,
  Bell,
  ChevronRight,
  ShieldCheck,
  FileText,
  type LucideIcon,
} from 'lucide-react-native';
import { openLegal } from '@/lib/legalLinks';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/constants/strings';
import { spacing, typography, radius, shadows, latinFontFamily, arabicFontFamily } from '@/constants/theme';
import { APPEARANCE_OPTIONS, HOME_STYLES, useTheme } from '@/contexts/ThemeContext';
import PageMarkGlow from '@/components/ui/PageMarkGlow';
import { SUNRISE_ACCENTS } from '@/constants/theme';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  /** A screen in the app, or a page on houna.org (the policies). */
  href?: '/about' | '/get-involved' | '/contact' | '/account/notifications';
  legal?: 'privacy' | 'terms';
}

export default function MoreScreen() {
  const { colors, preference, setPreference, homeStyle, setHomeStyle, sunriseAccent, setSunriseAccent } = useTheme();
  const { language, setLanguage, t, fonts, isRTL } = useLanguage();
  const router = useRouter();

  // About / Get Involved / Contact ported from the old MVP's MoreScreen.
  // Account lives behind Home's top-right Profile button, not here.
  const menuItems: MenuItem[] = [
    { icon: Bell, label: t.account.notifications.title, href: '/account/notifications' },
    { icon: Info, label: t.more.about, href: '/about' },
    { icon: HandHeart, label: t.more.getInvolved, href: '/get-involved' },
    { icon: Phone, label: t.more.contact, href: '/contact' },
    { icon: ShieldCheck, label: t.more.privacy, legal: 'privacy' },
    { icon: FileText, label: t.more.terms, legal: 'terms' },
  ];

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'en', label: t.more.languageEnglish },
    { value: 'ar', label: t.more.languageArabic },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <PageMarkGlow />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text, fontFamily: fonts.bold },
          ]}
        >
          {t.more.title}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.textSecondary, fontFamily: fonts.regular },
          ]}
        >
          {t.more.subtitle}
        </Text>

        {/* Language section */}
        <View style={styles.languageSection}>
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.textTertiary, fontFamily: fonts.semiBold },
            ]}
          >
            {t.more.language.toUpperCase()}
          </Text>
          <View
            accessibilityRole="radiogroup"
            style={[
              styles.languageSwitcher,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {languageOptions.map((option) => {
              const active = option.value === language;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setLanguage(option.value)}
                  accessibilityRole="radio"
                  aria-checked={active}
                  accessibilityLanguage={option.value}
                  style={({ pressed }) => [
                    styles.languageOption,
                    active && { backgroundColor: colors.primary },
                    pressed && !active && { backgroundColor: colors.cardPressed },
                  ]}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      {
                        color: active ? colors.onPrimary : colors.textSecondary,
                        // Each label is always written in its own language
                        // ("English" / "العربية"), independent of which
                        // language is currently active — so it uses its own
                        // script's font, not the app-wide `fonts`.
                        fontFamily:
                          option.value === 'ar'
                            ? arabicFontFamily.semiBold
                            : latinFontFamily.semiBold,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Appearance section — also in Profile; here so it's easy to find. */}
        <View style={styles.languageSection}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontFamily: fonts.semiBold }]}>
            {t.profile.settings.appearance.toUpperCase()}
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t.profile.settings.appearance}
            style={[styles.languageSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {APPEARANCE_OPTIONS.map((option) => {
              const active = option === preference;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  aria-checked={active}
                  onPress={() => setPreference(option)}
                  style={({ pressed }) => [
                    styles.languageOption,
                    active && { backgroundColor: colors.primary },
                    pressed && !active && { backgroundColor: colors.cardPressed },
                  ]}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      { color: active ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold },
                    ]}
                  >
                    {t.profile.settings.appearanceOptions[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Home style — both kept while the client decides (ThemeContext HomeStyle). */}
        <View style={styles.languageSection}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontFamily: fonts.semiBold }]}>
            {t.profile.settings.homeStyle.toUpperCase()}
          </Text>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t.profile.settings.homeStyle}
            style={[styles.languageSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {HOME_STYLES.map((option) => {
              const active = option === homeStyle;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  aria-checked={active}
                  onPress={() => setHomeStyle(option)}
                  style={({ pressed }) => [
                    styles.languageOption,
                    active && { backgroundColor: colors.primary },
                    pressed && !active && { backgroundColor: colors.cardPressed },
                  ]}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      { color: active ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold },
                    ]}
                  >
                    {t.profile.settings.homeStyleOptions[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sunrise accent — shown in Sunrise, while it's decided (constants/theme.ts SunriseAccent). */}
        {preference === 'sunrise' && (
          <View style={styles.languageSection}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary, fontFamily: fonts.semiBold }]}>
              {t.profile.settings.sunriseAccent.toUpperCase()}
            </Text>
            <View
              accessibilityRole="radiogroup"
              accessibilityLabel={t.profile.settings.sunriseAccent}
              style={[styles.languageSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {SUNRISE_ACCENTS.map((option) => {
                const active = option === sunriseAccent;
                return (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    aria-checked={active}
                    onPress={() => setSunriseAccent(option)}
                    style={({ pressed }) => [
                      styles.languageOption,
                      active && { backgroundColor: colors.primary },
                      pressed && !active && { backgroundColor: colors.cardPressed },
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageOptionText,
                        { color: active ? colors.onPrimary : colors.textSecondary, fontFamily: fonts.semiBold },
                      ]}
                    >
                      {t.profile.settings.sunriseAccentOptions[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Menu items */}
        <View
          style={[
            styles.menuCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...shadows.card,
            },
          ]}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isLast = index === menuItems.length - 1;

            return (
              <Pressable
                key={item.href ?? item.legal}
                onPress={() => (item.legal ? openLegal(item.legal, language) : item.href && router.push(item.href))}
                accessibilityRole={item.legal ? 'link' : 'button'}
                style={({ pressed }) => [
                  styles.menuItem,
                  !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderLight },
                  pressed && { backgroundColor: colors.cardPressed },
                ]}
              >
                <View
                  style={[
                    styles.menuIconWrap,
                    { backgroundColor: colors.primaryLightest },
                  ]}
                >
                  <Icon size={18} color={colors.primary} strokeWidth={1.8} />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    { color: colors.text, fontFamily: fonts.semiBold },
                  ]}
                >
                  {item.label}
                </Text>
                <View style={isRTL ? styles.flip : undefined}>
                  <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flip: {
    transform: [{ scaleX: -1 }],
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  /* Account section */

  /* Language section */
  languageSection: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    letterSpacing: 1.2,
  },
  languageSwitcher: {
    flexDirection: 'row',
    // "English" and "العربية" render at different natural widths in their
    // own scripts/fonts even with identical padding — without a fixed
    // container width, flex:1 alone can't force an even 50/50 split (it'd
    // still shrink-wrap to the wider of the two). A fixed width is what
    // actually guarantees both halves match.
    width: 220,
    borderRadius: radius.full,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  languageOption: {
    flex: 1,
    // Fixed height, not paddingVertical sizing to content — Scheherazade
    // New's natural line-height is much taller than Inter's at the same
    // fontSize, so a padding-only pill renders visibly taller (and pushes
    // the row's overall height up) for the Arabic side than the English
    // one. Fixing the height and centering content decouples pill size
    // from which font is active.
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  languageOptionText: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: 'center',
  },

  /* Menu card */
  menuCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.fontSize.body,
  },
});
