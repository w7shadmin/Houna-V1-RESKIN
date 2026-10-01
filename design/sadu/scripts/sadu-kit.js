// Sadu for "Houna — Sadu" (https://claude.ai/artifact/RKWjRt6u5F82cUzjFBZBHF): the motifs as woven cells,
// drawn as straight bands (rects) or wrapped into rings (annular sectors), in each theme's colours,
// plus a few Kuwaiti landmarks as simple silhouettes. Used by make-sadu.js.
//
// Al Sadu is warp-faced: its patterns are built from small stepped cells, in bands, the border motifs
// (Hubub seeds, Dealla ribs, Eein eye, Dhurs al-Khail horse teeth, Uwairjan facing triangles) round a
// central Shajarah (tree) band. Traditional colours: black, brown, beige and red, brightened with orange.
const f = (n) => +n.toFixed(2);

/** Each motif: rows of cells. k = ink, r = red, o = orange, b = brown, w = light, '.' = the band's ground (or nothing). */
const MOTIFS = {
  hubub: { name: 'Hubub', en: 'seeds', rows: ['......', '.o..o.', '......'] },
  hububOff: { name: 'Hubub', en: 'seeds', rows: ['o...', '....', '..o.', '....'] },
  dealla: { name: 'Dealla', en: 'ribs', rows: ['k.r.', 'k.r.', 'k.r.', 'k.r.'] },
  eein: {
    name: 'Eein', en: 'eye',
    rows: ['...k....', '..k.k...', '.k.r.k..', 'k.rrr.k.', '.k.r.k..', '..k.k...', '...k....'],
  },
  dhurus: { name: 'Dhurs al-Khail', en: 'horse teeth', rows: ['k...', 'kk..', 'kkk.', 'kkkk'] },
  dhurus2: { name: 'Dhurs al-Khail', en: 'horse teeth, two colours', rows: ['kooo', 'kkoo', 'kkko'] },
  uwairjan: {
    name: 'Uwairjan', en: 'facing triangles',
    rows: ['kkkkk.', '.kkk..', '..k...', '..r...', '.rrr..', 'rrrrr.'],
  },
  shajarah: {
    name: 'Shajarah', en: 'tree',
    rows: [
      '.....k.....', '....kkk....', '...k.k.k...', '..k..k..k..', '.....k.....', '...kkkkk...',
      '..k..k..k..', '.k...k...k.', '.....k.....', '....kkk....', '.....r.....',
    ],
  },
  chevron: { name: 'Chevron', en: 'steps', rows: ['k.....k', '.k...k.', '..k.k..', '...k...'] },
  stripe: { name: 'Stripe', en: 'plain band', rows: ['k'] },
  dots: { name: 'Hubub line', en: 'a dotted line of seeds', rows: ['w.'] },
  checker: { name: 'Checker', en: 'two-colour seeds', rows: ['kr', 'rk'] },
  lozenge: { name: 'Lozenges', en: 'a border of diamonds', rows: ['..k...', '.krk..', 'krrrk.', '.krk..', '..k...'] },
  checkTri: { name: 'Checkered teeth', en: 'triangles filled with a checker', rows: Array.from({ length: 6 }, (_, j) => Array.from({ length: 12 }, (_, c) => (Math.abs(c - 5.5) <= j + 0.5 ? ((c + j) % 2 ? 'w' : 'k') : '.')).join('')) },
};

/** Sadu in each theme: the traditional five colours carried into Houna's palettes. */
const PAL = {
  classic: { k: '#1E1A17', w: '#EADCC2', r: '#A8322A', o: '#D9782B', b: '#6B4A33' },
  sunrise: { k: '#196662', w: '#FFF4E8', r: '#E8582C', o: '#F9A980', b: '#C2475A' },
  dusk: { k: '#2E2A5C', w: '#FBE6C8', r: '#E4826A', o: '#F5B08A', b: '#7A5E9E' },
  night: { k: '#0B1026', w: '#F2ECDD', r: '#6FD6CF', o: '#F2B880', b: '#8990B5' },
};

/**
 * A band: segments stacked top to bottom, each a motif with its colours. `seg.map` maps a motif letter
 * to a palette key (default identity), `seg.ground` fills '.', `seg.flip` turns it upside down,
 * `seg.mirror` reverses it left to right. Returns the band's rows of colours (null = empty), at width `w`.
 */
