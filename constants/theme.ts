/**
 * Houna Mental Health App — Design Token System
 *
 * Official brand palette (Houna Brand Standards, page 9) — see
 * ../../reference/docs/houna-colour-palette.md. Do not improvise values
 * here; anything not in that document isn't brand.
 *
 * Light mode only — dark mode has been removed. The splash screen and the
 * meditation player are deliberate, hardcoded-dark exceptions; they use
 * `palette.turquoise` / `palette.turquoiseDark` directly rather than a
 * `colors` token, since `colors` is the light-mode surface palette.
 */

/* ──────────────────────── Brand Palette ──────────────────────── */

export const palette = {
  /* Primary — only these may carry the logo */
  white: '#FFFFFF',
  turquoise: '#3BAAA7',
  turquoiseDark: '#196662',
  brokenWhite: '#EFF0EE',
  grey30: '#BCBEC0',
  grey50: '#939598',
  grey80: '#58595B',
  black: '#000000',

  /* Secondary — accents only, never large surfaces */
  yellow: '#FFF200',
  raspberry: '#F37B83',
  lightCyan: '#20C4F4',
  peach: '#F9A980',
} as const;

/* ──────────────────── Semantic Color Tokens ──────────────────── */

export interface ColorTokens {
  background: string;
  surface: string;
  card: string;
  /** Soft brand-tinted press highlight — not a neutral dim, a highlight. */
  cardPressed: string;
  inputBackground: string;

  text: string;
  textSecondary: string;
  textTertiary: string;
  placeholder: string;

  border: string;
  borderLight: string;

  primary: string;
  onPrimary: string;
  /** Tinted primary background, e.g. behind an icon on a light surface. */
  primaryLightest: string;

  /** Secondary accent — used sparingly (icons, small highlights), never a large surface. */
  accent: string;
  onAccent: string;

  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export const colors: ColorTokens = {
  background: palette.brokenWhite,
  surface: palette.brokenWhite,
  card: palette.white,
  cardPressed: 'rgba(59, 170, 167, 0.12)',
  inputBackground: palette.brokenWhite,

  text: palette.black,
  textSecondary: palette.grey80,
  textTertiary: palette.grey50,
  placeholder: palette.grey50,

  border: palette.grey30,
  borderLight: palette.brokenWhite,

  primary: palette.turquoise,
  onPrimary: palette.white,
  primaryLightest: 'rgba(59, 170, 167, 0.08)',

  accent: palette.raspberry,
  onAccent: palette.white,

  tabBarBackground: palette.white,
  tabBarActive: palette.turquoise,
  tabBarInactive: palette.grey50,
};

/* ──────────────────────── Layout ──────────────────────── */

export const layout = {
  /** Content caps at 430px, centered — from the old MVP's shipped layout. */
  maxContentWidth: 430,
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
 * Font families — Inter for Latin UI, Scheherazade New for Arabic. Never
 * Scheherazade for Latin body text (CLAUDE.md, resolving the "Scheherazade
 * for Latin too, or paired with a sans?" question left open in
 * houna-build-notes.md: use Inter for Latin, full stop).
 *
 * Which set applies is a per-render, per-language choice — use
 * `useLanguage().fonts`, not these directly, in components.
 */
export interface FontFamily {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
}

export const latinFontFamily: FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const arabicFontFamily: FontFamily = {
  regular: 'ScheherazadeNew_400Regular',
  medium: 'ScheherazadeNew_500Medium',
  semiBold: 'ScheherazadeNew_600SemiBold',
  bold: 'ScheherazadeNew_700Bold',
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
} as const;

/* ──────────────────────── Border Radius ──────────────────────── */

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/* ──────────────────────── Shadows ────────────────────────
 * Tinted with the brand turquoise, not neutral grey — ported from the old
 * MVP's shipped values (houna-port-reference.md §3). */

export const shadows = {
  /** Ordinary card surfaces. `0 2px 12px rgba(59,170,167,0.08)` */
  card: {
    shadowColor: palette.turquoise,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  /** Hero / highlighted cards. `0 8px 28px rgba(59,170,167,0.12)` */
  cardLg: {
    shadowColor: palette.turquoise,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 6,
  },
  /** Tab bar, cast upward onto the content above it. `0 -1px 16px rgba(59,170,167,0.06)` */
  tab: {
    shadowColor: palette.turquoise,
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
