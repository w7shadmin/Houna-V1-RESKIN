// Generates constants/worldDots.ts: a halftone dot world map sampled from
// the land mask of the "isolated world map" artwork, plus the lat/lon ->
// map-space projection calibrated against known coastline points.
const fs = require('fs');
// Working folder holding land.png (the source art downscaled to 2800px wide; not
// committed — Freepik's license forbids redistributing it). Mask files land here too.
const path = require('path');
const dir = path.resolve(process.env.WORLD_DOTS_WORKDIR || path.join(__dirname, 'work')) + path.sep;
const OUT = path.join(__dirname, '../../constants/worldDots.ts');
const { W, H } = JSON.parse(fs.readFileSync(dir + 'mask.json'));
const land = fs.readFileSync(dir + 'mask.bin');

// ── Crop (image px) and output viewBox ──
const CROP = { x0: 250, y0: 300, w: 2300, h: 1150 }; // 2:1
const VB_W = 200;
const S = VB_W / CROP.w; // image px -> viewBox units
const VB_H = +(CROP.h * S).toFixed(3);

// ── Calibration: x is linear in lon (fit across 358°); y is a smoothed fit ──
const lonToImgX = (lon) => 6.3 * lon + 1318;
const CAL = [
  [83.66, 217], [77.7, 305], [71.3, 452], [59.8, 569], [51.0, 672],
  [12.46, 947], [8.08, 1004], [-34.83, 1298], [-39.1, 1333], [-55.0, 1458],
];
// Least-squares cubic y(lat).
function fitPoly(pts, deg) {
  const n = deg + 1;
  const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (const [x, y] of pts) {
    const p = Array.from({ length: n }, (_, i) => x ** i);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) A[r][c] += p[r] * p[c];
      A[r][n] += p[r] * y;
    }
  }
  for (let i = 0; i < n; i++) {
    let m = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[m][i])) m = r;
    [A[i], A[m]] = [A[m], A[i]];
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = A[r][i] / A[i][i];
      for (let c = i; c <= n; c++) A[r][c] -= f * A[i][c];
    }
  }
  return A.map((row, i) => row[n] / row[i]);
}
const coef = fitPoly(CAL.map(([lat, y]) => [lat / 100, y]), 3);
const latToImgY = (lat) => coef.reduce((s, c, i) => s + c * (lat / 100) ** i, 0);
for (const [lat, y] of CAL) console.log('cal', lat, 'measured', y, 'fit', latToImgY(lat).toFixed(0));
for (let lat = -60; lat <= 85; lat += 1) {
  if (latToImgY(lat + 1) >= latToImgY(lat)) throw new Error('fit not monotonic at ' + lat);
}

// ── Halftone sampling ──
const COLS = 88;
const pitch = CROP.w / COLS; // image px
const rowPitch = pitch * Math.sqrt(3) / 2;
const ROWS = Math.floor(CROP.h / rowPitch);
const R_MAX = pitch * 0.3; // image px
const at = (x, y) => (x >= 0 && x < W && y >= 0 && y < H ? land[y * W + x] : 0);
function coverage(cx, cy) {
  const rad = pitch * 0.5;
  let n = 0, hit = 0;
  const step = Math.max(1, Math.round(rad / 5));
  for (let dy = -rad; dy <= rad; dy += step) {
    for (let dx = -rad; dx <= rad; dx += step) {
      if (dx * dx + dy * dy > rad * rad) continue;
      n++;
      hit += at(Math.round(cx + dx), Math.round(cy + dy));
    }
  }
  return hit / n;
}
const dots = [];
for (let r = 0; r < ROWS; r++) {
  const cy = CROP.y0 + rowPitch * (r + 0.5);
  const off = r % 2 ? pitch / 2 : 0;
  for (let c = 0; c < COLS; c++) {
    const cx = CROP.x0 + pitch * (c + 0.25) + off;
    const f = coverage(cx, cy);
    if (f < 0.2) continue;
    // Three sizes: coast (partial) dots shrink, like a halftone screen.
    const level = f > 0.75 ? 3 : f > 0.45 ? 2 : 1;
    dots.push({ x: (cx - CROP.x0) * S, y: (cy - CROP.y0) * S, level });
  }
}
const RADII = { 1: R_MAX * 0.55 * S, 2: R_MAX * 0.8 * S, 3: R_MAX * S };
const f2 = (n) => +n.toFixed(2);
// Packed as tenths of a viewBox unit + size level: [x10, y10, level, …].
const packed = dots.map((p) => `${Math.round(p.x * 10)},${Math.round(p.y * 10)},${p.level}`).join(',');

// lat -> viewBox y lookup, every 5° (interpolated at runtime).
const LAT_MIN = -60, LAT_MAX = 85;
const latTable = [];
for (let lat = LAT_MIN; lat <= LAT_MAX; lat += 5) latTable.push(f2((latToImgY(lat) - CROP.y0) * S));

