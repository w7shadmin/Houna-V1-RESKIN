// "Meditate — cover flow": the Meditate tab without the orb. Each scene is a still, cut round,
// three at a time on a shelf like the iPod's Cover Flow: the chosen one large and facing you in the
// middle, its neighbours smaller and turned in towards it, the fourth waiting behind. Tapping a side
// cover (or swiping) turns the shelf: the covers slide, turn and grow into their new places.
// Writes an interactive prototype (Night) and a storyboard (the three themes, the motion, Arabic).
const fs = require('fs');
const P = __dirname + '/../project/';

/* ── The stills, cut square round each scene's focus and stored on the canvas ── */
const COVERS = {
  fire: '/_blob/da398a6acddccbc5d72b21549078a84e',
  rain: '/_blob/e49a2f319bce8a08c426a93a9db560ba',
  forest: '/_blob/0223deffdbc13f9c284d8c4bb23f4776',
};
const SCENES = [
  { id: 'fire', name: 'Fire', ar: 'نار', arDesc: 'توهّج دافئ ومتطاير', desc: 'A crackling, warm glow', hi: '#FFE9CF', c: '#F0A868', lo: '#9A4F22', glow: '240,168,104' },
  { id: 'rain', name: 'Rain', ar: 'مطر', arDesc: 'هطول مطر ثابت يهدئ الذهن', desc: 'Steady rainfall to settle the mind', hi: '#E4EDFF', c: '#7FA2EC', lo: '#33509E', glow: '127,162,236' },
  { id: 'forest', name: 'Creek', ar: 'جدول', arDesc: 'جدول جبلي يتدفق بين الصخور', desc: 'A mountain stream flowing over stones', hi: '#DDFAF5', c: '#63CFC7', lo: '#1F7A74', glow: '99,207,199' },
  { id: 'ocean', name: 'Ocean', ar: 'محيط', arDesc: 'أمواج بطيئة ومتدحرجة', desc: 'Slow, rolling waves', hi: '#E6E8FF', c: '#8F9BF0', lo: '#39439E', glow: '143,155,240' },
];

/* ── Theme tokens (the Tanafas boards') ── */
const THEMES = {
  night: {
    name: 'Night', ground: '#0B1026', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5',
    ctrlBg: 'rgba(242,236,221,0.06)', ctrlBorder: 'rgba(242,236,221,0.12)', tileBg: 'rgba(242,236,221,0.05)', tileBorder: 'rgba(242,236,221,0.10)',
    action: '#F2ECDD', onAction: '#0B1026', tab: '#6FD6CF', ring: 'rgba(242,236,221,0.22)', shelf: 'rgba(242,236,221,0.10)', reflect: 0.22,
  },
  dusk: {
    name: 'Dusk', ground: '#F5F1E8', text: '#1B2140', sec: '#4A5078', ter: '#646A8E',
    ctrlBg: '#FFFFFF', ctrlBorder: 'rgba(27,33,64,0.12)', tileBg: '#FFFFFF', tileBorder: 'rgba(27,33,64,0.10)',
    action: '#1B2140', onAction: '#F5F1E8', tab: '#237873', ring: 'rgba(27,33,64,0.16)', shelf: 'rgba(27,33,64,0.08)', reflect: 0.16,
  },
  sunrise: {
    name: 'Sunrise', ground: '#F2F6F4', text: '#1D2B2A', sec: '#58595B', ter: '#6D6F72',
    ctrlBg: '#FFFFFF', ctrlBorder: 'rgba(29,43,42,0.12)', tileBg: '#FFFFFF', tileBorder: 'rgba(29,43,42,0.10)',
    action: '#196662', onAction: '#FFFFFF', tab: '#196662', ring: 'rgba(29,43,42,0.16)', shelf: 'rgba(29,43,42,0.08)', reflect: 0.16,
  },
};

