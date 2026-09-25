/**
 * Houna Mental Health App — Design Token System ("Nightlight" / "Daylight")
 *
 * Every value here is copied from the redesign canvas
 * (https://claude.ai/artifact/EMxmwt7o1Uq6kx32BdAUA7) — the "Nightlight —
 * direction & system" and "Daylight — direction & system" sheets, plus the
 * Home artboards for the tab bar. Translucent values are the canvas's own
 * rgba() alphas over Moonlight (Night) or Ink (Day); nothing is eyeballed.
 * Don't improvise values here — add them to the canvas first.
 *
 * Night and Day are both full themes. Which one applies is resolved at
 * runtime by `ThemeProvider` (contexts/ThemeContext.tsx) from the phone's
 * light/dark setting plus a locally persisted override. Components should
 * read tokens through `useTheme()`, not these exports directly.
 */
/* ──────────────────────── Brand Palette ──────────────────────── */

/** Nightlight sheet swatches, verbatim. */
export const nightPalette = {
  midnight: '#0B1026', // Ground — every screen
  nightfall: '#121A3E', // Raised surfaces, sheets
  moonlight: '#F2ECDD', // Primary text & primary actions
  mist: '#B6BAD6', // Secondary text
  haze: '#8990B5', // Tertiary text, inactive icons
  hounaGlow: '#6FD6CF', // Brand accent on dark
  hounaTeal: '#3BAAA7', // Brand teal — logo, deep fills
  dawn: '#F2B880', // Warmth & urgent support
  dusk: '#B3A7F5', // Secondary accent
  /** Tab bar ground (Home artboard nav). */
  tabBar: '#0F1534',
} as const;

/** Daylight sheet swatches, verbatim. */
export const dayPalette = {
  daybreak: '#F5F1E8', // Ground — every screen
  paper: '#FFFFFF', // Cards, sheets, tab bar
  ink: '#1B2140', // Primary text & primary actions
  slate: '#4A5078', // Secondary text
  haze: '#646A8E', // Tertiary text, inactive icons
  hounaDeepTeal: '#237873', // Brand accent text on light
  hounaTeal: '#3BAAA7', // Brand teal — logo, glows
  dawnDeep: '#A8621F', // Warmth & urgent support
  duskDeep: '#6353C9', // Secondary accent
  /** Pale fill (Daylight sheet swatch-card ground). */
  paleFill: '#EEF3F1',
} as const;

/**
 * Pre-reskin brand palette. Still referenced directly by the splash intro,
 * the meditation player, a few breathing-exercise accents and the legacy
 * icon tiles; each call site moves onto theme tokens as its screen is
 * rebuilt, and this export goes away once none remain.
 */
export const palette = {
  white: '#FFFFFF',
  turquoise: '#3BAAA7',
  turquoiseDark: '#196662',
  brokenWhite: '#EFF0EE',
  grey30: '#BCBEC0',
  grey50: '#939598',
  grey80: '#58595B',
  black: '#000000',
  yellow: '#FFF200',
  raspberry: '#F37B83',
  lightCyan: '#20C4F4',
  peach: '#F9A980',
} as const;

/** `rgba()` of a `#RRGGBB` hex at the given alpha. */
function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ──────────────────── Semantic Color Tokens ──────────────────── */

export type ColorScheme = 'night' | 'day';

/** A tinted accent as used by icon tiles, badges and highlights. */
export interface AccentTone {
  /** Icon / text colour. */
  fg: string;
  /** Tile fill. */
  bg: string;
  /** Tile border. */
  border: string;
}

export interface ColorTokens {
  /** Screen ground. */
  background: string;
  /** Raised opaque surface — sheets, modals. */
  surface: string;
  /** Card fill (translucent on Night, Paper on Day). */
  card: string;
  /** Press feedback fill for chips/plain controls. Cards dim via opacity instead (see CLAUDE.md). */
  cardPressed: string;
  inputBackground: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  placeholder: string;

  /** Card / divider border. */
  border: string;
  /** Hairline border — tab bar top edge. */
  borderLight: string;
  /** Chip and top-bar button border. */
  borderControl: string;
  /** Icon-button border. */
  borderControlStrong: string;
  /** Secondary-button border. */
  borderStrong: string;

  /** Fill behind chips, secondary buttons, top-bar buttons. */
  control: string;
  /** Fill behind round icon buttons (close, restart, sound). */
  controlStrong: string;

  /** Brand accent — Houna glow on Night, deep teal on Day. Links, highlights, active accents. */
  primary: string;
  /** Text/icon colour on a `primary` fill. */
  onPrimary: string;
  /** Tinted brand background, e.g. behind an icon. */
  primaryLightest: string;

