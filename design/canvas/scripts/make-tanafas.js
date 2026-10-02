// Rebuilds the Tanafas player and Breathe session boards (Night + Dusk) to match the app:
// glass orbs with the Houna mark pressed in, the square for box breathing, round carousel
// arrows, the duration picker, four exercises (no Wim Hof), and the session running in place.
const fs = require('fs');
const P = __dirname + '/../project/';

const logo = fs.readFileSync(__dirname + '/../../../constants/logoSvg.ts', 'utf8');
const FIGURE_D = /export const FIGURE_D = '([^']+)'/.exec(logo)[1];
const HEAD_D = /const HEAD_IN_FIGURE_D = '([^']+)'/.exec(logo)[1];
const RING_D = /d="(M50\.18[^"]+)"/.exec(fs.readFileSync(__dirname + '/../../../components/HounaMark.tsx', 'utf8'))[1];

/** The Houna pin (ring + figure with the head knocked out), as HounaMark draws it. */
const mark = (fill, left, top) =>
  `<svg aria-hidden="true" width="64" height="64" viewBox="17 5.4 20.6 20.6" style="position: absolute; left: ${left}px; top: ${top}px"><g transform="translate(-10.7 -6.6)"><g transform="translate(29.24 13.384)"><path d="${RING_D}" transform="translate(-44 -18.785)" fill="${fill}"></path></g><g transform="translate(31.801 13.392)"><path d="${FIGURE_D}${HEAD_D}" transform="translate(-48.6 -18.8)" fill="${fill}" fill-rule="evenodd"></path></g></g></svg>`;

/** The glass orb at full size (176), with the mark pressed into it; scale the wrapper to breathe. */
const orb = (wrapStyle) => `<div style="position: absolute; left: 37px; top: 37px; width: 176px; height: 176px; ${wrapStyle}">
<span style="position: absolute; left: 0; top: 0; width: 176px; height: 176px; border-radius: {{orbRadius}}; background: {{orbFill}}; box-shadow: 0 0 90px {{orbGlow}}"></span>
<div style="position: absolute; left: 0; top: 0; width: 176px; height: 176px; opacity: 0.7">${mark('{{markFill}}', 56, 56)}</div>
</div>`;

