// Row P of "Houna — Sadu": Sadu and Houna as pixel art. Every phone is one grid of 6 px cells (65 × 141),
// skies dithered (4×4 Bayer), the mark, wordmark, Towers and map sampled from their real outlines
// (sprites.json, from make-sprites.js), Sadu cells one pixel each. Motion is pixel-art motion: frames
// stepped in place (a ring ticking round a cell at a time, the orb growing by whole pixels, water
// shimmering), never smooth rotation or scaling. Called from make-sadu.js.
const fs = require('fs');
const path = require('path');

module.exports = function studyPixel({ K, S, row }) {
  const SP = JSON.parse(fs.readFileSync(path.join(__dirname, 'sprites.json'), 'utf8'));
  const CS = 6, GW = 65, GH = 141;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map((r) => r.map((v) => (v + 0.5) / 16));
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  class Px {
    constructor(w = GW, h = GH) { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill(null)); }
    set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.g[y][x] = c; }
    get(x, y) { return this.g[y]?.[x]; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
    /** A vertical gradient through `stops`, dithered between neighbours. */
    grad(y0, y1, stops) {
      for (let y = y0; y < y1; y++) {
        const t = ((y - y0) / Math.max(1, y1 - y0 - 1)) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(t)), fr = t - i;
        for (let x = 0; x < this.w; x++) this.set(x, y, fr > BAYER[y % 4][x % 4] ? stops[i + 1] : stops[i]);
      }
    }
    /** Cells whose centre is within r of (cx, cy); `c` a colour or (x, y, d, dx, dy) => colour. */
    disc(cx, cy, r, c) {
      for (let y = Math.floor(cy - r - 1); y <= cy + r + 1; y++)
        for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
          if (d <= r) this.set(x, y, typeof c === 'function' ? c(x, y, d, dx, dy) : c);
        }
    }
    /** A dithered glow: denser near r0, thinning to nothing at r1. */
    glow(cx, cy, r0, r1, c, strength = 0.7) {
      for (let y = Math.floor(cy - r1); y <= cy + r1; y++)
        for (let x = Math.floor(cx - r1); x <= cx + r1; x++) {
          const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
          if (d >= r0 && d <= r1 && (1 - (d - r0) / (r1 - r0)) * strength > BAYER[((y % 4) + 4) % 4][((x % 4) + 4) % 4]) this.set(x, y, c);
        }
    }
    /** A Sadu band wrapped round (cx, cy): one cell per pixel, row 0 at r0, turned by `shift` columns. */
    ring(cx, cy, r0, segs, pal, { shift = 0, n } = {}) {
      const rowsN = S.rowsOf(segs), p = S.period(segs);
      const cols = n || Math.max(p, Math.round((2 * Math.PI * (r0 + rowsN / 2)) / p) * p);
      const rows = S.band(segs, pal, cols);
      for (let y = Math.floor(cy - r0 - rowsN - 1); y <= cy + r0 + rowsN + 1; y++)
        for (let x = Math.floor(cx - r0 - rowsN - 1); x <= cx + r0 + rowsN + 1; x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy);
          const rr = Math.floor(d - r0);
          if (rr < 0 || rr >= rowsN) continue;
          const a = (Math.atan2(dy, dx) + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
          const col = (Math.floor((a / (2 * Math.PI)) * cols) + shift) % cols;
          this.set(x, y, rows[rowsN - 1 - rr][col]);
        }
    }
    /** A straight Sadu band from (x, y), `w` cells wide. */
    band(x, y, w, segs, pal) {
      const p = S.period(segs), rows = S.band(segs, pal, Math.ceil(w / p) * p);
      rows.forEach((line, j) => { for (let i = 0; i < w; i++) this.set(x + i, y + j, line[i]); });
      return rows.length;
    }
    /** A sprite (rows of '#') at (x, y) in `c`; `fn` may colour each cell instead. */
    sprite(x, y, rows, c, fn) { rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '#') this.set(x + i, y + j, fn ? fn(i, j) : c); })); }
    rows(x, y, rows) { rows.forEach((line, j) => line.forEach((c, i) => this.set(x + i, y + j, c))); }
    /** Runs merged into rects, crisp. */
    svg(cs = CS, extra = '') {
      let s = '';
      this.g.forEach((line, y) => {
        let x = 0;
        while (x < this.w) {
          const c = line[x];
          let e = x;
          while (e + 1 < this.w && line[e + 1] === c) e++;
          if (c) s += `<rect x="${x * cs}" y="${y * cs}" width="${(e - x + 1) * cs}" height="${cs}" fill="${c}"></rect>`;
          x = e + 1;
        }
      });
      return `<svg width="${this.w * cs}" height="${this.h * cs}" viewBox="0 0 ${this.w * cs} ${this.h * cs}" shape-rendering="crispEdges" aria-hidden="true" style="position: absolute; left: 0; top: 0; ${extra}">${s}</svg>`;
    }
  }
  /** Half-size by keeping any stitch in each 2×2 (so thin spires survive). */
  const pool = (rows) => Array.from({ length: Math.ceil(rows.length / 2) }, (_, j) => Array.from({ length: Math.ceil(rows[0].length / 2) }, (_, i) => ([rows[2 * j]?.[2 * i], rows[2 * j]?.[2 * i + 1], rows[2 * j + 1]?.[2 * i], rows[2 * j + 1]?.[2 * i + 1]].includes('#') ? '#' : '.')).join(''));
  const center = (rows) => [rows[0].length, rows.length];

  /* ── Frames: layers shown one at a time on a sequence, step by step ── */
  let animN = 0;
  const kf = [];
  /** `layers`: SVG strings; `seq`: the layer index for each tick; `dur`: seconds for the whole sequence. */
  function frames(layers, seq, dur) {
    const id = `pf${++animN}`;
    const T = seq.length;
    const out = layers.map((svg, k) => {
      let stops = '';
      for (let t = 0; t < T; t++) stops += `${((t / T) * 100).toFixed(3)}% { opacity: ${seq[t] === k ? 1 : 0} } `;
      stops += `100% { opacity: ${seq[0] === k ? 1 : 0} }`;
      kf.push(`@keyframes ${id}_${k} { ${stops} }`);
      return `<div style="position: absolute; inset: 0; opacity: ${seq[0] === k ? 1 : 0}; animation: ${id}_${k} ${dur}s step-end infinite">${svg}</div>`;
    });
    return out.join('');
  }
  const loop = (n) => Array.from({ length: n }, (_, i) => i);
  const pingpong = (n, holdTop = 0, holdBottom = 0) => [...loop(n), ...Array(holdTop).fill(n - 1), ...loop(n).reverse(), ...Array(holdBottom).fill(0)];

  /* ── Type: a pixel face for the words ── */
  const PIX = "'Pixelify Sans', 'DM Mono', monospace";
  const txt = (top, s, color, size = 18, extra = '') => `<span style="position: absolute; left: 0; right: 0; top: ${top}px; text-align: center; font-family: ${PIX}; font-size: ${size}px; color: ${color}; letter-spacing: 0.04em; ${extra}">${s}</span>`;

  /* ── Palettes ── */
  const PS = S.PAL.sunrise, PD = S.PAL.dusk, PN = S.PAL.night;
  const RBW = { k: '#151116', w: '#F4EEE4', r: '#B3242C', o: '#E08A2C', b: '#6B1E24', g: '#1F6B4A' };
  const SKY_RISE = ['#A9DDE0', '#C6E8E6', '#E6F1EA', '#FCE7D8', '#FBC9A6'];
  const SKY_DUSK = ['#2E2A5C', '#463E80', '#5A4E9A', '#A785B0', '#EFA07E'];
  const SKY_NIGHT = ['#0B1026', '#0F1534', '#121A3E', '#1B2350'];

  /** Sunrise's sun in pixels: a soft highlight up-left, a peach rim, the mark pressed in. */
  function pixelSun(px, cx, cy, r, { mark = 'mark13', markC = '#E9A47C' } = {}) {
    px.disc(cx, cy, r, (x, y, d, dx, dy) => (d > r - 1.1 ? '#F9A980' : Math.hypot(dx + r * 0.3, dy + r * 0.35) < r * 0.5 ? '#FFF6EC' : d > r * 0.72 ? '#FBC8A3' : '#FFE6CC'));
    const m = SP[mark], [mw, mh] = center(m);
    px.sprite(Math.round(cx - mw / 2), Math.round(cy - mh / 2), m, markC);
  }
  function pixelMoon(px, cx, cy, r, { mark = 'mark13' } = {}) {
    px.disc(cx, cy, r, (x, y, d, dx, dy) => {
      const dark = Math.hypot(x + 0.5 - (cx + r * 1.32), y + 0.5 - cy) < r * 0.95;
      if (dark) return d > r - 1.1 ? '#4A5288' : '#2A3266';
      return d > r - 1.1 ? '#CFC8B6' : Math.hypot(dx + r * 0.35, dy + r * 0.3) < r * 0.45 ? '#FFFFFF' : '#F2ECDD';
    });
    const m = SP[mark], [mw, mh] = center(m);
    px.sprite(Math.round(cx - mw / 2), Math.round(cy - mh / 2), m, null, (i, j) => {
      const x = Math.round(cx - mw / 2) + i, y = Math.round(cy - mh / 2) + j;
      return Math.hypot(x + 0.5 - (cx + r * 1.32), y + 0.5 - cy) < r * 0.95 ? '#3A4378' : '#C9C2B0';
    });
  }
  const teeth = [{ m: 'dhurus', map: { k: 'r' }, flip: true }, { m: 'stripe', map: { k: 'o' } }];
  /** A ring that ticks round one cell per frame: seamless over one motif period. */
  function tickingRing(cx, cy, r0, segs, pal, dur = 2.4) {
    const p = S.period(segs);
    const layers = loop(p).map((k) => { const px = new Px(); px.ring(cx, cy, r0, segs, pal, { shift: k }); return px.svg(); });
    return frames(layers, loop(p), dur);
  }
  function stars(px, n, colors, ymax = 100, seedv = 3) {
    seed = seedv;
    for (let i = 0; i < n; i++) px.set(rnd() * GW, rnd() * ymax, colors[i % colors.length]);
  }
  function twinkle(n, ymax = 100, seedv = 11) {
    // Two frames: a few stars become little crosses, then others.
    const layers = [0, 1].map((f) => {
      seed = seedv + f * 31;
      const px = new Px();
      for (let i = 0; i < n; i++) {
        const x = Math.floor(rnd() * GW), y = Math.floor(rnd() * ymax);
        px.set(x, y, '#FFFFFF'); px.set(x - 1, y, '#8990B5'); px.set(x + 1, y, '#8990B5'); px.set(x, y - 1, '#8990B5'); px.set(x, y + 1, '#8990B5');
      }
      return px.svg();
    });
    return frames(layers, [0, 0, 1, 1], 3.2);
  }

  /* ══════════ The phones ══════════ */
  // P1 · Sunrise scene
  const P1 = (() => {
    const base = new Px();
    base.grad(0, 104, SKY_RISE);
    base.rect(0, 104, GW, 37, PS.w);
    base.band(0, 104, GW, [{ m: 'dhurus', map: { k: 'o' } }, { m: 'stripe', map: { k: 'r' } }, { m: 'eein', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'r' } }, { m: 'dhurus', map: { k: 'k' }, flip: true }, { m: 'stripe', map: { k: 'k' }, rep: 2 }, { m: 'uwairjan', map: { k: 'k', r: 'b' }, ground: 'w' }, { m: 'stripe', map: { k: 'k' }, rep: 6 }], PS);
    base.glow(32.5, 33, 9, 15, '#FFE6CC', 0.55);
    pixelSun(base, 32.5, 33, 9);
    return `${base.svg()}${tickingRing(32.5, 33, 12, teeth, PS, 2.4)}${txt(512, 'TANAFAS', '#58595B', 13)}`;
  })();
  // P2 · Dusk: the Towers, a shimmering sea
  const P2 = (() => {
    const base = new Px();
    base.grad(0, 100, SKY_DUSK);
    stars(base, 26, ['#FBE6C8', '#A785B0'], 50, 5);
    base.glow(32.5, 30, 9, 16, '#EFA07E', 0.6);
    base.disc(32.5, 30, 9.6, (x, y, d) => (d > 8.2 ? '#FFD8A0' : d > 7.4 ? '#F5B08A' : null));
    const m = SP.mark11; base.sprite(27, 25, m, '#F5B47A');
    const T = SP.towers;
    base.sprite(14, 100 - T.length, T, '#221E46');
    // the spheres' discs: teal flecks where the spheres are
    const sph = [[21.25, 37.6, 5.4], [24.5 - 3.3, 24.5, 3], [32.1, 35.1, 3.4]];
    for (const [sx, sy, sr] of sph) for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (Math.hypot(x, y) < sr - 0.6 && (x + y * 2) % 3 === 0) { const X = 14 + Math.round(sx + x), Y = 100 - T.length + Math.round(sy + y); if (base.get(X, Y)) base.set(X, Y, '#6FD6CF'); }
    base.rect(0, 100, GW, 41, '#221E46');
    base.band(0, 99, GW, [{ m: 'dhurus', map: { k: 'o' } }, { m: 'stripe', map: { k: 'r' } }], PD);
    const sea = loop(3).map((f) => { seed = 40 + f * 13; const px = new Px(); for (let i = 0; i < 46; i++) { const y = 106 + Math.floor(rnd() * 34), x = Math.floor(rnd() * 60), w = 2 + Math.floor(rnd() * 5); px.rect(x, y, w, 1, y < 116 ? '#EFA07E' : i % 2 ? '#5A4E9A' : '#A785B0'); } px.rect(29, 106 + f, 7, 1, '#FFD8A0'); px.rect(30, 110 + f, 5, 1, '#F5B08A'); return px.svg(); });
    return `${base.svg()}${frames(sea, [0, 1, 2], 1.5)}${txt(800, 'TANAFAS', 'rgba(242,236,221,0.7)', 13)}`;
  })();
  // P3 · Night: the moon over a moonlit weave
  const P3 = (() => {
    const base = new Px();
    base.grad(0, 112, SKY_NIGHT);
    stars(base, 70, ['#F2ECDD', '#8990B5', '#6FD6CF'], 108, 9);
    base.glow(32.5, 33, 9, 15, '#2A3266', 0.8);
    pixelMoon(base, 32.5, 33, 9);
    base.rect(0, 112, GW, 29, PN.k);
    base.band(0, 112, GW, [{ m: 'dhurus', map: { k: 'r' } }, { m: 'stripe', map: { k: 'b' } }, { m: 'eein', map: { k: 'w', r: 'o' }, ground: 'k' }, { m: 'stripe', map: { k: 'b' } }], PN);
    return `${base.svg()}${twinkle(9, 100)}${txt(512, 'TANAFAS', 'rgba(242,236,221,0.6)', 13)}`;
  })();
  // P4 · Splash: the Towers in the diamond, in pixels
  const P4 = (() => {
    const N = 8, tri = S.checkerTriangle(N, RBW.r, RBW.k), cx = 32, cy = 46, gap = 15;
    const down = [...tri].reverse();
    // Side triangles: base on the outside, apex pointing in.
    const side = (apexRight) => Array.from({ length: 2 * N }, (_, j) => Array.from({ length: N }, (_, i) => (Math.abs(j - N + 0.5) <= (apexRight ? N - 1 - i : i) + 0.5 ? ((i + j) % 2 ? RBW.r : RBW.k) : null)));
    const left = side(true), right = side(false);
    const layer = (parts) => { const px = new Px(); for (const p of parts) p(px); return px.svg(); };
    const top = (px) => px.rows(cx - N, cy - gap - N, down);
    const bottom = (px) => px.rows(cx - N, cy + gap, tri);
    const lft = (px) => px.rows(cx - gap - N, cy - N, left);
    const rgt = (px) => px.rows(cx + gap, cy - N, right);
    const base = new Px();
    base.rect(0, 0, GW, GH, '#F5ECDD');
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if ((x * 7 + y * 13) % 29 === 0) base.set(x, y, '#EADFCB');
    const lz = [{ m: 'lozenge', map: { k: 'b', r: 'o' }, ground: 'w' }];
    const lzPal = { ...RBW, o: '#C9907A', b: '#5A3A36', w: '#F5ECDD' };
    base.band(0, 6, GW, lz, lzPal); base.band(0, 82, GW, lz, lzPal);
    const ts = SP.towersSmall, fishS = SP.fish, camS = SP.camel, logo = SP.logo40;
    const tsTrim = ts.slice(2);
    const figures = (px) => { px.sprite(cx - 11, cy + 14 - tsTrim.length, tsTrim, '#151116'); px.sprite(6, cy - 26, fishS, '#151116'); px.sprite(47, cy - 28, camS, '#151116'); };
    const word = (px) => px.sprite(12, 96, logo, '#B3242C');
    const L = [layer([]), layer([top]), layer([top, rgt]), layer([top, rgt, bottom]), layer([top, rgt, bottom, lft]), layer([top, rgt, bottom, lft, figures]), layer([top, rgt, bottom, lft, figures, word])];
    return `${base.svg()}${frames(L, [0, 1, 2, 3, 4, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6], 6.4)}${txt(722, 'Breathe · rest · return', '#151116', 18)}`;
  })();
  // P5 · Splash: dawn, the band woven row by row, the sun rising by whole pixels
  const P5 = (() => {
    const segs = [{ m: 'uwairjan', map: { k: 'o', r: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'k' } }, { m: 'dhurus', map: { k: 'k' } }, { m: 'stripe', map: { k: 'r' } }];
    const rowsN = S.rowsOf(segs), band = S.band(segs, PS, 66);
    const base = new Px(); base.grad(0, 92, ['#274A5E', '#4F7A86', '#C99A8A', '#F2B38F']); base.rect(0, 92, GW, 49, '#F2B38F');
    const layers = [], seq = [];
    // The band, row by row from the bottom of its strip.
    for (let k = 0; k <= rowsN; k++) { const px = new Px(); band.slice(rowsN - k).forEach((line, j) => line.forEach((c, i) => px.set(i, 92 + (rowsN - k) + j, c))); layers.push(px.svg()); seq.push(layers.length - 1); }
    // The sun rising by whole pixels behind the band (drawn above the band's top only).
    for (let s = 1; s <= 10; s++) { const px = new Px(); pixelSun(px, 32.5, 92 - s * 5, 9); for (let y = 92; y < GH; y++) px.g[y] = Array(GW).fill(null); px.rows(0, 92, band); layers.push(px.svg()); seq.push(layers.length - 1); }
    { const px = new Px(); pixelSun(px, 32.5, 42, 9); px.rows(0, 92, band); px.sprite(12, 110, SP.logo40, '#FFF4E8'); layers.push(px.svg()); for (let i = 0; i < 10; i++) seq.push(layers.length - 1); }
    return base.svg() + frames(layers, seq, 7);
  })();
  // P6 · Breathing (4-7-8), the orb growing by whole pixels
  const P6 = (() => {
    const base = new Px();
    base.grad(0, GH, ['#F2F6F4', '#F2F6F4', '#F7EEE4', '#FCE7D8']);
    base.band(4, 110, 57, [{ m: 'stripe', map: { k: 'k' } }, { m: 'hubub', map: { o: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'k' } }], PS);
    const R = [9, 10, 11, 12, 13, 14, 15, 16, 17];
    const layers = R.map((r) => { const px = new Px(); px.disc(32.5, 33, r, (x, y, d, dx, dy) => (d > r - 1 ? '#196662' : Math.hypot(dx + r * 0.35, dy + r * 0.35) < r * 0.4 ? '#FFFFFF' : d > r - 2.2 ? '#BFE3DF' : '#DDF0EE')); px.sprite(26, 26, SP.mark13, '#196662'); return px.svg(); });
    const n = R.length;
    const seq = [...loop(n).flatMap((k) => [k, k]), ...Array(38).fill(n - 1), ...loop(n).reverse().flatMap((k) => [k, k, k, k]), ...Array(4).fill(0)];
    return `${base.svg()}${frames(layers, seq, 19)}${txt(70, 'BREATHE · MEDITATE', '#196662', 13)}${txt(400, 'Breathe in', '#1D2B2A', 26)}${txt(436, '4-7-8 · round 1 of 4', '#58595B', 14)}${txt(712, 'woven as you breathe', '#58595B', 12)}`;
  })();
  // P7 · Celestial Home (Sunrise)
  const homeTab = (px, c, raised, on) => { px.rect(0, 128, GW, 13, '#FFFFFF'); px.rect(0, 128, GW, 1, '#DCE5E3'); [6, 18, 44, 56].forEach((x, i) => { px.rect(x, 131, 4, 4, i === 0 ? on : c); }); px.disc(32.5, 130, 5, raised); };
  const P7 = (() => {
    const base = new Px();
    base.rect(0, 0, GW, GH, '#F2F6F4');
    base.glow(32.5, 33, 9, 18, '#D8EEEB', 0.75);
    pixelSun(base, 32.5, 33, 9);
    const map = SP.map;
    base.sprite(1, 76, map, null, (i, j) => ((i + j) % 2 ? '#C7D6D3' : null));
    const kw = Math.round((128 / 200) * 62), kwy = Math.round((48 / 99.4) * 31);
    base.rect(1 + kw, 76 + kwy, 2, 2, '#E8582C');
    homeTab(base, '#9AA3A2', '#196662', '#196662');
    const small = new Px(GW * 3, 24);
    small.sprite(Math.round((GW * 3) / 2 - 20), 2, SP.logo40, '#3BAAA7');
    return `${base.svg()}${tickingRing(32.5, 33, 12, teeth, PS, 2.4)}<div style="position: absolute; left: 0; top: 18px">${small.svg(2)}</div>${txt(66, '20 Rabiʿ II · waning gibbous', '#58595B', 12)}${txt(300, '• YOU’RE NOT ALONE', '#196662', 12)}${txt(326, 'You are one light among many.', '#1D2B2A', 18)}${txt(410, 'BREATHING TOGETHER · MONTH', '#6D6F72', 11, 'text-align: left; padding-left: 16px')}<span style="position: absolute; left: 16px; top: 640px; font-family: ${PIX}; font-size: 40px; color: #196662">6</span><span style="position: absolute; left: 56px; top: 646px; font-family: ${PIX}; font-size: 13px; color: #1D2B2A; width: 280px">people breathed and meditated with Houna this month</span>`;
  })();
  // P8 · Badges as pixel sprites
  const P8 = (() => {
    const base = new Px();
    base.rect(0, 0, GW, GH, '#F2F6F4');
    const tile = (cx, cy, lit, draw) => { base.disc(cx, cy, 8.6, (x, y, d) => (d > 7.8 ? (lit ? '#E8582C' : '#C9D1CF') : lit ? '#FFF4E8' : '#E6EBEA')); draw(cx, cy, lit); };
    const gc = (lit, c) => (lit ? c : '#B8C2C0');
    const icons = [
      (cx, cy, l) => { base.disc(cx, cy, 3.2, gc(l, '#F9A980')); for (let a = 0; a < 8; a++) base.set(cx + Math.cos((a * Math.PI) / 4) * 5.2 - 0.5, cy + Math.sin((a * Math.PI) / 4) * 5.2 - 0.5, gc(l, '#E8582C')); },
      (cx, cy, l) => base.disc(cx, cy, 5, (x, y) => (Math.hypot(x + 0.5 - cx - 2.6, y + 0.5 - cy) < 4.4 ? null : gc(l, '#196662'))),
      (cx, cy, l) => { const pts = []; for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (Math.abs(x) + Math.abs(y) <= 5 && (Math.abs(x) <= 1 || Math.abs(y) <= 1 || Math.abs(Math.abs(x) - Math.abs(y)) <= 0)) pts.push([x, y]); pts.forEach(([x, y]) => base.set(cx + x - 0.5, cy + y - 0.5, gc(l, '#E8582C'))); },
      (cx, cy, l) => base.sprite(Math.round(cx - 5.5), Math.round(cy - 5.5), S.MOTIFS.shajarah.rows.map((r) => r.replace(/[kr]/g, '#')), gc(l, '#196662')),
      (cx, cy, l) => base.sprite(Math.round(cx - 4), Math.round(cy - 3.5), S.MOTIFS.eein.rows.map((r) => r.replace(/k/g, '#').replace(/r/g, '#')), gc(l, '#C2475A')),
      (cx, cy, l) => base.sprite(Math.round(cx - 5.5), Math.round(cy - 5.5), SP.mark11, gc(l, '#196662')),
      (cx, cy, l) => base.sprite(Math.round(cx - 5.5), Math.round(cy - 8), pool(SP.towersSmall.slice(2)), gc(l, '#2E2A5C')),
      (cx, cy, l) => base.sprite(Math.round(cx - 6), Math.round(cy - 4), SP.fish, gc(l, '#0A91BB')),
      (cx, cy, l) => base.sprite(Math.round(cx - 6), Math.round(cy - 5), SP.camel, gc(l, '#6B4A33')),
    ];
    const names = ['3 days', '7 days', '14 days', '30 days', '100 days', 'First breath', 'Every breath', 'Every scene', 'Sky watcher'];
    const pos = icons.map((_, i) => [12 + (i % 3) * 20.5, 28 + Math.floor(i / 3) * 28]);
    icons.forEach((draw, i) => tile(pos[i][0], pos[i][1], i < 4 || i === 5, draw));
    return `${base.svg()}${txt(60, 'BADGES', '#196662', 20)}${pos.map(([x, y], i) => `<span style="position: absolute; left: ${x * 6 - 60}px; top: ${(y + 10) * 6}px; width: 120px; text-align: center; font-family: ${PIX}; font-size: 12px; color: #58595B">${names[i]}</span>`).join('')}`;
  })();
  // P9 · Recap: your month, a pixel blanket
  const P9 = (() => {
    const base = new Px();
    base.grad(0, GH, ['#151116', '#1B1420', '#221824']);
    const days = [1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1];
    const motifs = ['dhurus', 'dots', 'checker', 'lozenge', 'dealla', 'hubub'];
    let y = 30;
    days.forEach((d, i) => {
      const m = motifs[i % motifs.length];
      const segs = [{ m, map: { k: d ? (i % 2 ? 'r' : 'o') : 'b', r: d ? 'r' : 'b', o: d ? 'o' : 'b', w: d ? 'w' : 'b' }, ground: d ? 'k' : null }];
      const rows = S.band(segs, d ? RBW : { ...RBW, b: '#2E2430' }, 57).slice(0, 3);
      base.rows(4, y, rows);
      y += 3;
    });
    base.rect(4, 29, 57, 1, '#B3242C'); base.rect(4, y, 57, 1, '#B3242C');
    return `${base.svg()}${txt(44, 'SEPTEMBER', '#E08A2C', 12)}${txt(70, 'Your month, woven', '#F4EEE4', 24)}${txt(114, 'one row a day · coloured when you practised', 'rgba(244,238,228,0.7)', 12)}${txt((y + 4) * 6, '21 days woven', '#F4EEE4', 16)}`;
  })();
  // P10 · Night Home, the moon in a ticking woven ring, stars twinkling
  const P10 = (() => {
    const base = new Px();
    base.grad(0, GH, SKY_NIGHT);
    stars(base, 60, ['#F2ECDD', '#8990B5'], 120, 21);
    pixelMoon(base, 32.5, 33, 9);
    base.sprite(1, 78, SP.map, null, (i, j) => ((i + j) % 2 ? '#2A3266' : null));
    base.rect(1 + Math.round((128 / 200) * 62), 78 + Math.round((48 / 99.4) * 31), 2, 2, '#6FD6CF');
    base.rect(0, 128, GW, 13, '#121A3E'); base.rect(0, 128, GW, 1, '#232C5E');
    [6, 18, 44, 56].forEach((x, i) => base.rect(x, 131, 4, 4, i === 0 ? '#6FD6CF' : '#4A5288'));
    base.disc(32.5, 130, 5, '#F2ECDD');
    const small = new Px(GW * 3, 24);
    small.sprite(Math.round((GW * 3) / 2 - 20), 2, SP.logo40, '#6FD6CF');
    return `${base.svg()}${twinkle(8, 120, 33)}${tickingRing(32.5, 33, 12, [{ m: 'hubub', map: { o: 'w' } }, { m: 'stripe', map: { k: 'r' } }], PN, 3.2)}<div style="position: absolute; left: 0; top: 18px">${small.svg(2)}</div>${txt(66, '20 Rabiʿ II · waning gibbous', '#B6BAD6', 12)}${txt(300, '• YOU’RE NOT ALONE', '#6FD6CF', 12)}${txt(326, 'Someone, somewhere, is breathing with you.', '#F2ECDD', 16)}`;
  })();

  const P = [
    { id: 'P1', name: 'Sunrise, in pixels', note: 'A dithered morning sky, the sun a pixel disc with the mark pressed in, its ring of teeth ticking round one stitch at a time, over a woven horizon where every Sadu cell is one pixel.', html: P1, bg: '#F2F6F4' },
    { id: 'P2', name: 'The Towers at dusk', note: 'Kuwait Towers as a pixel sprite from their real outline, teal flecks on the spheres; the sea shimmers in three frames under the ring of light.', html: P2, bg: '#221E46' },
    { id: 'P3', name: 'Night', note: 'The moon in its real phase as pixels, the mark in it; stars that twinkle into little crosses; a moonlit weave for the ground.', html: P3, bg: '#0B1026' },
    { id: 'P4', name: 'Splash: the Towers in the diamond', note: 'Your Towers piece as a pixel splash: the checkered triangles arrive one by one, then the Towers, fish and camel, then the wordmark in pixels.', html: P4, bg: '#F5ECDD' },
    { id: 'P5', name: 'Splash: dawn, woven', note: 'The band weaves itself in row by row, then the sun rises by whole pixels from behind it, and the wordmark settles on the cloth.', html: P5, bg: '#F2B38F' },
    { id: 'P6', name: 'Breathing, by the pixel', note: '4-7-8’s orb grows a pixel at a time on the in-breath, holds, and shrinks on the out; a seed band beneath.', html: P6, bg: '#F2F6F4' },
    { id: 'P7', name: 'Celestial Home (Sunrise)', note: 'Home all in pixels: the wordmark, the sun and its ticking ring, the map as a dotted pixel map with Kuwait lit, the count.', html: P7, bg: '#F2F6F4' },
    { id: 'P8', name: 'Badges as sprites', note: 'Nine 16-pixel badges: the sun, the moon, a star, the tree, the eye, the mark, the Towers, a zubaidi, a camel; not yet earned, in grey.', html: P8, bg: '#F2F6F4' },
    { id: 'P9', name: 'Recap: a pixel blanket', note: 'The month as a woven blanket, one band a day in red, black, white and orange, quiet where you didn’t practise.', html: P9, bg: '#151116' },
    { id: 'P10', name: 'Night Home', note: 'Night Home in pixels: the moon in a ring of seeds and a red thread ticking round, the stars twinkling, the dotted map.', html: P10, bg: '#0B1026' },
  ];
  const css = () => kf.join('\n');
  row('P-pixel-1.dc.html', { title: 'P · Pixel art (P1–P5)', css: css(), phones: P.slice(0, 5).map((p) => ({ bg: p.bg, caption: `${p.id} · ${p.name} · ${p.note}`, html: p.html })) });
  row('P-pixel-2.dc.html', { title: 'P · Pixel art (P6–P10)', css: css(), phones: P.slice(5).map((p) => ({ bg: p.bg, caption: `${p.id} · ${p.name} · ${p.note}`, html: p.html })) });
  return { pRows: [['P-pixel-1.dc.html'], ['P-pixel-2.dc.html']] };
};
