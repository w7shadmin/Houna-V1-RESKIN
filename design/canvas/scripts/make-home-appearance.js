// "Home — appearance": changing the theme from Home. Tapping the "houna هنا" logo cycles Sunrise →
// Dusk → Night (the order of the day), a strip of three icons above it turning like a dial. Two Home
// styles, both in the app while the client decides (More → Appearance → Home): "Sun & moon", where
// Home's centre is the theme's own sun or moon alone, and a change sets it, whole, past the right edge, the
// colours crossfade over the empty sky, and the next comes in whole from beyond the left edge as they settle; and
// "Classic", the mark in its ring, where the colours just crossfade.
// Writes an interactive prototype and a storyboard with notes.
const fs = require('fs');
const { DISCS, pressedMark } = require('./pressed-kit.js');
const { mark, halo: markHalo } = require('./make-appicons.js');
const P = __dirname + '/../project/';

/* ── The three themes' Home tokens (the canvas Home boards') ── */
const THEMES = [
  {
    key: 'sunrise', name: 'Sunrise', ground: '#F2F6F4', text: '#1D2B2A', sec: '#58595B', ter: '#6D6F72', accent: '#196662',
    ringA: '#196662', ringB: '#0A91BB', card: '#FFFFFF', line: 'rgba(29,43,42,0.10)', ctrl: '#FFFFFF', ctrlLine: 'rgba(29,43,42,0.12)',
    tab: '#FFFFFF', tabLine: 'rgba(29,43,42,0.08)', tabOn: '#196662', raised: '#196662', crisis: '249,169,128', logoP: '#3BAAA7', logoS: '#525052', stars: false,
  },
  {
    key: 'dusk', name: 'Dusk', ground: '#F5F1E8', text: '#1B2140', sec: '#4A5078', ter: '#646A8E', accent: '#237873',
    ringA: '#237873', ringB: '#6353C9', card: '#FFFFFF', line: 'rgba(27,33,64,0.10)', ctrl: '#FFFFFF', ctrlLine: 'rgba(27,33,64,0.12)',
    tab: '#FFFFFF', tabLine: 'rgba(27,33,64,0.08)', tabOn: '#1B2140', raised: '#1B2140', crisis: '242,184,128', logoP: '#3BAAA7', logoS: '#525052', stars: false,
  },
  {
    key: 'night', name: 'Night', ground: '#0B1026', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5', accent: '#6FD6CF',
    ringA: '#6FD6CF', ringB: '#B3A7F5', card: 'rgba(242,236,221,0.045)', line: 'rgba(242,236,221,0.10)', ctrl: 'rgba(242,236,221,0.08)', ctrlLine: 'rgba(242,236,221,0.12)',
    tab: '#0F1534', tabLine: 'rgba(242,236,221,0.08)', tabOn: '#F2ECDD', raised: '#F2ECDD', crisis: '242,184,128', logoP: '#6FD6CF', logoS: '#F2ECDD', stars: true,
  },
];

/** The official logo (constants/logoSvg.ts), tinted as Logo variant="themed" does. */
const LOGO_GREEN = /LOGO_GREEN_XML = `([\s\S]*?)`/.exec(fs.readFileSync(__dirname + '/../../../constants/logoSvg.ts', 'utf8'))[1];
const logo = (T, width = 72) => LOGO_GREEN.replace(/<svg[^>]*>/, `<svg viewBox="0 0 93.339 44.094" width="${width}" aria-hidden="true" style="display: block">`)
  .replace(/\sid="[^"]*"/g, '')
  .replace(/fill="#3baaa7"/g, `fill="${T.logoP}"`)
  .replace(/fill="#525052"/g, `fill="${T.logoS}"`);

/* ── Geometry (390×844) ── */
const CX = 195, CY = 206; // the ring's centre, a little lower than today to make room for the strip
const RING_R = 86;
const LOGO_Y = 36; // the logo's top
const STRIP_Y = 12; // the strip's top
const SLOT = 30; // the strip's icon spacing

