// Shared pieces for the Houna Explorations canvas: the board wrapper, Houna's three palettes and
// their tones, the mark, and the woven Arabic geometry (arches, the eight-point star, mashrabiya,
// ring text), moons, grain and glass. Every board is drawn from these, so the canvas stays one system.
const fs = require('fs');
const path = require('path');
const { THEMES } = require('../../canvas/scripts/make-home-appearance.js');
const { DISCS, pressedMark, pressedFill } = require('../../canvas/scripts/pressed-kit.js');
const { mark } = require('../../canvas/scripts/make-appicons.js');

const OUT = path.join(__dirname, '..', 'project');
fs.mkdirSync(OUT, { recursive: true });

/* ── Palettes: the app's three themes (constants/theme.ts), with their four tones ── */
const TONES = {
  night: { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EA90A8' },
  dusk: { glow: '#237873', dusk: '#6353C9', dawn: '#A8621F', bloom: '#B24B6B' },
  sunrise: { glow: '#196662', dusk: '#0A91BB', dawn: '#E8582C', bloom: '#C2475A' },
};
/** The light colour for glows and tinted fills (a tone's `hue`). */
const HUES = {
  night: { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EA90A8' },
  dusk: { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EA90A8' },
  sunrise: { glow: '#3BAAA7', dusk: '#20C4F4', dawn: '#F9A980', bloom: '#F37B83' },
};
const T = Object.fromEntries(THEMES.map((t) => [t.key, { ...t, tone: TONES[t.key], hue: HUES[t.key] }]));
/** Night's deeper layers (nightfall, the tab bar). */
const NIGHT = { midnight: '#0B1026', nightfall: '#121A3E', deep: '#0F1534', moonlight: '#F2ECDD', mist: '#B6BAD6', haze: '#8990B5', teal: '#3BAAA7' };
/** The meditation scenes' orb colours (components/meditation/scenes.ts). */
const SCENES = {
  fire: { hi: '#FFE9CF', c: '#F0A868', lo: '#9A4F22' },
  rain: { hi: '#E4EDFF', c: '#7FA2EC', lo: '#33509E' },
  forest: { hi: '#DDFAF5', c: '#63CFC7', lo: '#1F7A74' },
  ocean: { hi: '#E6E8FF', c: '#8F9BF0', lo: '#39439E' },
};
/** Uploaded to the canvas: the scenes' stills and footage. */
const ASSET = {
  fireJpg: '/_blob/a49f303a5388a010c5898e16e992529f',
  rainJpg: '/_blob/3b201c66317c934288051a9e0025d0da',
  forestJpg: '/_blob/02b240bc044405a9bf82dd10dd8e15d0',
  fireMp4: '/_blob/21aa77a80d47f1291c9af81e2d7718b6',
  rainMp4: '/_blob/31fbff624aca6086fea4a019fd9f1216',
  forestMp4: '/_blob/c3e32da2825cc1d310cb7e3472c0cf70',
};

/* ── Breath timings (constants/breathPatterns.ts), so every board paces like the app ── */
const src = fs.readFileSync(path.join(__dirname, '../../../constants/breathPatterns.ts'), 'utf8');
const phasesOf = (key) => {
  const block = src.split(`'${key}': [`)[1].split('],')[0];
  return [...block.matchAll(/key: '(\w+)', seconds: (\d+), fill: (\d)/g)].map((m) => ({ key: m[1], s: +m[2], fill: +m[3] }));
};
const BREATH = { four78: phasesOf('anxiety-relief'), box: phasesOf('steady-mind') };
const cycleOf = (phases) => phases.reduce((a, p) => a + p.s, 0);
/** Keyframe stops for one breath: `at(fill)` gives the declarations for a fill of 0 or 1. */
function breathKeyframes(name, phases, at, ease = 'ease-in-out') {
  const total = cycleOf(phases);
  let t = 0, prev = phases[phases.length - 1].fill;
  const stops = [`0% { ${at(prev)}; animation-timing-function: ${ease} }`];
  for (const p of phases) {
    t += p.s;
    stops.push(`${((t / total) * 100).toFixed(3)}% { ${at(p.fill)}; animation-timing-function: ${ease} }`);
  }
  return `@keyframes ${name} { ${stops.join(' ')} }`;
}

/* ── Numbers and dates ── */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const ar = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d]).replace(/,/g, '٬');
const TODAY = new Date('2026-09-27T12:00:00');
const hijri = (d = TODAY, lang = 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-GB-u-ca-islamic-umalqura', { day: 'numeric', month: 'long' }).format(d);
const gregorian = (d = TODAY, lang = 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);

/* ── The moon: today's real phase (as lib/moonPhase.ts, from the date alone) ── */
const SYNODIC = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const phaseOf = (d) => ((((d.getTime() - NEW_MOON) / 86400000) % SYNODIC) + SYNODIC) % SYNODIC / SYNODIC;
/**
 * A moon in phase `f` (0 new, 0.5 full), radius r, centred in a 2r box: the dark face, then the lit
 * part as the right half-disc (waxing) or left (waning) joined to the terminator's half-ellipse.
 */
function moon(f, r, { lit = '#F2ECDD', dark = 'rgba(242,236,221,0.10)', glow = '' } = {}) {
  const k = (1 - Math.cos(2 * Math.PI * f)) / 2; // lit fraction
  const waxing = f < 0.5;
  const rx = Math.abs(1 - 2 * k) * r;
  const s1 = waxing ? 1 : 0; // outer limb: right side when waxing
  const s2 = k > 0.5 ? (waxing ? 1 : 0) : waxing ? 0 : 1;
  const d = `M${r} 0 A${r} ${r} 0 0 ${s1} ${r} ${2 * r} A${rx.toFixed(2)} ${r} 0 0 ${s2} ${r} 0 Z`;
  return `<svg width="${2 * r}" height="${2 * r}" viewBox="0 0 ${2 * r} ${2 * r}" aria-hidden="true" style="display: block; overflow: visible${glow ? `; filter: drop-shadow(0 0 ${r * 0.5}px ${glow})` : ''}"><circle cx="${r}" cy="${r}" r="${r}" fill="${dark}"></circle>${k > 0.01 ? `<path d="${d}" fill="${lit}"></path>` : ''}</svg>`;
}

/* ── Woven geometry ── */
/** A mihrab arch (pointed, two arcs of radius 0.7w meeting at the apex), w×h, as an SVG path. */
function archPath(w, h, x = 0, y = 0) {
  const R = 0.7 * w;
  const rise = Math.sqrt(R * R - (w / 2 - R) ** 2);
  return `M${x} ${y + h} L${x} ${y + rise} A${R} ${R} 0 0 1 ${x + w / 2} ${y} A${R} ${R} 0 0 1 ${x + w} ${y + rise} L${x + w} ${y + h} Z`;
}
/** The arch as a CSS clip-path (for photos and video). */
const archClip = (w, h) => `clip-path: path('${archPath(w, h)}')`;
/** The eight-point star (khatam, two squares) centred at (cx, cy), outer radius r. */
function star8(cx, cy, r, rot = 0) {
  const inner = r * Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);
  const pts = [];
  for (let i = 0; i < 16; i++) {
    const a = ((i * 22.5 + rot - 90) * Math.PI) / 180;
    const rr = i % 2 ? inner : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}
/** A square of the star, centred, "radius" r (half-diagonal), turned by `rot` degrees. */
const squarePts = (cx, cy, r, rot = 0) => [0, 1, 2, 3].map((i) => { const a = ((i * 90 + rot - 90) * Math.PI) / 180; return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`; }).join(' ');
/** A mashrabiya lattice as an SVG <pattern>: eight-point stars joined by crosses, tile `s`. */
const lattice = (id, s, stroke, sw = 1) => `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><polygon points="${star8(s / 2, s / 2, s * 0.34)}" fill="none" stroke="${stroke}" stroke-width="${sw}"></polygon><path d="M0 ${s / 2} H${s * 0.16} M${s * 0.84} ${s / 2} H${s} M${s / 2} 0 V${s * 0.16} M${s / 2} ${s * 0.84} V${s}" stroke="${stroke}" stroke-width="${sw}"></path></pattern>`;
/** Text set around a circle (the Kufic ring), radius r, in a 2r+pad box. */
function ringText(id, r, text, { font = "'Amiri', serif", size = 14, color = '#F2ECDD', spacing = 0, weight = 400, pad = 20, fit = false } = {}) {
  const c = r + pad, box = 2 * c;
  const d = `M${c} ${c} m${-r} 0 a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 ${-2 * r} 0`;
  return `<svg width="${box}" height="${box}" viewBox="0 0 ${box} ${box}" aria-hidden="true" style="display: block; overflow: visible"><defs><path id="${id}" d="${d}"></path></defs><text font-family="${font.replace(/"/g, "'")}" font-size="${size}" font-weight="${weight}" fill="${color}" letter-spacing="${spacing}" direction="ltr"><textPath href="#${id}" startOffset="0"${fit ? ` textLength="${(2 * Math.PI * r - 4).toFixed(0)}" lengthAdjust="spacing"` : ''}>${text}</textPath></text></svg>`;
}

/* ── Surfaces ── */
/** Film grain over whatever is under it (the Hatch look). */
const grain = (id, opacity = 0.14, freq = 0.9) => `<svg aria-hidden="true" style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; mix-blend-mode: overlay; opacity: ${opacity}"><filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" stitchTiles="stitch"></feTurbulence><feColorMatrix type="saturate" values="0"></feColorMatrix></filter><rect width="100%" height="100%" filter="url(#${id})"></rect></svg>`;
/** Frosted glass for chips, sheets and tiles. */
const glass = (tint = '242,236,221', a = 0.1, blur = 18) => `background: rgba(${tint},${a}); backdrop-filter: blur(${blur}px); -webkit-backdrop-filter: blur(${blur}px); border: 1px solid rgba(${tint},${Math.min(0.3, a + 0.08)})`;
/** A handful of scattered stars (seeded, so boards are stable). */
function starfield(n, w, h, seedStart = 7, color = '242,236,221') {
  let seed = seedStart;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: n }, (_, i) => {
    const s = 1 + rnd() * 1.6;
    return `<span style="position: absolute; left: ${(rnd() * w).toFixed(0)}px; top: ${(rnd() * h).toFixed(0)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: rgba(${color},${(0.3 + rnd() * 0.6).toFixed(2)}); animation: twinkle ${(3 + rnd() * 4).toFixed(1)}s ease-in-out ${(-rnd() * 6).toFixed(1)}s infinite"></span>`;
  }).join('');
}
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

