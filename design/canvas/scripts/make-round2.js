// "Houna — Round 2": the changes asked for after phase 6 that want a look first. A countdown before
// every breathing exercise; the physiological sigh as a fifth exercise, with a fifth tone; the
// scene sheet, three ways; Home's map without its card (that board is real screenshots, see
// make-round2-home.js). Sunrise, Dusk and Night, Arabic where the layout changes.
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const { icon } = require('../../explorations/scripts/icons.js');
const { helpers } = require('./make-players-phase.js');
const { header, hero, THEMES, IMG, HERO_CSS } = helpers;
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;
const out = [];
const [TS, TD, TN] = THEMES;

const PW = 390, PH = 844, PAD = 40, GAP = 40;
function row(file, { title, phones, css = '', logic }) {
  const W = PAD * 2 + phones.length * PW + (phones.length - 1) * GAP, H = PAD + PH + 110;
  const body = phones
    .map((p, i) => {
      const [name, ...rest] = p.caption.split(' · ');
      return `<div${p.ar ? ' dir="rtl"' : ''} style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; background: ${p.T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); font-family: ${p.ar ? K.F.arBody : K.F.body}; color: ${p.T.text}">${p.html}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${name}</span>${rest.length ? `<span style="font-size: 13px; line-height: 1.45; color: ${M.mist}">${rest.join(' · ')}</span>` : ''}</div>`;
    })
    .join('\n');
  return K.board(file, { title, w: W, h: H, root: 'background: #070B1C', css, body, logic, dir: DIR });
}
const lab = (t, color, ar, size) => (ar ? K.arLabel(t, color, (size || 11) + 2) : K.label(t, color, size || 11));
const text = (T) => (T.dark ? M.moonlight : T.text);
const sub = (T) => (T.dark ? M.mist : T.sec);

/* ── The session around a stage: its ground, the header's icons, the title slot, progress, pause ── */
const GROUND = {
  night: `linear-gradient(180deg, ${M.midnight} 0%, #1E2350 42%, #4A3E73 70%, #A77A7A 90%, ${K.TONES.night.dawn} 100%)`,
  dusk: `linear-gradient(180deg, ${K.T.dusk.ground} 0%, #EFE3EE 42%, #E8C9D6 70%, #F2C9A8 90%, #F2B880 100%)`,
  sunrise: `linear-gradient(180deg, ${K.T.sunrise.ground} 0%, #E7F0F3 40%, #F3DCD8 72%, #F9C8AE 90%, #F9A980 100%)`,
};
const CY = 244; // the stage's centre in a session (the 4-7-8 orb's, measured on the app)
function session(T, { stage, title, subtitle, round, left, tone, ar = false, pct = 0 }) {
  return `<span style="position: absolute; inset: 0; background: ${GROUND[T.key]}"></span>
<span style="position: absolute; ${ar ? 'right' : 'left'}: 16px; top: 52px; width: 44px; height: 44px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: ${text(T)}">${icon('close', 18)}</span>
${stage}
<div style="position: absolute; left: 24px; right: 24px; top: 392px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">${title}${subtitle}${round}</div>
<div style="position: absolute; left: 55px; right: 55px; top: 668px; display: flex; flex-direction: column; align-items: center; gap: 10px"><span style="width: 100%; height: 4px; border-radius: 2px; background: ${T.line}"><span style="display: block; width: ${pct}%; height: 100%; border-radius: 2px; background: ${tone}"></span></span>${lab(left, T.ter, ar)}</div>
<span style="position: absolute; left: 155px; top: 740px; width: 80px; height: 80px; border-radius: 999px; background: ${T.action}; display: flex; align-items: center; justify-content: center; color: ${T.onAction}">${icon('pause', 26, 2)}</span>`;
}