/* ── The shelf ── */
const D = 150; // a cover's diameter, facing you in the middle (the orb was 176)
const SIDE = { x: 116, scale: 0.62, turn: 52, opacity: 0.7 }; // the neighbours: smaller, turned in towards the middle
const STAGE_H = 264;
const CY = 118; // the covers' centre line in the stage
/** Where a cover sits for its place relative to the chosen one: -1 before, 0 chosen, 1 after, 2 waiting behind. */
const SLOT = {
  '-1': { x: -SIDE.x, s: SIDE.scale, r: SIDE.turn, o: SIDE.opacity, z: 2 },
  0: { x: 0, s: 1, r: 0, o: 1, z: 3 },
  1: { x: SIDE.x, s: SIDE.scale, r: -SIDE.turn, o: SIDE.opacity, z: 2 },
  2: { x: 0, s: 0.4, r: 0, o: 0, z: 1 },
};
const relOf = (k, cur) => { const r = (k - cur + 4) % 4; return r === 3 ? -1 : r; };
const MOVE = 'transform 560ms cubic-bezier(0.22,1,0.36,1), opacity 560ms cubic-bezier(0.22,1,0.36,1), box-shadow 560ms ease';
const coverFace = (sc) => COVERS[sc.id]
  ? `<img src="${COVERS[sc.id]}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 999px">`
  : `<span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 38% 32%, ${sc.hi} 0, ${sc.c} 48%, ${sc.lo} 100%)"></span>`;
/** A cover's transform from its slot (dir -1 in Arabic: the next scene waits on the left). */
const tf = (sl, dir = 1) => `translateX(${(sl.x * dir).toFixed(1)}px) rotateY(${(sl.r * dir).toFixed(1)}deg) scale(${sl.s.toFixed(3)})`;

/** One cover, placed by `style` (holes in the prototype, literal in the storyboard). */
const cover = (sc, style, extra = '', tag = 'div') => `<${tag} style="position: absolute; padding: 0; border: 0; background: none; left: ${195 - D / 2}px; top: ${CY - D / 2}px; width: ${D}px; height: ${D}px; border-radius: 999px; ${style}; -webkit-box-reflect: below 10px linear-gradient(transparent 58%, rgba(255,255,255,{{reflect}}))" ${extra}>
${coverFace(sc)}
<span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 38% 30%, rgba(255,255,255,0.18) 0, rgba(255,255,255,0) 46%), radial-gradient(circle, rgba(0,0,0,0) 62%, rgba(${sc.glow},0.35) 100%)"></span>
</${tag}>`;

/* ── The screen around it ── */
const icon = {
  close: '<path d="M6 6l12 12M18 6 6 18"></path>',
  journal: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"></path><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"></path><path d="M9 7.5h6"></path>',
};
const roundBtn = (T, label, path) => `<span aria-label="${label}" style="flex-shrink: 0; width: 44px; height: 44px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.ctrlBg}; border: 1px solid ${T.ctrlBorder}; color: ${T.text}"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></span>`;
const tileStyle = (T) => `display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 14px 16px; border-radius: 18px; background: ${T.tileBg}; border: 1px solid ${T.tileBorder}; color: ${T.text}; text-align: start`;
const tileLabel = (T, text) => `<span style="font-family: 'DM Mono', monospace; font-size: 10.5px; letter-spacing: 0.14em; color: ${T.ter}">${text}</span>`;

/**
 * The Meditate tab. `v` holds either holes (the prototype) or literal values (the storyboard):
 * covers[k] = { tf, o, z, shadow }, and the chosen scene's text, glow and pager.
 */
