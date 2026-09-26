// The "App icon" board: launcher-icon concepts built from the official Houna mark in every
// palette the redesign has (Nightlight, Dusk, Sunrise and the original brand plate), each shown
// in the iOS shape and Android's circle / rounded-square masks, plus a home-screen comparison,
// platform variants (iOS dark & tinted, Android themed), a size ladder and the adaptive-icon guide.
const fs = require('fs');
const APP = __dirname + '/../../../';
const P = __dirname + '/../project/';

const logo = fs.readFileSync(APP + 'constants/logoSvg.ts', 'utf8');
const FIGURE_D = /export const FIGURE_D = '([^']+)'/.exec(logo)[1];
const HEAD_D = /const HEAD_IN_FIGURE_D = '([^']+)'/.exec(logo)[1];
const RING_D = /d="(M50\.18[^"]+)"/.exec(fs.readFileSync(APP + 'components/HounaMark.tsx', 'utf8'))[1];
const WORDMARK = /LOGO_WHITE_XML = `([\s\S]*?)`/.exec(logo)[1]
  .replace(/<svg[^>]*>/, '<svg viewBox="0 0 93.339 44.094" width="100%" aria-hidden="true">')
  .replace(/\sid="[^"]*"/g, '');

/** The Houna mark (HounaMark's paths and transforms). `ring: false` draws the figure alone. */
function mark(size, fill, { ring = true, stroke = 0, style = '' } = {}) {
  const paint = stroke ? `fill="none" stroke="${fill}" stroke-width="${stroke}" stroke-linejoin="round"` : `fill="${fill}"`;
  const vb = ring ? '17 5.4 20.6 20.6' : '19.42 6.4 15.6 15.6';
  return `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="${vb}" style="position: absolute; left: 50%; top: 50%; margin-left: ${-size / 2}px; margin-top: ${-size / 2}px; overflow: visible; ${style}"><g transform="translate(-10.7 -6.6)">${ring ? `<g transform="translate(29.24 13.384)"><path d="${RING_D}" transform="translate(-44 -18.785)" ${paint}></path></g>` : ''}<g transform="translate(31.801 13.392)"><path d="${FIGURE_D}${HEAD_D}" transform="translate(-48.6 -18.8)" ${paint} fill-rule="evenodd"></path></g></g></svg>`;
}

const abs = (s) => `position: absolute; left: 0; top: 0; width: ${s}px; height: ${s}px`;
const center = (d, s) => `position: absolute; left: ${(s - d) / 2}px; top: ${(s - d) / 2}px; width: ${d}px; height: ${d}px; border-radius: 999px`;
/** A light that starts under the mark's ring and fades outward — Home's edge halo. */
const halo = (s, m, rgb, a) => `<span style="${center(m * 1.7, s)}; background: radial-gradient(circle closest-side, rgba(${rgb},0) 52%, rgba(${rgb},${a}) 61%, rgba(${rgb},0) 100%)"></span>`;

let seed = 11;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const STARS = Array.from({ length: 26 }, () => ({ x: rand(), y: rand(), r: rand() < 0.8 ? 0.6 + rand() * 0.5 : 1.2 + rand() * 0.5, o: 0.3 + rand() * 0.6 }));

