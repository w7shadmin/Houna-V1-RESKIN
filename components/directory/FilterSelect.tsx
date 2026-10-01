import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import GlassSheet from '@/components/ui/GlassSheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';
import { arabicNumber } from '@/lib/arabicNumerals';

export interface FilterOption {
  value: string;
  label: string;
  /** One plain line under the label ("Medical doctors who can prescribe"). */
  hint?: string;
  /** How many the choice would show. */
  count?: number;
}

/**
 * A list's filters as small pills in one row (the professionals list had a panel of four): each shows
 * its name until something is chosen, then the choice, lit. A tap opens `FilterSheet`, which the
 * screen renders once at its root (a GlassSheet covers its parent, so it can't live in the list).
 */
export function FilterPill({ label, value, options, onPress }: { label: string; value: string; options: FilterOption[]; onPress: () => void }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const chosen = value ? options.find((o) => o.value === value) : undefined;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={chosen ? `${label}: ${chosen.label}` : label}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [
        styles.pill,
        chosen
          ? { backgroundColor: colors.tones.glow.bg, borderColor: colors.primary }
          : { backgroundColor: colors.control, borderColor: colors.borderControl },
        pressed && styles.pressed,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.pillText, { color: chosen ? colors.primary : colors.text, fontFamily: chosen ? fonts.semiBold : fonts.medium }]}
      >
        {chosen ? chosen.label : label}
      </Text>
      <ChevronDown size={16} color={chosen ? colors.primary : colors.textTertiary} />
    </Pressable>
  );
}

/** The choices for one filter, in the check-in's glass; the first option (value '') is "any". */
export function FilterSheet({
  visible,
  title,
  value,
  options,
  onChange,
  onClose,
}: {
  visible: boolean;
  title: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { fonts, isRTL, t } = useLanguage();
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  return (
    <GlassSheet visible={visible} onClose={onClose} eyebrow={t.directory.common.filters} title={title} closeLabel={t.checkIn.close}>
      <ScrollView style={styles.sheetList} contentContainerStyle={styles.sheetContent}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value || 'any'}
              onPress={() => {
                onChange(o.value);
                onClose();
              }}
              accessibilityRole="radio"
              aria-checked={on}
              style={({ pressed }) => [styles.row, { borderBottomColor: colors.borderLight }, pressed && styles.pressed]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowLabel, { color: on ? colors.primary : colors.text, fontFamily: on ? fonts.semiBold : fonts.medium }]}>
                  {o.label}
                  {o.count !== undefined ? <Text style={{ color: colors.textTertiary, fontFamily: fonts.regular }}>{`  ${num(o.count)}`}</Text> : null}
                </Text>
                {!!o.hint && <Text style={[styles.rowHint, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{o.hint}</Text>}
              </View>
              {on && <Check size={20} color={colors.primary} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(0.5),
    minHeight: 40,
    paddingStart: grid(2),
    paddingEnd: grid(1.5),
    borderRadius: radius.full,
    borderWidth: 1,
    flexShrink: 1,
  },
  pillText: {
    fontSize: 14,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  sheetList: {
    maxHeight: 420,
  },
  sheetContent: {
    paddingBottom: grid(1),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
    minHeight: 56,
    paddingVertical: grid(1.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: grid(0.5),
  },
  rowLabel: {
    fontSize: 16,
  },
  rowHint: {
    fontSize: 13,
    lineHeight: 18,
  },
});