function screen(T, v, { rtl = false } = {}) {
  const t = (en, ar) => (rtl ? ar : en);
  return `<div dir="${rtl ? 'rtl' : 'ltr'}" style="position: relative; width: 390px; height: 844px; overflow: hidden; box-sizing: border-box; background: ${T.ground}; font-family: ${rtl ? "'IBM Plex Sans Arabic', " : ''}'Figtree', system-ui, sans-serif; color: ${T.text}; display: flex; flex-direction: column; padding: 20px 20px 40px">
<span aria-hidden="true" style="position: absolute; inset: 0; background: radial-gradient(70% 30% at 50% 24%, rgba(${v.glow},${T.name === 'Night' ? 0.26 : 0.2}), rgba(0,0,0,0) 72%); transition: background 560ms ease"></span>

<div style="position: relative; display: flex; align-items: center; justify-content: space-between; gap: 8px">
${roundBtn(T, t('Close Tanafas', 'إغلاق تنفّس'), icon.close)}
<div role="tablist" style="display: flex; gap: 16px">
<span role="tab" aria-selected="false" style="height: 44px; display: flex; align-items: center; padding: 0 2px; color: ${T.ter}; font-size: 15px; font-weight: 600">${t('Breathe', 'تنفّس')}</span>
<span role="tab" aria-selected="true" style="height: 44px; display: flex; align-items: center; padding: 0 2px; box-sizing: border-box; border-bottom: 2px solid ${T.tab}; color: ${T.text}; font-size: 15px; font-weight: 600">${t('Meditate', 'تأمّل')}</span>
<span role="tab" aria-selected="false" style="height: 44px; display: flex; align-items: center; padding: 0 2px; color: ${T.ter}; font-size: 15px; font-weight: 600">${t('Discover', 'اكتشف')}</span>
</div>
${roundBtn(T, t('Journal', 'اليوميات'), icon.journal)}
</div>

<div style="position: relative; flex-grow: 1; display: flex; flex-direction: column; min-height: 0">
<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px">

<div style="position: relative; width: 390px; height: ${STAGE_H}px; margin: 0 -20px; perspective: 760px">
<span aria-hidden="true" style="position: absolute; left: ${195 - D / 2 - 7}px; top: ${CY - D / 2 - 7}px; width: ${D + 14}px; height: ${D + 14}px; box-sizing: border-box; border-radius: 999px; border: 1px solid ${T.ring}"></span>
<span aria-hidden="true" style="position: absolute; left: 40px; right: 40px; top: ${CY + D / 2 + 9}px; height: 1px; background: linear-gradient(90deg, rgba(0,0,0,0), ${T.shelf}, rgba(0,0,0,0))"></span>
${v.coversHtml}
</div>

<div style="display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; min-height: 92px">
<span style="font-family: ${rtl ? "'Amiri', serif" : "'Marcellus', serif"}; font-size: ${rtl ? 30 : 27}px; line-height: 1.12; color: ${T.text}; ${v.textAnim}">${v.name}</span>
<span style="padding: 4px 12px; border-radius: 999px; background: rgba(${v.glow},0.14); border: 1px solid rgba(${v.glow},0.4); font-family: ${rtl ? "'IBM Plex Sans Arabic', sans-serif; font-size: 12px" : "'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em"}; color: ${T.text}">${t('AMBIENT SCENE', 'مشهد هادئ')}</span>
</div>
<p style="margin: 0; font-size: 14.5px; line-height: 1.5; text-align: center; color: ${T.sec}; max-width: 310px; min-height: 22px; ${v.textAnim}">${v.desc}</p>
<div aria-hidden="true" style="display: flex; gap: 6px">${v.pagerHtml}</div>
</div>

<div style="display: flex; flex-direction: column; gap: 16px">
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">
<div style="${tileStyle(T)}">${tileLabel(T, t('DURATION', 'المدة'))}<div style="display: flex; align-items: baseline; gap: 12px; font-size: 16px"><span style="color: ${T.ter}">5</span><span style="font-weight: 600; border-bottom: 2px solid rgb(${v.glow}); padding-bottom: 2px">10</span><span style="color: ${T.ter}">20</span><span style="color: ${T.ter}">∞</span><span style="color: ${T.ter}">${t('min', 'دقيقة')}</span></div></div>
<div style="${tileStyle(T)}">${tileLabel(T, t('VIDEO', 'الفيديو'))}<span style="font-size: 16px; font-weight: 500">${v.video}</span></div>
</div>
<div style="display: flex; justify-content: center">
<span aria-label="${t('Begin', 'ابدأ')}" style="width: 80px; height: 80px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.action}; color: ${T.onAction}; box-shadow: 0 0 36px rgba(${v.glow},0.4)"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"></path></svg></span>
</div>
</div>
</div>
</div>`;
}