/* ── The concepts ── */
// Each: key, name, palette note, tag, and draw(s) → inner HTML for an icon s px square.
const CONCEPTS = [
  { k: 'A', name: 'Turquoise', note: 'Turquoise #3BAAA7 · white mark', tag: 'Ships today',
    draw: (s) => `<span style="${abs(s)}; background: #3BAAA7"></span>${mark(s * 0.64, '#FFFFFF')}` },
  { k: 'B', name: 'Dark Turquoise', note: 'Dark Turquoise #196662 · white', tag: 'The brand plate',
    draw: (s) => `<span style="${abs(s)}; background: #196662"></span>${mark(s * 0.64, '#FFFFFF')}` },
  { k: 'C', name: 'Turquoise depth', note: 'Turquoise → Dark Turquoise', tag: '',
    draw: (s) => `<span style="${abs(s)}; background: radial-gradient(circle at 30% 22%, #5CC2BE 0%, #3BAAA7 42%, #196662 100%)"></span>${mark(s * 0.64, '#FFFFFF', { style: `filter: drop-shadow(0 ${s * 0.02}px ${s * 0.04}px rgba(11,16,38,0.25))` })}` },
  { k: 'D', name: 'Midnight glow', note: 'Midnight #0B1026 · Houna glow #6FD6CF', tag: 'Suggested · Night',
    draw: (s) => `<span style="${abs(s)}; background: radial-gradient(circle at 50% 50%, #16224A 0%, #0B1026 70%)"></span>${halo(s, s * 0.56, '111,214,207', 0.55)}${mark(s * 0.56, '#6FD6CF')}` },
  { k: 'E', name: 'Starfield', note: 'Midnight sky · stars · glow', tag: 'Night',
    draw: (s) => `<span style="${abs(s)}; background: linear-gradient(180deg, #0B1026 0%, #121A3E 100%)"></span>${STARS.map((t) => `<span style="position: absolute; left: ${(t.x * s).toFixed(1)}px; top: ${(t.y * s).toFixed(1)}px; width: ${(t.r * s / 90).toFixed(2)}px; height: ${(t.r * s / 90).toFixed(2)}px; border-radius: 999px; background: rgba(242,236,221,${t.o.toFixed(2)})"></span>`).join('')}<span style="position: absolute; left: ${s * 0.62}px; top: ${s * 0.16}px; width: ${s * 0.26}px; height: ${Math.max(1, s / 110)}px; border-radius: 999px; transform: rotate(-24deg); background: linear-gradient(90deg, rgba(242,236,221,0.9), rgba(242,236,221,0))"></span>${halo(s, s * 0.5, '111,214,207', 0.5)}${mark(s * 0.5, '#6FD6CF')}` },
  { k: 'F', name: 'Dot ring', note: 'Home’s centrepiece: mark + 28 dots', tag: 'Night',
    draw: (s) => {
      const N = 28, R = s * 0.36, C = s / 2;
      const dots = Array.from({ length: N }, (_, i) => {
        const t = i / N, a = t * Math.PI * 2 - Math.PI / 2, d = (s / 190) * (2.5 + 4 * Math.sin(t * Math.PI)) * 1.6;
        return `<span style="position: absolute; left: ${(C + R * Math.cos(a) - d / 2).toFixed(1)}px; top: ${(C + R * Math.sin(a) - d / 2).toFixed(1)}px; width: ${d.toFixed(1)}px; height: ${d.toFixed(1)}px; border-radius: 999px; background: ${i < N / 2 ? '#6FD6CF' : '#B3A7F5'}; opacity: ${(0.22 + 0.78 * Math.sin(t * Math.PI)).toFixed(2)}"></span>`;
      }).join('');
      return `<span style="${abs(s)}; background: #0B1026"></span>${dots}${halo(s, s * 0.42, '111,214,207', 0.45)}${mark(s * 0.42, '#6FD6CF')}`;
    } },
  { k: 'G', name: 'Glass orb', note: 'The breathing orb, mark pressed in', tag: 'Tanafas',
    draw: (s) => {
      const o = s * 0.72;
      return `<span style="${abs(s)}; background: #0B1026"></span><span style="${center(o, s)}; background: radial-gradient(circle at 34% 30%, rgba(255,255,255,0.76) 0%, rgba(197,239,236,0.52) 40%, rgba(111,214,207,0.43) 100%); box-shadow: 0 0 ${s * 0.22}px rgba(111,214,207,0.38)"></span>${mark(o * 0.4, 'rgba(11,16,38,0.35)', { style: `margin-top: ${-o * 0.2 - s * 0.006}px` })}${mark(o * 0.4, 'rgba(255,255,255,0.55)', { style: `margin-top: ${-o * 0.2 + s * 0.008}px` })}${mark(o * 0.4, 'rgba(86,164,165,0.7)')}`;
    } },
  { k: 'H', name: 'Outline', note: 'Line-art mark, like the app’s icons', tag: '',
    draw: (s) => `<span style="${abs(s)}; background: #0B1026"></span>${mark(s * 0.6, '#6FD6CF', { stroke: 0.32 })}` },
  { k: 'I', name: 'Moonlight', note: 'Moonlight #F2ECDD · Midnight mark', tag: '',
    draw: (s) => `<span style="${abs(s)}; background: #F2ECDD"></span>${mark(s * 0.62, '#0B1026')}` },
  { k: 'J', name: 'Dusk', note: 'Daybreak #F5F1E8 · Turquoise', tag: 'Dusk',
    draw: (s) => `<span style="${abs(s)}; background: #F5F1E8"></span>${halo(s, s * 0.6, '111,214,207', 0.35)}${mark(s * 0.6, '#3BAAA7')}` },
  { k: 'K', name: 'Sunrise', note: 'Mist #F2F6F4 · peach sun · Dark Turquoise', tag: 'Sunrise',
    draw: (s) => `<span style="${abs(s)}; background: radial-gradient(90% 60% at 50% 105%, rgba(249,169,128,0.75) 0%, rgba(249,169,128,0) 70%), linear-gradient(180deg, #F2F6F4 0%, #FFF1EA 100%)"></span>${mark(s * 0.6, '#196662')}` },
  { k: 'L', name: 'Dawn sky', note: 'Dark Turquoise → Turquoise → Peach', tag: 'Sunrise',
    draw: (s) => `<span style="${abs(s)}; background: linear-gradient(170deg, #196662 0%, #3BAAA7 48%, #F9A980 100%)"></span>${mark(s * 0.62, '#FFFFFF')}` },
  { k: 'M', name: 'Paper', note: 'White · Turquoise mark', tag: 'Classic',
    draw: (s) => `<span style="${abs(s)}; background: #FFFFFF"></span>${mark(s * 0.62, '#3BAAA7')}` },
  { k: 'N', name: 'Nightlight duo', note: 'Houna glow → Dusk lavender', tag: '',
    draw: (s) => `<span style="${abs(s)}; background: linear-gradient(145deg, #6FD6CF 0%, #8FB8E6 50%, #B3A7F5 100%)"></span>${mark(s * 0.62, '#FFFFFF')}` },
  { k: 'O', name: 'Figure', note: 'The figure alone, larger', tag: '',
    draw: (s) => `<span style="${abs(s)}; background: #196662"></span>${mark(s * 0.62, '#FFFFFF', { ring: false })}` },
  { k: 'P', name: 'Wordmark', note: 'houna · هنا on the brand plate', tag: 'Not at small sizes',
    draw: (s) => `<span style="${abs(s)}; background: #196662"></span><span style="position: absolute; left: ${s * 0.14}px; top: ${s * 0.3}px; width: ${s * 0.72}px">${WORDMARK}</span>` },
];
const byKey = Object.fromEntries(CONCEPTS.map((c) => [c.k, c]));

