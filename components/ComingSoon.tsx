import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, spacing, typography, radius } from '@/constants/theme';

export default function ComingSoon() {
  const { t, fonts } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.primaryLightest }]}>
        <Sparkles size={32} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text
        style={[
          styles.title,
          { color: colors.text, fontFamily: fonts.semiBold },
        ]}
      >
        {t.common.comingSoon}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxxl,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.lg,
  },
});