/** Literal values for a still: `cur` chosen, and the shelf `p` of the way (0–1, eased) from `from`. */
function still(T, cur, { from = cur, p = 1, rtl = false } = {}) {
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const e = ease(p);
  const dir = rtl ? -1 : 1;
  const coversHtml = SCENES.map((sc, k) => {
    const a = SLOT[relOf(k, from)], b = SLOT[relOf(k, cur)];
    const mix = (x, y) => x + (y - x) * e;
    const sl = { x: mix(a.x, b.x), s: mix(a.s, b.s), r: mix(a.r, b.r), o: mix(a.o, b.o) };
    const z = e < 0.5 ? a.z : b.z;
    const chosen = relOf(k, cur) === 0;
    return { z, html: cover(sc, `transform: ${tf(sl, dir)}; opacity: ${sl.o.toFixed(2)}; z-index: ${z}; box-shadow: 0 0 ${chosen ? Math.round(56 * e) : 0}px rgba(${sc.glow},0.5)`).replace('{{reflect}}', T.reflect) };
  }).sort((x, y) => x.z - y.z).map((c) => c.html).join('\n');
  const shown = e < 0.5 ? from : cur;
  const sc = SCENES[shown];
  const pagerHtml = SCENES.map((_, k) => `<span style="width: ${k === shown ? 22 : 6}px; height: 6px; border-radius: 999px; background: ${k === shown ? T.text : T.ter}; opacity: ${k === shown ? 1 : 0.45}"></span>`).join('');
  return screen(T, {
    coversHtml, pagerHtml, glow: sc.glow, name: rtl ? sc.ar : sc.name, desc: rtl ? sc.arDesc : sc.desc,
    textAnim: `opacity: ${p < 1 ? Math.abs(1 - 2 * e).toFixed(2) : 1}`, video: COVERS[sc.id] ? (rtl ? 'تشغيل' : 'On') : rtl ? 'إيقاف' : 'Off',
  }, { rtl });
}

/* ── Board A: the prototype ── */
const T = THEMES.night;
const protoCovers = SCENES.map((sc, k) =>
  cover(sc, `transform: {{c${k}tf}}; opacity: {{c${k}o}}; z-index: {{c${k}z}}; box-shadow: {{c${k}shadow}}; transition: ${MOVE}; cursor: {{c${k}cursor}}`,
    `type="button" aria-label="{{c${k}label}}" onClick="{{c${k}pick}}"`, 'button')).join('\n');
