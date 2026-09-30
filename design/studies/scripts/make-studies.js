// "Houna — Design studies" (https://claude.ai/artifact/5DqkLLhgEWF1bS4vFcf7EL): six visual questions
// explored as variants before anything is built. A · the Sunrise scene's glow; B · two different
// suns; C · Classic Home with the Kufic ring; D · a calmer Home date; E · the mark imprinted on plain
// pages; F · a new moon; G · the Dusk sun, on Home and in its scene; H · Recap's moods slide; I · the
// badges and Profile's icons (rows H and I live in study-hi.js). Built from the Explorations kit and the app's own values, so the boards
// match the app. `node design/studies/scripts/make-studies.js` writes every board and canvas.json.
const fs = require('fs');
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const { mark, halo: markHalo } = require('../../canvas/scripts/make-appicons.js');
const MAP = require('../../canvas/scripts/map-data.json');

const ROOT = path.join(__dirname, '..', '..', '..');
const DIR = path.join(__dirname, '..', 'project');
fs.mkdirSync(DIR, { recursive: true });
const M = K.NIGHT;
const THEMES = ['sunrise', 'dusk', 'night'].map((k) => ({ ...K.T[k], dark: k === 'night' }));
const [TS, TD, TN] = THEMES;
const ANCHOR = 199; // layout.markAnchor: the mark's centre on every screen
const KUFIC = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'constants/kuficRing.ts'), 'utf8');
  return { d: src.match(/d: '([^']*)'/)[1], box: Number(src.match(/box: (\d+)/)[1]) };
})();
const out = [];

/* ── A row of phones, captions beneath ── */
const PW = 390, PH = 844, PAD = 40, GAP = 40;
function row(file, { title, phones, css = '', logic, capH = 110 }) {
  const W = PAD * 2 + phones.length * PW + (phones.length - 1) * GAP, H = PAD + PH + capH;
  const body = phones
    .map((p, i) => {
      const [name, ...rest] = p.caption.split(' · ');
      return `<div${p.ar ? ' dir="rtl"' : ''} style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; background: ${p.bg || p.T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); font-family: ${p.ar ? K.F.arBody : K.F.body}; color: ${p.T.text}">${p.html}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${name}</span>${rest.length ? `<span style="font-size: 13px; line-height: 1.45; color: ${M.mist}">${rest.join(' · ')}</span>` : ''}</div>`;
    })
    .join('\n');
  const b = K.board(file, { title, w: W, h: H, root: 'background: #070B1C', css, body, logic, dir: DIR });
  out.push(b);
  return b;
}
const lab = (t, color, ar, size = 11) => (ar ? K.arLabel(t, color, size + 2) : K.label(t, color, size));
const at = (cx, cy, d, inner, style = '') => `<div aria-hidden="true" style="position: absolute; left: ${cx - d / 2}px; top: ${cy - d / 2}px; width: ${d}px; height: ${d}px; ${style}">${inner}</div>`;
/** The mark centred in its box (make-appicons' mark centres itself). */
const markIn = (size, fill, style = '') => `<div style="position: relative; width: ${size}px; height: ${size}px; ${style}">${mark(size, fill)}</div>`;
const BREATH = `@keyframes breath5 { 0%,100% { transform: scale(0.97); opacity: 0.7 } 50% { transform: scale(1.03); opacity: 1 } }`;
const SPIN = `@keyframes spinCw { to { transform: rotate(360deg) } } @keyframes spinCcw { to { transform: rotate(-360deg) } }`;

/* ── The tab bar and the parts of Home (the app today, at 390, no status inset) ── */
const tabBar = (T, ar, on = 0) => {
  const names = ar ? ['الرئيسية', 'الدليل', 'تنفّس', 'الفعاليات', 'المزيد'] : ['Home', 'Directory', 'Tanafas', 'Events', 'More'];
  const tab = (label, k) =>
    k === 2
      ? `<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; color: ${T.ter}"><span style="margin-top: -30px; width: 56px; height: 56px; border-radius: 999px; background: ${T.raised}; box-shadow: 0 0 0 6px ${T.ground}, 0 0 28px rgba(59,170,167,0.4)"></span>${label}</span>`
      : `<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; font-weight: ${k === on ? 600 : 400}; color: ${k === on ? T.tabOn : T.ter}"><span style="width: 22px; height: 22px; border-radius: 6px; border: 1.6px solid currentColor; box-sizing: border-box"></span>${label}</span>`;
  return `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 76px; background: ${T.tab}; border-top: 1px solid ${T.tabLine}; display: flex; align-items: flex-start; padding-top: 10px; box-sizing: border-box">${names.map(tab).join('')}</div>`;
};
const hijri = (ar) => (ar ? K.hijri(K.TODAY, 'ar').replace(/ هـ$/, '') : K.hijri(K.TODAY));
const phaseWord = (ar) => (ar ? 'بدر' : 'Full moon');
const moonDot = (T, r = 7) => K.moon(K.phaseOf(K.TODAY), r, { lit: T.dark ? M.moonlight : T.accent, dark: T.dark ? 'rgba(242,236,221,0.16)' : `rgba(${K.rgbOf(T.accent)},0.16)` });
const mapSvg = (T, w) => {
  const h = +(MAP.height * (w / MAP.width)).toFixed(1);
  const kw = MAP.markers.find((m) => m[0] === 'KW');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${MAP.width} ${MAP.height}" aria-hidden="true" style="display: block"><path d="${MAP.path}" fill="${T.dark ? 'rgba(242,236,221,0.14)' : 'rgba(27,33,64,0.10)'}" fill-rule="evenodd"></path><circle cx="${kw[1]}" cy="${kw[2]}" r="1.3" fill="${T.accent}" style="filter: drop-shadow(0 0 2px ${T.accent})"></circle></svg>`;
};
/**
 * Home as the app draws it today (the map without its card). `date`: where the Hijri date goes
 * ('chip' today; 'line', 'arc', 'map', 'glyph', 'under', 'none'); `hero`: the body's markup, drawn in
 * a 190 box centred on the anchor.
 */
function home(T, { ar = false, date = 'chip', hero = '' } = {}) {
  const text = T.text, sec = T.sec;
  const d = hijri(ar), p = phaseWord(ar);
  const button = (side, inner) => `<span style="position: absolute; ${side}: 16px; top: 16px; width: 44px; height: 44px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; justify-content: center">${inner}</span>`;
  const strip = `<div style="position: absolute; left: 0; right: 0; top: 12px; display: flex; justify-content: center; gap: 12px">${[0, 1, 2].map((k) => `<span style="width: 10px; height: 10px; border-radius: 999px; border: 1.4px solid ${k === 1 ? T.accent : T.ter}; box-sizing: border-box; opacity: ${k === 1 ? 1 : 0.5}"></span>`).join('')}</div>`;
  const chip = `<span style="position: absolute; left: 50%; top: 66px; transform: translateX(-50%); height: 28px; padding: 0 12px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; gap: 8px; white-space: nowrap; font-size: ${ar ? 13 : 12.5}px; color: ${text}">${moonDot(T)}<span style="font-weight: 600">${d}</span><span style="color: ${sec}">${p}</span></span>`;
  const line = `<span style="position: absolute; left: 0; right: 0; top: 72px; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: ${ar ? 13 : 12.5}px; color: ${sec}; white-space: nowrap">${moonDot(T, 4)}<span>${d} · ${p}</span></span>`;
  const glyph = `<span style="position: absolute; left: ${195 - 14}px; top: 66px; width: 28px; height: 28px; border-radius: 999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 1px ${T.ctrlLine}">${moonDot(T, 6)}</span>`;
  const arcId = `arc${T.key}${ar ? 'a' : ''}`;
  const arc = `<svg width="390" height="340" viewBox="0 0 390 340" aria-hidden="true" style="position: absolute; left: 0; top: ${ANCHOR - 170}px; overflow: visible"><defs><path id="${arcId}" d="M ${195 - 112} 170 A 112 112 0 0 0 ${195 + 112} 170"></path></defs><text font-family="${(ar ? K.F.arBody : K.F.mono).replace(/"/g, "'")}" font-size="${ar ? 13 : 11}" letter-spacing="${ar ? 0 : 2}" fill="${sec}" text-anchor="middle"><textPath href="#${arcId}" startOffset="50%">${ar ? `${d} · ${p}` : `${d.toUpperCase()} · ${p.toUpperCase()}`}</textPath></text></svg>`;
  const under = `<span style="position: absolute; left: 0; right: 0; top: ${ANCHOR + 104}px; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: ${ar ? 13 : 12.5}px; color: ${sec}">${moonDot(T, 4)}<span>${d} · ${p}</span></span>`;
  const heroTop = date === 'under' || date === 'arc' ? 336 : 300;
  const mapTop = heroTop + 88;
  const mapCaption = date === 'map' ? `<span style="position: absolute; ${ar ? 'right' : 'left'}: 16px; top: ${mapTop + 150}px; display: flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: 999px; background: ${T.dark ? 'rgba(11,16,38,0.6)' : 'rgba(255,255,255,0.7)'}; font-size: 12px; color: ${text}">${moonDot(T, 4)}${ar ? `الليلة · ${d}` : `Tonight · ${d}`}</span>` : '';
  const strings = ar
    ? { alone: 'لست وحدك', line: 'كل نفَس هنا يشاركك فيه أحدٌ ما، في مكانٍ ما.', together: 'نتنفّس معًا', periods: ['٢٤ ساعة', 'أسبوع', 'شهر'], count: 'شخص تنفّس وتأمّل مع هُنا هذا الأسبوع', country: 'في دولة واحدة', crisis: 'تحتاج إلى التحدث الآن؟' }
    : { alone: "You're not alone", line: 'Small pauses, taken together, change a day.', together: 'Breathing together', periods: ['24H', 'Week', 'Month'], count: 'person breathed and meditated with Houna this week', country: 'In 1 country', crisis: 'Need to talk now?' };
  return `${T.dark ? K.starfield(40, 390, 700, 13) : ''}
<span aria-hidden="true" style="position: absolute; left: -10px; right: -10px; top: 40px; height: 330px; background: radial-gradient(50% 50% at 50% 50%, rgba(${K.rgbOf(T.hue.glow)},${T.dark ? 0.12 : 0.1}), rgba(0,0,0,0) 70%)"></span>
${button('left', `<span style="width: 18px; height: 18px; border-radius: 999px; border: 2px solid ${T.accent}; box-sizing: border-box"></span>`)}${button('right', `<span style="width: 16px; height: 16px; border-radius: 999px; border: 1.6px solid ${sec}; box-sizing: border-box"></span>`)}
${strip}
<div style="position: absolute; left: ${195 - 36}px; top: 28px">${K.logo(T.logoP, T.logoS, 72)}</div>
${date === 'chip' ? chip : date === 'line' ? line : date === 'glyph' ? glyph : ''}
${at(195, ANCHOR, 190, hero)}
${date === 'arc' ? arc : date === 'under' ? under : ''}
<div style="position: absolute; left: 24px; right: 24px; top: ${heroTop}px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
${lab(`● ${strings.alone}`, T.accent, ar, 11)}
<span style="font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700;' : ''} font-size: ${ar ? 21 : 20}px; line-height: 1.35; color: ${text}">${strings.line}</span>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: ${mapTop}px; display: flex; justify-content: space-between; align-items: center">${lab(strings.together, T.ter, ar, 10)}<span style="display: flex; padding: 3px; border-radius: 999px; background: ${T.ctrl}; gap: 2px">${strings.periods.map((x, k) => `<span style="padding: 5px 11px; border-radius: 999px; font-size: 11px; ${k === 1 ? `background: ${T.dark ? M.moonlight : T.text}; color: ${T.ground}` : `color: ${sec}`}">${x}</span>`).join('')}</span></div>
<div style="position: absolute; left: 16px; top: ${mapTop + 36}px">${mapSvg(T, 358)}</div>
${mapCaption}
<div style="position: absolute; left: 16px; right: 16px; top: ${mapTop + 222}px; display: flex; align-items: center; gap: 12px"><span style="font-family: ${K.F.body}; font-weight: 300; font-size: 36px; line-height: 1; color: ${T.accent}">1</span><span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 13px; color: ${text}">${strings.count}</span>${lab(strings.country, T.ter, ar, 10)}</span></div>
<span style="position: absolute; left: 50%; top: ${Math.min(mapTop + 290, 724)}px; transform: translateX(-50%); padding: 8px 16px; border-radius: 999px; background: rgba(${T.crisis},0.08); border: 1px solid rgba(${T.crisis},0.4); font-size: 13px; color: ${text}; white-space: nowrap">${strings.crisis}</span>
${tabBar(T, ar, 0)}`;
}
/** Night's crescent bowl, the mark resting in it (its hollow), in a 190 box. */
const bowl = (id) => `<svg width="190" height="190" viewBox="0 0 240 240" style="position: absolute; inset: 0; overflow: visible; filter: drop-shadow(0 0 18px rgba(242,184,128,0.4))"><defs><radialGradient id="bowl${id}" cx="50%" cy="72%" r="60%"><stop offset="0" stop-color="#FFD9A0"></stop><stop offset="0.55" stop-color="${K.T.night.tone.dawn}"></stop><stop offset="1" stop-color="#E4826A"></stop></radialGradient><mask id="cup${id}"><rect width="240" height="240" fill="#fff"></rect><circle cx="120" cy="58" r="118" fill="#000"></circle></mask></defs><circle cx="120" cy="120" r="112" fill="url(#bowl${id})" mask="url(#cup${id})"></circle></svg>${at(95, 117, 32, markIn(32, M.moonlight))}`;