/* ── The stages, at rest (as the app draws them) ── */
const pressed = (size, surface) => K.pressedMark(size, surface);
/** 4-7-8's glass orb, `scale` of its 240px (0.6 at rest), the mark pressed in. */
function glassOrb(T, rgbHue, scale = 0.6, { anim = '', guides = null, lit = '' } = {}) {
  const d = 240;
  return `${guides || ''}<div aria-hidden="true" style="position: absolute; left: ${195 - d / 2}px; top: ${CY - d / 2}px; width: ${d}px; height: ${d}px; transform: scale(${scale}); ${anim}">
<span style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,${T.dark ? 0.32 : 0.85}) 0%, rgba(${rgbHue},0.16) 45%, rgba(${rgbHue},0.26) 100%); border: 1px solid rgba(${rgbHue},0.45); box-shadow: 0 0 40px rgba(${rgbHue},0.25)"></span>
${lit}
<span style="position: absolute; left: ${d / 2 - 36}px; top: ${d / 2 - 36}px; width: 72px; height: 72px">${pressed(72, T.dark ? '#2E5F6A' : '#BFE3E0')}</span>
</div>`;
}
/** Box breathing's star at rest: the two squares, the mark pressed into the middle. */
function star(T) {
  const r = 112, tone = T.tone.dusk;
  return `<svg width="390" height="${CY * 2}" viewBox="0 0 390 ${CY * 2}" aria-hidden="true" style="position: absolute; left: 0; top: 0; overflow: visible">
<polygon points="${K.squarePts(195, CY, r, 45)}" fill="none" stroke="${T.dark ? 'rgba(242,236,221,0.4)' : 'rgba(29,43,42,0.35)'}" stroke-width="1.2"></polygon>
<polygon points="${K.squarePts(195, CY, r, 45)}" fill="none" stroke="${tone}" stroke-width="1.2" opacity="0.85"></polygon>
</svg>
<span style="position: absolute; left: ${195 - 22}px; top: ${CY - 22}px; width: 44px; height: 44px">${pressed(44, T.dark ? '#2B2C5A' : '#E6E0F4')}</span>`;
}
/** Grounding's ring of dots round the small lit orb, the mark pressed in. */
function ringOrb(T, toneKey) {
  const fg = T.tone[toneKey], partner = fg;
  const dots = Array.from({ length: 28 }, (_, k) => {
    const t = k / 28, a = t * Math.PI * 2 - Math.PI / 2, s = 3 + 4 * Math.sin(t * Math.PI);
    return `<span style="position: absolute; left: ${(195 + 110 * Math.cos(a) - s / 2).toFixed(1)}px; top: ${(CY + 110 * Math.sin(a) - s / 2).toFixed(1)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: ${k < 14 ? fg : partner}; opacity: ${(0.2 + 0.8 * Math.sin(t * Math.PI)).toFixed(2)}"></span>`;
  }).join('');
  return `${dots}<span style="position: absolute; left: ${195 - 68.5}px; top: ${CY - 68.5}px; width: 137px; height: 137px; border-radius: 999px; border: 1px solid ${T.dark ? 'rgba(242,236,221,0.14)' : 'rgba(29,43,42,0.14)'}"></span>
<span style="position: absolute; left: ${195 - 37}px; top: ${CY - 37}px; width: 74px; height: 74px; border-radius: 999px; background: radial-gradient(circle at 34% 30%, rgba(255,255,255,0.76) 0%, rgba(${K.rgbOf(T.hue[toneKey])},0.5) 40%, rgba(${K.rgbOf(T.hue[toneKey])},0.45) 100%); box-shadow: 0 0 40px rgba(${K.rgbOf(T.hue[toneKey])},0.4)"></span>
<span style="position: absolute; left: ${195 - 13.5}px; top: ${CY - 13.5}px; width: 27px; height: 27px">${pressed(27, T.hue[toneKey])}</span>`;
}

