import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha, grid, layout } from '@/constants/theme';
import { arabicNumber, arabicPlural } from '@/lib/arabicNumerals';
import { formatEntryDateLong } from '@/lib/journal';
import { CONSTELLATIONS, type Constellation } from '@/lib/constellations';
import IconButton from '@/components/ui/IconButton';
import Button from '@/components/ui/Button';
import ScreenGlow from '@/components/ui/ScreenGlow';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';
import NightStars from '@/components/home/NightStars';
import ConstellationSky from '@/components/profile/ConstellationSky';
import { useConstellation } from '@/hooks/useConstellation';

/**
 * Your sky, whole, from Profile: the constellation the person chose, traced from the real sky, a
 * star lit for each breathing or meditation session since (hooks/useConstellation.ts; the phone's
 * own log, so Guests have it too). Tap a star for its name and when it lit. Until one is chosen,
 * and whenever they choose another, it asks: "What constellation would you like to breathe life
 * into?", the ten from the easiest (five stars) to Scorpius (fifteen).
 */
export default function YourSkyScreen() {
  const { colors, isNight } = useTheme();
  const { t, fonts, isRTL, language } = useLanguage();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const c = t.profile.constellation;
  const num = (n: number) => (isRTL ? arabicNumber(n) : String(n));
  const sky = useConstellation();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<number | undefined>(undefined);

  const current = sky?.constellation ?? null;
  const showPicker = !!sky && (picking || !current);
  // Open on the star lit last (or the first, before any).
  useEffect(() => {
    if (sky && current) setSelected(Math.max(0, Math.min(sky.lit.length, current.stars.length) - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, sky?.lit.length]);

  const w = Math.min(width, layout.maxContentWidth) - layout.screenPadding * 2;
  const h = Math.min(380, Math.max(260, height * 0.44));
  const back = () => {
    if (picking && current) return setPicking(false);
    router.canGoBack() ? router.back() : router.replace('/profile');
  };
  const dateOf = (ms: number) => formatEntryDateLong(new Date(ms), t.journal.dateNames, num);
  const starName = (k: Constellation, i: number) => {
    const n = k.stars[i].name;
    return (language === 'ar' ? n?.ar : undefined) ?? n?.en ?? c.unnamed.replace('{n}', num(i + 1));
  };
  const starState = (i: number) =>
    !sky ? '' : i < sky.lit.length ? c.litOn.replace('{date}', dateOf(sky.lit[i])) : i === sky.lit.length ? c.nextStar : c.toCome;
  const size = (k: Constellation) => arabicPlural(k.stars.length, c.size).replace('{n}', num(k.stars.length));
  const doneCount = sky?.progress.completed.length ?? 0;

  const choose = (id: string) => {
    sky?.choose(id);
    setPicking(false);
  };

  const label = (text: string) => (
    <Text
      style={[
        fonts.labelTracked ? styles.labelLatin : styles.labelArabic,
        { color: colors.primary, fontFamily: fonts.labelTracked ? fonts.labelRegular : fonts.label },
      ]}
    >
      {text}
    </Text>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {isNight && <NightStars />}
      <ScreenGlow color={alpha(colors.tones.glow.hue, isNight ? 0.12 : 0.18)} rx={70} ry={40} cy={60} />
      <ScrollView contentContainerStyle={styles.column}>
        <View>
          <IconButton
            variant="control"
            accessibilityLabel={t.directory.common.goBack}
            onPress={back}
            renderIcon={(col) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={col} />}
          />
        </View>

        {showPicker ? (
          <>
            <View style={styles.header}>
              {label(c.eyebrow)}
              <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
                {c.prompt}
              </Text>
              <Text style={[styles.line, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{current ? c.pickerNote : c.promptBody}</Text>
            </View>
            <View style={styles.grid}>
              {CONSTELLATIONS.map((k) => {
                const isCurrent = current?.id === k.id;
                const tile = (w - grid(1.5)) / 2;
                return (
                  <Pressable
                    key={k.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${k.name[language]}, ${size(k)}`}
                    onPress={() => choose(k.id)}
                    style={({ pressed }) => [
                      styles.tile,
                      { width: tile, backgroundColor: colors.card, borderColor: isCurrent ? colors.tones.glow.fg : colors.border },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ConstellationSky constellation={k} lit={k.stars.length} width={tile - grid(2)} height={tile * 0.7} still />
                    <Text style={[styles.tileName, { color: colors.text, fontFamily: fonts.semiBold }]} numberOfLines={2}>
                      {k.name[language]}
                    </Text>
                    <Text style={[styles.tileMeta, { color: isCurrent ? colors.tones.glow.text : colors.textSecondary, fontFamily: fonts.regular }]}>
                      {isCurrent ? `${c.current} · ${size(k)}` : size(k)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : current && sky ? (
          <>
            <View style={styles.header}>
              {label(c.eyebrow)}
              <Text accessibilityRole="header" style={[styles.title, isRTL && styles.titleArabic, { color: colors.text, fontFamily: fonts.display }]}>
                {current.name[language]}
              </Text>
              <Text style={[styles.line, { color: colors.textSecondary, fontFamily: fonts.regular }]}>
                {sky.complete
                  ? c.complete.replace('{name}', current.name[language])
                  : `${c.lit.replace('{lit}', num(sky.lit.length)).replace('{n}', num(current.stars.length))}. ${c.how}`}
              </Text>
            </View>
            <View style={styles.sky}>
              <ConstellationSky
                constellation={current}
                lit={sky.lit.length}
                width={w}
                height={h}
                big
                selected={selected}
                onPick={setSelected}
                starLabel={(i) => `${starName(current, i)}, ${starState(i)}`}
              />
            </View>
            {selected !== undefined && selected < current.stars.length && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLiveRegion="polite">
                <Text style={[styles.cardName, { color: colors.text, fontFamily: fonts.medium }]}>{starName(current, selected)}</Text>
                <Text style={[styles.cardState, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{starState(selected)}</Text>
              </View>
            )}
            {sky.complete ? (
              <Button block variant="glow" label={c.next} onPress={() => setPicking(true)} />
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setPicking(true)} hitSlop={8} style={({ pressed }) => [styles.change, pressed && styles.pressed]}>
                <Text style={[styles.changeText, { color: colors.primary, fontFamily: fonts.medium }]}>{c.change}</Text>
              </Pressable>
            )}
            {doneCount > 0 && (
              <Text style={[styles.done, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
                {arabicPlural(doneCount, c.done).replace('{n}', num(doneCount))}
              </Text>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  column: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    padding: layout.screenPadding,
    paddingBottom: grid(5),
    gap: grid(2),
  },
  header: {
    gap: grid(1),
  },
  labelLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.16,
    textTransform: 'uppercase',
  },
  labelArabic: {
    fontSize: 13,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
  },
  titleArabic: {
    lineHeight: 48,
  },
  line: {
    fontSize: 15,
    lineHeight: 22,
  },
  sky: {
    alignItems: 'center',
  },
  card: {
    gap: grid(0.5),
    paddingVertical: grid(2),
    paddingHorizontal: grid(2),
    borderRadius: 22,
    borderWidth: 1,
  },
  cardName: {
    fontSize: 16,
  },
  cardState: {
    fontSize: 14,
  },
  change: {
    alignSelf: 'center',
    paddingVertical: grid(1),
  },
  changeText: {
    fontSize: 15,
  },
  done: {
    fontSize: 13,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: grid(1.5),
  },
  tile: {
    borderRadius: 22,
    borderWidth: 1,
    padding: grid(1),
    gap: grid(0.5),
    alignItems: 'center',
  },
  tileName: {
    fontSize: 15,
    textAlign: 'center',
  },
  tileMeta: {
    fontSize: 13,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