/* ══════════ 0 · Direction ══════════ */
(() => {
  const ROWS = [
    ['A · The Sunrise scene’s glow', 'The turning star lattice sits oddly on the sunglow. Six ways to make the geometry and the light one thing, most of them breathing.'],
    ['B · Two different suns', 'Sunrise’s and Dusk’s suns are both peach. Four pairs that tell morning from evening at a glance, each with its stops written for theme.ts.'],
    ['C · Classic Home, the Kufic ring', 'The words from Profile (هُنا · نتنفّس معًا) circling the mark in place of the ring of dots. Four ways, in the three themes.'],
    ['D · A calmer Home date', 'The Hijri chip crowds the top of Home. Five quieter places for it, now the map has no card; each still opens the month of moons.'],
    ['E · The mark on plain pages', 'The Directory and Events have no art of their own. Five ways to imprint the mark very faintly behind them, by night and by day.'],
    ['F · A new moon', 'A better moon for the starfield, the mark pressed in, tonight’s real phase kept. Five surfaces beside today’s teal disc.'],
    ['G · The Dusk sun', 'Dusk’s sun is a plain amber disc beside Sunrise’s turning stars and Night’s bowl. Twelve ways to give it its own (two rows of six or seven), each drawn on Home and in its Tanafas scene.'],
    ['H · Your emotional landscape', 'Recap’s moods slide shows the month’s feelings as a few glossy balls. Six gentler landscapes of them (a sky, hills, a nebula, the month of moons, a woven panel, an aurora), in Night, four in Arabic. No scores, no good or bad.'],
    ['I · Badges and Profile’s icons', 'Five directions for the nine badges and Profile’s three number icons, beside today’s gems: pearl moons, constellations, khatam tiles, an orrery, the mark itself. Each in Night and a light theme, earned and not yet.'],
  ];
  const body = `<div style="position: absolute; inset: 0; padding: 72px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 16px">${K.label('Houna · design studies', '#6FD6CF', 12)}
<span style="font-family: ${K.F.display}; font-size: 64px; line-height: 1.05; color: ${M.moonlight}">Nine questions, in variants</span>
<span style="max-width: 1040px; font-size: 17px; line-height: 1.55; color: ${M.mist}">Each row below is one question, every phone one answer, most of them moving. Nothing here is in the app yet. Pick by selecting the boards you like (or comment on one: “this, but slower”), and it goes to the Houna Redesign canvas, then the app, as before. Numbers, colours and sizes are the app’s own.</span></div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px">${ROWS.map(([t, d]) => `<div style="padding: 24px; border-radius: 22px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); display: flex; flex-direction: column; gap: 10px"><span style="font-size: 18px; font-weight: 600; color: ${M.moonlight}">${t}</span><span style="font-size: 14.5px; line-height: 1.55; color: ${M.mist}">${d}</span></div>`).join('')}</div>
<span style="font-size: 14.5px; line-height: 1.55; color: ${M.haze}">The sky clock (phase 3) was taken out of the app on 28 Sep 2026, with its long press on Home’s mark.</span>
</div>`;
  out.push(K.board('Main.dc.html', { title: 'Houna — design studies', w: 1400, h: 980, root: `background: ${M.midnight}`, body, dir: DIR }));
})();

/* ══════════ A · The Sunrise scene's glow ══════════ */
(() => {
  const SKY = 'linear-gradient(180deg, #A9DDE0 0%, #DDF1EF 38%, #FCE7D8 74%, #FBC9A6 100%)';
  const DISC = 104; // the settled sun (the scene's 0.9 of Home's mark box, as drawn on Home)
  const R = DISC / 2;
  const STARS = [
    { k: 3.08, rot: 0, pair: 0, deep: true, w: 1.3, o: 0.55 },
    { k: 2.46, rot: 22.5, pair: 0, deep: false, w: 1, o: 0.5 },
    { k: 3.77, rot: 11.25, pair: 1, deep: false, w: 1, o: 0.4 },
    { k: 1.92, rot: 33.75, pair: 1, deep: true, w: 1.2, o: 0.5 },
  ];
  const coral = '#E8582C', peach = '#F9A980';
  const BOX = 480, C = BOX / 2;
  const stars = (pair, { width = 1, color, blur = 0 } = {}) =>
    `<svg width="${BOX}" height="${BOX}" viewBox="0 0 ${BOX} ${BOX}" aria-hidden="true" style="position: absolute; inset: 0; overflow: visible; ${blur ? `filter: blur(${blur}px)` : ''}">${STARS.filter((s) => s.pair === pair)
      .map((s) => `<polygon points="${K.star8(C, C, R * s.k, s.rot)}" fill="none" stroke="${color || (s.deep ? coral : peach)}" stroke-opacity="${s.o}" stroke-width="${s.w * width}" stroke-linejoin="round"></polygon>`)
      .join('')}</svg>`;
  const lattice = (opts = {}, style = '') =>
    at(195, ANCHOR, BOX, `<div style="position: absolute; inset: 0; animation: spinCw 90s linear infinite">${stars(0, opts)}</div><div style="position: absolute; inset: 0; animation: spinCcw 120s linear infinite">${stars(1, opts)}</div>`, style);
  const glow = (strength = 0.45, anim = true) => at(195, ANCHOR, 460, '', `border-radius: 999px; background: radial-gradient(closest-side, rgba(249,169,128,${strength}), rgba(249,169,128,0)); ${anim ? 'animation: breath5 5s ease-in-out infinite' : ''}`);
  const sun = at(195, ANCHOR, DISC, K.pressedMark(DISC * 0.56, K.DISCS.sunrise.surface), `border-radius: 999px; background: ${K.DISCS.sunrise.stops}; box-shadow: 0 0 18px rgba(249,169,128,0.6)`);
  const word = `<span style="position: absolute; left: 0; right: 0; bottom: 40px; text-align: center">${K.label('Tanafas', '#58595B', 11)}</span>`;
  const scene = (inner) => `<span style="position: absolute; inset: 0; background: ${SKY}"></span>${inner}${sun}${word}`;
  const css = `${BREATH}
${SPIN}
@keyframes latBreath { 0%,100% { transform: scale(1); opacity: 0.55 } 50% { transform: scale(1.06); opacity: 0.95 } }
@keyframes ripple { 0% { transform: scale(0.45); opacity: 0 } 15% { opacity: 0.8 } 100% { transform: scale(1.7); opacity: 0 } }
@keyframes raysBreath { 0%,100% { transform: scale(0.96) rotate(0deg); opacity: 0.55 } 50% { transform: scale(1.05) rotate(4deg); opacity: 0.95 } }
@keyframes mashGlow { 0%,100% { opacity: 0.55 } 50% { opacity: 0.9 } }`;
  const pattern = `<svg width="390" height="844" aria-hidden="true" style="position: absolute; inset: 0"><defs>${K.lattice('mash', 56, coral, 0.8)}<radialGradient id="mashFade" cx="50%" cy="${((ANCHOR / 844) * 100).toFixed(1)}%" r="38%"><stop offset="0" stop-color="#fff" stop-opacity="1"></stop><stop offset="0.55" stop-color="#fff" stop-opacity="0.25"></stop><stop offset="1" stop-color="#fff" stop-opacity="0"></stop></radialGradient><mask id="mashMask"><rect width="390" height="844" fill="url(#mashFade)"></rect></mask></defs><rect width="390" height="844" fill="url(#mash)" mask="url(#mashMask)" opacity="0.35" style="animation: mashGlow 5s ease-in-out infinite"></rect></svg>`;
  const rays = at(195, ANCHOR, 520, '', `border-radius: 999px; background: repeating-conic-gradient(from 0deg, rgba(255,222,190,0.55) 0deg 2.5deg, rgba(255,222,190,0) 2.5deg 15deg); -webkit-mask-image: radial-gradient(circle, #000 18%, transparent 58%); mask-image: radial-gradient(circle, #000 18%, transparent 58%); animation: raysBreath 5s ease-in-out infinite`);
  const one = (delay) => at(195, ANCHOR, 360, `<svg width="360" height="360" viewBox="0 0 360 360" aria-hidden="true"><polygon points="${K.star8(180, 180, 150)}" fill="rgba(249,169,128,0.08)" stroke="${coral}" stroke-opacity="0.45" stroke-width="1.4" stroke-linejoin="round"></polygon></svg>`, `animation: ripple 5s ease-out ${delay}s infinite; opacity: 0`);
  row('A-sunglow.dc.html', {
    title: 'A · The Sunrise scene’s glow',
    css,
    phones: [
      { T: TS, caption: 'A0 · Today · Four eight-point stars turning in pairs over a breathing sunglow: the lines sit on the sky apart from the light, which is what looks off.', html: scene(`${glow()}${lattice()}`) },
      { T: TS, caption: 'A1 · The lattice breathes · The stars swell 6% and brighten with the 5 s breath, in step with the sunglow, still turning slowly. Geometry and light move as one.', html: scene(`${glow()}${lattice({}, 'animation: latBreath 5s ease-in-out infinite')}`) },
      { T: TS, caption: 'A2 · Lines of light · The same stars drawn as soft strokes of light (blurred, pale), no hard lines: they read as the sun’s rays catching, not as a drawing.', html: scene(`${glow(0.5)}${lattice({ width: 2.4, color: '#FFE6CC', blur: 1.6 }, 'animation: latBreath 5s ease-in-out infinite; mix-blend-mode: screen')}${lattice({ width: 1, blur: 0 }, 'opacity: 0.25')}`) },
      { T: TS, caption: 'A3 · Inside the glow · The lattice fades out towards its edges, masked by the sunglow’s own falloff: it only exists where the light is, and breathes with it.', html: scene(`${glow()}${lattice({}, '-webkit-mask-image: radial-gradient(circle, #000 12%, transparent 46%); mask-image: radial-gradient(circle, #000 12%, transparent 46%); animation: latBreath 5s ease-in-out infinite')}`) },
      { T: TS, caption: 'A4 · One star, breathing out · A single eight-point star swells from the sun and fades on every out-breath, like a ripple of light; nothing turns.', html: scene(`${glow()}${one(0)}${one(2.5)}`) },
      { T: TS, caption: 'A5 · Rays of light · Soft rays breathing round the sun in the scene (a slow sway, no turning lines); the star lattice stays on Home, where it’s small.', html: scene(`${glow(0.4)}${rays}`) },
      { T: TS, caption: 'A6 · A mashrabiya sky · A faint star-lattice screen across the whole sky, lit only where the sunglow reaches, as morning light through a window; it breathes.', html: scene(`${glow(0.4)}${pattern}`) },
    ],
  });
})();