const THEMES = {
  night: {
    sfx: '', home: 'Main.dc.html',
    ground: '#0B1026', groundZero: 'rgba(11,16,38,0)',
    text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5',
    ctrlBg: 'rgba(242,236,221,0.06)', ctrlBorder: 'rgba(242,236,221,0.12)',
    tileBg: 'rgba(242,236,221,0.05)', tileBorder: 'rgba(242,236,221,0.10)',
    outline: 'rgba(242,236,221,0.14)', track: 'rgba(242,236,221,0.12)',
    action: '#F2ECDD', onAction: '#0B1026',
    tones: { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EA90A8' },
    glows: { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EA90A8' },
  },
  day: {
    sfx: 'Day', home: 'HomeDay.dc.html',
    ground: '#F5F1E8', groundZero: 'rgba(245,241,232,0)',
    text: '#1B2140', sec: '#4A5078', ter: '#646A8E',
    ctrlBg: '#FFFFFF', ctrlBorder: 'rgba(27,33,64,0.12)',
    tileBg: '#FFFFFF', tileBorder: 'rgba(27,33,64,0.10)',
    outline: 'rgba(27,33,64,0.14)', track: 'rgba(27,33,64,0.12)',
    action: '#1B2140', onAction: '#F5F1E8',
    tones: { glow: '#237873', dusk: '#6353C9', dawn: '#A8621F', bloom: '#B24B6B' },
    // Glows stay in the light hues on paper, as on the Dusk canvas.
    glows: { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EE97AE' },
  },
};

/** Shared by both boards' scripts: colour helpers and the glass-orb recipe from BreatheStages. */
const helpers = (T) => `const TONES = { glow: '${T.tones.glow}', dusk: '${T.tones.dusk}', dawn: '${T.tones.dawn}', bloom: '${T.tones.bloom}' };
const GLOWS = { glow: '${T.glows.glow}', dusk: '${T.glows.dusk}', dawn: '${T.glows.dawn}', bloom: '${T.glows.bloom}' };
const MIDNIGHT = '#0B1026';
function rgb(h) { return [1, 3, 5].map(function (k) { return parseInt(h.slice(k, k + 2), 16); }); }
function rgba(h, a) { return 'rgba(' + rgb(h).join(',') + ',' + a + ')'; }
function over(h, a, base) { var f = rgb(h), b = rgb(base); return '#' + f.map(function (v, k) { return Math.round(v * a + b[k] * (1 - a)).toString(16).padStart(2, '0'); }).join(''); }
function orbVals(tone, shape) {
  var fg = TONES[tone];
  return {
    orbRadius: shape === 'square' ? '38.7px' : '999px',
    orbFill: 'radial-gradient(circle at 34% 30%, ' + rgba('#FFFFFF', 0.76) + ' 0%, ' + rgba(over(fg, 0.35, '#FFFFFF'), 0.52) + ' 40%, ' + rgba(fg, 0.43) + ' 100%)',
    orbGlow: rgba(fg, 0.38),
    markFill: over(MIDNIGHT, 0.25, fg),
    middleRadius: shape === 'square' ? '28px' : '999px'
  };
}
function stageDots(tone, shape) {
  var N = 28, R = 110, C = 125, fg = TONES[tone], partner = tone === 'glow' ? TONES.dusk : fg;
  return Array.from({ length: N }, function (_, k) {
    var t = k / N, x, y;
    if (shape === 'ring') { var a = t * Math.PI * 2 - Math.PI / 2; x = C + R * Math.cos(a); y = C + R * Math.sin(a); }
    else { var side = Math.floor(t * 4), f = t * 4 - side, al = -R + 2 * R * f; var xy = side === 0 ? [al, -R] : side === 1 ? [R, al] : side === 2 ? [-al, R] : [-R, -al]; x = C + xy[0]; y = C + xy[1]; }
    var s = 3 + 4 * Math.sin(t * Math.PI);
    return { x: (x - s / 2).toFixed(1), y: (y - s / 2).toFixed(1), s: s.toFixed(1), o: (0.2 + 0.8 * Math.sin(t * Math.PI)).toFixed(2), c: k < N / 2 ? fg : partner };
  });
}`;

const stage = (T, wrapStyle, extra = '') => `<sc-for list="{{dots}}" as="d" hint-placeholder-count="28">
<span style="position: absolute; left: {{d.x}}px; top: {{d.y}}px; width: {{d.s}}px; height: {{d.s}}px; border-radius: 999px; background: {{d.c}}; opacity: {{d.o}}"></span>
</sc-for>
<span style="position: absolute; left: 56px; top: 56px; width: 137px; height: 137px; box-sizing: border-box; border-radius: {{middleRadius}}; border: 1px solid ${T.outline}"></span>
${orb(wrapStyle)}${extra}`;

const arrow = (T, dir, attrs) => `<button type="button" aria-label="${dir === 'prev' ? 'Previous' : 'Next'}" ${attrs} style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.ctrlBg}; border: 1px solid ${T.ctrlBorder}; color: ${T.text}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${dir === 'prev' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}"></path></svg></button>`;

const tileStyle = (T) => `display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 14px 16px; border-radius: 18px; background: ${T.tileBg}; border: 1px solid ${T.tileBorder}; color: ${T.text}; font-family: 'Figtree', sans-serif; text-align: start`;
const tileLabel = (T, hole) => `<span style="font-family: 'DM Mono', monospace; font-size: 10.5px; letter-spacing: 0.14em; color: ${T.ter}">${hole}</span>`;

/* ───────────────────────── Tanafas player ───────────────────────── */

function tanafas(T) {
  const file = P + `Tanafas${T.sfx}.dc.html`;
  let s = fs.readFileSync(file, 'utf8');
  const start = s.indexOf('<div style="flex-grow: 1; display: {{playerDisplay}}');
  const end = s.indexOf('<div style="flex-grow: 1; display: {{discoverDisplay}}');
  if (start < 0 || end < 0) throw new Error('player block not found in ' + file);

  const player = `<div style="flex-grow: 1; display: {{playerDisplay}}; flex-direction: column; min-height: 0">
<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px">
<div aria-hidden="true" style="position: relative; width: 250px; height: 250px; display: flex; align-items: center; justify-content: center">
<sc-if value="{{isBreathe}}" hint-placeholder-val="{{ true }}">
${stage(T, 'transform: scale(0.42)')}
</sc-if>
<sc-if value="{{isMeditate}}" hint-placeholder-val="{{ false }}">
<span style="position: absolute; left: 4px; top: 4px; width: 240px; height: 240px; box-sizing: border-box; border-radius: 999px; border: 1px solid ${T.outline}"></span>
<span style="position: relative; width: 176px; height: 176px; border-radius: 999px; overflow: hidden; background: radial-gradient(circle at 38% 32%, {{scene.hi}} 0, {{scene.c}} 48%, {{scene.lo}} 100%); box-shadow: 0 0 70px {{scene.glow}}"><span style="position: absolute; left: 0; top: 0; width: 176px; height: 176px; background: linear-gradient(180deg, rgba(255,255,255,0) 40%, rgba(11,16,38,0.28) 100%)"></span><span style="position: absolute; left: 0; right: 0; bottom: 22px; text-align: center; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.16em; color: rgba(255,255,255,0.85)">FOOTAGE · MUTED</span></span>
</sc-if>
</div>

<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%">
${arrow(T, 'prev', 'onClick="{{prev}}"')}
<div style="flex: 1; min-height: 104px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center">
<span style="font-family: 'Marcellus', serif; font-size: 27px; line-height: 1.12; color: ${T.text}">{{item.title}}</span>
<span style="padding: 4px 12px; border-radius: 999px; background: {{tagBg}}; border: 1px solid {{tagBorder}}; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.12em; color: {{tagText}}">{{item.tag}}</span>
</div>
${arrow(T, 'next', 'onClick="{{next}}"')}
</div>

<p style="margin: 0; font-size: 14.5px; line-height: 1.5; text-align: center; color: ${T.sec}; max-width: 310px; min-height: 44px">{{item.desc}}</p>

<div aria-hidden="true" style="display: flex; gap: 6px">
<sc-for list="{{pager}}" as="p" hint-placeholder-count="4">
<span style="width: {{p.w}}px; height: 6px; border-radius: 999px; background: {{p.c}}; opacity: {{p.o}}"></span>
</sc-for>
</div>
</div>

<div style="display: flex; flex-direction: column; gap: 16px">
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">
<sc-if value="{{tile1Plain}}" hint-placeholder-val="{{ true }}">
<div style="${tileStyle(T)}">
${tileLabel(T, '{{tile1Label}}')}
<span style="font-size: 16px; font-weight: 500">{{tile1Value}}</span>
</div>
</sc-if>
<sc-if value="{{tile1Picker}}" hint-placeholder-val="{{ false }}">
<div style="${tileStyle(T)}">
${tileLabel(T, 'DURATION')}
<div role="radiogroup" aria-label="Duration" style="display: flex; align-items: baseline; gap: 12px">
<sc-for list="{{lengths}}" as="l" hint-placeholder-count="4">
<button type="button" role="radio" aria-checked="{{l.sel}}" aria-label="{{l.spoken}}" onClick="{{l.pick}}" style="padding: 0 0 2px; background: transparent; border: 0; border-bottom: 2px solid {{l.line}}; color: {{l.color}}; font-family: 'Figtree', sans-serif; font-size: 16px; font-weight: {{l.weight}}">{{l.t}}</button>
</sc-for>
<span style="font-size: 16px; color: ${T.ter}">min</span>
</div>
</div>
</sc-if>
<sc-if value="{{tile2Plain}}" hint-placeholder-val="{{ false }}">
<div style="${tileStyle(T)}">
${tileLabel(T, '{{tile2Label}}')}
<span style="font-size: 16px; font-weight: 500">{{tile2Value}}</span>
</div>
</sc-if>
<sc-if value="{{tile2Picker}}" hint-placeholder-val="{{ true }}">
<div style="${tileStyle(T)}">
${tileLabel(T, 'DURATION')}
<div role="radiogroup" aria-label="Duration" style="display: flex; align-items: baseline; gap: 12px">
<sc-for list="{{lengths}}" as="l" hint-placeholder-count="3">
<button type="button" role="radio" aria-checked="{{l.sel}}" aria-label="{{l.spoken}}" onClick="{{l.pick}}" style="padding: 0 0 2px; background: transparent; border: 0; border-bottom: 2px solid {{l.line}}; color: {{l.color}}; font-family: 'Figtree', sans-serif; font-size: 16px; font-weight: {{l.weight}}">{{l.t}}</button>
</sc-for>
<span style="font-size: 16px; color: ${T.ter}">min</span>
</div>
</div>
</sc-if>
</div>
<div style="display: flex; justify-content: center">
<a href="{{playHref}}" aria-label="Begin" style="width: 80px; height: 80px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.action}; color: ${T.onAction}; box-shadow: 0 0 36px {{buttonGlow}}"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"></path></svg></a>
</div>
</div>
</div>
`;
  s = s.slice(0, start) + player + s.slice(end);

  const accentDay = T.sfx === 'Day';
  const script = `<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
${helpers(T)}
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { mode: 'breathe', b: 1, m: 1, bm: 3, mm: 10 };
  }
  renderVals() {
    const on = '${T.text}', off = '${T.ter}';
    const accent = TONES.glow;
    const breathe = [
      { title: 'Anxiety Relief Breathing', tag: '4-7-8 TECHNIQUE', desc: 'A structured breathing pattern that calms the nervous system and eases racing thoughts.', pattern: '4 · 7 · 8', tone: 'glow', shape: 'ring', timed: true, href: '#session' },
      { title: 'Steady Mind Breathing', tag: 'BOX · 4×4', desc: 'Equal inhale, hold, exhale, and hold to steady your mind and regain focus.', pattern: '4 · 4 · 4 · 4', tone: 'dusk', shape: 'square', timed: true, href: 'Breathe${T.sfx}.dc.html' },
      { title: 'Panic Relief Grounding', tag: '5-4-3-2-1 SENSES', desc: 'Reconnect with your surroundings to interrupt panic attacks and spiraling thoughts.', pattern: 'Five senses', duration: '3 min', tone: 'dawn', shape: 'ring', timed: false, href: '#session' },
      { title: 'Tension Release', tag: 'MUSCLE RELAXATION', desc: 'Systematically release physical tension held in the body, group by group.', pattern: 'Group by group', duration: '5 min', tone: 'bloom', shape: 'ring', timed: false, href: '#session' }
    ];
    const scenes = [
      { title: 'Fire', tag: 'AMBIENT SCENE', desc: 'A crackling, warm glow', hi: '#FFE9CF', c: '#F0A868', lo: '#9A4F22', glow: 'rgba(240,168,104,0.45)' },
      { title: 'Rain', tag: 'AMBIENT SCENE', desc: 'Steady rainfall to settle the mind', hi: '#E4EDFF', c: '#7FA2EC', lo: '#33509E', glow: 'rgba(127,162,236,0.45)' },
      { title: 'Creek', tag: 'AMBIENT SCENE', desc: 'A mountain stream flowing over stones', hi: '#DDFAF5', c: '#63CFC7', lo: '#1F7A74', glow: 'rgba(99,207,199,0.45)' },
      { title: 'Ocean', tag: 'AMBIENT SCENE', desc: 'Slow, rolling waves', hi: '#E6E8FF', c: '#8F9BF0', lo: '#39439E', glow: 'rgba(143,155,240,0.45)' }
    ];
    const mode = this.state.mode;
    const isDiscover = mode === 'discover';
    const isBreathe = mode !== 'meditate';
    const list = isBreathe ? breathe : scenes;
    const key = isBreathe ? 'b' : 'm';
    const i = this.state[key];
    const item = list[i];
    const tone = isBreathe ? item.tone : 'glow';
    const fg = isBreathe ? TONES[tone] : ${accentDay ? 'item.lo' : 'item.c'};
    const orbv = orbVals(tone, isBreathe ? item.shape : 'ring');
    const pager = list.map((_, k) => ({ w: k === i ? 22 : 6, c: k === i ? on : off, o: k === i ? 1 : 0.45 }));
    const go = (d) => () => this.setState({ [key]: (i + d + list.length) % list.length });
    const picker = isBreathe ? item.timed : true;
    const opts = isBreathe ? [1, 3, 5] : [5, 10, 20, null];
    const chosen = isBreathe ? this.state.bm : this.state.mm;
    const lengths = opts.map((m) => ({
      t: m === null ? '∞' : String(m),
      spoken: m === null ? 'No limit' : m + ' min',
      sel: m === chosen ? 'true' : 'false',
      line: m === chosen ? fg : 'transparent',
      color: m === chosen ? on : off,
      weight: m === chosen ? 600 : 500,
      pick: () => this.setState(isBreathe ? { bm: m } : { mm: m })
    }));
    const glowHue = isBreathe ? GLOWS[tone] : null;
    return Object.assign({}, orbv, {
      isBreathe, isMeditate: mode === 'meditate', item, pager, lengths,
      dots: stageDots(tone, isBreathe ? item.shape : 'ring'),
      playerDisplay: isDiscover ? 'none' : 'flex', discoverDisplay: isDiscover ? 'flex' : 'none',
      discoverSel: isDiscover ? 'true' : 'false', discoverText: isDiscover ? on : off, discoverLine: isDiscover ? accent : 'transparent',
      showDiscover: () => this.setState({ mode: 'discover' }),
      scene: isBreathe ? scenes[0] : item,
      glow: isDiscover ? rgba(GLOWS.dusk, 0.22) : isBreathe ? rgba(glowHue, 0.30) : item.glow,
      buttonGlow: isBreathe ? rgba(glowHue, 0.35) : item.glow,
      breatheSel: mode === 'breathe' ? 'true' : 'false', meditateSel: mode === 'meditate' ? 'true' : 'false',
      breatheText: mode === 'breathe' ? on : off, meditateText: mode === 'meditate' ? on : off,
      breatheLine: mode === 'breathe' ? accent : 'transparent', meditateLine: mode === 'meditate' ? accent : 'transparent',
      tagBg: rgba(fg, 0.12), tagBorder: rgba(fg, 0.32), tagText: fg,
      // Breathe: pattern + (duration picker for the timed ones, fixed length otherwise). Meditate: picker + video.
      tile1Plain: isBreathe, tile1Picker: !isBreathe,
      tile1Label: 'PATTERN', tile1Value: isBreathe ? item.pattern : '',
      tile2Plain: isBreathe ? !item.timed : true, tile2Picker: isBreathe && item.timed,
      tile2Label: isBreathe ? 'DURATION' : 'VIDEO', tile2Value: isBreathe ? (item.duration || '') : 'On',
      playHref: isBreathe ? item.href : '#scene',
      showBreathe: () => this.setState({ mode: 'breathe' }),
      showMeditate: () => this.setState({ mode: 'meditate' }),
      prev: go(-1), next: go(1)
    });
  }
}
</script>`;
  s = s.replace(/<script type="text\/x-dc" data-dc-script[\s\S]*?<\/script>/, () => script);
  fs.writeFileSync(file, s);
}

/* ───────────────────────── Breathing session (in place) ───────────────────────── */

function breathe(T) {
  const file = P + `Breathe${T.sfx}.dc.html`;
  const tan = `Tanafas${T.sfx}.dc.html`;
  const anim = (name, timing, delay = '0s') => `animation: ${name} 16s ${timing} ${delay} infinite; animation-play-state: {{play}}`;
  const word = (w, delay) => `<span style="grid-area: 1 / 1; font-family: 'Marcellus', serif; font-size: 27px; line-height: 1.12; color: ${T.text}; opacity: 0; ${anim('phase-word', 'linear', delay)}">${w}</span>`;
  const tag = (w, delay) => `<span style="font-family: 'DM Mono', monospace; font-size: 11.5px; letter-spacing: 0.14em; color: ${T.text}; opacity: 0.4; ${anim('phase-tag', 'linear', delay)}">${w}</span>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Breathing session${T.sfx ? ' (Day)' : ''}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
a{color:${T.text};text-decoration:none}
@keyframes box-orb{0%{transform:scale(0.42)}25%{transform:scale(1)}50%{transform:scale(1)}75%{transform:scale(0.42)}100%{transform:scale(0.42)}}
@keyframes box-glow{0%{opacity:0.65}25%{opacity:1}50%{opacity:1}75%{opacity:0.65}100%{opacity:0.65}}
@keyframes box-bead{0%{transform:translate(-110px,-110px)}25%{transform:translate(110px,-110px)}50%{transform:translate(110px,110px)}75%{transform:translate(-110px,110px)}100%{transform:translate(-110px,-110px)}}
@keyframes phase-word{0%{opacity:1}24.8%{opacity:1}25%{opacity:0}100%{opacity:0}}
@keyframes phase-tag{0%{opacity:1}24.8%{opacity:1}25%{opacity:0.4}100%{opacity:0.4}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>
</helmet>
<div style="position: relative; width: 390px; height: 844px; overflow: hidden; box-sizing: border-box; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif; color: ${T.text}; display: flex; flex-direction: column; padding: 20px 20px 40px">
<span aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; background: radial-gradient(70% 38% at 50% 30%, {{glow}}, ${T.groundZero} 72%); ${anim('box-glow', 'ease-in-out')}"></span>

<div style="position: relative; display: flex; align-items: center; justify-content: space-between; gap: 8px">
<a href="${tan}" aria-label="Close Tanafas" style="flex-shrink: 0; width: 44px; height: 44px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.ctrlBg}; border: 1px solid ${T.ctrlBorder}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg></a>
<div role="tablist" aria-label="Tanafas" style="display: flex; gap: 16px">
<a href="${tan}" role="tab" aria-selected="true" style="height: 44px; display: flex; align-items: center; padding: 0 2px; border-bottom: 2px solid {{tabLine}}; color: {{tabOn}}; font-size: 15px; font-weight: 600; box-sizing: border-box">Breathe</a>
<a href="${tan}" role="tab" aria-selected="false" style="height: 44px; display: flex; align-items: center; padding: 0 2px; color: {{tabOff}}; font-size: 15px; font-weight: 600">Meditate</a>
<a href="${tan}" role="tab" aria-selected="false" style="height: 44px; display: flex; align-items: center; padding: 0 2px; color: {{tabOff}}; font-size: 15px; font-weight: 600">Discover</a>
</div>
<a href="#journal" aria-label="Journal" style="flex-shrink: 0; width: 44px; height: 44px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.ctrlBg}; border: 1px solid ${T.ctrlBorder}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"></path><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"></path><path d="M9 7.5h6"></path></svg></a>
</div>

<div style="position: relative; flex-grow: 1; display: flex; flex-direction: column; min-height: 0">
<div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px">
<div aria-hidden="true" style="position: relative; width: 250px; height: 250px">
${stage(T, anim('box-orb', 'ease-in-out'), `
<span style="position: absolute; left: 120px; top: 120px; width: 10px; height: 10px; border-radius: 999px; background: {{fg}}; box-shadow: 0 0 14px {{beadGlow}}; ${anim('box-bead', 'linear')}"></span>`)}
</div>

<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%">
<span aria-hidden="true" style="width: 40px; height: 40px"></span>
<div style="flex: 1; min-height: 104px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center">
<div role="status" aria-label="{{statusLabel}}" style="display: grid">
${word('Inhale', '0s')}
${word('Hold', '-12s')}
${word('Exhale', '-8s')}
${word('Hold', '-4s')}
</div>
<span style="font-family: 'DM Mono', monospace; font-size: 11.5px; letter-spacing: 0.14em; color: {{fg}}">ROUND 1 OF 12</span>
</div>
<span aria-hidden="true" style="width: 40px; height: 40px"></span>
</div>

<div aria-hidden="true" style="min-height: 44px; display: flex; gap: 16px">
${tag('INHALE', '0s')}
${tag('HOLD', '-12s')}
${tag('EXHALE', '-8s')}
${tag('HOLD', '-4s')}
</div>
<span aria-hidden="true" style="height: 6px"></span>
</div>

<div style="display: flex; flex-direction: column; gap: 16px">
<div style="display: flex; flex-direction: column; align-items: center; gap: 12px">
<div role="progressbar" aria-label="Session progress" aria-valuenow="3" aria-valuemin="0" aria-valuemax="100" style="width: 100%; height: 4px; border-radius: 999px; background: ${T.track}; overflow: hidden"><div style="width: 3%; height: 100%; border-radius: 999px; background: {{fg}}"></div></div>
<span style="font-family: 'DM Mono', monospace; font-size: 11.5px; letter-spacing: 0.14em; color: ${T.ter}">{{timeLabel}}</span>
</div>
<div style="display: flex; align-items: center; justify-content: center; gap: 24px">
<a href="${tan}" aria-label="End session" style="width: 56px; height: 56px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.ctrlBg}; border: 1px solid ${T.ctrlBorder}; color: ${T.text}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7"></path><path d="M4 4v4.5h4.5"></path></svg></a>
<button type="button" aria-label="{{toggleLabel}}" onClick="{{toggle}}" style="width: 80px; height: 80px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.action}; border: 0; color: ${T.onAction}; box-shadow: 0 0 36px {{buttonGlow}}">
<sc-if value="{{paused}}" hint-placeholder-val="{{ false }}"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"></path></svg></sc-if>
<sc-if value="{{running}}" hint-placeholder-val="{{ true }}"><svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.2"></rect><rect x="14" y="5" width="4" height="14" rx="1.2"></rect></svg></sc-if>
</button>
<span aria-hidden="true" style="width: 56px; height: 56px"></span>
</div>
</div>
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
${helpers(T)}
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { paused: false };
  }
  renderVals() {
    const paused = this.state.paused;
    const tone = 'dusk', fg = TONES[tone];
    const on = '${T.text}', off = '${T.ter}';
    return Object.assign({}, orbVals(tone, 'square'), {
      dots: stageDots(tone, 'square'),
      fg, beadGlow: rgba(fg, 0.9),
      tabOn: on, tabOff: off, tabLine: TONES.glow,
      glow: rgba(GLOWS[tone], 0.30), buttonGlow: rgba(GLOWS[tone], 0.35),
      paused, running: !paused,
      play: paused ? 'paused' : 'running',
      statusLabel: paused ? 'Paused' : 'Box breathing, round 1 of 12',
      timeLabel: paused ? 'PAUSED' : '2:59 LEFT',
      toggleLabel: paused ? 'Resume' : 'Pause',
      toggle: () => this.setState({ paused: !paused })
    });
  }
}
</script>
</body>
</html>
`;
  fs.writeFileSync(file, html);
}

for (const T of Object.values(THEMES)) {
  tanafas(T);
  breathe(T);
}
console.log('Tanafas + Breathe boards written');
