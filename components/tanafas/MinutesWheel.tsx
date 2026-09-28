import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { MEDITATION_CUSTOM_RANGE, MEDITATION_MINUTES } from '@/constants/breathPatterns';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';

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

/**
 * The meditation lengths on a wheel (canvas "Players — choosing a length"): the chosen one large
 * in the middle with its unit, its neighbours smaller and fainter above and below. Scroll it (it
 * settles on a row) or tap a length; the last row, Custom, sets any length from 1 to 120 minutes
 * with − and +. Done takes it.
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
  const scroll = useRef<ScrollView>(null);

  // Open on the current length.
  useEffect(() => {
    const i = indexOf(value);
    setPicked(i);
    if (value !== null && !MEDITATION_MINUTES.includes(value)) setCustom(value);
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
        // Any length: a minute at a time.
        <View style={styles.stepper}>
          <IconButton
            variant="control"
            accessibilityLabel={h.fewerMinutes}
            onPress={() => setCustom((m) => clampCustom(m - 1))}
            disabled={custom <= MEDITATION_CUSTOM_RANGE[0]}
            renderIcon={(c) => <Minus size={20} strokeWidth={1.8} color={c} />}
          />
          <View style={styles.customValue} accessibilityLiveRegion="polite">
            <Text style={[styles.numberOn, { color: colors.text, fontFamily: isRTL ? fonts.display : fonts.numeral }]}>{num(custom)}</Text>
            <Text style={[styles.unit, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{unit(custom)}</Text>
          </View>
          <IconButton
            variant="control"
            accessibilityLabel={h.moreMinutes}
            onPress={() => setCustom((m) => clampCustom(m + 1))}
            disabled={custom >= MEDITATION_CUSTOM_RANGE[1]}
            renderIcon={(c) => <Plus size={20} strokeWidth={1.8} color={c} />}
          />
        </View>
      )}
      <Button block label={h.done} onPress={() => onDone(isCustom ? custom : (chosen as number | null))} />
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  customValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    minWidth: 128,
    justifyContent: 'center',
  },
});
