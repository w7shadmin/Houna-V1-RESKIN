// "Round 2 — Home's map without its card": the real app, today and with the card's box removed
// (the same map, chips and count at the same size, straight on the sky), captured from the web
// preview at 2x into project/img/r2/. Recapture if Home changes.
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;
const PW = 390, PH = 844, PAD = 40, GAP = 40;
const SHOTS = [
  ['night', 'card', 'Night, today · The map in its card.'],
  ['night', 'nocard', 'Night, no card · The map, chips and count straight on the sky, where the card was: nothing else moves.'],
  ['day', 'card', 'Dusk, today'],
  ['day', 'nocard', 'Dusk, no card · The chips keep their pill, so the choice still reads as a control.'],
  ['sunrise', 'card', 'Sunrise, today'],
  ['sunrise', 'nocard', 'Sunrise, no card · Lighter: the page reads as one sky, from the sun down to the count.'],
];
const body = SHOTS.map(([t, k, caption], i) => {
  const [name, ...rest] = caption.split(' · ');
  const x = PAD + i * (PW + GAP);
  return `<img src="img/r2/home-${k}-${t}.png" alt="${name}" style="position: absolute; left: ${x}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35)">
<div style="position: absolute; left: ${x}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${name}</span>${rest.length ? `<span style="font-size: 13px; line-height: 1.45; color: ${M.mist}">${rest.join(' · ')}</span>` : ''}</div>`;
}).join('\n');
const W = PAD * 2 + SHOTS.length * PW + (SHOTS.length - 1) * GAP;
const out = [K.board('HomeMapR2.dc.html', { title: 'Round 2 — Home’s map without its card', w: W, h: PAD + PH + 110, root: 'background: #070B1C', body, dir: DIR })];
module.exports = out;
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}`).join('\n'));
