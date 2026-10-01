// "Houna — Sadu" (https://claude.ai/artifact/RKWjRt6u5F82cUzjFBZBHF): Al Sadu weaving brought into Houna,
// in variants, before anything is built. Rows: the motifs; A the sun's rays; B breathing; C the words
// round the sun and moon; D splash intros; E the Tanafas scenes (with a few Kuwaiti landmarks); F around
// the app; G Night. `node design/sadu/scripts/make-sadu.js` writes every board and canvas.json.
const fs = require('fs');
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const S = require('./sadu-kit.js');

const ROOT = path.join(__dirname, '..', '..', '..');
const DIR = path.join(__dirname, '..', 'project');
fs.mkdirSync(DIR, { recursive: true });
const M = K.NIGHT;
const TS = K.T.sunrise, TD = K.T.dusk, TN = { ...K.T.night, dark: true };
const ANCHOR = 199;
const f = S.f;
const KUFIC = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'constants/kuficRing.ts'), 'utf8');
  return { d: src.match(/d: '([^']*)'/)[1], box: Number(src.match(/box: (\d+)/)[1]) };
})();
const out = [];

/* ── Boards ── */
const PW = 390, PH = 844, PAD = 40, GAP = 40;
function row(file, { title, phones, css = '', capH = 120 }) {
  const W = PAD * 2 + phones.length * PW + (phones.length - 1) * GAP, H = PAD + PH + capH;
  const body = phones
    .map((p, i) => {
      const [name, ...rest] = p.caption.split(' · ');
      return `<div${p.ar ? ' dir="rtl"' : ''} style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; background: ${p.bg}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); font-family: ${p.ar ? K.F.arBody : K.F.body}">${p.html}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${name}</span>${rest.length ? `<span style="font-size: 13px; line-height: 1.45; color: ${M.mist}">${rest.join(' · ')}</span>` : ''}</div>`;
    })
    .join('\n');
  out.push(K.board(file, { title, w: W, h: H, root: 'background: #0E0C14', css: `${CSS}\n${css}`, body, dir: DIR }));
}
const CSS = `@keyframes breath5 { 0%,100% { transform: scale(0.97); opacity: 0.75 } 50% { transform: scale(1.03); opacity: 1 } }
@keyframes spinCw { to { transform: rotate(360deg) } } @keyframes spinCcw { to { transform: rotate(-360deg) } }
@keyframes orb478 { 0% { transform: scale(0.62) } 21% { transform: scale(1) } 58% { transform: scale(1) } 100% { transform: scale(0.62) } }
@keyframes weave { 0% { clip-path: inset(100% 0 0 0) } 40% { clip-path: inset(0 0 0 0) } 60% { clip-path: inset(0 0 0 0) } 100% { clip-path: inset(100% 0 0 0) } }
@keyframes weaveIn { 0% { clip-path: inset(100% 0 0 0) } 55% { clip-path: inset(0 0 0 0) } 100% { clip-path: inset(0 0 0 0) } }
@keyframes unroll { 0% { clip-path: inset(0 100% 0 0) } 45% { clip-path: inset(0 0 0 0) } 100% { clip-path: inset(0 0 0 0) } }
@keyframes riseSun { 0%,35% { transform: translateY(420px) } 80%,100% { transform: translateY(0) } }
@keyframes setSun { 0%,15% { transform: translateY(-260px) } 70%,100% { transform: translateY(0) } }
@keyframes fadeLate { 0%,60% { opacity: 0 } 85%,100% { opacity: 1 } }
@keyframes fadeIn2 { 0%,30% { opacity: 0 } 70%,100% { opacity: 1 } }
@keyframes shuttle { 0% { transform: translateX(-130px) } 50% { transform: translateX(130px) } 100% { transform: translateX(-130px) } }
@keyframes twinkle2 { 0%,100% { opacity: 0.25 } 50% { opacity: 1 } }
@keyframes glintRun { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }
@keyframes driftX { 0% { transform: translateX(0) } 100% { transform: translateX(-120px) } }
@keyframes bob { 0%,100% { transform: translateY(0) rotate(-1deg) } 50% { transform: translateY(3px) rotate(1deg) } }`;

/* ── Pieces ── */
const at = (cx, cy, d, inner, style = '') => `<div aria-hidden="true" style="position: absolute; left: ${f(cx - d / 2)}px; top: ${f(cy - d / 2)}px; width: ${d}px; height: ${d}px; ${style}">${inner}</div>`;
const svgBox = (w, h, inner, style = '') => `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" style="position: absolute; left: 0; top: 0; overflow: visible; ${style}">${inner}</svg>`;
const SKY = {
  sunrise: 'linear-gradient(180deg, #A9DDE0 0%, #DDF1EF 38%, #FCE7D8 74%, #FBC9A6 100%)',
  dawn: 'linear-gradient(180deg, #274A5E 0%, #4F7A86 42%, #C99A8A 80%, #F2B38F 100%)',
  dusk: 'linear-gradient(180deg, #2E2A5C 0%, #5A4E9A 40%, #A785B0 76%, #EFA07E 100%)',
  golden: 'linear-gradient(180deg, #FBE6C8 0%, #F7CFA0 40%, #F0B08A 78%, #E8978A 100%)',
};
/** Sunrise's sun: today's pale-gold disc, the mark pressed in (or the J1 glass when `glass`). */
const sunDisc = (D, glass = false) =>
  glass
    ? `<span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 50% 50%, rgba(255,250,240,0.2) 0%, rgba(255,236,210,0.3) 50%, rgba(251,200,163,0.62) 84%, rgba(249,169,128,0.92) 100%); box-shadow: inset 0 0 0 1.2px rgba(255,240,222,0.95)"></span><span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 34% 28%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 30%)"></span>${at(D / 2, D / 2, D * 0.56, `<div style="position: relative; width: ${D * 0.56}px; height: ${D * 0.56}px">${K.mark(D * 0.56, 'rgba(255,255,255,0.8)')}</div>`)}`
    : `<span style="position: absolute; inset: 0; border-radius: 999px; background: ${K.DISCS.sunrise.stops}"></span>${at(D / 2, D / 2, D * 0.56, K.pressedMark(D * 0.56, K.DISCS.sunrise.surface))}`;
/** Dusk's sun: the ring of light (G15), the mark amber in its middle. */
const duskSun = (D) => `<span style="position: absolute; inset: 0; border-radius: 999px; box-shadow: 0 0 0 ${f(D * 0.06)}px rgba(255,214,160,0.95), 0 0 ${f(D * 0.3)}px rgba(255,190,120,0.7), inset 0 0 ${f(D * 0.2)}px rgba(255,200,140,0.5)"></span>${at(D / 2, D / 2, D * 0.5, `<div style="position: relative; width: ${D * 0.5}px; height: ${D * 0.5}px">${K.mark(D * 0.5, '#F5B47A')}</div>`)}`;
/** Night's moon: the pearl glass, full, the mark pressed in. */
const moonDisc = (D) => `<span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.75) 0%, rgba(242,236,221,0.28) 45%, rgba(214,226,229,0.5) 100%); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.6), 0 0 ${f(D * 0.35)}px rgba(200,236,232,0.35)"></span>${at(D / 2, D / 2, D * 0.52, `<div style="position: relative; width: ${D * 0.52}px; height: ${D * 0.52}px">${K.mark(D * 0.52, 'rgba(170,196,198,0.7)')}</div>`)}`;
const word = (txt, color, top = 520) => `<span style="position: absolute; left: 0; right: 0; top: ${top}px; text-align: center">${K.label(txt, color, 11)}</span>`;
const tanafasHeader = (T, dark) => `<div style="position: absolute; left: 16px; right: 16px; top: 16px; height: 44px; display: flex; align-items: center; justify-content: space-between"><span style="width: 44px; height: 44px; border-radius: 999px; background: ${dark ? 'rgba(242,236,221,0.08)' : 'rgba(255,255,255,0.7)'}"></span><span style="display: flex; gap: 6px; padding: 4px; border-radius: 999px; background: ${dark ? 'rgba(242,236,221,0.08)' : 'rgba(255,255,255,0.55)'}"><span style="padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; background: ${dark ? M.moonlight : T.text}; color: ${dark ? M.midnight : '#fff'}">Breathe</span><span style="padding: 6px 14px; font-size: 13px; color: ${dark ? M.mist : T.sec}">Meditate</span></span><span style="width: 44px; height: 44px; border-radius: 999px; background: ${dark ? 'rgba(242,236,221,0.08)' : 'rgba(255,255,255,0.7)'}"></span></div>`;
/** Home's tab bar (the app today), optionally with a Sadu edge and a woven ring on the raised button. */
function tabBar(T, { on = 0, dark = false, sadu = null } = {}) {
  const names = ['Home', 'Directory', 'Tanafas', 'Events', 'More'];
  const tab = (label, k) =>
    k === 2
      ? `<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; color: ${T.ter}"><span style="position: relative; margin-top: -30px; width: 56px; height: 56px; border-radius: 999px; background: ${T.raised}; box-shadow: 0 0 0 6px ${T.tab}">${sadu ? svgBox(56, 56, S.ring([{ m: 'dhurus2', map: { k: 'k', o: 'o' } }], sadu.pal, 28, 28, 22, 2.2), 'left: 0; top: 0') : ''}</span>${label}</span>`
      : `<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; font-weight: ${k === on ? 600 : 400}; color: ${k === on ? T.tabOn : T.ter}"><span style="width: 22px; height: 22px; border-radius: 6px; border: 1.6px solid currentColor; box-sizing: border-box"></span>${label}</span>`;
  const edge = sadu ? `<div style="position: absolute; left: 0; right: 0; top: -6px; height: 6px">${svgBox(390, 6, S.strip(sadu.segs, sadu.pal, 0, 0, 390, 2, { rib: false }))}</div>` : '';
  return `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 76px; background: ${T.tab}; border-top: 1px solid ${T.tabLine}; display: flex; align-items: flex-start; padding-top: 10px; box-sizing: border-box">${edge}${names.map(tab).join('')}</div>`;
}
/** The Kufic words (هُنا · نتنفّس معًا), the baked outline Profile and Classic Home use, at `size`. */
const kufic = (size, fill, style = '') => `<svg width="${size}" height="${size}" viewBox="0 0 ${KUFIC.box} ${KUFIC.box}" aria-hidden="true" style="position: absolute; inset: 0; ${style}"><path d="${KUFIC.d}" fill="${fill}"></path></svg>`;
/** A ring of Sadu as its own spinning layer, centred in a `box`. */
const sadRing = (box, segs, pal, r0, t, { spin = 0, dir = 'Cw', breathe = false, opacity = 1, cols } = {}) =>
  `<div style="position: absolute; inset: 0; ${spin ? `animation: spin${dir} ${spin}s linear infinite;` : ''} opacity: ${opacity}"><div style="position: absolute; inset: 0; ${breathe ? 'animation: breath5 5s ease-in-out infinite' : ''}">${svgBox(box, box, S.ring(segs, pal, box / 2, box / 2, r0, t, { cols }))}</div></div>`;