function band(segs, pal, w) {
  const out = [];
  for (const s of segs) {
    const m = MOTIFS[s.m];
    let rows = s.flip ? [...m.rows].reverse() : m.rows;
    if (s.mirror) rows = rows.map((r) => [...r].reverse().join(''));
    const rep = s.rep || 1;
    for (const row of rows)
      for (let t = 0; t < rep; t++) {
        const line = [];
        for (let c = 0; c < w; c++) {
          const ch = row[(c + (s.shift || 0)) % row.length];
          const key = ch === '.' ? s.ground : (s.map && s.map[ch]) || ch;
          line.push(key ? pal[key] || key : null);
        }
        out.push(line);
      }
  }
  return out;
}
/** The width (in cells) every segment repeats evenly in. */
function period(segs) {
  const g = (a, b) => (b ? g(b, a % b) : a);
  return segs.reduce((acc, s) => {
    const p = MOTIFS[s.m].rows[0].length;
    return (acc * p) / g(acc, p);
  }, 1);
}

/** A band as SVG rects at (x, y), cell `cs` wide and tall, runs merged; `rib` draws the warp's vertical threads. */
function rectBand(rows, x, y, cs, { rib = true, ch = cs, bead = false } = {}) {
  if (bead) return beadBand(rows, x, y, cs, ch);
  let s = '';
  rows.forEach((line, j) => {
    let c = 0;
    while (c < line.length) {
      const col = line[c];
      let e = c;
      while (e + 1 < line.length && line[e + 1] === col) e++;
      if (col) s += `<rect x="${f(x + c * cs)}" y="${f(y + j * ch)}" width="${f((e - c + 1) * cs)}" height="${f(ch + 0.3)}" fill="${col}"></rect>`;
      c = e + 1;
    }
  });
  if (rib) {
    const w = rows[0].length * cs, h = rows.length * ch;
    s += `<g opacity="0.16">${Array.from({ length: rows[0].length }, (_, c) => `<rect x="${f(x + c * cs + cs * 0.82)}" y="${f(y)}" width="${f(cs * 0.18)}" height="${f(h)}" fill="#000"></rect>`).join('')}</g>`;
    void w;
  }
  return s;
}
/**
 * A band as stitches: each cell a small upright lozenge with a soft light on it, as warp-faced Sadu
 * reads close up (the photos in the inspiration). Heavier than rectBand: for hero pieces.
 */
