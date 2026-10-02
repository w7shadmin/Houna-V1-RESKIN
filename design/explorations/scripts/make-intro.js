// 0 · The intro board: the direction, the woven motifs, the palettes, and where each section's
// inspiration came from.
const K = require('./kit.js');
const N = K.T.night, D = K.T.dusk, S = K.T.sunrise;
const M = K.NIGHT;
const W = 1440, H = 1240;

const motif = (title, note, art) => `<div style="flex: 1; display: flex; flex-direction: column; gap: 14px">
<div style="height: 150px; border-radius: 22px; background: rgba(242,236,221,0.04); border: 1px solid rgba(242,236,221,0.08); display: flex; align-items: center; justify-content: center; overflow: hidden">${art}</div>
<span style="font-size: 16px; font-weight: 600; color: ${M.moonlight}">${title}</span>
<span style="font-size: 13.5px; line-height: 1.5; color: ${M.mist}">${note}</span>
</div>`;
const arch = `<svg width="80" height="120" viewBox="-2 -2 84 124"><path d="${K.archPath(80, 120)}" fill="rgba(111,214,207,0.12)" stroke="${N.tone.glow}" stroke-width="1.5"></path></svg>`;
const star = `<svg width="130" height="130" viewBox="0 0 130 130" style="animation: spin 60s linear infinite"><polygon points="${K.star8(65, 65, 58)}" fill="none" stroke="${N.tone.dusk}" stroke-width="1.5"></polygon><polygon points="${K.star8(65, 65, 34, 22.5)}" fill="none" stroke="${N.tone.dusk}" stroke-width="1" opacity="0.6"></polygon></svg>`;
const lattice = `<svg width="200" height="140" viewBox="0 0 200 140"><defs>${K.lattice('ilat', 40, N.tone.dawn, 1.4)}</defs><rect width="200" height="140" fill="url(#ilat)"></rect></svg>`;
const ring = `<div style="animation: spin 50s linear infinite">${K.ringText('iring', 52, 'هُنا · نتنفّس معًا · '.repeat(3), { font: K.F.arDisplay, size: 13, color: M.moonlight, weight: 700, pad: 12 })}</div>`;
const hilal = `<div style="display: flex; gap: 20px; align-items: center">${K.moon(0.035, 34, { lit: M.moonlight, dark: 'rgba(242,236,221,0.06)', glow: 'rgba(242,236,221,0.5)' })}<span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 26px; color: ${M.moonlight}">١ جمادى</span></div>`;
const numerals = `<div style="display: flex; gap: 22px; align-items: baseline"><span style="font-family: ${K.F.body}; font-weight: 300; font-size: 56px; color: ${M.moonlight}">12</span><span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 52px; color: ${M.moonlight}">١٢</span></div>`;

const swatches = (T) => `<div style="flex: 1; border-radius: 22px; overflow: hidden; border: 1px solid rgba(242,236,221,0.1)">
<div style="height: 90px; background: ${T.ground}; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between"><span style="font-family: ${K.F.display}; font-size: 22px; color: ${T.text}">${T.name}</span><span style="display: flex; gap: 8px">${['glow', 'dusk', 'dawn', 'bloom'].map((k) => `<span style="width: 22px; height: 22px; border-radius: 999px; background: ${T.tone[k]}"></span>`).join('')}</span></div>
</div>`;

const SECTIONS = [
  ['A', 'Meditation player', 'Open (daily hero, minutes wheel), TIDE (arched scenes, alarm ring), Hatch (grainy cards)', '9'],
  ['B', 'Breathing player', 'TIDE (glass orb, orbit), Hatch (dome), Stardust (ridges); star, lattice and arch', '8'],
  ['C', 'Suns and moons', 'Moonly (crescent), Hatch (dome), Stardust (ring of moons); hilal, khatam, fanous', '8'],
  ['D', 'Graphs', 'Stardust (ridges, moons), Oura (arc gauge); practice as light, mood as colour', '7'],
  ['E', 'Account and badges', 'Opal (laurel ring, gems), Oura (big numerals); Kufic ring, the star mosaic', '8'],
  ['F', 'Motion and overlays', 'Glass over blur, shared elements, controls that step aside, words, pills, tabs', '6'],
  ['G', 'First run', 'TIDE (footage, spaced wordmark), Moonly (splash); one breath before any question', '4'],
];

