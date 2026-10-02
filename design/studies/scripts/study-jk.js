// Rows J and K of "Houna — Design studies", called from make-studies.js (which lays out the canvas).
// J · A glass sun for Sunrise: the moon's see-through glass treatment (F4 + F2) given to the sun,
//     eight ways beside today's disc, each in the morning scene and on Home.
// K · The sun's rays: other Arabic geometry in the same "lines of light" style as today's turning
//     eight-point stars (A2: a soft blurred stroke of light over a crisp coral one), nine ways.
module.exports = function studyJK({ K, row, out, DIR, M }) {
  const TS = { ...K.T.sunrise, dark: false };
  const ANCHOR = 199;
  let n = 0;
  const uid = (p) => `${p}${++n}`;
  const at = (cx, cy, d, inner, style = '') => `<div aria-hidden="true" style="position: absolute; left: ${cx - d / 2}px; top: ${cy - d / 2}px; width: ${d}px; height: ${d}px; ${style}">${inner}</div>`;
  const f = (x) => x.toFixed(2);

  // The app's own values (constants/theme.ts, sunriseScene): the morning sky, the lattice's colours.
  const SKY = 'linear-gradient(180deg, #A9DDE0 0%, #DDF1EF 38%, #FCE7D8 74%, #FBC9A6 100%)';
  const CORAL = '#E8582C', PEACH = '#F9A980', CORE = '#FFE6CC';
  const DISC = 104; // the settled sun in the scene
  const HOME = 84; // the sun on Home, in the panel

  const css = `@keyframes breath5 { 0%,100% { transform: scale(0.97); opacity: 0.7 } 50% { transform: scale(1.03); opacity: 1 } }
@keyframes spinCw { to { transform: rotate(360deg) } } @keyframes spinCcw { to { transform: rotate(-360deg) } }
@keyframes latBreath { 0%,100% { transform: scale(0.94); opacity: 0.3 } 50% { transform: scale(1.08); opacity: 1 } }
@keyframes coreBreath { 0%,100% { transform: scale(0.9); opacity: 0.75 } 50% { transform: scale(1.06); opacity: 1 } }
@keyframes glint { 0%,70%,100% { opacity: 0 } 80% { opacity: 0.9 } }`;

  /* ══════════ The suns ══════════ */
  /** A sun D across, the mark pressed in. Each kind is a glass recipe made of gradients (react-native-svg can draw all of them). */
  function sun(kind, D) {
    const m = D * 0.56;
    const mk = (surface, style = '') => at(D / 2, D / 2, m, K.pressedMark(m, surface), style);
    /** On glass, the mark is etched: a pale cut with a faint warm edge below it, not a dark pressing. */
    const etched = (edge = 'rgba(214,120,72,0.4)', face = 'rgba(255,255,255,0.78)') => {
      const one = (fill, dx) => at(D / 2 + dx, D / 2 + dx, m, `<div style="position: relative; width: ${m}px; height: ${m}px">${K.mark(m, fill)}</div>`);
      return `${one(edge, D * 0.008)}${one(face, 0)}`;
    };
    const clip = (inner) => `<div style="position: absolute; inset: 0; border-radius: 999px; overflow: hidden; isolation: isolate">${inner}</div>`;
    const layer = (style) => `<span style="position: absolute; inset: 0; border-radius: 999px; ${style}"></span>`;
    const sheen = (colors, a, s = 60) => `<span style="position: absolute; inset: -20%; background: conic-gradient(from 200deg, ${colors.join(', ')}, ${colors[0]}); opacity: ${a}; animation: spinCw ${s}s linear infinite"></span>`;
    const highlight = (a = 0.85, x = 34, y = 28, r = 30) => layer(`background: radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,${a}) 0%, rgba(255,255,255,0) ${r}%)`);
    switch (kind) {
      case 'J0': // today
        return `${layer(`background: ${K.DISCS.sunrise.stops}`)}${mk(K.DISCS.sunrise.surface)}`;
      case 'J1': // gold glass: the moon's sister
        return `${clip(`${layer('background: radial-gradient(circle at 50% 50%, rgba(255,250,240,0.18) 0%, rgba(255,236,210,0.28) 50%, rgba(251,200,163,0.6) 84%, rgba(249,169,128,0.9) 100%)')}${sheen(['rgba(255,214,140,0.5)', 'rgba(249,169,128,0.45)', 'rgba(243,123,131,0.35)', 'rgba(111,214,207,0.3)'], 0.4)}${highlight()}`)}${layer('box-shadow: inset 0 0 0 1.2px rgba(255,240,222,0.95), inset 0 0 14px rgba(255,255,255,0.35)')}${etched()}`;
      case 'J2': // dewdrop: clear, a caustic of focused light low on the far side
        return `${clip(`${layer('background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08) 0%, rgba(255,248,236,0.16) 60%, rgba(246,190,130,0.55) 100%)')}${layer('background: radial-gradient(circle at 66% 74%, rgba(255,226,160,0.95) 0%, rgba(255,214,150,0.4) 14%, rgba(255,214,150,0) 30%)')}${layer('background: radial-gradient(120% 120% at 30% 22%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 22%)')}`)}${layer('box-shadow: inset 0 0 0 1px rgba(255,255,255,0.9), inset -6px -8px 14px rgba(232,150,90,0.25)')}${etched('rgba(214,130,80,0.45)')}`;
      case 'J3': // opal: milky, fire turning inside
        return `${clip(`${layer('background: radial-gradient(circle at 45% 40%, #FFFDF8 0%, #FCEFE4 45%, #F6D6C3 100%)')}${sheen(['rgba(232,88,44,0.55)', 'rgba(255,205,110,0.6)', 'rgba(59,170,167,0.5)', 'rgba(243,123,131,0.5)', 'rgba(179,167,245,0.45)'], 0.5, 40)}${layer('background: radial-gradient(circle at 50% 50%, rgba(255,253,248,0.7) 0%, rgba(255,253,248,0) 60%)')}${highlight(0.7)}<span style="position: absolute; inset: 0">${K.grain(uid('og'), 0.18, 1.6)}</span>`)}${layer('box-shadow: inset 0 0 0 1px rgba(255,255,255,0.8)')}${etched('rgba(200,110,90,0.4)')}`;
      case 'J4': // a lens: fine rings of glass, like a lighthouse lens
        return `${clip(`${layer('background: radial-gradient(circle at 50% 50%, rgba(255,250,240,0.3) 0%, rgba(253,224,196,0.45) 70%, rgba(249,169,128,0.8) 100%)')}${layer(`background: repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0px, rgba(255,255,255,0) ${f(D * 0.055)}px, rgba(255,246,232,0.75) ${f(D * 0.06)}px, rgba(255,255,255,0) ${f(D * 0.075)}px)`)}${highlight(0.6, 32, 26, 26)}`)}${layer('box-shadow: inset 0 0 0 1.2px rgba(255,240,222,0.95)')}${etched()}`;
      case 'J5': // a lantern: a thin glass shell, a warm light breathing inside it
        return `${clip(`${layer('background: rgba(255,248,236,0.18)')}<span style="position: absolute; inset: 12%; border-radius: 999px; background: radial-gradient(circle, rgba(255,214,120,1) 0%, rgba(255,190,110,0.75) 34%, rgba(249,169,128,0) 72%); animation: coreBreath 5s ease-in-out infinite"></span>${highlight(0.8, 30, 24, 22)}`)}${layer('box-shadow: inset 0 0 0 1.2px rgba(255,244,228,0.95), inset 0 0 10px rgba(255,255,255,0.45)')}${mk('#E9A574')}`;
      case 'J6': // frosted: morning light through frosted glass, a crisp rim
        return `${clip(`${layer('background: radial-gradient(circle at 50% 46%, rgba(255,252,246,0.9) 0%, rgba(255,240,226,0.75) 60%, rgba(251,206,172,0.8) 100%); backdrop-filter: blur(8px)')}<span style="position: absolute; inset: 0">${K.grain(uid('fg'), 0.28, 1.8)}</span>`)}${layer(`box-shadow: inset 0 0 0 1.5px rgba(255,255,255,1), 0 0 0 1px rgba(232,88,44,0.35)`)}${etched('rgba(232,88,44,0.35)')}`;
      case 'J7': // pearl touched with Houna's turquoise
        return `${clip(`${layer('background: radial-gradient(circle at 36% 30%, #FFFFFF 0%, #FFF6EA 42%, #F3DCCB 78%, #CFEDEA 100%)')}${sheen(['rgba(59,170,167,0.45)', 'rgba(255,214,140,0.4)', 'rgba(243,123,131,0.3)', 'rgba(255,255,255,0.2)'], 0.45, 50)}${highlight(0.75)}`)}${layer('box-shadow: inset 0 0 0 1px rgba(255,255,255,0.9)')}${etched('rgba(59,140,140,0.45)')}`;
      case 'J8': { // etched glass: an eight-point star cut into J1's glass
        const c = D / 2;
        const etch = `<svg width="${D}" height="${D}" viewBox="0 0 ${D} ${D}" style="position: absolute; inset: 0"><polygon points="${K.star8(c, c, D * 0.46)}" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="0.9"></polygon><polygon points="${K.star8(c, c, D * 0.46, 22.5)}" fill="none" stroke="rgba(232,88,44,0.3)" stroke-width="0.7"></polygon><circle cx="${c}" cy="${c}" r="${D * 0.33}" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="0.6"></circle></svg>`;
        return `${clip(`${layer('background: radial-gradient(circle at 50% 50%, rgba(255,250,240,0.2) 0%, rgba(255,236,210,0.3) 50%, rgba(251,200,163,0.62) 84%, rgba(249,169,128,0.9) 100%)')}${etch}${highlight(0.8)}`)}${layer('box-shadow: inset 0 0 0 1.2px rgba(255,240,222,0.95)')}${etched()}`;
      }
    }
    return '';
  }

  /* ══════════ The rays ══════════ */
  /** A star polygon {n/k} (several closed paths when n and k share a factor), radius r, turned rot°. */
  function starPath(cx, cy, r, nn, k, rot = 0) {
    const pt = (i) => {
      const a = ((i * 360) / nn + rot - 90) * (Math.PI / 180);
      return `${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`;
    };
    const seen = new Set();
    let d = '';
    for (let s = 0; s < nn; s++) {
      if (seen.has(s)) continue;
      let i = s;
      d += `M${pt(i)}`;
      do {
        seen.add(i);
        i = (i + k) % nn;
        d += ` L${pt(i)}`;
      } while (i !== s);
      d += ' Z';
    }
    return d;
  }
  const circlePath = (cx, cy, r) => `M${f(cx - r)} ${f(cy)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;
  /** Petals (pointed lenses) radiating from r0 to r1, `count` of them, each `w` wide at its middle. */
  function petals(cx, cy, r0, r1, count, w, rot = 0) {
    let d = '';
    for (let i = 0; i < count; i++) {
      const a = ((i * 360) / count + rot - 90) * (Math.PI / 180);
      const ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
      const x0 = cx + ux * r0, y0 = cy + uy * r0, x1 = cx + ux * r1, y1 = cy + uy * r1;
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      d += `M${f(x0)} ${f(y0)} Q${f(mx + px * w)} ${f(my + py * w)} ${f(x1)} ${f(y1)} Q${f(mx - px * w)} ${f(my - py * w)} ${f(x0)} ${f(y0)} Z `;
    }
    return d;
  }
  const star8Path = (cx, cy, r, rot) => `M${K.star8(cx, cy, r, rot).split(' ').join(' L')} Z`;

  /**
   * Each pattern: layers of paths as functions of (c, R), R the sun's radius; `pair` 0 turns one way
   * in 90 s, pair 1 the other in 120 s, as today. `deep` draws the crisp line coral, else peach.
   */
  const PATTERNS = {
    K0: {
      name: 'Today',
      note: 'Four eight-point stars turning in pairs, lines of light over crisp coral (A2).',
      layers: [
        { d: (c, R) => star8Path(c, c, R * 3.08, 0), pair: 0, deep: true },
        { d: (c, R) => star8Path(c, c, R * 2.46, 22.5), pair: 0 },
        { d: (c, R) => star8Path(c, c, R * 3.77, 11.25), pair: 1 },
        { d: (c, R) => star8Path(c, c, R * 1.92, 33.75), pair: 1, deep: true },
      ],
    },
    K1: {
      name: 'Twelve-point rosette',
      note: 'A {12/5} star round three interlaced squares: the twelve-fold rosette of Andalusian ceilings, finer and rounder than the eights.',
      layers: [
        { d: (c, R) => starPath(c, c, R * 3.4, 12, 5), pair: 0, deep: true },
        { d: (c, R) => starPath(c, c, R * 2.3, 12, 3, 15), pair: 1 },
        { d: (c, R) => circlePath(c, c, R * 1.7), pair: 1 },
      ],
    },
    K2: {
      name: 'Khatam in its octagon',
      note: 'One eight-point star (the khatam) inside an octagon and a circle, a second star turned between: calmer, fewer lines.',
      layers: [
        { d: (c, R) => star8Path(c, c, R * 2.7, 0), pair: 0, deep: true },
        { d: (c, R) => starPath(c, c, R * 3.3, 8, 1, 22.5), pair: 0 },
        { d: (c, R) => star8Path(c, c, R * 2.0, 22.5), pair: 1 },
        { d: (c, R) => circlePath(c, c, R * 3.75), pair: 1 },
      ],
    },
    K3: {
      name: 'Six-fold',
      note: 'Two hexagrams and a hexagon, turning against each other: a softer, older star than the eight.',
      layers: [
        { d: (c, R) => starPath(c, c, R * 2.4, 6, 2), pair: 0, deep: true },
        { d: (c, R) => starPath(c, c, R * 3.3, 6, 2, 30), pair: 1 },
        { d: (c, R) => starPath(c, c, R * 3.8, 6, 1), pair: 0 },
      ],
    },
    K4: {
      name: 'Interlaced circles',
      note: 'Eight circles overlapping round the sun, the rosette Islamic geometry is drawn from, in a ring: no points, all curves.',
      layers: [
        { d: (c, R) => Array.from({ length: 8 }, (_, i) => { const a = (i * 45 - 90) * (Math.PI / 180); return circlePath(c + Math.cos(a) * R * 1.55, c + Math.sin(a) * R * 1.55, R * 1.45); }).join(' '), pair: 0, deep: true },
        { d: (c, R) => circlePath(c, c, R * 3.0), pair: 1 },
        { d: (c, R) => circlePath(c, c, R * 3.6), pair: 1 },
      ],
    },
    K5: {
      name: 'Sixteen-point sunburst',
      note: 'Two sixteen-point stars, sharp and long: the most like rays of all, still one geometry.',
      layers: [
        { d: (c, R) => starPath(c, c, R * 3.7, 16, 7), pair: 0, deep: true },
        { d: (c, R) => starPath(c, c, R * 2.5, 16, 5, 11.25), pair: 1 },
      ],
    },
    K6: {
      name: 'Shamsa petals',
      note: 'The shamsa (“little sun”) of illuminated manuscripts: twelve long petals and twelve short ones between, turning gently.',
      layers: [
        { d: (c, R) => petals(c, c, R * 1.15, R * 3.6, 12, R * 0.3), pair: 0, deep: true },
        { d: (c, R) => petals(c, c, R * 1.15, R * 2.5, 12, R * 0.24, 15), pair: 1 },
        { d: (c, R) => circlePath(c, c, R * 1.15), pair: 1 },
      ],
    },
    K7: {
      name: 'Three in one',
      note: 'The eight inside, a twelve round it, a sixteen outermost, each layer turning at its own pace: the richest mix.',
      layers: [
        { d: (c, R) => star8Path(c, c, R * 1.95, 0), pair: 0, deep: true },
        { d: (c, R) => starPath(c, c, R * 2.85, 12, 5, 15), pair: 1 },
        { d: (c, R) => starPath(c, c, R * 3.8, 16, 7), pair: 0 },
      ],
    },
    K8: {
      name: 'Ten-fold girih',
      note: 'A ten-point star round two pentagrams and a decagon: the girih of Persian and Moorish tiling.',
      layers: [
        { d: (c, R) => starPath(c, c, R * 3.3, 10, 3), pair: 0, deep: true },
        { d: (c, R) => starPath(c, c, R * 2.2, 10, 4, 18), pair: 1 },
        { d: (c, R) => starPath(c, c, R * 3.8, 10, 1, 18), pair: 1 },
      ],
    },
    K9: {
      name: 'Beads of light',
      note: 'Today’s stars drawn as rows of small beads of light, as Classic Home’s dot ring is: lighter, sparkling as they turn.',
      dotted: true,
      layers: [
        { d: (c, R) => star8Path(c, c, R * 3.08, 0), pair: 0, deep: true },
        { d: (c, R) => star8Path(c, c, R * 2.46, 22.5), pair: 1 },
        { d: (c, R) => star8Path(c, c, R * 3.77, 11.25), pair: 1 },
      ],
    },
  };

  /** A pattern's rays round a sun of radius R, at (cx, cy): two turning layers, each a blurred light over a crisp line, breathing. */
  function rays(p, cx, cy, R, scale = 1) {
    const BOX = Math.ceil(R * 4 * 2 * scale + 40), c = BOX / 2;
    const pair = (k) => {
      const ls = p.layers.filter((l) => l.pair === k);
      if (!ls.length) return '';
      const dash = (w) => (p.dotted ? `stroke-dasharray="0 ${f(w * 3.4)}" stroke-linecap="round"` : 'stroke-linejoin="round"');
      const svg = (inner, style = '') => `<svg width="${BOX}" height="${BOX}" viewBox="0 0 ${BOX} ${BOX}" style="position: absolute; inset: 0; overflow: visible; ${style}">${inner}</svg>`;
      const light = ls.map((l) => `<path d="${l.d(c, R * scale)}" fill="none" stroke="${CORE}" stroke-width="${p.dotted ? 5 : 2.6}" ${dash(p.dotted ? 5 : 2.6)}></path>`).join('');
      const crisp = ls.map((l) => `<path d="${l.d(c, R * scale)}" fill="none" stroke="${l.deep ? CORAL : PEACH}" stroke-opacity="${p.dotted ? 0.85 : l.deep ? 0.6 : 0.55}" stroke-width="${p.dotted ? 2.4 : 1}" ${dash(p.dotted ? 5 : 1)}></path>`).join('');
      return `<div style="position: absolute; inset: 0; animation: ${k ? 'spinCcw 120s' : 'spinCw 90s'} linear infinite"><div style="position: absolute; inset: 0; animation: latBreath 5s ease-in-out infinite">${svg(light, 'filter: blur(1.6px)')}${svg(crisp)}</div></div>`;
    };
    return at(cx, cy, BOX, `${pair(0)}${pair(1)}`);
  }

  /* ══════════ The phones ══════════ */
  const word = `<span style="position: absolute; left: 0; right: 0; top: 520px; text-align: center">${K.label('Tanafas', '#58595B', 11)}</span>`;
  /** The morning scene on top, "On Home" beneath: Home's pale ground, the sun at Home's size, its lattice drawn closer. */
  const phone = (sunKind, pat) => `<span style="position: absolute; inset: 0; background: ${SKY}"></span>
${rays(pat, 195, ANCHOR, DISC / 2)}
${at(195, ANCHOR, DISC, sun(sunKind, DISC))}
${word}
<div style="position: absolute; left: 16px; right: 16px; top: 580px; height: 236px; border-radius: 28px; background: ${TS.ground}; box-shadow: 0 0 0 1px rgba(29,43,42,0.1); overflow: hidden">
<span style="position: absolute; left: 20px; top: 16px">${K.label('On Home', '#58595B', 10)}</span>
${rays(pat, 179, 124, HOME / 2, 0.55)}
${at(179, 124, HOME, sun(sunKind, HOME))}
</div>`;

  const J_NOTES = {
    J0: 'Today · The pale-gold disc, the mark pressed in, no glow. It reads as a flat sticker once it’s familiar.',
    J1: 'Gold glass · The moon’s glass in morning colours: see-through in the middle, gathering gold at the rim, a slow sheen of gold, peach, rose and turquoise turning inside.',
    J2: 'Dewdrop · Clear glass, the sky showing through; the light it gathers pools bright at its lower far side, as a drop of water does.',
    J3: 'Opal · Milky glass with fire inside: coral, gold, turquoise and violet drifting under the surface. Richest; the most like a jewel.',
    J4: 'Lens · Fine rings of glass like a lighthouse lens, catching the light ring by ring round the mark. Echoes the lattice’s geometry.',
    J5: 'Lantern · A thin glass shell with a warm light inside that breathes on the 5 s breath; the mark sits against the light.',
    J6: 'Frosted · Morning light through frosted glass, a fine grain, one crisp white rim. Quiet, very legible on the pale sky.',
    J7: 'Pearl and turquoise · Houna’s own: a pearl warmed at the centre, cooling to the logo’s turquoise at the rim, its sheen turning (the B3 morning).',
    J8: 'Etched glass · J1’s gold glass with an eight-point star cut into it, so the sun carries the rays’ geometry inside too.',
  };
  const J = Object.keys(J_NOTES);
  const jFiles = [['J-suns-1.dc.html', J.slice(0, 5)], ['J-suns-2.dc.html', J.slice(5)]];
  for (const [file, kinds] of jFiles)
    row(file, {
      title: `J · A glass sun for Sunrise (${kinds[0]}–${kinds[kinds.length - 1]})`,
      css,
      phones: kinds.map((k) => ({ T: TS, bg: TS.ground, caption: `${k} · ${J_NOTES[k]}`, html: phone(k, PATTERNS.K0) })),
    });
  // All nine close, on Home's pale ground and on the morning sky.
  {
    const W = 2160, H = 760, GAPX = 228;
    const body = `<div style="position: absolute; left: 64px; top: 56px; display: flex; flex-direction: column; gap: 10px">${K.label('J · the suns close', '#196662', 12)}<span style="font-family: ${K.F.display}; font-size: 40px; color: #1D2B2A">On Home’s ground, and in the sky</span><span style="font-size: 15px; color: #4A5655">Drawn at 180 to judge the glass; on the phone they’re 84 on Home and 104 in the scene.</span></div>
<span style="position: absolute; left: 0; right: 0; top: 440px; bottom: 0; background: ${SKY}"></span>
${J.map((k, i) => `${at(164 + i * GAPX, 320, 180, sun(k, 180))}${at(164 + i * GAPX, 590, 180, sun(k, 180))}<span style="position: absolute; left: ${74 + i * GAPX}px; top: 700px; width: 180px; text-align: center">${K.label(k, '#4A5655', 11)}</span>`).join('')}`;
    out.push(K.board('J-suns-close.dc.html', { title: 'J · the suns, close', w: W, h: H, root: `background: ${TS.ground}`, css, body, dir: DIR }));
  }

  const K_KEYS = Object.keys(PATTERNS);
  const kFiles = [['K-rays-1.dc.html', K_KEYS.slice(0, 5)], ['K-rays-2.dc.html', K_KEYS.slice(5)]];
  for (const [file, keys] of kFiles)
    row(file, {
      title: `K · The sun’s rays (${keys[0]}–${keys[keys.length - 1]})`,
      css,
      phones: keys.map((k) => ({ T: TS, bg: TS.ground, caption: `${k} · ${PATTERNS[k].name} · ${PATTERNS[k].note} Shown with today’s sun; any J sun takes any K rays.`, html: phone('J0', PATTERNS[k]) })),
    });

  return {
    jRows: [[jFiles[0][0]], [jFiles[1][0], 'J-suns-close.dc.html']],
    kRows: kFiles.map(([file]) => [file]),
  };
};