let beadN = 0;
function beadBand(rows, x, y, cs, ch = cs) {
  const id = `bead${++beadN}`;
  const w = rows[0].length * cs, h = rows.length * ch;
  let s = '';
  rows.forEach((line, j) => line.forEach((col, c) => {
    if (!col) return;
    const cx = x + c * cs + cs / 2, top = y + j * ch - ch * 0.18, bot = y + (j + 1) * ch + ch * 0.18;
    s += `<path d="M${f(cx)} ${f(top)} L${f(cx + cs * 0.5)} ${f((top + bot) / 2)} L${f(cx)} ${f(bot)} L${f(cx - cs * 0.5)} ${f((top + bot) / 2)} Z" fill="${col}"></path>`;
  }));
  const cells = s;
  s += `<defs><clipPath id="${id}c">${cells}</clipPath><pattern id="${id}" x="${f(x)}" y="${f(y)}" width="${f(cs)}" height="${f(ch)}" patternUnits="userSpaceOnUse"><ellipse cx="${f(cs * 0.42)}" cy="${f(ch * 0.36)}" rx="${f(cs * 0.14)}" ry="${f(ch * 0.24)}" fill="#fff" opacity="0.35"></ellipse><path d="M${f(cs * 0.5)} ${f(ch * 1.05)} L${f(cs)} ${f(ch * 0.5)}" stroke="#000" stroke-opacity="0.25" stroke-width="${f(cs * 0.08)}"></path></pattern></defs><rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#${id})" clip-path="url(#${id}c)"></rect>`;
  return s;
}
/** A band wrapped into a ring round (cx, cy): row 0 innermost at r0, each row `t` thick; cols cells round. */
function ringBand(rows, cx, cy, r0, t) {
  const n = rows[0].length;
  const da = (2 * Math.PI) / n;
  let s = '';
  rows.forEach((line, j) => {
    const ri = r0 + j * t, ro = ri + t + 0.2;
    let c = 0;
    while (c < n) {
      const col = line[c];
      let e = c;
      while (e + 1 < n && line[e + 1] === col) e++;
      if (col && e - c + 1 === n) {
        // A whole circle: two half-rings (an arc can't start and end at the same point).
        s += `<path d="M${f(cx)} ${f(cy - ro)} A${f(ro)} ${f(ro)} 0 1 1 ${f(cx)} ${f(cy + ro)} A${f(ro)} ${f(ro)} 0 1 1 ${f(cx)} ${f(cy - ro)} Z M${f(cx)} ${f(cy - ri)} A${f(ri)} ${f(ri)} 0 1 0 ${f(cx)} ${f(cy + ri)} A${f(ri)} ${f(ri)} 0 1 0 ${f(cx)} ${f(cy - ri)} Z" fill="${col}" fill-rule="evenodd"></path>`;
      } else if (col) {
        const a0 = c * da - Math.PI / 2, a1 = (e + 1) * da - Math.PI / 2 + 0.002;
        const big = a1 - a0 > Math.PI ? 1 : 0;
        const p = (r, a) => `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
        s += `<path d="M${p(ro, a0)} A${f(ro)} ${f(ro)} 0 ${big} 1 ${p(ro, a1)} L${p(ri, a1)} A${f(ri)} ${f(ri)} 0 ${big} 0 ${p(ri, a0)} Z" fill="${col}"></path>`;
      }
      c = e + 1;
    }
  });
  return s;
}
/** A ring of `segs` round a circle: picks the cell count so cells stay about square at the middle radius. */
function ring(segs, pal, cx, cy, r0, t, { cols } = {}) {
  const rowsN = segs.reduce((a, s) => a + MOTIFS[s.m].rows.length * (s.rep || 1), 0);
  const p = period(segs);
  const mid = r0 + (rowsN * t) / 2;
  const n = cols || Math.max(p, Math.round((2 * Math.PI * mid) / t / p) * p);
  return ringBand(band(segs, pal, n), cx, cy, r0, t);
}
/** A straight strip of `segs`, `w` wide in px, cell size `cs`. */
function strip(segs, pal, x, y, w, cs, opts) {
  const p = period(segs);
  const n = Math.ceil(w / cs / p) * p;
  return rectBand(band(segs, pal, n), x, y, cs, opts);
}
const rowsOf = (segs) => segs.reduce((a, s) => a + MOTIFS[s.m].rows.length * (s.rep || 1), 0);

/* ── Kuwaiti landmarks, as plain silhouettes (base at y, `h` tall for the tallest part) ── */
/** Kuwait Towers: the main tower with its two spheres, the second with one, the third a needle. */
function kuwaitTowers(x, y, h, { fill = '#2E2A5C', disc = null, sunAt = false } = {}) {
  const u = h / 187;
  const spire = (cx, top, w) => `<path d="M${f(cx - w / 2)} ${f(y)} L${f(cx - w * 0.18)} ${f(y - top)} L${f(cx + w * 0.18)} ${f(y - top)} L${f(cx + w / 2)} ${f(y)} Z" fill="${fill}"></path>`;
  const sph = (cx, cyUp, r, lit) => {
    const cy = y - cyUp;
    const dots = disc
      ? Array.from({ length: 22 }, (_, i) => {
          const a = (i / 22) * Math.PI * 2, rr = r * (0.35 + 0.5 * ((i * 7) % 5) / 5);
          return `<circle cx="${f(cx + Math.cos(a) * rr)}" cy="${f(cy + Math.sin(a) * rr * 0.9)}" r="${f(r * 0.09)}" fill="${disc}"></circle>`;
        }).join('')
      : '';
    return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${lit || fill}"></circle>${dots}`;
  };
  const a = x, b = x + 34 * u, c = x - 26 * u;
  return `${spire(c, 113 * u, 5 * u)}${spire(b, 147 * u, 7 * u)}${sph(b, 90 * u, 11 * u)}${spire(a, 187 * u, 9 * u)}${sunAt ? '' : sph(a, 82 * u, 17 * u)}${sph(a, 123 * u, 9.5 * u)}`;
}
/** Liberation Tower: a tall tapering shaft, its pod near the top, a spire. */
function liberationTower(x, y, h, fill = '#2E2A5C') {
  const u = h / 372;
  return `<path d="M${f(x - 9 * u)} ${f(y)} L${f(x - 4 * u)} ${f(y - 300 * u)} L${f(x + 4 * u)} ${f(y - 300 * u)} L${f(x + 9 * u)} ${f(y)} Z" fill="${fill}"></path><ellipse cx="${f(x)}" cy="${f(y - 292 * u)}" rx="${f(15 * u)}" ry="${f(22 * u)}" fill="${fill}"></ellipse><path d="M${f(x - 1.4 * u)} ${f(y - 312 * u)} L${f(x)} ${f(y - 372 * u)} L${f(x + 1.4 * u)} ${f(y - 312 * u)} Z" fill="${fill}"></path>`;
}
/** A boom (Kuwaiti dhow): curved hull, raked mast, lateen sail. */
function dhow(x, y, w, fill = '#196662', sail = '#FFF4E8') {
  const u = w / 100;
  return `<path d="M${f(x)} ${f(y - 14 * u)} Q${f(x + 10 * u)} ${f(y)} ${f(x + 30 * u)} ${f(y)} L${f(x + 82 * u)} ${f(y)} Q${f(x + 96 * u)} ${f(y - 2 * u)} ${f(x + 100 * u)} ${f(y - 16 * u)} L${f(x + 88 * u)} ${f(y - 10 * u)} L${f(x + 12 * u)} ${f(y - 10 * u)} Z" fill="${fill}"></path><path d="M${f(x + 48 * u)} ${f(y - 10 * u)} L${f(x + 54 * u)} ${f(y - 70 * u)}" stroke="${fill}" stroke-width="${f(1.6 * u)}"></path><path d="M${f(x + 20 * u)} ${f(y - 26 * u)} L${f(x + 60 * u)} ${f(y - 76 * u)} Q${f(x + 66 * u)} ${f(y - 44 * u)} ${f(x + 60 * u)} ${f(y - 16 * u)} Z" fill="${sail}" stroke="${fill}" stroke-width="${f(0.8 * u)}"></path>`;
}
/** The Grand Mosque's dome and minaret, low on a skyline. */
function mosque(x, y, w, fill = '#2E2A5C') {
  const u = w / 100;
  return `<rect x="${f(x)}" y="${f(y - 18 * u)}" width="${f(70 * u)}" height="${f(18 * u)}" fill="${fill}"></rect><path d="M${f(x + 14 * u)} ${f(y - 18 * u)} Q${f(x + 35 * u)} ${f(y - 58 * u)} ${f(x + 56 * u)} ${f(y - 18 * u)} Z" fill="${fill}"></path><rect x="${f(x + 84 * u)}" y="${f(y - 74 * u)}" width="${f(6 * u)}" height="${f(74 * u)}" fill="${fill}"></rect><path d="M${f(x + 83 * u)} ${f(y - 74 * u)} L${f(x + 87 * u)} ${f(y - 86 * u)} L${f(x + 91 * u)} ${f(y - 74 * u)} Z" fill="${fill}"></path>`;
}

/** A filled triangle, `n` rows tall, checkered in two colours, apex up, as rows of colours. */
function checkerTriangle(n, a, b) {
  return Array.from({ length: n }, (_, j) => Array.from({ length: 2 * n }, (_, c) => (Math.abs(c - n + 0.5) <= j + 0.5 ? ((c + j) % 2 ? a : b) : null)));
}
/** A simple fish (a zubaidi) and a camel, as in the inspiration's Towers piece. */
function fish(x, y, w, fill) {
  const u = w / 100;
  return `<path d="M${f(x)} ${f(y)} Q${f(x + 30 * u)} ${f(y - 38 * u)} ${f(x + 70 * u)} ${f(y - 4 * u)} L${f(x + 100 * u)} ${f(y - 22 * u)} L${f(x + 90 * u)} ${f(y + 2 * u)} L${f(x + 100 * u)} ${f(y + 24 * u)} L${f(x + 70 * u)} ${f(y + 6 * u)} Q${f(x + 30 * u)} ${f(y + 34 * u)} ${f(x)} ${f(y)} Z" fill="${fill}"></path>`;
}
function camel(x, y, w, fill) {
  const u = w / 100;
  return `<path d="M${f(x + 8 * u)} ${f(y - 70 * u)} Q${f(x + 2 * u)} ${f(y - 74 * u)} ${f(x)} ${f(y - 66 * u)} L${f(x + 10 * u)} ${f(y - 62 * u)} Q${f(x + 18 * u)} ${f(y - 40 * u)} ${f(x + 30 * u)} ${f(y - 44 * u)} Q${f(x + 44 * u)} ${f(y - 72 * u)} ${f(x + 58 * u)} ${f(y - 50 * u)} Q${f(x + 72 * u)} ${f(y - 64 * u)} ${f(x + 86 * u)} ${f(y - 40 * u)} L${f(x + 90 * u)} ${f(y - 22 * u)} L${f(x + 84 * u)} ${f(y)} L${f(x + 80 * u)} ${f(y)} L${f(x + 80 * u)} ${f(y - 22 * u)} L${f(x + 66 * u)} ${f(y - 24 * u)} L${f(x + 64 * u)} ${f(y)} L${f(x + 60 * u)} ${f(y)} L${f(x + 58 * u)} ${f(y - 24 * u)} L${f(x + 40 * u)} ${f(y - 26 * u)} L${f(x + 38 * u)} ${f(y)} L${f(x + 34 * u)} ${f(y)} L${f(x + 32 * u)} ${f(y - 28 * u)} Q${f(x + 22 * u)} ${f(y - 34 * u)} ${f(x + 12 * u)} ${f(y - 58 * u)} Z" fill="${fill}"></path>`;
}

module.exports = { checkerTriangle, fish, camel, beadBand, MOTIFS, PAL, band, period, rectBand, ringBand, ring, strip, rowsOf, kuwaitTowers, liberationTower, dhow, mosque, f };