/* ── The strip's icons (16px strokes) ── */
const ICONS = {
  // Sunrise: the full sun with its rays (the Sunrise scene's sun has rays).
  sunrise: '<circle cx="12" cy="12" r="4.4"></circle><path d="M12 2.6v2.3M12 19.1v2.3M2.6 12h2.3M19.1 12h2.3M5.4 5.4l1.6 1.6M17 17l1.6 1.6M5.4 18.6 7 17M17 7l1.6-1.6"></path>',
  // Dusk: the low sun on the horizon, rays above and water below (the setting evening sun).
  dusk: '<path d="M7 14.5a5 5 0 0 1 10 0"></path><path d="M2.5 14.5h19"></path><path d="M12 5.2v2.2M5.3 8.2l1.5 1.3M18.7 8.2l-1.5 1.3M3.2 11.6l1.9.5M20.8 11.6l-1.9.5"></path><path d="M5.5 17.6h9M16.8 17.6h1.7M8 20.4h8"></path>',
  // Night: the crescent moon.
  night: '<path d="M10.38 3.66A8.5 8.5 0 1 0 20.01 14.84A7.4 7.4 0 0 1 10.38 3.66z"></path>',
};
const icon = (key, color) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key]}</svg>`;
/**
 * Where each theme's icon sits in the strip when `cur` is shown: centre, lit; the next to the LEFT and
 * the previous to the right, so on a change everything travels left → right, as the sun and moon do.
 */
const slot = (k, cur) => [0, -SLOT, SLOT][(k - cur + 3) % 3];

/* ── Home, without its body and strip (those are drawn above, shared across themes) ── */
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const STARS = Array.from({ length: 60 }, () => `<span style="position: absolute; left: ${(rnd() * 390).toFixed(0)}px; top: ${(rnd() * 844).toFixed(0)}px; width: 1.4px; height: 1.4px; border-radius: 999px; background: rgba(242,236,221,${(0.25 + rnd() * 0.5).toFixed(2)})"></span>`).join('');

const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');
/** Classic's centre: the mark with its edge halo, in its ring of 28 dots (MarkHalo). */
function classicHero(T) {
  const ring = Array.from({ length: 28 }, (_, i) => {
    const t = i / 28, a = t * Math.PI * 2 - Math.PI / 2, s = 2.5 + 4 * Math.sin(t * Math.PI);
    return `<span style="position: absolute; left: ${(CX + RING_R * Math.cos(a) - s / 2).toFixed(1)}px; top: ${(CY + RING_R * Math.sin(a) - s / 2).toFixed(1)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: ${i < 14 ? T.ringA : T.ringB}; opacity: ${(0.22 + 0.78 * Math.sin(t * Math.PI)).toFixed(2)}"></span>`;
  }).join('');
  return `${ring}<div style="position: absolute; left: ${CX - 95}px; top: ${CY - 95}px; width: 190px; height: 190px">${markHalo(190, 70, rgbOf(T.logoP), T.stars ? 0.4 : 0.5)}${mark(70, T.logoP)}</div>`;
}

/**
 * Home without its strip. `hero`: 'classic' draws the mark in its ring; 'none' leaves the centre
 * empty for a sun or moon drawn above (Sun & moon: the body alone, no ring); 'slot' leaves a
 * {{classic}} hole round the classic centre, for the prototype to show or hide.
 */
function home(T, { rtl = false, hero = 'none' } = {}) {
  const ring = hero === 'classic' ? classicHero(T) : hero === 'slot' ? `<div style="display: {{classic}}">${classicHero(T)}</div>` : '';
  const button = (side, inner) => `<span style="position: absolute; ${side}: 16px; top: 22px; width: 44px; height: 44px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; justify-content: center">${inner}</span>`;
  const bloom = `<span style="width: 18px; height: 18px; border-radius: 999px; border: 2px solid ${T.accent}; box-sizing: border-box"></span>`;
  const person = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${T.sec}" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="3.6"></circle><path d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4"></path></svg>`;
  const tab = (label, on) => `<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; font-weight: ${on ? 600 : 400}; color: ${on ? T.tabOn : T.ter}"><span style="width: 22px; height: 22px; border-radius: 6px; border: 1.6px solid currentColor; box-sizing: border-box"></span>${label}</span>`;
  return `<div style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif">
${T.stars ? STARS : ''}
${button(rtl ? 'right' : 'left', bloom)}${button(rtl ? 'left' : 'right', person)}
<div style="position: absolute; left: ${CX - 36}px; top: ${LOGO_Y}px">${logo(T)}</div>
${ring}
<div style="position: absolute; left: 0; right: 0; top: 320px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
<span style="font-family: 'DM Mono', monospace; font-size: 11.5px; letter-spacing: 0.16em; color: ${T.accent}">● YOU'RE NOT ALONE</span>
<span style="font-family: 'Marcellus', serif; font-size: 20px; color: ${T.text}">You are one light among many.</span>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: 398px; height: 210px; border-radius: 24px; background: ${T.card}; border: 1px solid ${T.line}; box-sizing: border-box; padding: 16px; display: flex; flex-direction: column; gap: 12px">
<span style="font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.14em; color: ${T.ter}">BREATHING TOGETHER</span>
<span style="flex: 1; border-radius: 14px; background: radial-gradient(circle at 30% 40%, ${T.line} 1.2px, transparent 1.6px) 0 0 / 9px 9px"></span>
<span style="font-size: 13px; color: ${T.sec}">people breathed with Houna this month</span>
</div>
<span style="position: absolute; left: 50%; top: 628px; transform: translateX(-50%); padding: 10px 18px; border-radius: 999px; background: rgba(${T.crisis},0.08); border: 1px solid rgba(${T.crisis},0.4); font-size: 13px; color: ${T.text}; white-space: nowrap">Need to talk now?</span>
<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; background: ${T.tab}; border-top: 1px solid ${T.tabLine}; display: flex; align-items: flex-start; padding-top: 12px">
${tab('Home', true)}${tab('Directory')}<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; color: ${T.ter}"><span style="margin-top: -30px; width: 56px; height: 56px; border-radius: 999px; background: ${T.raised}; box-shadow: 0 0 0 6px ${T.ground}, 0 0 32px rgba(59,170,167,0.45)"></span>Tanafas</span>${tab('Events')}${tab('More')}
</div>
</div>`;
}

