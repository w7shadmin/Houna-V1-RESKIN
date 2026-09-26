// "App icon — GCC editions": the Houna icon with a waving national flag across its lower corner
// (as Gulf brands do for national days), for all six GCC states on four base icons.
const fs = require('fs');
const { mark, halo } = require('./make-appicons.js');
const P = __dirname + '/../project/';

/* ── The wave: flag coordinates (u along the flag, v across it, both 0–1) → icon (0–100) ── */
const X0 = -6, LEN = 114;
const top = (x) => 72 - 0.26 * x + 4.5 * Math.sin((x / 100) * Math.PI * 2 + 0.5);
const thick = (x) => 60 + 0.1 * x;
const map = (u, v) => {
  const x = X0 + u * LEN;
  return [x, top(x) + v * thick(x)];
};
/** A polygon in flag coordinates, its edges subdivided so they follow the wave. */
function shape(pts, fill) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const [u1, v1] = pts[i], [u2, v2] = pts[(i + 1) % pts.length];
    for (let k = 0; k < 16; k++) out.push(map(u1 + ((u2 - u1) * k) / 16, v1 + ((v2 - v1) * k) / 16));
  }
  return `<path d="M${out.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L')}Z" fill="${fill}"></path>`;
}
const rect = (u1, v1, u2, v2, fill) => shape([[u1, v1], [u2, v1], [u2, v2], [u1, v2]], fill);
/** A serrated hoist (Bahrain, Qatar): white out to `a`, with `n` points reaching `b`. */
function serrated(n, a, b) {
  const pts = [[0, 0], [a, 0]];
  for (let i = 0; i < n; i++) pts.push([b, (i + 0.5) / n], [a, (i + 1) / n]);
  pts.push([0, 1]);
  return pts;
}

/* ── The six flags (Oman's emblem is left out: too fine to read at icon size) ── */
const FLAGS = [
  { id: 'kw', name: 'Kuwait', ar: 'الكويت', day: 'National Day 25 Feb · Liberation Day 26 Feb',
    draw: () => rect(0, 0, 1, 1 / 3, '#007A3D') + rect(0, 1 / 3, 1, 2 / 3, '#FFFFFF') + rect(0, 2 / 3, 1, 1, '#CE1126') + shape([[0, 0], [0.25, 1 / 3], [0.25, 2 / 3], [0, 1]], '#000000') },
  { id: 'ae', name: 'UAE', ar: 'الإمارات', day: 'Eid Al Etihad · 2 Dec',
    draw: () => rect(0, 0, 1, 1 / 3, '#00732F') + rect(0, 1 / 3, 1, 2 / 3, '#FFFFFF') + rect(0, 2 / 3, 1, 1, '#000000') + rect(0, 0, 0.25, 1, '#FF0000') },
  { id: 'qa', name: 'Qatar', ar: 'قطر', day: 'National Day · 18 Dec',
    draw: () => rect(0, 0, 1, 1, '#8A1538') + shape(serrated(9, 0.2, 0.3), '#FFFFFF') },
  { id: 'bh', name: 'Bahrain', ar: 'البحرين', day: 'National Day · 16 Dec',
    draw: () => rect(0, 0, 1, 1, '#CE1126') + shape(serrated(5, 0.18, 0.32), '#FFFFFF') },
  { id: 'om', name: 'Oman', ar: 'عُمان', day: 'National Day · 20 Nov',
    draw: () => rect(0, 0, 1, 1 / 3, '#FFFFFF') + rect(0, 1 / 3, 1, 2 / 3, '#DB161B') + rect(0, 2 / 3, 1, 1, '#008000') + rect(0, 0, 0.25, 1, '#DB161B') },
  { id: 'sa', name: 'Saudi Arabia', ar: 'السعودية', day: 'National Day 23 Sep · Founding Day 22 Feb', colours: true,
    // National colours, not the flag: the flag carries the Shahada and can't be used in a commercial mark.
    draw: () => rect(0, 0, 1, 1, '#006C35') + rect(0, 0.3, 1, 0.42, '#FFFFFF') },
];

