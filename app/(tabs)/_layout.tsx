import React from 'react';
import { Tabs } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import TabBar from '@/components/ui/TabBar';

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.home }} />
      <Tabs.Screen
        name="directory"
        options={{
          title: t.tabs.directory,
          // Directory has its own nested Stack (hub + subpages). Without
          // this, React Navigation preserves that stack's state across
          // tab switches, so re-pressing Directory lands back on whatever
          // subpage was last open instead of the hub.
          popToTopOnBlur: true,
        }}
      />
      <Tabs.Screen name="events" options={{ title: t.tabs.events }} />
      <Tabs.Screen name="more" options={{ title: t.tabs.more }} />
    </Tabs>
  );
}
