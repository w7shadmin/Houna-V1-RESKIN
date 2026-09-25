// Step 3 (optional style): traces the land mask (from analyze.js) into
// smooth filled outlines — constants/worldLand.ts — for the solid-silhouette
// version of Home's community map. Marching squares on a coverage field
// (iso 0.5, interpolated), loops joined, simplified with Douglas–Peucker.
// Same x calibration as generate.js; the crop starts higher (y0 = 200) so
// Greenland and the Arctic aren't sliced flat, hence WORLD_LAND_Y_SHIFT.
const fs = require('fs');
const path = require('path');
const dir = path.resolve(process.env.WORLD_DOTS_WORKDIR || path.join(__dirname, 'work')) + path.sep;
const OUT = path.join(__dirname, '../../constants/worldLand.ts');
const { W, H } = JSON.parse(fs.readFileSync(dir + 'mask.json'));
const land = fs.readFileSync(dir + 'mask.bin');

const DOTS_CROP_Y0 = 300; // generate.js's crop — projectToMap is relative to it
const CROP = { x0: 250, y0: 200, w: 2300, h: 1275 };
const VB_W = 200;
const S = VB_W / CROP.w;
const CELL = 2; // image px per field cell
const GW = Math.ceil(CROP.w / CELL) + 2; // +1 cell of empty border each side so every loop closes
const GH = Math.ceil(CROP.h / CELL) + 2;

// Coverage field: fraction of land in each cell.
const field = new Float32Array(GW * GH);
for (let gy = 1; gy < GH - 1; gy++) {
  for (let gx = 1; gx < GW - 1; gx++) {
    let hit = 0;
    for (let dy = 0; dy < CELL; dy++)
      for (let dx = 0; dx < CELL; dx++) {
        const x = CROP.x0 + (gx - 1) * CELL + dx, y = CROP.y0 + (gy - 1) * CELL + dy;
        if (x < W && y < H && land[y * W + x]) hit++;
      }
    field[gy * GW + gx] = hit / (CELL * CELL);
  }
}
// Light 3×3 blur so the contour follows the anti-aliased coastline smoothly.
const blurred = new Float32Array(GW * GH);
for (let gy = 1; gy < GH - 1; gy++)
  for (let gx = 1; gx < GW - 1; gx++) {
    let s = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += field[(gy + dy) * GW + gx + dx] * (dx || dy ? 1 : 4);
    blurred[gy * GW + gx] = s / 12;
  }
const F = (x, y) => blurred[y * GW + x];
const ISO = 0.5;

// Marching squares → segments keyed by edge ids, then chained into loops.
const edgePoint = new Map();
function pointOn(ax, ay, bx, by) {
  const key = ax < bx || (ax === bx && ay < by) ? `${ax},${ay},${bx},${by}` : `${bx},${by},${ax},${ay}`;
  if (!edgePoint.has(key)) {
    const fa = F(ax, ay), fb = F(bx, by);
    const t = (ISO - fa) / (fb - fa);
    edgePoint.set(key, { key, x: ax + (bx - ax) * t, y: ay + (by - ay) * t });
  }
  return edgePoint.get(key);
}
const next = new Map(); // edge key -> neighbour keys
const link = (a, b) => {
  (next.get(a.key) || next.set(a.key, []).get(a.key)).push(b.key);
  (next.get(b.key) || next.set(b.key, []).get(b.key)).push(a.key);
};
for (let y = 0; y < GH - 1; y++) {
  for (let x = 0; x < GW - 1; x++) {
    const tl = F(x, y) > ISO, tr = F(x + 1, y) > ISO, br = F(x + 1, y + 1) > ISO, bl = F(x, y + 1) > ISO;
    const code = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0);
    if (code === 0 || code === 15) continue;
    const T = () => pointOn(x, y, x + 1, y), R = () => pointOn(x + 1, y, x + 1, y + 1);
    const B = () => pointOn(x, y + 1, x + 1, y + 1), L = () => pointOn(x, y, x, y + 1);
    const segs = {
      1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[L, T], [B, R]], 6: [[T, B]], 7: [[L, T]],
      8: [[L, T]], 9: [[T, B]], 10: [[T, R], [L, B]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]],
    }[code];
    for (const [a, b] of segs) link(a(), b());
  }
}
const seen = new Set();
const loops = [];
for (const start of next.keys()) {
  if (seen.has(start)) continue;
  const loop = [];
  let prev = null, cur = start;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    loop.push(edgePoint.get(cur));
    const ns = next.get(cur);
    const n = ns.find((k) => k !== prev && !seen.has(k)) ?? null;
    prev = cur;
    cur = n;
  }
  if (loop.length > 2) loops.push(loop);
}

// Douglas–Peucker on closed loops.
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    const ax = pts[a].x, ay = pts[a].y, dx = pts[b].x - ax, dy = pts[b].y - ay;
    const len = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * (pts[i].x - ax) - dx * (pts[i].y - ay)) / len;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const area = (pts) => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p.x * q.y - q.x * p.y; }, 0) / 2);

const TOL = 0.9; // cells
const MIN_AREA = 14; // cells² — drops specks and tiny islets
const f1 = (n) => Math.round(n * 10) / 10;
let d = '';
let kept = 0, points = 0;
for (const loop of loops) {
  if (area(loop) < MIN_AREA) continue;
  // Split the closed loop in two so DP has fixed endpoints on both halves.
  const half = Math.floor(loop.length / 2);
  const simp = [...simplify(loop.slice(0, half + 1), TOL).slice(0, -1), ...simplify([...loop.slice(half), loop[0]], TOL).slice(0, -1)];
  const toVB = (p) => [f1(((p.x - 1) * CELL) * S), f1(((p.y - 1) * CELL) * S)];
  const [sx, sy] = toVB(simp[0]);
  d += `M${sx} ${sy}`;
  let px = sx, py = sy;
  for (let i = 1; i < simp.length; i++) {
    const [x, y] = toVB(simp[i]);
    const rx = f1(x - px), ry = f1(y - py);
    if (rx === 0 && ry === 0) continue;
    d += `l${rx} ${ry}`;
    px = x; py = y;
    points++;
  }
  d += 'z';
  kept++;
}
// Relative commands accumulate rounding; small enough at 0.1 units over a loop, but keep an eye on it.
const VB_H = f1(CROP.h * S);
const ts = `/**
 * Solid-silhouette land for Home's community map (GENERATED by
 * scripts/world-dots/trace.js — do not edit by hand).
 *
 * Traced from the land mask of "Isolated world map minimal style"
 * (Freepik): ${kept} outlines, ${points} points, in a ${VB_W} × ${VB_H} viewBox. Render with
 * \`fillRule="evenodd"\` so lakes and inland seas stay open.
 *
 * Shares worldDots.ts's calibration but starts ${f1((DOTS_CROP_Y0 - CROP.y0) * S)} units higher (so
 * Greenland isn't cut flat): add WORLD_LAND_Y_SHIFT to its projected y.
 */

export const WORLD_LAND_WIDTH = ${VB_W};
export const WORLD_LAND_HEIGHT = ${VB_H};
export const WORLD_LAND_Y_SHIFT = ${f1((DOTS_CROP_Y0 - CROP.y0) * S)};

export const WORLD_LAND_PATH =
  '${d}';
`;
fs.writeFileSync(OUT, ts);
console.log('loops', loops.length, 'kept', kept, 'points', points, 'KB', (ts.length / 1024).toFixed(1));