/** The scene above, Home beneath (the scene's sun at Home's size), as in the studies. */
const homePanel = (T, inner, label = 'On Home') => `<div style="position: absolute; left: 16px; right: 16px; top: 588px; height: 228px; border-radius: 28px; background: ${T.ground}; box-shadow: 0 0 0 1px rgba(29,43,42,0.1); overflow: hidden"><span style="position: absolute; left: 20px; top: 16px">${K.label(label, T.sec, 10)}</span>${inner}</div>`;

/* ══════════ Main · Direction ══════════ */
(() => {
  const P = S.PAL.classic;
  const motifRow = (key, label) => {
    const m = S.MOTIFS[key];
    const segs = [{ m: key, ground: 'w' }];
    const h = m.rows.length * 10;
    return `<div style="display: flex; flex-direction: column; gap: 8px"><svg width="360" height="${h}" viewBox="0 0 360 ${h}" aria-hidden="true">${S.strip(segs, P, 0, 0, 360, 10)}</svg><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${m.name}</span><span style="font-size: 13.5px; color: ${M.mist}">${label}</span></div>`;
  };
  const sw = (name, pal) => `<div style="display: flex; flex-direction: column; gap: 8px"><span style="display: flex; gap: 6px">${['k', 'w', 'r', 'o', 'b'].map((c) => `<span style="width: 40px; height: 40px; border-radius: 8px; background: ${pal[c]}; box-shadow: 0 0 0 1px rgba(242,236,221,0.15)"></span>`).join('')}</span><span style="font-size: 13.5px; color: ${M.mist}">${name}</span></div>`;
  const ROWS = [
    ['H · From your inspiration', 'Your images: stitched texture, white seed lines, checkered teeth, the star medallion, the Towers in the diamond, upright bands, a weathered poster.'],
    ['A · The sun’s rays, woven', 'Sadu bands wrapped into rings round Sunrise’s sun in place of the star lattice: teeth, facing triangles, the eye, the tree, stepped rays.'],
    ['B · Breathing, woven', 'The Tanafas stage as a loom: rows weave in on the in-breath and unweave on the out; the eye opening; a woven band round the orb; box breathing on a Sadu square; a shuttle.'],
    ['C · Words round the sun and moon', 'The Kufic words, <bdi dir="rtl">هُنا · نتنفّس معًا</bdi>, set into a woven band, alternating with eyes, and a seed ring round Night’s moon.'],
    ['D · Splash intros', 'Sunrise and Dusk openings: a horizon woven row by row; the mark woven in Sadu; a strip unrolling under the wordmark; the sun setting over Kuwait Towers.'],
    ['E · The Tanafas scenes', 'Morning and evening skies over a woven horizon: the tent’s wall, Kuwait Bay and a boom, the Towers at dusk, the skyline with seed stars. Landmarks sparingly.'],
    ['F · Around the app', 'The tab bar’s edge and raised button, page headers, a woven loading strip, Recap’s “your month, woven”, badges as Sadu medallions, Home’s dividers.'],
    ['G · Night', 'The starfield over a moonlit woven horizon; the moon in a seed-and-eye halo; Night Home’s moon ringed in Sadu.'],
  ];
  const body = `<div style="position: absolute; inset: 0; padding: 72px; box-sizing: border-box; display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 16px">${K.label('Houna · Sadu', '#F2B880', 12)}
<span style="font-family: ${K.F.display}; font-size: 64px; line-height: 1.05; color: ${M.moonlight}">Sadu in Houna</span>
<span style="max-width: 1180px; font-size: 17px; line-height: 1.55; color: ${M.mist}">Al Sadu is the Bedouin weaving of Kuwait and the Gulf, on UNESCO’s list of intangible heritage: warp-faced bands of small stepped cells, border motifs round a central tree, in black, brown, beige and red brightened with orange. Here it’s woven into the places Houna already has: the sun’s rays, the breathing stage, the words round the sun and moon, the splash, the Tanafas scenes and the app’s small surfaces, with Kuwait Towers, Liberation Tower, the Grand Mosque and a boom only now and then. Every board moves where the idea is motion. Pick by selecting boards or commenting on one.</span></div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px 40px">${motifRow('hubub', 'Seeds: dots scattered on the ground')}${motifRow('dealla', 'Ribs: short upright bars')}${motifRow('eein', 'Eye: a diamond round a centre')}${motifRow('dhurus', 'Horse teeth: a row of small triangles')}${motifRow('uwairjan', 'Facing triangles, point to point')}${motifRow('shajarah', 'Tree: the long central band')}</div>
<div style="display: flex; gap: 48px">${sw('Traditional: black, beige, red, orange, brown', S.PAL.classic)}${sw('In Sunrise: teal, cream, coral, peach, rose', S.PAL.sunrise)}${sw('In Dusk: indigo, sand, ember, amber, violet', S.PAL.dusk)}${sw('In Night: midnight, moonlight, teal, amber, haze', S.PAL.night)}</div>
<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">${ROWS.map(([t, d]) => `<div style="padding: 20px; border-radius: 18px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); display: flex; flex-direction: column; gap: 8px"><span style="font-size: 16px; font-weight: 600; color: ${M.moonlight}">${t}</span><span style="font-size: 13.5px; line-height: 1.5; color: ${M.mist}">${d}</span></div>`).join('')}</div>
<span style="font-size: 13px; line-height: 1.5; color: ${M.haze}">Motif names from Kuwaiti Al Sadu research (Hubub, Dealla, Eein, Dhurs al-Khail, Uwairjan, Shajarah); confirm the drawings and any Arabic names with the Sadu House before anything ships. Row H follows your inspiration images.</span>
</div>`;
  out.push(K.board('Main.dc.html', { title: 'Sadu in Houna', w: 1600, h: 1320, root: 'background: #0E0C14', body, dir: DIR }));
})();

/* ══════════ A · The sun's rays, woven (Sunrise) ══════════ */
(() => {
  const P = S.PAL.sunrise;
  const D = 104, R = D / 2, BOX = 520;
  const variants = [
    { id: 'A1', name: 'Teeth', note: 'Two rings of horse teeth pointing outward from the sun, turning slowly opposite ways: the most like rays.', layers: [{ segs: [{ m: 'dhurus', map: { k: 'r' }, flip: true }], r0: R + 22, t: 7, spin: 90 }, { segs: [{ m: 'dhurus', map: { k: 'o' }, flip: true }], r0: R + 64, t: 9, spin: 120, dir: 'Ccw' }] },
    { id: 'A2', name: 'Facing triangles', note: 'One wide ring of Uwairjan: teal triangles out, coral in, meeting point to point round the sun.', layers: [{ segs: [{ m: 'uwairjan', map: { k: 'k', r: 'r' } }], r0: R + 26, t: 7, spin: 110 }] },
    { id: 'A3', name: 'The eye ring', note: 'A band of Eein diamonds between two plain threads, breathing with the 5 s breath; seeds scattered beyond it.', layers: [{ segs: [{ m: 'stripe', map: { k: 'o' } }, { m: 'eein', map: { k: 'r', r: 'k' } }, { m: 'stripe', map: { k: 'o' } }], r0: R + 24, t: 6, spin: 140, breathe: true }, { segs: [{ m: 'hububOff', map: { o: 'o' } }], r0: R + 110, t: 8, spin: 200, dir: 'Ccw', opacity: 0.8 }] },
    { id: 'A4', name: 'The tree, round the sun', note: 'The Shajarah band, the weaver’s masterpiece, as one ring with borders of teeth: the richest; slow.', layers: [{ segs: [{ m: 'dhurus', map: { k: 'o' } }, { m: 'shajarah', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'dhurus', map: { k: 'o' }, flip: true }], r0: R + 22, t: 5.5, spin: 180 }] },
    { id: 'A5', name: 'Stepped rays', note: 'Twelve rays built of woven steps, each narrowing outward, so the sun’s rays are woven rather than drawn.', layers: [{ segs: [{ m: 'uwairjan', map: { k: null, r: 'r' }, flip: false }], r0: R + 18, t: 12, spin: 120, cols: 72 }] },
    { id: 'A6', name: 'Bands of light', note: 'Thin concentric woven bands (ribs, seeds, chevrons) fading outward like the sun’s glow, breathing.', layers: [{ segs: [{ m: 'dealla', map: { k: 'o', r: 'r' } }], r0: R + 18, t: 4, spin: 100 }, { segs: [{ m: 'chevron', map: { k: 'r' } }], r0: R + 52, t: 5, spin: 140, dir: 'Ccw', opacity: 0.75 }, { segs: [{ m: 'hubub', map: { o: 'o' } }], r0: R + 96, t: 6, spin: 180, opacity: 0.55 }] },
  ];
  const rings = (v, scale = 1, box = BOX) => v.layers.map((l) => sadRing(box, l.segs, P, l.r0 * scale, l.t * scale, { spin: l.spin, dir: l.dir || 'Cw', breathe: l.breathe, opacity: l.opacity ?? 0.9, cols: l.cols })).join('');
  const phone = (v) => `<span style="position: absolute; inset: 0; background: ${SKY.sunrise}"></span>
${at(195, ANCHOR, BOX, rings(v))}
${at(195, ANCHOR, D, sunDisc(D))}
${word('Tanafas', '#58595B')}
${homePanel(TS, `${at(179, 120, 300, rings(v, 0.52, 300))}${at(179, 120, 84, sunDisc(84))}`)}`;
  row('A-rays.dc.html', {
    title: 'A · The sun’s rays, woven',
    phones: variants.map((v) => ({ bg: TS.ground, caption: `${v.id} · ${v.name} · ${v.note}`, html: phone(v) })),
  });
})();

