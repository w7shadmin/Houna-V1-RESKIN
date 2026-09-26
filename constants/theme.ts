/**
 * Houna Mental Health App — Design Token System (Night / Dusk / Sunrise)
 *
 * Every value here is copied from the redesign canvas
 * (https://claude.ai/artifact/EMxmwt7o1Uq6kx32BdAUA7) — the Nightlight,
 * Dusk (formerly Daylight; `day` in code) and Sunrise (the canvas's
 * "Morning" row) direction & system sheets, plus the Home artboards for the
 * tab bar. Translucent values are the canvas's own rgba() alphas; nothing is
 * eyeballed. Don't improvise values here — add them to the canvas first.
 *
 * All three are full themes. The one in effect is the person's pick in
 * Profile → Appearance, persisted locally by `ThemeProvider`
 * (contexts/ThemeContext.tsx); Night until they choose. Components should
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
  /** A fourth tone, added after the sheets (the mood palette's rose): muscle relaxation. */
  bloom: '#EA90A8',
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
  /** Deep rose for the bloom tone on light (added after the sheet). */
  bloomDeep: '#B24B6B',
  /** Pale fill (Daylight sheet swatch-card ground). */
  paleFill: '#EEF3F1',
} as const;

/**
 * Sunrise sheet swatches (the canvas's "Morning" row): Houna's original
 * brand palette plus the first app's icon colours. Coral and Sky are Peach
 * and Light Cyan deepened only as far as icons need; small text in those
 * hues takes the deeper `…Text` step.
 */