let uid = 0;
/** The flag layer for an icon: the waving band, lit and shaded along its folds. */
function flagLayer(f) {
  const id = `g${uid++}`;
  const outline = shape([[0, 0], [1, 0], [1, 1], [0, 1]], '#000');
  const stops = Array.from({ length: 9 }, (_, i) => {
    const light = i % 2 === 0;
    return `<stop offset="${i / 8}" stop-color="${light ? '#FFFFFF' : '#000000'}" stop-opacity="${light ? 0.22 : 0.16}"></stop>`;
  }).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; filter: drop-shadow(0 -1px 2px rgba(0,0,0,0.28))">
<defs><clipPath id="${id}c">${outline.replace('<path', '<path')}</clipPath><linearGradient id="${id}s" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">${stops}</linearGradient></defs>
<g clip-path="url(#${id}c)">${f.draw()}<rect x="0" y="0" width="100" height="100" fill="url(#${id}s)"></rect></g>
</svg>`;
}

/* ── Four bases, the mark lifted so the flag can sweep under it ── */
const BASES = [
  { k: 'A', name: 'Turquoise', bg: '#3BAAA7', fill: '#FFFFFF' },
  { k: 'B', name: 'Dark Turquoise', bg: '#196662', fill: '#FFFFFF' },
  { k: 'D', name: 'Midnight glow', bg: 'radial-gradient(circle at 50% 40%, #16224A 0%, #0B1026 70%)', fill: '#6FD6CF', glow: true },
  { k: 'K', name: 'Sunrise', bg: 'radial-gradient(90% 60% at 50% 105%, rgba(249,169,128,0.75) 0%, rgba(249,169,128,0) 70%), linear-gradient(180deg, #F2F6F4 0%, #FFF1EA 100%)', fill: '#196662' },
];

function gccIcon(base, flag, s, shape = 'ios') {
  const m = s * 0.5, lift = s * 0.11;
  const radius = shape === 'circle' ? '999px' : shape === 'rsq' ? `${s * 0.28}px` : `${s * 0.2237}px`;
  const shadow = shape === 'ios' && s >= 100 ? `box-shadow: 0 ${s * 0.04}px ${s * 0.12}px rgba(0,0,0,0.35);` : '';
  const glow = base.glow ? `<div style="position: absolute; left: 0; top: ${-lift}px; width: ${s}px; height: ${s}px">${halo(s, m, '111,214,207', 0.55)}</div>` : '';
  return `<div role="img" aria-label="${base.name} icon, ${flag.name} edition" style="position: relative; flex-shrink: 0; width: ${s}px; height: ${s}px; border-radius: ${radius}; overflow: hidden; background: ${base.bg}; ${shadow}">${glow}${mark(m, base.fill, { style: `margin-top: ${-m / 2 - lift}px` })}${flagLayer(flag)}</div>`;
}

/* ── Board ── */
const T = { ground: '#0B1026', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5', card: 'rgba(242,236,221,0.045)', border: 'rgba(242,236,221,0.10)', accent: '#6FD6CF' };
const label = (t, c = T.ter) => `<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${c}">${t}</span>`;
const section = (eyebrow, title, desc, body) => `<section style="display: flex; flex-direction: column; gap: 24px; padding: 28px; border-radius: 24px; background: ${T.card}; border: 1px solid ${T.border}">
<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 24px">
<div style="display: flex; flex-direction: column; gap: 6px">${label(eyebrow, T.accent)}<h2 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 28px; line-height: 1.15; color: ${T.text}">${title}</h2></div>
<p style="margin: 0; max-width: 520px; font-size: 14px; line-height: 1.5; text-align: end; color: ${T.sec}">${desc}</p>
</div>
${body}
</section>`;

const matrix = `<div style="display: grid; grid-template-columns: 200px repeat(4, minmax(0, 1fr)); gap: 20px 16px; align-items: center">
<span></span>${BASES.map((b) => `<div style="display: flex; align-items: center; gap: 8px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; color: ${T.accent}">${b.k}</span><span style="font-size: 14px; font-weight: 600; color: ${T.text}">${b.name}</span></div>`).join('')}
${FLAGS.map((f) => `<div style="display: flex; flex-direction: column; gap: 4px">
<span style="font-size: 18px; font-weight: 600; color: ${T.text}">${f.name} <span lang="ar" style="font-weight: 500; color: ${T.sec}">· ${f.ar}</span></span>
<span style="font-size: 12.5px; line-height: 1.4; color: ${T.ter}">${f.day}</span>
${f.colours ? `<span style="align-self: flex-start; margin-top: 4px; padding: 3px 10px; border-radius: 999px; background: rgba(242,184,128,0.10); border: 1px solid rgba(242,184,128,0.35); font-family: 'DM Mono', monospace; font-size: 10.5px; letter-spacing: 0.1em; color: #F2B880">NATIONAL COLOURS</span>` : ''}
</div>
${BASES.map((b) => `<div style="display: flex; align-items: flex-end; gap: 10px">${gccIcon(b, f, 128)}<div style="display: flex; flex-direction: column; gap: 8px">${gccIcon(b, f, 48, 'circle')}${gccIcon(b, f, 48, 'rsq')}</div></div>`).join('\n')}`).join('\n')}
</div>`;

const homeRow = (base) => `<div style="display: flex; flex-direction: column; gap: 12px">
${label(`${base.k} · ${base.name.toUpperCase()}`)}
<div style="display: flex; gap: 28px; padding: 24px 28px; border-radius: 28px; background: linear-gradient(160deg, #6E5A3C 0%, #9B8052 55%, #B8925A 100%)">
${FLAGS.map((f) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px">${gccIcon(base, f, 64)}<span style="font-size: 12.5px; color: rgba(255,255,255,0.92)">Houna</span></div>`).join('\n')}
</div>
</div>`;

const note = (title, body) => `<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 18px; background: rgba(242,236,221,0.03); border: 1px solid ${T.border}"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${title}</span><span style="font-size: 13.5px; line-height: 1.55; color: ${T.sec}">${body}</span></div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>App icon — GCC editions</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;family=IBM+Plex+Sans+Arabic:wght@500&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
[lang=ar]{font-family:'IBM Plex Sans Arabic',sans-serif}
</style>
</helmet>
<div style="width: 1280px; box-sizing: border-box; padding: 64px; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif; color: ${T.text}; display: flex; flex-direction: column; gap: 32px">