const protoPager = SCENES.map((_, k) => `<span style="width: {{pw${k}}}px; height: 6px; border-radius: 999px; background: {{pc${k}}}; opacity: {{po${k}}}; transition: width 400ms ease"></span>`).join('');
const fonts = `<link href="https://fonts.googleapis.com/css2?family=Amiri&amp;family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=IBM+Plex+Sans+Arabic:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">`;
const prototype = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Meditate — cover flow</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
${fonts}
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
@keyframes textA{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes textB{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){*{transition-duration:0.01s!important;animation-duration:0.01s!important}}
</style>
</helmet>
${screen(T, { coversHtml: protoCovers, pagerHtml: protoPager, glow: '{{glow}}', name: '{{name}}', desc: '{{desc}}', textAnim: 'animation: {{textAnim}}', video: '{{video}}' })}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
const SCENES = ${JSON.stringify(SCENES.map((s) => ({ name: s.name, desc: s.desc, glow: s.glow, video: !!COVERS[s.id] })))};
const SLOT = ${JSON.stringify(SLOT)};
function relOf(k, cur) { var r = (k - cur + 4) % 4; return r === 3 ? -1 : r; }
function tf(sl) { return 'translateX(' + sl.x + 'px) rotateY(' + sl.r + 'deg) scale(' + sl.s + ')'; }
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { cur: 0, n: 0 };
  }
  renderVals() {
    const { cur, n } = this.state;
    const go = (k) => () => { if (k !== cur) this.setState({ cur: k, n: n + 1 }); };
    const vals = { reflect: ${T.reflect} };
    SCENES.forEach((sc, k) => {
      const rel = relOf(k, cur), sl = SLOT[rel];
      const c = 'c' + k;
      vals[c + 'tf'] = tf(sl); vals[c + 'o'] = sl.o; vals[c + 'z'] = sl.z;
      vals[c + 'shadow'] = rel === 0 ? '0 0 56px rgba(' + sc.glow + ',0.5)' : '0 0 0 rgba(0,0,0,0)';
      vals[c + 'cursor'] = rel === 0 ? 'default' : 'pointer';
      vals[c + 'label'] = rel === 0 ? sc.name + ', chosen' : rel === 2 ? sc.name : sc.name + (rel < 0 ? ', previous' : ', next');
      vals[c + 'pick'] = go(k);
      vals['pw' + k] = k === cur ? 22 : 6; vals['pc' + k] = k === cur ? '${T.text}' : '${T.ter}'; vals['po' + k] = k === cur ? 1 : 0.45;
    });
    const sc = SCENES[cur];
    return Object.assign(vals, {
      glow: sc.glow, name: sc.name, desc: sc.desc, video: sc.video ? 'On' : 'Off',
      textAnim: n ? (n % 2 ? 'textA' : 'textB') + ' 420ms ease 140ms both' : 'none'
    });
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'MeditateFlow.dc.html', prototype);

/* ── Board B: the storyboard ── */
const S = 0.6;
const phone = (inner) => `<div style="width: ${390 * S}px; height: ${844 * S}px; border-radius: 28px; overflow: hidden; box-shadow: 0 0 0 1px rgba(242,236,221,0.10), 0 16px 40px rgba(0,0,0,0.35)"><div style="transform: scale(${S}); transform-origin: 0 0">${inner}</div></div>`;
const caption = (n, t, note) => `<div style="display: flex; align-items: baseline; gap: 8px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; color: #6FD6CF">${n}</span><span style="font-size: 15px; font-weight: 600; color: #F2ECDD">${t}</span></div>${note ? `<span style="font-size: 13px; line-height: 1.5; color: #B6BAD6">${note}</span>` : ''}`;
const heading = (eyebrow, title, body) => `<div style="display: flex; flex-direction: column; gap: 6px; max-width: 1100px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: #6FD6CF">${eyebrow}</span><span style="font-family: 'Marcellus', serif; font-size: 32px; color: #F2ECDD">${title}</span>${body ? `<span style="font-size: 15px; line-height: 1.55; color: #B6BAD6">${body}</span>` : ''}</div>`;
const frame = (inner, n, t, note) => `<div style="display: flex; flex-direction: column; gap: 10px; width: ${390 * S}px">${phone(inner)}${caption(n, t, note)}</div>`;
const row = (items) => `<div style="display: flex; gap: 28px">${items.join('')}</div>`;

