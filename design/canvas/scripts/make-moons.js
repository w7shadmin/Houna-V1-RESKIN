// "Houna moon — concepts": new directions for the starfield's moon, side by side on the night sky,
// all breathing on the 5s rhythm, with the original glowing mark and today's pressed teal moon for
// reference. Canvas only, to compare.
const fs = require('fs');
const { mark, halo } = require('./make-appicons.js');
const { DISCS, disc, discHalo, pressedMark } = require('./pressed-kit.js');
const P = __dirname + '/../project/';

const TEAL = '#6FD6CF', GLOW = '111,214,207', LAV = '179,167,245', MOON = '242,236,221';
const BREATH = 'animation: breath 5s ease-in-out infinite';
const box = (inner, style = '') => `<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; ${style}">${inner}</div>`;
const circle = (d, style) => `<span style="position: absolute; left: ${(190 - d) / 2}px; top: ${(190 - d) / 2}px; width: ${d}px; height: ${d}px; border-radius: 999px; ${style}"></span>`;

/** A soft halo ring hugging a disc of diameter d (edge light, clear inside), breathing. */
const edgeGlow = (d, rgb, strength = 0.5, spread = 1.8) => {
  const s = d * spread, e = (d / 2) / (s / 2);
  return circle(s, `background: radial-gradient(circle closest-side, rgba(${rgb},0) ${(e * 100 - 4).toFixed(1)}%, rgba(${rgb},${strength}) ${(e * 100 + 3).toFixed(1)}%, rgba(${rgb},0) 100%); ${BREATH}`);
};

/* Where the mark's pieces sit in its viewBox (17 5.4 20.6 20.6), for tracing it in stars. */
const VB = { x: 17, y: 5.4, s: 20.6 };
const RING = { cx: 27.37, cy: 15.62, r: 8.0 };
const HEAD = { cx: 27.28, cy: 12.36, r: 2.67 };

