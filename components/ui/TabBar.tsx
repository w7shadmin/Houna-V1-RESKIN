import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useStarfield } from '@/contexts/StarfieldContext';
import { grid, raisedButtonShadow } from '@/constants/theme';
import CanvasIcon, { type CanvasIconName } from './CanvasIcon';

/**
 * Laid out on the 8-point grid (`grid` in theme.ts). Above the bottom inset
 * the bar is 64: 8 top · 24 icon · 4 gap · 20 label · 8 bottom (20 leaves
 * Arabic marks like the shadda room above the 12px text). The raised
 * Tanafas button (56, plus a 4 ring) takes the icon's place with the same
 * bottom edge, so it rises 24 above the bar and every label shares one line.
 */
export const TAB_BAR_CONTENT_HEIGHT = grid(8);
const ICON = grid(3);
const LABEL_LINE = grid(2.5);
const RAISED = grid(7);
const RAISED_RING = grid(0.5);
/** Bottom padding when the OS reports no inset (no system buttons or home indicator). */
const MIN_BOTTOM_INSET = grid(1);

const ROUTE_ICONS: Record<string, CanvasIconName> = {
  index: 'home',
  directory: 'search',
  events: 'events',
  more: 'more',
};

/**
 * Home | Directory | [Tanafas] | Events | More, drawn to the canvas's Home
 * artboards. Tanafas is not a route: it's a raised button that opens the
 * Tanafas modal, and it never shows an active state (CLAUDE.md, Navigation
 * shape). Five equal slots; `flexDirection: 'row'` mirrors itself in RTL.
 */
export default function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const { t, fonts } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const starfield = useStarfield();

  const tabs = state.routes.map((route, index) => {
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = typeof options.title === 'string' ? options.title : route.name;
    const color = focused ? colors.tabBarActive : colors.tabBarInactive;

    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
        accessibilityRole="tab"
        aria-selected={focused}
        accessibilityLabel={label}
        style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
      >
        <CanvasIcon name={ROUTE_ICONS[route.name] ?? 'home'} size={ICON} color={color} />
        <Text
          numberOfLines={1}
          style={[styles.label, { color, fontFamily: focused ? fonts.semiBold : fonts.medium }]}
        >
          {label}
        </Text>
      </Pressable>
    );
  });

  const tanafas = (
    <Pressable
      key="tanafas"
      onPress={() => router.push('/tanafas')}
      accessibilityRole="button"
      accessibilityLabel={t.tabs.tanafas}
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.raised,
          { backgroundColor: colors.tabBarRaised },
          raisedButtonShadow(colors.tabBarRaisedRing, RAISED_RING),
        ]}
      >
        <CanvasIcon name="tanafas" size={ICON} strokeWidth={1.7} color={colors.onTabBarRaised} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.label, { color: colors.tabBarInactive, fontFamily: fonts.medium }]}
      >
        {t.tabs.tanafas}
      </Text>
    </Pressable>
  );

  // The bar runs edge-to-edge under Android's system buttons (or the iOS home
  // indicator); the 8 inside the content height keeps labels clear of them.
  const bottom = insets.bottom > 0 ? insets.bottom : MIN_BOTTOM_INSET;

  // Fades (and sinks a little) with Home's chrome while the Houna starfield opens.
  const fade = starfield
    ? { opacity: starfield.chrome, transform: [{ translateY: starfield.chrome.interpolate({ inputRange: [0, 1], outputRange: [grid(3), 0] }) }] }
    : null;

  return (
    <Animated.View
      pointerEvents={starfield?.chromeHidden ? 'none' : 'auto'}
      style={[
        fade,
        styles.bar,
        {
          // Height comes from the slots (64) + this inset + the 1px border.
          paddingBottom: bottom,
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
      ]}
    >
      {tabs.slice(0, 2)}
      {tanafas}
      {tabs.slice(2)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: grid(1),
    borderTopWidth: 1,
  },
  slot: {
    flex: 1,
    height: TAB_BAR_CONTENT_HEIGHT,
    alignItems: 'center',
    paddingTop: grid(1),
    gap: grid(0.5),
  },
  label: {
    height: LABEL_LINE,
    fontSize: 12,
    lineHeight: LABEL_LINE,
    textAlign: 'center',
    includeFontPadding: false,
  },
  raised: {
    width: RAISED,
    height: RAISED,
    // Same bottom edge as a 24 icon: 56 − 24 = 32 rises above the slot's icon line.
    marginTop: ICON - RAISED,
    borderRadius: RAISED / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
