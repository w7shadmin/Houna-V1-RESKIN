import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextStyle } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MEDITATION_CUSTOM_RANGE, MEDITATION_MINUTES } from '@/constants/breathPatterns';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import Button from '@/components/ui/Button';
import { radius } from '@/constants/theme';

const ROW = 56;
/** Five rows show: the chosen one in the middle, two either side. */
const VISIBLE = 5;
const VIEW = ROW * VISIBLE;
const PAD = ROW * ((VISIBLE - 1) / 2);

/** The wheel's rows: the set lengths, then Custom. */
const CUSTOM = 'custom' as const;
type Row = number | null | typeof CUSTOM;
const ROWS: readonly Row[] = [...MEDITATION_MINUTES, CUSTOM];

const clampCustom = (m: number) => Math.min(MEDITATION_CUSTOM_RANGE[1], Math.max(MEDITATION_CUSTOM_RANGE[0], Math.round(m)));

/** Digits as typed (an Arabic keyboard types ٠–٩), as a number; empty is 0. */
export function typedNumber(text: string): number {
  const latin = text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/D/g, '');
  return latin ? parseInt(latin, 10) : 0;
}

const WEB_NO_OUTLINE = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextStyle) : null;

/**
 * The meditation lengths on a wheel (canvas "Players — choosing a length"): the chosen one large
 * in the middle with its unit, its neighbours smaller and fainter above and below. Scroll it (it
 * settles on a row) or tap a length; the last row, Custom, takes a typed length in hours and
 * minutes, from 1 minute to 8 hours (MEDITATION_CUSTOM_RANGE). Done takes it.
 */
export default function MinutesWheel({ value, onDone }: { value: number | null; onDone: (m: number | null) => void }) {
  const { colors } = useTheme();
  const { t, fonts, isRTL } = useLanguage();
  const h = t.discover.hub;
  const indexOf = (v: number | null) => {
    const i = ROWS.indexOf(v);
    return i >= 0 ? i : ROWS.length - 1;
  };
  const [picked, setPicked] = useState(indexOf(value));
  const [custom, setCustom] = useState(() => (value !== null && !MEDITATION_MINUTES.includes(value) ? value : 25));
  // What's in the two boxes, as typed; `custom` follows them.
  const [hoursText, setHoursText] = useState(() => String(Math.floor(custom / 60)));
  const [minutesText, setMinutesText] = useState(() => String(custom % 60));
  // The box being typed in takes the accent border (the browser's own focus ring is off, below).
  const [focusedBox, setFocusedBox] = useState<'hours' | 'minutes' | null>(null);
  const typed = typedNumber(hoursText) * 60 + typedNumber(minutesText);
  const typedOk = typed >= MEDITATION_CUSTOM_RANGE[0] && typed <= MEDITATION_CUSTOM_RANGE[1];
  useEffect(() => {
    if (typedOk) setCustom(typed);
  }, [typed, typedOk]);
  const setBoxes = (m: number) => {
    setHoursText(String(Math.floor(m / 60)));
    setMinutesText(String(m % 60));
  };
  const scroll = useRef<ScrollView>(null);

  // Open on the current length.
  useEffect(() => {
    const i = indexOf(value);
    setPicked(i);
    if (value !== null && !MEDITATION_MINUTES.includes(value)) {
      setCustom(value);
      setBoxes(value);
    }
    requestAnimationFrame(() => scroll.current?.scrollTo({ y: i * ROW, animated: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.min(ROWS.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ROW)));
    if (i !== picked) setPicked(i);
  };
  const pick = (i: number) => {
    setPicked(i);
    scroll.current?.scrollTo({ y: i * ROW, animated: true });
  };

  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const unit = (m: number) => arabicPlural(m, t.tanafas.meditation.player.min).replace('{n}', '').trim();
  const label = (r: Row) => (r === null ? h.noLimit : r === CUSTOM ? h.custom : `${num(r)} ${unit(r)}`);
  const chosen = ROWS[picked];
  const isCustom = chosen === CUSTOM;

  return (
    <View style={styles.wrap}>
      <View style={styles.window}>
        <ScrollView
          ref={scroll}
          accessibilityRole="radiogroup"
          showsVerticalScrollIndicator={false}
          snapToInterval={ROW}
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.list}
          nestedScrollEnabled
        >
          {ROWS.map((r, i) => {
            const d = Math.abs(i - picked);
            return (
              <Pressable
                key={String(r)}
                accessibilityRole="radio"
                aria-checked={d === 0}
                accessibilityLabel={label(r)}
                onPress={() => pick(i)}
                style={[styles.row, { opacity: d === 0 ? 1 : d === 1 ? 0.45 : 0.2 }]}
              >
                {r === CUSTOM ? (
                  <Text style={[d === 0 ? styles.customOn : styles.custom, { color: colors.text, fontFamily: isRTL ? fonts.display : fonts.regular }]}>{h.custom}</Text>
                ) : (
                  <>
                    <Text style={[styles.number, d === 0 && styles.numberOn, { color: colors.text, fontFamily: isRTL ? fonts.display : fonts.numeral }]}>
                      {r === null ? '∞' : num(r)}
                    </Text>
                    {d === 0 && <Text style={[styles.unit, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{r === null ? h.noLimit : unit(r)}</Text>}
                  </>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      {isCustom && (
        // Any length, typed: hours and minutes.
        <View style={styles.customWrap}>
          <View style={styles.boxes}>
            {(
              [
                [h.hours, hoursText, 'hours', 1],
                [h.minutes, minutesText, 'minutes', 2],
              ] as const
            ).map(([label, text, which, maxLength]) => (
              <View key={label} style={styles.box}>
                <TextInput
                  value={text}
                  onChangeText={(v) => (which === 'hours' ? setHoursText(v) : setMinutesText(v))}
                  keyboardType="number-pad"
                  maxLength={maxLength}
                  selectTextOnFocus
                  onFocus={() => setFocusedBox(which)}
                  onBlur={() => setFocusedBox((f) => (f === which ? null : f))}
                  accessibilityLabel={label}
                  style={[
                    styles.boxInput,
                    WEB_NO_OUTLINE,
                    { color: colors.text, borderColor: focusedBox === which ? colors.primary : colors.border, backgroundColor: colors.card, fontFamily: fonts.numeral },
                  ]}
                />
                <Text style={[styles.boxLabel, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{label}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.limit, { color: typedOk ? colors.textTertiary : colors.danger, fontFamily: fonts.regular }]} accessibilityLiveRegion="polite">
            {h.customLimit.replace('{max}', num(MEDITATION_CUSTOM_RANGE[1] / 60))}
          </Text>
        </View>
      )}
      <Button
        block
        label={h.done}
        disabled={isCustom && !typedOk}
        onPress={() => onDone(isCustom ? clampCustom(typed) : (chosen as number | null))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  window: {
    height: VIEW,
  },
  list: {
    paddingVertical: PAD,
  },
  row: {
    height: ROW,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  number: {
    fontSize: 32,
  },
  numberOn: {
    fontSize: 44,
  },
  unit: {
    fontSize: 20,
  },
  custom: {
    fontSize: 22,
  },
  customOn: {
    fontSize: 28,
  },
  customWrap: {
    alignItems: 'center',
    gap: 8,
  },
  boxes: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  box: {
    alignItems: 'center',
    gap: 8,
  },
  boxInput: {
    width: 96,
    height: 64,
    borderWidth: 1,
    borderRadius: radius.card,
    fontSize: 32,
    textAlign: 'center',
  },
  boxLabel: {
    fontSize: 14,
  },
  limit: {
    fontSize: 13,
  },
});
