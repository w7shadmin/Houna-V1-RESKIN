// "Houna moon — real phases": the starfield's moon showing the actual moon phase, computed from the
// date (no weather app, no network, no permissions). Tonight's moon, live, in two breathing options
// (A: the glow breathes; B: the light breathes too), a day stepper to preview any night, and the
// whole cycle. Earthshine at new moon: the dark part stays a faint disc, the logo just visible.
const fs = require('fs');
const { pressedFill } = require('./pressed-kit.js');
const { mark } = require('./make-appicons.js');

/** The mark as an <svg> nested in the moon's 190px svg, centred, so the lit mask can clip it. */
const innerMark = (size, fill) => mark(size, fill).replace(/^<svg aria-hidden="true" (width="[^"]+" height="[^"]+" viewBox="[^"]+") style="[^"]*">/, (_, a) => '<svg x="' + (95 - size / 2) + '" y="' + (95 - size / 2) + '" ' + a + ' overflow="visible">');
const P = __dirname + '/../project/';

const SYN = 29.530588853;
const EPOCH = Date.UTC(2000, 0, 6, 18, 14); // a known new moon
const R = 60; // the moon's radius in its 190px box
const GLOW = '111,214,207';

/** Age (days), illuminated fraction, waxing, and the mask's shape for a moon of radius R. */
function phaseAt(age) {
  const th = (2 * Math.PI * age) / SYN;
  const fraction = (1 - Math.cos(th)) / 2;
  const waxing = age < SYN / 2;
  const crescent = Math.cos(th) > 0; // less than half lit
  const rx = R * Math.abs(Math.cos(th));
  // Option B: the lit part swells a little on the in-breath (never past the quarter line).
  const rxIn = crescent ? Math.max(0, rx - 0.15 * R) : Math.min(R, rx + 0.15 * R);
  return { fraction, waxing, crescent, rx, rxIn };
}

/**
 * The moon in its 190px box: the earthshine disc, the lit part (the half-disc on the lit side,
 * minus the terminator ellipse for a crescent, plus it for a gibbous), the pressed logo over the
 * whole disc, and the edge halo breathing. `v` holds literal values, or DC holes for the live tiles.
 */
function moon(id, v, { lightBreathes }) {
  const animate = lightBreathes ? `<animate attributeName="rx" values="${v.values}" dur="5s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"></animate>` : '';
  const halo = `<span style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; opacity: ${v.haloOpacity}"><span style="position: absolute; left: ${95 - 110}px; top: ${95 - 110}px; width: 220px; height: 220px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${GLOW},0) 50%, rgba(${GLOW},0.45) 56%, rgba(${GLOW},0) 100%); animation: breath 5s ease-in-out infinite"></span></span>`;
  const markInk = innerMark(64, pressedFill('#6FD6CF'));
  return `${halo}<svg width="190" height="190" viewBox="0 0 190 190" aria-hidden="true" style="position: absolute; left: 0; top: 0">
<defs>
<radialGradient id="lit${id}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#D9FAF6"></stop><stop offset="0.55" stop-color="#6FD6CF"></stop><stop offset="1" stop-color="#2E8F8A"></stop></radialGradient>
<radialGradient id="dark${id}" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#1D2E52"></stop><stop offset="1" stop-color="#0F1838"></stop></radialGradient>
<mask id="m${id}"><rect x="0" y="0" width="190" height="190" fill="#000"></rect><rect x="${v.sideX}" y="${95 - R}" width="${R}" height="${2 * R}" fill="#fff"></rect><ellipse cx="95" cy="95" rx="${v.rx}" ry="${R}" fill="${v.ellipseFill}">${animate}</ellipse></mask>
</defs>
<circle cx="95" cy="95" r="${R}" fill="url(#dark${id})" stroke="rgba(${GLOW},0.35)" stroke-width="1"></circle>
<circle cx="95" cy="95" r="${R}" fill="url(#lit${id})" mask="url(#m${id})"></circle>
<g opacity="0.22">${innerMark(64, '#6FD6CF')}</g>
<g opacity="0.7" mask="url(#m${id})">${markInk}</g>
</svg>`;
}

const literal = (age) => {
  const p = phaseAt(age);
  return { sideX: p.waxing ? 95 : 95 - R, rx: p.rx.toFixed(2), rxIn: p.rxIn.toFixed(2), ellipseFill: p.crescent ? '#000' : '#fff', values: [p.rx, p.rxIn, p.rx].map((n) => n.toFixed(2)).join(';'), haloOpacity: (0.3 + 0.7 * p.fraction).toFixed(2) };
};

const NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
const CYCLE = NAMES.map((name, i) => ({ name, age: (i * SYN) / 8 }));

const T = { ground: '#0B1026', border: 'rgba(242,236,221,0.10)', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5', accent: '#6FD6CF' };
let seed = 9;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const stars = (w, h) => Array.from({ length: Math.round((w * h) / 3500) }, () => `<span style="position: absolute; left: ${(rnd() * w).toFixed(0)}px; top: ${(rnd() * h).toFixed(0)}px; width: 1.4px; height: 1.4px; border-radius: 999px; background: rgba(242,236,221,${(0.25 + rnd() * 0.5).toFixed(2)})"></span>`).join('');
const sky = (w, h, inner, extra = '') => `<div style="position: relative; width: ${w}px; height: ${h}px; border-radius: 24px; overflow: hidden; background: radial-gradient(circle at 50% 50%, #16224A 0%, #0B1026 72%); border: 1px solid ${T.border}; ${extra}">${stars(w, h)}<div style="position: absolute; left: ${(w - 190) / 2}px; top: ${(h - 190) / 2}px; width: 190px; height: 190px">${inner}</div></div>`;

const hole = { sideX: '{{sideX}}', rx: '{{rx}}', ellipseFill: '{{ellipseFill}}', values: '{{rxValues}}', haloOpacity: '{{haloOpacity}}' };
const btn = (label, handler, aria) => `<button type="button" aria-label="${aria}" onClick="{{${handler}}}" style="height: 40px; min-width: 44px; padding: 0 14px; border-radius: 999px; background: rgba(242,236,221,0.06); border: 1px solid rgba(242,236,221,0.14); color: ${T.text}; font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 500">${label}</button>`;
const option = (id, title, note, lightBreathes) => `<div style="display: flex; flex-direction: column; gap: 12px; width: 420px">
${sky(420, 360, moon(id, hole, { lightBreathes }))}
<span style="font-size: 17px; font-weight: 600; color: ${T.text}">${title}</span>
<span style="font-size: 13.5px; line-height: 1.5; color: ${T.sec}">${note}</span>
</div>`;
const cycleTile = (c, i) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 150px">
${sky(150, 150, `<div style="transform: scale(0.62); transform-origin: 95px 95px; position: absolute; left: 0; top: 0; width: 190px; height: 190px">${moon('c' + i, literal(c.age), { lightBreathes: false })}</div>`, `outline: 2px solid {{tonight${i}}}; outline-offset: 3px`)}
<span style="font-size: 13px; font-weight: 600; color: ${T.text}; text-align: center">${c.name}</span>
</div>`;
const note = (title, body) => `<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 18px; background: rgba(242,236,221,0.04); border: 1px solid ${T.border}"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${title}</span><span style="font-size: 13.5px; line-height: 1.55; color: ${T.sec}">${body}</span></div>`;

const WIDTH = 64 * 2 + 8 * 150 + 7 * 20;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Houna moon — real phases</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
@keyframes breath{0%{transform:scale(0.95);opacity:0.2}50%{transform:scale(1.1);opacity:1}100%{transform:scale(0.95);opacity:0.2}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
</helmet>
<div style="width: ${WIDTH}px; box-sizing: border-box; padding: 64px; background: ${T.ground}; display: flex; flex-direction: column; gap: 36px">
<div style="display: flex; flex-direction: column; gap: 12px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${T.accent}">HOUNA · STARFIELD</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${T.text}">Houna moon — real phases</h1>
<p style="margin: 0; max-width: 900px; font-size: 17px; line-height: 1.5; color: ${T.sec}">The starfield’s moon as tonight’s real moon: its phase worked out from the date alone, the way weather apps do it. No weather app, no internet, no permissions. On new-moon nights the dark part stays as a faint disc with the logo just visible (earthshine), so the scene is never empty.</p>
</div>

<div style="display: flex; flex-direction: column; gap: 18px">
<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 24px; flex-wrap: wrap">
<div style="display: flex; flex-direction: column; gap: 6px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${T.ter}">{{dateLabel}}</span>
<span style="font-family: 'Marcellus', serif; font-size: 34px; color: ${T.text}">{{phaseName}} · {{pct}}% lit</span>
<span style="font-size: 14px; color: ${T.sec}">Next full moon in {{toFull}} · next new moon in {{toNew}}</span>
</div>
<div role="group" aria-label="Preview another night" style="display: flex; gap: 8px">
${btn('« week', 'weekBack', 'A week earlier')}${btn('‹ day', 'dayBack', 'A day earlier')}${btn('Tonight', 'today', 'Back to tonight')}${btn('day ›', 'dayOn', 'A day later')}${btn('week »', 'weekOn', 'A week later')}
</div>
</div>
<div style="display: flex; gap: 32px">
${option('a', 'A · The glow breathes', 'The moon keeps tonight’s exact shape; its halo swells on the in-breath and ebbs on the out-breath, as the moon does today.', false)}
${option('b', 'B · The light breathes too', 'Around tonight’s shape, the lit part swells a little on the in-breath and eases back on the out. A thin sliver appears even at new moon; a full moon can’t grow, so only its halo breathes.', true)}
</div>
</div>

<div style="display: flex; flex-direction: column; gap: 14px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${T.ter}">THE WHOLE CYCLE · 29.5 DAYS · TONIGHT OUTLINED</span>
<div style="display: flex; gap: 20px">
${CYCLE.map(cycleTile).join('\n')}
</div>
</div>

<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
${note('How it knows', 'The moon repeats every 29.53 days, counted from a known new moon. From the phone’s date and time, that gives tonight’s phase to within a few hours: the same figures a weather app shows, with nothing to fetch and nothing to allow.')}
${note('Why not the weather app', 'Other apps’ data isn’t readable: Android weather apps don’t share it, and Apple’s WeatherKit needs a paid developer setup and an internet call, for numbers we can work out for free.')}
${note('As seen from the Gulf', 'The lit side is drawn as it looks from the northern hemisphere: on the right as it grows, on the left as it shrinks. Later, it could mark the Hijri month too: the first thin crescent is the month’s start.')}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${WIDTH},"height":1380}}'>
const SYN = ${SYN};
const EPOCH = ${EPOCH};
const R = ${R};
const NAMES = ${JSON.stringify(NAMES)};
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { offset: 0 };
  }
  renderVals() {
    const offset = this.state.offset;
    const at = Date.now() + offset * 86400000;
    const age = ((((at - EPOCH) / 86400000) % SYN) + SYN) % SYN;
    const th = (2 * Math.PI * age) / SYN;
    const fraction = (1 - Math.cos(th)) / 2;
    const waxing = age < SYN / 2;
    const crescent = Math.cos(th) > 0;
    const rx = R * Math.abs(Math.cos(th));
    const rxIn = crescent ? Math.max(0, rx - 0.15 * R) : Math.min(R, rx + 0.15 * R);
    const index = Math.floor(((age + SYN / 16) % SYN) / (SYN / 8));
    const days = (d) => { const n = Math.round(d); return n === 0 ? 'under a day' : n === 1 ? '1 day' : n + ' days'; };
    const vals = {
      sideX: waxing ? 95 : 95 - R,
      rx: rx.toFixed(2),
      rxValues: [rx, rxIn, rx].map((n) => n.toFixed(2)).join(';'),
      ellipseFill: crescent ? '#000' : '#fff',
      phaseName: NAMES[index],
      pct: Math.round(fraction * 100),
      haloOpacity: (0.3 + 0.7 * fraction).toFixed(2),
      toFull: days((SYN / 2 - age + SYN) % SYN),
      toNew: days(SYN - age),
      dateLabel: (offset === 0 ? 'TONIGHT · ' : '') + new Date(at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase(),
      weekBack: () => this.setState({ offset: offset - 7 }),
      dayBack: () => this.setState({ offset: offset - 1 }),
      today: () => this.setState({ offset: 0 }),
      dayOn: () => this.setState({ offset: offset + 1 }),
      weekOn: () => this.setState({ offset: offset + 7 })
    };
    NAMES.forEach((_, i) => { vals['tonight' + i] = i === index ? '${T.accent}' : 'transparent'; });
    return vals;
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'MoonPhases.dc.html', html);
console.log('MoonPhases.dc.html', (html.length / 1024).toFixed(0) + 'KB · width', WIDTH);