/* ── The bodies, each in a 190px box centred on the ring ── */
const breathe = 'animation: breath 5s ease-in-out infinite';
/** The halo joined to the disc's edge (radius r in the 240px halo): clear inside, brightest just outside. */
const halo = (rgb, strength, r) => `<span style="position: absolute; left: -25px; top: -25px; width: 240px; height: 240px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${rgb},0) ${(((r - 3) / 120) * 100).toFixed(1)}%, rgba(${rgb},${strength}) ${(((r + 4) / 120) * 100).toFixed(1)}%, rgba(${rgb},0) 100%); ${breathe}"></span>`;
const discAt = (size, stops, glowRgb) => `<span style="position: absolute; left: ${95 - size / 2}px; top: ${95 - size / 2}px; width: ${size}px; height: ${size}px; border-radius: 999px; background: ${stops}; box-shadow: 0 0 14px rgba(${glowRgb},0.45)"></span>`;
const BODIES = [
  // Sunrise: the pale-gold sun with short turning rays.
  `<span style="position: absolute; left: -95px; top: -95px; width: 380px; height: 380px; border-radius: 999px; background: repeating-conic-gradient(from 0deg, rgba(255,222,190,0.45) 0deg 3deg, rgba(255,222,190,0) 3deg 15deg); -webkit-mask-image: radial-gradient(circle, #000 20%, transparent 46%); mask-image: radial-gradient(circle, #000 20%, transparent 46%); ${breathe}"></span>${halo(DISCS.sunrise.glow, 0.5, 52)}${discAt(104, DISCS.sunrise.stops, DISCS.sunrise.glow)}${pressedMark(58, DISCS.sunrise.surface)}`,
  // Dusk: the amber evening sun, a glow and no rays.
  `${halo(DISCS.dusk.glow, 0.55, 52)}${discAt(104, DISCS.dusk.stops, DISCS.dusk.glow)}${pressedMark(58, DISCS.dusk.surface)}`,
  // Night: tonight's teal moon (full on 26 September 2026).
  `${halo(DISCS.teal.glow, 0.45, 42)}${discAt(84, DISCS.teal.stops, DISCS.teal.glow)}${pressedMark(54, DISCS.teal.surface)}`,
];
const bodyBox = (inner, style) => `<div style="position: absolute; left: ${CX - 95}px; top: ${CY - 95}px; width: 190px; height: 190px; ${style}">${inner}</div>`;

