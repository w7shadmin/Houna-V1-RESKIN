import React from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Award, Building2, Flag, Globe, Languages, Mail, MapPin, Phone, Users, type LucideIcon } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { grid, radius } from '@/constants/theme';
import { resolveImageUrl, type SocialLink } from '@/lib/hounaApi';
import { decodeEntities, type Fact, type FactId } from '@/lib/directoryProfile';
import SocialIcon from './SocialIcon';
import { PLATFORM_NAME, platformOf } from '@/lib/socialPlatform';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import IconTile, { type IconTileTone } from '@/components/ui/IconTile';
import Orb from '@/components/ui/Orb';
import { DirectionalIcon } from '@/components/ui/CanvasIcon';

/*
 * Building blocks for the Directory's profile pages, drawn to the canvas's
 * "Professional profile" artboard: halo avatar, display-font name, fact
 * tiles, section cards, follow buttons and a pill action at the bottom.
 */

/* ── Top bar ── */

export function ProfileTopBar({ onBack }: { onBack: () => void }) {
  const { t, isRTL } = useLanguage();
  return (
    <View style={styles.topBar}>
      <IconButton
        variant="control"
        accessibilityLabel={t.directory.common.goBack}
        onPress={onBack}
        renderIcon={(c) => <DirectionalIcon isRTL={isRTL} name="back" size={20} strokeWidth={1.8} color={c} />}
      />
    </View>
  );
}

/* ── Hero ── */

const HALO = 168;
const AVATAR = 116;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface ProfileHeroProps {
  name: string;
  role?: string;
  eyebrow?: string;
  imageUrl: string | null;
  /** `person` — photo fills the circle; `logo` — logo sits contained on a paper disc. */
  kind: 'person' | 'logo';
}

