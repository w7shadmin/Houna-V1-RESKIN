// "Houna eclipses": the Home-mark scenes on a real eclipse day. The starfield's teal moon turns
// copper in Earth's shadow (a lunar eclipse; they only happen at full moon); the sunrise sun is
// covered by the dark moon to its corona (a total solar eclipse); the low dusk sun becomes a ring of
// fire (an annular eclipse). Storyboards in the pressed-logo look the app has now, with notes on
// when they'd show and how they'd play.
const fs = require('fs');
const { mark } = require('./make-appicons.js');
const { DISCS, pressedFill } = require('./pressed-kit.js');
const P = __dirname + '/../project/';

const W = 390, H = 620;
const INK = { text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5', accent: '#6FD6CF', ground: '#0B1026', card: 'rgba(242,236,221,0.045)', line: 'rgba(242,236,221,0.10)' };
const mono = "font-family: 'DM Mono', monospace";

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
/** A field of stars; `bright` lifts them (totality darkens the sky and they come out). */
const stars = (count, bright, maxY = H) => Array.from({ length: count }, () => {
  const s = rnd() < 0.85 ? 1 + rnd() * 0.8 : 1.8 + rnd() * 0.7;
  return `<span style="position: absolute; left: ${(rnd() * W).toFixed(0)}px; top: ${(rnd() * maxY).toFixed(0)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: rgba(242,236,221,${((0.25 + rnd() * 0.45) * bright).toFixed(2)}); box-shadow: 0 0 ${(s * 2).toFixed(1)}px rgba(242,236,221,${(0.3 * bright).toFixed(2)})"></span>`;
}).join('');

/** A 190px box centred on (cx, cy). */
const at = (cx, cy, inner, size = 190, style = '') => `<div style="position: absolute; left: ${cx - size / 2}px; top: ${cy - size / 2}px; width: ${size}px; height: ${size}px; ${style}">${inner}</div>`;
const layer = (inner, style = '') => `<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; ${style}">${inner}</div>`;
const gradient = (stops) => `linear-gradient(180deg, ${stops.map(([c, o]) => `${c} ${o}%`).join(', ')})`;
const frame = (sky, inner, { word = INK.ter } = {}) => `<div style="position: relative; width: ${W}px; height: ${H}px; border-radius: 28px; overflow: hidden; background: ${sky}; box-shadow: 0 0 0 1px rgba(242,236,221,0.08), 0 18px 44px rgba(0,0,0,0.35)">${inner}<span style="position: absolute; left: 0; right: 0; bottom: 40px; text-align: center; ${mono}; font-size: 12px; letter-spacing: 0.3em; color: ${word}">TANAFAS</span></div>`;

/* ── The moon: teal, pressed mark, Earth's shadow crossing it ── */
const R = 42; // the app's moon: an 84px disc
const COPPER = '#B5562F';
/**
 * The moon in a 190px box with Earth's umbra (a circle 2.6× the moon, dark copper at its heart) at
 * horizontal offset `shadowX` from the moon's centre: far off, across, centred (totality). The
 * pressed mark is teal where lit and copper in shadow.
 */
function eclipsedMoon(id, shadowX) {
  const UR = R * 2.6;
  const ux = 95 + shadowX;
  const total = Math.abs(shadowX) + R <= UR;
  const shadowMask = (inside) => `-webkit-mask-image: radial-gradient(circle ${UR}px at ${ux}px 95px, ${inside ? '#000 99.4%, transparent 100%' : 'transparent 99.4%, #000 100%'}); mask-image: radial-gradient(circle ${UR}px at ${ux}px 95px, ${inside ? '#000 99.4%, transparent 100%' : 'transparent 99.4%, #000 100%'})`;
  const light = total ? 0 : 1;
  const svg = `<svg width="190" height="190" viewBox="0 0 190 190" aria-hidden="true" style="position: absolute; left: 0; top: 0">
<defs>
<radialGradient id="teal${id}" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#D9FAF6"></stop><stop offset="0.55" stop-color="#6FD6CF"></stop><stop offset="1" stop-color="#2E8F8A"></stop></radialGradient>
<radialGradient id="umbra${id}" gradientUnits="userSpaceOnUse" cx="${ux}" cy="95" r="${UR}"><stop offset="0" stop-color="#4A1A12"></stop><stop offset="0.6" stop-color="#8A3520"></stop><stop offset="0.93" stop-color="#C9673A"></stop><stop offset="1" stop-color="#E08A56"></stop></radialGradient>
<clipPath id="disc${id}"><circle cx="95" cy="95" r="${R}"></circle></clipPath>
</defs>
<circle cx="95" cy="95" r="${R}" fill="url(#teal${id})"></circle>
<g clip-path="url(#disc${id})"><circle cx="${ux}" cy="95" r="${UR}" fill="url(#umbra${id})"></circle></g>
</svg>`;
  // The halo: teal where lit, a faint copper glow once the moon is in shadow.
  const halo = `<span style="position: absolute; left: 20px; top: 20px; width: 150px; height: 150px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${total ? '201,103,58' : '111,214,207'},0) 52%, rgba(${total ? '201,103,58' : '111,214,207'},${total ? 0.35 : 0.4 * (0.4 + 0.6 * light)}) 60%, rgba(0,0,0,0) 100%)"></span>`;
  const glow = `<span style="position: absolute; left: ${95 - R}px; top: ${95 - R}px; width: ${2 * R}px; height: ${2 * R}px; border-radius: 999px; box-shadow: 0 0 16px rgba(${total ? '201,103,58,0.35' : '111,214,207,0.4'})"></span>`;
  const markTeal = layer(mark(58, pressedFill('#6FD6CF'), { style: 'opacity: 0.7' }), shadowMask(false));
  const markCopper = layer(mark(58, pressedFill(COPPER), { style: 'opacity: 0.75' }), shadowMask(true));
  return halo + glow + svg + markTeal + markCopper;
}

/* ── The sun and the dark moon crossing it ── */
const SUN = 119; // the app's sun: 0.9 of a 132px disc
/** The sun's short turning rays (Sunrise only), dimmed as the moon covers it. */
const rays = (strength) => `<span style="position: absolute; left: -95px; top: -95px; width: 380px; height: 380px; border-radius: 999px; background: repeating-conic-gradient(from 0deg, rgba(255,222,190,${(0.45 * strength).toFixed(2)}) 0deg 3deg, rgba(255,222,190,0) 3deg 15deg); -webkit-mask-image: radial-gradient(circle, #000 26%, transparent 60%); mask-image: radial-gradient(circle, #000 26%, transparent 60%)"></span>`;
const sunGlow = (rgb, strength) => `<span style="position: absolute; left: -115px; top: -115px; width: 420px; height: 420px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${rgb},${(0.3 * strength).toFixed(2)}) 20%, rgba(${rgb},0) 100%)"></span>`;
const sunDisc = (d) => `<span style="position: absolute; left: ${95 - SUN / 2}px; top: ${95 - SUN / 2}px; width: ${SUN}px; height: ${SUN}px; border-radius: 999px; background: ${d.stops}; box-shadow: 0 0 14px rgba(${d.glow},0.45)"></span>${mark(62, pressedFill(d.surface), { style: 'opacity: 0.7' })}`;
/**
 * The new moon over the sun: a dark disc `size` across at offset `dx`, seen only where it covers the
 * sun (against a daylight sky it's invisible). At totality its edge is lit by the corona.
 */
const darkMoon = (size, dx, { rim = 0, markShown = false } = {}) => `<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; ${rim ? '' : `-webkit-mask-image: radial-gradient(circle ${SUN / 2}px at 95px 95px, #000 99%, transparent 100%); mask-image: radial-gradient(circle ${SUN / 2}px at 95px 95px, #000 99%, transparent 100%)`}"><span style="position: absolute; left: ${95 + dx - size / 2}px; top: ${95 - size / 2}px; width: ${size}px; height: ${size}px; border-radius: 999px; background: radial-gradient(circle at 45% 40%, #1C2549 0%, #0E1433 70%, #0A0F29 100%); ${rim ? `box-shadow: 0 0 0 1px rgba(255,244,228,${rim}), 0 0 10px rgba(255,244,228,${rim})` : ''}"></span>${markShown ? `<div style="position: absolute; left: ${dx}px; top: 0; width: 190px; height: 190px">${mark(62, 'rgba(242,236,221,0.13)')}</div>` : ''}</div>`;
/** The corona: a soft pearly glow round the covered sun, with long faint streamers. */
const corona = (strength) => `<span style="position: absolute; left: -125px; top: -125px; width: 440px; height: 440px; border-radius: 999px; background: repeating-conic-gradient(from 8deg, rgba(255,248,236,${(0.28 * strength).toFixed(2)}) 0deg 2deg, rgba(255,248,236,0) 2deg 11deg, rgba(255,248,236,${(0.16 * strength).toFixed(2)}) 11deg 12deg, rgba(255,248,236,0) 12deg 23deg); -webkit-mask-image: radial-gradient(circle, #000 14%, rgba(0,0,0,0.5) 30%, transparent 58%); mask-image: radial-gradient(circle, #000 14%, rgba(0,0,0,0.5) 30%, transparent 58%)"></span><span style="position: absolute; left: -45px; top: -45px; width: 280px; height: 280px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(255,250,240,0) 40%, rgba(255,250,240,${(0.9 * strength).toFixed(2)}) 44%, rgba(255,236,210,${(0.35 * strength).toFixed(2)}) 55%, rgba(200,210,255,${(0.12 * strength).toFixed(2)}) 75%, rgba(255,255,255,0) 100%)"></span>`;
/** The diamond ring: the first bead of sunlight back at the moon's edge. */
const diamond = (x, y) => `<span style="position: absolute; left: ${x - 5}px; top: ${y - 5}px; width: 10px; height: 10px; border-radius: 999px; background: #FFFFFF; box-shadow: 0 0 10px 4px rgba(255,255,255,0.95), 0 0 34px 12px rgba(255,236,200,0.6)"></span><span style="position: absolute; left: ${x - 40}px; top: ${y - 0.75}px; width: 80px; height: 1.5px; background: linear-gradient(90deg, rgba(255,255,255,0), #FFFFFF, rgba(255,255,255,0))"></span><span style="position: absolute; left: ${x - 0.75}px; top: ${y - 26}px; width: 1.5px; height: 52px; background: linear-gradient(180deg, rgba(255,255,255,0), #FFFFFF, rgba(255,255,255,0))"></span>`;

/* ── The skies ── */
const NIGHT = `radial-gradient(circle at 50% 45%, #16224A 0%, #0B1026 72%)`;
const MORNING = gradient([['#A9DDE0', 0], ['#DDF1EF', 38], ['#FCE7D8', 74], ['#FBC9A6', 100]]);
const dim = (base, a) => `linear-gradient(rgba(16,22,56,${a}), rgba(16,22,56,${a})), ${base}`;
const ECLIPSE_SKY = gradient([['#0E1535', 0], ['#1A2452', 45], ['#3B3F6E', 78], ['#B9806F', 100]]);
const DUSK = gradient([['#2E2A5C', 0], ['#5A4E9A', 40], ['#A785B0', 76], ['#EFA07E', 100]]);

/** The full-moon ring the app draws on full-moon nights (MoonDisc's FullMoonRing): wide, faint, prismatic. */
const FULL_RING = `<span style="position: absolute; left: -1px; top: -1px; width: 192px; height: 192px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(111,214,207,0) 80%, rgba(255,210,190,0.22) 86%, rgba(111,214,207,0.42) 90%, rgba(179,167,245,0.2) 94%, rgba(111,214,207,0) 100%)"></span>`;

const MOON_Y = Math.round(0.42 * 844) - 60; // where the moon settles, in the cropped frame
const SUN_Y = MOON_Y;
const DUSK_Y = Math.round(0.55 * 844) - 110;

const ROWS = [
  {
    scene: 'Houna starfield', kind: 'Lunar eclipse · Night', tone: INK.accent,
    intro: 'Only ever at full moon, when the Earth passes between the sun and the moon: its shadow crosses the teal moon from the left, and inside it the moon turns copper, lit only by the red of every sunrise and sunset on Earth. The pressed mark stays, copper where the shadow is.',
    frames: [
      ['Full moon', 'The full-moon night as the app draws it today, ring and all.', frame(NIGHT, stars(46, 1) + at(W / 2, MOON_Y, FULL_RING + eclipsedMoon('a', -260)))],
      ['The shadow arrives', 'Earth’s shadow takes a curved bite from the left, the edge soft and warm.', frame(NIGHT, stars(46, 1) + at(W / 2, MOON_Y, eclipsedMoon('b', -105)))],
      ['Totality', 'The whole moon copper; its halo turns to a faint ember glow, and with the moonlight gone, more stars come out.', frame(NIGHT, stars(90, 1.5) + at(W / 2, MOON_Y, eclipsedMoon('c', -12)))],
      ['The light returns', 'The shadow slides off to the right, the teal coming back from the left.', frame(NIGHT, stars(60, 1.15) + at(W / 2, MOON_Y, eclipsedMoon('d', 118)))],
    ],
  },
  {
    scene: 'Houna sunrise', kind: 'Total solar eclipse · Sunrise', tone: '#F9A980',
    intro: 'Only ever at new moon: the dark moon crosses the morning sun until it covers it whole. The sky falls to a deep evening blue with stars in it, the pearly corona blooms round the black disc, and the Houna mark shows faintly on the moon, lit by it. Then the diamond ring: the first bead of sunlight back.',
    frames: [
      ['Morning sun', 'The sunrise scene as it is, the sun settled and breathing.', frame(MORNING, at(W / 2, SUN_Y, sunGlow('249,169,128', 1) + rays(1) + sunDisc(DISCS.sunrise)), { word: '#6D6F72' })],
      ['The moon crosses', 'A dark bite grows across the sun; the light thins, the rays shorten, the sky dims.', frame(dim(MORNING, 0.38), at(W / 2, SUN_Y, sunGlow('249,169,128', 0.6) + rays(0.5) + sunDisc(DISCS.sunrise) + darkMoon(122, 44)), { word: '#4F5A6E' })],
      ['Totality', 'The corona round a black disc, the mark faint on it; the first stars of an evening in the morning.', frame(ECLIPSE_SKY, stars(40, 1.1, H * 0.7) + at(W / 2, SUN_Y, corona(1) + darkMoon(122, 0, { rim: 0.8, markShown: true })), { word: INK.sec })],
      ['Diamond ring', 'A single bead of light flares at the edge, and the day comes back.', frame(dim(ECLIPSE_SKY, 0), stars(18, 0.6, H * 0.6) + at(W / 2, SUN_Y, corona(0.55) + darkMoon(122, -5, { rim: 0.6, markShown: true }) + diamond(151, 60)), { word: INK.sec })],
    ],
  },
  {
    scene: 'Houna dusk', kind: 'Annular eclipse · Dusk', tone: '#EC8C6E',
    intro: 'When the moon is at its farthest it looks smaller than the sun and can’t cover it: a ring of fire. It suits Dusk’s low amber sun; the violet deepens and the first stars and shooting stars come out early.',
    frames: [
      ['Evening sun', 'The dusk scene as it is: amber sun, violet sky, the first stars.', frame(DUSK, stars(22, 0.8, H * 0.5) + at(W / 2, DUSK_Y, sunGlow('242,160,120', 1) + sunDisc(DISCS.dusk)), { word: '#1B2140' })],
      ['The moon crosses', 'The dark moon moves in from the edge; the amber thins.', frame(dim(DUSK, 0.25), stars(30, 0.95, H * 0.55) + at(W / 2, DUSK_Y, sunGlow('242,160,120', 0.7) + sunDisc(DISCS.dusk) + darkMoon(104, 36)), { word: '#1B2140' })],
      ['Ring of fire', 'Centred, it leaves a bright ring; the mark shows faintly on the dark disc inside it.', frame(dim(DUSK, 0.45), stars(48, 1.2, H * 0.6) + at(W / 2, DUSK_Y, sunGlow('242,160,120', 0.9) + sunDisc(DISCS.dusk) + darkMoon(104, 0, { markShown: true })), { word: INK.sec })],
    ],
  },
];

const NOTES = [
  ['Only on real eclipse days', 'Like the moon’s real phase, worked out from the date: a lunar eclipse only on its night (they fall at full moon), a solar one only on its day (at new moon), and only one visible from the Gulf. The next big one: the total solar eclipse of 2 August 2027, whose path crosses Saudi Arabia. Dates to be confirmed against NASA’s eclipse catalogue before building.'],
  ['How it plays', 'A real eclipse takes hours and totality minutes, so on the day each visit plays it through once, slowly (about 30 seconds), and rests at the eclipse’s peak: the copper moon, the corona, the ring. The breath goes on throughout: halo, corona and ring swell on the in-breath as the moon’s halo does now.'],
  ['What stays the same', 'The handoff from Home, the glide or rise, the one word, the tap to go back, and the visit counted as a breathing session. The pressed mark stays with the disc: copper on the eclipsed moon, faint on the dark moon at totality and inside the ring.'],
  ['One quiet line', 'On the day, a small line under “Tanafas” names it: “Tonight: a lunar eclipse” / “Today: a solar eclipse”, and for a solar one, “Never look at the sun without eclipse glasses.” Nothing else changes, and it never shows on other days.'],
  ['Where it fits', 'Starfield: lunar (the moon is already the scene). Sunrise: total solar (a sunrise sun, blacked out, is the most dramatic). Dusk: annular (a ring of fire suits a low evening sun). Which kind each theme shows could follow the real eclipse instead: a real annular on a Sunrise day would show as a ring.'],
  ['Reduce Motion', 'With Reduce Motion on, the scene opens straight at the eclipse’s peak, still, like the rest of the scene.'],
];

const WIDTH = 64 * 2 + 4 * W + 3 * 32;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Houna eclipses</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${INK.ground};font-family:'Figtree',system-ui,sans-serif;color:${INK.text}}
</style>
</helmet>
<div style="width: ${WIDTH}px; box-sizing: border-box; padding: 64px; background: ${INK.ground}; display: flex; flex-direction: column; gap: 48px">
<div style="display: flex; flex-direction: column; gap: 12px">
<span style="${mono}; font-size: 12px; letter-spacing: 0.16em; color: ${INK.accent}">HOUNA · SCENES</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${INK.text}">Houna eclipses</h1>
<p style="margin: 0; max-width: 1040px; font-size: 17px; line-height: 1.5; color: ${INK.sec}">The Home-mark scenes on a real eclipse day, where each belongs: a lunar eclipse in the starfield, a total solar eclipse at sunrise, and a ring of fire at dusk. Drawn in the pressed-logo look the app has now; everything else about the scenes stays as it is.</p>
</div>
${ROWS.map((row) => `<section style="display: flex; flex-direction: column; gap: 18px">
<div style="display: flex; flex-direction: column; gap: 6px; max-width: 1100px">
<span style="${mono}; font-size: 12px; letter-spacing: 0.16em; color: ${row.tone}">${row.kind.toUpperCase()}</span>
<span style="font-family: 'Marcellus', serif; font-size: 34px; color: ${INK.text}">${row.scene}</span>
<span style="font-size: 15px; line-height: 1.55; color: ${INK.sec}">${row.intro}</span>
</div>
<div style="display: flex; gap: 32px">
${row.frames.map(([title, note, body], i) => `<div style="display: flex; flex-direction: column; gap: 12px; width: ${W}px">
${body}
<div style="display: flex; align-items: baseline; gap: 8px"><span style="${mono}; font-size: 12px; color: ${row.tone}">${i + 1}</span><span style="font-size: 16px; font-weight: 600; color: ${INK.text}">${title}</span></div>
<span style="font-size: 13.5px; line-height: 1.5; color: ${INK.sec}">${note}</span>
</div>`).join('\n')}
</div>
</section>`).join('\n')}
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
${NOTES.map(([t, b]) => `<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 18px; background: ${INK.card}; border: 1px solid ${INK.line}"><span style="font-size: 15px; font-weight: 600; color: ${INK.text}">${t}</span><span style="font-size: 13.5px; line-height: 1.55; color: ${INK.sec}">${b}</span></div>`).join('\n')}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${WIDTH},"height":3340}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'Eclipses.dc.html', html);
console.log('Eclipses.dc.html', (html.length / 1024).toFixed(0) + 'KB · width', WIDTH);