/* ── The move (as the app: components/home/HomeBody.tsx, THEME_FADE_MS) ── */
// Sun & moon: the body sets to the right (1300 ms); with the sky empty the screen is captured and
// the new colours fade in under it (1000 ms); the next body rises from the left over 1500 ms, landing
// just after they've settled. Classic: the colours fade at once, the mark stays.
const OUT = { x: 300, y: 72 }; // off the edge, a little lower: setting / rising
const TIMING = { total: 3500, leave: [0, 1300], colours: [1400, 1000], enter: [2100, 1400], strip: [0, 400] };
const CLASSIC = { colours: [60, 1000], total: 1060 };
const css = `
@keyframes breath{0%{transform:scale(0.95);opacity:0.35}50%{transform:scale(1.06);opacity:1}100%{transform:scale(0.95);opacity:0.35}}
${['A', 'B'].map((v) => `
@keyframes leave${v}{0%{transform:translate(0,0);opacity:1}45%{transform:translate(${OUT.x * 0.45}px,${OUT.y * 0.2}px);opacity:1}100%{transform:translate(${OUT.x}px,${OUT.y}px);opacity:1}}
@keyframes enter${v}{0%{transform:translate(${-OUT.x}px,${OUT.y}px);opacity:1}55%{transform:translate(${-OUT.x * 0.45}px,${OUT.y * 0.2}px);opacity:1}100%{transform:translate(0,0);opacity:1}}
@keyframes fadein${v}{from{opacity:0}to{opacity:1}}
@keyframes fadeout${v}{from{opacity:1}to{opacity:0}}
@keyframes stripin${v}{from{opacity:0}to{opacity:0.55}}`).join('')}
@media (prefers-reduced-motion: reduce){*{animation-duration:0.01s!important;animation-delay:0s!important}}
`;

