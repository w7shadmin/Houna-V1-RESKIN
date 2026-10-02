// Adds the Houna starfield board (Night) and gives the Home boards the app's mark: the edge halo
// that breathes out from the mark (5s) and the dot ring that turns and breathes with it.
const fs = require('fs');
const P = __dirname + '/../project/';

const logo = fs.readFileSync(__dirname + '/../../../constants/logoSvg.ts', 'utf8');
const FIGURE_D = /export const FIGURE_D = '([^']+)'/.exec(logo)[1];
const HEAD_D = /const HEAD_IN_FIGURE_D = '([^']+)'/.exec(logo)[1];
const RING_D = /d="(M50\.18[^"]+)"/.exec(fs.readFileSync(__dirname + '/../../../components/HounaMark.tsx', 'utf8'))[1];
const markSvg = (fill, size, style) =>
  `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="17 5.4 20.6 20.6" style="${style}"><g transform="translate(-10.7 -6.6)"><g transform="translate(29.24 13.384)"><path d="${RING_D}" transform="translate(-44 -18.785)" fill="${fill}"></path></g><g transform="translate(31.801 13.392)"><path d="${FIGURE_D}${HEAD_D}" transform="translate(-48.6 -18.8)" fill="${fill}" fill-rule="evenodd"></path></g></g></svg>`;

/* The halo, as MarkHalo: 112px round the 70px mark, clear inside its ring, brightest just
   outside it; three slightly oval layers turning at their own pace, breathing out and in together. */
const LAYERS = [
  { sx: 1.04, sy: 0.96, from: 0, turns: 1 },
  { sx: 0.96, sy: 1.04, from: 45, turns: -1 },
  { sx: 1.03, sy: 0.97, from: 100, turns: 2 },
];
const keyframes = `@keyframes halo-breath{0%{opacity:0.2;transform:scale(0.95)}50%{opacity:1;transform:scale(1.1)}100%{opacity:0.2;transform:scale(0.95)}}
@keyframes ring-breath{0%{transform:scale(1)}50%{transform:scale(1.07)}100%{transform:scale(1)}}
@keyframes ring-turn{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
${LAYERS.map((l, k) => `@keyframes halo-l${k}{from{transform:rotate(${l.from}deg) scale(${l.sx},${l.sy})}to{transform:rotate(${l.from + l.turns * 360}deg) scale(${l.sx},${l.sy})}}`).join('\n')}`;
const halo = (rgb, strength, left, top) => {
  const ls = (1 - Math.pow(1 - strength, 1 / 3)).toFixed(3);
  const layer = (k) => `<span style="position: absolute; left: 0; top: 0; width: 112px; height: 112px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${rgb},0) 45.5%, rgba(${rgb},${ls}) 55.4%, rgba(${rgb},0) 100%); animation: halo-l${k} 120s linear infinite"></span>`;
  return `<div aria-hidden="true" style="position: absolute; left: ${left}px; top: ${top}px; width: 112px; height: 112px; animation: halo-breath 5s ease-in-out infinite">
${[0, 1, 2].map(layer).join('\n')}
</div>`;
};