/** An icon in a platform shape: ios (squircle), circle, rsq (Android rounded square), sq. */
function icon(c, s, shape = 'ios', extra = '') {
  const radius = shape === 'circle' ? '999px' : shape === 'rsq' ? `${s * 0.28}px` : shape === 'sq' ? '0' : `${s * 0.2237}px`;
  const shadow = shape === 'ios' && s >= 120 ? `box-shadow: 0 ${s * 0.04}px ${s * 0.12}px rgba(0,0,0,0.35);` : '';
  return `<div role="img" aria-label="${c.name} app icon" style="position: relative; flex-shrink: 0; width: ${s}px; height: ${s}px; border-radius: ${radius}; overflow: hidden; ${shadow} ${extra}">${c.draw(s)}</div>`;
}

/* ── Board ── */
const T = { ground: '#0B1026', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5', card: 'rgba(242,236,221,0.045)', border: 'rgba(242,236,221,0.10)', accent: '#6FD6CF' };
const label = (t, c = T.ter) => `<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${c}">${t}</span>`;
const section = (eyebrow, title, desc, body) => `<section style="display: flex; flex-direction: column; gap: 24px; padding: 28px; border-radius: 24px; background: ${T.card}; border: 1px solid ${T.border}">
<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 24px">
<div style="display: flex; flex-direction: column; gap: 6px">${label(eyebrow, T.accent)}<h2 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 28px; line-height: 1.15; color: ${T.text}">${title}</h2></div>
<p style="margin: 0; max-width: 480px; font-size: 14px; line-height: 1.5; text-align: end; color: ${T.sec}">${desc}</p>
</div>
${body}
</section>`;

const conceptCard = (c) => `<div style="display: flex; flex-direction: column; gap: 16px; padding: 20px; border-radius: 20px; background: rgba(242,236,221,0.03); border: 1px solid ${T.border}">
<div style="display: flex; align-items: flex-end; gap: 14px">
${icon(c, 132, 'ios')}
<div style="display: flex; flex-direction: column; gap: 10px">${icon(c, 56, 'circle')}${icon(c, 56, 'rsq')}</div>
</div>
<div style="display: flex; flex-direction: column; gap: 4px">
<div style="display: flex; align-items: center; gap: 8px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; color: ${T.accent}">${c.k}</span><span style="font-size: 16px; font-weight: 600; color: ${T.text}">${c.name}</span></div>
<span style="font-size: 12.5px; line-height: 1.4; color: ${T.sec}">${c.note}</span>
${c.tag ? `<span style="align-self: flex-start; margin-top: 4px; padding: 3px 10px; border-radius: 999px; background: rgba(111,214,207,0.10); border: 1px solid rgba(111,214,207,0.28); font-family: 'DM Mono', monospace; font-size: 10.5px; letter-spacing: 0.1em; color: ${T.accent}">${c.tag.toUpperCase()}</span>` : ''}
</div>
</div>`;

const homeScreen = (wallpaper, textColor, name) => `<div style="flex: 1; display: flex; flex-direction: column; gap: 12px">
${label(name)}
<div style="display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 22px 12px; padding: 28px 24px; border-radius: 28px; background: ${wallpaper}">
${CONCEPTS.map((c) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 6px">${icon(c, 58, 'ios')}<span style="font-size: 11px; color: ${textColor}">${c.k} · Houna</span></div>`).join('\n')}
</div>
</div>`;

/* Platform variants for the suggested icon (D) and today's (A). */
const variant = (title, inner, note) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">${inner}<span style="font-size: 13px; font-weight: 600; color: ${T.text}">${title}</span><span style="max-width: 150px; font-size: 11.5px; line-height: 1.35; color: ${T.ter}">${note}</span></div>`;
const plain = (s, bg, fill, r = 0.2237, extra = '') => `<div style="position: relative; width: ${s}px; height: ${s}px; border-radius: ${r === 0.5 ? '999px' : s * r + 'px'}; overflow: hidden; background: ${bg}">${extra}${mark(s * 0.6, fill)}</div>`;
const variants = (c) => `<div style="display: flex; flex-direction: column; gap: 16px">
${label(`${c.k} · ${c.name.toUpperCase()}`)}
<div style="display: flex; gap: 28px; flex-wrap: wrap">
${variant('iOS default', icon(c, 104, 'ios'), 'Light home screen')}
${variant('iOS dark', plain(104, '#000000', c.k === 'D' ? '#6FD6CF' : '#3BAAA7', 0.2237, halo(104, 62, '111,214,207', 0.35)), 'Mark on black, lit')}
${variant('iOS tinted', plain(104, '#1C1C1E', '#D8D8DA'), 'Greyscale mark; iOS tints it')}
${variant('Android themed · light', plain(104, '#D5E8E5', '#1B4F4B', 0.5), 'Monochrome mark, wallpaper colours')}
${variant('Android themed · dark', plain(104, '#1E302E', '#A9DCD7', 0.5), 'Same mark, dark wallpaper')}
</div>
</div>`;

