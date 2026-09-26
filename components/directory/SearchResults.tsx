import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Building2, HeartPulse, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { radius } from '@/constants/theme';
import { resolveImageUrl } from '@/lib/hounaApi';
import type { SearchItem } from '@/lib/directorySearch';
import Card from '@/components/ui/Card';
import CanvasIcon from '@/components/ui/CanvasIcon';
import LottieTopicIcon from '@/components/directory/LottieTopicIcon';

/* Values below are the canvas "Directory search" artboard's. */

/** Section header: tracked label, optional "See all" / "Show less" link. */
export function SectionHeader({
  label,
  action,
  onAction,
}: {
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const latin = fonts.labelTracked;
  return (
    <View style={styles.sectionHead}>
      <Text
        accessibilityRole="header"
        style={[
          latin ? styles.sectionLabelLatin : styles.sectionLabelArabic,
          { color: colors.textTertiary, fontFamily: latin ? fonts.labelRegular : fonts.label },
        ]}
      >
        {label}
      </Text>
      {action && onAction && (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={10}>
          <Text style={[styles.sectionAction, { color: colors.primary, fontFamily: fonts.medium }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** The one big topic card: animation on a soft sky glow, name, description, "Learn more". */
export function TopicResultCard({
  item,
  learnMore,
  onPress,
}: {
  item: SearchItem;
  learnMore: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={item.title}
      style={({ pressed }) => [
        styles.topicCard,
        { backgroundColor: colors.card, borderColor: colors.borderControl },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.topicStage, { backgroundColor: colors.topicStage }]}>
        {/* CSS: radial-gradient(60% 100% at 50% 110%, glow 45%, transparent 70%). */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="topicGlow" gradientUnits="userSpaceOnUse" cx={50} cy={110} rx={60} ry={100} fx={50} fy={110}>
              <Stop offset="0" stopColor={colors.topicGlow} stopOpacity={0.45} />
              <Stop offset="0.7" stopColor={colors.topicGlow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={100} height={100} fill="url(#topicGlow)" />
        </Svg>
        <LottieTopicIcon slug={item.key} size={76} />
      </View>
      <View style={styles.topicBody}>
        <View style={styles.flex}>
          <Text style={[styles.topicTitle, isRTL && styles.topicTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
            {item.title}
          </Text>
          <Text style={[styles.topicDesc, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{item.subtitle}</Text>
        </View>
        <Text style={[styles.learnMore, { color: colors.primary, fontFamily: fonts.medium }]}>{learnMore}</Text>
      </View>
    </Pressable>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Article / professional / podcast / organization / wellness row. */
export function ResultRow({ item, meta, onPress }: { item: SearchItem; meta?: string; onPress: () => void }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const image = resolveImageUrl(item.imageUrl);
  const isPerson = item.type === 'professional';
  const isPodcast = item.type === 'podcast';

  let media: React.ReactNode;
  if (isPodcast) {
    media = (
      <View style={[styles.media56, { borderRadius: 16, backgroundColor: colors.action }]}>
        <CanvasIcon name="play" size={20} color={colors.onAction} />
      </View>
    );
  } else if (isPerson) {
    media = image ? (
      <Image source={{ uri: image }} style={[styles.media56, { borderRadius: 28 }]} />
    ) : (
      <View style={[styles.media56, { borderRadius: 28, backgroundColor: colors.tones.glow.bg, borderColor: colors.tones.glow.border, borderWidth: 1 }]}>
        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: colors.tones.glow.text }}>{initials(item.title)}</Text>
      </View>
    );
  } else {
    media = image ? (
      <Image source={{ uri: image }} style={[styles.media64, { backgroundColor: colors.control }]} resizeMode="cover" />
    ) : (
      <View style={[styles.media64, { backgroundColor: colors.tones.dusk.bg, borderColor: colors.tones.dusk.border, borderWidth: 1 }]} />
    );
  }

  const latin = fonts.labelTracked;
  return (
    <Card onPress={onPress} accessibilityLabel={item.title} style={styles.row}>
      {media}
      <View style={styles.rowText}>
        <Text
          numberOfLines={2}
          style={[styles.rowTitle, isPerson && styles.rowTitlePerson, { color: colors.text, fontFamily: fonts.semiBold }]}
        >
          {item.title}
        </Text>
        {isPerson ? (
          !!item.subtitle && (
            <Text numberOfLines={1} style={[styles.rowRole, { color: colors.primary, fontFamily: fonts.medium }]}>
              {item.subtitle}
            </Text>
          )
        ) : (
          !!meta && (
            <Text
              numberOfLines={1}
              style={[
                latin ? styles.rowMetaLatin : styles.rowMetaArabic,
                { color: colors.textTertiary, fontFamily: latin ? fonts.labelRegular : fonts.regular },
              ]}
            >
              {meta}
            </Text>
          )
        )}
      </View>
    </Card>
  );
}

/** "[N] organizations · matching …" tile in the places grid. */
export function PlaceCountCard({
  kind,
  count,
  sub,
  onPress,
}: {
  kind: 'organization' | 'wellness';
  count: string;
  sub: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const tone = kind === 'organization' ? colors.tones.dawn : colors.tones.dusk;
  const Icon: LucideIcon = kind === 'organization' ? Building2 : HeartPulse;
  return (
    <Card onPress={onPress} accessibilityLabel={`${count} ${sub}`} style={styles.place}>
      <Icon size={20} color={tone.fg} strokeWidth={1.6} />
      <Text style={[styles.placeCount, { color: colors.text, fontFamily: fonts.semiBold }]}>{count}</Text>
      <Text numberOfLines={2} style={[styles.placeSub, { color: colors.textTertiary, fontFamily: fonts.regular }]}>
        {sub}
      </Text>
    </Card>
  );
}

/** The crisis line that always closes the results. */
export function CrisisRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [
        styles.crisis,
        { backgroundColor: colors.crisis.bg, borderColor: colors.crisis.borderSoft },
        pressed && styles.pressed,
      ]}
    >
      <CanvasIcon name="phone" size={18} strokeWidth={1.8} color={colors.crisis.icon} />
      <Text style={[styles.crisisText, { color: colors.text, fontFamily: fonts.regular }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    gap: 4,
  },
  pressed: {
    opacity: 0.85,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabelLatin: {
    flexShrink: 1,
    fontSize: 11.5,
    letterSpacing: 11.5 * 0.14,
    textTransform: 'uppercase',
  },
  sectionLabelArabic: {
    flexShrink: 1,
    fontSize: 13,
  },
  sectionAction: {
    fontSize: 13.5,
  },
  topicCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topicStage: {
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topicBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  topicTitle: {
    fontSize: 24,
    lineHeight: 30,
  },
  topicTitleArabic: {
    lineHeight: 38,
  },
  topicDesc: {
    fontSize: 14,
    lineHeight: 14 * 1.45,
  },
  learnMore: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
  },
  media56: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  media64: {
    width: 64,
    height: 64,
    borderRadius: 16,
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 15 * 1.35,
  },
  rowTitlePerson: {
    fontSize: 15.5,
  },
  rowRole: {
    fontSize: 13.5,
  },
  rowMetaLatin: {
    fontSize: 10.5,
    letterSpacing: 10.5 * 0.12,
    textTransform: 'uppercase',
  },
  rowMetaArabic: {
    fontSize: 12,
  },
  place: {
    flex: 1,
    gap: 8,
    padding: 16,
  },
  placeCount: {
    fontSize: 14.5,
  },
  placeSub: {
    fontSize: 12.5,
  },
  crisis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  crisisText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
