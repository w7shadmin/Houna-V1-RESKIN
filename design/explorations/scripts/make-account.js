// E · Account, badges and progress: eight phones. Inspiration: Opal's laurel ring and gemstones,
// Oura's big light numerals. The Kufic ring, the girih mosaic and the celestial avatars are the
// woven Arabic references. Streaks count practice only, never mood (CLAUDE.md).
const K = require('./kit.js');
const { icon } = require('./icons.js');
const N = K.T.night, D = K.T.dusk;
const M = K.NIGHT;
const out = [];
const DAY = 86400000;
const num = (t, size, color = M.moonlight, extra = '') => `<span style="font-family: ${K.F.body}; font-weight: 300; font-size: ${size}px; line-height: 1; color: ${color}; font-variant-numeric: tabular-nums; ${extra}">${t}</span>`;
const arNum = (t, size, color = M.moonlight) => `<span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: ${size}px; line-height: 1.15; color: ${color}">${K.ar(t)}</span>`;
let uid = 0;

/* ── The badge objects: lit, glassy, each one a sky body ── */
function gem(kind, size, { locked = false } = {}) {
  const id = `gm${uid++}`;
  const s = size, c = s / 2;
  const hl = `<ellipse cx="${c - s * 0.14}" cy="${c - s * 0.2}" rx="${s * 0.16}" ry="${s * 0.09}" fill="#FFFFFF" opacity="${locked ? 0.25 : 0.7}" transform="rotate(-28 ${c - s * 0.14} ${c - s * 0.2})"></ellipse>`;
  const grad = (stops) => `<radialGradient id="${id}" cx="38%" cy="32%" r="75%">${stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"></stop>`).join('')}</radialGradient>`;
  const G = {
    sun: { stops: [[0, '#FFF9F1'], [0.45, '#FFD9A8'], [1, '#E4826A']], shape: `<circle cx="${c}" cy="${c}" r="${s * 0.36}" fill="url(#${id})"></circle>`, glow: '242,184,128' },
    rise: { stops: [[0, '#FFF3E4'], [0.5, '#F9A980'], [1, '#C2475A']], shape: `<path d="M${c - s * 0.38} ${c + s * 0.08} A${s * 0.38} ${s * 0.38} 0 0 1 ${c + s * 0.38} ${c + s * 0.08} Z" fill="url(#${id})"></path><rect x="${c - s * 0.42}" y="${c + s * 0.12}" width="${s * 0.84}" height="${s * 0.05}" rx="${s * 0.025}" fill="url(#${id})" opacity="0.8"></rect>`, glow: '249,169,128' },
    moon: { stops: [[0, '#D9FAF6'], [0.55, '#6FD6CF'], [1, '#1F7A74']], shape: `<path d="M${c + s * 0.05} ${c - s * 0.37} A${s * 0.37} ${s * 0.37} 0 1 0 ${c + s * 0.34} ${c + s * 0.14} A${s * 0.3} ${s * 0.3} 0 0 1 ${c + s * 0.05} ${c - s * 0.37} Z" fill="url(#${id})"></path>`, glow: '111,214,207' },
    full: { stops: [[0, '#FFFFFF'], [0.5, '#F2ECDD'], [1, '#B6BAD6']], shape: `<circle cx="${c}" cy="${c}" r="${s * 0.36}" fill="url(#${id})"></circle>`, glow: '242,236,221' },
    orb: { stops: [[0, 'rgba(255,255,255,0.95)'], [0.4, 'rgba(185,236,232,0.6)'], [1, 'rgba(111,214,207,0.55)']], shape: `<circle cx="${c}" cy="${c}" r="${s * 0.36}" fill="url(#${id})" stroke="rgba(217,250,246,0.6)" stroke-width="1"></circle>`, glow: '111,214,207' },
    star: { stops: [[0, '#F4F0FF'], [0.5, '#B3A7F5'], [1, '#6353C9']], shape: `<polygon points="${K.star8(c, c, s * 0.4)}" fill="url(#${id})"></polygon>`, glow: '179,167,245' },
    arch: { stops: [[0, '#FFE3EB'], [0.5, '#EA90A8'], [1, '#B24B6B']], shape: `<path d="${K.archPath(s * 0.52, s * 0.66, c - s * 0.26, c - s * 0.36)}" fill="url(#${id})"></path>`, glow: '234,144,168' },
    tones: { stops: [[0, '#FFFFFF'], [1, '#FFFFFF']], shape: [['#6FD6CF', 0, -1], ['#B3A7F5', 1, 0], ['#F2B880', 0, 1], ['#EA90A8', -1, 0]].map(([col, dx, dy]) => `<circle cx="${c + dx * s * 0.16}" cy="${c + dy * s * 0.16}" r="${s * 0.15}" fill="${col}"></circle>`).join(''), glow: '179,167,245' },
  }[kind];
  const lockF = locked ? `<filter id="${id}g"><feColorMatrix type="saturate" values="0"></feColorMatrix></filter>` : '';
  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" aria-hidden="true" style="display: block; overflow: visible; ${locked ? 'opacity: 0.35' : `filter: drop-shadow(0 0 ${s * 0.14}px rgba(${G.glow},0.65))`}"><defs>${grad(G.stops)}${lockF}</defs><g${locked ? ` filter="url(#${id}g)"` : ''}>${G.shape}${hl}</g></svg>`;
}
const pedestal = (w) => `<span aria-hidden="true" style="display: block; width: ${w}px; height: ${w * 0.18}px; border-radius: 50%; background: radial-gradient(closest-side, rgba(242,236,221,0.2), rgba(242,236,221,0)); margin-top: -${w * 0.06}px"></span>`;