/* ── 1 · The countdown ── */
(() => {
  const L = 6; // 3 · 2 · 1 · breathe in, then a pause, on the board
  const css = ['3', '2', '1', 'go'].map((k, i) => {
    const a = ((i * 1) / L) * 100, b = (((i + 1) * 1) / L) * 100;
    return `@keyframes cd${k} { 0%, ${a.toFixed(1)}% { opacity: 0; transform: scale(0.92) } ${(a + 3).toFixed(1)}%, ${(b - 3).toFixed(1)}% { opacity: 1; transform: none } ${b.toFixed(1)}%, 100% { opacity: 0 } }`;
  }).join('\n') + `
@keyframes cdArc { 0% { stroke-dashoffset: 0 } ${((3 / L) * 100).toFixed(1)}%, 100% { stroke-dashoffset: 785 } }
@keyframes cdSettle { 0%, ${((3 / L) * 100).toFixed(1)}% { opacity: 1 } ${((3.4 / L) * 100).toFixed(1)}%, 100% { opacity: 0 } }`;
  const R = 125;
  const arc = (tone, still) => `<svg width="390" height="${CY * 2}" viewBox="0 0 390 ${CY * 2}" aria-hidden="true" style="position: absolute; left: 0; top: 0">
<circle cx="195" cy="${CY}" r="${R}" fill="none" stroke="currentColor" stroke-opacity="0.12" stroke-width="2"></circle>
<circle cx="195" cy="${CY}" r="${R}" fill="none" stroke="${tone}" stroke-width="2" stroke-linecap="round" stroke-dasharray="785" transform="rotate(-90 195 ${CY})" style="${still ? `stroke-dashoffset: ${still}` : 'animation: cdArc 6s linear infinite'}"></circle>
</svg>`;
  const count = (T, ar, still) => {
    const n = (k) => (ar ? K.ar(k) : String(k));
    const big = (k, anim) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; ${anim}; font-family: ${ar ? K.F.arDisplay : K.F.body}; font-weight: ${ar ? 700 : 300}; font-size: ${ar ? 60 : 72}px; line-height: 1; color: ${text(T)}">${k}</span>`;
    const numbers = still
      ? big(n(still), '')
      : ['3', '2', '1'].map((k) => big(n(k), `opacity: 0; animation: cd${k} ${L}s linear infinite`)).join('') +
        `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; animation: cdgo ${L}s linear infinite; font-family: ${ar ? K.F.arDisplay : K.F.display}; font-size: 30px; color: ${text(T)}">${ar ? 'شهيق' : 'Breathe in'}</span>`;
    return `<span style="position: relative; display: block; width: 240px; height: 80px">${numbers}</span>`;
  };
  const settle = (T, ar, still) => `<span style="font-size: 15px; color: ${sub(T)}; ${still ? '' : `animation: cdSettle ${L}s linear infinite`}">${ar ? 'استقرّ في مكانك. تنفّس كما أنت.' : 'Settle in. Breathe as you are.'}</span>`;
  const phone = (T, { stage, tone, name, still, ar = false }) =>
    session(T, {
      stage: `<span style="color: ${text(T)}">${arc(tone, still ? 785 * (1 - still / 3) || 0.01 : 0)}</span>${stage}`,
      title: count(T, ar, still),
      subtitle: settle(T, ar, still),
      round: lab(name, T.ter, ar, 11),
      left: ar ? '٣:٠٠ متبقية' : '3:00 left',
      tone,
      ar,
    });
  out.push(
    row('CountdownR2.dc.html', {
      title: 'Round 2 — a countdown before each breathing exercise',
      css,
      phones: [
        { T: TN, caption: 'Night · 4-7-8. Play starts a quiet 3 · 2 · 1 where the phase word will be, a thin ring round the stage drawing down with it; the stage waits at rest. Then “Breathe in”, and the first breath begins. Plays through.', html: phone(TN, { stage: glassOrb(TN, K.rgbOf(TN.hue.glow)), tone: TN.tone.glow, name: 'Anxiety Relief Breathing' }) },
        { T: TD, caption: 'Dusk · Box breathing, at 2. The same for every exercise, the new one too; the ring is the exercise’s tone.', html: phone(TD, { stage: star(TD), tone: TD.tone.dusk, name: 'Steady Mind Breathing', still: 2 }) },
        { T: TS, caption: 'Sunrise · Five senses, at 1. Pause during it stops before anything starts; nothing is counted until the first breath.', html: phone(TS, { stage: ringOrb(TS, 'dawn'), tone: TS.tone.dawn, name: 'Panic Relief Grounding', still: 1 }) },
        { T: TN, ar: true, caption: 'Arabic · A screen reader hears 3, 2, 1. Under Reduce Motion the numbers change in place and the ring doesn’t move.', html: phone(TN, { stage: glassOrb(TN, K.rgbOf(TN.hue.glow)), tone: TN.tone.glow, name: 'تنفّس لتخفيف القلق', still: 3, ar: true }) },
      ],
    }),
  );
})();