const CONCEPTS = [
  // References.
  { name: 'Original', tag: 'REFERENCE', note: 'The glowing teal logo, its halo breathing from the logo’s edge.',
    art: () => box(halo(190, 70, GLOW, 0.55), BREATH) + mark(70, TEAL) },
  { name: 'Pressed teal', tag: 'IN THE APP', note: 'A small solid teal moon, the logo pressed in: today’s moon.',
    art: () => box(edgeGlow(84, GLOW, 0.45, 1.8) + circle(84, `background: radial-gradient(circle at 50% 45%, #D9FAF6 0%, #6FD6CF 55%, #2E8F8A 100%); box-shadow: 0 0 14px rgba(${GLOW},0.45)`) + pressedMark(58, '#6FD6CF')) },

  // New concepts.
  { name: 'Crescent cradle', tag: 'NEW', note: 'A thin lit crescent curving round the glowing logo, as if it rests in the moon.',
    art: () => `<svg width="190" height="190" viewBox="0 0 190 190" style="position: absolute; left: 0; top: 0; overflow: visible; ${BREATH}" aria-hidden="true"><defs><radialGradient id="cc" cx="40%" cy="45%" r="60%"><stop offset="0" stop-color="#E6FBF8"></stop><stop offset="0.6" stop-color="#6FD6CF"></stop><stop offset="1" stop-color="#2E8F8A"></stop></radialGradient><mask id="ccm"><rect width="190" height="190" fill="#fff"></rect><circle cx="112" cy="88" r="60" fill="#000"></circle></mask><filter id="ccg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"></feGaussianBlur></filter></defs><circle cx="95" cy="95" r="66" fill="rgba(111,214,207,0.55)" mask="url(#ccm)" filter="url(#ccg)"></circle><circle cx="95" cy="95" r="66" fill="url(#cc)" mask="url(#ccm)"></circle></svg>` + mark(58, TEAL, { style: `margin-left: -20px; margin-top: -32px; filter: drop-shadow(0 0 8px rgba(${GLOW},0.6))` }) },
  { name: 'Phases', tag: 'NEW', note: 'The moon waxes to full on the in-breath and wanes to a crescent on the out-breath: the breath drawn in its light.',
    art: () => box(edgeGlow(110, GLOW, 0.35, 1.7)) + `<div style="position: absolute; left: 40px; top: 40px; width: 110px; height: 110px; border-radius: 999px; overflow: hidden; background: radial-gradient(circle at 45% 40%, #E6FBF8 0%, #6FD6CF 55%, #2E8F8A 100%)"><span style="position: absolute; left: 0; top: -4px; width: 118px; height: 118px; border-radius: 999px; background: #0F1838; box-shadow: 0 0 12px 4px #0F1838; animation: phase 5s ease-in-out infinite"></span></div>` + box(pressedMark(64, '#6FD6CF')) },
  { name: 'Eclipse', tag: 'NEW', note: 'A dark moon with a teal corona breathing round it, the logo glowing on its face.',
    art: () => box(circle(150, `background: radial-gradient(circle closest-side, rgba(${GLOW},0) 58%, rgba(${GLOW},0.85) 66%, rgba(${GLOW},0.25) 78%, rgba(${GLOW},0) 100%); ${BREATH}`)) + circle(100, 'background: radial-gradient(circle at 40% 35%, #1A2550 0%, #0B1026 80%); box-shadow: 0 0 0 1px rgba(111,214,207,0.6), inset 0 0 18px rgba(111,214,207,0.25)') + mark(58, TEAL, { style: `filter: drop-shadow(0 0 6px rgba(${GLOW},0.7))` }) },
  { name: 'Cratered', tag: 'NEW', note: 'A soft moonlit disc with faint craters, the logo pressed in as the largest of them.',
    art: () => {
      const craters = [[58, 62, 16], [120, 58, 11], [128, 112, 18], [66, 124, 12], [100, 136, 8], [140, 86, 7], [52, 96, 7]]
        .map(([x, y, r]) => `<span style="position: absolute; left: ${x - r}px; top: ${y - r}px; width: ${r * 2}px; height: ${r * 2}px; border-radius: 999px; background: radial-gradient(circle at 60% 65%, rgba(255,255,255,0.35) 0%, rgba(47,90,96,0.18) 55%, rgba(47,90,96,0) 75%); box-shadow: inset 1px 1px 2px rgba(20,50,56,0.22)"></span>`).join('');
      return box(edgeGlow(122, MOON, 0.4, 1.7)) + circle(122, 'background: radial-gradient(circle at 42% 38%, #F6FBFA 0%, #D2EAE7 50%, #93BDB9 100%); box-shadow: 0 0 16px rgba(210,234,231,0.4)') + box(craters) + pressedMark(64, '#C3DEDB');
    } },
  { name: 'Constellation', tag: 'NEW', note: 'The logo traced in stars joined by faint lines, twinkling: no disc, the moon made of the sky itself.',
    art: () => {
      const k = 190 / VB.s * 0.8, cx = (x) => 95 + (x - (VB.x + VB.s / 2)) * k, cy = (y) => 95 + (y - (VB.y + VB.s / 2)) * k;
      const pts = [];
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2 - Math.PI / 2; pts.push([RING.cx + RING.r * Math.cos(a), RING.cy + RING.r * Math.sin(a), i % 3 === 0 ? 3.2 : 2.2]); }
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pts.push([HEAD.cx + HEAD.r * Math.cos(a), HEAD.cy + HEAD.r * Math.sin(a), 1.8]); }
      pts.push([27.3, 21.2, 3], [23.2, 15.8, 2.2], [31.4, 15.8, 2.2], [25, 18.8, 1.6], [29.6, 18.8, 1.6]);
      const stars = pts.map(([x, y, r], i) => `<span style="position: absolute; left: ${(cx(x) - r).toFixed(1)}px; top: ${(cy(y) - r).toFixed(1)}px; width: ${r * 2}px; height: ${r * 2}px; border-radius: 999px; background: #F2ECDD; box-shadow: 0 0 ${r * 3}px rgba(${GLOW},0.9); animation: twinkle 4s ease-in-out ${(-(i * 0.37) % 4).toFixed(2)}s infinite"></span>`).join('');
      return mark(152, `rgba(${GLOW},0.5)`, { stroke: 0.1, style: 'opacity: 0.85' }) + stars;
    } },
  { name: 'Line moon', tag: 'NEW', note: 'A fine luminous outline of the moon and the logo, drawn like the app’s icons; the glow breathes.',
    art: () => box(circle(118, `box-sizing: border-box; border: 1.5px solid rgba(${GLOW},0.9); box-shadow: 0 0 14px rgba(${GLOW},0.55), inset 0 0 14px rgba(${GLOW},0.35)`) + mark(66, TEAL, { stroke: 0.28 }), `${BREATH.replace('breath', 'glowbreath')}`) },
  { name: 'Ripples', tag: 'NEW', note: 'A small solid moon sending soft rings outward on each breath out, like a pebble in still water.',
    art: () => [0, 1.67, 3.33].map((d) => circle(76, `box-sizing: border-box; border: 1.5px solid rgba(${GLOW},0.7); animation: ripple 5s ease-out ${d}s infinite; opacity: 0`)).join('') + circle(76, `background: radial-gradient(circle at 50% 45%, #D9FAF6 0%, #6FD6CF 55%, #2E8F8A 100%); box-shadow: 0 0 14px rgba(${GLOW},0.45)`) + pressedMark(52, '#6FD6CF') },
  { name: 'Gibbous', tag: 'NEW', note: 'A side-lit sphere with a real day–night edge; the logo pressed into the lit side.',
    art: () => box(edgeGlow(120, GLOW, 0.3, 1.7)) + circle(120, 'background: radial-gradient(100px 100px at 28% 45%, #EAFBF8 0%, #86DDD6 34%, #3A8E90 58%, #16324A 78%, #0D1733 100%); box-shadow: -6px 0 18px rgba(111,214,207,0.35)') + mark(62, 'rgb(90,160,160)', { style: 'opacity: 0.7; margin-left: -41px' }) },
  { name: 'Moon halo', tag: 'NEW', note: 'The small pressed moon inside a wide, faint atmospheric ring, the kind that circles the moon on a clear cold night.',
    art: () => box(circle(176, `background: radial-gradient(circle closest-side, rgba(${GLOW},0) 80%, rgba(255,210,190,0.22) 86%, rgba(${GLOW},0.42) 90%, rgba(${LAV},0.2) 94%, rgba(${GLOW},0) 100%); ${BREATH}`)) + box(edgeGlow(76, GLOW, 0.4, 1.7)) + circle(76, `background: radial-gradient(circle at 50% 45%, #D9FAF6 0%, #6FD6CF 55%, #2E8F8A 100%); box-shadow: 0 0 14px rgba(${GLOW},0.45)`) + pressedMark(52, '#6FD6CF') },
  { name: 'Pearl', tag: 'NEW', note: 'An iridescent moon, its teal, lavender and rose sheen turning slowly; the logo pressed in.',
    art: () => box(edgeGlow(118, LAV, 0.35, 1.7)) + `<div style="position: absolute; left: 36px; top: 36px; width: 118px; height: 118px; border-radius: 999px; overflow: hidden; box-shadow: 0 0 18px rgba(${GLOW},0.35)"><span style="position: absolute; left: -20%; top: -20%; width: 140%; height: 140%; background: conic-gradient(from 0deg, #BDEFEA, #C9C2F4, #F4C9D6, #F7EAD8, #BDEFEA); filter: blur(10px); animation: sheen 24s linear infinite"></span><span style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 45%), radial-gradient(circle at 70% 80%, rgba(20,40,70,0.25) 0%, rgba(20,40,70,0) 60%)"></span></div>` + pressedMark(64, '#D8D6EC') },
];