const BADGES = [
  { code: 'first_session', kind: 'orb', en: 'First breath', ar: 'النَّفَس الأول', how: 'Finish your first session', earned: true, tone: N.tone.glow },
  { code: 'streak_3', kind: 'rise', en: 'First light', ar: 'أول الضوء', how: '3 days in a row', earned: true, tone: N.tone.dawn },
  { code: 'streak_7', kind: 'sun', en: 'Sunrise', ar: 'الشروق', how: '7 days in a row', earned: true, tone: N.tone.dawn },
  { code: 'streak_14', kind: 'full', en: 'The sun', ar: 'الشمس', how: '14 days in a row', earned: false, tone: M.moonlight },
  { code: 'streak_30', kind: 'moon', en: 'Half moon', ar: 'نصف القمر', how: '30 days in a row', earned: false, tone: N.tone.glow },
  { code: 'streak_100', kind: 'star', en: 'Full moon', ar: 'البدر', how: '100 days in a row', earned: false, tone: N.tone.dusk },
  { code: 'all_breathing', kind: 'tones', en: 'Every breath', ar: 'كل الأنفاس', how: 'Try all four breathing exercises', earned: true, tone: N.tone.dusk },
  { code: 'all_scenes', kind: 'arch', en: 'Every scene', ar: 'كل المشاهد', how: 'Meditate with all four scenes', earned: false, tone: N.tone.bloom },
  { code: 'all_skies', kind: 'moon', en: 'Every sky', ar: 'كل السماوات', how: 'Visit the sunrise, the dusk and the starfield', earned: false, tone: N.tone.glow },
];

