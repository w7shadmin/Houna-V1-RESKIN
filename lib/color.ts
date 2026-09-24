import { palette } from '@/constants/theme';

/** Converts a `#rrggbb` hex color to an `rgba()` string at the given alpha. */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Blends a `#rrggbb` hex color toward `target` (also `#rrggbb`) by `ratio`
 * (0 = pure `hex`, 1 = pure `target`). Used to make a brand color's pastel
 * tint — e.g. `mix(palette.peach, palette.white, 0.6)` — without inventing
 * a hex value that isn't derived from the real palette.
 */
export function mix(hex: string, target: string, ratio: number): string {
  const a = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => parseInt(h, 16));
  const b = [target.slice(1, 3), target.slice(3, 5), target.slice(5, 7)].map((h) => parseInt(h, 16));
  const rgb = a.map((c, i) => Math.round(c + (b[i] - c) * ratio));
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Pale-at-rest, more-saturated-when-pressed icon tile tint — the old MVP's
 * bg-50 → bg-100 hover shift (see ResourcesScreen.tsx / DirectoryScreen.tsx
 * in the reference). Feed the result into IconTile3D/GradientTile's `color`
 * prop.
 */
export function tileTint(color: string, pressed: boolean): string {
  return mix(color, palette.white, pressed ? 0.25 : 0.6);
}

/**
 * The old MVP's actual icon hex values — CLAUDE.md calls these out as wrong
 * ("The old MVP's palette had several wrong values") and forbids reusing
 * them everywhere else in the app. Explicit exception, by request, for only
 * the icon tiles reworked in this pass (Directory hub, Home's Professional
 * Resources rows and Impact stats, Tanafas hub, the breathing exercise
 * list). Every other color in the app — text, buttons, shadows, and any
 * icon tile not in that list — still comes from constants/theme.ts's
 * palette.
 */
export const OLD_MVP_ICON_HEX = {
  raspberry: '#FF59A6',
  peach: '#FF9980',
  lightCyan: '#1AB8B8',
  tealDark: '#1A7452',
  gold: '#B8860B',
} as const;

/**
 * The exact pale "-50" background shades paired with `OLD_MVP_ICON_HEX`
 * above (plus `primary`, matching `palette.turquoise`) — read directly off
 * the reference app's own tailwind config rather than computed at runtime
 * via `mix()`, so flat icon tiles match it pixel-for-pixel. Use as the tile
 * background with the full-saturation `OLD_MVP_ICON_HEX` color as the icon
 * itself — a flat pale-bg-plus-colored-icon treatment, not IconTile3D's
 * glossy bevel-plus-white-icon one. Only where that flatter look is
 * explicitly wanted (currently: Home's Impact stats).
 */
export const OLD_MVP_ICON_HEX_PALE = {
  primary: '#f0fafa',
  raspberry: '#fff0f7',
  peach: '#fff5f2',
  lightCyan: '#e8ffff',
  tealDark: '#e8f5f0',
  gold: '#fffbeb',
} as const;
