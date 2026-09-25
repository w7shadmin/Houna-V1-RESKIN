import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { alpha } from '@/constants/theme';
import IconButton from '@/components/ui/IconButton';
import type { IconTileTone } from '@/components/ui/IconTile';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';
import { NATIVE_DRIVER } from './BreatheStages';

/**
 * The Tanafas player layout from the canvas — stage, title row with carousel
 * arrows, tag, description, pager, info tiles and the big round button —
 * shared by the Breathe and Meditate carousels and by the Breathe sessions,
 * which run in place: the same slots fade over to round, phase and time left.
 */

/** Fades (and lifts) its content in on mount; give it a new `key` to play again. */
export function FadeIn({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, useNativeDriver: NATIVE_DRIVER }).start();
  }, [v]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] });
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY }] }]}>{children}</Animated.View>;
}

export interface CarouselNav {
  count: number;
  index: number;
  onPrev: () => void;
  onNext: () => void;
}

interface PlayerFrameProps {
  stage: React.ReactNode;
  /** Title (display face) and, beneath it, a tag or session label. */
  heading: React.ReactNode;
  label: React.ReactNode;
  body: React.ReactNode;
  /** The carousel arrows and pager — only while browsing. */
  nav?: CarouselNav | null;
  /** Info tiles, or a session's progress. */
  info: React.ReactNode;
  controls: React.ReactNode;
  /** Changing it fades the text, info and controls over to the new state. */
  mode: string;
}

