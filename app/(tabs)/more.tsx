import React from 'react';
import {
  View,
  Text,
  Image,
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
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Language } from '@/constants/strings';
import { spacing, typography, radius, shadows, latinFontFamily, arabicFontFamily } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: '/about' | '/get-involved' | '/contact' | '/account/notifications';
}

export default function MoreScreen() {
  const { colors } = useTheme();
  const { language, setLanguage, t, fonts } = useLanguage();
  const { loading: authLoading, isGuest, needsUsername, profile } = useAuth();
  const router = useRouter();
  const ac = t.account.more;

  // About / Get Involved / Contact ported from the old MVP's MoreScreen;
  // the Account section below is new.
  const menuItems: MenuItem[] = [
    { icon: Bell, label: t.account.notifications.title, href: '/account/notifications' },
    { icon: Info, label: t.more.about, href: '/about' },
    { icon: HandHeart, label: t.more.getInvolved, href: '/get-involved' },
    { icon: Phone, label: t.more.contact, href: '/contact' },
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

        {/* Account section */}
        {!authLoading && (
          <View style={styles.accountSection}>
            <Text
              style={[
                styles.sectionLabel,
                styles.accountSectionLabel,
                { color: colors.textTertiary, fontFamily: fonts.semiBold },
              ]}
            >
              {ac.heading}
            </Text>

            {isGuest ? (
              <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card }]}>
                <Text style={[styles.accountTitle, { color: colors.text, fontFamily: fonts.bold }]}>{ac.guestTitle}</Text>
                <Text style={[styles.accountBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{ac.guestBody}</Text>
                <View style={styles.accountBtnRow}>
                  <Pressable
                    onPress={() => router.push('/account/sign-in')}
                    style={({ pressed }) => [
                      styles.accountBtnSecondary,
                      { borderColor: colors.border },
                      pressed && { backgroundColor: colors.cardPressed },
                    ]}
                  >
                    <Text style={[styles.accountBtnSecondaryText, { color: colors.text, fontFamily: fonts.semiBold }]}>
                      {ac.signIn}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push('/account/sign-up')}
                    style={({ pressed }) => [styles.accountBtnPrimary, { backgroundColor: colors.primary }, pressed && { opacity: 0.85 }]}
                  >
                    <Text style={[styles.accountBtnPrimaryText, { color: colors.onPrimary, fontFamily: fonts.semiBold }]}>
                      {ac.createAlias}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : needsUsername ? (
              <Pressable
                onPress={() => router.push('/account/username')}
                style={({ pressed }) => [
                  styles.accountCard,
                  { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.accountTitle, { color: colors.text, fontFamily: fonts.bold }]}>{ac.finishSetupTitle}</Text>
                <Text style={[styles.accountBody, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{ac.finishSetupBody}</Text>
              </Pressable>
            ) : profile ? (
              <Pressable
                onPress={() => router.push('/account/profile')}
                style={({ pressed }) => [
                  styles.aliasRow,
                  { backgroundColor: colors.card, borderColor: colors.border, ...shadows.card },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.aliasAvatar, { backgroundColor: colors.primaryLightest }]}>
                  {profile.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.aliasAvatarImg} resizeMode="cover" />
                  ) : (
                    <User size={20} color={colors.primary} />
                  )}
                </View>
                <Text style={[styles.aliasUsername, { color: colors.text, fontFamily: fonts.semiBold }]}>{profile.username}</Text>
                <ChevronRight size={18} color={colors.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        )}

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
                key={item.href}
                onPress={() => router.push(item.href)}
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
                <ChevronRight
                  size={18}
                  color={colors.textTertiary}
                  strokeWidth={1.8}
                />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  accountSection: {
    marginBottom: spacing.xl,
  },
  accountSectionLabel: {
    marginBottom: spacing.sm,
  },
  accountCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  accountTitle: {
    fontSize: typography.fontSize.body,
  },
  accountBody: {
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    marginTop: spacing.xs,
  },
  accountBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  accountBtnSecondary: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  accountBtnSecondaryText: {
    fontSize: typography.fontSize.sm,
  },
  accountBtnPrimary: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  accountBtnPrimaryText: {
    fontSize: typography.fontSize.sm,
  },
  aliasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  aliasAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  aliasAvatarImg: {
    width: '100%',
    height: '100%',
  },
  aliasUsername: {
    flex: 1,
    fontSize: typography.fontSize.body,
  },

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
