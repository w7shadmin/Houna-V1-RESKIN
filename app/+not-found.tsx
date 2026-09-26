import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { typography, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotFoundScreen() {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();

  return (
    <>
      <Stack.Screen options={{ title: t.notFound.title }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text
          style={[
            styles.text,
            { color: colors.text, fontFamily: fonts.semiBold },
          ]}
        >
          {t.notFound.message}
        </Text>
        <Link href="/" style={styles.link}>
          <Text
            style={{
              color: colors.primary,
              fontFamily: fonts.regular,
              fontSize: typography.fontSize.body,
            }}
          >
            {t.notFound.link}
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  text: {
    fontSize: typography.fontSize.lg,
  },
  link: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
});