/* ══════════ B · Two different suns ══════════ */
(() => {
  const PAIRS = [
    { id: 'B0', name: 'Today', note: 'Both peach: morning and evening read as the same sun.', rise: { stops: ['#FFF9F1', '#FFE9D3', '#FBC8A3', '#F9A980'], halo: '#F9A980' }, set: { stops: ['#FFF3E4', '#FFD9B3', '#F5B08A', '#E4826A'], halo: '#EC8C6E' } },
    { id: 'B1', name: 'White-gold · deep amber', note: 'Morning white-gold, bright and young; evening a deep amber going red at the rim.', rise: { stops: ['#FFFFF6', '#FFF6D6', '#FCE7A8', '#F6D27A'], halo: '#F6D27A' }, set: { stops: ['#FFE2C2', '#FFAE6E', '#F07A3E', '#C9472C'], halo: '#E05A34' } },
    { id: 'B2', name: 'Lemon-cream · rose-coral', note: 'Morning pale lemon with a cool teal halo, the air still fresh; evening rose-coral in a violet halo, the dusk sky round it.', rise: { stops: ['#FFFFF2', '#FFF8D8', '#F8ECB8', '#EED98E'], halo: '#9FDCD6' }, set: { stops: ['#FFE8E6', '#FFC2BC', '#F6948E', '#E26A7A'], halo: '#B3A7F5' } },
    { id: 'B3', name: 'Pearl · saffron', note: 'Morning a pearl touched with Houna’s turquoise; evening a saturated saffron-orange. The furthest apart.', rise: { stops: ['#FFFFFF', '#EAF8F6', '#C9ECE8', '#9ED9D3'], halo: '#6FD6CF' }, set: { stops: ['#FFF1D6', '#FFC96E', '#F9A23C', '#E57A1E'], halo: '#F59A3A' } },
    { id: 'B4', name: 'Peach · crimson', note: 'Morning keeps today’s soft peach; evening sinks to a low crimson-magenta.', rise: { stops: ['#FFF6EE', '#FFE0C8', '#FDC6A6', '#F9A980'], halo: '#F9A980' }, set: { stops: ['#FFD6E0', '#F48AA4', '#D8507A', '#A8325E'], halo: '#D8507A' } },
  ];
  const LOC = [0, 0.5, 0.8, 1];
  const disc = (s, d) => `radial-gradient(circle at 50% 45%, ${s.stops.map((c, i) => `${c} ${Math.round(LOC[i] * 100)}%`).join(', ')})`;
  const sunAt = (cx, cy, d, s) =>
    `${at(cx, cy, d * 3.2, '', `border-radius: 999px; background: radial-gradient(closest-side, ${s.halo}66, ${s.halo}00); animation: breath5 5s ease-in-out infinite`)}${at(cx, cy, d, K.pressedMark(d * 0.56, s.stops[2]), `border-radius: 999px; background: ${disc(s)}; box-shadow: 0 0 ${d * 0.18}px ${s.halo}`)}`;
  const phone = (p) => `
<span style="position: absolute; left: 0; top: 0; width: 390px; height: 422px; background: linear-gradient(180deg, #A9DDE0 0%, #DDF1EF 40%, #FCE7D8 80%, #FBC9A6 100%)"></span>
<span style="position: absolute; left: 0; top: 422px; width: 390px; height: 422px; background: linear-gradient(180deg, #2E2A5C 0%, #5A4E9A 40%, #A785B0 76%, #EFA07E 100%)"></span>
${sunAt(195, 190, 104, p.rise)}${sunAt(195, 612, 104, p.set)}
<span style="position: absolute; left: 20px; top: 20px">${K.label('Sunrise', '#58595B', 10)}</span>
<span style="position: absolute; left: 20px; top: 442px">${K.label('Dusk', 'rgba(242,236,221,0.8)', 10)}</span>
<div style="position: absolute; left: 20px; right: 20px; top: 340px; display: flex; gap: 6px">${p.rise.stops.map((c) => `<span style="flex: 1; height: 16px; border-radius: 4px; background: ${c}; box-shadow: 0 0 0 1px rgba(29,43,42,0.1)"></span>`).join('')}<span style="flex: 1; height: 16px; border-radius: 4px; background: ${p.rise.halo}; box-shadow: 0 0 0 1px rgba(29,43,42,0.1)"></span></div>
<div style="position: absolute; left: 20px; right: 20px; top: 764px; display: flex; gap: 6px">${p.set.stops.map((c) => `<span style="flex: 1; height: 16px; border-radius: 4px; background: ${c}"></span>`).join('')}<span style="flex: 1; height: 16px; border-radius: 4px; background: ${p.set.halo}"></span></div>
<span style="position: absolute; left: 20px; right: 20px; top: 368px; font-family: ${K.F.mono}; font-size: 9.5px; color: #58595B; word-break: break-all">disc ${p.rise.stops.join(' ')} · halo ${p.rise.halo}</span>
<span style="position: absolute; left: 20px; right: 20px; top: 790px; font-family: ${K.F.mono}; font-size: 9.5px; color: rgba(242,236,221,0.75); word-break: break-all">disc ${p.set.stops.join(' ')} · halo ${p.set.halo}</span>`;
  row('B-suns.dc.html', {
    title: 'B · Two different suns',
    css: BREATH,
    phones: PAIRS.map((p) => ({ T: TS, bg: '#070B1C', caption: `${p.id} · ${p.name} · ${p.note} Top: in Sunrise’s morning sky; bottom: in Dusk’s evening. The swatches are the disc’s four stops and the halo.`, html: phone(p) })),
  });
})();

/* ══════════ C · Classic Home with the Kufic ring ══════════ */
(() => {
  const ringColor = (T) => (T.dark ? 'rgba(242,236,221,0.72)' : `rgba(${K.rgbOf(T.accent)},0.78)`);
  const kufic = (T, { scale = 0.82, style = '', color } = {}) =>
    at(95, 95, KUFIC.box * scale, `<svg width="${KUFIC.box * scale}" height="${KUFIC.box * scale}" viewBox="0 0 ${KUFIC.box} ${KUFIC.box}" aria-hidden="true"><path d="${KUFIC.d}" fill="${color || ringColor(T)}"></path></svg>`, style);
  const classicMark = (T) => `${markHalo(190, 70, K.rgbOf(T.logoP), T.dark ? 0.4 : 0.5)}${mark(70, T.logoP)}`;
  const latin = (T, id) => at(95, 95, 170, K.ringText(id, 66, 'here · we breathe together · '.repeat(2).toUpperCase(), { font: K.F.mono, size: 8.5, color: T.dark ? 'rgba(242,236,221,0.55)' : `rgba(${K.rgbOf(T.text)},0.5)`, spacing: 1.6, pad: 19, fit: true }), 'animation: spinCcw 120s linear infinite');
  const css = `${BREATH}
${SPIN}
@keyframes ringBreath { 0%,100% { transform: scale(0.97); opacity: 0.6 } 50% { transform: scale(1.03); opacity: 1 } }
@keyframes sweep { to { transform: rotate(360deg) } }`;
  const lit = (T) =>
    // The ring dim, and a bright copy seen only through a slowly turning window of light.
    `${kufic(T, { color: T.dark ? 'rgba(242,236,221,0.28)' : `rgba(${K.rgbOf(T.accent)},0.3)` })}${at(95, 95, 190, `<div style="position: absolute; inset: 0; -webkit-mask-image: conic-gradient(from 0deg, #000 0deg, #000 50deg, transparent 110deg, transparent 360deg); mask-image: conic-gradient(from 0deg, #000 0deg, #000 50deg, transparent 110deg, transparent 360deg); animation: sweep 8s linear infinite"><div style="position: absolute; inset: 0; animation: spinCcw 8s linear infinite">${kufic(T, { color: T.dark ? M.moonlight : T.accent })}</div></div>`)}`;
  const variants = {
    C1: (T) => `${kufic(T, { style: 'animation: spinCw 90s linear infinite' })}${classicMark(T)}`,
    C2: (T) => `${kufic(T, { style: 'animation: ringBreath 5s ease-in-out infinite' })}${classicMark(T)}`,
    C3: (T) => `${kufic(T, { scale: 0.92, style: 'animation: spinCw 90s linear infinite' })}${latin(T, `lat${T.key}`)}${classicMark(T)}`,
    C4: (T) => `${lit(T)}${classicMark(T)}`,
  };
  row('C-kufic.dc.html', {
    title: 'C · Classic Home with the Kufic ring',
    css,
    phones: [
      { T: TN, caption: 'C1 · Profile’s ring · هُنا · نتنفّس معًا in place of the 28 dots, turning a lap in 90 s, in the ring’s colours; the mark and its edge halo as today.', html: home(TN, { hero: variants.C1(TN) }) },
      { T: TD, caption: 'C2 · The ring breathes · Still, but swelling a touch and brightening with Home’s 5 s breath, as the dots did.', html: home(TD, { hero: variants.C2(TD) }) },
      { T: TS, caption: 'C3 · Two rings · The Arabic outside, “here · we breathe together” inside in tracked capitals, turning opposite ways.', html: home(TS, { hero: variants.C3(TS) }) },
      { T: TN, caption: 'C4 · Words lit in turn · The ring still, dim; a soft light travels round it, lighting the words a few at a time, one lap every 8 s.', html: home(TN, { hero: variants.C4(TN) }) },
      { T: TN, ar: true, caption: 'C1 · Arabic · The ring reads the same in both languages; Home around it mirrors.', html: home(TN, { ar: true, hero: variants.C1(TN) }) },
    ],
  });
})();

