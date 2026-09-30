import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HounaMark from '@/components/HounaMark';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, layout } from '@/constants/theme';

/**
 * Over the whole app when this version is older than the oldest still allowed (`app_config`
 * min_version, lib/remoteConfig.ts). The crisis lines stay one tap away, even here: the root layout
 * lifts this screen while /crisis is open. Update opens the store page when one is set; until
 * there is one (testers install by file), it just says to get the new version.
 */
export default function UpdateRequired({ updateUrl }: { updateUrl: string | null }) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = t.update;

  return (
    <View
      style={[styles.screen, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}
      accessibilityViewIsModal
    >
      <View style={styles.column}>
        <View style={styles.mark}>
          <HounaMark size={64} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text, fontFamily: fonts.display }]}>
          {s.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
          {updateUrl ? s.body : s.bodyNoStore}
        </Text>
        <View style={styles.actions}>
          {!!updateUrl && <Button block label={s.update} onPress={() => Linking.openURL(updateUrl).catch(() => {})} />}
          <Button block variant="secondary" label={t.home.crisisButton} onPress={() => router.push('/crisis')} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'center',
    gap: grid(2),
  },
  mark: {
    alignItems: 'center',
    marginBottom: grid(1),
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    gap: grid(1.5),
    marginTop: grid(2),
  },
});
