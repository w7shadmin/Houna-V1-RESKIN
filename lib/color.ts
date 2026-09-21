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