/* ───────── Home boards ───────── */
const HOMES = [
  { f: 'Main.dc.html', night: true, label: 'Breathe under the stars' },
  { f: 'HomeAr.dc.html', night: true, label: 'تنفّس تحت النجوم' },
  { f: 'HomeDay.dc.html', night: false },
  { f: 'HomeArDay.dc.html', night: false },
];
for (const h of HOMES) {
  let s = fs.readFileSync(P + h.f, 'utf8');
  if (s.includes('halo-breath')) continue;
  s = s.replace('</style>', `${keyframes}\n@media (prefers-reduced-motion: reduce){*{animation:none!important}}\n</style>`);
  // The disc glow → the edge halo (Night 0.4, Dusk 0.5, as Home passes them).
  s = s.replace(
    /<div style="position: absolute; left: 40px; top: 40px; width: 110px; height: 110px; border-radius: 999px; background: radial-gradient\(closest-side, rgba\(111,214,207,0\.45\), rgba\(111,214,207,0\)\)"><\/div>/,
    halo('111,214,207', h.night ? 0.4 : 0.5, 39, 39),
  );
  // The ring turns (a lap every two minutes) and breathes.
  s = s.replace(
    /(<sc-for list="\{\{dots\}\}" as="d" hint-placeholder-count="28">[\s\S]*?<\/sc-for>)/,
    '<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; animation: ring-turn 120s linear infinite"><div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; animation: ring-breath 5s ease-in-out infinite">\n$1\n</div></div>',
  );
  if (h.night) {
    // Night only: the mark opens the starfield.
    s = s.replace(
      '<div aria-hidden="true" style="position: relative; width: 190px; height: 190px">',
      `<a href="Starfield.dc.html" aria-label="${h.label}" style="display: block; position: relative; width: 190px; height: 190px">`,
    );
    s = s.replace(/(<img src="[^"]+" alt="" style="position: absolute; left: 60px; top: 60px; width: 70px; height: 70px">)\n<\/div>/, '$1\n</a>');
  }
  if (!s.includes('halo-l2 120s')) throw new Error('halo not placed in ' + h.f);
  fs.writeFileSync(P + h.f, s);
}

/* ───────── The Houna starfield ───────── */
// Seeded, so the sky is the same on every render.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const SKY = 940; // the screen's diagonal, centred on the moon, so it can turn without showing corners
const MX = 195, MY = 354; // the moon: centred, a little above the middle (42%)
const still = Array.from({ length: 170 }, () => {
  const depth = rand();
  const s = depth < 0.7 ? 0.8 + rand() * 0.6 : depth < 0.93 ? 1.3 + rand() * 0.5 : 1.8 + rand() * 0.6;
  const o = depth < 0.7 ? 0.18 + rand() * 0.25 : depth < 0.93 ? 0.35 + rand() * 0.3 : 0.6 + rand() * 0.3;
  const c = rand() < 0.12 ? '111,214,207' : rand() < 0.08 ? '179,167,245' : '242,236,221';
  return `<span style="position: absolute; left: ${(rand() * SKY).toFixed(1)}px; top: ${(rand() * SKY).toFixed(1)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: rgba(${c},${o.toFixed(2)})"></span>`;
}).join('\n');
const twinklers = Array.from({ length: 36 }, (_, i) => {
  const s = 1.4 + rand() * 1.2;
  return `<span style="position: absolute; left: ${(rand() * SKY).toFixed(1)}px; top: ${(rand() * SKY).toFixed(1)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: #F2ECDD; box-shadow: 0 0 ${(s * 2.5).toFixed(1)}px rgba(242,236,221,0.7); animation: twinkle 9s ease-in-out ${(-((i * 0.37) % 1) * 9).toFixed(2)}s infinite"></span>`;
}).join('\n');

const { DISCS, disc, discHalo, pressedMark } = require('./pressed-kit.js');

/**
 * The moon: today's (the glowing teal mark with its edge halo), or the pressed-logo alternative:
 * a solid disc (teal or silver) with the mark pressed into it, its halo joined to the disc's edge,
 * settling a little smaller (0.9), as the suns do.
 */
function moon(style) {
  if (style === 'glow') return `${halo('111,214,207', 0.4, 39, 39)}
${markSvg('#6FD6CF', 70, 'position: absolute; left: 60px; top: 60px')}`;
  const d = DISCS[style];
  return `<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; transform: scale(0.9)">
${discHalo(d, 'animation: halo-breath 5s ease-in-out infinite')}
${disc(d)}
${pressedMark(70, d.surface)}
</div>`;
}

const starfield = (style) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Houna starfield${style === 'glow' ? '' : ` — pressed logo (${style})`}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#0B1026;color:#F2ECDD}
a{text-decoration:none}
${keyframes}
@keyframes sky-turn{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes twinkle{0%{opacity:0.3}50%{opacity:1}100%{opacity:0.3}}
@keyframes moonglow{0%{opacity:0.3;transform:scale(0.92)}50%{opacity:1;transform:scale(1.08)}100%{opacity:0.3;transform:scale(0.92)}}
@keyframes shoot{0%{opacity:0;transform:translate(0,0) rotate(-24deg)}2%{opacity:1}14%{opacity:0.9}18%{opacity:0;transform:translate(-560px,250px) rotate(-24deg)}100%{opacity:0;transform:translate(-560px,250px) rotate(-24deg)}}
@keyframes shoot-b{0%{opacity:0;transform:translate(0,0) rotate(20deg)}2%{opacity:1}14%{opacity:0.9}18%{opacity:0;transform:translate(540px,196px) rotate(20deg)}100%{opacity:0;transform:translate(540px,196px) rotate(20deg)}}
@keyframes word{0%{opacity:0;transform:translateY(4px)}8%{opacity:1;transform:translateY(0)}30%{opacity:1}38%{opacity:0}100%{opacity:0}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
</helmet>
<div style="position: relative; width: 390px; height: 844px; overflow: hidden; background: #0B1026">

<div aria-hidden="true">
<span style="position: absolute; left: 420px; top: 90px; width: 150px; height: 1.5px; border-radius: 999px; transform-origin: 0 50%; background: linear-gradient(90deg, rgba(242,236,221,0.95), rgba(242,236,221,0)); box-shadow: 0 0 6px rgba(242,236,221,0.5); opacity: 0; animation: shoot 11s ease-out 1.5s infinite"></span>
<span style="position: absolute; left: -160px; top: 520px; width: 130px; height: 1.5px; border-radius: 999px; transform-origin: 100% 50%; background: linear-gradient(270deg, rgba(242,236,221,0.9), rgba(242,236,221,0)); box-shadow: 0 0 6px rgba(242,236,221,0.45); opacity: 0; animation: shoot-b 11s ease-out 7s infinite"></span>

<div style="position: absolute; left: ${MX - SKY / 2}px; top: ${MY - SKY / 2}px; width: ${SKY}px; height: ${SKY}px; animation: sky-turn 480s linear infinite">
${still}
${twinklers}
</div>

<span style="position: absolute; left: ${MX - 210}px; top: ${MY - 210}px; width: 420px; height: 420px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${style === 'silver' ? DISCS.silver.glow : '111,214,207'},0.1) 20%, rgba(${style === 'silver' ? DISCS.silver.glow : '111,214,207'},0) 100%); animation: moonglow 5s ease-in-out infinite"></span>
</div>

<a href="Main.dc.html" aria-label="Back to Home" style="position: absolute; left: ${MX - 95}px; top: ${MY - 95}px; width: 190px; height: 190px; display: block">
${moon(style)}
</a>

<span style="position: absolute; left: 0; right: 0; bottom: 56px; text-align: center; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.3em; color: #8990B5; opacity: 0; animation: word 14s ease-in-out 1s infinite">TANAFAS</span>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'Starfield.dc.html', starfield('glow'));
// The pressed-logo alternative (canvas only, to compare).
fs.writeFileSync(P + 'StarfieldPressedTeal.dc.html', starfield('teal'));
fs.writeFileSync(P + 'StarfieldPressedSilver.dc.html', starfield('silver'));
console.log('Starfield + Home halos done');