/* ── E1 / E8 · Profile with a Kufic ring round the avatar (Opal's laurel) ── */
function profile(lang) {
  const isAr = lang === 'ar';
  const R = 88;
  const ring = 'هُنا · نتنفّس معًا · '.repeat(6);
  const ringSvg = K.ringText(`kr${lang}`, R, ring, { font: K.F.arDisplay, size: 15, color: 'rgba(242,236,221,0.72)', weight: 700, pad: 16 });
  const stat = (g, value, label) => `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px">${g}${isAr ? arNum(value, 30) : num(value, 34)}${isAr ? K.arLabel(label, M.mist, 12.5) : K.label(label, M.mist, 10)}</div>`;
  const rows = isAr ? ['نتائجي', 'ملخص سبتمبر', 'الإحصاءات والمتصدرون'] : ['My results', 'September recap', 'Stats & leaderboard'];
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 38% at 50% 22%, rgba(111,214,207,0.16), rgba(11,16,38,0) 70%)"></span>
${K.starfield(26, 390, 360, 71)}
<button type="button" aria-label="${isAr ? 'رجوع' : 'Back'}" style="position: absolute; ${isAr ? 'right' : 'left'}: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.08)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer; ${isAr ? 'transform: scaleX(-1)' : ''}">${icon('back', 20)}</button>
<button type="button" aria-label="${isAr ? 'الإعدادات' : 'Settings'}" style="position: absolute; ${isAr ? 'left' : 'right'}: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.08)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('settings', 20)}</button>
<div aria-hidden="true" style="position: absolute; left: ${195 - R - 16}px; top: ${210 - R - 16}px; animation: spin 90s linear infinite">${ringSvg}</div>
<div aria-hidden="true" style="position: absolute; left: ${195 - 54}px; top: ${210 - 54}px; width: 108px; height: 108px; border-radius: 999px; background: ${K.DISCS.teal.stops}; box-shadow: 0 0 36px rgba(111,214,207,0.45)">${K.pressedMark(56, K.DISCS.teal.surface)}</div>
<div style="position: absolute; left: 0; right: 0; top: 324px; display: flex; flex-direction: column; align-items: center; gap: 4px">
<span style="font-family: ${K.F.display}; font-size: 34px; color: ${M.moonlight}">noor</span>
<span style="font-size: 14.5px; color: ${M.mist}">${isAr ? 'معنا منذ سبتمبر' : 'With Houna since September'}</span>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: 420px; display: flex">
${stat(K.moon(0.3, 17, { lit: N.tone.dawn, dark: 'rgba(242,184,128,0.12)', glow: 'rgba(242,184,128,0.7)' }), 12, isAr ? 'يومًا متتاليًا' : 'Day streak')}
${stat(gem('orb', 34), 18, isAr ? 'جلسة هذا الشهر' : 'Sessions')}
${stat(gem('star', 34), 4, isAr ? 'شارات' : 'Badges')}
</div>
<div style="position: absolute; left: 16px; right: 16px; top: 560px; border-radius: 22px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); overflow: hidden">${rows.map((t, i) => `<button type="button" style="width: 100%; min-height: 56px; padding: 0 18px; border: 0; ${i < 2 ? 'border-bottom: 1px solid rgba(242,236,221,0.08);' : ''} background: none; display: flex; align-items: center; justify-content: space-between; color: ${M.moonlight}; font-size: 16px; cursor: pointer; text-align: start"><span>${t}</span><span style="color: ${M.haze}; ${isAr ? 'transform: scaleX(-1)' : ''}">${icon('next', 18)}</span></button>`).join('')}</div>
<span style="position: absolute; left: 24px; right: 24px; top: 752px; text-align: center; font-size: 13.5px; line-height: 1.5; color: ${M.haze}">${isAr ? 'الحلقة: «هُنا · نتنفّس معًا» بخط كوفي، تدور ببطء' : 'The ring reads هُنا · نتنفّس معًا, “here · we breathe together”, turning slowly.'}</span>`;
  return K.board(isAr ? 'AccountProfileAr.dc.html' : 'AccountProfile.dc.html', { title: isAr ? 'الملف الشخصي — حلقة كوفية' : 'Profile — the Kufic ring', lang, root: `background: ${M.midnight}`, body });
}

/* ── E2 · Badges as lit objects on pedestals (Opal gems) ── */
(() => {
  const css = `@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }`;
  const earned = BADGES.filter((b) => b.earned), ahead = BADGES.filter((b) => !b.earned);
  const big = (b, i) => `<div style="flex-shrink: 0; width: 138px; display: flex; flex-direction: column; align-items: center; gap: 10px">
<span style="display: block; animation: float ${5 + i}s ease-in-out ${-i * 1.3}s infinite">${gem(b.kind, 104)}</span>${pedestal(96)}
<span style="font-size: 17px; font-weight: 600; color: ${M.moonlight}">${b.en}</span>
<span style="font-size: 13px; color: ${M.haze}">Held by [N]% of Houna</span>
</div>`;
  const small = (b) => `<div style="display: flex; align-items: center; gap: 14px; padding: 10px 0">${gem(b.kind, 44, { locked: true })}<span style="flex: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15.5px; font-weight: 500; color: ${M.mist}">${b.en}</span><span style="font-size: 13.5px; color: ${M.haze}">${b.how}</span></span></div>`;
  const body = `