/* ══════════ B · Breathing, woven ══════════ */
(() => {
  const PS = S.PAL.sunrise, PN = S.PAL.night;
  const ORB = 250;
  const orb = (T, dark, inner = '') => `<span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 40% 34%, ${dark ? 'rgba(111,214,207,0.35)' : 'rgba(255,255,255,0.8)'} 0%, ${dark ? 'rgba(59,170,167,0.18)' : 'rgba(59,170,167,0.22)'} 60%, ${dark ? 'rgba(59,170,167,0.32)' : 'rgba(25,102,98,0.28)'} 100%); box-shadow: inset 0 0 0 1.5px ${dark ? 'rgba(111,214,207,0.6)' : 'rgba(25,102,98,0.45)'}"></span>${inner}`;
  const stageWords = (T, dark, w = 'Breathe in', sub = '4-7-8 · Round 1 of 4') => `<div style="position: absolute; left: 0; right: 0; top: 420px; display: flex; flex-direction: column; align-items: center; gap: 8px"><span style="font-family: ${K.F.display}; font-size: 26px; color: ${dark ? M.moonlight : T.text}">${w}</span><span style="font-size: 13px; color: ${dark ? M.mist : T.sec}">${sub}</span></div>`;
  const ground = (T, dark) => dark ? `<span style="position: absolute; inset: 0; background: linear-gradient(180deg, #0B1026, #121A3E)"></span>${K.starfield(60, 390, 844, 7)}` : `<span style="position: absolute; inset: 0; background: linear-gradient(180deg, #F2F6F4 0%, #FCE7D8 100%)"></span>`;
  // B1 · the loom
  const loomSegs = [{ m: 'dhurus', map: { k: 'k' } }, { m: 'stripe', map: { k: 'r' } }, { m: 'eein', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'r' } }, { m: 'dhurus', map: { k: 'k' }, flip: true }];
  const loomRows = S.rowsOf(loomSegs);
  const loom = (pal, dark) => {
    const cs = 9, w = 360, h = loomRows * cs;
    return `<div style="position: absolute; left: 15px; top: ${ANCHOR - h / 2}px; width: ${w}px; height: ${h}px; animation: weave 19s steps(${loomRows * 2}) infinite">${svgBox(w, h, S.strip(loomSegs, pal, 0, 0, w, cs))}</div>
<div style="position: absolute; left: 15px; top: ${ANCHOR - h / 2 - 40}px; width: ${w}px; height: ${h + 80}px">${svgBox(w, h + 80, Array.from({ length: 41 }, (_, i) => `<line x1="${i * 9}" y1="0" x2="${i * 9}" y2="${h + 80}" stroke="${dark ? 'rgba(242,236,221,0.12)' : 'rgba(25,102,98,0.14)'}" stroke-width="0.8"></line>`).join(''))}</div>`;
  };
  // B2 · the eye opening: concentric diamonds breathing
  const eye = (pal) => {
    const box = 300, c = box / 2;
    const diamonds = [0, 1, 2, 3, 4].map((i) => {
      const r = 26 + i * 24, col = [pal.r, pal.k, pal.o, pal.k, pal.r][i];
      return `<g style="transform-origin: ${c}px ${c}px; animation: orb478 19s ease-in-out ${-i * 0.25}s infinite"><path d="M${c} ${c - r} L${c + r} ${c} L${c} ${c + r} L${c - r} ${c} Z" fill="none" stroke="${col}" stroke-width="${i % 2 ? 7 : 4}" stroke-dasharray="${i % 2 ? '7 5' : '0'}"></path></g>`;
    }).join('');
    return at(195, ANCHOR, box, svgBox(box, box, diamonds));
  };
  // B3 · a woven band round the orb's middle
  const bandOrb = (T, pal, dark) => {
    const segs = [{ m: 'dhurus', map: { k: 'k' } }, { m: 'uwairjan', map: { k: 'r', r: 'o' } }, { m: 'dhurus', map: { k: 'k' }, flip: true }];
    const h = S.rowsOf(segs) * 6;
    return at(195, ANCHOR, ORB, `<div style="position: absolute; inset: 0; animation: orb478 19s ease-in-out infinite">${orb(T, dark)}<div style="position: absolute; inset: 0; border-radius: 999px; overflow: hidden"><div style="position: absolute; left: 0; top: ${ORB / 2 - h / 2}px; width: ${ORB}px; height: ${h}px; opacity: 0.9">${svgBox(ORB, h, S.strip(segs, pal, 0, 0, ORB, 6))}</div></div>${at(ORB / 2, ORB / 2, 70, `<div style="position: relative; width: 70px; height: 70px">${K.mark(70, dark ? 'rgba(242,236,221,0.85)' : '#196662')}</div>`)}</div>`);
  };
  // B4 · box breathing on a Sadu square, a bead tracing it
  const boxSq = (pal, dark) => {
    const s = 220, x0 = 195 - s / 2, y0 = ANCHOR - s / 2, cs = 5;
    const segs = [{ m: 'dhurus', map: { k: 'r' } }, { m: 'stripe', map: { k: 'k' } }];
    const bh = S.rowsOf(segs) * cs;
    const side = (rot) => `<g transform="rotate(${rot} 195 ${ANCHOR})">${S.strip(segs, pal, x0, y0 - bh, s, cs, { rib: false })}</g>`;
    const pathD = `M${x0} ${y0} H${x0 + s} V${y0 + s} H${x0} Z`;
    return svgBox(390, 844, `${[0, 90, 180, 270].map(side).join('')}<circle r="8" fill="${dark ? M.moonlight : '#196662'}"><animateMotion dur="16s" repeatCount="indefinite" path="${pathD}"></animateMotion></circle>`) + at(195, ANCHOR, 80, `<div style="position: relative; width: 80px; height: 80px">${K.mark(80, dark ? 'rgba(242,236,221,0.7)' : 'rgba(25,102,98,0.75)')}</div>`);
  };
  // B5 · the shuttle: weft lines laid one by one as the shuttle passes
  const shuttle = (pal, dark) => {
    const lines = Array.from({ length: 14 }, (_, i) => `<rect x="60" y="${ANCHOR + 70 - i * 10}" width="270" height="6" rx="1" fill="${[pal.k, pal.r, pal.o, pal.k, pal.w][i % 5]}" style="opacity: 0; animation: fadeIn2 19s linear ${-19 + i * 0.6}s infinite"></rect>`).join('');
    return `${svgBox(390, 844, lines)}<div style="position: absolute; left: 165px; top: ${ANCHOR - 120}px; width: 60px; height: 16px; animation: shuttle 4s ease-in-out infinite">${svgBox(60, 16, `<path d="M0 8 Q30 -4 60 8 Q30 20 0 8 Z" fill="${dark ? M.moonlight : '#6B4A33'}"></path>`)}</div>${at(195, ANCHOR - 40, 74, `<div style="position: relative; width: 74px; height: 74px">${K.mark(74, dark ? 'rgba(242,236,221,0.6)' : 'rgba(25,102,98,0.6)')}</div>`)}`;
  };
  const phones = [
    { id: 'B1', name: 'The loom (Sunrise)', note: 'Rows weave in from the bottom, one by one, on the in-breath, hold, then unweave on the out-breath: the breath literally makes the cloth. Warp threads stay faint behind.', T: TS, dark: false, html: (T, d) => loom(PS, d) },
    { id: 'B1n', name: 'The loom (Night)', note: 'The same in Night: moonlight, teal and amber on midnight.', T: TN, dark: true, html: (T, d) => loom(PN, d) },
    { id: 'B2', name: 'The eye opening', note: 'Eein’s diamonds open outward with the in-breath and close with the out, the solid and the woven ones a beat apart.', T: TS, dark: false, html: (T, d) => eye(PS) },
    { id: 'B3', name: 'A band round the orb', note: '4-7-8’s glass orb with a Sadu band across its middle, like a belt of weave; it swells and settles with the orb.', T: TS, dark: false, html: (T, d) => bandOrb(T, PS, d) },
    { id: 'B4', name: 'Box breathing, woven', note: 'Box breathing’s square drawn as four woven sides (teeth over a thread); the bead walks one side per phase.', T: TN, dark: true, html: (T, d) => boxSq(PN, d) },
    { id: 'B5', name: 'The shuttle', note: 'A shuttle crosses on each breath and lays one weft line; over a session the lines build a small woven band beneath the mark.', T: TS, dark: false, html: (T, d) => shuttle(PS, d) },
  ];
  row('B-breathing.dc.html', {
    title: 'B · Breathing, woven',
    phones: phones.map((p) => ({ bg: p.dark ? M.midnight : TS.ground, caption: `${p.id} · ${p.name} · ${p.note}`, html: `${ground(p.T, p.dark)}${tanafasHeader(p.T, p.dark)}${p.html(p.T, p.dark)}${stageWords(p.T, p.dark, p.id === 'B4' ? 'Hold' : 'Breathe in', p.id === 'B4' ? 'Box breathing · Round 2' : '4-7-8 · Round 1 of 4')}${tabBar(p.T, { dark: p.dark })}` })),
  });
})();