/* ── Board A: the interactive prototype ── */
const prototype = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Home — appearance (tap the logo)</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#0B1026;font-family:'Figtree',system-ui,sans-serif}
${css}
</style>
</helmet>
<div style="position: relative; width: 390px; height: 844px; overflow: hidden; background: #0B1026">
${THEMES.map((T, k) => `<div style="position: absolute; inset: 0; z-index: {{z${k}}}; opacity: {{o${k}}}; animation: {{a${k}}}">${home(T, { hero: 'slot' })}</div>`).join('\n')}
${BODIES.map((b, k) => bodyBox(b, `z-index: 10; display: {{sky}}; opacity: {{bo${k}}}; animation: {{ba${k}}}`)).join('\n')}
<div style="position: absolute; left: ${CX - 9}px; top: ${STRIP_Y}px; width: 18px; height: 18px; z-index: 11">
${THEMES.map((T, k) => `<span style="position: absolute; left: 0; top: 0; width: 18px; height: 18px; transform: translateX({{ix${k}}}px) scale({{is${k}}}); opacity: {{io${k}}}; color: {{ic${k}}}; transition: {{it${k}}}; animation: {{ia${k}}}">${icon(T.key, 'currentColor')}</span>`).join('\n')}
</div>
<button type="button" aria-label="{{label}}" onClick="{{next}}" style="position: absolute; left: ${CX - 50}px; top: 4px; width: 100px; height: 74px; z-index: 12; border: 0; background: transparent; cursor: pointer; border-radius: 16px"></button>
<span style="position: absolute; left: 0; right: 0; top: 682px; z-index: 12; text-align: center; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.14em; color: {{hintColor}}; pointer-events: none">TAP THE LOGO · HOME STYLE</span>
<div style="position: absolute; left: 50%; top: 700px; transform: translateX(-50%); z-index: 12; display: flex; gap: 4px; padding: 3px; border-radius: 999px; background: {{switchBg}}; border: 1px solid {{switchLine}}">
<button type="button" onClick="{{toSky}}" aria-pressed="{{skyOn}}" style="border: 0; border-radius: 999px; padding: 5px 12px; font: 600 11px 'Figtree', system-ui, sans-serif; cursor: pointer; background: {{skyBg}}; color: {{skyFg}}">Sun &amp; moon</button>
<button type="button" onClick="{{toClassic}}" aria-pressed="{{classicOn}}" style="border: 0; border-radius: 999px; padding: 5px 12px; font: 600 11px 'Figtree', system-ui, sans-serif; cursor: pointer; background: {{classicBg}}; color: {{classicFg}}">Classic</button>
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
const NAMES = ${JSON.stringify(THEMES.map((T) => T.name))};
const ACCENT = ${JSON.stringify(THEMES.map((T) => T.accent))};
const TER = ${JSON.stringify(THEMES.map((T) => T.ter))};
const SLOT = ${SLOT};
const T = ${JSON.stringify(TIMING)};
const C = ${JSON.stringify(CLASSIC)};
const SWITCH = ${JSON.stringify(THEMES.map((T) => ({ bg: T.ctrl, line: T.ctrlLine, on: T.accent, onFg: T.ground, off: T.sec })))};
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { cur: 2, prev: -1, n: 0, sky: true };
  }
  renderVals() {
    const { cur, prev, n, sky } = this.state;
    const v = n % 2 ? 'A' : 'B';
    const vals = {};
    // Sun & moon: the body sets; the colours fade over the empty sky; the next comes in whole from the left.
    // Classic: the colours just fade.
    const fade = sky ? T.colours : C.colours;
    for (let k = 0; k < 3; k++) {
      const on = k === cur, off = k === prev;
      vals['z' + k] = on ? 2 : off ? 1 : 0;
      vals['o' + k] = on ? 1 : 0;
      vals['a' + k] = n && on ? 'fadein' + v + ' ' + fade[1] + 'ms ease-in-out ' + fade[0] + 'ms both' : 'none';
      if (off) vals['o' + k] = 1;
      vals['bo' + k] = on ? 1 : 0;
      vals['ba' + k] = n && on ? 'enter' + v + ' ' + T.enter[1] + 'ms cubic-bezier(0.2,0.6,0.3,1) ' + T.enter[0] + 'ms both' : n && off ? 'leave' + v + ' ' + T.leave[1] + 'ms cubic-bezier(0.45,0,0.75,0.45) both' : 'none';
      if (off && n) vals['bo' + k] = 1;
      // The strip: centre lit; the next on the left, the previous on the right.
      const rel = (k - cur + 3) % 3;
      vals['ix' + k] = [0, -SLOT, SLOT][rel];
      vals['is' + k] = rel === 0 ? 1.25 : 0.9;
      vals['io' + k] = rel === 0 ? 1 : 0.55;
      vals['ic' + k] = rel === 0 ? ACCENT[cur] : TER[cur];
      const wraps = n && rel === 1;
      vals['it' + k] = wraps ? 'none' : 'transform 400ms ease, opacity 400ms ease, color ' + fade[1] + 'ms ease ' + fade[0] + 'ms';
      vals['ia' + k] = wraps ? 'stripin' + v + ' 400ms ease both' : 'none';
    }
    const next = (cur + 1) % 3;
    const S = SWITCH[cur];
    // A change runs to its end before the next tap, as in the app.
    const busy = () => this.until && Date.now() < this.until;
    return Object.assign(vals, {
      label: 'Appearance: ' + NAMES[cur] + '. Tap for ' + NAMES[next],
      hintColor: TER[cur],
      sky: sky ? 'block' : 'none',
      classic: sky ? 'none' : 'block',
      switchBg: S.bg, switchLine: S.line,
      skyOn: String(sky), classicOn: String(!sky),
      skyBg: sky ? S.on : 'transparent', skyFg: sky ? S.onFg : S.off,
      classicBg: sky ? 'transparent' : S.on, classicFg: sky ? S.off : S.onFg,
      toSky: () => { this.until = 0; this.setState({ sky: true, prev: -1, n: 0 }); },
      toClassic: () => { this.until = 0; this.setState({ sky: false, prev: -1, n: 0 }); },
      next: () => {
        if (busy()) return;
        this.until = Date.now() + (sky ? T.total : C.total);
        this.setState({ cur: next, prev: cur, n: n + 1 });
      }
    });
  }
}
</script>
</body>
</html>
`;
if (require.main === module) fs.writeFileSync(P + 'HomeAppearance.dc.html', prototype);

/* ── Board B: the storyboard ── */
const ease = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** A path point on the arc at progress p (0 → at rest, 1 → off the edge), matching the keyframes. */
const arc = (p) => {
  const pts = [[0, 0, 0], [0.45, OUT.x * 0.45, OUT.y * 0.2], [1, OUT.x, OUT.y]];
  for (let i = 1; i < pts.length; i++) {
    const [t0, x0, y0] = pts[i - 1], [t1, x1, y1] = pts[i];
    if (p <= t1) { const f = (p - t0) / (t1 - t0); return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]; }
  }
  return [OUT.x, OUT.y];
};
/** The strip with `cur` lit, its colours from `tint` (the theme whose colours are showing). */
const stripAt = (cur, tint = cur) => `<div style="position: absolute; left: ${CX - 9}px; top: ${STRIP_Y}px; width: 18px; height: 18px">${THEMES.map((T, k) => {
  const rel = (k - cur + 3) % 3;
  return `<span style="position: absolute; left: 0; top: 0; transform: translateX(${slot(k, cur)}px) scale(${rel === 0 ? 1.25 : 0.9}); opacity: ${rel === 0 ? 1 : 0.55}">${icon(T.key, rel === 0 ? THEMES[tint].accent : THEMES[tint].ter)}</span>`;
}).join('')}</div>`;
/** Sun & moon Home at time t (ms) into a change from theme a to theme b, as a static picture. */
function still(a, b, t) {
  const colours = ease(clamp01((t - TIMING.colours[0]) / TIMING.colours[1]));
  // As the app's curves: the setting body speeds up as it goes, the rising one slows as it lands.
  const leave = Math.pow(clamp01((t - TIMING.leave[0]) / TIMING.leave[1]), 1.8);
  const enter = 1 - Math.pow(1 - clamp01((t - TIMING.enter[0]) / TIMING.enter[1]), 2.5);
  const [lx, ly] = arc(leave);
  const [ex, ey] = arc(1 - enter);
  const cur = t >= TIMING.strip[1] / 2 ? b : a;
  return `<div style="position: relative; width: 390px; height: 844px; overflow: hidden">