  /** Primary action fill — Moonlight on Night, Ink on Day. */
  action: string;
  /** Text/icon colour on an `action` fill. */
  onAction: string;

  /** Warm accent (Dawn) — warmth and urgent support. */
  accent: string;
  onAccent: string;

  /** Icon-tile tones from the canvas. */
  tones: { glow: AccentTone; dawn: AccentTone; dusk: AccentTone };

  /** "Need to talk now?" crisis pill. */
  crisis: { bg: string; border: string; icon: string };

  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  /** Raised Tanafas button — fill, icon, and the ring that cuts it out of the bar. */
  tabBarRaised: string;
  onTabBarRaised: string;
  tabBarRaisedRing: string;

  /** Brand glow used for the raised button and play controls. */
  glow: string;

  /**
   * Houna logo fills, from the canvas wordmark/mark assets: `primary` is the
   * Latin letters, ring and heart; `secondary` the Arabic letters. The pin
   * dot is knocked out in `background`.
   */
  logo: { primary: string; secondary: string };

  /** Unlit country dot on the community map. */
  mapDot: string;
}

const N = nightPalette;
const D = dayPalette;

const TONE_BG = {
  glow: alpha(N.hounaGlow, 0.12),
  dawn: alpha(N.dawn, 0.12),
  dusk: alpha(N.dusk, 0.12),
};
const TONE_BORDER = {
  glow: alpha(N.hounaGlow, 0.28),
  dawn: alpha(N.dawn, 0.28),
  dusk: alpha(N.dusk, 0.3),
};

export const nightColors: ColorTokens = {
  background: N.midnight,
  surface: N.nightfall,
  card: alpha(N.moonlight, 0.045),
  cardPressed: alpha(N.moonlight, 0.1),
  inputBackground: alpha(N.moonlight, 0.06),

  text: N.moonlight,
  textSecondary: N.mist,
  textTertiary: N.haze,
  placeholder: N.haze,

  border: alpha(N.moonlight, 0.1),
  borderLight: alpha(N.moonlight, 0.08),
  borderControl: alpha(N.moonlight, 0.12),
  borderControlStrong: alpha(N.moonlight, 0.14),
  borderStrong: alpha(N.moonlight, 0.16),

  control: alpha(N.moonlight, 0.06),
  controlStrong: alpha(N.moonlight, 0.08),

  primary: N.hounaGlow,
  onPrimary: N.midnight,
  primaryLightest: TONE_BG.glow,

  action: N.moonlight,
  onAction: N.midnight,

  accent: N.dawn,
  onAccent: N.midnight,

  tones: {
    glow: { fg: N.hounaGlow, bg: TONE_BG.glow, border: TONE_BORDER.glow },
    dawn: { fg: N.dawn, bg: TONE_BG.dawn, border: TONE_BORDER.dawn },
    dusk: { fg: N.dusk, bg: TONE_BG.dusk, border: TONE_BORDER.dusk },
  },

  crisis: { bg: alpha(N.dawn, 0.08), border: alpha(N.dawn, 0.4), icon: N.dawn },

  tabBarBackground: N.tabBar,
  tabBarBorder: alpha(N.moonlight, 0.08),
  tabBarActive: N.moonlight,
  tabBarInactive: N.haze,
  tabBarRaised: N.moonlight,
  onTabBarRaised: N.midnight,
  tabBarRaisedRing: N.midnight,

  glow: N.hounaGlow,

  logo: { primary: N.hounaGlow, secondary: N.moonlight },

  mapDot: alpha(N.moonlight, 0.26),
};

export const dayColors: ColorTokens = {
  background: D.daybreak,
  surface: D.paper,
  card: D.paper,
  cardPressed: alpha(D.ink, 0.06),
  inputBackground: D.paper,

  text: D.ink,
  textSecondary: D.slate,
  textTertiary: D.haze,
  placeholder: D.haze,

  border: alpha(D.ink, 0.1),
  borderLight: alpha(D.ink, 0.08),
  borderControl: alpha(D.ink, 0.12),
  borderControlStrong: alpha(D.ink, 0.14),
  borderStrong: alpha(D.ink, 0.16),

  control: D.paper,
  controlStrong: D.paper,

  primary: D.hounaDeepTeal,
  onPrimary: D.paper,
  primaryLightest: TONE_BG.glow,

  action: D.ink,
  onAction: D.daybreak,

  accent: D.dawnDeep,
  onAccent: D.paper,

  // The Daylight sheet keeps the Night tile fills/borders and swaps only
  // the icon colour to the deep variant.
  tones: {
    glow: { fg: D.hounaDeepTeal, bg: TONE_BG.glow, border: TONE_BORDER.glow },
    dawn: { fg: D.dawnDeep, bg: TONE_BG.dawn, border: TONE_BORDER.dawn },
    dusk: { fg: D.duskDeep, bg: TONE_BG.dusk, border: TONE_BORDER.dusk },
  },

  crisis: { bg: alpha(N.dawn, 0.08), border: alpha(N.dawn, 0.4), icon: D.dawnDeep },

  tabBarBackground: D.paper,
  tabBarBorder: alpha(D.ink, 0.08),
  tabBarActive: D.ink,
  tabBarInactive: D.haze,
  tabBarRaised: D.ink,
  onTabBarRaised: D.daybreak,
  tabBarRaisedRing: D.daybreak,

  glow: N.hounaGlow,

  // The official logo artwork's own teal and grey, unchanged on Day.
  logo: { primary: D.hounaTeal, secondary: '#525052' },

  mapDot: alpha(D.ink, 0.26),
};