/* ══════════ C · Words round the sun and moon ══════════ */
(() => {
  const PD = S.PAL.dusk, PS = S.PAL.sunrise, PN = S.PAL.night;
  const BOX = 330;
  const scene = (sky, inner, dark = true) => `<span style="position: absolute; inset: 0; background: ${sky}"></span>${dark ? K.starfield(30, 390, 420, 3) : ''}${inner}${word('Tanafas', dark ? 'rgba(242,236,221,0.7)' : '#58595B')}`;
  const C1 = () => {
    // A woven band with the words laid over it in the band's light colour, the band turning slowly.
    const segs = [{ m: 'dhurus', map: { k: 'o' } }, { m: 'stripe', map: { k: 'k' }, rep: 6 }, { m: 'dhurus', map: { k: 'o' }, flip: true }];
    return at(195, ANCHOR, BOX, `${sadRing(BOX, segs, PD, 92, 5, { spin: 160 })}<div style="position: absolute; inset: 0; animation: spinCw 160s linear infinite">${kufic(BOX, '#FBE6C8', 'transform: scale(0.82)')}</div>`) + at(195, ANCHOR, 104, duskSun(104));
  };
  const C2 = () => {
    const segs = [{ m: 'eein', map: { k: 'o', r: 'r' } }];
    return at(195, ANCHOR, BOX, `${sadRing(BOX, segs, PD, 134, 3.6, { spin: 200, dir: 'Ccw', opacity: 0.85 })}<div style="position: absolute; inset: 0; animation: spinCw 120s linear infinite">${kufic(BOX, '#F5B08A', 'transform: scale(0.72)')}</div>`) + at(195, ANCHOR, 104, duskSun(104));
  };
  const C3 = () => {
    const segs = [{ m: 'hubub', map: { o: 'w' } }];
    return at(195, ANCHOR, BOX, `${sadRing(BOX, segs, PN, 128, 5, { spin: 240, opacity: 0.8 })}<div style="position: absolute; inset: 0; animation: spinCcw 160s linear infinite">${kufic(BOX, 'rgba(242,236,221,0.75)', 'transform: scale(0.7)')}</div>`) + at(195, ANCHOR, 110, moonDisc(110));
  };
  const C4 = () => {
    const segs = [{ m: 'dhurus', map: { k: 'r' }, flip: true }, { m: 'stripe', map: { k: 'k' } }, { m: 'dhurus', map: { k: 'o' } }];
    return at(195, ANCHOR, BOX, `${sadRing(BOX, segs, PS, 128, 5, { spin: 150, dir: 'Ccw' })}<div style="position: absolute; inset: 0; animation: spinCw 120s linear infinite">${kufic(BOX, '#196662', 'transform: scale(0.66)')}</div>`) + at(195, ANCHOR, 104, sunDisc(104, true));
  };
  const C5 = () => {
    // The words woven: the Kufic outline filled with a Sadu pattern (an SVG pattern, the band's cells).
    const segs = [{ m: 'dhurus2', map: { k: 'r', o: 'o' } }];
    const p = S.period(segs), rows = S.rowsOf(segs), cs = KUFIC.box / 160;
    const pat = `<defs><pattern id="kufpat" width="${f(p * cs)}" height="${f(rows * cs)}" patternUnits="userSpaceOnUse">${S.rectBand(S.band(segs, PD, p), 0, 0, cs, { rib: false })}</pattern></defs>`;
    return at(195, ANCHOR, BOX, `<div style="position: absolute; inset: 0; animation: spinCw 160s linear infinite"><svg width="${BOX}" height="${BOX}" viewBox="0 0 ${KUFIC.box} ${KUFIC.box}" aria-hidden="true" style="position: absolute; inset: 0; transform: scale(0.8)">${pat}<path d="${KUFIC.d}" fill="url(#kufpat)"></path></svg></div>`) + at(195, ANCHOR, 104, duskSun(104));
  };
  const phones = [
    { id: 'C1', name: 'Words on a woven band (Dusk)', note: 'The Kufic words laid in sand over a dark woven band edged with amber teeth, turning together round the ring of light.', sky: SKY.dusk, html: C1 },
    { id: 'C2', name: 'Words and eyes (Dusk)', note: 'The words turning one way, a fine ring of Eein diamonds the other, just outside them.', sky: SKY.dusk, html: C2 },
    { id: 'C3', name: 'Seeds round the moon (Night)', note: 'A ring of Hubub seeds in moonlight round the pearl moon, the words inside it turning the other way.', sky: `linear-gradient(180deg, #0B1026, #121A3E)`, html: C3 },
    { id: 'C4', name: 'Sadu outside, words inside (Sunrise)', note: 'A woven ring of coral and peach teeth outside, Houna’s words in teal inside, round the glass sun (J1).', sky: SKY.sunrise, html: C4, light: true },
    { id: 'C5', name: 'The words, woven (Dusk)', note: 'The words themselves filled with a two-colour weave instead of a flat colour, as if the letters were the cloth.', sky: SKY.dusk, html: C5 },
  ];
  row('C-words.dc.html', {
    title: 'C · Words round the sun and moon',
    phones: phones.map((p) => ({ bg: M.midnight, caption: `${p.id} · ${p.name} · ${p.note}`, html: scene(p.sky, p.html(), !p.light) })),
  });
})();

/* ══════════ D · Splash intros ══════════ */
(() => {
  const PS = S.PAL.sunrise, PD = S.PAL.dusk;
  const logoAt = (top, T, anim = 'animation: fadeLate 6s ease-out infinite') => `<div style="position: absolute; left: ${195 - 60}px; top: ${top}px; ${anim}">${K.logo(T.logoP, T.logoS, 120)}</div>`;
  const tag = (top, color) => `<span style="position: absolute; left: 0; right: 0; top: ${top}px; text-align: center; font-family: ${K.F.display}; font-size: 17px; color: ${color}; animation: fadeLate 6s ease-out infinite">Breathe · rest · return</span>`;
  // D1 · a horizon woven row by row, then the sun rises through it
  const horizonSegs = [{ m: 'dhurus', map: { k: 'o' } }, { m: 'stripe', map: { k: 'r' } }, { m: 'shajarah', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'r' } }, { m: 'uwairjan', map: { k: 'k', r: 'b' }, ground: 'w' }, { m: 'stripe', map: { k: 'k' }, rep: 2 }];
  const hRows = S.rowsOf(horizonSegs), cs = 8, hh = hRows * cs;
  const D1 = `<span style="position: absolute; inset: 0; background: ${SKY.sunrise}"></span>
<div style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; overflow: hidden">${at(195, 300, 104, sunDisc(104), 'animation: riseSun 6s cubic-bezier(.3,.7,.3,1) infinite')}</div>
<div style="position: absolute; left: 0; top: ${844 - hh - 60}px; width: 390px; height: ${hh + 60}px; background: ${TS.ground}; animation: weaveIn 6s steps(${hRows}) infinite"><div style="position: absolute; left: 0; top: 0">${svgBox(390, hh, S.strip(horizonSegs, PS, 0, 0, 390, cs))}</div></div>
${logoAt(430, TS)}${tag(482, TS.text)}`;
  // D2 · the mark woven in Sadu, row by row
  const markSegs = [{ m: 'dhurus2', map: { k: 'k', o: 'r' } }, { m: 'stripe', map: { k: 'o' } }, { m: 'hubub', map: { o: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'o' } }];
  const mp = S.period(markSegs), mr = S.rowsOf(markSegs), mcs = 0.55;
  const D2 = `<span style="position: absolute; inset: 0; background: ${TS.ground}"></span>
<svg width="0" height="0" style="position: absolute"><defs><pattern id="markpat" width="${f(mp * mcs)}" height="${f(mr * mcs)}" patternUnits="userSpaceOnUse">${S.rectBand(S.band(markSegs, PS, mp), 0, 0, mcs, { rib: false })}</pattern></defs></svg>
${at(195, 330, 200, `<div style="position: relative; width: 200px; height: 200px; animation: weaveIn 6s steps(24) infinite">${K.mark(200, 'url(#markpat)')}</div>`)}
${at(195, 330, 200, `<div style="position: relative; width: 200px; height: 200px; opacity: 0.25">${K.mark(200, 'none', { stroke: 0.15 })}</div>`)}
${logoAt(500, TS)}${tag(552, TS.text)}`;
  // D3 · a strip unrolls under the wordmark (Dusk)
  const stripSegs = [{ m: 'dhurus', map: { k: 'o' } }, { m: 'eein', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'dhurus', map: { k: 'o' }, flip: true }];
  const sr = S.rowsOf(stripSegs);
  const D3 = `<span style="position: absolute; inset: 0; background: ${SKY.golden}"></span>
${at(195, 300, 104, duskSun(104), 'animation: fadeIn2 6s ease-out infinite')}
<div style="position: absolute; left: 0; top: 452px; width: 390px; height: ${sr * 6}px; animation: unroll 6s cubic-bezier(.4,0,.2,1) infinite">${svgBox(390, sr * 6, S.strip(stripSegs, PD, 0, 0, 390, 6))}</div>
${logoAt(580, TD)}${tag(632, TD.text)}`;
  // D4 · the sun sets over Kuwait Towers (Dusk); a woven band for the shore
  const shoreSegs = [{ m: 'dhurus', map: { k: 'o' } }, { m: 'stripe', map: { k: 'k' }, rep: 2 }];
  const D4 = `<span style="position: absolute; inset: 0; background: ${SKY.dusk}"></span>${K.starfield(40, 390, 380, 21)}
<div style="position: absolute; inset: 0; overflow: hidden">${at(195, 420, 92, duskSun(92), 'animation: setSun 6s cubic-bezier(.3,.7,.3,1) infinite')}</div>
${svgBox(390, 844, `${S.kuwaitTowers(210, 600, 230, { fill: '#2E2A5C', disc: 'rgba(111,214,207,0.45)' })}<rect x="0" y="600" width="390" height="244" fill="#2E2A5C"></rect>`)}
<div style="position: absolute; left: 0; top: 600px">${svgBox(390, 40, S.strip(shoreSegs, PD, 0, 0, 390, 6))}</div>
<div style="position: absolute; left: ${195 - 60}px; top: 676px; animation: fadeLate 6s ease-out infinite">${K.logo('#F5B08A', '#FBE6C8', 120)}</div>`;
  // D5 · sunrise: the band forms first, then the mark rises from it as the sun
  const D5 = `<span style="position: absolute; inset: 0; background: ${SKY.dawn}"></span>
<div style="position: absolute; left: 0; top: 520px; width: 390px; height: 64px; animation: unroll 6s ease-out infinite">${svgBox(390, 64, S.strip([{ m: 'uwairjan', map: { k: 'o', r: 'r' } }, { m: 'stripe', map: { k: 'w' } }], PS, 0, 0, 390, 8))}</div>
<div style="position: absolute; inset: 0 0 324px 0; overflow: hidden">${at(195, 330, 104, sunDisc(104, true), 'animation: riseSun 6s cubic-bezier(.3,.7,.3,1) infinite')}</div>
<div style="position: absolute; left: ${195 - 60}px; top: 640px; animation: fadeLate 6s ease-out infinite">${K.logo('#FFF4E8', '#FFE6CC', 120)}</div>`;
  const phones = [
    { id: 'D1', name: 'A horizon, woven (Sunrise)', note: 'The ground weaves itself row by row from the bottom (teeth, tree, facing triangles), then the sun rises behind it; the wordmark settles on the cloth.', html: D1 },
    { id: 'D2', name: 'The mark, woven (Sunrise)', note: 'The Houna mark fills with a weave row by row, as if made on the loom, its outline faint first; then the wordmark.', html: D2 },
    { id: 'D3', name: 'A strip unrolls (Dusk)', note: 'Dusk’s ring of light comes up in golden hour; a band of eyes unrolls across beneath it, and the wordmark sits on it.', html: D3 },
    { id: 'D4', name: 'Sunset over the Towers (Dusk)', note: 'The sun sets towards Kuwait Towers, its spheres flecked like their real discs, over a woven shore. The one landmark splash.', html: D4 },
    { id: 'D5', name: 'Dawn over the weave (Sunrise)', note: 'Pre-dawn: a band unrolls along the horizon, and the glass sun rises from it.', html: D5 },
  ];
  row('D-splash.dc.html', {
    title: 'D · Splash intros',
    phones: phones.map((p) => ({ bg: TS.ground, caption: `${p.id} · ${p.name} · ${p.note}`, html: p.html })),
  });
})();