/* ══════════ D · A calmer Home date ══════════ */
row('D-date.dc.html', {
  title: 'D · A calmer Home date',
  css: `${BREATH}\n@keyframes markFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }`,
  phones: [
    { T: TN, caption: 'D0 · Today · A chip under the wordmark: a second pill between the top bar and the bowl, and the busiest strip of Home.', html: home(TN, { date: 'chip', hero: bowl('d0') }) },
    { T: TN, caption: 'D1 · A quiet line · No chip: one line of plain text under the wordmark, tonight’s moon as a dot. Tapping it opens the month as today.', html: home(TN, { date: 'line', hero: bowl('d1') }) },
    { T: TN, caption: 'D2 · An arc under the body · The date curves under the bowl in tracked capitals, in its light: part of the hero, not a control above it.', html: home(TN, { date: 'arc', hero: bowl('d2') }) },
    { T: TN, caption: 'D3 · On the map · The top is clear; the date becomes the map’s caption (“Tonight · 17 Rabiʿ II”), where the night already is.', html: home(TN, { date: 'map', hero: bowl('d3') }) },
    { T: TN, caption: 'D4 · The moon only · A small moon in tonight’s phase, no words; tapping it opens the month of moons, where the date is.', html: home(TN, { date: 'glyph', hero: bowl('d4') }) },
    { T: TN, caption: 'D5 · Under the body · A plain line straight under the bowl, the hero text a step lower; the top bar is only the top bar.', html: home(TN, { date: 'under', hero: bowl('d5') }) },
    { T: TN, ar: true, caption: 'D1 · Arabic', html: home(TN, { ar: true, date: 'line', hero: bowl('d1a') }) },
    { T: TN, ar: true, caption: 'D2 · Arabic · The arc reads right to left.', html: home(TN, { ar: true, date: 'arc', hero: bowl('d2a') }) },
  ],
});

/* ══════════ E · The mark on plain pages ══════════ */
(() => {
  const ink = (T, a) => (T.dark ? `rgba(242,236,221,${a})` : `rgba(${K.rgbOf(T.text)},${a})`);
  const imprint = {
    E1: (T) => at(195, ANCHOR, 260, markIn(260, ink(T, T.dark ? 0.05 : 0.045))),
    E2: (T) => `<div aria-hidden="true" style="position: absolute; right: -150px; bottom: -40px; width: 560px; height: 560px">${markIn(560, ink(T, T.dark ? 0.04 : 0.035))}</div>`,
    E3: (T) => {
      let tiles = '';
      for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) tiles += at(24 + c * 56 + (r % 2) * 28, 24 + r * 56, 20, markIn(20, ink(T, T.dark ? 0.045 : 0.04)));
      return tiles;
    },
    E4: (T) => at(195, 150, 300, markIn(300, `rgba(${K.rgbOf(T.hue.glow)},${T.dark ? 0.35 : 0.4})`), 'filter: blur(22px)'),
    E5: (T) =>
      `${at(195 - 1.2, ANCHOR - 1.2, 260, markIn(260, T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)'))}${at(195 + 1.5, ANCHOR + 1.5, 260, markIn(260, T.dark ? 'rgba(0,0,0,0.45)' : 'rgba(29,43,42,0.09)'))}${at(195, ANCHOR, 260, markIn(260, T.ground))}`,
  };
  const card = (T, icon, t, s, y) => `<div style="position: absolute; left: 16px; right: 16px; top: ${y}px; height: 72px; border-radius: 20px; background: ${T.card}; border: 1px solid ${T.line}; box-sizing: border-box; display: flex; align-items: center; gap: 12px; padding: 0 16px"><span style="width: 40px; height: 40px; border-radius: 12px; background: rgba(${K.rgbOf(T.hue[icon])},0.14); border: 1px solid rgba(${K.rgbOf(T.hue[icon])},0.3)"></span><span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${t}</span><span style="font-size: 12.5px; color: ${T.sec}">${s}</span></span></div>`;
  const directory = (T, v) => `${imprint[v](T)}
<div style="position: absolute; left: 16px; right: 16px; top: 56px; display: flex; flex-direction: column; gap: 8px">${K.label('Directory', T.accent, 11)}<span style="font-family: ${K.F.display}; font-size: 30px; line-height: 1.15; color: ${T.text}">What are you looking for?</span></div>
<div style="position: absolute; left: 16px; right: 16px; top: 160px; height: 48px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; padding: 0 18px; font-size: 14.5px; color: ${T.ter}">Topics, people, exercises, events</div>
<span style="position: absolute; left: 16px; top: 232px">${K.label('Browse', T.ter, 10)}</span>
${card(T, 'glow', 'Mental Health Professionals', 'Therapists, psychiatrists, and doctors', 256)}${card(T, 'dawn', 'Organizations', 'Mental health organizations across the region', 340)}${card(T, 'dusk', 'Wellness Centers', 'Find wellness centers and their services', 424)}${card(T, 'glow', 'Articles', 'Reading on mental health topics', 508)}${card(T, 'dusk', 'Podcasts', 'Episodes and shows from houna.org', 592)}
${tabBar(T, false, 1)}`;
  const events = (T, v) => `${imprint[v](T)}
<div style="position: absolute; left: 16px; right: 16px; top: 56px; display: flex; flex-direction: column; gap: 8px">${K.label('Events', T.accent, 11)}<span style="font-family: ${K.F.display}; font-size: 30px; line-height: 1.15; color: ${T.text}">Upcoming events</span></div>
<div style="position: absolute; left: 16px; top: 136px; display: flex; gap: 8px">${['All', 'Workshops', 'Talks'].map((x, k) => `<span style="padding: 8px 14px; border-radius: 999px; font-size: 13px; ${k === 0 ? `background: ${T.dark ? M.moonlight : T.text}; color: ${T.ground}` : `background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; color: ${T.sec}`}">${x}</span>`).join('')}</div>
${[0, 1, 2].map((k) => `<div style="position: absolute; left: 16px; right: 16px; top: ${196 + k * 168}px; height: 152px; border-radius: 22px; background: ${T.card}; border: 1px solid ${T.line}; box-sizing: border-box; display: flex; gap: 14px; padding: 14px"><span style="width: 104px; border-radius: 14px; background: linear-gradient(160deg, rgba(${K.rgbOf(T.hue[['glow', 'dusk', 'dawn'][k]])},0.45), rgba(${K.rgbOf(T.hue[['glow', 'dusk', 'dawn'][k]])},0.12))"></span><span style="flex: 1; display: flex; flex-direction: column; gap: 6px; padding-top: 4px">${K.label(['Sat · 4 Oct', 'Tue · 7 Oct', 'Thu · 16 Oct'][k], T.accent, 10)}<span style="font-size: 16px; font-weight: 600; line-height: 1.3; color: ${T.text}">${['Breathing through exam season', 'Talking to someone you love about their mood', 'An evening of quiet: guided meditation'][k]}</span><span style="font-size: 12.5px; color: ${T.sec}">${['Online', 'Kuwait City', 'Online'][k]}</span></span></div>`).join('')}
${tabBar(T, false, 3)}`;
  const NOTES = {
    E1: 'E1 · On the anchor · The pressed mark, large and very faint, centred where the mark sits on every other screen (199): the page feels part of the same place.',
    E2: 'E2 · A giant, cropped · The mark enormous and 3–4% ink, most of it off the bottom end corner: felt more than seen.',
    E3: 'E3 · A screen of marks · Tiny marks tiled like a mashrabiya, 4%: a texture, not a picture.',
    E4: 'E4 · A glow in its shape · No outline at all: the mark as a soft cloud of the glow colour behind the header.',
    E5: 'E5 · Embossed · Only a light edge and a dark edge, as if pressed into the page’s paper.',
  };
  for (const [T, suffix] of [[TN, 'night'], [TS, 'day']]) {
    row(`E-imprint-${suffix}.dc.html`, {
      title: `E · The mark on plain pages (${T.dark ? 'Night' : 'Sunrise'})`,
      phones: ['E1', 'E2', 'E3', 'E4', 'E5'].map((v, i) => ({ T, caption: `${NOTES[v]}${T.dark ? '' : ' (Sunrise)'}`, html: i % 2 ? events(T, v) : directory(T, v) })),
    });
  }
})();