/** The official wordmark (constants/logoSvg.ts), recoloured as Logo variant="themed" does. */
const LOGO_XML = /LOGO_GREEN_XML = `([\s\S]*?)`/.exec(fs.readFileSync(path.join(__dirname, '../../../constants/logoSvg.ts'), 'utf8'))[1];
const logo = (primary, secondary, width = 96) => LOGO_XML.replace(/<svg[^>]*>/, `<svg viewBox="0 0 93.339 44.094" width="${width}" aria-hidden="true" style="display: block">`)
  .replace(/\sid="[^"]*"/g, '')
  .replace(/fill="#3baaa7"/g, `fill="${primary}"`)
  .replace(/fill="#525052"/g, `fill="${secondary}"`);

/* ── Type ── */
const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&amp;family=DM+Mono:wght@400;500&amp;family=Figtree:wght@300;400;500;600&amp;family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">`;
const F = {
  body: "'Figtree', system-ui, sans-serif",
  display: "'Marcellus', serif",
  mono: "'DM Mono', monospace",
  arBody: "'IBM Plex Sans Arabic', sans-serif",
  arDisplay: "'Amiri', serif",
};
const label = (t, color, size = 11) => `<span style="font-family: ${F.mono}; font-size: ${size}px; letter-spacing: 0.16em; text-transform: uppercase; color: ${color}; white-space: nowrap">${t}</span>`;
const arLabel = (t, color, size = 13) => `<span style="font-family: ${F.arBody}; font-size: ${size}px; font-weight: 500; color: ${color}; white-space: nowrap">${t}</span>`;