export default function PlayerFrame({ stage, heading, label, body, nav, info, controls, mode }: PlayerFrameProps) {
  const { colors } = useTheme();
  const { t, isRTL } = useLanguage();
  const h = t.discover.hub;

  const arrow = (dir: 'prev' | 'next') => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dir === 'prev' ? h.previous : h.next}
      onPress={dir === 'prev' ? nav?.onPrev : nav?.onNext}
      disabled={!nav}
      // Out of sight during a session: out of the accessibility tree too.
      aria-hidden={!nav}
      accessibilityElementsHidden={!nav}
      importantForAccessibility={nav ? 'auto' : 'no-hide-descendants'}
      style={[styles.arrow, !nav && styles.hidden]}
    >
      <DirectionalIcon isRTL={isRTL} name={dir === 'prev' ? 'chevronStart' : 'chevron'} size={20} strokeWidth={1.8} color={colors.textSecondary} />
    </Pressable>
  );

  return (
    <View style={styles.player}>
      {/* Scrolls only when a long completion message wouldn't otherwise fit. */}
      <ScrollView style={styles.player} contentContainerStyle={styles.stageArea} showsVerticalScrollIndicator={false} bounces={false}>
        {stage}

        <View style={styles.titleRow}>
          {arrow('prev')}
          <FadeIn key={`h-${mode}`} style={styles.titleBlock}>
            {heading}
            {label}
          </FadeIn>
          {arrow('next')}
        </View>

        <FadeIn key={`b-${mode}`} style={styles.body}>
          {body}
        </FadeIn>

        <View style={[styles.pager, !nav && styles.hidden]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {Array.from({ length: nav?.count ?? 1 }, (_, k) => (
            <View
              key={k}
              style={[
                styles.pagerDot,
                k === nav?.index ? { width: 22, backgroundColor: colors.text } : { backgroundColor: colors.textTertiary, opacity: 0.45 },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <FadeIn key={`i-${mode}`} style={styles.info}>
          {info}
        </FadeIn>
        <View style={styles.controls}>{controls}</View>
      </View>
    </View>
  );
}

/* ── Text ── */

export function Heading({ children }: { children: string }) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  return (
    <Text accessibilityRole="header" style={[styles.heading, isRTL && styles.headingArabic, { color: colors.text, fontFamily: fonts.display }]}>
      {children}
    </Text>
  );
}

export function Body({ children }: { children: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return <Text style={[styles.desc, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{children}</Text>;
}

/** The technique pill under a carousel title. */
export function Tag({ label, tone }: { label: string; tone: IconTileTone }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const fg = colors.tones[tone].fg;
  const latin = fonts.labelTracked;
  return (
    <View style={[styles.tag, { backgroundColor: alpha(fg, 0.12), borderColor: alpha(fg, 0.32) }]}>
      <Text style={[latin ? styles.tagLatin : styles.tagArabic, { color: fg, fontFamily: latin ? fonts.labelRegular : fonts.label }]}>{label}</Text>
    </View>
  );
}

/** Tracked caps (Latin) / plain Plex (Arabic) — round, step and time labels. */
export function TrackedLabel({ children, color, active }: { children: string; color?: string; active?: boolean }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const latin = fonts.labelTracked;
  return (
    <Text
      style={[
        latin ? styles.labelLatin : styles.labelArabic,
        { color: color ?? (active ? colors.text : colors.textTertiary), fontFamily: latin ? fonts.labelRegular : fonts.label },
      ]}
    >
      {children}
    </Text>
  );
}

/* ── Info ── */

export function InfoTiles({ children }: { children: React.ReactNode }) {
  return <View style={styles.tiles}>{children}</View>;
}

export function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const latin = fonts.labelTracked;
  return (
    <View style={[styles.tile, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
      <Text style={[latin ? styles.tileLabelLatin : styles.tileLabelArabic, { color: colors.textTertiary, fontFamily: latin ? fonts.labelRegular : fonts.label }]}>
        {label}
      </Text>
      {typeof children === 'string' ? <Text style={[styles.tileValue, { color: colors.text, fontFamily: fonts.medium }]}>{children}</Text> : children}
    </View>
  );
}

/** A thin progress track with a label beneath (time left, step, group). */
export function ProgressInfo({ progress, label, color }: { progress: number; label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.progress}>
      <View
        style={[styles.track, { backgroundColor: colors.borderControl }]}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <View style={[styles.fill, { width: `${Math.min(progress, 1) * 100}%`, backgroundColor: color }]} />
      </View>
      <TrackedLabel>{label}</TrackedLabel>
    </View>
  );
}

/* ── Controls ── */

/** The big round button (begin / pause / next), lit with the exercise's glow. */
export function MainButton({ label, glow, onPress, renderIcon }: { label: string; glow: string; onPress: () => void; renderIcon: (color: string) => React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.main, { backgroundColor: colors.action, boxShadow: `0 0 36px ${glow}` }, pressed && styles.pressed]}
    >
      {renderIcon(colors.onAction)}
    </Pressable>
  );
}

export function SideButton({ label, onPress, disabled, renderIcon }: { label: string; onPress: () => void; disabled?: boolean; renderIcon: (color: string) => React.ReactNode }) {
  return <IconButton variant="control" size={56} accessibilityLabel={label} onPress={onPress} disabled={disabled} renderIcon={renderIcon} />;
}

/** Holds a side button's place so the main button stays centred. */
export function SideSpacer() {
  return <View style={styles.side} />;
}

const styles = StyleSheet.create({
  player: {
    flex: 1,
  },
  stageArea: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  titleRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hidden: {
    opacity: 0,
  },
  titleBlock: {
    flex: 1,
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  heading: {
    fontSize: 27,
    lineHeight: 27 * 1.12,
    textAlign: 'center',
  },
  headingArabic: {
    lineHeight: 40,
  },
  body: {
    alignItems: 'center',
    minHeight: 44,
  },
  desc: {
    maxWidth: 310,
    fontSize: 14.5,
    lineHeight: 14.5 * 1.5,
    textAlign: 'center',
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagLatin: {
    fontSize: 11,
    letterSpacing: 11 * 0.12,
    textTransform: 'uppercase',
  },
  tagArabic: {
    fontSize: 12.5,
  },
  labelLatin: {
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.14,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  labelArabic: {
    fontSize: 13,
    textAlign: 'center',
  },
  pager: {
    flexDirection: 'row',
    gap: 8,
  },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bottom: {
    gap: 16,
  },
  info: {
    minHeight: 72,
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: 12,
  },
  tile: {
    flex: 1,
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  tileLabelLatin: {
    fontSize: 10.5,
    letterSpacing: 10.5 * 0.14,
    textTransform: 'uppercase',
  },
  tileLabelArabic: {
    fontSize: 12,
  },
  tileValue: {
    fontSize: 16,
  },
  progress: {
    width: 280,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 12,
  },
  track: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  main: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  side: {
    width: 56,
    height: 56,
  },
  pressed: {
    opacity: 0.85,
  },
});