/* ── 2 · The physiological sigh: a fifth exercise, a fifth tone ── */
// The fifth tone, "tide": sky blue at night and by dusk; Sunrise already spends its blue on dusk,
// so its tide is the gold of late morning.
const TIDE = { night: { fg: '#8CC8F2', hue: '#8CC8F2' }, dusk: { fg: '#2E6DA8', hue: '#8CC8F2' }, sunrise: { fg: '#C98A12', hue: '#F4C35A' } };
(() => {
  // In 2 (to the inner line), a top-up of 1 (to the outer, which lights), out 6: 9 s a breath.
  const C = 9;
  const pct = (s) => ((s / C) * 100).toFixed(2);
  const css = `@keyframes sighOrb { 0% { transform: scale(0.6); animation-timing-function: ease-out } ${pct(2)}% { transform: scale(0.84); animation-timing-function: ease-out } ${pct(3)}% { transform: scale(1); animation-timing-function: ease-in-out } 100% { transform: scale(0.6) } }
@keyframes sighLit { 0%, ${pct(2.2)}% { opacity: 0 } ${pct(2.9)}%, ${pct(3.6)}% { opacity: 1 } ${pct(4.6)}%, 100% { opacity: 0 } }
@keyframes sighW0 { 0% { opacity: 0 } 2% { opacity: 1 } ${pct(1.8)}% { opacity: 1 } ${pct(2)}%, 100% { opacity: 0 } }
@keyframes sighW1 { 0%, ${pct(2)}% { opacity: 0 } ${pct(2.2)}%, ${pct(2.8)}% { opacity: 1 } ${pct(3)}%, 100% { opacity: 0 } }
@keyframes sighW2 { 0%, ${pct(3)}% { opacity: 0 } ${pct(3.3)}%, 97% { opacity: 1 } 100% { opacity: 0 } }`;
  const stage = (T, { scale = 0.6, anim = false, lit = false }) => {
    const t = TIDE[T.key], rgb = K.rgbOf(t.hue);
    // The two lines the breath rises to: the first breath's (inner), the top-up's (outer).
    const guides = `<span aria-hidden="true" style="position: absolute; left: ${195 - 101}px; top: ${CY - 101}px; width: 202px; height: 202px; border-radius: 999px; border: 1px dashed ${T.dark ? 'rgba(242,236,221,0.22)' : 'rgba(29,43,42,0.2)'}"></span>
<span aria-hidden="true" style="position: absolute; left: ${195 - 120}px; top: ${CY - 120}px; width: 240px; height: 240px; border-radius: 999px; border: 1px solid ${T.dark ? 'rgba(242,236,221,0.16)' : 'rgba(29,43,42,0.14)'}"></span>
<span aria-hidden="true" style="position: absolute; left: ${195 - 121}px; top: ${CY - 121}px; width: 242px; height: 242px; border-radius: 999px; border: 2.5px solid ${t.fg}; box-shadow: 0 0 18px rgba(${rgb},0.8); ${anim ? `opacity: 0; animation: sighLit ${C}s linear infinite` : `opacity: ${lit ? 1 : 0}`}"></span>`;
    return glassOrb(T, rgb, scale, { anim: anim ? `animation: sighOrb ${C}s linear infinite` : '', guides });
  };
  const words = (T, ar, still) => {
    const W = ar ? ['شهيق', 'شهيق قصير آخر', 'زفير طويل'] : ['Breathe in', 'A little more', 'Long breath out'];
    const w = (s, anim) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; ${anim}; font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700;' : ''} font-size: ${ar ? 30 : 30}px; color: ${text(T)}">${s}</span>`;
    return `<span style="position: relative; display: block; width: 300px; height: 48px">${still !== undefined ? w(W[still], '') : W.map((s, i) => w(s, `opacity: 0; animation: sighW${i} ${C}s linear infinite`)).join('')}</span>`;
  };
  const inSession = (T, opts) =>
    session(T, {
      stage: stage(T, opts),
      title: words(T, opts.ar, opts.still),
      subtitle: `<span style="font-size: 15px; color: ${sub(T)}">${opts.ar ? 'التنهيدة' : 'Physiological Sigh'}</span>`,
      round: lab(opts.ar ? 'الجولة ٣ من ٢٠' : 'Round 3 of 20', T.ter, opts.ar, 11),
      left: opts.ar ? '٢:٣٢ متبقية' : '2:32 left',
      tone: TIDE[T.key].fg,
      ar: opts.ar,
      pct: 16,
    });
  // The carousel card, at rest.
  const idle = (T) => {
    const t = TIDE[T.key];
    return `<span style="position: absolute; inset: 0; background: radial-gradient(70% 38% at 50% 30%, rgba(${K.rgbOf(t.hue)},${T.dark ? 0.2 : 0.2}), rgba(0,0,0,0) 72%)"></span>
${header(T, 'breathe')}
${stage(T, { scale: 0.6 })}
<div style="position: absolute; left: 24px; right: 24px; top: 400px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
<span style="font-family: ${K.F.display}; font-size: 28px; line-height: 1.15; color: ${text(T)}">Physiological Sigh</span>
<span style="padding: 4px 12px; border-radius: 999px; border: 1px solid ${t.fg}; background: rgba(${K.rgbOf(t.hue)},0.12)">${K.label('Double inhale · long exhale', T.dark ? t.fg : t.fg, 10.5)}</span>
<span style="font-size: 14.5px; line-height: 1.5; color: ${sub(T)}; max-width: 320px">Two breaths in through the nose, the second a short top-up, then one long, slow breath out. The quickest way to settle in the moment.</span>
<span style="display: flex; gap: 6px; margin-top: 4px">${[0, 1, 2, 3, 4].map((k) => `<span style="width: ${k === 4 ? 16 : 6}px; height: 6px; border-radius: 3px; background: ${k === 4 ? text(T) : T.line}"></span>`).join('')}</span>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: 652px; display: flex; gap: 12px">
<span style="flex: 1; padding: 14px 16px; border-radius: 18px; background: ${T.card}; border: 1px solid ${T.line}; display: flex; flex-direction: column; gap: 6px">${K.label('Pattern', T.ter, 10)}<span style="font-size: 16px; font-weight: 600; color: ${text(T)}">2 · 1 · 6</span></span>
<span style="flex: 1; padding: 14px 16px; border-radius: 18px; background: ${T.card}; border: 1px solid ${T.line}; display: flex; flex-direction: column; gap: 6px">${K.label('Duration', T.ter, 10)}<span style="font-size: 16px; color: ${text(T)}">1 <b style="text-decoration: underline; text-decoration-color: ${t.fg}">3</b> 5 min</span></span>
</div>
<span style="position: absolute; left: 155px; top: 740px; width: 80px; height: 80px; border-radius: 999px; background: ${T.action}; display: flex; align-items: center; justify-content: center; color: ${T.onAction}">${icon('play', 26)}</span>`;
  };
  out.push(
    row('SighR2.dc.html', {
      title: 'Round 2 — the physiological sigh, a fifth exercise',
      css,
      phones: [
        { T: TN, caption: 'Night · Fifth in the carousel, after muscle relaxation. In 2, a top-up of 1, out 6 (9 s a breath; in breathPatterns). No hold at all, so the breath-retention safeguards don’t apply. Its own tone, “tide”: sky blue by night and dusk, late-morning gold in Sunrise (its blue is taken).', html: idle(TN) },
        { T: TD, caption: 'Dusk · The stage, playing: a glass orb with two lines to rise to. The first breath fills it to the dashed line; the top-up takes it to the outer ring, which lights; then a long, slow fall. The mark pressed in, where the others’ sit.', html: inSession(TD, { anim: true }) },
        { T: TS, caption: 'Sunrise · The top-up: the outer ring lit in the tone as the orb meets it.', html: inSession(TS, { scale: 1, lit: true, still: 1 }) },
        { T: TN, ar: true, caption: 'Arabic · The words: شهيق · شهيق قصير آخر · زفير طويل. A part of its own in the graphs, in its tone.', html: inSession(TN, { scale: 0.84, still: 0, ar: true }) },
      ],
    }),
  );
})();