<div style="display: flex; flex-direction: column; gap: 12px">
${label('HOUNA · APP ICON', T.accent)}
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${T.text}">GCC editions</h1>
<p style="margin: 0; max-width: 780px; font-size: 17px; line-height: 1.5; color: ${T.sec}">The Houna icon for each Gulf national day: the mark lifts a little, and the country’s flag sweeps across the lower corner, in front of it, as the region’s apps do for their national days. Shown for all six GCC states on four of the base icons.</p>
</div>

${section('THE SET', 'Six states × four bases', 'Large: iOS. Small: Android circle and rounded square. The flag follows one wave, lit along its folds, so every edition reads as one family.', matrix)}

${section('IN CONTEXT', 'On a home screen', 'At real size on a warm wallpaper, like the examples: the flag still reads at a glance, and so does the mark above it.', `<div style="display: flex; flex-direction: column; gap: 20px">\n${BASES.map(homeRow).join('\n')}\n</div>`)}

${section('NOTES', 'Before shipping', 'Things to settle with each edition.', `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
${note('Saudi Arabia uses its colours', 'The Saudi flag carries the Shahada, and Saudi rules keep it out of trademarks and commercial use and forbid altering it; a waving, cropped flag in an app icon would be both. Brands there mark National Day with the green and white, as this edition does, or with the official National Day identity.')}
${note('Flags are simplified', 'Colours follow each flag’s official values. Oman’s emblem is left out because it’s too fine to read at icon size. For launch, each flag should be checked against the state’s own specification.')}
${note('How it switches', 'iOS can change icons in-app (alternate icons), but asks the person to confirm each time. Android uses one launcher alias per icon. Either could be an opt-in “App icon” choice in Profile, rather than changing on its own.')}
</div>`)}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1280,"height":2633}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'AppIconGCC.dc.html', html);
console.log('AppIconGCC.dc.html', (html.length / 1024).toFixed(0) + 'KB');