const ladder = (c) => `<div style="display: flex; align-items: flex-end; gap: 24px; flex-wrap: wrap">
${[180, 120, 87, 60, 40, 29].map((s) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px">${icon(c, s, 'ios')}<span style="font-family: 'DM Mono', monospace; font-size: 11px; color: ${T.ter}">${s}</span></div>`).join('\n')}
</div>`;

/* Android adaptive icon: 108dp layers, 72dp visible, 66dp safe circle — CLAUDE.md's ~46% mark. */
const adaptive = () => {
  const S = 216, v = S * (72 / 108), safe = S * (66 / 108);
  return `<div style="display: flex; gap: 40px; align-items: center">
<div style="position: relative; width: ${S}px; height: ${S}px; background: #3BAAA7">
${mark(S * 0.46, '#FFFFFF')}
<span style="position: absolute; left: ${(S - v) / 2}px; top: ${(S - v) / 2}px; width: ${v}px; height: ${v}px; box-sizing: border-box; border: 1.5px dashed rgba(255,255,255,0.8)"></span>
<span style="${center(safe, S)}; box-sizing: border-box; border: 1.5px dashed #F9A980"></span>
</div>
<div style="display: flex; flex-direction: column; gap: 10px; max-width: 520px">
<span style="font-size: 15px; line-height: 1.55; color: ${T.sec}"><b style="color: ${T.text}; font-weight: 600">The whole square</b> is Android’s 108dp foreground and background layers. <b style="color: ${T.text}; font-weight: 600">White dashes</b>: the 72dp a launcher can show. <b style="color: #F9A980; font-weight: 600">Peach circle</b>: the 66dp safe zone that survives every mask.</span>
<span style="font-size: 15px; line-height: 1.55; color: ${T.sec}">The mark sits at about 46% of the layer’s width, inside the safe zone, as <code>assets/images/adaptive-icon.png</code> does today. Glows and stars belong on the background layer; the mark alone goes in the foreground, and its white mark is the monochrome layer for themed icons.</span>
</div>
</div>`;
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>App icon</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
code{font-family:'DM Mono',monospace;font-size:0.9em}
</style>
</helmet>
<div style="width: 1280px; box-sizing: border-box; padding: 64px; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif; color: ${T.text}; display: flex; flex-direction: column; gap: 32px">

<div style="display: flex; flex-direction: column; gap: 12px">
${label('HOUNA · APP ICON', T.accent)}
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${T.text}">App icon</h1>
<p style="margin: 0; max-width: 760px; font-size: 17px; line-height: 1.5; color: ${T.sec}">Every launcher icon we could ship, all built from the official mark with its paths untouched: the brand plate, the three themes, and the app’s own motifs (the glow, the dot ring, the starfield, the glass orb). Each is shown in the iOS shape and in Android’s circle and rounded-square masks.</p>
</div>

${section('CONCEPTS', `${CONCEPTS.length} options`, 'Large: iOS. Small: Android circle and rounded square, the two most common launcher masks.', `<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">\n${CONCEPTS.map(conceptCard).join('\n')}\n</div>`)}