/* ══════════ F · A new moon ══════════ */
(() => {
  let seed = 31;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  /** A moon D across, in its own 3D-ish surface, the mark pressed in; `half` shows a waxing half for the phase. */
  function moonArt(kind, D, id, { half = false } = {}) {
    const m = D * 0.5;
    const markAt = (inner) => at(D / 2, D / 2, m, inner);
    const clip = (inner) => `<div style="position: absolute; inset: 0; border-radius: 999px; overflow: hidden; isolation: isolate">${inner}</div>`;
    const phase = half ? `<span style="position: absolute; inset: 0; border-radius: 999px; background: linear-gradient(90deg, rgba(11,16,38,0.82) 50%, rgba(11,16,38,0) 50%)"></span>` : '';
    const glow = (rgb, a) => `<span style="position: absolute; left: ${-D * 0.4}px; top: ${-D * 0.4}px; width: ${D * 1.8}px; height: ${D * 1.8}px; border-radius: 999px; background: radial-gradient(closest-side, rgba(${rgb},${a}), rgba(${rgb},0)); animation: breath5 5s ease-in-out infinite"></span>`;
    const engraved = (fill, light, lightA, dark, darkA, d = 1) =>
      markAt(`${at(m / 2 - d, m / 2 - d, m, markIn(m, `rgba(${dark},${darkA})`))}${at(m / 2 + d, m / 2 + d, m, markIn(m, `rgba(${light},${lightA})`))}${at(m / 2, m / 2, m, markIn(m, fill))}`);
    const relief = (fill, light, dark, d = 1.3) =>
      markAt(`${at(m / 2 - d, m / 2 - d, m, markIn(m, light))}${at(m / 2 + d * 1.2, m / 2 + d * 1.2, m, markIn(m, dark))}${at(m / 2, m / 2, m, markIn(m, fill))}`);
    switch (kind) {
      case 'F0':
        return `${glow('111,214,207', 0.35)}<span style="position: absolute; inset: 0; border-radius: 999px; background: ${K.DISCS.teal.stops}; box-shadow: 0 0 ${D * 0.15}px rgba(111,214,207,0.6)"></span>${markAt(K.pressedMark(m, K.DISCS.teal.surface))}${phase}`;
      case 'F1': {
        const maria = [[0.3, 0.32, 0.26, 0.2], [0.58, 0.28, 0.22, 0.16], [0.44, 0.62, 0.3, 0.22], [0.72, 0.6, 0.16, 0.14], [0.26, 0.66, 0.14, 0.12]]
          .map(([x, y, w, h]) => `<span style="position: absolute; left: ${(x - w / 2) * D}px; top: ${(y - h / 2) * D}px; width: ${w * D}px; height: ${h * D}px; border-radius: 50%; background: rgba(120,114,104,0.22); filter: blur(${D * 0.02}px)"></span>`)
          .join('');
        const craters = Array.from({ length: 9 }, () => {
          const s = D * (0.03 + rnd() * 0.05), x = D * (0.15 + rnd() * 0.7), y = D * (0.15 + rnd() * 0.7);
          return `<span style="position: absolute; left: ${x}px; top: ${y}px; width: ${s}px; height: ${s}px; border-radius: 999px; box-shadow: inset ${s * 0.12}px ${s * 0.12}px ${s * 0.2}px rgba(0,0,0,0.25), inset ${-s * 0.1}px ${-s * 0.1}px ${s * 0.12}px rgba(255,255,255,0.45)"></span>`;
        }).join('');
        return `${glow('242,236,221', 0.3)}${clip(`<span style="position: absolute; inset: 0; background: radial-gradient(circle at 38% 34%, #F6F4EE 0%, #DDD9D0 55%, #B8B3A8 100%)"></span>${maria}${craters}<span style="position: absolute; inset: 0">${K.grain(`gr${id}`, 0.22, 1.4)}</span><span style="position: absolute; inset: 0; background: radial-gradient(circle at 62% 66%, rgba(0,0,0,0) 55%, rgba(40,36,30,0.28) 100%)"></span>`)}${engraved('rgba(150,144,132,0.55)', '255,255,255', 0.5, '70,64,54', 0.4)}${phase}`;
      }
      case 'F2':
        return `${glow('200,236,232', 0.32)}${clip(`<span style="position: absolute; inset: 0; background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, #F2ECDD 45%, #D5E2E5 100%)"></span><span style="position: absolute; inset: -20%; background: conic-gradient(from 210deg, rgba(111,214,207,0.4), rgba(179,167,245,0.32), rgba(234,144,168,0.26), rgba(242,236,221,0.15), rgba(111,214,207,0.4)); opacity: 0.45; animation: spinCw 40s linear infinite"></span><span style="position: absolute; inset: 0; background: radial-gradient(circle at 35% 28%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 30%)"></span>`)}${engraved('rgba(170,196,198,0.6)', '255,255,255', 0.85, '46,111,118', 0.35, 0.9)}${phase}`;
      case 'F3':
        return `${glow('242,236,221', 0.28)}${clip(`<span style="position: absolute; inset: 0; background: radial-gradient(circle at 36% 32%, #FBF8F0 0%, #ECE5D4 55%, #CFC6B0 100%)"></span>`)}${relief('#E8E0CC', 'rgba(255,255,255,0.95)', 'rgba(90,80,60,0.38)', 1.4)}${phase}`;
      case 'F4':
        return `${glow('190,210,245', 0.25)}<span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6) 0%, rgba(210,222,245,0.2) 45%, rgba(170,190,230,0.32) 100%); border: 1px solid rgba(220,230,255,0.55); box-shadow: inset 0 0 ${D * 0.2}px rgba(255,255,255,0.25), 0 0 ${D * 0.25}px rgba(190,210,245,0.35); backdrop-filter: blur(2px)"></span>${markAt(K.pressedMark(m, '#AFC0DE'))}${phase}`;
      case 'F5':
        return `${glow('150,180,255', 0.3)}${clip(`<span style="position: absolute; inset: 0; background: radial-gradient(circle at 45% 40%, #FFFFFF 0%, #EEF1F6 40%, #D6DCE8 80%, #C1C9DB 100%)"></span><span style="position: absolute; inset: 0; background: radial-gradient(circle at 58% 62%, rgba(110,150,255,0.5) 0%, rgba(110,150,255,0) 55%); mix-blend-mode: multiply; animation: breath5 5s ease-in-out infinite"></span><span style="position: absolute; left: -10%; top: 30%; width: 120%; height: 30%; background: linear-gradient(180deg, rgba(180,205,255,0), rgba(180,205,255,0.35), rgba(180,205,255,0)); transform: rotate(-24deg); filter: blur(${D * 0.04}px)"></span>`)}${engraved('rgba(120,132,168,0.35)', '255,255,255', 0.7, '40,50,90', 0.3)}${phase}`;
    }
    return '';
  }
  const starfield = (kind, i) => `${K.starfield(90, 390, 844, 50 + i)}
<span style="position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 24%, rgba(111,214,207,0.08), rgba(11,16,38,0) 70%)"></span>
${at(195, ANCHOR, 128, moonArt(kind, 128, `s${i}`))}
<span style="position: absolute; left: 0; right: 0; bottom: 40px; text-align: center">${K.label('Tanafas', 'rgba(242,236,221,0.55)', 11)}</span>`;
  const NOTES = {
    F0: 'F0 · Today · The solid teal disc, the mark pressed in, its halo joined to the edge.',
    F1: 'F1 · A lunar surface · Moonlight grey with soft maria and a few craters, fine grain; the mark pressed in as a shallow crater. Built as a baked image the phase windows clip.',
    F2: 'F2 · Pearl · A moonlight-to-teal pearl with a slow iridescent sheen turning in it; the mark engraved, a lit edge and a shadowed one. Gradients only.',
    F3: 'F3 · In relief · Warm moonlight; the mark raised from the surface, lit from the sunlit side, shadowed on the other. Gradients only.',
    F4: 'F4 · Glass · A cool silver glass moon like the 4-7-8 orb, the stars faintly through it; the mark pressed in. Gradients only.',
    F5: 'F5 · Moonstone · Milky white with a blue glow deep inside that breathes, and a soft sheen across it; the mark in shadow. A baked image for the surface.',
  };
  const kinds = ['F0', 'F1', 'F2', 'F3', 'F4', 'F5'];
  row('F-moon.dc.html', {
    title: 'F · A new moon (the starfield)',
    css: `${BREATH}\n${SPIN}`,
    phones: kinds.map((k, i) => ({ T: TN, bg: M.midnight, caption: NOTES[k], html: starfield(k, i) })),
  });
  // The six close, full and at a half, to judge the surfaces and the phase windows.
  const W = 1480, H = 760;
  const body = `<div style="position: absolute; left: 64px; top: 56px; display: flex; flex-direction: column; gap: 10px">${K.label('F · the moons close', '#6FD6CF', 12)}<span style="font-family: ${K.F.display}; font-size: 40px; color: ${M.moonlight}">Full, and at a half</span><span style="font-size: 15px; color: ${M.mist}">Tonight’s real phase is kept whichever is chosen: the lit part a window over the whole face, so the pressed mark never distorts.</span></div>
${kinds.map((k, i) => `${at(64 + 100 + i * 225, 330, 180, moonArt(k, 180, `c${i}`))}${at(64 + 100 + i * 225, 570, 180, moonArt(k, 180, `h${i}`, { half: true }))}<span style="position: absolute; left: ${64 + 10 + i * 225}px; top: 690px; width: 180px; text-align: center">${K.label(k, M.mist, 11)}</span>`).join('')}`;
  out.push(K.board('F-moon-close.dc.html', { title: 'F · the moons, close', w: W, h: H, root: `background: ${M.midnight}`, css: `${BREATH}\n${SPIN}`, body, dir: DIR }));
})();