${home(THEMES[a])}
<div style="position: absolute; inset: 0; opacity: ${colours.toFixed(2)}">${home(THEMES[b])}</div>
${leave < 1 ? bodyBox(BODIES[a], `transform: translate(${lx.toFixed(0)}px, ${ly.toFixed(0)}px); opacity: 1`) : ''}
${enter > 0 ? bodyBox(BODIES[b], `transform: translate(${(-ex).toFixed(0)}px, ${ey.toFixed(0)}px); opacity: 1`) : ''}
${stripAt(cur, colours < 0.5 ? a : b)}
</div>`;
}
/** Classic Home at time t (ms) into a change from theme a to theme b: the colours fade, the mark stays. */
function stillClassic(a, b, t) {
  const colours = ease(clamp01((t - CLASSIC.colours[0]) / CLASSIC.colours[1]));
  const cur = t >= TIMING.strip[1] / 2 ? b : a;
  return `<div style="position: relative; width: 390px; height: 844px; overflow: hidden">
${home(THEMES[a], { hero: 'classic' })}
<div style="position: absolute; inset: 0; opacity: ${colours.toFixed(2)}">${home(THEMES[b], { hero: 'classic' })}</div>
${stripAt(cur, colours < 0.5 ? a : b)}
</div>`;
}
const S = 0.6;
const phone = (inner) => `<div style="width: ${390 * S}px; height: ${844 * S}px; border-radius: 28px; overflow: hidden; box-shadow: 0 0 0 1px rgba(242,236,221,0.10), 0 16px 40px rgba(0,0,0,0.35)"><div style="transform: scale(${S}); transform-origin: 0 0">${inner}</div></div>`;
const topBar = (k, rtl) => `<div style="position: relative; width: 390px; height: 84px; overflow: hidden; border-radius: 18px; box-shadow: 0 0 0 1px rgba(242,236,221,0.10)">${home(THEMES[k], { rtl })}${stripAt(k)}</div>`;
const caption = (n, t, note) => `<div style="display: flex; align-items: baseline; gap: 8px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; color: #6FD6CF">${n}</span><span style="font-size: 15px; font-weight: 600; color: #F2ECDD">${t}</span></div>${note ? `<span style="font-size: 13px; line-height: 1.5; color: #B6BAD6">${note}</span>` : ''}`;
const heading = (eyebrow, title, body) => `<div style="display: flex; flex-direction: column; gap: 6px; max-width: 1100px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: #6FD6CF">${eyebrow}</span><span style="font-family: 'Marcellus', serif; font-size: 32px; color: #F2ECDD">${title}</span>${body ? `<span style="font-size: 15px; line-height: 1.55; color: #B6BAD6">${body}</span>` : ''}</div>`;
const TIMES = [[0, 'Tap'], [900, 'Setting'], [2300, 'Rising, whole, from the left'], [3500, 'Settled']];
const CLASSIC_TIMES = [[0, 'Tap'], [400, 'Fading'], [700, 'Fading'], [1060, 'Settled']];
const row = (times, frame) => `<div style="display: flex; gap: 28px">${times.map(([t, label], i) => `<div style="display: flex; flex-direction: column; gap: 10px; width: ${390 * S}px">${phone(frame(t))}${caption(i + 1, label, `${t} ms`)}</div>`).join('')}</div>`;
const transitionRow = (a, b) => row(TIMES, (t) => still(a, b, t));
const classicRow = (a, b) => row(CLASSIC_TIMES, (t) => stillClassic(a, b, t));

const NOTES = [
  ['Two Home styles, for now', 'Both are in the app while the client decides: More → Appearance → Home, “Sun & moon” or “Classic”. Both have the logo toggle; only Home’s centre differs. When one is chosen, the other and the setting go.'],
  ['The sky doesn’t mirror', 'The sun and moon always travel left → right, setting off the right edge and rising in from the left, in Arabic too. The strip moves the same way: the next theme waits on the left.'],
  ['A true crossfade', 'The whole screen fades from the old colours to the new, tab bar and all: a picture of the screen is laid over it, the colours switch underneath, and the picture fades away over a second. Profile and More’s Appearance choices fade the same way.'],
  ['Timing (Sun & moon)', 'The strip turns at once (400 ms). The body sets over 1.3 s; with the sky empty, the colours fade over 1 s; 0.7 s into that fade, with the old colours nearly gone, the next body comes in whole from beyond the left edge over 1.4 s. About 3.5 s in all; the logo waits till it’s done.'],
  ['The body is the scene’s', 'Sun & moon shows the same sun or moon its scene does (tonight’s real moon at Night), alone, with no ring of dots; tapping it opens the scene with nothing to transform: the body just carries on.'],
  ['Reduce Motion, haptics, access', 'Reduce Motion: the bodies fade in place, no travel. A light haptic tick on each tap. The logo is a button: “Appearance: Night. Double-tap for Sunrise.”'],
];

const W = 64 * 2 + 3 * 390 + 2 * 28;
const story = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Home — appearance, storyboard</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#0B1026;font-family:'Figtree',system-ui,sans-serif;color:#F2ECDD}
${css}
</style>
</helmet>
<div style="width: ${W}px; box-sizing: border-box; padding: 64px; background: #0B1026; display: flex; flex-direction: column; gap: 44px">
<div style="display: flex; flex-direction: column; gap: 12px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: #6FD6CF">HOUNA · HOME</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: #F2ECDD">Home — appearance</h1>
<p style="margin: 0; max-width: 1000px; font-size: 17px; line-height: 1.5; color: #B6BAD6">Changing the theme from Home: tap the logo and it turns to the next, Sunrise → Dusk → Night, a strip of three icons above it turning like a dial. Two Home styles, both in the app while the client decides. In “Sun & moon”, Home’s centre is that theme’s own sun or moon, alone; on a change it sets, whole, past the right edge, the colours fade across the empty sky, and the next comes in whole from beyond the left edge as they settle. In “Classic”, the mark stays in its ring and the colours fade across. The prototype beside this board plays both (switch at the bottom).</p>
</div>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('THE TOGGLE · BOTH STYLES', 'The logo and its strip', 'The current theme’s icon lit in the middle; the next on the left, the last on the right. The logo is the button. English and Arabic top bars: the buttons swap sides, the strip doesn’t.')}
<div style="display: grid; grid-template-columns: repeat(3, 390px); gap: 20px 28px">
${[0, 1, 2].map((k) => `<div style="display: flex; flex-direction: column; gap: 8px">${topBar(k, false)}${caption('EN', THEMES[k].name)}</div>`).join('')}
${[0, 1, 2].map((k) => `<div style="display: flex; flex-direction: column; gap: 8px">${topBar(k, true)}${caption('AR', THEMES[k].name)}</div>`).join('')}
</div>
</section>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('SUN & MOON', 'Each theme’s own sun or moon, alone', 'In place of the mark and its ring: the body alone, the mark pressed into it, breathing as it does in its scene.')}
<div style="display: flex; gap: 28px">${[0, 1, 2].map((k) => `<div style="display: flex; flex-direction: column; gap: 10px; width: ${390 * S}px">${phone(still(k, k, 0))}${caption(k + 1, THEMES[k].name, ['Pale-gold sun, short turning rays.', 'Amber evening sun, a glow, no rays.', 'Tonight’s real teal moon (full tonight).'][k])}</div>`).join('')}</div>
</section>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('SUN & MOON · SUNRISE → DUSK', 'The sun sets; the colours fade; the evening sun rises', 'The sky is empty while the colours fade, so nothing moves under the fading picture; the next body lands just after the new colours have settled.')}
${transitionRow(0, 1)}
</section>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('SUN & MOON · DUSK → NIGHT', 'The evening sun sets; the colours fade; the moon rises')}
${transitionRow(1, 2)}
</section>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('CLASSIC', 'The mark in its ring, with the same toggle', 'Home as before, the logo now the toggle. A change is the crossfade alone: the whole screen fades from the old colours to the new over a second, the mark staying where it is.')}
<div style="display: flex; gap: 28px">${[0, 1, 2].map((k) => `<div style="display: flex; flex-direction: column; gap: 10px; width: ${390 * S}px">${phone(stillClassic(k, k, 0))}${caption(k + 1, THEMES[k].name)}</div>`).join('')}</div>
</section>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('CLASSIC · NIGHT → SUNRISE', 'The colours fade across')}
${classicRow(2, 0)}
</section>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
${NOTES.map(([t, b]) => `<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 18px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.10)"><span style="font-size: 15px; font-weight: 600; color: #F2ECDD">${t}</span><span style="font-size: 13.5px; line-height: 1.55; color: #B6BAD6">${b}</span></div>`).join('')}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${W},"height":4682}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
if (require.main === module) fs.writeFileSync(P + 'HomeAppearanceStory.dc.html', story);
if (require.main === module) console.log('HomeAppearance.dc.html', (prototype.length / 1024).toFixed(0) + 'KB · HomeAppearanceStory.dc.html', (story.length / 1024).toFixed(0) + 'KB · width', W);

// Home's chrome and the three themes' tokens, for other boards (make-profile.js).
module.exports = { THEMES, home };