export const themeColors: Record<ColorScheme, ColorTokens> = {
  night: nightColors,
  day: dayColors,
};

export function schemeFromSystem(system: string | null | undefined): ColorScheme {
  return system === 'light' ? 'day' : 'night';
}

/* ──────────────────────── Layout ──────────────────────── */

export const layout = {
  /** Content caps at 430px, centered. */
  maxContentWidth: 430,
  /** Screen side padding on every canvas artboard. */
  screenPadding: 20,
} as const;

/* ──────────────────────── Spacing ──────────────────────── */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/* ──────────────────────── Typography ──────────────────────── */

/**
 * Font roles. Latin: Figtree body, Marcellus display, DM Mono labels.
 * Arabic: IBM Plex Sans Arabic body, Amiri display, and Plex (no tracking)
 * for labels — tracked mono caps are Latin-only per the canvas.
 *
 * The canvas only uses body weights 400/500/600, so `bold` resolves to 600.
 * Which set applies is a per-render, per-language choice — use
 * `useLanguage().fonts`, not these directly, in components.
 */
export interface FontFamily {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  /** Headlines and large numerals. */
  display: string;
  /** Small labels, eyebrows, chips. */
  label: string;
  /** Unemphasised label (unselected chips). */
  labelRegular: string;
  /** Whether `label` should be tracked caps (Latin only). */
  labelTracked: boolean;
}

export const latinFontFamily: FontFamily = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semiBold: 'Figtree_600SemiBold',
  bold: 'Figtree_600SemiBold',
  display: 'Marcellus_400Regular',
  label: 'DMMono_500Medium',
  labelRegular: 'DMMono_400Regular',
  labelTracked: true,
};

export const arabicFontFamily: FontFamily = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semiBold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_600SemiBold',
  display: 'Amiri_700Bold',
  label: 'IBMPlexSansArabic_500Medium',
  labelRegular: 'IBMPlexSansArabic_500Medium',
  labelTracked: false,
};

export const typography = {
  fontSize: {
    xs: 11,
    sm: 13,
    body: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 38,
  },
  lineHeight: {
    xs: 16,
    sm: 18,
    body: 22,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
    xxxl: 48,
  },
  /** Canvas label spec: DM Mono, tracked caps. letterSpacing in px at that size. */
  label: { fontSize: 11.5, letterSpacing: 11.5 * 0.16 },
  chip: { fontSize: 12.5, letterSpacing: 12.5 * 0.1 },
} as const;

/* ──────────────────────── Border Radius ──────────────────────── */

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  /** Small icon tile (46px). */
  tileSm: 14,
  lg: 16,
  /** Icon tile (52px). */
  tile: 16,
  /** List card. */
  card: 20,
  /** Feature card (Home community card). */
  cardLg: 24,
  xl: 24,
  full: 9999,
} as const;

/* ──────────────────────── Shadows ────────────────────────
 * Nightlight/Daylight cards are border-only — no drop shadows anywhere on
 * the canvas. `card`/`cardLg`/`tab` stay as no-op keys so existing spreads
 * compile; light comes from `glow` instead. `boxShadow` strings are the
 * canvas's CSS verbatim (RN 0.81 new architecture supports them natively). */

const NONE = {
  shadowOpacity: 0,
  elevation: 0,
} as const;

export const shadows = {
  card: NONE,
  cardLg: NONE,
  tab: NONE,
  /** Primary play / pause control. */
  glow: { boxShadow: `0 0 36px ${alpha(N.hounaGlow, 0.35)}` },
} as const;

/** Raised Tanafas button: a ring in the ground colour, then the brand glow. */
export function raisedButtonShadow(ring: string) {
  return { boxShadow: `0 0 0 6px ${ring}, 0 0 34px ${alpha(N.hounaGlow, 0.45)}` };
}
