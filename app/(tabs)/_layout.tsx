import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Search, CalendarDays, Menu, Wind } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { colors, palette, shadows } from '@/constants/theme';
import { mix } from '@/lib/color';

const FLOATING_BUTTON_GRADIENT: readonly [string, string, string] = [
  mix(colors.primary, palette.white, 0.55),
  colors.primary,
  mix(colors.primary, palette.black, 0.12),
];

const TAB_BAR_HEIGHT = 60;

export default function TabsLayout() {
  const { t, fonts } = useLanguage();
  const router = useRouter();
  // Android's edge-to-edge display (on by default since Expo SDK 54) draws
  // app content behind the system nav bar / gesture pill — without adding
  // this inset ourselves, the system UI overlaps our fixed-height tab bar.
  // This is a real platform requirement, not a dev-only Expo Go quirk; it
  // doesn't go away in a production build.
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <View style={styles.fill}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tabBarActive,
          tabBarInactiveTintColor: colors.tabBarInactive,
          tabBarStyle: {
            backgroundColor: colors.tabBarBackground,
            paddingTop: 4,
            paddingBottom: insets.bottom,
            height: tabBarHeight,
            ...shadows.tab,
          },
          tabBarLabelStyle: {
            fontFamily: fonts.semiBold,
            fontSize: 11,
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.tabs.home,
            tabBarIcon: ({ color, size }) => (
              <House size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="directory"
          options={{
            title: t.tabs.directory,
            tabBarIcon: ({ color, size }) => (
              <Search size={size} color={color} strokeWidth={1.8} />
            ),
            // Directory has its own nested Stack (hub + subpages). Without
            // this, React Navigation preserves that stack's state across
            // tab switches, so re-pressing Directory lands back on whatever
            // subpage was last open instead of the hub.
            popToTopOnBlur: true,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: t.tabs.events,
            tabBarIcon: ({ color, size }) => (
              <CalendarDays size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: t.tabs.more,
            tabBarIcon: ({ color, size }) => (
              <Menu size={size} color={color} strokeWidth={1.8} />
            ),
          }}
        />
      </Tabs>

      {/* Tanafas — raised centre button, not a tab. Opens a modal; it
          never reflects an active/selected state since it isn't part of
          the tab navigator's route state. */}
      <View
        pointerEvents="box-none"
        style={[styles.floatingWrap, { height: tabBarHeight }]}
      >
        <Pressable
          onPress={() => router.push('/tanafas')}
          hitSlop={8}
          style={({ pressed }) => [
            styles.floatingButton,
            { borderColor: colors.background },
            pressed && styles.floatingButtonPressed,
          ]}
        >
          <LinearGradient
            colors={FLOATING_BUTTON_GRADIENT}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingButtonFill}
          >
            <Wind size={26} color={colors.onPrimary} strokeWidth={2.2} />
          </LinearGradient>
        </Pressable>
        <Text
          style={[
            styles.floatingLabel,
            { color: colors.tabBarInactive, fontFamily: fonts.semiBold },
          ]}
        >
          {t.tabs.tanafas}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  floatingWrap: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    alignItems: 'center',
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -20 }],
    ...shadows.cardLg,
  },
  floatingButtonFill: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtonPressed: {
    opacity: 0.9,
  },
  floatingLabel: {
    fontSize: 11,
    marginTop: -14,
  },
});