const ts = `/**
 * Home's community map: a halftone dot world map (GENERATED — do not edit
 * by hand; regenerate from the source artwork if it changes).
 *
 * Dots were sampled on a staggered ${COLS}-column grid from the land mask of
 * "Isolated world map minimal style" (Freepik), each sized by how much land
 * it covers so coastlines taper like a halftone screen. All ${dots.length} dots are
 * one path, so react-native-svg draws a single native shape.
 *
 * The artwork's projection is hand-drawn, not a textbook one: x is linear
 * in longitude, y follows a curve fitted to known coastline points
 * (${CAL.length} capes and tips). \`projectToMap\` uses that fit, and callers snap
 * to the nearest land dot so markers always sit on drawn land.
 */

export const WORLD_DOTS_WIDTH = ${VB_W};
export const WORLD_DOTS_HEIGHT = ${VB_H};

/** Land dots packed as [x × 10, y × 10, size level 1–3, …] in viewBox units. */
const PACKED: readonly number[] = [${packed}];

const RADII = [0, ${f2(RADII[1])}, ${f2(RADII[2])}, ${f2(RADII[3])}];

/** Dot centres, flat [x0, y0, x1, y1, …], for snapping markers onto land. */
export const WORLD_DOT_CENTRES: readonly number[] = PACKED.flatMap((v, i) => (i % 3 === 2 ? [] : [v / 10]));

/** Every land dot, as one SVG path in a ${VB_W} × ${VB_H} viewBox (built once at load). */
export const WORLD_DOTS_PATH = (() => {
  let d = '';
  for (let i = 0; i < PACKED.length; i += 3) {
    const x = PACKED[i] / 10;
    const y = PACKED[i + 1] / 10;
    const r = RADII[PACKED[i + 2]];
    d += 'M' + (x - r) + ' ' + y + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0';
  }
  return d;
})();

/** Spacing between neighbouring dots, in viewBox units. */
export const WORLD_DOT_PITCH = ${f2(pitch * S)};

const LON_SCALE = ${f2(6.3 * S)};
const LON_ORIGIN = ${f2((lonToImgX(0) - CROP.x0) * S)};
const LAT_MIN = ${LAT_MIN};
const LAT_STEP = 5;
/** Map y at LAT_MIN, LAT_MIN + 5, … ${LAT_MAX}. */
const LAT_Y: readonly number[] = [${latTable.join(', ')}];

/** Lat/lon to viewBox coordinates on this artwork. */
export function projectToMap(lat: number, lon: number): { x: number; y: number } {
  const t = Math.min(Math.max((lat - LAT_MIN) / LAT_STEP, 0), LAT_Y.length - 1);
  const i = Math.min(Math.floor(t), LAT_Y.length - 2);
  const y = LAT_Y[i] + (LAT_Y[i + 1] - LAT_Y[i]) * (t - i);
  return { x: LON_ORIGIN + LON_SCALE * lon, y };
}

/**
 * The land dot nearest to a lat/lon — so a country's marker lands on the
 * drawn coastline even where the artwork bends geography. Falls back to the
 * raw projection when nothing is within a few dots (e.g. remote islands).
 */
export function snapToLand(lat: number, lon: number): { x: number; y: number } {
  const p = projectToMap(lat, lon);
  let best = -1;
  let bestD = (WORLD_DOT_PITCH * 3) ** 2;
  for (let i = 0; i < WORLD_DOT_CENTRES.length; i += 2) {
    const dx = WORLD_DOT_CENTRES[i] - p.x;
    const dy = WORLD_DOT_CENTRES[i + 1] - p.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestD) {
      bestD = d2;
      best = i;
    }
  }
  return best < 0 ? p : { x: WORLD_DOT_CENTRES[best], y: WORLD_DOT_CENTRES[best + 1] };
}
`;
fs.writeFileSync(OUT, ts);
console.log('dots', dots.length, 'rows', ROWS, 'viewBox', VB_W, VB_H, 'file KB', (ts.length / 1024).toFixed(1));

// Preview PNG (dots black on white) with a few capitals overlaid in red.
const Jimp = require('jimp-compact');
const scale = 5;
const img = new Jimp(VB_W * scale, Math.ceil(VB_H * scale), 0xffffffff);
const disc = (x, y, r, col) => {
  for (let yy = Math.floor(y - r); yy <= y + r; yy++)
    for (let xx = Math.floor(x - r); xx <= x + r; xx++)
      if ((xx - x) ** 2 + (yy - y) ** 2 <= r * r && xx >= 0 && yy >= 0 && xx < img.bitmap.width && yy < img.bitmap.height)
        img.setPixelColor(col, xx, yy);
};
for (const p of dots) disc(p.x * scale, p.y * scale, RADII[p.level] * scale, 0x333344ff);
const TEST = [['London', 51.5, -0.13], ['Riyadh', 24.7, 46.7], ['Cairo', 30.0, 31.2], ['Tokyo', 35.7, 139.7], ['Sydney', -33.9, 151.2], ['New York', 40.7, -74.0], ['Lima', -12.0, -77.0], ['Cape Town', -33.9, 18.4], ['Delhi', 28.6, 77.2], ['Doha', 25.3, 51.5], ['Reykjavik', 64.1, -21.9], ['Anchorage', 61.2, -149.9], ['Jakarta', -6.2, 106.8], ['Buenos Aires', -34.6, -58.4], ['Moscow', 55.8, 37.6]];
for (const [, lat, lon] of TEST) {
  const x = (lonToImgX(lon) - CROP.x0) * S, y = (latToImgY(lat) - CROP.y0) * S;
  disc(x * scale, y * scale, 4, 0xe0303aff);
}
img.writeAsync(dir + 'preview.png').then(() => console.log('preview written'));