export function ProfileHero({ name, role, eyebrow, imageUrl, kind }: ProfileHeroProps) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const uri = resolveImageUrl(imageUrl);
  const labelLatin = fonts.labelTracked;

  let avatar: React.ReactNode;
  if (uri && kind === 'logo') {
    avatar = (
      <View style={[styles.avatar, styles.logoDisc]}>
        <Image source={{ uri }} style={styles.logoImg} resizeMode="contain" />
      </View>
    );
  } else if (uri) {
    avatar = (
      <View style={[styles.avatar, { backgroundColor: colors.control }]}>
        <Image source={{ uri }} style={styles.avatarImg} resizeMode="cover" />
      </View>
    );
  } else {
    avatar = (
      <View style={styles.avatar}>
        <Orb size={AVATAR} fx={0.3} fy={0.25} stops={[['#D9FAF6', 0], ['#6FD6CF', 0.55], ['#2E8F8A', 1]]} />
        <Text style={[styles.initials, { fontFamily: fonts.display }]}>{initials(name)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <View style={styles.halo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={[styles.haloOuter, { borderColor: colors.tones.glow.border }]} />
        <View style={[styles.haloInner, { borderColor: colors.borderControl }]} />
        <View style={[styles.haloDot, { backgroundColor: colors.primary, boxShadow: `0 0 12px ${colors.primary}` }]} />
        {avatar}
      </View>
      <View style={styles.heroText}>
        {!!eyebrow && (
          <Text
            style={[
              labelLatin ? styles.eyebrowLatin : styles.eyebrowArabic,
              { color: colors.primary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
            ]}
          >
            {eyebrow}
          </Text>
        )}
        <Text
          accessibilityRole="header"
          style={[styles.name, isRTL && styles.nameArabic, { color: colors.text, fontFamily: fonts.display }]}
        >
          {decodeEntities(name)}
        </Text>
        {!!role && <Text style={[styles.role, { color: colors.primary, fontFamily: fonts.medium }]}>{decodeEntities(role)}</Text>}
      </View>
    </View>
  );
}

/* ── Facts ── */

const FACT_STYLE: Record<FactId, { icon: LucideIcon; tone: IconTileTone }> = {
  location: { icon: MapPin, tone: 'glow' },
  languages: { icon: Languages, tone: 'dusk' },
  workWith: { icon: Users, tone: 'dawn' },
  experience: { icon: Award, tone: 'glow' },
  countries: { icon: Flag, tone: 'dusk' },
  organizations: { icon: Building2, tone: 'dawn' },
};

/** Values longer than this read better as a full-width row than a tile. */
const TILE_MAX_CHARS = 26;

/**
 * Short facts as the canvas's tiles (3 across when there are exactly three,
 * otherwise 2 across); long ones — street addresses — as full-width rows.
 */
export function FactGrid({ facts }: { facts: Fact[] }) {
  const { colors } = useTheme();
  const { t, fonts } = useLanguage();
  const labels = t.directory.common.facts;
  const labelLatin = fonts.labelTracked;
  const label = (f: Fact) => (f.id ? labels[f.id] : f.rawLabel);
  const styleOf = (f: Fact) => (f.id ? FACT_STYLE[f.id] : { icon: Award, tone: 'glow' as IconTileTone });

  const tiles = facts.filter((f) => f.value.length <= TILE_MAX_CHARS);
  const rows = facts.filter((f) => f.value.length > TILE_MAX_CHARS);
  const perRow = tiles.length === 3 ? 3 : 2;
  const tileRows: Fact[][] = [];
  tiles.forEach((f, i) => (i % perRow ? tileRows[tileRows.length - 1].push(f) : tileRows.push([f])));

  const labelStyle = [
    labelLatin ? styles.factLabelLatin : styles.factLabelArabic,
    { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
  ];

  return (
    <View style={styles.facts}>
      {tileRows.map((row, r) => (
        <View key={r} style={styles.factRow}>
          {row.map((f) => {
            const { icon: Icon, tone } = styleOf(f);
            return (
              <View key={f.rawLabel} style={[styles.factTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Icon size={18} color={colors.tones[tone].fg} strokeWidth={1.7} />
                <Text style={labelStyle}>{label(f)}</Text>
                <Text style={[styles.factValue, { color: colors.text, fontFamily: fonts.medium }]}>{f.value}</Text>
              </View>
            );
          })}
          {row.length < perRow && tileRows.length > 1 && <View style={styles.factSpacer} />}
        </View>
      ))}
      {rows.map((f) => {
        const { icon: Icon, tone } = styleOf(f);
        return (
          <View key={f.rawLabel} style={[styles.factLong, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <IconTile size={46} tone={tone} renderIcon={(c, size) => <Icon size={size - 2} color={c} strokeWidth={1.6} />} />
            <View style={styles.flex}>
              <Text style={labelStyle}>{label(f)}</Text>
              <Text style={[styles.factValue, { color: colors.text, fontFamily: fonts.medium }]}>{f.value}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ── Sections ── */

export function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleArabic, { color: colors.text, fontFamily: fonts.display }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function BodyText({ children }: { children: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  return <Text style={[styles.body, { color: colors.textSecondary, fontFamily: fonts.regular }]}>{decodeEntities(children)}</Text>;
}

/** Pills for a list of short items (a wellness center's services). */
export function TagList({ items }: { items: string[] }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const tone = colors.tones.glow;
  return (
    <View style={styles.tags}>
      {items.map((item, i) => (
        <View key={`${item}-${i}`} style={[styles.tag, { backgroundColor: tone.bg, borderColor: tone.border }]}>
          <Text style={[styles.tagText, { color: tone.fg, fontFamily: fonts.medium }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** Tracked label above a group that isn't a card (Follow, a roster). */
export function GroupLabel({ children }: { children: string }) {
  const { colors } = useTheme();
  const { fonts } = useLanguage();
  const labelLatin = fonts.labelTracked;
  return (
    <Text
      style={[
        labelLatin ? styles.groupLabelLatin : styles.groupLabelArabic,
        { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
      ]}
    >
      {children}
    </Text>
  );
}

/* ── Follow ── */

export function FollowRow({ socials }: { socials: SocialLink[] }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  if (socials.length === 0) return null;
  return (
    <View style={styles.group}>
      <GroupLabel>{t.directory.common.follow}</GroupLabel>
      <View style={styles.followRow}>
        {socials.map((s) => {
          const platform = platformOf(s.url, s.platform);
          return (
            <Pressable
              key={s.url}
              onPress={() => Linking.openURL(s.url).catch(() => {})}
              accessibilityRole="link"
              accessibilityLabel={PLATFORM_NAME[platform]}
              style={({ pressed }) => [
                styles.follow,
                { backgroundColor: colors.control, borderColor: colors.borderControl },
                pressed && styles.pressed,
              ]}
            >
              <SocialIcon platform={platform} size={20} color={colors.text} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ── Link row (part of an organization, website) ── */

interface LinkRowProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: IconTileTone;
  onPress: () => void;
  /** `link` opens outside the app (shows an out-arrow instead of a chevron). */
  external?: boolean;
}

export function LinkRow({ label, value, icon: Icon, tone, onPress, external }: LinkRowProps) {
  const { colors } = useTheme();
  const { fonts, isRTL } = useLanguage();
  const labelLatin = fonts.labelTracked;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [
        styles.factLong,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <IconTile size={46} tone={tone} renderIcon={(c, size) => <Icon size={size - 2} color={c} strokeWidth={1.6} />} />
      <View style={styles.flex}>
        <Text
          style={[
            labelLatin ? styles.factLabelLatin : styles.factLabelArabic,
            { color: colors.textTertiary, fontFamily: labelLatin ? fonts.labelRegular : fonts.label },
          ]}
        >
          {label}
        </Text>
        <Text numberOfLines={1} style={[styles.factValue, { color: colors.text, fontFamily: fonts.medium }]}>
          {value}
        </Text>
      </View>
      <DirectionalIcon isRTL={isRTL} name={external ? 'arrow' : 'chevron'} size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

/* ── Bottom action ── */

export interface ContactAction {
  label: string;
  href: string;
  kind: 'phone' | 'email' | 'web';
}

/**
 * The pill action at the bottom (canvas: "View full profile"), here the
 * profile's main contact. A second contact method, if any, sits beside it
 * as a round button.
 */
export function ContactActions({ primary, secondary }: { primary: ContactAction; secondary?: ContactAction }) {
  const { colors } = useTheme();
  const open = (a: ContactAction) => Linking.openURL(a.href).catch(() => {});
  const SecondaryIcon = secondary?.kind === 'phone' ? Phone : secondary?.kind === 'email' ? Mail : Globe;
  return (
    <View style={[styles.actions, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <Button label={primary.label} onPress={() => open(primary)} block style={styles.flex} />
      {secondary && (
        <IconButton
          variant="control"
          size={52}
          accessibilityLabel={secondary.label}
          onPress={() => open(secondary)}
          renderIcon={(c) => <SecondaryIcon size={20} color={c} strokeWidth={1.7} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.85,
  },
  topBar: {
    flexDirection: 'row',
  },
  hero: {
    alignItems: 'center',
    gap: grid(2),
  },
  halo: {
    width: HALO,
    height: HALO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloOuter: {
    position: 'absolute',
    top: 0,
    start: 0,
    width: HALO - 2,
    height: HALO - 2,
    borderRadius: HALO / 2,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  haloInner: {
    position: 'absolute',
    top: 14,
    start: 14,
    width: HALO - 30,
    height: HALO - 30,
    borderRadius: HALO / 2,
    borderWidth: 1,
  },
  haloDot: {
    position: 'absolute',
    top: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  logoDisc: {
    backgroundColor: '#FFFFFF',
    padding: grid(2),
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  initials: {
    position: 'absolute',
    fontSize: 40,
    color: '#0B1026',
  },
  heroText: {
    alignItems: 'center',
    gap: grid(1),
  },
  eyebrowLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
  },
  eyebrowArabic: {
    fontSize: 13.5,
  },
  name: {
    fontSize: 32,
    lineHeight: 36,
    textAlign: 'center',
  },
  nameArabic: {
    lineHeight: 48,
  },
  role: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  facts: {
    gap: grid(1),
  },
  factRow: {
    flexDirection: 'row',
    gap: grid(1),
  },
  factTile: {
    flex: 1,
    gap: grid(1),
    paddingVertical: grid(2),
    paddingHorizontal: grid(1.5),
    borderRadius: 18,
    borderWidth: 1,
  },
  factSpacer: {
    flex: 1,
  },
  factLabelLatin: {
    fontSize: 10.5,
    letterSpacing: 10.5 * 0.12,
    textTransform: 'uppercase',
  },
  factLabelArabic: {
    fontSize: 12,
  },
  factValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  factLong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
    padding: grid(1.5),
    borderRadius: radius.card,
    borderWidth: 1,
  },
  section: {
    gap: grid(1.5),
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  sectionTitleArabic: {
    lineHeight: 36,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: grid(1),
  },
  tag: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: grid(1.5),
    paddingVertical: grid(0.5),
  },
  tagText: {
    fontSize: 13,
    lineHeight: 20,
  },
  group: {
    gap: grid(1.5),
  },
  groupLabelLatin: {
    fontSize: 12,
    letterSpacing: 12 * 0.16,
    textTransform: 'uppercase',
  },
  groupLabelArabic: {
    fontSize: 13.5,
  },
  followRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: grid(1),
  },
  follow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: grid(1.5),
    paddingHorizontal: grid(2),
    paddingTop: grid(1.5),
    // The tab bar's raised Tanafas button rises 24 (+4 ring) into this bar;
    // keep the pill clear of it.
    paddingBottom: grid(4.5),
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