export const sunrisePalette = {
  mist: '#F2F6F4', // Ground — every screen
  paper: '#FFFFFF', // Cards, sheets, tab bar
  charcoal: '#1D2B2A', // Primary text
  darkTurquoise: '#196662', // Primary actions, active tab, accent text
  turquoise: '#3BAAA7', // Logo, glows, selected borders
  grey80: '#58595B', // Secondary text
  stone: '#6D6F72', // Tertiary text, inactive icons
  coral: '#E8582C', // From Peach — icons & warmth
  coralText: '#BF4729',
  sky: '#0A91BB', // From Light Cyan — icons, secondary accent
  skyText: '#08799B',
  /** Raspberry, deepened for the bloom tone. */
  raspberryDeep: '#C2475A',
  /** The brand's light hues, for glows and tile fills. */
  peach: '#F9A980',
  lightCyan: '#20C4F4',
  raspberry: '#F37B83',
  /** Pale fill (swatch cards, topic stage). */
  paleFill: '#E6F2EF',
  /** Check-in sheet and its scrim. */
  sheet: '#FAFCFB',
  scrim: '#C9CDCB',
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
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/**
 * A translucent colour (`rgba(...)` from `alpha`, or #hex) pre-blended onto an
 * opaque #hex ground — same look over that ground, but nothing behind shows
 * through (e.g. Home's Night stars under its glassy cards).
 */
export function flatten(color: string, over: string): string {
  if (color.startsWith('#')) return color;
  const [r, g, b, a = 1] = color.slice(color.indexOf('(') + 1, -1).split(',').map(Number);
  const n = parseInt(over.slice(1), 16);
  const mix = (fg: number, bg: number) => Math.round(fg * a + bg * (1 - a));
  const out = (mix(r, (n >> 16) & 255) << 16) | (mix(g, (n >> 8) & 255) << 8) | mix(b, n & 255);
  return '#' + out.toString(16).padStart(6, '0');
}

/* ──────────────────── Semantic Color Tokens ──────────────────── */

export type ColorScheme = 'night' | 'day' | 'sunrise';

/** A tinted accent as used by icon tiles, badges and highlights. */
export interface AccentTone {
  /** Icon, fill and graphic colour. */
  fg: string;
  /** The tone as text (labels, links, tags) — `fg`, or a deeper step where `fg` is too light to read. */
  text: string;
  /** The tone's light hue, for glows and tinted fills (`alpha(hue, …)`). */
  hue: string;
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
  tones: { glow: AccentTone; dawn: AccentTone; dusk: AccentTone; bloom: AccentTone };

  /** "Need to talk now?" crisis pill. */
  crisis: { bg: string; border: string; borderSoft: string; icon: string };
  /** Destructive confirmations (delete, discard): fill and its text. */
  danger: string;
  onDanger: string;

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
  /** Land fill for the solid-silhouette community map. */
  mapLand: string;

  /** Bottom sheet (mood check-in) and the scrim above it. */
  sheet: string;
  scrim: string;
  /** Grabber, inactive slider ticks and track. */
  faint: string;
  /** Unselected radio ring (self-reflection answers). */
  ringIdle: string;

  /** Stage behind a topic animation (search topic card), and its sky glow. */
  topicStage: string;
  topicGlow: string;
}

const N = nightPalette;
const D = dayPalette;

const TONE_BG = {
  glow: alpha(N.hounaGlow, 0.12),
  dawn: alpha(N.dawn, 0.12),
  dusk: alpha(N.dusk, 0.12),
  bloom: alpha(N.bloom, 0.12),
};
const TONE_BORDER = {
  glow: alpha(N.hounaGlow, 0.28),
  dawn: alpha(N.dawn, 0.28),
  dusk: alpha(N.dusk, 0.3),
  bloom: alpha(N.bloom, 0.3),
};

export const nightColors: ColorTokens = {
  background: N.midnight,
  surface: N.nightfall,
  card: alpha(N.moonlight, 0.045),
  cardPressed: alpha(N.moonlight, 0.1),
  inputBackground: alpha(N.moonlight, 0.05),

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
    glow: { fg: N.hounaGlow, text: N.hounaGlow, hue: N.hounaGlow, bg: TONE_BG.glow, border: TONE_BORDER.glow },
    dawn: { fg: N.dawn, text: N.dawn, hue: N.dawn, bg: TONE_BG.dawn, border: TONE_BORDER.dawn },
    dusk: { fg: N.dusk, text: N.dusk, hue: N.dusk, bg: TONE_BG.dusk, border: TONE_BORDER.dusk },
    bloom: { fg: N.bloom, text: N.bloom, hue: N.bloom, bg: TONE_BG.bloom, border: TONE_BORDER.bloom },
  },

  crisis: { bg: alpha(N.dawn, 0.08), border: alpha(N.dawn, 0.4), borderSoft: alpha(N.dawn, 0.35), icon: N.dawn },
  danger: '#E8806F',
  onDanger: N.midnight,

  tabBarBackground: N.tabBar,
  tabBarBorder: alpha(N.moonlight, 0.08),
  tabBarActive: N.moonlight,
  tabBarInactive: N.haze,
  tabBarRaised: N.moonlight,
  onTabBarRaised: N.midnight,
  tabBarRaisedRing: N.midnight,

  glow: N.hounaGlow,

  logo: { primary: N.hounaGlow, secondary: N.moonlight },

  mapDot: alpha(N.moonlight, 0.34),
  mapLand: alpha(N.moonlight, 0.14),

  sheet: N.nightfall,
  scrim: '#070B1C',
  faint: alpha(N.moonlight, 0.25),
  ringIdle: alpha(N.moonlight, 0.35),

  topicStage: '#10173A',
  topicGlow: '#86A9F0',
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
    glow: { fg: D.hounaDeepTeal, text: D.hounaDeepTeal, hue: N.hounaGlow, bg: TONE_BG.glow, border: TONE_BORDER.glow },
    dawn: { fg: D.dawnDeep, text: D.dawnDeep, hue: N.dawn, bg: TONE_BG.dawn, border: TONE_BORDER.dawn },
    dusk: { fg: D.duskDeep, text: D.duskDeep, hue: N.dusk, bg: TONE_BG.dusk, border: TONE_BORDER.dusk },
    bloom: { fg: D.bloomDeep, text: D.bloomDeep, hue: N.bloom, bg: TONE_BG.bloom, border: TONE_BORDER.bloom },
  },

  crisis: { bg: alpha(N.dawn, 0.08), border: alpha(N.dawn, 0.4), borderSoft: alpha(N.dawn, 0.35), icon: D.dawnDeep },
  danger: '#C2503F',
  onDanger: '#FFFFFF',

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

  mapDot: alpha(D.ink, 0.3),
  mapLand: alpha(D.ink, 0.1),

  // Check-in artboard (Day): a warmer-than-Paper sheet over a stone scrim.
  sheet: '#FBF8F2',
  scrim: '#CBC7BD',
  faint: alpha(D.ink, 0.25),
  ringIdle: alpha(D.ink, 0.35),

  topicStage: D.paleFill,
  topicGlow: '#86A9F0',
};