const T = { ground: '#0B1026', card: 'rgba(242,236,221,0.045)', border: 'rgba(242,236,221,0.10)', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5', accent: '#6FD6CF' };
let seed = 3;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const stars = () => Array.from({ length: 22 }, () => `<span style="position: absolute; left: ${(rnd() * 280).toFixed(0)}px; top: ${(rnd() * 280).toFixed(0)}px; width: 1.4px; height: 1.4px; border-radius: 999px; background: rgba(242,236,221,${(0.25 + rnd() * 0.5).toFixed(2)})"></span>`).join('');

const tile = (c) => `<div style="display: flex; flex-direction: column; gap: 10px; width: 280px">
<div style="position: relative; width: 280px; height: 280px; border-radius: 24px; overflow: hidden; background: radial-gradient(circle at 50% 50%, #16224A 0%, #0B1026 72%); border: 1px solid ${T.border}">
${stars()}
<div style="position: absolute; left: 45px; top: 45px; width: 190px; height: 190px">${c.art()}</div>
</div>
<div style="display: flex; align-items: center; gap: 8px"><span style="font-size: 16px; font-weight: 600; color: ${T.text}">${c.name}</span><span style="padding: 2px 8px; border-radius: 999px; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.1em; ${c.tag === 'NEW' ? `background: rgba(111,214,207,0.12); border: 1px solid rgba(111,214,207,0.3); color: ${T.accent}` : `background: rgba(242,236,221,0.06); border: 1px solid rgba(242,236,221,0.16); color: ${T.sec}`}">${c.tag}</span></div>
<span style="font-size: 13px; line-height: 1.5; color: ${T.sec}">${c.note}</span>
</div>`;

const COLS = 4, WIDTH = 64 * 2 + COLS * 280 + (COLS - 1) * 28;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Houna moon — concepts</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
@keyframes breath{0%{transform:scale(0.95);opacity:0.35}50%{transform:scale(1.08);opacity:1}100%{transform:scale(0.95);opacity:0.35}}
@keyframes glowbreath{0%{filter:drop-shadow(0 0 2px rgba(111,214,207,0.4));opacity:0.7}50%{filter:drop-shadow(0 0 12px rgba(111,214,207,0.9));opacity:1}100%{filter:drop-shadow(0 0 2px rgba(111,214,207,0.4));opacity:0.7}}
@keyframes phase{0%{transform:translateX(26px)}50%{transform:translateX(124px)}100%{transform:translateX(26px)}}
@keyframes twinkle{0%{opacity:0.35}50%{opacity:1}100%{opacity:0.35}}
@keyframes ripple{0%{transform:scale(1);opacity:0.8}100%{transform:scale(2.3);opacity:0}}
@keyframes sheen{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
</helmet>
<div style="width: ${WIDTH}px; box-sizing: border-box; padding: 64px; background: ${T.ground}; display: flex; flex-direction: column; gap: 36px">
<div style="display: flex; flex-direction: column; gap: 12px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${T.accent}">HOUNA · STARFIELD</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${T.text}">Houna moon — concepts</h1>
<p style="margin: 0; max-width: 860px; font-size: 17px; line-height: 1.5; color: ${T.sec}">New directions for the starfield’s moon, each breathing on the 5s rhythm as it would in the scene. The first two are for reference: the original glowing logo, and the pressed teal moon in the app today. The rest are new.</p>
</div>
<div style="display: grid; grid-template-columns: repeat(${COLS}, 280px); gap: 36px 28px">
${CONCEPTS.map(tile).join('\n')}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${WIDTH},"height":1530}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'MoonConcepts.dc.html', html);
console.log('MoonConcepts.dc.html', (html.length / 1024).toFixed(0) + 'KB · width', WIDTH, '·', CONCEPTS.length, 'tiles');
