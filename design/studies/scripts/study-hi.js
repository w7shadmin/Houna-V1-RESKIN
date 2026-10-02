// Rows H and I of "Houna — Design studies", called from make-studies.js (which lays out the canvas).
// H · Recap's moods slide, "Your emotional landscape": the month's moods drawn six new ways (Night,
//     then four in Arabic), from the app's own mood colours (constants/moods.ts).
// I · The badges and Profile's three stat icons: five celestial / mark-led directions beside
//     today's gems, each in Night and a light theme, earned and not yet.
const fs = require('fs');
const path = require('path');

module.exports = function studyHI({ K, row, out, DIR, M, ROOT }) {
  const { mark } = K;
  let uidN = 0;
  const uid = (p = 'u') => `${p}${++uidN}`;
  const at = (cx, cy, d, inner, style = '') => `<div aria-hidden="true" style="position: absolute; left: ${cx - d / 2}px; top: ${cy - d / 2}px; width: ${d}px; height: ${d}px; ${style}">${inner}</div>`;
  const f2 = (n) => +n.toFixed(2);

  /* ══════════ Shared: the moods, from constants/moods.ts ══════════ */
  const MOOD = {};
  const src = fs.readFileSync(path.join(ROOT, 'constants/moods.ts'), 'utf8');
  for (const m of src.matchAll(/(\w+): \{ color: '(#\w+)', hi: '(#\w+)', lo: '(#\w+)', glow: '([^']+)' \}/g)) MOOD[m[1]] = { color: m[2], hi: m[3], lo: m[4], glow: m[5] };
  const NAME = {
    en: { angry: 'Angry', anxious: 'Anxious', sad: 'Sad', neutral: 'Neutral', calm: 'Calm', hopeful: 'Hopeful', joyful: 'Joyful' },
    ar: { angry: 'غاضب', anxious: 'قلق', sad: 'حزين', neutral: 'محايد', calm: 'هادئ', hopeful: 'متفائل', joyful: 'مبتهج' },
  };
  /** An example September: each day's check-ins (none on a quiet day; never "missed"). */
  const DAYS = [
    ['calm'], ['anxious'], [], ['calm'], ['hopeful'], [], ['anxious', 'calm'], ['sad'], ['neutral'], ['calm'],
    [], ['anxious'], ['joyful'], ['calm'], ['hopeful'], [], ['sad'], ['anxious'], ['calm', 'hopeful'], ['neutral'],
    [], ['angry', 'calm'], ['hopeful'], ['anxious'], ['joyful'], [], ['neutral', 'calm'], ['sad'], ['hopeful', 'joyful'], ['calm'],
  ];
  const COUNT = {};
  DAYS.flat().forEach((m) => (COUNT[m] = (COUNT[m] || 0) + 1));
  const ORDERED = Object.keys(MOOD).filter((m) => COUNT[m]).sort((a, b) => COUNT[b] - COUNT[a]);
  const MAX = COUNT[ORDERED[0]];
  const rgb = (hex) => K.rgbOf(hex);
  const rnd = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

  /* ══════════ H · Your emotional landscape ══════════ */
  const GROUND = '#10173A'; // the moods slide's Night ground (app/recap.tsx SLIDE_BG.moods)
  const TXT = (ar) =>
    ar
      ? { head: 'ملخّص هُنا · سبتمبر', eyebrow: 'مشهدك العاطفي', line: 'كل شعور كان له مكان. ولم يكن أيٌّ منها خطأ.', tap: 'اضغط للمتابعة', close: 'إغلاق الملخّص' }
      : { head: 'Houna recap · September', eyebrow: 'Your emotional landscape', line: 'Every feeling counted. None of them was wrong.', tap: 'Tap to continue', close: 'Close recap' };
  const lab = (t, color, ar, size = 11) => (ar ? K.arLabel(t, color, size + 2) : K.label(t, color, size));
  /** Recap's chrome round a slide: eight segments (moods is the sixth), the header, the eyebrow, the line, "tap to continue". */
  function recap(ar, { art, eyebrowTop = 144, lineTop = 600, legendTop = 0, bg = GROUND, glows = true }) {
    const t = TXT(ar);
    const seg = Array.from({ length: 8 }, (_, k) => `<span style="flex: 1; height: 3px; border-radius: 2px; background: ${k < 6 ? 'rgba(242,236,221,0.9)' : 'rgba(242,236,221,0.18)'}"></span>`).join('');
    const x = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${M.moonlight}" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>`;
    const glow = glows
      ? `<span aria-hidden="true" style="position: absolute; inset: 0; background: radial-gradient(70% 50% at 30% 30%, rgba(179,167,245,0.22), rgba(179,167,245,0) 70%), radial-gradient(70% 50% at 70% 70%, rgba(111,214,207,0.18), rgba(111,214,207,0) 70%)"></span>`
      : '';
    return `<span aria-hidden="true" style="position: absolute; inset: 0; background: ${bg}"></span>${glow}
${art}
<div style="position: absolute; left: 16px; right: 16px; top: 16px; display: flex; gap: 4px">${seg}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 35px; height: 44px; display: flex; align-items: center; justify-content: space-between">${lab(t.head, M.haze, ar, 11)}<span role="button" aria-label="${t.close}" style="width: 44px; height: 44px; border-radius: 999px; background: rgba(242,236,221,0.08); border: 1px solid rgba(242,236,221,0.12); box-sizing: border-box; display: flex; align-items: center; justify-content: center">${x}</span></div>
<div style="position: absolute; left: 0; right: 0; top: ${eyebrowTop}px; display: flex; justify-content: center">${ar ? K.arLabel(t.eyebrow, M.moonlight, 13.5) : K.label(t.eyebrow, M.moonlight, 12)}</div>
<div style="position: absolute; left: 45px; width: 300px; top: ${lineTop}px; text-align: center; font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700; line-height: 36px;' : 'line-height: 28.6px;'} font-size: 22px; color: ${M.moonlight}">${t.line}</div>
${legendTop ? legend(ar, legendTop) : ''}
<div style="position: absolute; left: 0; right: 0; bottom: 40px; display: flex; justify-content: center">${lab(t.tap, M.haze, ar, 11)}</div>`;
  }
  /** The feelings named, most often first, no counts. */
  const legend = (ar, top) =>
    `<div style="position: absolute; left: 32px; right: 32px; top: ${top}px; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 16px">${ORDERED.map((m) => `<span style="display: flex; align-items: center; gap: 8px; font-size: ${ar ? 13 : 12.5}px; color: ${M.mist}"><span style="width: 8px; height: 8px; border-radius: 999px; background: ${MOOD[m].color}; box-shadow: 0 0 6px ${MOOD[m].glow}"></span>${NAME[ar ? 'ar' : 'en'][m]}</span>`).join('')}</div>`;
  const faintStars = (n, seed, top = 90, h = 700) => K.starfield(n, 390, h, seed).replace(/top: (\d+)px/g, (_, y) => `top: ${+y + top}px`);

  // H0 · Today: the orbs (app/recap.tsx ORB_SLOTS, sized by sqrt(count / max)).
  const ORB_SLOTS = [{ x: 150, y: 70, s: 96 }, { x: 40, y: 40, s: 74 }, { x: 60, y: 140, s: 62 }, { x: 210, y: 180, s: 50 }, { x: 140, y: 190, s: 42 }, { x: 240, y: 30, s: 34 }, { x: 20, y: 215, s: 30 }, { x: 255, y: 110, s: 26 }];
  const h0 = (ar) => {
    const L = 45, T0 = 284;
    const orbs = ORDERED.map((m, k) => {
      const s = ORB_SLOTS[k], o = MOOD[m];
      const size = Math.max(34, Math.round(96 * Math.sqrt(COUNT[m] / MAX)));
      const x = ar ? 300 - (s.x + s.s / 2) : s.x + s.s / 2; // decorative, fine to mirror
      return at(L + x, T0 + s.y + s.s / 2, size, '', `border-radius: 999px; background: radial-gradient(circle at 34% 30%, ${o.hi} 0%, ${o.color} 55%, ${o.lo} 100%); box-shadow: 0 0 26px ${o.glow}`);
    }).join('');
    return recap(ar, { art: orbs, eyebrowTop: 248, lineTop: 560 });
  };

  // H1 · Constellations: a star per check-in, a constellation per feeling, the brightest sized by how often.
  const CLUSTER = { calm: [118, 290], anxious: [290, 232], hopeful: [288, 408], neutral: [92, 452], sad: [196, 520], joyful: [320, 540], angry: [196, 196] };
  const h1 = (ar) => {
    const r = rnd(41);
    let svg = '', labels = '';
    for (const m of ORDERED) {
      const n = COUNT[m], o = MOOD[m];
      const [cx0, cy] = CLUSTER[m];
      const cx = ar ? 390 - cx0 : cx0;
      const R = 14 + 13 * Math.sqrt(n);
      const pts = Array.from({ length: n }, (_, i) => {
        const a = i * 2.39996 + r() * 0.8, d = R * Math.sqrt((i + 0.6) / n);
        return [cx + d * Math.cos(a), cy + d * Math.sin(a) * 0.8];
      }).sort((p, q) => p[0] - q[0]);
      if (n > 1) svg += `<polyline points="${pts.map((p) => p.map(f2).join(',')).join(' ')}" fill="none" stroke="${o.color}" stroke-opacity="0.45" stroke-width="1"></polyline>`;
      const lead = 2.6 + 3.4 * Math.sqrt(n / MAX);
      svg += pts.map((p, i) => {
        const rr = i === Math.floor(n / 2) ? lead : 1.8 + r() * 0.8;
        return `<circle cx="${f2(p[0])}" cy="${f2(p[1])}" r="${f2(rr)}" fill="${i === Math.floor(n / 2) ? o.hi : o.color}" style="filter: drop-shadow(0 0 ${f2(rr * 1.6)}px ${o.color}); animation: twinkle ${(3 + r() * 3).toFixed(1)}s ease-in-out ${(-r() * 5).toFixed(1)}s infinite"></circle>`;
      }).join('');
      const ly = Math.max(...pts.map((p) => p[1])) + 20;
      labels += `<span style="position: absolute; left: ${f2(cx - 60)}px; width: 120px; top: ${f2(ly)}px; text-align: center; font-size: ${ar ? 12.5 : 12}px; color: ${o.hi}; opacity: 0.85">${NAME[ar ? 'ar' : 'en'][m]}</span>`;
    }
    const art = `${faintStars(34, 17)}<svg width="390" height="844" aria-hidden="true" style="position: absolute; inset: 0; overflow: visible">${svg}</svg>${labels}`;
    return recap(ar, { art, eyebrowTop: 128, lineTop: 624, bg: 'linear-gradient(180deg, #0B1026 0%, #10173A 100%)', glows: false });
  };

  // H2 · The landscape: a hill for each feeling, the most often furthest back and tallest, lit by a small moon.
  const PEAK_X = [150, 292, 84, 238, 334, 122, 216];
  const h2 = (ar) => {
    const defs = [], layers = [];
    ORDERED.forEach((m, i) => {
      const o = MOOD[m], id = uid('hill');
      const g = 420 + i * 24, h = 44 + 150 * Math.sqrt(COUNT[m] / MAX), sig = 56 + 44 * Math.sqrt(COUNT[m] / MAX);
      const px = ar ? 390 - PEAK_X[i] : PEAK_X[i];
      const ys = [];
      const x0 = -16, x1 = 406, foot = g + 56;
      for (let x = x0; x <= x1; x += 6) ys.push([x, Math.min(foot, g - h * Math.exp(-((x - px) ** 2) / (2 * sig * sig)) + 24 * (((x - px) / (2.4 * sig)) ** 2))]);
      const top = ys.map(([x, y], k) => `${k ? 'L' : 'M'}${x} ${f2(y)}`).join(' ');
      defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.color}" stop-opacity="0.88"></stop><stop offset="0.55" stop-color="${o.lo}" stop-opacity="0.7"></stop><stop offset="1" stop-color="${o.lo}" stop-opacity="0"></stop></linearGradient>`);
      layers.push(`<path d="${top} L${x1} ${foot} L${x0} ${foot} Z" fill="url(#${id})"></path><path d="${ys.filter(([, y]) => y < foot - 14).map(([x, y], k) => `${k ? 'L' : 'M'}${x} ${f2(y)}`).join(' ')}" fill="none" stroke="${o.hi}" stroke-opacity="0.55" stroke-width="1.2"></path>`);
    });
    const moonX = ar ? 84 : 306;
    const art = `${faintStars(26, 29, 90, 300)}
<span aria-hidden="true" style="position: absolute; left: ${moonX - 60}px; top: 176px; width: 120px; height: 120px; border-radius: 999px; background: radial-gradient(closest-side, rgba(228,226,244,0.28), rgba(228,226,244,0)); animation: glowPulse 5s ease-in-out infinite"></span>
${at(moonX, 236, 24, K.moon(0.42, 12, { lit: '#E4E2F4', dark: 'rgba(228,226,244,0.14)' }))}
<svg width="390" height="844" aria-hidden="true" style="position: absolute; inset: 0"><defs>${defs.join('')}<linearGradient id="hfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${GROUND}" stop-opacity="0"></stop><stop offset="1" stop-color="${GROUND}" stop-opacity="1"></stop></linearGradient></defs>${layers.join('')}<rect x="0" y="560" width="390" height="84" fill="url(#hfade)"></rect></svg>
<span aria-hidden="true" style="position: absolute; left: -60px; width: 300px; top: 404px; height: 40px; border-radius: 50%; background: radial-gradient(closest-side, rgba(242,236,221,0.1), rgba(242,236,221,0)); animation: drift 24s ease-in-out infinite"></span>`;
    return recap(ar, { art, eyebrowTop: 128, lineTop: 640, legendTop: 724, glows: false });
  };

  // H3 · A nebula: a cloud of light for each feeling, sized by how often, blending where they meet.
  const h3 = (ar) => {
    const clouds = ORDERED.map((m, k) => {
      const o = MOOD[m], a = k * 2.4 + 0.6, d = k ? 70 + 26 * Math.sqrt(k) : 0;
      const cx = 195 + (ar ? -1 : 1) * d * Math.cos(a), cy = 372 + d * Math.sin(a) * 0.9;
      const R = 90 + 130 * Math.sqrt(COUNT[m] / MAX);
      return at(f2(cx), f2(cy), f2(R), '', `border-radius: 999px; background: radial-gradient(closest-side, rgba(${rgb(o.hi)},0.5), rgba(${rgb(o.color)},0.55) 22%, rgba(${rgb(o.color)},0.16) 56%, rgba(${rgb(o.color)},0) 100%); mix-blend-mode: screen; animation: ${k % 2 ? 'drift2' : 'drift'} ${18 + k * 3}s ease-in-out ${-k * 2}s infinite`);
    }).join('');
    const art = `${faintStars(46, 53)}<div aria-hidden="true" style="position: absolute; inset: 0; isolation: isolate">${clouds}</div>`;
    return recap(ar, { art, eyebrowTop: 144, lineTop: 600, legendTop: 684, bg: '#0B1026', glows: false });
  };

  // H4 · The month of moons, in feeling: each night round a ring in its real phase, lit in the day's feeling.
  const h4 = (ar) => {
    const cx = 195, cy = 380, R = 124;
    const defs = [];
    const moons = DAYS.map((ms, i) => {
      const f = K.phaseOf(new Date(2026, 8, i + 1, 21));
      const a = ((ar ? -1 : 1) * i * 12 - 90) * (Math.PI / 180);
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      let lit = 'rgba(242,236,221,0.2)', dark = 'rgba(242,236,221,0.06)', glow = '';
      if (ms.length === 1) { lit = MOOD[ms[0]].color; dark = `rgba(${rgb(MOOD[ms[0]].color)},0.16)`; glow = MOOD[ms[0]].glow; }
      if (ms.length === 2) {
        const id = uid('two');
        defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0.35" stop-color="${MOOD[ms[0]].color}"></stop><stop offset="0.65" stop-color="${MOOD[ms[1]].color}"></stop></linearGradient>`);
        lit = `url(#${id})`; dark = `rgba(${rgb(MOOD[ms[0]].color)},0.16)`; glow = MOOD[ms[0]].glow;
      }
      return at(f2(x), f2(y), 20, K.moon(f, 10, { lit, dark, glow }));
    }).join('');
    const conic = `conic-gradient(from 0deg, ${ORDERED.map((m, k) => `${MOOD[m].color} ${Math.round((k / ORDERED.length) * 360)}deg`).join(', ')}, ${MOOD[ORDERED[0]].color} 360deg)`;
    const one = at(cx, cy - R - 24, 24, `<span style="display: block; text-align: center; font-size: 11px; line-height: 24px; color: ${M.haze}">${ar ? '١' : '1'}</span>`);
    const art = `${faintStars(24, 61)}<svg width="0" height="0" aria-hidden="true" style="position: absolute"><defs>${defs.join('')}</defs></svg>
${at(cx, cy, 150, '', `border-radius: 999px; background: ${conic}; filter: blur(26px); opacity: 0.4; animation: spin 90s linear infinite`)}
${at(cx, cy, 52, K.pressedMark(52, '#9AA2CF'))}
${one}${moons}`;
    return recap(ar, { art, eyebrowTop: 144, lineTop: 560, legendTop: 648, glows: false, bg: '#0B1026' });
  };

  // H5 · Woven: the month as a panel of eight-point tiles, one a day, glazed in its feeling.
  const h5 = (ar) => {
    const cell = 56, cols = 6, x0 = (390 - cols * cell) / 2, y0 = 208, r = 24;
    const defs = Object.keys(MOOD).map((m) => `<radialGradient id="glaze${m}${ar ? 'a' : ''}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${MOOD[m].hi}"></stop><stop offset="0.55" stop-color="${MOOD[m].color}"></stop><stop offset="1" stop-color="${MOOD[m].lo}"></stop></radialGradient>`).join('');
    const g = (m) => `url(#glaze${m}${ar ? 'a' : ''})`;
    let tiles = '', grout = '';
    DAYS.forEach((ms, i) => {
      const col = i % cols, rw = Math.floor(i / cols);
      const cx = x0 + cell / 2 + (ar ? cols - 1 - col : col) * cell, cy = y0 + cell / 2 + rw * cell;
      const pts = K.star8(cx, cy, r);
      if (!ms.length) tiles += `<polygon points="${pts}" fill="rgba(242,236,221,0.03)" stroke="rgba(242,236,221,0.2)" stroke-width="1" stroke-linejoin="round"></polygon>`;
      else {
        tiles += `<polygon points="${pts}" fill="${g(ms[0])}" stroke="#0B1026" stroke-opacity="0.7" stroke-width="1.4" stroke-linejoin="round"></polygon>`;
        if (ms[1]) tiles += `<polygon points="${K.star8(cx, cy, r * 0.52, 22.5)}" fill="${g(ms[1])}" stroke="#0B1026" stroke-opacity="0.6" stroke-width="1.2" stroke-linejoin="round"></polygon>`;
      }
      // The small crosses between tiles, as a lattice (to the neighbour on the screen's right).
      if ((ar ? cols - 1 - col : col) < cols - 1) grout += `<path d="M${cx + r * 0.92} ${cy} H${cx + cell - r * 0.92}" stroke="rgba(242,236,221,0.16)" stroke-width="1"></path>`;
      if (rw < 4) grout += `<path d="M${cx} ${cy + r * 0.92} V${cy + cell - r * 0.92}" stroke="rgba(242,236,221,0.16)" stroke-width="1"></path>`;
    });
    const sweep = `<span aria-hidden="true" style="position: absolute; left: ${x0}px; top: ${y0}px; width: ${cols * cell}px; height: ${5 * cell}px; overflow: hidden; mix-blend-mode: screen"><span style="position: absolute; top: -40px; bottom: -40px; width: 64px; left: -120px; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.1), rgba(255,255,255,0)); transform: skewX(-18deg); animation: sheen 9s ease-in-out infinite"></span></span>`;
    const art = `${faintStars(18, 83, 90, 100)}<svg width="390" height="844" aria-hidden="true" style="position: absolute; inset: 0"><defs>${defs}</defs>${grout}${tiles}</svg>${sweep}`;
    return recap(ar, { art, eyebrowTop: 160, lineTop: 528, legendTop: 612 });
  };

  // H6 · The month's light: an aurora along the horizon, a curtain of light for each day's feeling.
  const h6 = (ar) => {
    const r = rnd(97);
    const horizon = 468, x0 = 30, w = 330;
    const curtains = DAYS.map((ms, i) => {
      const x = x0 + (i / 29) * w;
      const xx = ar ? 390 - x : x;
      if (!ms.length) return '';
      return ms.map((m, k) => {
        const o = MOOD[m], h = 150 + r() * 90 + (ms.length === 2 ? 20 : 0);
        return `<span aria-hidden="true" style="position: absolute; left: ${f2(xx - 9 + k * 7 * (ar ? -1 : 1))}px; top: ${f2(horizon - h)}px; width: 18px; height: ${f2(h)}px; border-radius: 9px; background: linear-gradient(0deg, rgba(${rgb(o.color)},0) 0%, rgba(${rgb(o.color)},0.9) 8%, rgba(${rgb(o.color)},0.4) 44%, rgba(${rgb(o.color)},0) 100%); filter: blur(3px); mix-blend-mode: screen; transform-origin: 50% 100%; animation: curtain ${(5 + r() * 3).toFixed(1)}s ease-in-out ${(-i * 0.35).toFixed(2)}s infinite"></span>`;
      }).join('');
    }).join('');
    const ridge = `<svg width="390" height="844" aria-hidden="true" style="position: absolute; inset: 0"><path d="M0 ${horizon + 6} Q 70 ${horizon - 8} 140 ${horizon + 2} T 280 ${horizon} T 390 ${horizon - 4} V 844 H 0 Z" fill="#0B1026"></path><path d="M0 ${horizon + 6} Q 70 ${horizon - 8} 140 ${horizon + 2} T 280 ${horizon} T 390 ${horizon - 4}" fill="none" stroke="rgba(242,236,221,0.18)" stroke-width="1"></path></svg>`;
    const tick = (d, x) => `<span style="position: absolute; left: ${f2((ar ? 390 - x : x) - 24)}px; width: 48px; top: ${horizon + 16}px; text-align: center; font-family: ${ar ? K.F.arBody : K.F.mono}; font-size: ${ar ? 12 : 10.5}px; color: ${M.haze}">${ar ? K.ar(d) : d}</span>`;
    const art = `${faintStars(40, 111, 90, 360)}<div style="position: absolute; inset: 0; isolation: isolate">${curtains}</div>${ridge}${tick(1, x0)}${tick(15, x0 + (14 / 29) * w)}${tick(30, x0 + w)}`;
    return recap(ar, { art, eyebrowTop: 144, lineTop: 560, legendTop: 648, bg: 'linear-gradient(180deg, #0B1026 0%, #121A3E 100%)', glows: false });
  };

  const H_CSS = `@keyframes curtain { 0%,100% { transform: scaleY(0.9); opacity: 0.75 } 50% { transform: scaleY(1.06); opacity: 1 } }
@keyframes sheen { 0% { left: -120px } 60%,100% { left: 400px } }`;
  const HV = [
    { id: 'H0', fn: h0, name: 'Today', note: 'The month’s feelings as glossy orbs on the moods slide’s ground, sized by how often (app/recap.tsx, ORB_SLOTS). Kept to compare: lovely colour, but the balls read as objects, not a landscape, and nothing says which feeling is which.' },
    { id: 'H1', fn: h1, name: 'Constellations', note: 'A star for each check-in, a constellation for each feeling, its brightest star sized by how often; each named softly beside it. Echoes Your sky on Profile. react-native-svg Circles and a Polyline per feeling from seeded points; the stars twinkle on the shared clock (opacity only).' },
    { id: 'H2', fn: h2, name: 'The landscape', note: 'Taken literally: a hill for each feeling, the most often furthest back and tallest, lit on the ridge by a small moon, a mist drifting between them; the feelings named beneath. react-native-svg Paths (a smooth bump per hill) with LinearGradient fills through stopProps; the mist is one blurred View drifting on a 24 s loop.' },
    { id: 'H3', fn: h3, name: 'A nebula', note: 'A cloud of light for each feeling, sized by how often, drifting and blending where they meet: no edges, nothing to rank. react-native-svg RadialGradient circles, translated slowly (Animated, native driver); RN has no screen blend, so the overlaps are kept translucent to read the same.' },
    { id: 'H4', fn: h4, name: 'The month of moons, in feeling', note: 'Month.tsx’s ring: every night of September in its real phase from the 1st, lit in that day’s feeling (two feelings share a moon), quiet days a pale moon; the month’s colours blur behind the pressed mark. MonthRing’s layout with K.moon-style lit paths; the colour pool turns once in 90 s.' },
    { id: 'H5', fn: h5, name: 'Woven', note: 'The month as a panel of zellige: an eight-point tile a day, glazed in its feeling (a second feeling set inside it), quiet days left as unglazed outlines; a slow sheen crosses it. star8Points (lib/khatam.ts) as Polygons with RadialGradient glazes; the sheen is one skewed LinearGradient translating.' },
    { id: 'H6', fn: h6, name: 'The month’s light', note: 'An aurora along the horizon: a soft curtain of light for each day, in its feeling, left to right from the 1st to the 30th; quiet days leave the sky between. Views with vertical LinearGradients (expo-linear-gradient), each swaying in scaleY on a staggered loop.' },
  ];
  row('H-moods.dc.html', {
    title: 'H · Your emotional landscape (Recap’s moods)',
    css: H_CSS,
    capH: 190,
    phones: HV.map((v) => ({ T: K.T.night, bg: GROUND, caption: `${v.id} · ${v.name} · ${v.note}`, html: v.fn(false) })),
  });
  const HA = ['H2', 'H4', 'H5', 'H6'];
  row('H-moods-ar.dc.html', {
    title: 'H · Your emotional landscape, in Arabic',
    css: H_CSS,
    capH: 130,
    phones: HV.filter((v) => HA.includes(v.id)).map((v) => ({
      T: K.T.night,
      ar: true,
      bg: GROUND,
      caption: `${v.id} · ${v.name}, in Arabic · ${{ H2: 'The feelings named in the app’s own words (moodLabelsFull). The hills and moon mirror; decorative, so that’s fine.', H4: 'The ring runs counter-clockwise from the 1st, as MonthRing does in Arabic.', H5: 'The tiles read from the right, row by row.', H6: 'The days run right to left, the 1st at the right; Arabic-Indic numerals.' }[v.id]}`,
      html: v.fn(true),
    })),
  });

  /* ══════════ I · Badges and Profile's icons ══════════ */
  const ORDER = ['first_session', 'streak_3', 'streak_7', 'all_breathing', 'streak_14', 'streak_30', 'streak_100', 'all_scenes', 'all_skies'];
  const BNAME = { first_session: 'First breath', streak_3: 'First light', streak_7: 'Sunrise', streak_14: 'The sun', streak_30: 'Half moon', streak_100: 'Full moon', all_breathing: 'Every breath', all_scenes: 'Every scene', all_skies: 'Every sky' };
  const TONE = { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EA90A8', tide: '#8CC8F2' };
  const TONES5 = ['glow', 'dusk', 'dawn', 'bloom', 'tide'];
  const SCENE = { fire: '#F0A868', rain: '#7FA2EC', forest: '#63CFC7', ocean: '#8F9BF0' };
  const PEARL = [['#FFFFFF', 0], ['#EDEEF3', 0.4], ['#D6DAE6', 0.75], ['#B7BFD4', 1]];
  const SUN = [['#FFF9F1', 0], ['#FFE9D3', 0.52], ['#FBC8A3', 0.82], ['#F9A980', 1]];
  const TEAL = [['#D9FAF6', 0], ['#6FD6CF', 0.55], ['#2E8F8A', 1]];
  const THEME = { night: { ...K.T.night, dark: true }, sunrise: { ...K.T.sunrise, dark: false }, dusk: { ...K.T.dusk, dark: false } };
  THEME.night.tide = '#8CC8F2'; THEME.sunrise.tide = '#C98A12'; THEME.dusk.tide = '#2E6DA8';

  const radial = (id, stops, cx = '50%', cy = '45%', r = '50%') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([c, o, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}></stop>`).join('')}</radialGradient>`;
  const linear = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([c, o, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}></stop>`).join('')}</linearGradient>`;
  const svg100 = (S, defs, inner, style = '') => `<svg width="${S}" height="${S}" viewBox="0 0 100 100" aria-hidden="true" style="position: absolute; inset: 0; overflow: visible; ${style}"><defs>${defs}</defs>${inner}</svg>`;
  const box = (S, inner, label, style = '') => `<span role="img" aria-label="${label}" style="position: relative; display: block; flex-shrink: 0; width: ${S}px; height: ${S}px; ${style}">${inner}</span>`;
  const centred = (S, size, inner, style = '') => `<span style="position: absolute; left: ${f2((S - size) / 2)}px; top: ${f2((S - size) / 2)}px; width: ${size}px; height: ${size}px; ${style}">${inner}</span>`;
  /** A moon's lit part (phase f, 0 new → 0.5 full, waxing lit on the right), and its unlit part. */
  function phasePaths(f, cx, cy, r) {
    const k = (1 - Math.cos(2 * Math.PI * f)) / 2, waxing = f < 0.5, rx = f2(Math.abs(1 - 2 * k) * r);
    const s1 = waxing ? 1 : 0, s2 = k > 0.5 ? (waxing ? 1 : 0) : waxing ? 0 : 1;
    const top = `${cx} ${cy - r}`, bot = `${cx} ${cy + r}`;
    return { k, lit: `M${top} A${r} ${r} 0 0 ${s1} ${bot} A${rx} ${r} 0 0 ${s2} ${top} Z`, dark: `M${top} A${r} ${r} 0 0 ${1 - s1} ${bot} A${rx} ${r} 0 0 ${s2} ${top} Z` };
  }
  const fourStar = (cx, cy, r, w = 0.22) => `M${cx} ${cy - r} Q${cx + r * w} ${cy - r * w} ${cx + r} ${cy} Q${cx + r * w} ${cy + r * w} ${cx} ${cy + r} Q${cx - r * w} ${cy + r * w} ${cx - r} ${cy} Q${cx - r * w} ${cy - r * w} ${cx} ${cy - r} Z`;

  /* ── I0 · Today: the gems (make-account-phase.js' gem over make-profile.js' art, copied so nothing else is written) ── */
  const abs = (l, t, w, h, extra = '') => `position: absolute; left: ${l}px; top: ${t}px; width: ${w}px; height: ${h}px; ${extra}`;
  const circle = (cx, cy, d, extra) => `<span style="${abs(cx - d / 2, cy - d / 2, d, d, `border-radius: 999px; ${extra}`)}"></span>`;
  const markAt = (cx, cy, size, surface) => `<span style="${abs(cx - size / 2, cy - size / 2, size, size)}">${K.pressedMark(size, surface)}</span>`;
  function gemArt(code, S) {
    const r = rnd(7);
    const stars = (n, bottom = 0.7) => Array.from({ length: n }, () => circle(r() * S, r() * S * bottom, 1 + r() * 1.4, `background: rgba(242,236,221,${(0.4 + r() * 0.5).toFixed(2)})`)).join('');
    const c = S / 2, sun = K.DISCS.sunrise, dusk = K.DISCS.dusk, moon = K.DISCS.teal;
    switch (code) {
      case 'streak_3': return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(180deg, #1B2350 0%, #3A3470 52%, #D98C7A 84%, #F7C79A 100%)')}"></span>${stars(5, 0.45)}${circle(c, S * 0.8, S * 0.5, 'background: radial-gradient(circle, rgba(255,236,200,0.95) 0%, rgba(255,210,160,0.5) 30%, rgba(255,200,150,0) 70%)')}<span style="${abs(0, S * 0.8, S, 1, 'background: rgba(255,236,210,0.8)')}"></span><span style="${abs(0, S * 0.8 + 1, S, S * 0.2, 'background: rgba(40,34,80,0.55)')}"></span>`;
      case 'streak_7': return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(180deg, #7A76C0 0%, #E9A9A6 55%, #FFD9A8 100%)')}"></span><span style="${abs(0, 0, S, S * 0.66, 'overflow: hidden')}">${circle(c, S * 0.66, S * 0.5, `background: ${sun.stops}; box-shadow: 0 0 10px rgba(${sun.glow},0.7)`)}</span><span style="${abs(0, S * 0.66, S, S * 0.34, 'background: linear-gradient(180deg, #8A6A9E 0%, #5A4A86 100%)')}"></span><span style="${abs(0, S * 0.66, S, 1, 'background: rgba(255,240,220,0.9)')}"></span>`;
      case 'streak_14': return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(180deg, #A9D8EE 0%, #DDEFF2 60%, #FBEBD6 100%)')}"></span>${circle(c, c, S * 0.92, 'background: repeating-conic-gradient(from 0deg, rgba(255,214,160,0.6) 0deg 4deg, rgba(255,214,160,0) 4deg 20deg); -webkit-mask-image: radial-gradient(circle, #000 36%, transparent 64%); mask-image: radial-gradient(circle, #000 36%, transparent 64%)')}${circle(c, c, S * 0.56, `background: ${sun.stops}; box-shadow: 0 0 12px rgba(${sun.glow},0.8)`)}${markAt(c, c, S * 0.3, sun.surface)}`;
      case 'streak_30': return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(180deg, #0B1026 0%, #1A2150 100%)')}"></span>${stars(7)}${circle(c, c, S * 0.56, `background: ${moon.stops}; box-shadow: 0 0 12px rgba(${moon.glow},0.55)`)}${markAt(c, c, S * 0.3, moon.surface)}${circle(c, c, S * 0.56, 'background: linear-gradient(90deg, rgba(11,16,38,0.74) 50%, rgba(11,16,38,0) 50%)')}`;
      case 'streak_100': return `<span style="${abs(0, 0, S, S, 'background: radial-gradient(circle at 50% 50%, #1D2560 0%, #0B1026 75%)')}"></span>${stars(14, 1)}${circle(c, c, S * 0.84, 'border: 1px solid rgba(214,232,236,0.28); box-sizing: border-box')}${circle(c, c, S * 0.56, `background: ${moon.stops}; box-shadow: 0 0 16px rgba(${moon.glow},0.7)`)}${markAt(c, c, S * 0.3, moon.surface)}`;
      case 'first_session': return `<span style="${abs(0, 0, S, S, 'background: radial-gradient(circle, rgba(111,214,207,0.28) 0%, rgba(111,214,207,0.06) 70%), #10183A')}"></span>${circle(c, c, S * 0.58, 'background: radial-gradient(circle at 34% 30%, rgba(255,255,255,0.8) 0%, rgba(185,236,232,0.55) 40%, rgba(111,214,207,0.5) 100%); box-shadow: 0 0 14px rgba(111,214,207,0.5)')}${markAt(c, c, S * 0.3, TONE.glow)}`;
      case 'all_breathing': return `<span style="${abs(0, 0, S, S, 'background: #10183A')}"></span>${[['glow', 0, -1], ['dusk', 1, 0], ['dawn', 0, 1], ['bloom', -1, 0]].map(([k, dx, dy]) => circle(c + dx * S * 0.24, c + dy * S * 0.24, S * 0.26, `background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${TONE[k]} 60%); box-shadow: 0 0 8px ${TONE[k]}`)).join('')}${markAt(c, c, S * 0.22, '#9FA6CC')}`;
      case 'all_scenes': return `<span style="${abs(0, 0, S, S, 'background: #10183A')}"></span>${circle(c, c, S * 0.62, `background: conic-gradient(${SCENE.fire} 0 25%, ${SCENE.rain} 0 50%, ${SCENE.forest} 0 75%, ${SCENE.ocean} 0)`)}${circle(c, c, S * 0.62, 'background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%)')}${markAt(c, c, S * 0.3, '#8C8FC0')}`;
      case 'all_skies': return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(90deg, #BFE0EE 0%, #E9A9A6 50%, #1A2150 100%)')}"></span>${circle(S * 0.22, S * 0.6, S * 0.26, `background: ${sun.stops}`)}${circle(S * 0.5, S * 0.4, S * 0.26, `background: ${dusk.stops}`)}${circle(S * 0.78, S * 0.6, S * 0.26, `background: ${moon.stops}`)}`;
    }
    return '';
  }
  const GEM_GLOW = { streak_3: '249,169,128', streak_7: '249,169,128', streak_14: '249,169,128', streak_30: '111,214,207', streak_100: '111,214,207', first_session: '111,214,207', all_breathing: '179,167,245', all_scenes: '143,155,240', all_skies: '234,144,168' };
  const I0 = {
    id: 'I0', name: 'Today: nine skies set in gems', light: 'sunrise',
    note: 'The badges as they are (components/badges/BadgeGem.tsx): each a small sky (the day’s journey for the streaks, what each celebrates for exploring) inside a sphere of glass lit in its own colour; not yet, the same gem greyed. Profile’s numbers: a moon glyph, a teal orb, a violet eight-point star, three unrelated objects. Kept to compare.',
    badge: (code, S, T, locked) => box(S, `${locked ? '' : `<span style="position: absolute; left: ${-S * 0.35}px; top: ${-S * 0.35}px; width: ${S * 1.7}px; height: ${S * 1.7}px; border-radius: 999px; background: radial-gradient(closest-side, rgba(${GEM_GLOW[code]},${T.dark ? 0.42 : 0.34}), rgba(${GEM_GLOW[code]},0))"></span>`}<span style="position: absolute; inset: 0; border-radius: 999px; overflow: hidden; ${locked ? `filter: grayscale(1); opacity: ${T.dark ? 0.3 : 0.38}` : ''}">${gemArt(code, S)}</span><span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 34% 26%, rgba(255,255,255,${locked ? 0.16 : 0.34}) 0%, rgba(255,255,255,0.08) 26%, rgba(255,255,255,0) 46%); box-shadow: inset ${f2(-S * 0.06)}px ${f2(-S * 0.09)}px ${f2(S * 0.16)}px rgba(0,0,0,${locked ? 0.18 : 0.38}), inset 0 0 0 1px rgba(255,255,255,${locked ? (T.dark ? 0.14 : 0.5) : 0.42})${locked && !T.dark ? `, 0 0 0 1px ${T.line}` : ''}"></span>`, BNAME[code]),
    stat: {
      streak: (T, s) => centred(s, (s * 26) / 28, K.moon(0.3, (s * 13) / 28, { lit: T.tone.dawn, dark: `rgba(${rgb(T.tone.dawn)},0.14)`, glow: T.dark ? 'rgba(242,184,128,0.7)' : '' })),
      month: (T, s) => centred(s, (s * 26) / 28, '',`border-radius: 999px; background: radial-gradient(circle at 34% 30%, rgba(255,255,255,0.95) 0%, rgba(${rgb(T.hue.glow)},0.55) 45%, rgba(${rgb(T.hue.glow)},0.8) 100%); box-shadow: 0 0 10px rgba(${rgb(T.hue.glow)},0.55)`),
      badges: (T, s) => `<svg width="${s}" height="${s}" viewBox="0 0 28 28" aria-hidden="true" style="position: absolute; inset: 0; overflow: visible; ${T.dark ? 'filter: drop-shadow(0 0 5px rgba(179,167,245,0.7))' : ''}"><polygon points="${K.star8(14, 14, 13)}" fill="${T.tone.dusk}"></polygon></svg>`,
    },
  };

  /* ── I1 · Pearl moons: the starfield's glass moon, waxing ── */
  const WAX = { streak_3: 0.1, streak_7: 0.15, streak_14: 0.2, streak_30: 0.25, streak_100: 0.5 };
  function pearlMoon(S, T, f, { r = 32, cx = 50, cy = 50, ring = false, markSize = 0.3, earthshine = false } = {}) {
    const id = uid('pm');
    const shade = T.dark ? 'rgba(11,16,38,0.74)' : 'rgba(25,102,98,0.45)';
    const p = phasePaths(f, cx, cy, r);
    const glowA = (T.dark ? 0.5 : 0.35) * Math.max(0.35, p.k);
    const rim = T.dark ? 'rgba(255,255,255,0.4)' : 'rgba(29,43,42,0.22)';
    return `${centred(S, S * (r / 50) * 1.02, '', `border-radius: 999px; box-shadow: 0 0 ${f2(S * 0.26)}px rgba(${T.dark ? '228,226,244' : '59,170,167'},${f2(glowA)})`)}
${svg100(S, radial(id, PEARL), `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"></circle>`)}
${S * markSize >= 8 ? centred(S, S * markSize, K.pressedMark(S * markSize, '#E4E2F4')) : ''}
${svg100(S, '', `${p.k < 0.999 ? `<path d="${p.k < 0.001 ? `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx} ${cy + r} A${r} ${r} 0 1 1 ${cx} ${cy - r} Z` : p.dark}" fill="${shade}"></path>` : ''}${earthshine ? `<path d="M${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r}" fill="none" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="1.4" style="filter: drop-shadow(0 0 2px #fff)"></path>` : ''}<circle cx="${cx}" cy="${cy}" r="${r - 0.4}" fill="none" stroke="${rim}" stroke-width="0.8"></circle>${ring ? `<circle cx="${cx}" cy="${cy}" r="${r + 12}" fill="none" stroke="${T.dark ? 'rgba(228,226,244,0.4)' : 'rgba(25,102,98,0.3)'}" stroke-width="0.8"></circle>` : ''}`)}`;
  }
  const I1 = {
    id: 'I1', name: 'Pearl moons: the month waxing', light: 'sunrise',
    names: { streak_7: 'Crescent', streak_14: 'Waxing' },
    note: 'Every badge is the starfield’s pearl glass moon (F4), so a badge and the sky it came from are one object. The streaks wax: First light is the hilal (3 days), then the crescent, the thick crescent, the half moon (30) and the full moon in its ring (100); Sunrise and The sun would be renamed Crescent and Waxing. Exploring: First breath is the new moon in earthshine with the mark lit in it; Every breath, five motes in the five tones circling a small moon; Every scene, its four colours as a halo; Every sky, the sun, the evening sun and the moon in a line. Not yet: a dashed outline, the phase faint. Profile: tonight’s moon, the month as a ring of days, a full moon in its ring. Build: MoonDisc’s own layers (pearl gradient, the lune, PressedMark) at badge size; no new art to maintain.',
    badge: (code, S, T, locked) => {
      let inner;
      if (WAX[code] != null) inner = pearlMoon(S, T, WAX[code], { r: code === 'streak_100' ? 34 : 40, ring: code === 'streak_100' });
      else if (code === 'first_session') inner = `${pearlMoon(S, T, 0, { earthshine: true, markSize: 0 })}${centred(S, S * 0.3, mark(S * 0.3, T.dark ? '#6FD6CF' : '#196662', { style: `filter: drop-shadow(0 0 ${f2(S * 0.05)}px ${T.dark ? '#6FD6CF' : 'rgba(59,170,167,0.6)'})` }))}`;
      else if (code === 'all_breathing') {
        const orbit = TONES5.map((k, i) => { const a = (i * 72 - 90) * (Math.PI / 180); return `<circle cx="${f2(50 + 40 * Math.cos(a))}" cy="${f2(50 + 40 * Math.sin(a))}" r="6" fill="${T.dark ? TONE[k] : T.tone[k] || T[k]}" style="filter: drop-shadow(0 0 3px ${TONE[k]})"></circle>`; }).join('');
        inner = `${pearlMoon(S, T, 0.5, { r: 24, markSize: 0.22 })}${svg100(S, '', `<circle cx="50" cy="50" r="40" fill="none" stroke="${T.dark ? 'rgba(242,236,221,0.2)' : T.line}" stroke-width="0.8"></circle><g style="transform-origin: 50px 50px; animation: spin 60s linear infinite">${orbit}</g>`)}`;
      } else if (code === 'all_scenes') {
        const arcs = Object.values(SCENE).map((c, i) => { const a0 = (i * 90 - 90 + 6) * (Math.PI / 180), a1 = (i * 90 - 6) * (Math.PI / 180); return `<path d="M${f2(50 + 42 * Math.cos(a0))} ${f2(50 + 42 * Math.sin(a0))} A42 42 0 0 1 ${f2(50 + 42 * Math.cos(a1))} ${f2(50 + 42 * Math.sin(a1))}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round" style="filter: drop-shadow(0 0 3px ${c})"></path>`; }).join('');
        inner = `${pearlMoon(S, T, 0.5, { r: 28 })}${svg100(S, '', arcs)}`;
      } else if (code === 'all_skies') {
        const sid = uid('sy'), did = uid('sy');
        inner = svg100(S, `${radial(sid, SUN)}${radial(did, PEARL)}`, `<line x1="6" y1="50" x2="94" y2="50" stroke="${T.dark ? 'rgba(242,236,221,0.28)' : T.line}" stroke-width="0.8"></line><circle cx="24" cy="50" r="16" fill="url(#${sid})" style="filter: drop-shadow(0 0 4px rgba(249,169,128,0.8))"></circle><circle cx="50" cy="50" r="15" fill="${T.dark ? '#1B1C42' : '#FFF6EC'}" stroke="#FFE0B8" stroke-width="3" style="filter: drop-shadow(0 0 4px rgba(255,201,142,0.9))"></circle><circle cx="76" cy="50" r="16" fill="url(#${did})" stroke="${T.dark ? 'rgba(255,255,255,0.4)' : 'rgba(29,43,42,0.22)'}" stroke-width="0.8" style="filter: drop-shadow(0 0 4px rgba(228,226,244,0.7))"></circle>`);
      }
      if (locked) inner = `<span style="position: absolute; inset: 0; filter: grayscale(1); opacity: ${T.dark ? 0.2 : 0.4}">${inner}</span>${svg100(S, '', `<circle cx="50" cy="50" r="41" fill="none" stroke="${T.ter}" stroke-opacity="0.9" stroke-width="1" stroke-dasharray="2 4" stroke-linecap="round"></circle>`)}`;
      return box(S, inner, BNAME[code]);
    },
    stat: {
      streak: (T, s) => pearlMoon(s, T, K.phaseOf(K.TODAY), { r: 44, markSize: 0.4 }),
      month: (T, s) => svg100(s, '', Array.from({ length: 30 }, (_, i) => { const a = (i * 12 - 90) * (Math.PI / 180), on = i < 27 && ![2, 5, 10, 15, 20, 25].includes(i); return `<circle cx="${f2(50 + 40 * Math.cos(a))}" cy="${f2(50 + 40 * Math.sin(a))}" r="${i === 26 ? 6 : 4.2}" fill="${on ? T.tone.glow : T.dark ? 'rgba(242,236,221,0.2)' : 'rgba(29,43,42,0.16)'}" ${i === 26 ? `stroke="${T.text}" stroke-width="1.5"` : ''}></circle>`; }).join('')),
      badges: (T, s) => pearlMoon(s, T, 0.5, { ring: true, r: 34, markSize: 0.34 }),
    },
  };

  /* ── I2 · Constellations: the stars are there before they're joined ── */
  const DIPPER = [[16, 40], [30, 37], [43, 43], [54, 52], [57, 69], [79, 73], [82, 55]];
  const RIVER = Array.from({ length: 14 }, (_, i) => [14 + i * 5.4, 70 - i * 3 + 7 * Math.sin(i * 0.9)]);
  const RING30 = Array.from({ length: 30 }, (_, i) => { const a = (i * 12 - 90) * (Math.PI / 180); return [50 + 33 * Math.cos(a), 50 + 33 * Math.sin(a)]; });
  const I2 = {
    id: 'I2', name: 'Constellations', light: 'dusk',
    note: 'Each badge a small constellation on a round plate, like an astrolabe’s: three stars for 3 days, the Plough’s seven (بنات نعش) for 7, a river of fourteen, the month’s thirty in a ring, and at 100 a whole galaxy, too many to join. Exploring: one star breathing for the first breath; five in the five tones; four in the scenes’ colours; the three bodies along the ecliptic for every sky. Not yet: the stars are already there, faint and unjoined, never “missing”; earning one draws its lines in. It is Your sky’s own language (a star per day, joined in order). Profile: three stars joined, a four-point star, a small plate. Build: a table of points per badge, react-native-svg Circles and one Polyline, the lines drawing in with strokeDashoffset at the unlock moment.',
    badge: (code, S, T, locked) => {
      const pid = uid('pl');
      const star = T.dark ? M.moonlight : T.text;
      const lineC = T.dark ? 'rgba(111,214,207,0.6)' : `rgba(${rgb(T.accent)},0.55)`;
      const plate = `<circle cx="50" cy="50" r="48" fill="${T.dark ? `url(#${pid})` : '#FFFFFF'}" stroke="${T.dark ? 'rgba(242,236,221,0.2)' : T.line}" stroke-width="1"></circle>${Array.from({ length: 24 }, (_, i) => { const a = (i * 15) * (Math.PI / 180), r0 = i % 6 ? 45 : 43; return `<line x1="${f2(50 + r0 * Math.cos(a))}" y1="${f2(50 + r0 * Math.sin(a))}" x2="${f2(50 + 47 * Math.cos(a))}" y2="${f2(50 + 47 * Math.sin(a))}" stroke="${T.dark ? 'rgba(242,236,221,0.28)' : 'rgba(27,33,64,0.2)'}" stroke-width="0.6"></line>`; }).join('')}`;
      const dot = (x, y, r = 2.4, c = star) => `<circle cx="${f2(x)}" cy="${f2(y)}" r="${locked ? Math.min(r, 1.8) : r}" fill="${locked ? (T.dark ? 'rgba(242,236,221,0.4)' : 'rgba(27,33,64,0.45)') : c}" ${locked || !T.dark ? '' : `style="filter: drop-shadow(0 0 ${f2(r * 1.2)}px ${c})"`}></circle>`;
      const join = (pts, close = false, c = lineC) => (locked ? '' : `<polyline points="${pts.map((p) => p.map(f2).join(',')).join(' ')}${close ? ` ${pts[0].map(f2).join(',')}` : ''}" fill="none" stroke="${c}" stroke-width="0.9" stroke-linejoin="round"></polyline>`);
      let art = '';
      switch (code) {
        case 'first_session': art = `${locked ? '' : `<circle cx="50" cy="50" r="18" fill="none" stroke="${lineC}" stroke-width="0.8" style="transform-origin: 50px 50px; animation: breath5 5s ease-in-out infinite"></circle>`}${locked ? dot(50, 50, 2.4) : `<path d="${fourStar(50, 50, 10)}" fill="${T.dark ? TONE.glow : T.tone.glow}" style="${T.dark ? 'filter: drop-shadow(0 0 4px #6FD6CF)' : ''}"></path>`}`; break;
        case 'streak_3': { const P = [[30, 64], [50, 32], [70, 60]]; art = join(P, true) + P.map((p) => dot(...p, 2.8)).join(''); break; }
        case 'streak_7': art = join([...DIPPER.slice(0, 7), DIPPER[3]]) + DIPPER.map((p, i) => dot(...p, i === 0 ? 2.8 : 2.2)).join(''); break;
        case 'streak_14': art = join(RIVER) + RIVER.map((p, i) => dot(...p, i % 4 ? 1.7 : 2.4)).join(''); break;
        case 'streak_30': art = join(RING30, true) + RING30.map((p, i) => dot(...p, i % 5 ? 1.4 : 2.1)).join(''); break;
        case 'streak_100': {
          const r = rnd(5);
          art = `${locked ? '' : `<circle cx="50" cy="50" r="14" fill="${T.dark ? 'rgba(111,214,207,0.25)' : `rgba(${rgb(T.accent)},0.12)`}" style="filter: blur(4px)"></circle>`}${Array.from({ length: 100 }, (_, i) => { const a = i * 2.39996, d = 3.9 * Math.sqrt(i + 1); return dot(50 + d * Math.cos(a), 50 + d * Math.sin(a) * 0.86, 0.6 + r() * 0.9, i % 3 ? star : T.dark ? TONE.glow : T.accent); }).join('')}`;
          break;
        }
        case 'all_breathing': { const P = TONES5.map((k, i) => { const a = (i * 72 - 90) * (Math.PI / 180); return [50 + 28 * Math.cos(a), 50 + 28 * Math.sin(a), k]; }); art = join(P.map((p) => [p[0], p[1]]), true) + P.map((p) => dot(p[0], p[1], 3.4, T.dark ? TONE[p[2]] : T.tone[p[2]] || T.tide)).join(''); break; }
        case 'all_scenes': { const P = [[50, 20], [80, 50], [50, 80], [20, 50]]; const C = Object.values(SCENE); art = join(P, true) + P.map((p, i) => dot(...p, 3.4, C[i])).join(''); break; }
        case 'all_skies': {
          const sid = uid('ss'), mid = uid('ss');
          art = `<defs>${radial(sid, SUN)}${radial(mid, PEARL)}</defs><path d="M12 68 Q50 12 88 68" fill="none" stroke="${locked ? (T.dark ? 'rgba(242,236,221,0.25)' : 'rgba(27,33,64,0.2)') : lineC}" stroke-width="0.9" stroke-dasharray="2 3"></path>${locked ? [dot(24, 50), dot(50, 40), dot(76, 50)].join('') : `<circle cx="24" cy="50.5" r="7" fill="url(#${sid})"></circle><circle cx="50" cy="40" r="6.5" fill="none" stroke="#FFE0B8" stroke-width="2.4" style="filter: drop-shadow(0 0 2px rgba(255,201,142,0.9))"></circle><circle cx="76" cy="50.5" r="7" fill="url(#${mid})" stroke="rgba(27,33,64,0.2)" stroke-width="0.5"></circle>`}`;
          break;
        }
      }
      return box(S, svg100(S, radial(pid, [['#1D2560', 0], ['#0B1026', 1]], '50%', '40%', '60%'), `${plate}${art}`, locked ? 'opacity: 0.85' : ''), BNAME[code]);
    },
    stat: {
      streak: (T, s) => svg100(s, '', `<polyline points="14,74 46,50 84,24" fill="none" stroke="${T.tone.dawn}" stroke-opacity="0.7" stroke-width="3"></polyline>${[[14, 74, 7], [46, 50, 8], [84, 24, 11]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i === 2 ? T.tone.dawn : T.dark ? M.moonlight : T.text}" ${i === 2 && T.dark ? 'style="filter: drop-shadow(0 0 4px #F2B880)"' : ''}></circle>`).join('')}`),
      month: (T, s) => svg100(s, '', `<path d="${fourStar(50, 50, 46, 0.18)}" fill="${T.tone.glow}" ${T.dark ? 'style="filter: drop-shadow(0 0 5px #6FD6CF)"' : ''}></path>`),
      badges: (T, s) => svg100(s, '', `<circle cx="50" cy="50" r="44" fill="none" stroke="${T.tone.dusk}" stroke-width="5"></circle><polyline points="30,64 50,30 72,60 30,64" fill="none" stroke="${T.tone.dusk}" stroke-width="4" stroke-linejoin="round"></polyline>${[[30, 64], [50, 30], [72, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${T.tone.dusk}"></circle>`).join('')}`, T.dark ? 'filter: drop-shadow(0 0 4px rgba(179,167,245,0.7))' : ''),
    },
  };

  /* ── I3 · Khatam medallions: the eight-point star, glazed ── */
  const GLAZE = {
    streak_3: [['#FFE9CF', 0], ['#F2B880', 0.6], ['#C9783E', 1]],
    streak_7: [['#FFF3E4', 0], ['#F9A980', 0.6], ['#E4826A', 1]],
    streak_14: [['#FFF6DA', 0], ['#F4C35A', 0.6], ['#C98A12', 1]],
    streak_30: TEAL,
    streak_100: PEARL,
    first_session: TEAL,
    all_breathing: [['#EEEAFF', 0], ['#B3A7F5', 0.6], ['#6A5CC4', 1]],
    all_scenes: TEAL,
    all_skies: TEAL,
  };
  const I3 = {
    id: 'I3', name: 'Khatam medallions', light: 'sunrise',
    note: 'Each badge a glazed eight-point tile, the khatam that already turns in Sunrise’s sun and Box breathing’s star. The streaks grow more intricate as they grow longer, warm glazes for the day (3, 7, 14), then the moon’s teal and pearl (30, a half-lit disc; 100, a rosette of eight stars round a full moon). Exploring: the first breath in the Houna teal with the mark; five small stars in the five tones; the star in four panes of the scenes’ colours, as stained glass; and a glaze running from morning to night. Not yet: an unglazed tile, its lines only. Profile: a star round a lit point, an octagon, a rosette. Build: star8Points (lib/khatam.ts) as Polygons with RadialGradient glazes and a white sheen, PressedMark in the middle.',
    badge: (code, S, T, locked) => {
      const id = uid('kh'), sh = uid('kh');
      const lead = T.dark ? 'rgba(242,236,221,0.7)' : T.accent;
      const dim = T.dark ? 'rgba(242,236,221,0.3)' : 'rgba(29,43,42,0.34)';
      const L = locked ? dim : lead, sw = 1.2;
      const fill = (u) => (locked ? 'none' : u);
      const sheen = (pts) => (locked ? '' : `<polygon points="${pts}" fill="url(#${sh})"></polygon>`);
      let defs = `${radial(id, GLAZE[code], '40%', '35%', '70%')}${radial(sh, [['#FFFFFF', 0, 0.55], ['#FFFFFF', 0.45, 0.08], ['#FFFFFF', 1, 0]], '34%', '26%', '60%')}`;
      const S8 = (r, rot = 0) => K.star8(50, 50, r, rot);
      let art = '', markS = 0.3;
      switch (code) {
        case 'streak_3': art = `<polygon points="${S8(46)}" fill="${fill(`url(#${id})`)}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(46))}`; break;
        case 'streak_7': art = `<polygon points="${S8(46)}" fill="${fill(`url(#${id})`)}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(46))}<polygon points="${S8(30, 22.5)}" fill="none" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>`; break;
        case 'streak_14': art = `<polygon points="${S8(46)}" fill="${fill(`url(#${id})`)}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(46))}<polygon points="${S8(32, 22.5)}" fill="${locked ? 'none' : 'rgba(255,255,255,0.28)'}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon><polygon points="${S8(20)}" fill="none" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>`; break;
        case 'streak_30': art = `<polygon points="${S8(46)}" fill="${fill(`url(#${id})`)}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon><polygon points="${S8(46, 22.5)}" fill="${fill(`url(#${id})`)}" fill-opacity="0.6" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(46))}<circle cx="50" cy="50" r="19" fill="${locked ? 'none' : '#E4E2F4'}" stroke="${L}" stroke-width="${sw}"></circle>${locked ? '' : '<path d="M50 31 A19 19 0 0 0 50 69 Z" fill="rgba(11,16,38,0.7)"></path>'}`; markS = 0.26; break;
        case 'streak_100': {
          const pid = uid('kh');
          defs += radial(pid, PEARL);
          art = `<circle cx="50" cy="50" r="42" fill="none" stroke="${L}" stroke-width="0.9"></circle>${Array.from({ length: 8 }, (_, i) => { const a = (i * 45 - 90) * (Math.PI / 180); return `<polygon points="${K.star8(f2(50 + 42 * Math.cos(a)), f2(50 + 42 * Math.sin(a)), 8)}" fill="${locked ? 'none' : '#F4C35A'}" stroke="${L}" stroke-width="0.9" stroke-linejoin="round"></polygon>`; }).join('')}<polygon points="${S8(34)}" fill="${fill(`url(#${id})`)}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(34))}<circle cx="50" cy="50" r="18" fill="${locked ? 'none' : `url(#${pid})`}" stroke="${L}" stroke-width="${sw}"></circle>`;
          markS = 0.26;
          break;
        }
        case 'first_session': art = `<polygon points="${S8(46)}" fill="${fill(`url(#${id})`)}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(46))}<circle cx="50" cy="50" r="20" fill="none" stroke="${L}" stroke-width="${sw}"></circle>`; markS = 0.34; break;
        case 'all_breathing': art = `<polygon points="${S8(46)}" fill="${fill(`url(#${id})`)}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(46))}${TONES5.map((k, i) => { const a = (i * 72 - 90) * (Math.PI / 180); return `<polygon points="${K.star8(f2(50 + 26 * Math.cos(a)), f2(50 + 26 * Math.sin(a)), 9)}" fill="${locked ? 'none' : TONE[k]}" stroke="${L}" stroke-width="0.8" stroke-linejoin="round"></polygon>`; }).join('')}`; markS = 0.22; break;
        case 'all_scenes': {
          const cps = Object.values(SCENE).map((c, i) => { const q = uid('kq'); defs += `<clipPath id="${q}"><rect x="${i === 1 || i === 2 ? 50 : 0}" y="${i >= 2 ? 50 : 0}" width="50" height="50"></rect></clipPath>`; return `<polygon points="${S8(46)}" fill="${locked ? 'none' : c}" clip-path="url(#${q})"></polygon>`; }).join('');
          art = `${cps}<polygon points="${S8(46)}" fill="none" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(46))}<path d="M50 4 V96 M4 50 H96" stroke="${L}" stroke-width="${sw}"></path><circle cx="50" cy="50" r="17" fill="${locked ? 'none' : '#F2ECDD'}" stroke="${L}" stroke-width="${sw}"></circle>`;
          markS = 0.24;
          break;
        }
        case 'all_skies': {
          const lg = uid('kl');
          defs += linear(lg, [['#F9A980', 0], ['#E98AA0', 0.45], ['#6A5CC4', 0.75], ['#1A2150', 1]], 1, 1);
          art = `<polygon points="${S8(46)}" fill="${fill(`url(#${lg})`)}" stroke="${L}" stroke-width="${sw}" stroke-linejoin="round"></polygon>${sheen(S8(46))}${locked ? '' : `<circle cx="30" cy="30" r="6" fill="#FFF3E4"></circle><circle cx="50" cy="50" r="5.5" fill="none" stroke="#FFE0B8" stroke-width="2"></circle><circle cx="70" cy="70" r="6" fill="#E4E2F4"></circle>`}`;
          markS = 0;
          break;
        }
      }
      const surf = { streak_3: '#F2B880', streak_7: '#F9A980', streak_14: '#F4C35A', streak_30: '#E4E2F4', streak_100: '#E4E2F4', first_session: '#6FD6CF', all_breathing: '#B3A7F5', all_scenes: '#F2ECDD' }[code];
      const markH = markS && S * markS >= 8 ? centred(S, S * markS, locked ? mark(S * markS, dim, { stroke: 0.35 }) :K.pressedMark(S * markS, surf)) : '';
      return box(S, `${locked ? '' : centred(S, S * 0.9, '', `border-radius: 999px; box-shadow: 0 0 ${f2(S * 0.22)}px rgba(${rgb(GLAZE[code][1][0])},${T.dark ? 0.4 : 0.3})`)}${svg100(S, defs, art)}${markH}`, BNAME[code]);
    },
    stat: {
      streak: (T, s) => svg100(s, '', `<polygon points="${K.star8(50, 50, 46)}" fill="none" stroke="${T.tone.dawn}" stroke-width="7" stroke-linejoin="round"></polygon><circle cx="50" cy="50" r="15" fill="${T.tone.dawn}"></circle>`, T.dark ? 'filter: drop-shadow(0 0 4px rgba(242,184,128,0.7))' : ''),
      month: (T, s) => svg100(s, '', `<polygon points="${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = (i * 45 + 22.5) * (Math.PI / 180); return `${f2(50 + 44 * Math.cos(a))},${f2(50 + 44 * Math.sin(a))}`; }).join(' ')}" fill="${T.tone.glow}"></polygon><polygon points="${K.star8(50, 50, 22)}" fill="${T.dark ? '#0B1026' : '#FFFFFF'}" fill-opacity="0.35"></polygon>`, T.dark ? 'filter: drop-shadow(0 0 4px rgba(111,214,207,0.7))' : ''),
      badges: (T, s) => svg100(s, '', `<polygon points="${K.star8(50, 50, 48)}" fill="${T.tone.dusk}"></polygon><polygon points="${K.star8(50, 50, 28, 22.5)}" fill="none" stroke="${T.dark ? '#0B1026' : '#FFFFFF'}" stroke-opacity="0.6" stroke-width="4" stroke-linejoin="round"></polygon>`, T.dark ? 'filter: drop-shadow(0 0 5px rgba(179,167,245,0.7))' : ''),
    },
  };

  /* ── I4 · An orrery: orbits added as the streak grows ── */
  const ORBIT = (R) => ({ rx: R, ry: R * 0.42 });
  const orbitPath = (R, cx = 50, cy = 50) => { const { rx, ry } = ORBIT(R); return `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`; };
  const I4 = {
    id: 'I4', name: 'An orrery', light: 'dusk',
    note: 'Each badge a small orrery round a sun: an orbit and a planet for 3 days, two for 7, three for 14; at 30 a ringed planet half in shadow, and at 100 the whole system with a comet crossing. Exploring: a comet for the first breath (something beginning); five planets in the five tones sharing one orbit; four on four orbits in the scenes’ colours; an eclipse for every sky, the moon across the sun with its corona. The planets turn slowly on their orbits (on the badges page and the unlock only; still under Reduce Motion). Not yet: dashed orbits and hollow planets, the system drawn but not lit. Profile: a planet on its orbit, a ringed planet, an eclipse. Build: react-native-svg Ellipses for the orbits (tilted 18°); each planet placed at (rx cos θ, ry sin θ) from one Animated angle on the shared clock.',
    badge: (code, S, T, locked) => {
      const oc = locked ? (T.dark ? 'rgba(242,236,221,0.42)' : 'rgba(27,33,64,0.42)') : T.dark ? 'rgba(242,236,221,0.32)' : `rgba(${rgb(T.accent)},0.45)`;
      const move = S >= 80 && !locked;
      const sid = uid('or');
      const defs = radial(sid, SUN);
      const orbit = (R) => `<path d="${orbitPath(R)}" fill="none" stroke="${oc}" stroke-width="0.8" ${locked ? 'stroke-dasharray="2 3"' : ''}></path>`;
      const planet = (R, a0, r, c, dur) => {
        const { rx, ry } = ORBIT(R);
        const x = 50 + rx * Math.cos(a0), y = 50 + ry * Math.sin(a0);
        const fillC = locked ? 'none' : c;
        const st = locked ? `stroke="${oc}" stroke-width="0.9"` : T.dark ? `style="filter: drop-shadow(0 0 ${f2(r * 0.8)}px ${c})"` : `stroke="rgba(27,33,64,0.25)" stroke-width="0.5"`;
        if (!move) return `<circle cx="${f2(x)}" cy="${f2(y)}" r="${r}" fill="${fillC}" ${st}></circle>`;
        const off = ((((Math.PI - a0) / (2 * Math.PI)) % 1) + 1) % 1; // the path starts at the orbit's left end
        return `<circle cx="0" cy="0" r="${r}" fill="${fillC}" ${st}><animateMotion dur="${dur}s" begin="${f2(-off * dur)}s" repeatCount="indefinite" path="${orbitPath(R)}"></animateMotion></circle>`;
      };
      const sun = (r = 9) => `<circle cx="50" cy="50" r="${r}" fill="${locked ? 'none' : `url(#${sid})`}" ${locked ? `stroke="${oc}" stroke-width="0.9"` : 'style="filter: drop-shadow(0 0 4px rgba(249,169,128,0.9))"'}></circle>`;
      const tone = (k) => (T.dark ? TONE[k] : T.hue[k] || TONE[k]);
      let art = '';
      switch (code) {
        case 'streak_3': art = `${orbit(26)}${sun()}${planet(26, 0.6, 4, tone('dawn'), 40)}`; break;
        case 'streak_7': art = `${orbit(26)}${orbit(40)}${sun()}${planet(26, 0.6, 4, tone('dawn'), 40)}${planet(40, 3.6, 4.5, tone('bloom'), 60)}`; break;
        case 'streak_14': art = `${orbit(22)}${orbit(34)}${orbit(47)}${sun(8)}${planet(22, 0.6, 3.6, tone('dawn'), 30)}${planet(34, 3.6, 4.2, tone('bloom'), 50)}${planet(47, 5.2, 5, tone('tide') || TONE.tide, 80)}`; break;
        case 'streak_30': {
          const pid = uid('or');
          art = `<defs>${radial(pid, TEAL)}</defs><path d="M${50 - 40} 50 A40 11 0 0 1 ${50 + 40} 50" fill="none" stroke="${locked ? oc : '#E4E2F4'}" stroke-width="${locked ? 0.9 : 3}" stroke-opacity="0.8" transform="rotate(-16 50 50)" ${locked ? 'stroke-dasharray="2 3"' : ''}></path><circle cx="50" cy="50" r="21" fill="${locked ? 'none' : `url(#${pid})`}" ${locked ? `stroke="${oc}" stroke-width="0.9"` : ''}></circle>${locked ? '' : '<path d="M50 29 A21 21 0 0 0 50 71 Z" fill="rgba(11,16,38,0.66)"></path>'}<path d="M${50 + 40} 50 A40 11 0 0 1 ${50 - 40} 50" fill="none" stroke="${locked ? oc : '#E4E2F4'}" stroke-width="${locked ? 0.9 : 3}" transform="rotate(-16 50 50)" ${locked ? 'stroke-dasharray="2 3"' : ''}></path><circle cx="82" cy="24" r="4" fill="${locked ? 'none' : '#E4E2F4'}" ${locked ? `stroke="${oc}" stroke-width="0.9"` : ''}></circle>`;
          break;
        }
        case 'streak_100': art = `${[16, 25, 34, 43].map(orbit).join('')}${sun(7)}${planet(16, 1, 3, tone('glow'), 24)}${planet(25, 3, 3.6, tone('dawn'), 36)}${planet(34, 4.6, 4, tone('bloom'), 54)}${planet(43, 0.2, 4.6, tone('dusk'), 80)}${locked ? '' : `<path d="M8 20 L30 8" stroke="${T.dark ? '#F2ECDD' : T.accent}" stroke-opacity="0.5" stroke-width="1.6" stroke-linecap="round"></path><circle cx="31" cy="7.5" r="2.4" fill="${T.dark ? '#F2ECDD' : T.accent}"></circle>`}`; break;
        case 'first_session': {
          const cid = uid('or');
          art = `<defs>${linear(cid, [['#6FD6CF', 0, 0], ['#6FD6CF', 1, 0.9]], 1, 0)}</defs>${locked ? `<path d="M18 74 Q44 50 70 34" fill="none" stroke="${oc}" stroke-width="0.9" stroke-dasharray="2 3"></path><circle cx="72" cy="32" r="6" fill="none" stroke="${oc}" stroke-width="0.9"></circle>` : `<path d="M14 80 Q40 54 66 36 L70 40 Q46 58 14 80 Z" fill="url(#${cid})" style="filter: blur(1px)"></path><circle cx="70" cy="34" r="7" fill="${T.dark ? '#D9FAF6' : '#6FD6CF'}" style="filter: drop-shadow(0 0 5px #6FD6CF)"></circle>`}${[[26, 26], [80, 70], [60, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="${oc}"></circle>`).join('')}`;
          break;
        }
        case 'all_breathing': art = `${orbit(38)}${sun(12)}${TONES5.map((k, i) => planet(38, (i * 72 - 90) * (Math.PI / 180), 5, tone(k) || TONE.tide, 70)).join('')}`; break;
        case 'all_scenes': art = `${[18, 27, 36, 45].map(orbit).join('')}${sun(7)}${Object.values(SCENE).map((c, i) => planet(18 + i * 9, i * 1.7 + 0.4, 3.4 + i * 0.5, c, 30 + i * 16)).join('')}`; break;
        case 'all_skies': {
          const cid = uid('or');
          art = `<defs>${radial(cid, [['#FFE9C8', 0.55, 0.95], ['#F9A980', 0.7, 0.55], ['#F9A980', 1, 0]], '50%', '50%', '50%')}</defs>${locked ? `<circle cx="50" cy="50" r="24" fill="none" stroke="${oc}" stroke-width="0.9" stroke-dasharray="2 3"></circle><circle cx="54" cy="47" r="22" fill="none" stroke="${oc}" stroke-width="0.9"></circle>` : `<circle cx="50" cy="50" r="44" fill="url(#${cid})"></circle><circle cx="50" cy="50" r="24" fill="#FFF3E4"></circle><circle cx="52" cy="49" r="23.4" fill="${T.dark ? '#0B1026' : '#1B2140'}"></circle><circle cx="30" cy="36" r="2.4" fill="#FFFFFF" style="filter: drop-shadow(0 0 3px #fff)"></circle>`}`;
          break;
        }
      }
      const tilt = !['streak_30', 'all_skies', 'first_session'].includes(code);
      return box(S, svg100(S, defs, tilt ? `<g transform="rotate(-18 50 50)">${art}</g>` : art), BNAME[code]);
    },
    stat: {
      streak: (T, s) => svg100(s, '', `<ellipse cx="50" cy="50" rx="44" ry="18" fill="none" stroke="${T.tone.dawn}" stroke-width="5" transform="rotate(-18 50 50)"></ellipse><circle cx="50" cy="50" r="15" fill="${T.tone.dawn}"></circle><circle cx="88" cy="36" r="9" fill="${T.tone.dawn}"></circle>`, T.dark ? 'filter: drop-shadow(0 0 4px rgba(242,184,128,0.7))' : ''),
      month: (T, s) => svg100(s, '', `<circle cx="50" cy="50" r="26" fill="${T.tone.glow}"></circle><ellipse cx="50" cy="50" rx="47" ry="13" fill="none" stroke="${T.tone.glow}" stroke-width="6" transform="rotate(-18 50 50)"></ellipse><path d="M24 50 A26 26 0 0 1 76 50" fill="${T.tone.glow}" transform="rotate(-18 50 50)"></path>`, T.dark ? 'filter: drop-shadow(0 0 4px rgba(111,214,207,0.7))' : ''),
      badges: (T, s) => svg100(s, '', `<circle cx="50" cy="50" r="44" fill="${T.tone.dusk}" fill-opacity="0.35"></circle><circle cx="50" cy="50" r="30" fill="${T.tone.dusk}"></circle><circle cx="56" cy="46" r="27" fill="${T.dark ? '#0B1026' : T.ground}"></circle>`, T.dark ? 'filter: drop-shadow(0 0 5px rgba(179,167,245,0.8))' : ''),
    },
  };

  /* ── I5 · The mark, lit: the Houna mark itself, in the light of each sky ── */
  const I5 = {
    id: 'I5', name: 'The mark, lit', light: 'sunrise',
    note: 'The Houna mark (the pin in its ring) is every badge, lit in the light of what it celebrates: First light warms only the foot of the ring; Sunrise lights it from below, violet to gold; The sun, all gold with short rays; the half moon lights its right half in pearl; the full moon, all pearl in its ring. Exploring: the mark in Houna teal, breathing; the ring in the five tones; in the four scenes’ colours; and from morning to night across it. Not yet: the same mark pressed into the page, unlit, as it is pressed into the orbs. Strongest for the brand; the nine are told apart by colour more than shape, so the names matter more. Profile: the mark in the three tones. Build: HounaMark’s paths with a LinearGradient fill, or clipped copies (a sector each) for the tones and scenes; PressedMark for not yet.',
    badge: (code, S, T, locked) => {
      const ms = S * 0.82;
      if (locked) return box(S, `${centred(S, S * 0.96, '', `border-radius: 999px; background: ${T.dark ? 'rgba(242,236,221,0.035)' : 'rgba(29,43,42,0.035)'}; box-shadow: inset 0 0 0 1px ${T.line}`)}${centred(S, ms * 0.9, K.pressedMark(ms * 0.9, T.dark ? '#262E5A' : '#EDF1EF'))}`, BNAME[code]);
      const id = uid('mk');
      const withFill = (fill, defs, glow, extra = '') => `<svg width="0" height="0" aria-hidden="true" style="position: absolute"><defs>${defs}</defs></svg>${centred(S, ms, mark(ms, fill, { style: `filter: drop-shadow(0 0 ${f2(S * 0.08)}px ${glow})` }))}${extra}`;
      const sectors = (cols, glow) => cols.map((c, i) => { const a0 = (i / cols.length) * 360, a1 = ((i + 1) / cols.length) * 360; const pts = [[50, 50], ...[a0, (a0 + a1) / 2, a1].map((a) => [50 + 80 * Math.sin((a * Math.PI) / 180), 50 - 80 * Math.cos((a * Math.PI) / 180)])].map(([x, y]) => `${f2(x)}% ${f2(y)}%`).join(', '); return centred(S, ms, mark(ms, c), `clip-path: polygon(${pts}); filter: drop-shadow(0 0 ${f2(S * 0.05)}px ${glow})`); }).join('');
      let inner = '';
      switch (code) {
        case 'streak_3': inner = withFill(`url(#${id})`, linear(id, [['#3A3470', 0], ['#6E5C9E', 0.55], ['#F7C79A', 1]]), 'rgba(247,199,154,0.6)'); break;
        case 'streak_7': inner = withFill(`url(#${id})`, linear(id, [['#7A76C0', 0], ['#E9A9A6', 0.5], ['#FFD9A8', 1]]), 'rgba(249,169,128,0.7)'); break;
        case 'streak_14': inner = withFill(`url(#${id})`, radial(id, [['#FFF6DA', 0], ['#F4C35A', 0.6], ['#E8A33A', 1]], '50%', '40%', '70%'), 'rgba(244,195,90,0.8)', svg100(S, '', Array.from({ length: 16 }, (_, i) => { const a = (i * 22.5 * Math.PI) / 180; return `<line x1="${f2(50 + 45 * Math.sin(a))}" y1="${f2(50 - 45 * Math.cos(a))}" x2="${f2(50 + 50 * Math.sin(a))}" y2="${f2(50 - 50 * Math.cos(a))}" stroke="#F4C35A" stroke-width="1.6" stroke-linecap="round"></line>`; }).join(''))); break;
        case 'streak_30': inner = `${centred(S, ms, mark(ms, T.dark ? 'rgba(228,226,244,0.2)' : 'rgba(25,102,98,0.2)'))}${withFill(`url(#${id})`, radial(id, PEARL), 'rgba(228,226,244,0.7)').replace(/(<span style="position: absolute; left: [^"]*?)">/, '$1; clip-path: inset(-30% -30% -30% 50%)">')}`; break;
        case 'streak_100': inner = withFill(`url(#${id})`, radial(id, PEARL), 'rgba(228,226,244,0.8)', svg100(S, '', `<circle cx="50" cy="50" r="49" fill="none" stroke="${T.dark ? 'rgba(228,226,244,0.4)' : 'rgba(25,102,98,0.3)'}" stroke-width="0.8"></circle>`)); break;
        case 'first_session': inner = `${centred(S, S, '', `border-radius: 999px; background: radial-gradient(closest-side, rgba(111,214,207,0.35), rgba(111,214,207,0)); animation: breath5 5s ease-in-out infinite`)}${centred(S, ms, mark(ms, T.dark ? '#6FD6CF' : '#3BAAA7'))}`; break;
        case 'all_breathing': inner = sectors(TONES5.map((k) => TONE[k]), 'rgba(179,167,245,0.6)'); break;
        case 'all_scenes': inner = sectors(Object.values(SCENE), 'rgba(143,155,240,0.6)'); break;
        case 'all_skies': inner = withFill(`url(#${id})`, linear(id, [['#F9A980', 0], ['#E98AA0', 0.45], ['#8F9BF0', 0.75], ['#E4E2F4', 1]], 1, 0), 'rgba(234,144,168,0.6)'); break;
      }
      return box(S, inner, BNAME[code]);
    },
    stat: {
      streak: (T, s) => centred(s, s, mark(s, T.tone.dawn, { style: T.dark ? 'filter: drop-shadow(0 0 4px rgba(242,184,128,0.7))' : '' })),
      month: (T, s) => centred(s, s, mark(s, T.tone.glow, { ring: false, style: T.dark ? 'filter: drop-shadow(0 0 4px rgba(111,214,207,0.7))' : '' })),
      badges: (T, s) => centred(s, s, mark(s, T.tone.dusk, { style: T.dark ? 'filter: drop-shadow(0 0 5px rgba(179,167,245,0.8))' : '' })),
    },
  };

  /* ── One board per direction: Night and a light theme, each with Profile's numbers, the nine earned, the nine not yet, four up close ── */
  const PANEL_W = 720, PANEL_H = 720, BPAD = 40, HEAD = 196;
  const CLOSE = ['streak_3', 'streak_30', 'all_breathing', 'all_skies'];
  function panel(D, T, x, y) {
    const name = (c) => (D.names && D.names[c]) || BNAME[c];
    const sec = (t, top) => `<div style="position: absolute; left: 32px; top: ${top}px">${K.label(t, T.dark ? M.haze : T.ter, 11)}</div>`;
    const stat = (k, v, l) => `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px"><span style="position: relative; display: block; width: 28px; height: 28px">${D.stat[k](T, 28)}</span><span style="font-family: ${K.F.body}; font-weight: 300; font-size: 32px; line-height: 36px; color: ${T.text}">${v}</span>${K.label(l, T.ter, 10)}</div>`;
    const big = (k, l) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 88px"><span style="position: relative; display: block; width: 56px; height: 56px">${D.stat[k](T, 56)}</span><span style="font-size: 12px; color: ${T.sec}">${l}</span></div>`;
    const nine = (locked) => ORDER.map((c) => `<div style="width: 72px; display: flex; flex-direction: column; align-items: center; gap: 8px">${D.badge(c, 56, T, locked)}<span style="font-size: 11.5px; line-height: 1.3; text-align: center; color: ${locked ? T.ter : T.text}">${name(c)}</span></div>`).join('');
    const close = CLOSE.map((c) => `<div style="width: 160px; display: flex; flex-direction: column; align-items: center; gap: 12px">${D.badge(c, 104, T, false)}<span style="font-size: 14px; font-weight: 500; color: ${T.text}">${name(c)}</span></div>`).join('');
    return `<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${PANEL_W}px; height: ${PANEL_H}px; border-radius: 32px; overflow: hidden; background: ${T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); color: ${T.text}">
${T.dark ? K.starfield(40, PANEL_W, PANEL_H, 131) : ''}
<div style="position: absolute; left: 32px; right: 32px; top: 24px; display: flex; justify-content: space-between; align-items: center">${K.label(T.name, T.accent, 12)}${K.label(`${D.id} · ${D.name}`, T.dark ? M.haze : T.ter, 10)}</div>
${sec("Profile · the three numbers (actual size, then 2×)", 64)}
<div style="position: absolute; left: 32px; top: 96px; width: 358px; display: flex">${stat('streak', 12, 'Day streak')}${stat('month', 23, 'This month')}${stat('badges', 4, 'Badges')}</div>
<div style="position: absolute; left: 424px; top: 92px; display: flex; gap: 8px">${big('streak', 'Streak')}${big('month', 'This month')}${big('badges', 'Badges')}</div>
${sec('Earned', 208)}
<div style="position: absolute; left: 36px; top: 240px; display: flex">${nine(false)}</div>
${sec('Not yet', 360)}
<div style="position: absolute; left: 36px; top: 392px; display: flex">${nine(true)}</div>
${sec('On the badges page and the unlock (104)', 512)}
<div style="position: absolute; left: 40px; top: 552px; display: flex">${close}</div>
</div>`;
  }
  const DIRS = [I0, I1, I2, I3, I4, I5];
  const I_CSS = `${'@keyframes breath5 { 0%,100% { transform: scale(0.97); opacity: 0.7 } 50% { transform: scale(1.03); opacity: 1 } }'}`;
  for (const D of DIRS) {
    const W = BPAD * 3 + PANEL_W * 2, H = HEAD + PANEL_H + BPAD;
    const file = `I-${D.id.toLowerCase()}-${D.name.split(':')[0].toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '')}.dc.html`;
    const body = `<div style="position: absolute; left: ${BPAD}px; top: 40px; width: ${W - BPAD * 2}px; display: flex; flex-direction: column; gap: 8px">
<div style="display: flex; align-items: baseline; gap: 16px">${K.label(D.id, '#6FD6CF', 14)}<span style="font-family: ${K.F.display}; font-size: 36px; line-height: 1.1; color: ${M.moonlight}">${D.name}</span></div>
<span style="font-size: 14.5px; line-height: 1.5; color: ${M.mist}">${D.note}</span>
</div>
${panel(D, THEME.night, BPAD, HEAD)}
${panel(D, THEME[D.light], BPAD * 2 + PANEL_W, HEAD)}`;
    D.file = file;
    out.push(K.board(file, { title: `I · ${D.id} ${D.name}`, w: W, h: H, root: 'background: #070B1C', css: I_CSS, body, dir: DIR }));
  }
  return { hRows: [['H-moods.dc.html'], ['H-moods-ar.dc.html']], iRows: [DIRS.slice(0, 3).map((d) => d.file), DIRS.slice(3).map((d) => d.file)] };
};