/* ══════════ E · The Tanafas scenes ══════════ */
(() => {
  const PS = S.PAL.sunrise, PD = S.PAL.dusk;
  const E1segs = [{ m: 'dhurus', map: { k: 'o' } }, { m: 'stripe', map: { k: 'r' } }, { m: 'eein', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'r' } }, { m: 'dhurus', map: { k: 'k' }, flip: true }, { m: 'stripe', map: { k: 'k' }, rep: 3 }];
  const E1 = `<span style="position: absolute; inset: 0; background: ${SKY.sunrise}"></span>${at(195, ANCHOR, 104, sunDisc(104, true))}
<div style="position: absolute; left: 0; top: 650px">${svgBox(390, 200, S.strip(E1segs, PS, 0, 0, 390, 8))}</div>${word('Tanafas', '#58595B')}`;
  // E2 · the bayt al-sha'ar: its woven wall framing the bottom, the tent's ridge line above
  const wallSegs = [{ m: 'stripe', map: { k: 'k' }, rep: 2 }, { m: 'shajarah', map: { k: 'w', r: 'o' }, ground: 'k' }, { m: 'stripe', map: { k: 'r' } }, { m: 'dhurus2', map: { k: 'k', o: 'o' } }, { m: 'stripe', map: { k: 'k' }, rep: 2 }];
  const E2 = `<span style="position: absolute; inset: 0; background: ${SKY.sunrise}"></span>${at(195, ANCHOR, 104, sunDisc(104))}
<svg width="390" height="844" style="position: absolute; inset: 0" aria-hidden="true"><path d="M-10 560 Q195 500 400 560 L400 600 L-10 600 Z" fill="#3A2A22" opacity="0.85"></path></svg>
<div style="position: absolute; left: 0; top: 596px">${svgBox(390, 260, S.strip(wallSegs, S.PAL.classic, 0, 0, 390, 9))}</div>
${word('Tanafas', '#58595B', 440)}`;
  // E3 · Dusk: Kuwait Towers on the water, the reflection woven
  const reflSegs = [{ m: 'dealla', map: { k: 'o', r: 'r' } }, { m: 'stripe', map: { k: 'k' } }, { m: 'hubub', map: { o: 'o' }, ground: 'k' }, { m: 'stripe', map: { k: 'k' } }];
  const E3 = `<span style="position: absolute; inset: 0; background: ${SKY.dusk}"></span>${K.starfield(50, 390, 420, 41)}${at(195, ANCHOR, 104, duskSun(104))}
${svgBox(390, 844, `${S.kuwaitTowers(250, 640, 240, { fill: '#2B2650', disc: 'rgba(111,214,207,0.5)' })}<rect x="0" y="640" width="390" height="204" fill="#2B2650"></rect>`)}
<div style="position: absolute; left: 0; top: 652px; opacity: 0.85; -webkit-mask-image: linear-gradient(180deg, #000, transparent); mask-image: linear-gradient(180deg, #000, transparent)"><div style="width: 520px; animation: driftX 30s linear infinite">${svgBox(520, 190, S.strip(reflSegs, PD, 0, 0, 520, 6, { rib: false }))}</div></div>
${word('Tanafas', 'rgba(242,236,221,0.7)', 780)}`;
  // E4 · Sunrise over Kuwait Bay, a boom on a woven sea
  const seaSegs = [{ m: 'chevron', map: { k: 'k' }, ground: 'w' }, { m: 'stripe', map: { k: 'o' } }, { m: 'chevron', map: { k: 'r' }, ground: 'w' }];
  const E4 = `<span style="position: absolute; inset: 0; background: ${SKY.sunrise}"></span>${at(195, ANCHOR, 104, sunDisc(104, true))}
<div style="position: absolute; left: 0; top: 640px; width: 390px; height: 204px; background: #E9F4F1"></div>
<div style="position: absolute; left: 0; top: 650px; opacity: 0.55"><div style="width: 560px; animation: driftX 40s linear infinite">${svgBox(560, 120, S.strip(seaSegs, PS, 0, 0, 560, 7, { rib: false }))}</div></div>
<div style="position: absolute; left: 70px; top: 556px; width: 120px; height: 90px; animation: bob 6s ease-in-out infinite">${svgBox(120, 90, S.dhow(0, 86, 110, '#196662', '#FFF4E8'))}</div>
${word('Tanafas', '#58595B', 520)}`;
  // E5 · Dusk skyline: Liberation Tower and the Grand Mosque low, seed-stars woven in the sky
  const E5 = `<span style="position: absolute; inset: 0; background: ${SKY.dusk}"></span>
${svgBox(390, 520, Array.from({ length: 70 }, (_, i) => { const x = (i * 97) % 390, y = (i * 53) % 470; return `<rect x="${x}" y="${y}" width="3" height="3" fill="${i % 3 ? '#FBE6C8' : '#F5B08A'}" style="animation: twinkle2 ${3 + (i % 5)}s ease-in-out ${-(i % 7)}s infinite"></rect>`; }).join(''))}
${at(195, ANCHOR, 104, duskSun(104))}
${svgBox(390, 844, `${S.liberationTower(300, 660, 300, '#2B2650')}${S.mosque(40, 660, 140, '#2B2650')}${S.kuwaitTowers(220, 660, 120, { fill: '#2B2650' })}<rect x="0" y="660" width="390" height="184" fill="#2B2650"></rect>`)}
<div style="position: absolute; left: 0; top: 660px">${svgBox(390, 30, S.strip([{ m: 'dhurus', map: { k: 'o' } }, { m: 'stripe', map: { k: 'r' } }], PD, 0, 0, 390, 5))}</div>
${word('Tanafas', 'rgba(242,236,221,0.7)', 780)}`;
  // E6 · Sunrise: the woven horizon with a breathing session on (the orb above the band)
  const E6 = `<span style="position: absolute; inset: 0; background: ${SKY.sunrise}"></span>
${at(195, ANCHOR, 230, `<span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 40% 34%, rgba(255,255,255,0.8), rgba(249,169,128,0.25) 70%, rgba(232,88,44,0.25)); box-shadow: inset 0 0 0 1.5px rgba(232,88,44,0.4); animation: orb478 19s ease-in-out infinite"></span>`)}
${at(195, ANCHOR, 70, `<div style="position: relative; width: 70px; height: 70px">${K.mark(70, '#E8582C')}</div>`)}
<div style="position: absolute; left: 0; right: 0; top: 380px; text-align: center; font-family: ${K.F.display}; font-size: 26px; color: ${TS.text}">Breathe in</div>
<div style="position: absolute; left: 0; top: 700px">${svgBox(390, 150, S.strip([{ m: 'uwairjan', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'o' } }, { m: 'dhurus', map: { k: 'k' } }, { m: 'stripe', map: { k: 'k' }, rep: 3 }], PS, 0, 0, 390, 8))}</div>`;
  const phones = [
    { id: 'E1', name: 'A woven horizon (Sunrise)', note: 'The morning sky resting on a woven ground: teeth, eyes and threads in Sunrise’s colours, the glass sun above. No landmark.', html: E1 },
    { id: 'E2', name: 'The tent’s wall (Sunrise)', note: 'From inside the bayt al-sha’ar: its woven wall in traditional black, beige, red and orange framing the bottom, the morning beyond.', html: E2 },
    { id: 'E3', name: 'The Towers at dusk (Dusk)', note: 'Kuwait Towers on the bay, their spheres flecked like the real discs; the water’s reflection is a weave drifting slowly.', html: E3 },
    { id: 'E4', name: 'A boom on the bay (Sunrise)', note: 'A Kuwaiti boom rocking gently on a sea woven in soft chevrons, under the morning sun.', html: E4 },
    { id: 'E5', name: 'The skyline, seed stars (Dusk)', note: 'Liberation Tower, the Grand Mosque and the Towers low on the horizon; the first stars are woven seeds, square, twinkling.', html: E5 },
    { id: 'E6', name: 'A session over the weave (Sunrise)', note: 'During a breathing session: the orb breathing above, the woven horizon steady below, nothing else.', html: E6 },
  ];
  row('E-scenes.dc.html', {
    title: 'E · The Tanafas scenes',
    phones: phones.map((p) => ({ bg: TS.ground, caption: `${p.id} · ${p.name} · ${p.note}`, html: p.html })),
  });
})();

/* ══════════ F · Around the app ══════════ */
(() => {
  const PS = S.PAL.sunrise, PN = S.PAL.night;
  const T = TS;
  const pageHead = (title, sub) => `<div style="position: absolute; left: 16px; right: 16px; top: 76px; display: flex; flex-direction: column; gap: 6px">${K.label('Directory', T.accent, 11)}<span style="font-family: ${K.F.display}; font-size: 32px; color: ${T.text}">${title}</span><span style="font-size: 14px; color: ${T.sec}">${sub}</span></div>`;
  const card = (top, h = 84) => `<div style="position: absolute; left: 16px; right: 16px; top: ${top}px; height: ${h}px; border-radius: 20px; background: #fff; box-shadow: 0 0 0 1px ${T.line}; display: flex; align-items: center; gap: 12px; padding: 12px; box-sizing: border-box"><span style="width: 60px; height: 60px; border-radius: 14px; background: #E5EEEC"></span><span style="display: flex; flex-direction: column; gap: 6px"><span style="width: 150px; height: 12px; border-radius: 6px; background: #D5DEDC"></span><span style="width: 200px; height: 10px; border-radius: 6px; background: #E7ECEB"></span></span></div>`;
  const thin = [{ m: 'dhurus', map: { k: 'r' } }, { m: 'stripe', map: { k: 'k' } }];
  const F1 = `<span style="position: absolute; inset: 0; background: ${T.ground}"></span>${pageHead('Tab bar', 'A woven edge and ring')}${card(200)}${card(296)}${card(392)}${tabBar(T, { sadu: { pal: PS, segs: thin } })}`;
  const F2 = `<span style="position: absolute; inset: 0; background: ${T.ground}"></span>${pageHead('Professionals', 'Therapists and psychiatrists listed on houna.org')}
