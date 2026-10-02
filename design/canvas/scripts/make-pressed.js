// "Pressed logo: side by side": close-ups of each Home scene's settled moon or sun on its own sky,
// today's next to the pressed-logo alternative (the mark pressed into a solid disc, as the breathing
// orbs press it), all breathing as they do in the scenes. Canvas only, to compare.
const fs = require('fs');
const { mark, halo } = require('./make-appicons.js');
const { DISCS, disc, discHalo, pressedMark } = require('./pressed-kit.js');
const P = __dirname + '/../project/';

const TILE = 340, ZOOM = 1.45; // a close-up: the 190px mark box at 1.45×

const BREATH = 'animation: breath 5s ease-in-out infinite';
const rays = `<span style="position: absolute; left: -95px; top: -95px; width: 380px; height: 380px; border-radius: 999px; background: repeating-conic-gradient(from 0deg, rgba(255,222,190,0.45) 0deg 3deg, rgba(255,222,190,0) 3deg 15deg); -webkit-mask-image: radial-gradient(circle, #000 26%, transparent 64%); mask-image: radial-gradient(circle, #000 26%, transparent 64%); animation: rays 120s linear infinite"></span>`;

/** A sun or moon in its 190px box, as the scene settles it (0.9). */
const moonToday = () => `<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; animation: breath 5s ease-in-out infinite">${halo(190, 70, '111,214,207', 0.55)}</div>${mark(70, '#6FD6CF')}`;
const pressedMoon = (d) => `<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; transform: scale(0.9)">${discHalo(d, BREATH)}${disc(d)}${pressedMark(70, d.surface)}</div>`;
const sun = (d, withRays, flatMark) => `<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; transform: scale(0.9)"><div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; ${BREATH}">${withRays ? rays : ''}${discHalo(d)}</div>${disc(d)}${flatMark ? mark(70, flatMark) : pressedMark(70, d.surface)}</div>`;

const ROWS = [
  { name: 'Night', scene: 'Houna starfield', sky: 'radial-gradient(circle at 50% 50%, #16224A 0%, #0B1026 75%)', text: '#F2ECDD', tiles: [
    ['Today', 'The glowing teal logo, its halo breathing from the logo’s edge.', moonToday()],
    ['Pressed · teal moon', 'A solid teal moon (the Profile avatar’s orb), the logo pressed in.', pressedMoon(DISCS.teal)],
    ['Pressed · silver moon', 'A moonlight moon, white to Moonlight to a warm grey rim, the logo pressed in.', pressedMoon(DISCS.silver)],
  ] },
  { name: 'Sunrise', scene: 'Houna sunrise', sky: 'linear-gradient(180deg, #A9DDE0 0%, #DDF1EF 45%, #FCE7D8 100%)', text: '#1D2B2A', tiles: [
    ['Today', 'The pale-gold sun, the logo in Dark Turquoise on it.', sun(DISCS.sunrise, true, '#196662')],
    ['Pressed', 'The same sun, the logo pressed into it: a hollow in the gold.', sun(DISCS.sunrise, true, null)],
  ] },
  { name: 'Dusk', scene: 'Houna dusk', sky: 'linear-gradient(180deg, #5A4E9A 0%, #A785B0 60%, #EFA07E 100%)', text: '#1B2140', tiles: [
    ['Today', 'The amber evening sun, the logo in deep teal on it.', sun(DISCS.dusk, false, '#237873')],
    ['Pressed', 'The same sun, the logo pressed into it: a hollow in the amber.', sun(DISCS.dusk, false, null)],
  ] },
];

const T = { ground: '#F4F2EE', text: '#1B2140', sec: '#4A5078', ter: '#646A8E', line: 'rgba(27,33,64,0.10)', accent: '#237873' };
const tile = ([title, note, art], sky) => `<div style="display: flex; flex-direction: column; gap: 12px; width: ${TILE}px">
<div style="position: relative; width: ${TILE}px; height: ${TILE}px; border-radius: 28px; overflow: hidden; background: ${sky}; box-shadow: 0 10px 30px rgba(27,33,64,0.12)">
<div style="position: absolute; left: ${(TILE - 190) / 2}px; top: ${(TILE - 190) / 2}px; width: 190px; height: 190px; transform: scale(${ZOOM})">${art}</div>
</div>
<span style="font-size: 16px; font-weight: 600; color: ${T.text}">${title}</span>
<span style="font-size: 13px; line-height: 1.5; color: ${T.sec}">${note}</span>
</div>`;
const row = (r) => `<div style="display: flex; gap: 32px; align-items: flex-start">
<div style="display: flex; flex-direction: column; gap: 6px; width: 180px; padding-top: 8px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${T.accent}">${r.name.toUpperCase()}</span>
<span style="font-family: 'Marcellus', serif; font-size: 26px; line-height: 1.15; color: ${T.text}">${r.scene}</span>
</div>
${r.tiles.map((t) => tile(t, r.sky)).join('\n')}
</div>`;

const WIDTH = 64 * 2 + 180 + 32 + 3 * TILE + 2 * 32;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Pressed logo — side by side</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
@keyframes breath{0%{transform:scale(0.95);opacity:0.2}50%{transform:scale(1.1);opacity:1}100%{transform:scale(0.95);opacity:0.2}}
@keyframes halo-breath{0%{opacity:0.2;transform:scale(0.95)}50%{opacity:1;transform:scale(1.1)}100%{opacity:0.2;transform:scale(0.95)}}
@keyframes rays{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes halo-l0{from{transform:rotate(0deg) scale(1.04,0.96)}to{transform:rotate(360deg) scale(1.04,0.96)}}
@keyframes halo-l1{from{transform:rotate(45deg) scale(0.96,1.04)}to{transform:rotate(-315deg) scale(0.96,1.04)}}
@keyframes halo-l2{from{transform:rotate(100deg) scale(1.03,0.97)}to{transform:rotate(820deg) scale(1.03,0.97)}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
</helmet>
<div style="width: ${WIDTH}px; box-sizing: border-box; padding: 64px; background: ${T.ground}; display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 12px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${T.accent}">HOUNA · ALTERNATIVE STYLE</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${T.text}">Pressed logo</h1>
<p style="margin: 0; max-width: 860px; font-size: 17px; line-height: 1.5; color: ${T.sec}">The three Home scenes with the logo and the moon or sun as one solid object: the logo pressed into the disc, the way the breathing orbs press it. A dark sliver along its top edge, a lit one along its bottom, and the logo a shade deeper than the disc, so it reads as a hollow in the same material rather than a separate colour. The disc and logo stay still; the halo round the disc breathes, as today. Close-ups here; each scene’s prototype plays in this row.</p>
</div>
${ROWS.map(row).join('\n')}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${WIDTH},"height":1720}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'PressedLogo.dc.html', html);
console.log('PressedLogo.dc.html', (html.length / 1024).toFixed(0) + 'KB · width', WIDTH);