const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(60% 50% at 80% 10%, rgba(111,214,207,0.10), rgba(11,16,38,0) 70%)"></span>
${K.starfield(60, W, 400, 111)}
<div style="position: absolute; left: 80px; top: 80px; right: 80px; display: flex; flex-direction: column; gap: 18px">
<span style="font-family: ${K.F.mono}; font-size: 13px; letter-spacing: 0.18em; color: ${N.accent}">HOUNA · EXPLORATIONS</span>
<h1 style="margin: 0; font-family: ${K.F.display}; font-weight: 400; font-size: 72px; line-height: 1; color: ${M.moonlight}">Quieter, slower, woven</h1>
<p style="margin: 0; max-width: 980px; font-size: 18px; line-height: 1.6; color: ${M.mist}">Alternatives for the players, the suns and moons, the graphs, the account, and the first run. Minimal screens that move slowly, overlays of glass over blur, and Arabic geometry used as structure (the window a scene sits in, the path a breath follows, the ring round your name) rather than as ornament. Every board uses Houna's own three palettes, and every breath paces like the app.</p>
</div>
<div style="position: absolute; left: 80px; right: 80px; top: 370px; display: flex; gap: 20px">
${motif('Mihrab arch', 'The window a scene sits in; light rises inside it as you breathe.', arch)}
${motif('Eight-point star', 'The breath traced on a square; badges as its nine tiles.', star)}
${motif('Mashrabiya', 'A lattice that opens as you breathe in.', lattice)}
${motif('Kufic ring', '“Here · we breathe together”, turning round your name.', ring)}
${motif('Hilal', 'The Hijri month and the first crescent.', hilal)}
${motif('Numerals', 'Figtree Light and Arabic-Indic, never Marcellus.', numerals)}
</div>
<div style="position: absolute; left: 80px; right: 80px; top: 680px; display: flex; gap: 60px">
<div style="flex: 1.4; display: flex; flex-direction: column; gap: 12px">
<span style="font-family: ${K.F.mono}; font-size: 12px; letter-spacing: 0.16em; color: ${M.haze}">SECTIONS · INSPIRATION</span>
${SECTIONS.map(([l, t, n, c]) => `<div style="display: flex; gap: 16px; align-items: baseline; padding: 8px 0; border-bottom: 1px solid rgba(242,236,221,0.08)"><span style="font-family: ${K.F.mono}; font-size: 13px; color: ${N.accent}; width: 18px">${l}</span><span style="width: 190px; font-size: 16px; font-weight: 600; color: ${M.moonlight}">${t}</span><span style="flex: 1; font-size: 13.5px; line-height: 1.45; color: ${M.mist}">${n}</span><span style="font-weight: 300; font-size: 18px; color: ${M.moonlight}">${c}</span></div>`).join('')}
</div>
<div style="flex: 1; display: flex; flex-direction: column; gap: 12px">
<span style="font-family: ${K.F.mono}; font-size: 12px; letter-spacing: 0.16em; color: ${M.haze}">PALETTES</span>
<div style="display: flex; gap: 12px">${swatches(S)}${swatches(D)}${swatches(N)}</div>
<span style="font-size: 13.5px; line-height: 1.55; color: ${M.mist}">Tap, swipe and replay: most boards run in Play. Motion honours Reduce Motion. Photos and footage are the app's own fire, rain and creek scenes.</span>
</div>
</div>`;
module.exports = [K.board('Main.dc.html', { title: 'Houna Explorations — direction', w: W, h: H, root: `background: ${M.midnight}`, body })];
if (require.main === module) console.log('Main.dc.html');