<div style="position: absolute; left: 16px; top: 172px">${svgBox(358, 24, S.strip([{ m: 'dhurus', map: { k: 'o' } }, { m: 'stripe', map: { k: 'r' } }, { m: 'dhurus', map: { k: 'k' }, flip: true }], PS, 0, 0, 358, 3))}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 212px; height: 52px; border-radius: 26px; background: #fff; box-shadow: 0 0 0 1px ${T.line}"></div>${card(284)}${card(380)}${card(476)}${tabBar(T, { on: 1 })}`;
  // F3 · loading: the cards weave in
  const F3 = `<span style="position: absolute; inset: 0; background: ${T.ground}"></span>${pageHead('Read & listen', 'Articles and podcasts on mental health')}
<div style="position: absolute; left: 95px; top: 330px; width: 200px; height: 30px; animation: weave 3s steps(10) infinite">${svgBox(200, 30, S.strip([{ m: 'dhurus2', map: { k: 'k', o: 'o' } }, { m: 'stripe', map: { k: 'r' } }, { m: 'hubub', map: { o: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'k' } }], PS, 0, 0, 200, 4))}</div>
<span style="position: absolute; left: 0; right: 0; top: 376px; text-align: center; font-size: 14px; color: ${T.sec}">Loading…</span>
<div style="position: absolute; left: 40px; right: 40px; top: 470px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center"><svg width="120" height="40" aria-hidden="true">${S.strip([{ m: 'eein', map: { k: 'k', r: 'r' } }], PS, 0, 0, 120, 5)}</svg><span style="font-size: 15px; color: ${T.text}">Nothing matches yet.</span><span style="font-size: 13px; color: ${T.sec}">An empty state with a single woven eye.</span></div>${tabBar(T, { on: 1 })}`;
  // F4 · Recap: your month, woven (each day a row; practised days in colour)
  const days = [1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1];
  const motifsByDay = ['dhurus', 'eein', 'uwairjan', 'dealla', 'chevron', 'hubub'];
  const recap = days.map((d, i) => {
    const m = motifsByDay[i % motifsByDay.length];
    const segs = [{ m, map: { k: d ? (i % 2 ? 'r' : 'o') : 'b', r: 'r', o: 'o' }, ground: null }];
    const h = S.rowsOf(segs) * 2.2;
    return { h, svg: (y) => `<g opacity="${d ? 1 : 0.18}">${S.strip(segs, S.PAL.night, 30, y, 330, 2.2, { rib: false })}</g>` };
  });
  let y = 0;
  const recapSvg = recap.map((r) => { const s = r.svg(y); y += r.h + 3; return s; }).join('');
  const F4 = `<span style="position: absolute; inset: 0; background: linear-gradient(180deg, #121A3E, #0B1026)"></span>
<div style="position: absolute; left: 16px; right: 16px; top: 56px; display: flex; gap: 4px">${Array.from({ length: 7 }, (_, i) => `<span style="flex: 1; height: 3px; border-radius: 2px; background: rgba(242,236,221,${i < 3 ? 0.9 : 0.25})"></span>`).join('')}</div>
<div style="position: absolute; left: 24px; right: 24px; top: 92px; display: flex; flex-direction: column; gap: 8px">${K.label('September', '#F2B880', 11)}<span style="font-family: ${K.F.display}; font-size: 30px; line-height: 1.15; color: ${M.moonlight}">Your month, woven</span><span style="font-size: 14px; color: ${M.mist}">Each day a row. The days you practised are in colour; the rest stay quiet, never missed.</span></div>
<div style="position: absolute; left: 0; top: 230px; width: 390px; height: ${y}px">${svgBox(390, y, recapSvg)}</div>
<span style="position: absolute; left: 0; right: 0; top: ${240 + y}px; text-align: center; font-family: ${K.F.numeral || K.F.body}; font-size: 15px; color: ${M.mist}">21 days woven</span>`;
  // F5 · badges as Sadu medallions (eye-centred)
  const medal = (cx, cy, d, pal, lit) => at(cx, cy, d, `<div style="position: absolute; inset: 0; border-radius: 999px; background: ${lit ? '#FFF4E8' : '#E9EEED'}; box-shadow: 0 0 0 1px ${T.line}"></div>${svgBox(d, d, `${S.ring([{ m: 'dhurus', map: { k: lit ? 'r' : 'b' } }], pal, d / 2, d / 2, d * 0.32, 2.4)}${S.ring([{ m: 'hubub', map: { o: lit ? 'o' : 'b' } }], pal, d / 2, d / 2, d * 0.43, 2)}`, `opacity: ${lit ? 1 : 0.35}`)}${at(d / 2, d / 2, d * 0.42, `<div style="position: relative; width: ${d * 0.42}px; height: ${d * 0.42}px">${K.mark(d * 0.42, lit ? '#196662' : '#B8C2C0')}</div>`)}`);
  const names = ['3 days', '7 days', '14 days', '30 days', '100 days', 'First breath', 'Every breath', 'Every scene', 'Sky watcher'];
  const F5 = `<span style="position: absolute; inset: 0; background: ${T.ground}"></span><div style="position: absolute; left: 16px; right: 16px; top: 60px; display: flex; flex-direction: column; gap: 6px">${K.label('Profile', T.accent, 11)}<span style="font-family: ${K.F.display}; font-size: 30px; color: ${T.text}">Badges</span></div>
${names.map((n, i) => { const cx = 75 + (i % 3) * 120, cy = 210 + Math.floor(i / 3) * 170; return `${medal(cx, cy, 96, PS, i < 4 || i === 5)}<span style="position: absolute; left: ${cx - 55}px; top: ${cy + 58}px; width: 110px; text-align: center; font-size: 12.5px; color: ${T.sec}">${n}</span>`; }).join('')}`;
  // F6 · Home with a woven divider over the map and under the Hijri line (Night)
  const F6 = `<span style="position: absolute; inset: 0; background: ${M.midnight}"></span>${K.starfield(50, 390, 700, 13)}
<div style="position: absolute; left: ${195 - 36}px; top: 28px">${K.logo('#6FD6CF', '#F2ECDD', 72)}</div>
<span style="position: absolute; left: 0; right: 0; top: 72px; text-align: center; font-size: 12.5px; color: ${M.mist}">20 Rabiʿ II · Waning gibbous</span>
<div style="position: absolute; left: 155px; top: 94px">${svgBox(80, 8, S.strip([{ m: 'hubub', map: { o: 'o' } }], PN, 0, 0, 80, 2.4, { rib: false }))}</div>
${at(195, ANCHOR, 120, moonDisc(120))}
<div style="position: absolute; left: 24px; right: 24px; top: 300px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">${K.label('● You’re not alone', '#6FD6CF', 11)}<span style="font-family: ${K.F.display}; font-size: 20px; color: ${M.moonlight}">You are one light among many.</span></div>
<div style="position: absolute; left: 16px; top: 384px">${svgBox(358, 12, S.strip([{ m: 'dhurus', map: { k: 'r' } }, { m: 'stripe', map: { k: 'o' } }], PN, 0, 0, 358, 2.4, { rib: false }))}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 404px; display: flex; justify-content: space-between">${K.label('Breathing together', M.haze, 10)}<span style="padding: 5px 11px; border-radius: 999px; font-size: 11px; background: ${M.moonlight}; color: ${M.midnight}">Month</span></div>
${tabBar(TN, { sadu: { pal: PN, segs: thin } })}`;
  const phones = [
    { id: 'F1', name: 'The tab bar', note: 'A thin woven edge (teeth over a thread) along the tab bar’s top, and a ring of two-colour teeth round the raised Tanafas button.', html: F1 },
    { id: 'F2', name: 'Page headers', note: 'A narrow woven band under each Directory and Events header, in place of a rule: the pages get their own art.', html: F2 },
    { id: 'F3', name: 'Loading and empty', note: 'Loading weaves a small band row by row; an empty list shows one woven eye.', html: F3 },
    { id: 'F4', name: 'Recap: your month, woven', note: 'Each day a row of weave, a motif per day; practised days in colour, the rest quiet (never “missed”): the month becomes a cloth.', html: F4 },
    { id: 'F5', name: 'Badges as medallions', note: 'Each badge a round Sadu medallion (teeth and seeds round the mark); not yet earned, the same in shadow.', html: F5 },
    { id: 'F6', name: 'Home’s dividers (Night)', note: 'Small woven touches on Home: seeds under the Hijri line, a fine band above Breathing together, the woven tab edge.', html: F6 },
  ];
  row('F-app.dc.html', {
    title: 'F · Around the app',
    phones: phones.map((p) => ({ bg: T.ground, caption: `${p.id} · ${p.name} · ${p.note}`, html: p.html })),
  });
})();