/* ══════════ G · The Dusk sun, on Home and in its scene ══════════ */
(() => {
  // The app's own: SunDisc's 132 disc, at HOME_SUN_SCALE (0.8) on Home and 0.9 settled in the scene.
  const HD = 106, SD = 119;
  const DUSK = K.DISCS.dusk;
  const SKY = 'linear-gradient(180deg, #2E2A5C 0%, #5A4E9A 40%, #A785B0 76%, #EFA07E 100%)'; // duskScene.skyB
  const rose = '#F5B08A', amber = '#EC8C6E', violet = '#B3A7F5', gold = '#FFD9B3';
  const halo = (cx, cy, d, rgb = '236,140,110', a = 0.42) => at(cx, cy, d * 2.6, '', `border-radius: 999px; background: radial-gradient(closest-side, rgba(${rgb},${a}), rgba(${rgb},0)); animation: breath5 5s ease-in-out infinite`);
  const sunglow = (cx, cy, a = 0.28) => at(cx, cy, 420, '', `border-radius: 999px; background: radial-gradient(closest-side, rgba(242,160,120,${a}), rgba(242,160,120,0)); animation: breath5 5s ease-in-out infinite`);
  const disc = (cx, cy, d, { stops = DUSK.stops, surface = DUSK.surface, style = '' } = {}) =>
    at(cx, cy, d, K.pressedMark(d * 0.56, surface), `border-radius: 999px; background: ${stops}; box-shadow: 0 0 14px rgba(242,160,120,0.45); ${style}`);

  // G1: the sun slipping below, cut by bands that widen towards its foot.
  const BANDS = 'linear-gradient(180deg, #000 0 58%, transparent 58% 62%, #000 62% 71%, transparent 71% 76%, #000 76% 84%, transparent 84% 91%, #000 91% 96%, transparent 96%)';
  const banded = `-webkit-mask-image: ${BANDS}; mask-image: ${BANDS}; animation: bandsDrift 5s ease-in-out infinite`;
  // G5: lit from below, as the sun sits on the horizon: violet-rose above, gold at its foot.
  const LOW = 'radial-gradient(circle at 50% 88%, #FFF1D6 0%, #FFC98E 30%, #E98A78 64%, #8E5E9E 100%)';
  const lowLit = { stops: LOW, surface: '#E39A84', style: 'box-shadow: inset 0 -3px 6px rgba(255,236,200,0.85), 0 6px 18px rgba(255,201,142,0.5)' };
  // G4: one still eight-point star, its points lit by first stars.
  const star = (cx, cy, r, sw = 1.2) => {
    const pts = K.star8(cx, cy, r).split(' ');
    const tips = pts.filter((_, i) => i % 2 === 0);
    return `<svg width="${cx * 2}" height="${cy * 2}" aria-hidden="true" style="position: absolute; left: 0; top: 0; overflow: visible; animation: starBreath 5s ease-in-out infinite; transform-origin: ${cx}px ${cy}px"><polygon points="${pts.join(' ')}" fill="rgba(179,167,245,0.07)" stroke="${violet}" stroke-opacity="0.7" stroke-width="${sw}" stroke-linejoin="round"></polygon>${tips
      .map((p, k) => { const [x, y] = p.split(',').map(Number); return `<circle cx="${x}" cy="${y}" r="${sw * 1.4}" fill="#FFF3E4" style="animation: twinkle ${3 + (k % 3)}s ease-in-out ${-k * 0.7}s infinite"></circle>`; })
      .join('')}</svg>`;
  };
  // G3: rings of evening, and one born on each breath.
  const rings = (cx, cy, d, reach) =>
    [[1.32, amber, 0.55], [1.66, '#E98AA0', 0.42], [2.05, violet, 0.32]]
      .map(([k, c, o]) => at(cx, cy, d * k, '', `border-radius: 999px; border: 1px solid ${c}; opacity: ${o}; box-sizing: border-box`))
      .join('') + [0, 2.5].map((delay) => at(cx, cy, d * reach, '', `border-radius: 999px; border: 1.2px solid ${gold}; box-sizing: border-box; animation: ringOut 5s ease-out ${delay}s infinite; opacity: 0`)).join('');
  // G2: the evening through a mihrab window.
  const mihrab = (w, h, x, y, id, inner = '') =>
    `<svg width="${x * 2 + w}" height="${y + h}" aria-hidden="true" style="position: absolute; left: 0; top: 0; overflow: visible"><defs><linearGradient id="mih${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A4E9A" stop-opacity="0.35"></stop><stop offset="1" stop-color="#EFA07E" stop-opacity="0.3"></stop></linearGradient></defs><path d="${K.archPath(w, h, x, y)}" fill="url(#mih${id})" stroke="${rose}" stroke-opacity="0.8" stroke-width="1.3"></path><path d="${K.archPath(w - 12, h - 6, x + 6, y + 6)}" fill="none" stroke="${gold}" stroke-opacity="0.35" stroke-width="0.8"></path></svg>${inner}`;
  // G6: its reflection on the Gulf, a column of light broken into ripples.
  const shimmer = (cx, top, n, w0, gap, h = 2) =>
    Array.from({ length: n }, (_, k) => {
      const w = w0 * (1 - k / (n + 2)) * (k % 2 ? 0.82 : 1);
      return `<span style="position: absolute; left: ${(cx - w / 2).toFixed(1)}px; top: ${top + k * gap}px; width: ${w.toFixed(1)}px; height: ${h}px; border-radius: 2px; background: linear-gradient(90deg, rgba(255,217,179,0), rgba(255,217,179,${(0.85 - k / (n * 1.3)).toFixed(2)}), rgba(255,217,179,0)); animation: shimmer ${2.6 + (k % 4) * 0.4}s ease-in-out ${-k * 0.3}s infinite"></span>`;
    }).join('');

  const VARIANTS = [
    { id: 'G0', name: 'Today', note: 'An amber disc in its halo and a wide sunglow: soft, but only a warmer twin of Sunrise’s sun, with nothing of its own.', home: () => `${halo(95, 95, HD)}${disc(95, 95, HD)}`, scene: () => `${sunglow(195, ANCHOR)}${halo(195, ANCHOR, SD)}${disc(195, ANCHOR, SD)}` },
    { id: 'G1', name: 'Slipping below', note: 'The sun cut by bands that widen towards its foot, as a setting sun through the haze; they drift down a touch on each out-breath. The mark stays whole above them. A mask on the disc (SunDisc’s one change).', home: () => `${halo(95, 95, HD, '236,140,110', 0.34)}${disc(95, 95, HD, { style: banded })}`, scene: () => `${sunglow(195, ANCHOR, 0.24)}${halo(195, ANCHOR, SD, '236,140,110', 0.34)}${disc(195, ANCHOR, SD, { style: banded })}` },
    { id: 'G2', name: 'Through a mihrab', note: 'The evening seen through an arch, the Meditate scenes’ mihrab, in rose-gold lines: on Home a small window round the sun; in the scene a tall one holding the sky, the first stars inside it. Still; only the sun breathes.', home: () => `${mihrab(142, 184, 24, 0, 'h')}${halo(95, 108, HD * 0.8, '236,140,110', 0.34)}${disc(95, 108, HD * 0.8)}`, scene: () => `${mihrab(300, 470, 45, ANCHOR - 150, 's', `<div style="position: absolute; left: 45px; top: ${ANCHOR - 150}px; width: 300px; height: 470px; ${K.archClip(300, 470)}">${K.starfield(22, 300, 200, 71, '255,243,228')}</div>`)}${halo(195, ANCHOR + 60, SD, '236,140,110', 0.4)}${disc(195, ANCHOR + 60, SD)}` },
    { id: 'G3', name: 'Rings of evening', note: 'Three fine rings round the sun in the evening’s own colours, amber, rose, violet, and one ring of gold born on each in-breath, spreading out and fading. On Home they stay near; in the scene they reach across the sky. Circles only.', home: () => `${rings(95, 95, HD, 1.8)}${disc(95, 95, HD)}`, scene: () => `${rings(195, ANCHOR, SD, 3.6)}${disc(195, ANCHOR, SD)}` },
    { id: 'G4', name: 'One still star', note: 'Sunrise’s stars turn; Dusk’s one eight-point star is still, in violet, and only breathes, a first star lighting at each of its points. Morning moves, evening settles. Built as Sunrise’s lattice, one star, no turning.', home: () => `${star(95, 95, 86)}${halo(95, 95, HD, '236,140,110', 0.3)}${disc(95, 95, HD)}`, scene: () => `${sunglow(195, ANCHOR, 0.2)}<div style="position: absolute; inset: 0">${star(195, ANCHOR, 150, 1.4)}</div>${halo(195, ANCHOR, SD, '236,140,110', 0.3)}${disc(195, ANCHOR, SD)}` },
    { id: 'G5', name: 'Lit from below', note: 'The sun as it sits on the horizon: violet-rose above, gold gathering at its foot, a bright rim along the bottom edge, as Night’s crescent bowl is lit from beneath. The three bodies become one family. Gradients only.', home: () => `${halo(95, 110, HD, '255,201,142', 0.4)}${disc(95, 95, HD, lowLit)}`, scene: () => `${at(195, ANCHOR + 70, 460, '', 'border-radius: 999px; background: radial-gradient(closest-side, rgba(255,201,142,0.42), rgba(255,201,142,0)); animation: breath5 5s ease-in-out infinite')}${disc(195, ANCHOR, SD, lowLit)}` },
    { id: 'G6', name: 'On the Gulf', note: 'The sun above the water, its reflection a column of light broken into ripples that shimmer on the breath. On Home a short reflection under the disc, inside the box; in the scene, a sea of evening below the horizon, the reflection reaching down it.', home: () => `${halo(95, 72, HD * 0.84, '236,140,110', 0.34)}${disc(95, 72, HD * 0.84)}${shimmer(95, 128, 9, 76, 7)}`, scene: () => `<span style="position: absolute; left: 0; right: 0; top: ${ANCHOR + 70}px; bottom: 0; background: linear-gradient(180deg, #7C6AA8 0%, #4B3F82 40%, #2E2A5C 100%)"></span><span style="position: absolute; left: 0; right: 0; top: ${ANCHOR + 70}px; height: 1px; background: rgba(255,217,179,0.6)"></span>${sunglow(195, ANCHOR + 20, 0.26)}${halo(195, ANCHOR, SD, '236,140,110', 0.36)}${disc(195, ANCHOR, SD)}${shimmer(195, ANCHOR + 78, 30, 200, 15, 2.4)}` },
  ];
  const css = `${BREATH}
${SPIN}
@keyframes bandsDrift { 0%,100% { -webkit-mask-position: 0 0; mask-position: 0 0 } 50% { -webkit-mask-position: 0 3px; mask-position: 0 3px } }
@keyframes starBreath { 0%,100% { transform: scale(1); opacity: 0.7 } 50% { transform: scale(1.05); opacity: 1 } }
@keyframes ringOut { 0% { transform: scale(0.5); opacity: 0 } 15% { opacity: 0.7 } 100% { transform: scale(1); opacity: 0 } }
@keyframes shimmer { 0%,100% { opacity: 0.45; transform: scaleX(0.9) } 50% { opacity: 1; transform: scaleX(1.08) } }`;
  const word = `<span style="position: absolute; left: 0; right: 0; bottom: 40px; text-align: center">${K.label('Tanafas', 'rgba(46,42,92,0.8)', 11)}</span>`;
  const scene = (v, i) => `<span style="position: absolute; inset: 0; background: ${SKY}"></span>${K.starfield(26, 390, 360, 40 + i, '255,243,228')}${v.scene()}${word}`;
  row('G-dusk-home.dc.html', {
    title: 'G · The Dusk sun, on Home',
    css,
    capH: 150,
    phones: VARIANTS.map((v) => ({ T: TD, caption: `${v.id} · ${v.name} · ${v.note}`, html: home(TD, { date: 'line', hero: v.home() }) })),
  });
  row('G-dusk-scene.dc.html', {
    title: 'G · The Dusk sun, in its Tanafas scene',
    css,
    capH: 150,
    phones: VARIANTS.map((v, i) => ({ T: TD, bg: '#2E2A5C', caption: `${v.id} · ${v.name} (the scene) · Home’s sun becomes this one where it is, on the anchor, in Dusk’s violet evening; the first stars come out round it.`, html: scene(v, i) })),
  });

  /* ── More Dusk suns (G7–G13), asked for after the first six ── */
  const kufic = (cx, cy, size, color, dur) =>
    at(cx, cy, size, `<svg width="${size}" height="${size}" viewBox="0 0 ${KUFIC.box} ${KUFIC.box}" aria-hidden="true"><path d="${KUFIC.d}" fill="${color}"></path></svg>`, `animation: spinCcw ${dur}s linear infinite`);
  const hilal = (cx, cy, r, id) =>
    at(cx, cy, r * 2, `<svg width="${r * 2}" height="${r * 2}" viewBox="0 0 ${r * 2} ${r * 2}" aria-hidden="true" style="overflow: visible; filter: drop-shadow(0 0 ${r * 0.5}px rgba(255,243,228,0.8))"><defs><mask id="hil${id}"><rect width="${r * 2}" height="${r * 2}" fill="#fff"></rect><circle cx="${r * 0.62}" cy="${r * 0.78}" r="${r * 0.92}" fill="#000"></circle></mask></defs><circle cx="${r}" cy="${r}" r="${r}" fill="#FFF3E4" mask="url(#hil${id})"></circle></svg>`, 'animation: breath5 5s ease-in-out infinite');
  const QAMARIYA = 'radial-gradient(circle at 50% 45%, rgba(255,249,241,0.85) 0%, rgba(255,249,241,0) 34%), conic-gradient(from 22.5deg, #F5B08A 0 45deg, #E98AA0 45deg 90deg, #FFD9B3 90deg 135deg, #B3A7F5 135deg 180deg, #F5B08A 180deg 225deg, #E98AA0 225deg 270deg, #FFD9B3 270deg 315deg, #B3A7F5 315deg 360deg)';
  const qamariya = (cx, cy, d) =>
    at(cx, cy, d, `<svg width="${d}" height="${d}" aria-hidden="true" style="position: absolute; inset: 0"><polygon points="${K.star8(d / 2, d / 2, d * 0.47)}" fill="none" stroke="rgba(94,52,72,0.55)" stroke-width="${d * 0.022}" stroke-linejoin="round"></polygon><circle cx="${d / 2}" cy="${d / 2}" r="${d * 0.3}" fill="#FFE9D3" stroke="rgba(94,52,72,0.55)" stroke-width="${d * 0.022}"></circle>${[0, 45, 90, 135].map((a) => `<line x1="${d / 2 + d * 0.3 * Math.cos((a * Math.PI) / 180)}" y1="${d / 2 + d * 0.3 * Math.sin((a * Math.PI) / 180)}" x2="${d / 2 + d * 0.5 * Math.cos((a * Math.PI) / 180)}" y2="${d / 2 + d * 0.5 * Math.sin((a * Math.PI) / 180)}" stroke="rgba(94,52,72,0.4)" stroke-width="${d * 0.014}"></line><line x1="${d / 2 - d * 0.3 * Math.cos((a * Math.PI) / 180)}" y1="${d / 2 - d * 0.3 * Math.sin((a * Math.PI) / 180)}" x2="${d / 2 - d * 0.5 * Math.cos((a * Math.PI) / 180)}" y2="${d / 2 - d * 0.5 * Math.sin((a * Math.PI) / 180)}" stroke="rgba(94,52,72,0.4)" stroke-width="${d * 0.014}"></line>`).join('')}</svg><div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center">${K.pressedMark(d * 0.46, '#FFE9D3')}</div>`, `border-radius: 999px; overflow: hidden; background: ${QAMARIYA}; box-shadow: 0 0 ${d * 0.2}px rgba(233,138,160,0.55), 0 0 ${d * 0.5}px rgba(179,167,245,0.35)`);
  const dune = (w, top, rise, fill, id, bottom = top + 1200) => `<svg width="${w}" height="${844}" aria-hidden="true" style="position: absolute; left: 0; top: 0; overflow: visible"><defs><linearGradient id="dune${id}" x1="0" y1="0" x2="0" y2="1">${fill}</linearGradient></defs><path d="M0 ${top + rise * 0.4} Q ${w * 0.3} ${top - rise * 0.5} ${w * 0.55} ${top + rise * 0.1} T ${w} ${top - rise * 0.2} V ${bottom} H 0 Z" fill="url(#dune${id})"></path></svg>`;
  const beams = (cx, cy, size, a) =>
    at(cx, cy, size, '', `border-radius: 999px; background: repeating-conic-gradient(from -84deg at 50% 50%, rgba(255,217,179,${a}) 0deg 5deg, rgba(255,217,179,0) 5deg 21deg); -webkit-mask-image: linear-gradient(180deg, #000 0 50%, transparent 50%), radial-gradient(circle, #000 20%, transparent 62%); -webkit-mask-composite: source-in; mask-image: linear-gradient(180deg, #000 0 50%, transparent 50%), radial-gradient(circle, #000 20%, transparent 62%); mask-composite: intersect; filter: blur(${size > 400 ? 4 : 1.5}px); animation: beamsBreath 5s ease-in-out infinite`);
  const ringSun = (cx, cy, d) =>
    `${at(cx, cy, d * 2.2, '', 'border-radius: 999px; background: radial-gradient(closest-side, rgba(255,201,142,0) 40%, rgba(255,201,142,0.45) 47%, rgba(255,201,142,0) 70%); animation: breath5 5s ease-in-out infinite')}${at(cx, cy, d, markIn(d * 0.56, amber), `border-radius: 999px; border: ${d * 0.06}px solid #FFE0B8; box-sizing: border-box; background: radial-gradient(circle, rgba(255,217,179,0.2), rgba(255,217,179,0.05)); box-shadow: 0 0 ${d * 0.16}px rgba(255,201,142,0.9), inset 0 0 ${d * 0.14}px rgba(255,201,142,0.7); display: flex; align-items: center; justify-content: center`)}`;
  const belt = (cx, cy, w, h) =>
    `${at(cx, cy, w, '', `height: ${h}px; top: ${cy - h / 2}px; border-radius: 50%; background: radial-gradient(closest-side, rgba(234,144,168,0.5), rgba(234,144,168,0)); animation: breath5 5s ease-in-out infinite`)}${at(cx, cy + h * 0.55, w, '', `height: ${h * 0.8}px; top: ${cy + h * 0.2}px; border-radius: 50%; background: radial-gradient(closest-side, rgba(90,78,154,0.4), rgba(90,78,154,0))`)}`;

  const MORE = [
    { id: 'G7', name: 'The Kufic words at evening', note: 'Profile’s words, هُنا · نتنفّس معًا, circling the sun in rose-gold, turning slowly the other way from Sunrise’s stars. On Home a close ring; in the scene a wide one in the sky. The baked Kufic outline, as Profile draws it.', home: () => `${halo(95, 95, HD * 0.84, '236,140,110', 0.3)}${kufic(95, 95, 176, 'rgba(236,140,110,0.78)', 120)}${disc(95, 95, HD * 0.84)}`, scene: () => `${sunglow(195, ANCHOR, 0.22)}${kufic(195, ANCHOR, 300, 'rgba(255,217,179,0.62)', 150)}${halo(195, ANCHOR, SD, '236,140,110', 0.34)}${disc(195, ANCHOR, SD)}` },
    { id: 'G8', name: 'The hilal at maghrib', note: 'The evening the new moon is looked for: as the sun goes down, a thin hilal glows beside it and breathes. On Home a small crescent up and to the side; in the scene higher in the violet, the first light of the night. Tied to Home’s Hijri date: shown on the evening a month begins, or always.', home: () => `${halo(88, 104, HD * 0.86, '236,140,110', 0.34)}${disc(88, 104, HD * 0.86)}${hilal(152, 36, 13, 'h')}`, scene: () => `${sunglow(195, ANCHOR + 30, 0.24)}${halo(195, ANCHOR + 30, SD, '236,140,110', 0.36)}${disc(195, ANCHOR + 30, SD)}${hilal(292, ANCHOR - 118, 20, 's')}` },
    { id: 'G9', name: 'A qamariya', note: 'The sun as the round stained-glass window over a Gulf doorway: amber, rose, cream and violet panes in an eight-point star, the evening light coming through, the mark pressed into its clear centre. Built with gradients and the khatam star.', home: () => qamariya(95, 95, HD), scene: () => `${sunglow(195, ANCHOR, 0.26)}${qamariya(195, ANCHOR, SD * 1.15)}` },
    { id: 'G10', name: 'Over the dunes', note: 'The sun settling on a soft ridge of sand, its foot hidden, the mark whole above it. On Home a faint ridge that fades into the page; in the scene, dunes in two violets across the foot of the screen.', home: () => `${halo(95, 100, HD, '236,140,110', 0.36)}${disc(95, 100, HD)}<span style="position: absolute; left: -60px; width: 310px; top: 138px; height: 72px; border-radius: 50% 50% 0 0 / 30px 30px 0 0; background: linear-gradient(180deg, rgba(167,133,176,0.55), rgba(167,133,176,0) 85%); -webkit-mask-image: linear-gradient(90deg, transparent, #000 28%, #000 72%, transparent); mask-image: linear-gradient(90deg, transparent, #000 28%, #000 72%, transparent)"></span>`, scene: () => `${sunglow(195, ANCHOR + 30, 0.3)}${halo(195, ANCHOR + 20, SD, '236,140,110', 0.4)}${disc(195, ANCHOR + 20, SD)}${dune(390, ANCHOR + 78, 34, '<stop offset="0" stop-color="#5A4E9A"></stop><stop offset="1" stop-color="#2E2A5C"></stop>', 's1')}${dune(390, ANCHOR + 150, -40, '<stop offset="0" stop-color="#3B3470"></stop><stop offset="1" stop-color="#1F1B42"></stop>', 's2')}` },
    { id: 'G11', name: 'Afterglow', note: 'Soft beams fanning up from the sun, as the last light does through the haze after sunset, breathing slowly; nothing turns (Sunrise’s stars do). Short on Home, reaching up across the sky in the scene.', home: () => `${beams(95, 95, 220, 0.5)}${halo(95, 95, HD, '236,140,110', 0.34)}${disc(95, 95, HD)}`, scene: () => `${beams(195, ANCHOR, 700, 0.22)}${halo(195, ANCHOR, SD, '236,140,110', 0.36)}${disc(195, ANCHOR, SD)}` },
    { id: 'G12', name: 'The belt of Venus', note: 'The evening sky’s own colours: the rose band that rises opposite the sunset, with the blue-violet of the earth’s shadow beneath, as a soft band behind the sun. On Home a wide, low oval; in the scene it spans the sky.', home: () => `${belt(95, 104, 280, 90)}${halo(95, 95, HD, '236,140,110', 0.3)}${disc(95, 95, HD)}`, scene: () => `${belt(195, ANCHOR + 40, 760, 220)}${halo(195, ANCHOR, SD, '236,140,110', 0.34)}${disc(195, ANCHOR, SD)}` },
    { id: 'G13', name: 'A ring of light', note: 'The light withdrawing: the sun drawn as a bright ring, clear inside, the mark in amber in its middle, and a halo just outside the ring breathing. Quiet, and unlike any other body. Circles and a border only.', home: () => ringSun(95, 95, HD), scene: () => `${sunglow(195, ANCHOR, 0.2)}${ringSun(195, ANCHOR, SD)}` },
  ];
  const css2 = `${css}
@keyframes beamsBreath { 0%,100% { opacity: 0.6; transform: scale(0.96) } 50% { opacity: 1; transform: scale(1.04) } }`;
  row('G-dusk-home-2.dc.html', {
    title: 'G · More Dusk suns, on Home',
    css: css2,
    capH: 150,
    phones: MORE.map((v) => ({ T: TD, caption: `${v.id} · ${v.name} · ${v.note}`, html: home(TD, { date: 'line', hero: v.home() }) })),
  });
  row('G-dusk-scene-2.dc.html', {
    title: 'G · More Dusk suns, in the Tanafas scene',
    css: css2,
    capH: 150,
    phones: MORE.map((v, i) => ({ T: TD, bg: '#2E2A5C', caption: `${v.id} · ${v.name} (the scene) · Home’s sun becomes this one where it is, on the anchor, in Dusk’s violet evening.`, html: scene(v, i + 7) })),
  });

  /* ── G13 + G7: the ring of light with the Kufic words (G14–G17) ── */
  const words = (cx, cy, size, color, glow, style = '', weight = 1.4) =>
    at(cx, cy, size, `<svg width="${size}" height="${size}" viewBox="0 0 ${KUFIC.box} ${KUFIC.box}" aria-hidden="true" style="overflow: visible; filter: drop-shadow(0 0 ${size * 0.025}px ${glow})"><path d="${KUFIC.d}" fill="${color}" stroke="${color}" stroke-width="${weight}" stroke-linejoin="round"></path></svg>`, style);
  // Sized so the words' circle (88 of the baked 224) sits at radius r.
  const wordsAt = (r) => (r * KUFIC.box) / 88;
  const clearSun = (cx, cy, d, markD = 0.5) =>
    `${at(cx, cy, d * 2.2, '', 'border-radius: 999px; background: radial-gradient(closest-side, rgba(255,201,142,0) 36%, rgba(255,201,142,0.4) 45%, rgba(255,201,142,0) 70%); animation: breath5 5s ease-in-out infinite')}${at(cx, cy, d, markIn(d * markD, amber), 'border-radius: 999px; background: radial-gradient(circle, rgba(255,217,179,0.18), rgba(255,217,179,0.04)); display: flex; align-items: center; justify-content: center')}`;
  const travelling = (cx, cy, size, color, glow) =>
    `${words(cx, cy, size, color, 'rgba(0,0,0,0)', 'opacity: 0.3')}${at(cx, cy, size, `<div style="position: absolute; inset: 0; animation: spinCcw 10s linear infinite">${words(size / 2, size / 2, size, color, glow)}</div>`, `animation: spinCw 10s linear infinite; -webkit-mask-image: conic-gradient(from 0deg, transparent 0 55%, #000 88%, transparent 100%); mask-image: conic-gradient(from 0deg, transparent 0 55%, #000 88%, transparent 100%)`)}`;
  const GOLD = '#FFE0B8', GLOW = 'rgba(255,201,142,0.95)';
  // On Home's pale ground the gold vanishes: the words there are the deeper amber.
  const EMBER = '#D9694A', EMBER_GLOW = 'rgba(236,140,110,0.55)';
  const COMBO = [
    { id: 'G14', name: 'The words are the ring', note: 'G13’s ring of light made of G7’s words: هُنا · نتنفّس معًا drawn in light round a clear sun, glowing gold, turning slowly; the mark in amber in the middle, and the halo breathing just outside. One ring, not two.', home: () => `${clearSun(95, 95, 120, 0.44)}${words(95, 95, wordsAt(62), EMBER, EMBER_GLOW, 'animation: spinCcw 120s linear infinite', 2)}`, scene: () => `${sunglow(195, ANCHOR, 0.2)}${clearSun(195, ANCHOR, 170, 0.44)}${words(195, ANCHOR, wordsAt(88), GOLD, GLOW, 'animation: spinCcw 120s linear infinite', 2)}` },
    { id: 'G15', name: 'The ring, and the words round it', note: 'G13 as drawn, the bright ring with the amber mark, and G7’s words in a wider circle round it in rose-gold, turning slowly the other way from Sunrise’s stars. The ring holds still; the words move.', home: () => `${ringSun(95, 95, HD * 0.84)}${words(95, 95, wordsAt(80), EMBER, EMBER_GLOW, 'animation: spinCcw 120s linear infinite')}`, scene: () => `${sunglow(195, ANCHOR, 0.2)}${ringSun(195, ANCHOR, SD)}${words(195, ANCHOR, wordsAt(128), 'rgba(255,217,179,0.7)', 'rgba(255,201,142,0.5)', 'animation: spinCcw 150s linear infinite')}` },
    { id: 'G16', name: 'The words inside the ring', note: 'An inscription, as round a coin or a medallion: the words turning just inside the ring of light, between it and the mark, which is smaller. Closest to one object; the words small on Home, clear in the scene.', home: () => `${ringSun(95, 95, 128)}${words(95, 95, wordsAt(48), '#B8503A', 'rgba(255,201,142,0.5)', 'animation: spinCcw 90s linear infinite', 1.8)}`, scene: () => `${sunglow(195, ANCHOR, 0.2)}${ringSun(195, ANCHOR, 150)}${words(195, ANCHOR, wordsAt(57), GOLD, GLOW, 'animation: spinCcw 90s linear infinite')}` },
    { id: 'G17', name: 'The words lit in turn', note: 'G15, with the words still and faint, and a light going round them once every ten seconds, lighting each word as it passes, as the last light moves along a horizon. The ring breathes. A turning mask over the words.', home: () => `${ringSun(95, 95, HD * 0.84)}${travelling(95, 95, wordsAt(80), EMBER, EMBER_GLOW)}`, scene: () => `${sunglow(195, ANCHOR, 0.2)}${ringSun(195, ANCHOR, SD)}${travelling(195, ANCHOR, wordsAt(128), GOLD, GLOW)}` },
  ];
  row('G-dusk-combo-home.dc.html', {
    title: 'G · G13 + G7 on Home',
    css: css2,
    capH: 150,
    phones: COMBO.map((v) => ({ T: TD, caption: `${v.id} · ${v.name} · ${v.note}`, html: home(TD, { date: 'line', hero: v.home() }) })),
  });
  row('G-dusk-combo-scene.dc.html', {
    title: 'G · G13 + G7 in the Tanafas scene',
    css: css2,
    capH: 150,
    phones: COMBO.map((v, i) => ({ T: TD, bg: '#2E2A5C', caption: `${v.id} · ${v.name} (the scene) · Home’s sun becomes this one where it is, on the anchor, in Dusk’s violet evening.`, html: scene(v, i + 14) })),
  });
})();

/* ══════════ H · Your emotional landscape; I · Badges and Profile's icons (study-hi.js) ══════════ */
const HI = require('./study-hi.js')({ K, row, out, DIR, M, ROOT });

/* ── The canvas: Direction on top, then a row per study ── */
const ROWS = [['Main.dc.html'], ['A-sunglow.dc.html'], ['B-suns.dc.html'], ['C-kufic.dc.html'], ['D-date.dc.html'], ['E-imprint-night.dc.html'], ['E-imprint-day.dc.html'], ['F-moon.dc.html', 'F-moon-close.dc.html'], ['G-dusk-home.dc.html'], ['G-dusk-scene.dc.html'], ['G-dusk-home-2.dc.html'], ['G-dusk-scene-2.dc.html'], ['G-dusk-combo-home.dc.html'], ['G-dusk-combo-scene.dc.html'], ...HI.hRows, ...HI.iRows];
const TITLES = { 1: 'A · The Sunrise scene’s glow', 2: 'B · Two different suns', 3: 'C · Classic Home with the Kufic ring', 4: 'D · A calmer Home date', 5: 'E · The mark on plain pages', 7: 'F · A new moon', 8: 'G · The Dusk sun, on Home and in its scene', 12: 'G · G13 + G7: the ring of light and the Kufic words', 14: 'H · Your emotional landscape (Recap’s moods slide)', 16: 'I · Badges and Profile’s icons' };
const byFile = Object.fromEntries(out.map((b) => [b.file, b]));
const boards = {}, notes = {}, order = [];
let y = 0;
ROWS.forEach((files, r) => {
  if (TITLES[r]) {
    y += 260;
    const width = files.reduce((a, f) => a + byFile[f].w, 0) + (files.length - 1) * 80;
    notes[`row${r}`] = { kind: 'title1', text: TITLES[r], x: 0, y: y - 260 + 20, maxW: Math.max(width, 2000), w: 240 };
  }
  let x = 0, h = 0;
  for (const f of files) {
    const b = byFile[f];
    boards[f] = { x, y, w: b.w, h: b.h, title: b.title, ...(b.interactive ? { is_interactive: true } : {}) };
    order.push(f);
    x += b.w + 80;
    h = Math.max(h, b.h);
  }
  y += h + 120;
});
const e = Object.entries(boards);
for (let i = 0; i < e.length; i++) for (let j = i + 1; j < e.length; j++) {
  const [p, q] = [e[i][1], e[j][1]];
  if (p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h) console.log('overlap', e[i][0], e[j][0]);
}
const indexPath = path.join(DIR, 'canvas.json');
const prev = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : null;
fs.writeFileSync(
  indexPath,
  JSON.stringify(
    {
      v: 3,
      createdOnFiles: prev?.createdOnFiles ?? { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') },
      title: 'Houna — Design studies',
      launch: { view: 'canvas' },
      pages: [],
      boards,
      order,
      notes,
      designSystems: [],
    },
    null,
    2,
  ) + '\n',
);
console.log(out.map((b) => `${b.file} ${b.w}×${b.h}`).join('\n'));