${section('IN CONTEXT', 'On a home screen', 'At real size (60pt) among the neighbours: what still reads, and what turns to mush.', `<div style="display: flex; flex-direction: column; gap: 20px">
${homeScreen('linear-gradient(160deg, #1B2A5A 0%, #0B1026 60%, #2A1E3E 100%)', 'rgba(255,255,255,0.85)', 'DARK WALLPAPER')}
${homeScreen('linear-gradient(160deg, #E7EFEC 0%, #F6EFE6 60%, #F3E3DA 100%)', 'rgba(29,43,42,0.85)', 'LIGHT WALLPAPER')}
</div>`)}

${section('PLATFORM VARIANTS', 'Dark, tinted and themed', 'iOS 18 asks for dark and tinted versions; Android 13+ themes a monochrome layer in the wallpaper’s colours. The mark carries all of them on its own.', `<div style="display: flex; flex-direction: column; gap: 28px">\n${variants(byKey.D)}\n${variants(byKey.A)}\n</div>`)}

${section('SIZES', 'Down to settings size', 'The same icon at the sizes iOS draws it (pt): the mark alone stays legible to 29, which is why the wordmark can’t be the icon.', `<div style="display: flex; flex-direction: column; gap: 24px">\n${ladder(byKey.D)}\n${ladder(byKey.A)}\n${ladder(byKey.P)}\n</div>`)}

${section('ANDROID', 'Adaptive icon guide', 'How any of these becomes Android’s layered icon.', adaptive())}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1280,"height":4128}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
module.exports = { CONCEPTS, byKey, icon, mark, halo, WORDMARK };
if (require.main === module) {
fs.writeFileSync(P + 'AppIcon.dc.html', html);
console.log('AppIcon.dc.html', (html.length / 1024).toFixed(0) + 'KB', CONCEPTS.length, 'concepts');
}