/* ══════════ G · Night ══════════ */
(() => {
  const PN = S.PAL.night;
  const nightSky = `<span style="position: absolute; inset: 0; background: linear-gradient(180deg, #0B1026 0%, #121A3E 70%, #1B2350 100%)"></span>`;
  const G1 = `${nightSky}${K.starfield(110, 390, 640, 77)}${at(195, ANCHOR, 120, moonDisc(120))}
<div style="position: absolute; left: 0; top: 690px">${svgBox(390, 160, S.strip([{ m: 'dhurus', map: { k: 'r' } }, { m: 'stripe', map: { k: 'b' } }, { m: 'eein', map: { k: 'w', r: 'o' }, ground: 'k' }, { m: 'stripe', map: { k: 'b' } }, { m: 'stripe', map: { k: 'k' }, rep: 4 }], PN, 0, 0, 390, 7))}</div>
${word('Tanafas', 'rgba(242,236,221,0.6)', 560)}`;
  const G2 = `${nightSky}${K.starfield(90, 390, 844, 78)}
${at(195, ANCHOR, 360, `${sadRing(360, [{ m: 'hubub', map: { o: 'w' } }], PN, 96, 5, { spin: 220, opacity: 0.7 })}${sadRing(360, [{ m: 'eein', map: { k: 'r', r: 'o' } }], PN, 130, 3.4, { spin: 300, dir: 'Ccw', opacity: 0.75, breathe: true })}`)}
${at(195, ANCHOR, 120, moonDisc(120))}${word('Tanafas', 'rgba(242,236,221,0.6)', 560)}`;
  const G3 = `${nightSky}${K.starfield(50, 390, 700, 79)}
<div style="position: absolute; left: ${195 - 36}px; top: 28px">${K.logo('#6FD6CF', '#F2ECDD', 72)}</div>
<span style="position: absolute; left: 0; right: 0; top: 72px; text-align: center; font-size: 12.5px; color: ${M.mist}">20 Rabiʿ II · Waning gibbous</span>
${at(195, ANCHOR, 240, sadRing(240, [{ m: 'dhurus', map: { k: 'r' }, flip: true }, { m: 'stripe', map: { k: 'o' } }], PN, 80, 3.2, { spin: 160, opacity: 0.85 }))}
${at(195, ANCHOR, 120, moonDisc(120))}
<div style="position: absolute; left: 24px; right: 24px; top: 330px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">${K.label('● You’re not alone', '#6FD6CF', 11)}<span style="font-family: ${K.F.display}; font-size: 20px; color: ${M.moonlight}">Someone, somewhere, is breathing with you.</span></div>
${tabBar(TN, { dark: true })}`;
  const G4 = `${nightSky}${K.starfield(70, 390, 600, 80)}
${at(195, ANCHOR, 120, moonDisc(120))}
${svgBox(390, 844, `${S.kuwaitTowers(270, 700, 210, { fill: '#2A3468', disc: 'rgba(111,214,207,0.6)' })}<rect x="0" y="700" width="390" height="144" fill="#2A3468"></rect>`)}
<div style="position: absolute; left: 0; top: 700px">${svgBox(390, 30, S.strip([{ m: 'hubub', map: { o: 'r' }, ground: 'k' }, { m: 'stripe', map: { k: 'b' } }], PN, 0, 0, 390, 5, { rib: false }))}</div>
${word('Tanafas', 'rgba(242,236,221,0.6)', 560)}`;
  const phones = [
    { id: 'G1', name: 'A moonlit weave', note: 'The starfield resting on a woven horizon in moonlight, teal and amber: the night’s ground.', html: G1 },
    { id: 'G2', name: 'The moon’s woven halo', note: 'Seeds in moonlight round the moon, and a fine ring of eyes outside them breathing on the 5 s clock.', html: G2 },
    { id: 'G3', name: 'Night Home, ringed', note: 'Night Home’s pearl moon inside a ring of teal teeth and an amber thread, turning slowly.', html: G3 },
    { id: 'G4', name: 'The Towers by moonlight', note: 'Kuwait Towers dark against the night, their discs catching teal; a seeded thread along the shore.', html: G4 },
  ];
  row('G-night.dc.html', {
    title: 'G · Night',
    phones: phones.map((p) => ({ bg: M.midnight, caption: `${p.id} · ${p.name} · ${p.note}`, html: p.html })),
  });
})();