<div style="position: absolute; left: 24px; right: 24px; top: 60px; display: flex; justify-content: space-between; align-items: baseline">
<span style="font-family: ${K.F.display}; font-size: 32px; color: ${M.moonlight}">Badges</span>
<span style="font-size: 15px; color: ${M.mist}"><span style="font-weight: 300; font-size: 22px; color: ${M.moonlight}">4</span> of 9</span>
</div>
<div style="position: absolute; left: 0; right: 0; top: 130px; overflow: hidden"><div style="display: flex; gap: 8px; padding: 0 12px">${earned.map(big).join('')}</div></div>
<div style="position: absolute; left: 24px; right: 24px; top: 400px; display: flex; flex-direction: column">
${K.label('Still ahead', M.haze)}
<div style="margin-top: 8px; display: flex; flex-direction: column">${ahead.map(small).join('')}</div>
</div>`;
  out.push(K.board('AccountGems.dc.html', { title: 'Badges — lit objects on pedestals', root: `background: radial-gradient(90% 40% at 50% 20%, #151C45 0%, ${M.midnight} 70%)`, css, body }));
})();

/* ── E3 · Mosaic: the nine badges are the nine tiles of one khatam ── */
(() => {
  const cx = 195, cy = 330, R = 150;
  // A deeper eight-point star than the two-square khatam, so the eight point tiles are as easy to tap as the centre.
  const inner = R * 0.5;
  const P = Array.from({ length: 16 }, (_, i) => { const a = ((i * 22.5 - 90) * Math.PI) / 180; const r = i % 2 ? inner : R; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  const f = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const tiles = [{ pts: [1, 3, 5, 7, 9, 11, 13, 15].map((i) => P[i]) }];
  for (let k = 0; k < 8; k++) tiles.push({ pts: [P[(2 * k + 15) % 16], P[2 * k], P[2 * k + 1]] });
  const order = ['first_session', 'streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_100', 'all_breathing', 'all_scenes', 'all_skies'];
  const B = order.map((c) => BADGES.find((b) => b.code === c));
  const centroid = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  const svg = tiles.map((t, k) => { const b = B[k]; return `<polygon points="${t.pts.map(f).join(' ')}" fill="${b.earned ? `url(#mt${k})` : 'rgba(242,236,221,0.03)'}" stroke="{{s${k}}}" stroke-width="{{w${k}}}" stroke-linejoin="round" style="transition: stroke 300ms ease"></polygon>`; }).join('');
  const defs = B.map((b, k) => `<radialGradient id="mt${k}" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.85"></stop><stop offset="0.5" stop-color="${b.tone}" stop-opacity="0.85"></stop><stop offset="1" stop-color="${b.tone}" stop-opacity="0.35"></stop></radialGradient>`).join('');
  const buttons = tiles.map((t, k) => { const [x, y] = centroid(t.pts); return `<button type="button" onClick="{{pick${k}}}" aria-label="${B[k].en}" style="position: absolute; left: ${(x - 24).toFixed(1)}px; top: ${(y - 24).toFixed(1)}px; width: 48px; height: 48px; border: 0; padding: 0; border-radius: 999px; background: none; cursor: pointer"></button>`; }).join('');
  const info = B.map((b) => ({ name: b.en, how: b.earned ? `Lit · ${b.how}` : b.how }));
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(60% 40% at 50% 40%, rgba(179,167,245,0.14), rgba(11,16,38,0) 70%)"></span>
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 8px">
${K.label('Badges', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 30px; color: ${M.moonlight}">One star, nine tiles</span>
</div>
<svg width="390" height="600" viewBox="0 0 390 600" aria-hidden="true" style="position: absolute; left: 0; top: 0; filter: drop-shadow(0 0 18px rgba(179,167,245,0.35))"><defs>${defs}</defs>${svg}</svg>
${buttons}
<div style="position: absolute; left: 16px; right: 16px; top: 540px; padding: 18px; border-radius: 22px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); display: flex; flex-direction: column; gap: 6px">
<span style="font-size: 18px; font-weight: 600; color: ${M.moonlight}">{{name}}</span>
<span style="font-size: 14.5px; color: ${M.mist}">{{how}}</span>
</div>
<span style="position: absolute; left: 24px; right: 24px; top: 660px; font-size: 14.5px; line-height: 1.5; color: ${M.mist}">Each badge you earn lights one tile of the eight-point star. The centre is your first breath; the points are the streaks and the things you try. All nine complete the star.</span>
<span style="position: absolute; left: 24px; top: 760px; font-size: 15px; color: ${M.moonlight}"><span style="font-weight: 300; font-size: 22px">4</span> of 9 lit</span>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 0 };
  }
  renderVals() {
    const info = ${JSON.stringify(info)};
    const s = this.state.sel, v = { name: info[s].name, how: info[s].how };
    for (let k = 0; k < 9; k++) {
      v['s' + k] = k === s ? '${M.moonlight}' : 'rgba(242,236,221,0.28)';
      v['w' + k] = k === s ? 2.5 : 1;
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(K.board('AccountMosaic.dc.html', { title: 'Badges — the khatam mosaic', root: `background: ${M.midnight}`, body, logic }));
})();

/* ── E4 · The unlock moment: blur in, the badge rises with a bloom ── */
(() => {
  const PARTS = 14;
  const css = ['A', 'B'].map((x) => `
@keyframes veil${x} { from { opacity: 0; backdrop-filter: blur(0px) } to { opacity: 1; backdrop-filter: blur(14px) } }
@keyframes badge${x} { 0% { opacity: 0; transform: translateY(70px) scale(0.6) } 60% { opacity: 1; transform: translateY(-6px) scale(1.04) } 100% { opacity: 1; transform: none } }
@keyframes bloom${x} { 0% { opacity: 0; transform: scale(0.4) } 50% { opacity: 1 } 100% { opacity: 0.55; transform: scale(1.3) } }
@keyframes up${x} { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
${Array.from({ length: PARTS }, (_, i) => { const a = (i / PARTS) * 2 * Math.PI; const d = 110 + (i % 3) * 30; return `@keyframes p${i}${x} { 0% { opacity: 0; transform: translate(0,0) scale(1) } 20% { opacity: 1 } 100% { opacity: 0; transform: translate(${(Math.cos(a) * d).toFixed(0)}px, ${(Math.sin(a) * d).toFixed(0)}px) scale(0.3) } }`; }).join('\n')}`).join('') + `\n@keyframes ringTurn { to { transform: rotate(360deg) } }`;
  const parts = Array.from({ length: PARTS }, (_, i) => `<span style="position: absolute; left: ${195 - 3}px; top: ${330 - 3}px; width: 6px; height: 6px; border-radius: 999px; background: ${[N.tone.dawn, M.moonlight, N.tone.bloom][i % 3]}; box-shadow: 0 0 8px ${N.tone.dawn}; animation: p${i}{{x}} 1.6s cubic-bezier(.2,.7,.3,1) 1s both"></span>`).join('');
  const body = `
<span style="position: absolute; left: 70px; top: 120px; width: 250px; height: 250px; border-radius: 999px; background: ${K.DISCS.teal.stops}; opacity: 0.5; filter: blur(8px)"></span>
<span style="position: absolute; left: 20px; right: 20px; top: 460px; height: 70px; border-radius: 20px; background: rgba(242,236,221,0.08)"></span>
<span style="position: absolute; left: 20px; right: 20px; top: 550px; height: 170px; border-radius: 20px; background: rgba(242,236,221,0.06)"></span>
<span style="position: absolute; inset: 0; background: rgba(11,16,38,0.55); animation: veil{{x}} 700ms ease both"></span>
<span style="position: absolute; left: 45px; top: 180px; width: 300px; height: 300px; border-radius: 999px; background: radial-gradient(closest-side, rgba(249,169,128,0.6), rgba(249,169,128,0)); animation: bloom{{x}} 1.6s ease-out 0.9s both"></span>
${parts}
<div style="position: absolute; left: ${195 - 80}px; top: ${330 - 80}px; animation: badge{{x}} 1.1s cubic-bezier(.2,.8,.2,1) 0.5s both">${gem('sun', 160)}</div>
<div style="position: absolute; left: 0; right: 0; top: 470px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
<span style="animation: up{{x}} 700ms ease 1.6s both">${K.label('New badge', N.tone.dawn)}</span>
<span style="font-family: ${K.F.display}; font-size: 40px; color: ${M.moonlight}; animation: up{{x}} 700ms ease 1.8s both">Sunrise</span>
<span style="font-size: 16px; line-height: 1.5; color: ${M.mist}; max-width: 280px; animation: up{{x}} 700ms ease 2s both">Seven days in a row. The sun is up.</span>
</div>
<div style="position: absolute; left: 60px; right: 60px; top: 700px; height: 58px; animation: up{{x}} 700ms ease 2.3s both">
<span aria-hidden="true" style="position: absolute; inset: -2px; border-radius: 999px; overflow: hidden"><span style="position: absolute; left: 50%; top: 50%; width: 420px; height: 420px; margin: -210px 0 0 -210px; background: conic-gradient(${N.tone.dawn}, ${N.tone.bloom}, ${N.tone.dusk}, ${N.tone.glow}, ${N.tone.dawn}); animation: ringTurn 4s linear infinite"></span></span>
<button type="button" style="position: absolute; inset: 0; border-radius: 999px; border: 0; background: ${M.moonlight}; color: ${M.midnight}; font-size: 17px; font-weight: 600; box-shadow: 0 0 30px rgba(242,184,128,0.45); cursor: pointer">Lovely</button>
</div>
<button type="button" onClick="{{replay}}" aria-label="Replay" style="position: absolute; right: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('replay', 20)}</button>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { n: 0 };
  }
  renderVals() {
    return { x: this.state.n % 2 ? 'B' : 'A', replay: () => this.setState({ n: this.state.n + 1 }) };
  }
}`;
  out.push(K.board('AccountUnlock.dc.html', { title: 'Badges — the unlock moment', root: `background: ${M.midnight}`, css, body, logic }));
})();

/* ── E5 · Week orbit (Oura): the streak as one big light numeral over the week's real moons ── */
(() => {
  const days = Array.from({ length: 7 }, (_, i) => new Date(K.TODAY.getTime() - (6 - i) * DAY));
  const done = [true, true, true, true, true, true, true];
  const cx = 195, cy = 250, R = 170;
  const dot = (d, i) => {
    const a = ((160 - i * (140 / 6)) * Math.PI) / 180;
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const today = i === 6;
    return `<div style="position: absolute; left: ${(x - 22).toFixed(1)}px; top: ${(y - 22).toFixed(1)}px; width: 44px; height: 70px; display: flex; flex-direction: column; align-items: center; gap: 8px">
<span style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center">${today ? `<span style="position: absolute; inset: -2px; border-radius: 999px; border: 1px solid rgba(242,236,221,0.35)"></span><span style="position: absolute; inset: -2px; animation: spin 6s linear infinite"><span style="position: absolute; left: 20px; top: -3px; width: 6px; height: 6px; border-radius: 999px; background: ${M.moonlight}; box-shadow: 0 0 8px ${M.moonlight}"></span></span>` : ''}${K.moon(K.phaseOf(d), 13, done[i] ? { lit: M.moonlight, dark: 'rgba(242,236,221,0.1)', glow: 'rgba(242,236,221,0.45)' } : { lit: 'rgba(242,236,221,0.2)', dark: 'rgba(242,236,221,0.05)' })}</span>
${K.label(new Intl.DateTimeFormat('en-GB', { weekday: 'narrow' }).format(d), today ? M.moonlight : M.haze, 11)}
</div>`;
  };
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 40% at 50% 30%, rgba(242,236,221,0.07), rgba(11,16,38,0) 70%)"></span>
<div style="position: absolute; left: 0; right: 0; top: 150px; display: flex; flex-direction: column; align-items: center; gap: 6px">
${num(12, 150)}
<span style="font-family: ${K.F.display}; font-size: 24px; color: ${M.mist}">days in a row</span>
</div>
${days.map(dot).join('')}
<span style="position: absolute; left: 0; right: 0; top: 520px; text-align: center; font-size: 14.5px; color: ${M.mist}">This week's moons. Each one lit is a day you practised.</span>
<div style="position: absolute; left: 16px; right: 16px; top: 580px; display: flex; gap: 10px">
<div style="flex: 1; padding: 18px; border-radius: 22px; background: rgba(242,236,221,0.045); display: flex; flex-direction: column; gap: 10px">${K.label('Longest', M.haze)}${num(30, 38)}</div>
<div style="flex: 1; padding: 18px; border-radius: 22px; background: rgba(242,236,221,0.045); display: flex; flex-direction: column; gap: 10px">${K.label('This week', M.haze)}<span style="display: flex; align-items: baseline; gap: 6px">${num(47, 38)}<span style="font-size: 14px; color: ${M.mist}">min</span></span></div>
</div>
<span style="position: absolute; left: 24px; right: 24px; top: 730px; text-align: center; font-size: 13.5px; line-height: 1.5; color: ${M.haze}">Streaks count breathing and meditation only, never mood.</span>`;
  out.push(K.board('AccountWeekOrbit.dc.html', { title: 'Progress — the week in moons', root: `background: ${M.midnight}`, body }));
})();

/* ── E6 · Your sky: a star for each day you practised, joined as you go ── */
(() => {
  let seed = 23;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const DAYS = [1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27];
  const S = DAYS.map((d, i) => ({ d, x: 30 + (i / (DAYS.length - 1)) * 330, y: 470 - (i / (DAYS.length - 1)) * 250 + Math.sin(i * 1.7) * 38 + (rnd() - 0.5) * 24 }));
  const path = S.map((s, i) => `${i ? 'L' : 'M'}${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join(' ');
  const last = S[S.length - 1], prev = S[S.length - 2];
  const seg = Math.hypot(last.x - prev.x, last.y - prev.y);
  const css = `@keyframes newLine { 0%,30% { stroke-dashoffset: ${seg.toFixed(1)} } 70%,100% { stroke-dashoffset: 0 } }
@keyframes newStar { 0%,55% { opacity: 0; transform: scale(0.2) } 75% { opacity: 1; transform: scale(1.4) } 100% { opacity: 1; transform: scale(1) } }`;
  const info = S.map((s) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(2026, 8, s.d)));
  const star = (s, k) => { const isLast = k === S.length - 1; return `<button type="button" onClick="{{pick${k}}}" aria-label="${info[k]}" style="position: absolute; left: ${(s.x - 20).toFixed(1)}px; top: ${(s.y - 20).toFixed(1)}px; width: 40px; height: 40px; border: 0; padding: 0; background: none; cursor: pointer"><span style="position: absolute; left: ${isLast ? 13 : 16}px; top: ${isLast ? 13 : 16}px; width: ${isLast ? 14 : 8}px; height: ${isLast ? 14 : 8}px; border-radius: 999px; background: {{c${k}}}; box-shadow: 0 0 ${isLast ? 18 : 10}px {{g${k}}}; ${isLast ? 'animation: newStar 4s ease infinite' : ''}"></span></button>`; };
  const body = `
${K.starfield(70, 390, 844, 81, '182,186,214')}
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 8px">
${K.label('Your sky · September', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 30px; color: ${M.moonlight}">${DAYS.length} stars so far</span>
<span style="font-size: 15px; line-height: 1.5; color: ${M.mist}">One for each day you practised. Tonight's joins the rest.</span>
</div>
<svg width="390" height="844" viewBox="0 0 390 844" aria-hidden="true" style="position: absolute; inset: 0"><path d="${S.slice(0, -1).map((s, i) => `${i ? 'L' : 'M'}${s.x.toFixed(1)} ${s.y.toFixed(1)}`).join(' ')}" fill="none" stroke="rgba(111,214,207,0.4)" stroke-width="1"></path><line x1="${prev.x.toFixed(1)}" y1="${prev.y.toFixed(1)}" x2="${last.x.toFixed(1)}" y2="${last.y.toFixed(1)}" stroke="${N.tone.glow}" stroke-width="1.4" stroke-dasharray="${seg.toFixed(1)}" style="animation: newLine 4s ease infinite"></line></svg>
${S.map(star).join('')}
<div style="position: absolute; left: 16px; right: 16px; top: 640px; padding: 18px; border-radius: 22px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); font-size: 16px; color: ${M.moonlight}">{{day}}</div>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: ${S.length - 1} };
  }
  renderVals() {
    const info = ${JSON.stringify(info)};
    const s = this.state.sel, v = { day: info[s] };
    for (let k = 0; k < ${S.length}; k++) {
      v['c' + k] = k === s ? '${N.tone.glow}' : '${M.moonlight}';
      v['g' + k] = k === s ? 'rgba(111,214,207,0.9)' : 'rgba(242,236,221,0.55)';
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(K.board('AccountSky.dc.html', { title: 'Progress — your sky', root: `background: ${M.midnight}`, css, body, logic }));
})();

/* ── E7 · Celestial avatars (Dusk): no photo needed ── */
(() => {
  const disc = (d, size, markSize) => `<span style="position: relative; display: block; width: ${size}px; height: ${size}px; border-radius: 999px; background: ${d.stops}; box-shadow: 0 0 ${size * 0.2}px rgba(${d.glow},0.5)">${markSize ? K.pressedMark(markSize, d.surface) : ''}</span>`;
  const onDark = (inner, size) => `<span style="position: relative; display: flex; align-items: center; justify-content: center; width: ${size}px; height: ${size}px; border-radius: 999px; background: ${M.nightfall}">${inner}</span>`;
  const OPTS = [
    { name: 'Sunrise sun', draw: (s) => disc(K.DISCS.sunrise, s, s * 0.5) },
    { name: 'Evening sun', draw: (s) => disc(K.DISCS.dusk, s, s * 0.5) },
    { name: 'Teal moon', draw: (s) => disc(K.DISCS.teal, s, s * 0.5) },
    { name: 'Silver moon', draw: (s) => disc(K.DISCS.silver, s, s * 0.5) },
    { name: 'Crescent', draw: (s) => onDark(K.moon(0.13, s * 0.36, { lit: M.moonlight, dark: 'rgba(242,236,221,0.08)' }), s) },
    { name: 'Half moon', draw: (s) => onDark(K.moon(0.25, s * 0.36, { lit: M.moonlight, dark: 'rgba(242,236,221,0.08)' }), s) },
    { name: 'Star', draw: (s) => onDark(gem('star', s * 0.8), s) },
    { name: 'Arch', draw: (s) => onDark(gem('arch', s * 0.8), s) },
    { name: 'Initial', draw: (s) => `<span style="display: flex; align-items: center; justify-content: center; width: ${s}px; height: ${s}px; border-radius: 999px; background: ${D.accent}; color: #FFFFFF; font-family: ${K.F.display}; font-size: ${s * 0.44}px">N</span>` },
  ];
  const previews = OPTS.map((o, k) => `<div aria-hidden="{{h${k}}}" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: {{o${k}}}; transform: scale({{z${k}}}); transition: opacity 500ms ease, transform 600ms cubic-bezier(.3,1.3,.5,1)">${o.draw(128)}</div>`).join('');
  const cell = (o, k) => `<button type="button" onClick="{{pick${k}}}" aria-label="${o.name}" aria-pressed="{{p${k}}}" style="position: relative; height: 100px; border-radius: 24px; border: 2px solid {{b${k}}}; background: #FFFFFF; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 300ms ease">${o.draw(64)}</button>`;
  const body = `
<button type="button" aria-label="Back" style="position: absolute; left: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; background: #FFFFFF; border: 1px solid ${D.line}; display: flex; align-items: center; justify-content: center; color: ${D.text}; cursor: pointer">${icon('back', 20)}</button>
<div style="position: absolute; left: 0; right: 0; top: 110px; height: 150px">${previews}</div>
<div style="position: absolute; left: 0; right: 0; top: 272px; display: flex; flex-direction: column; align-items: center; gap: 4px">
<span style="font-family: ${K.F.display}; font-size: 28px; color: ${D.text}">noor</span>
<span style="font-size: 15px; color: ${D.sec}">{{name}}</span>
</div>
<div style="position: absolute; left: 20px; right: 20px; top: 356px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px">${OPTS.map(cell).join('')}</div>
<button type="button" style="position: absolute; left: 24px; right: 24px; top: 756px; height: 56px; border-radius: 999px; border: 0; background: ${D.accent}; color: #FFFFFF; font-size: 17px; font-weight: 600; cursor: pointer">Use this</button>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 2 };
  }
  renderVals() {
    const names = ${JSON.stringify(OPTS.map((o) => o.name))};
    const s = this.state.sel, v = { name: names[s] };
    for (let k = 0; k < names.length; k++) {
      v['o' + k] = s === k ? 1 : 0;
      v['z' + k] = s === k ? 1 : 0.85;
      v['h' + k] = s === k ? 'false' : 'true';
      v['p' + k] = s === k ? 'true' : 'false';
      v['b' + k] = s === k ? '${D.text}' : '${D.line}';
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(K.board('AccountAvatars.dc.html', { title: 'Profile — celestial avatars (Dusk)', root: `background: ${D.ground}`, body, logic }));
})();

out.unshift(profile('en'));
out.push(profile('ar'));
module.exports = out;
if (require.main === module) console.log(out.map((b) => b.file).join('\n'));