/** Keyframes every board may use; reduced motion stills them all. */
const BASE_CSS = `
body{margin:0}
button{font:inherit;color:inherit}
@keyframes twinkle { 0%,100% { opacity: 0.25 } 50% { opacity: 1 } }
@keyframes drift { 0% { transform: translate(0,0) scale(1) } 50% { transform: translate(24px,-18px) scale(1.08) } 100% { transform: translate(0,0) scale(1) } }
@keyframes drift2 { 0% { transform: translate(0,0) scale(1.05) } 50% { transform: translate(-30px,22px) scale(0.95) } 100% { transform: translate(0,0) scale(1.05) } }
@keyframes spin { to { transform: rotate(360deg) } }
@keyframes spinBack { to { transform: rotate(-360deg) } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes glowPulse { 0%,100% { opacity: 0.55 } 50% { opacity: 1 } }
@keyframes bars { 0%,100% { transform: scaleY(0.35) } 50% { transform: scaleY(1) } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important } }`;

/**
 * One artboard. `body` is the root element's inner markup; the root is w×h, fixed, as the format
 * requires. `logic` is the Component body (defaults to an empty renderVals).
 */
function board(file, { title, lang = 'en', w = 390, h = 844, css = '', root = '', body, logic, props = {} }) {
  const dir = lang === 'ar' ? ' dir="rtl"' : '';
  const html = `<!doctype html>
<html lang="${lang}"${dir}>
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
${FONT_LINK}
<style>${BASE_CSS}
${css}
</style>
</helmet>
<div${dir} style="position: relative; width: ${w}px; height: ${h}px; overflow: hidden; box-sizing: border-box; font-family: ${lang === 'ar' ? F.arBody : F.body}; ${root}">
${body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='${JSON.stringify({ ...props, $preview: { width: w, height: h } })}'>
${logic || `class Component extends DCLogic {
  renderVals() {
    return {};
  }
}`}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, file), html);
  return { file, title, w, h, interactive: !!logic };
}

module.exports = {
  T, NIGHT, TONES, HUES, SCENES, ASSET, BREATH, cycleOf, breathKeyframes, ar, TODAY, hijri, gregorian,
  phaseOf, moon, archPath, archClip, star8, squarePts, lattice, ringText, grain, glass, starfield, rgbOf,
  F, label, arLabel, board, DISCS, pressedMark, pressedFill, mark, logo,
};