/* ══════════ H · From the inspiration: stitches, checkers, the medallion, the Towers in the diamond ══════════ */
(() => {
  const PC = S.PAL.classic;
  const RBW = { k: '#151116', w: '#F4EEE4', r: '#B3242C', o: '#E08A2C', b: '#6B1E24', g: '#1F6B4A' };
  // H1 · a stitched horizon: red and black stripes, dotted seed lines, white checker teeth on black
  const H1segs = [{ m: 'stripe', map: { k: 'r' }, rep: 2 }, { m: 'stripe', map: { k: 'k' } }, { m: 'dots', ground: 'k' }, { m: 'stripe', map: { k: 'k' } }, { m: 'checkTri', ground: 'k' }, { m: 'checkTri', ground: 'k', flip: true, shift: 6 }, { m: 'stripe', map: { k: 'k' } }, { m: 'dots', ground: 'k' }, { m: 'stripe', map: { k: 'k' } }, { m: 'stripe', map: { k: 'r' }, rep: 3 }];
  const H1 = `<span style="position: absolute; inset: 0; background: ${SKY.sunrise}"></span>${at(195, ANCHOR, 104, sunDisc(104, true))}
<div style="position: absolute; left: 0; top: 600px">${svgBox(390, 260, S.strip(H1segs, RBW, 0, 0, 390, 9, { bead: true }))}</div>${word('Tanafas', '#58595B', 520)}`;
  // H2 · the Towers in the diamond: four checkered triangles point in, the Towers in the space between
  const N = 8, cs = 11, tri = S.checkerTriangle(N, RBW.r, RBW.k), tw = 2 * N * cs, th = N * cs;
  // Apex toward the centre, a clear space round it for the Towers.
  const triAt = (rot) => `<g transform="rotate(${rot} 195 330)">${S.rectBand([...tri].reverse(), 195 - tw / 2, 330 - th - 96, cs, { rib: false })}</g>`;
  const border = (top) => `<div style="position: absolute; left: 0; top: ${top}px">${svgBox(390, 40, S.strip([{ m: 'lozenge', map: { k: 'b', r: 'o' }, ground: 'w' }], { ...RBW, o: '#C9907A', b: '#5A3A36' }, 0, 0, 390, 7, { rib: false }))}</div>`;
  const H2 = `<span style="position: absolute; inset: 0; background: #F5ECDD"></span>${K.grain('h2g', 0.18, 1.2)}
${border(36)}
<div style="position: absolute; inset: 0; animation: fadeIn2 6s ease-out infinite">${svgBox(390, 844, `${triAt(180)}${triAt(0)}${triAt(90)}${triAt(270)}`)}</div>
<div style="position: absolute; inset: 0; animation: fadeLate 6s ease-out infinite">${svgBox(390, 844, `${S.kuwaitTowers(200, 408, 150, { fill: '#151116' })}${S.fish(46, 236, 50, '#151116')}${S.camel(290, 262, 54, '#151116')}`)}</div>
${border(560)}
<div style="position: absolute; left: ${195 - 60}px; top: 640px; animation: fadeLate 6s ease-out infinite">${K.logo('#B3242C', '#151116', 120)}</div>
<span style="position: absolute; left: 0; right: 0; top: 700px; text-align: center; font-family: ${K.F.display}; font-size: 17px; color: #151116; animation: fadeLate 6s ease-out infinite">Breathe · rest · return</span>`;
  // H3 · the star medallion (the photo's white star with its red and green heart) as the sun's rays
  const med = (() => {
    const W = 33, Hh = 15, cx = 16, cy = 7, rows = [];
    for (let j = 0; j < Hh; j++) {
      const line = [];
      for (let c = 0; c < W; c++) {
        const dx = Math.abs(c - cx), dy = Math.abs(j - cy);
        let col = null;
        if (dx / 1.6 + dy <= 3) col = (c + j) % 2 ? RBW.r : RBW.g;
        else if (dx / 1.6 + dy <= 4) col = RBW.w;
        else if (dy <= 0 && dx <= 16) col = dx > 12 ? RBW.r : RBW.w;
        else if (dy <= 1 && dx >= 9 && dx <= 15 && (dx - 9) % 3 !== 2) col = RBW.r;
        else if (dy <= 7 && dy >= 4 && dx <= 7 - (dy - 4) * 2 && dx >= 1) col = RBW.w;
        line.push(col);
      }
      rows.push(line);
    }
    return rows;
  })();
  const H3 = `<span style="position: absolute; inset: 0; background: ${SKY.sunrise}"></span>
${at(195, ANCHOR, 400, `<div style="position: absolute; inset: 0; animation: breath5 5s ease-in-out infinite">${svgBox(400, 400, S.rectBand(med, 200 - 33 * 6, 200 - 15 * 6, 12, { bead: true }))}</div>`)}
${at(195, ANCHOR, 64, sunDisc(64, true))}${word('Tanafas', '#58595B')}
${homePanel(TS, `${at(179, 120, 220, svgBox(220, 220, S.rectBand(med, 110 - 33 * 3, 110 - 15 * 3, 6)))}${at(179, 120, 40, sunDisc(40, true))}`)}`;
  // H4 · Night's moon in true Sadu red, black and white
  const H4 = `<span style="position: absolute; inset: 0; background: linear-gradient(180deg, #0B1026, #151116)"></span>${K.starfield(70, 390, 600, 90)}
${at(195, ANCHOR, 340, `${sadRing(340, [{ m: 'stripe', map: { k: 'r' } }, { m: 'dots', ground: 'k' }, { m: 'stripe', map: { k: 'k' } }, { m: 'checkTri', ground: 'k' }, { m: 'stripe', map: { k: 'r' } }], RBW, 72, 4.2, { spin: 220 })}`)}
${at(195, ANCHOR, 120, moonDisc(120))}${word('Tanafas', 'rgba(242,236,221,0.6)', 560)}`;
  // H5 · the Meditate hero over upright Sadu bands
  const vSegs = [{ m: 'stripe', map: { k: 'r' }, rep: 2 }, { m: 'dots', ground: 'k' }, { m: 'stripe', map: { k: 'k' } }, { m: 'eein', map: { k: 'w', r: 'o' }, ground: 'k' }, { m: 'stripe', map: { k: 'k' } }, { m: 'dots', ground: 'k' }, { m: 'stripe', map: { k: 'r' }, rep: 2 }, { m: 'lozenge', map: { k: 'k', r: 'o' }, ground: 'r' }, { m: 'stripe', map: { k: 'r' }, rep: 2 }];
  const vRows = S.rowsOf(vSegs);
  const H5 = `<span style="position: absolute; inset: 0; background: #151116"></span>
<div style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; opacity: 0.55">${svgBox(390, 844, `<g transform="rotate(90 0 0) translate(0 -390)">${S.strip(vSegs, RBW, 0, 0, 844, 390 / vRows, { bead: true })}</g>`)}</div>
<span style="position: absolute; inset: 0; background: radial-gradient(60% 40% at 50% 40%, rgba(21,17,22,0.85), rgba(21,17,22,0.2) 80%)"></span>
${tanafasHeader(TN, true)}
<div style="position: absolute; left: 0; right: 0; top: 150px; display: flex; flex-direction: column; align-items: center; gap: 6px">${K.label('Thursday 1 October', '#F4EEE4', 11)}<span style="font-size: 13px; color: rgba(244,238,228,0.7)">19 Rabiʿ II 1448</span></div>
${at(195, 380, 120, `<span style="position: absolute; inset: 0; border-radius: 999px; box-shadow: 0 0 0 2px #F4EEE4, 0 0 40px rgba(224,138,44,0.5)"></span>${svgBox(120, 120, '<path d="M50 40 L84 60 L50 80 Z" fill="#F4EEE4"></path>')}`)}
<span style="position: absolute; left: 40px; right: 40px; top: 470px; text-align: center; font-family: ${K.F.display}; font-size: 20px; color: #F4EEE4">Sit by the fire a while.</span>
${tabBar(TN, { dark: true })}`;
  // H6 · a weathered poster: Recap's cover in the shawl poster's style (beige, grain, woven blocks in an arch)
  const archSegs = [{ m: 'checker', map: { k: 'k', r: 'o' } }, { m: 'stripe', map: { k: 'r' }, rep: 2 }, { m: 'dhurus', map: { k: 'k' }, ground: 'o' }, { m: 'stripe', map: { k: 'k' } }, { m: 'eein', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'k' } }, { m: 'uwairjan', map: { k: 'r', r: 'k' }, ground: 'o' }, { m: 'stripe', map: { k: 'r' }, rep: 2 }, { m: 'checker', map: { k: 'k', r: 'o' } }, { m: 'shajarah', map: { k: 'k', r: 'r' }, ground: 'w' }, { m: 'stripe', map: { k: 'r' }, rep: 2 }];
  const archW = 270, archH = 520;
  const H6 = `<span style="position: absolute; inset: 0; background: #E8D7B8"></span>${K.grain('h6g', 0.35, 0.9)}
<svg width="390" height="844" style="position: absolute; inset: 0" aria-hidden="true"><defs><clipPath id="arch6"><path d="M${195 - archW / 2} ${180 + archH} V${180 + archW / 2} A${archW / 2} ${archW / 2} 0 0 1 ${195 + archW / 2} ${180 + archW / 2} V${180 + archH} Z"></path></clipPath></defs><g clip-path="url(#arch6)">${S.strip(archSegs, { ...RBW, o: '#D9A35B', w: '#F1E4CC' }, 195 - archW / 2, 180, archW, 10)}${S.strip(archSegs, { ...RBW, o: '#D9A35B', w: '#F1E4CC' }, 195 - archW / 2, 180 + S.rowsOf(archSegs) * 10, archW, 10)}</g></svg>
${K.grain('h6g2', 0.25, 0.7)}
<div style="position: absolute; left: 24px; right: 24px; top: 64px; display: flex; flex-direction: column; align-items: center; gap: 8px">${K.label('September', '#6B1E24', 11)}<span style="font-family: ${K.F.display}; font-size: 30px; color: #151116">Your month, gently</span></div>
${at(195, 380, 110, sunDisc(110))}
<span style="position: absolute; left: 0; right: 0; top: 730px; text-align: center; font-size: 14px; color: #3A2A22">Tap to begin</span>`;
  const phones = [
    { id: 'H1', name: 'A stitched horizon (Sunrise)', note: 'The weave as the photos show it, each cell a small lozenge stitch: red and black stripes, white seed lines, white checker teeth on black, under the glass sun.', html: H1 },
    { id: 'H2', name: 'The Towers in the diamond (splash)', note: 'After your Towers piece: four checkered triangles point inward, Kuwait Towers in the space between, a zubaidi and a camel beside them, lozenge borders, the wordmark beneath.', html: H2 },
    { id: 'H3', name: 'The star medallion (Sunrise)', note: 'The photo’s white star with its red and green heart as the sun’s rays, its arms along the horizon, breathing; small on Home.', html: H3 },
    { id: 'H4', name: 'Red, black and white (Night)', note: 'The moon ringed in true Sadu colours: a red thread, a white seed line, white checker teeth on black.', html: H4 },
    { id: 'H5', name: 'Upright bands (Meditate)', note: 'The Meditate hero over the upright bands of your inspiration, stitched, darkened round the play ring.', html: H5 },
    { id: 'H6', name: 'A weathered poster (Recap)', note: 'After the shawl poster: Recap’s cover on grained beige, the month’s woven blocks in a mihrab arch, the sun over them.', html: H6 },
  ];
  row('H-inspiration.dc.html', {
    title: 'H · From your inspiration',
    phones: phones.map((p) => ({ bg: '#F5ECDD', caption: `${p.id} · ${p.name} · ${p.note}`, html: p.html })),
  });
})();

/* ── The canvas ── */
const ROWS = [['Main.dc.html'], ['H-inspiration.dc.html'], ['A-rays.dc.html'], ['B-breathing.dc.html'], ['C-words.dc.html'], ['D-splash.dc.html'], ['E-scenes.dc.html'], ['F-app.dc.html'], ['G-night.dc.html']];
const TITLES = { 1: 'H · From your inspiration', 2: 'A · The sun’s rays, woven', 3: 'B · Breathing, woven', 4: 'C · Words round the sun and moon', 5: 'D · Splash intros', 6: 'E · The Tanafas scenes', 7: 'F · Around the app', 8: 'G · Night' };
const byFile = Object.fromEntries(out.map((b) => [b.file, b]));
const boards = {}, notes = {}, order = [];
let y = 0;
ROWS.forEach((files, r) => {
  if (TITLES[r]) {
    y += 260;
    const width = files.reduce((a, fl) => a + byFile[fl].w, 0) + (files.length - 1) * 80;
    notes[`row${r}`] = { kind: 'title1', text: TITLES[r], x: 0, y: y - 240, maxW: Math.max(width, 2000), w: 240 };
  }
  let x = 0, h = 0;
  for (const fl of files) {
    const b = byFile[fl];
    boards[fl] = { x, y, w: b.w, h: b.h, title: b.title };
    order.push(fl);
    x += b.w + 80;
    h = Math.max(h, b.h);
  }
  y += h + 120;
});
const indexPath = path.join(DIR, 'canvas.json');
const prev = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : null;
fs.writeFileSync(indexPath, JSON.stringify({ v: 3, createdOnFiles: prev?.createdOnFiles ?? { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') }, title: 'Houna — Sadu', launch: { view: 'canvas' }, pages: [], boards, order, notes, designSystems: [] }, null, 2) + '\n');
console.log(out.map((b) => `${b.file} ${b.w}×${b.h}`).join('\n'));
