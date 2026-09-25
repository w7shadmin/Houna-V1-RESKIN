/**
 * Props for a react-native-svg gradient `<Stop>` from any colour, including a
 * translucent `rgba(...)` (e.g. from `alpha()`).
 *
 * On native, react-native-svg keeps only a stop colour's RGB and takes its
 * transparency from `stopOpacity` alone (15.x: `(color & 0xffffff) | stopOpacity`),
 * so an rgba stop colour draws fully opaque on the phone while the web draws it
 * translucent. Splitting the alpha into `stopOpacity` makes both agree.
 */
export function stopProps(color: string, opacity = 1): { stopColor: string; stopOpacity: number } {
  const m = color.match(/^rgba?\(([^)]+)\)$/i);
  if (!m) return { stopColor: color, stopOpacity: opacity };
  const [r, g, b, a = '1'] = m[1].split(',').map((part) => part.trim());
  return { stopColor: `rgb(${r},${g},${b})`, stopOpacity: opacity * Number(a) };
}