const S = sunrisePalette;

export const sunriseColors: ColorTokens = {
  background: S.mist,
  surface: S.paper,
  card: S.paper,
  cardPressed: alpha(S.charcoal, 0.06),
  inputBackground: S.paper,

  text: S.charcoal,
  textSecondary: S.grey80,
  textTertiary: S.stone,
  placeholder: S.stone,

  border: alpha(S.charcoal, 0.1),
  borderLight: alpha(S.charcoal, 0.08),
  borderControl: alpha(S.charcoal, 0.12),
  borderControlStrong: alpha(S.charcoal, 0.14),
  borderStrong: alpha(S.charcoal, 0.16),

  control: S.paper,
  controlStrong: S.paper,

  primary: S.darkTurquoise,
  onPrimary: S.paper,
  primaryLightest: alpha(S.turquoise, 0.12),

  action: S.darkTurquoise,
  onAction: S.paper,

  accent: S.coralText,
  onAccent: S.paper,

  // Tile fills and borders in the brand's light hues; icons in the deepened ones.
  tones: {
    glow: { fg: S.darkTurquoise, text: S.darkTurquoise, hue: S.turquoise, bg: alpha(S.turquoise, 0.12), border: alpha(S.turquoise, 0.28) },
    dawn: { fg: S.coral, text: S.coralText, hue: S.peach, bg: alpha(S.peach, 0.12), border: alpha(S.peach, 0.28) },
    dusk: { fg: S.sky, text: S.skyText, hue: S.lightCyan, bg: alpha(S.lightCyan, 0.12), border: alpha(S.lightCyan, 0.3) },
    bloom: { fg: S.raspberryDeep, text: S.raspberryDeep, hue: S.raspberry, bg: alpha(S.raspberry, 0.12), border: alpha(S.raspberry, 0.3) },
  },

  crisis: { bg: alpha(S.peach, 0.08), border: alpha(S.peach, 0.4), borderSoft: alpha(S.peach, 0.35), icon: S.coral },
  danger: '#C2503F',
  onDanger: '#FFFFFF',

  tabBarBackground: S.paper,
  tabBarBorder: alpha(S.charcoal, 0.08),
  tabBarActive: S.darkTurquoise,
  tabBarInactive: S.stone,
  tabBarRaised: S.darkTurquoise,
  onTabBarRaised: S.paper,
  tabBarRaisedRing: S.mist,

  glow: S.turquoise,

  // The official logo artwork's own teal and grey.
  logo: { primary: S.turquoise, secondary: '#525052' },

  mapDot: alpha(S.charcoal, 0.3),
  mapLand: alpha(S.charcoal, 0.1),

  sheet: S.sheet,
  scrim: S.scrim,
  faint: alpha(S.charcoal, 0.25),
  ringIdle: alpha(S.charcoal, 0.35),

  topicStage: S.paleFill,
  topicGlow: '#5FB08E',
};

export const themeColors: Record<ColorScheme, ColorTokens> = {
  night: nightColors,
  day: dayColors,
  sunrise: sunriseColors,
};

/* ──────────────────────── Layout ──────────────────────── */

export const layout = {
  /** Content caps at 430px, centered. */
  maxContentWidth: 430,
  /** Screen side padding — grid(2); the canvas artboards use 20, snapped to the 8-point grid. */
  screenPadding: 16,
} as const;

/* ──────────────────────── Spacing ──────────────────────── */

/**
 * The 8-point grid: sizes, gaps and paddings are multiples of 8, with 4
 * (`grid(0.5)`) allowed for tight inner spacing. `spacing` holds the named
 * steps; use `grid(n)` for one-off layout numbers so they stay on the grid.
 */
export const GRID = 8;
export const grid = (n: number) => n * GRID;

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
export function raisedButtonShadow(ring: string, ringWidth = 6) {
  return { boxShadow: `0 0 0 ${ringWidth}px ${ring}, 0 0 32px ${alpha(N.hounaGlow, 0.45)}` };
}
