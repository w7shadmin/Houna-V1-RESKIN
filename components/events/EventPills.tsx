import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Video } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid } from '@/constants/theme';
import { decodeEntities } from '@/lib/directoryProfile';
import type { EventItem } from '@/lib/hounaApi';

/** Tidy a scraped role like "Clinical Psychologist -". */
export function tidyRole(role: string): string {
  return decodeEntities(role).replace(/[\s\-–—,|]+$/, '').trim();
}

/** Status / format pills shown over an event's image (and on its detail page). */
export function EventPills({ event }: { event: Pick<EventItem, 'isVirtual' | 'status'> }) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const s = t.events.list;
  const pill = (label: string, fg: string, bg: string, border: string, icon?: React.ReactNode) => (
    <View style={[styles.pill, { backgroundColor: bg, borderColor: border }]}>
      {icon}
      <Text style={[styles.pillText, { color: fg, fontFamily: fonts.medium }]}>{label}</Text>
    </View>
  );
  const dusk = colors.tones.dusk;
  const dawn = colors.tones.dawn;
  return (
    <View style={styles.pills}>
      {event.isVirtual && pill(s.virtual, dusk.fg, colors.sheet, dusk.border, <Video size={12} color={dusk.fg} strokeWidth={1.8} />)}
      {event.status === 'ended'
        ? pill(s.past, colors.textSecondary, colors.sheet, colors.borderControl)
        : pill(s.upcoming, dawn.fg, colors.sheet, dawn.border)}
    </View>
  );
}

const styles = StyleSheet.create({
  pills: {
    flexDirection: 'row',
    gap: grid(1),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(0.5),
    height: grid(3),
    paddingHorizontal: grid(1.5),
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
  },
});