/* ── 3 · The scene sheet, three ways ── */
const SC = [
  { key: 'fire', name: 'Fire', ar: 'نار', line: 'Sit by the fire', img: IMG.fire, rgb: '240,168,104' },
  { key: 'rain', name: 'Rain', ar: 'مطر', line: 'Listen to the rain', img: IMG.rain, rgb: '127,162,236' },
  { key: 'forest', name: 'Creek', ar: 'جدول', line: 'Follow the creek', img: IMG.forest, rgb: '99,207,199' },
  { key: 'ocean', name: 'Ocean', ar: 'بحر', line: 'Drift with the sea', grad: `linear-gradient(180deg, ${K.SCENES.ocean.hi} 0%, ${K.SCENES.ocean.c} 46%, ${K.SCENES.ocean.lo} 100%)`, rgb: '143,155,240' },
];
const photo = (s, style = '') => (s.img ? `<img src="${s.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; ${style}">` : `<span style="position: absolute; inset: 0; background: ${s.grad}; ${style}"></span>`);
const bars = (h = 22) => `<span aria-hidden="true" style="display: flex; gap: 4px; align-items: flex-end; height: ${h}px">${[0, 1, 2, 3].map((b) => `<span style="width: 3px; height: ${h}px; border-radius: 2px; background: #FFFFFF; transform-origin: bottom; animation: bars ${0.8 + b * 0.17}s ease-in-out ${-b * 0.3}s infinite"></span>`).join('')}</span>`;
const sheetOver = (T, height, inner) => `${hero(T, { scene: 'fire' })}
<span style="position: absolute; inset: 0; background: rgba(${T.veil},${T.dark ? 0.45 : 0.18}); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px)"></span>
<div role="dialog" style="position: absolute; left: 0; right: 0; bottom: 0; height: ${height}px; border-radius: 30px 30px 0 0; ${K.glass(T.glassTint, T.dark ? 0.84 : 0.82, 26)}; border-bottom: 0; overflow: hidden">
<span style="position: absolute; left: 175px; top: 12px; width: 40px; height: 5px; border-radius: 3px; background: ${T.dark ? 'rgba(242,236,221,0.25)' : 'rgba(29,43,42,0.18)'}"></span>
${inner}
</div>`;
const heading = (T, title = 'Choose a scene') => `<div style="position: absolute; left: 24px; top: 36px; display: flex; flex-direction: column; gap: 6px">${K.label('Scene', T.accent)}<span style="font-family: ${K.F.display}; font-size: 28px; color: ${text(T)}">${title}</span></div>`;
const cta = (T, top, label = 'Begin by the fire') => `<span style="position: absolute; left: 24px; right: 24px; top: ${top}px; height: 52px; border-radius: 999px; background: ${T.action}; color: ${T.onAction}; font-size: 16.5px; font-weight: 600; display: flex; align-items: center; justify-content: center">${label}</span>`;