const NOTES = [
  ['Three at a time', 'The chosen scene large and facing you; its neighbours smaller and turned in towards it; the fourth waits behind the chosen one and slides out as the shelf turns. The covers are 150px (the orb was 176), the neighbours at 62%.'],
  ['Stills, not footage', 'Each cover is the scene’s still (scenes.ts thumbnail), cut round at its focus. Nothing plays on the hub, so it’s lighter and quieter; the footage is saved for the full-screen player. Ocean has no footage yet: its cover is its colour until it does.'],
  ['The motion', 'Tap a side cover, or swipe, and the shelf turns: each cover slides, turns and grows or shrinks into its new place in one move (0.56 s, easing out), the chosen one’s glow and the screen’s light change to its colour, and the name and line fade over. The shelf wraps round: after Ocean comes Fire.'],
  ['Arabic', 'The shelf follows the reading direction: the next scene waits on the left, and swiping right brings it in. The covers turn the other way to match.'],
  ['Reflections', 'Each cover stands on a faint shelf line with a soft reflection beneath, as Cover Flow’s did: a flipped copy fading into the ground (in the app, the still flipped under a gradient of the ground colour).'],
  ['Access', 'The chosen cover is a picture; the side ones are buttons (“Rain, next”). Swiping is never the only way: the side covers and the dots both work. Reduce Motion: the covers move without turning, and the text swaps without fading.'],
];

const W = 64 * 2 + 4 * 234 + 3 * 28;
const story = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Meditate — cover flow, storyboard</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
${fonts}
<style>
body{margin:0;background:#0B1026;font-family:'Figtree',system-ui,sans-serif;color:#F2ECDD}
</style>
</helmet>
<div style="width: ${W}px; box-sizing: border-box; padding: 64px; background: #0B1026; display: flex; flex-direction: column; gap: 44px">
<div style="display: flex; flex-direction: column; gap: 12px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: #6FD6CF">HOUNA · TANAFAS · MEDITATE</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: #F2ECDD">Meditate — cover flow</h1>
<p style="margin: 0; max-width: 1000px; font-size: 17px; line-height: 1.5; color: #B6BAD6">The orb goes; each scene is its still, cut round, three at a time on a shelf like the iPod’s Cover Flow. The chosen scene sits large in the middle, facing you; its neighbours smaller either side, turned in towards it. Tap one (or swipe) and the shelf turns it to the middle. The prototype beside this board plays it.</p>
</div>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('THE THREE THEMES', 'Fire chosen', 'The screen’s light and the chosen cover’s glow take the scene’s colour; everything else is the Tanafas player as it is.')}
${row([frame(still(THEMES.night, 0), 1, 'Night'), frame(still(THEMES.dusk, 0), 2, 'Dusk'), frame(still(THEMES.sunrise, 0), 3, 'Sunrise'), frame(still(THEMES.night, 1), 4, 'Night · Rain chosen')])}
</section>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('THE MOTION · FIRE → RAIN', 'The shelf turns', 'Rain slides in from the right, turning to face you and growing; Fire slides left, turning away; Ocean slides back behind; Creek comes out from behind on the right.')}
${row([0, 0.25, 0.55, 1].map((p, i) => frame(still(THEMES.night, 1, { from: 0, p }), i + 1, ['Tap Rain', 'Turning', 'Passing', 'Settled'][i], `${Math.round(p * 560)} ms`)))}
</section>
<section style="display: flex; flex-direction: column; gap: 18px">
${heading('ARABIC', 'The shelf reads right to left', 'The next scene waits on the left; the covers turn the other way.')}
${row([frame(still(THEMES.night, 0, { rtl: true }), 1, 'Night · نار'), frame(still(THEMES.dusk, 2, { rtl: true }), 2, 'Dusk · جدول')])}
</section>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
${NOTES.map(([t, b]) => `<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 18px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.10)"><span style="font-size: 15px; font-weight: 600; color: #F2ECDD">${t}</span><span style="font-size: 13.5px; line-height: 1.55; color: #B6BAD6">${b}</span></div>`).join('')}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${W},"height":2874}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'MeditateFlowStory.dc.html', story);
console.log('MeditateFlow.dc.html', (prototype.length / 1024).toFixed(0) + 'KB · MeditateFlowStory.dc.html', (story.length / 1024).toFixed(0) + 'KB · width', W);
