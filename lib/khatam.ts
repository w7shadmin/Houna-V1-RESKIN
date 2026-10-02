/**
 * The eight-point star (khatam: two squares, one turned 45°) as SVG polygon points, centred
 * on (cx, cy), outer radius r, its first point straight up, turned by `rot` degrees.
 */
export function star8Points(cx: number, cy: number, r: number, rot = 0): string {
  const inner = (r * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  return Array.from({ length: 16 }, (_, i) => {
    const a = ((i * 22.5 + rot - 90) * Math.PI) / 180;
    const rr = i % 2 ? inner : r;
    return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}
