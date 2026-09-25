import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { raisedButtonShadow } from '@/constants/theme';
import CanvasIcon, { type CanvasIconName } from './CanvasIcon';

/** Height of the bar above the bottom inset — canvas nav is 100 with 24 of bottom padding. */
export const TAB_BAR_CONTENT_HEIGHT = 76;
const MIN_BOTTOM_PADDING = 24;
/** Space between the labels and the system navigation area when there is one. */
const SYSTEM_BAR_GAP = 12;

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
  const { t, fonts, isRTL } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  const labelSize = isRTL ? 12 : 11.5;

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
        <CanvasIcon name={ROUTE_ICONS[route.name] ?? 'home'} color={color} />
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            { color, fontSize: labelSize, fontFamily: focused ? fonts.semiBold : fonts.medium },
          ]}
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
          raisedButtonShadow(colors.tabBarRaisedRing),
        ]}
      >
        <CanvasIcon name="tanafas" size={28} strokeWidth={1.7} color={colors.onTabBarRaised} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.label, { color: colors.tabBarInactive, fontSize: labelSize, fontFamily: fonts.medium }]}
      >
        {t.tabs.tanafas}
      </Text>
    </Pressable>
  );

  // With Android's system buttons (or a home indicator) under the bar, keep
  // clear space above them; with none, use the canvas's 24.
  const bottom = insets.bottom > 0 ? insets.bottom + SYSTEM_BAR_GAP : MIN_BOTTOM_PADDING;

  return (
    <View
      style={[
        styles.bar,
        {
          height: TAB_BAR_CONTENT_HEIGHT + bottom,
          paddingBottom: bottom,
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
        },
      ]}
    >
      {tabs.slice(0, 2)}
      {tanafas}
      {tabs.slice(2)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    borderTopWidth: 1,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  label: {
    textAlign: 'center',
  },
  raised: {
    width: 64,
    height: 64,
    marginTop: -34,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