/** A · One window: the chosen scene large in an arch, alive; the four as orbs beneath to switch. */
function oneWindow(T) {
  const W = 236, H = 300, x = (390 - W) / 2, y = 100;
  const orb = (s, k) => `<span style="display: flex; flex-direction: column; align-items: center; gap: 8px; width: 72px">
<span style="position: relative; width: 56px; height: 56px; border-radius: 999px; overflow: hidden; ${k === 0 ? `box-shadow: 0 0 0 2px ${T.dark ? M.moonlight : T.text}, 0 0 18px rgba(${s.rgb},0.7)` : `box-shadow: 0 0 0 1px ${T.line}`}">${photo(s)}</span>
<span style="font-size: 13px; font-weight: ${k === 0 ? 600 : 400}; color: ${k === 0 ? text(T) : sub(T)}">${s.name}</span></span>`;
  return sheetOver(
    T,
    700,
    `<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${W}px; height: ${H}px">
<span style="position: absolute; inset: -22px; border-radius: 50%; background: radial-gradient(closest-side, rgba(${SC[0].rgb},0.45), rgba(${SC[0].rgb},0)); filter: blur(6px)"></span>
<span style="position: absolute; inset: 0; ${K.archClip(W, H)}">${photo(SC[0], 'animation: heroDrift 18s ease-in-out infinite')}<span style="position: absolute; left: 0; right: 0; bottom: 0; height: 40%; background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.45))"></span></span>
<span style="position: absolute; left: 20px; bottom: 18px; display: flex; flex-direction: column; gap: 4px"><span style="font-family: ${K.F.display}; font-size: 26px; color: #FFFFFF">Fire</span><span style="font-size: 13.5px; color: rgba(255,255,255,0.85)">Sit by the fire</span></span>
<span style="position: absolute; right: 20px; bottom: 26px">${bars(18)}</span>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: ${y + H + 32}px; display: flex; justify-content: space-between">${SC.map(orb).join('')}</div>
${cta(T, 604)}`,
  );
}
/** B · A strip of windows: tall arches side by side, the chosen one in the middle, the others leaning away. */
function strip(T) {
  const W = 200, H = 290, y = 118;
  const arch = (s, dx, sc, op) => `<div style="position: absolute; left: ${195 - W / 2 + dx}px; top: ${y}px; width: ${W}px; height: ${H}px; transform: scale(${sc}); opacity: ${op}">
<span style="position: absolute; inset: 0; ${K.archClip(W, H)}">${photo(s)}</span>
${sc === 1 ? `<span style="position: absolute; left: ${W / 2 - 14}px; top: ${H / 2 - 11}px">${bars()}</span>` : ''}
</div>`;
  return sheetOver(
    T,
    700,
    `${heading(T)}
${arch(SC[3], -244, 0.8, 0.4)}${arch(SC[1], 216, 0.86, 0.55)}${arch(SC[0], 0, 1, 1)}
<div style="position: absolute; left: 0; right: 0; top: ${y + H + 22}px; display: flex; flex-direction: column; align-items: center; gap: 6px">
<span style="font-family: ${K.F.display}; font-size: 28px; color: ${text(T)}">Fire</span>
<span style="font-size: 14.5px; color: ${sub(T)}">Sit by the fire · sound and video</span>
<span style="display: flex; gap: 6px; margin-top: 8px">${SC.map((_, k) => `<span style="width: ${k === 0 ? 16 : 6}px; height: 6px; border-radius: 3px; background: ${k === 0 ? text(T) : T.line}"></span>`).join('')}</span>
</div>
${cta(T, 604)}`,
  );
}
/** C · Rows: each scene a row, a round window of it at the start; the chosen row lit in its light. */
function rows(T) {
  const rowH = 84, y0 = 118;
  const r = (s, k) => {
    const on = k === 0;
    return `<div style="position: absolute; left: 16px; right: 16px; top: ${y0 + k * (rowH + 10)}px; height: ${rowH}px; border-radius: 22px; box-sizing: border-box; display: flex; align-items: center; gap: 16px; padding: 0 16px; ${on ? `background: rgba(${s.rgb},${T.dark ? 0.14 : 0.16}); border: 1.5px solid rgba(${s.rgb},0.8); box-shadow: 0 0 24px rgba(${s.rgb},0.25)` : `background: ${T.card}; border: 1px solid ${T.line}`}">
<span style="position: relative; flex-shrink: 0; width: 56px; height: 56px; border-radius: 999px; overflow: hidden">${photo(s)}${on ? `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.25)">${bars(16)}</span>` : ''}</span>
<span style="flex: 1; display: flex; flex-direction: column; gap: 4px"><span style="font-family: ${K.F.display}; font-size: 21px; color: ${text(T)}">${s.name}</span><span style="font-size: 13.5px; color: ${sub(T)}">${s.line}</span></span>
${on ? `<span style="width: 26px; height: 26px; border-radius: 999px; background: ${T.dark ? M.moonlight : T.text}; color: ${T.ground}; display: flex; align-items: center; justify-content: center">${icon('check', 15, 2.2)}</span>` : ''}
</div>`;
  };
  return sheetOver(T, 620, `${heading(T)}${SC.map(r).join('')}${cta(T, 524)}`);
}
out.push(
  row('ScenesR2.dc.html', {
    title: 'Round 2 — the scene sheet, three ways',
    css: HERO_CSS,
    phones: [
      { T: TN, caption: 'A, one window (Night) · The chosen scene large in an arch, its photo drifting and its sound playing, its name and line on it; the four as round windows beneath to switch. The most atmospheric.', html: oneWindow(TN) },
      { T: TN, caption: 'B, a strip of windows (Night) · Tall arches side by side; swipe, and the one in the middle is chosen, its sound playing. Like flicking through views.', html: strip(TN) },
      { T: TN, caption: 'C, rows (Night) · A calm list: a round window, the name, its line; the chosen row lit in its scene’s light. The quickest to read and to tap.', html: rows(TN) },
      { T: TS, caption: 'A, Sunrise', html: oneWindow(TS) },
      { T: TS, caption: 'B, Sunrise', html: strip(TS) },
      { T: TS, caption: 'C, Sunrise · In all three the button says what it will do (“Begin by the fire”), so choosing and starting are one step.', html: rows(TS) },
    ],
  }),
);

module.exports = out;
module.exports.TIDE = TIDE;
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}${b.interactive ? ' (interactive)' : ''}`).join('\n'));
