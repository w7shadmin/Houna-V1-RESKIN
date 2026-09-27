// "Houna — First run (phase 5)": the picked boards from the Explorations canvas (PICKS.md, section G).
// Decided 28 Sep: the splash replaces today's on every launch, with each theme's own body rising
// (Night's crescent bowl, Sunrise's star-lattice sun, Dusk's evening sun) and the wordmark settling
// beneath, handing over to Home's body on "Sun & moon"; the first breath, shown once before anything
// is asked, carries a small English · العربية switch.
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const { helpers } = require('./make-bodies-phase.js');
const { bowl, starSun, duskSun, homeScreen, BASE } = helpers;
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;

const THEMES = ['sunrise', 'dusk', 'night'].map((k) => ({ ...K.T[k], dark: k === 'night' }));
const [TS, TD, TN] = THEMES;
const PW = 390, PH = 844, PAD = 40, GAP = 40;
function row(file, { title, phones, css = '' }) {
  const W = PAD * 2 + phones.length * PW + (phones.length - 1) * GAP, H = PAD + PH + 100;
  const body = phones
    .map((p, i) => {
      const [name, ...rest] = p.caption.split(' · ');
      return `<div${p.ar ? ' dir="rtl"' : ''} style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; background: ${p.T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); font-family: ${p.ar ? K.F.arBody : K.F.body}">${p.html}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${name}</span>${rest.length ? `<span style="font-size: 13px; color: ${M.mist}">${rest.join(' · ')}</span>` : ''}</div>`;
    })
    .join('\n');
  return K.board(file, { title, w: W, h: H, root: 'background: #070B1C', css, body, dir: DIR });
}
const lab = (t, color, ar, size) => (ar ? K.arLabel(t, color, (size || 11) + 2) : K.label(t, color, size || 11));
const out = [];

/* ── 1 · The splash: the theme's body rises, the wordmark settles under it ── */
(() => {
  const L = 6;
  const css = `${BASE}
@keyframes bodyIn { 0% { opacity: 0; transform: translateY(124px) translateY(30px) scale(0.92) } 22%, 84% { opacity: 1; transform: translateY(124px) } 100% { opacity: 0; transform: translateY(124px) } }
@keyframes wordIn { 0%, 16% { opacity: 0; transform: translateY(8px) } 34%, 84% { opacity: 1; transform: none } 100% { opacity: 0 } }
@keyframes glowIn { 0%, 10% { opacity: 0 } 30%, 84% { opacity: 1 } 100% { opacity: 0 } }`;
  // The bodies are drawn in Home's 190px box at Home's spot; the splash sets them 124px lower, in the middle.
  const body = (T) => (T.key === 'night' ? bowl('s' + T.key) : T.key === 'dusk' ? `<div style="position: absolute; left: 100px; top: 111px; width: 190px; height: 190px">${duskSun()}</div>` : `<div style="position: absolute; left: 100px; top: 111px; width: 190px; height: 190px">${starSun()}</div>`);
  const splash = (T, ar = false) => `
<div style="position: absolute; inset: 0; animation: bodyIn ${L}s ease infinite">${body(T)}</div>
<div style="position: absolute; left: 0; right: 0; top: 500px; display: flex; flex-direction: column; align-items: center; gap: 14px; animation: wordIn ${L}s ease infinite">
${K.logo(T.logoP, T.logoS, 150)}
${lab(ar ? 'تنفّس · استرح · عُد' : 'Breathe · rest · return', T.ter, ar)}
</div>`;
  // The handoff on "Sun & moon": the body glides up to where Home draws it, as Home comes in round it.
  const handoff = `<div style="position: absolute; inset: 0; opacity: 0.55">${homeScreen(TN)}</div>
<div style="position: absolute; inset: 0; background: ${TN.ground}; opacity: 0.45"></div>
${bowl('h5')}
<svg aria-hidden="true" width="390" height="844" style="position: absolute; inset: 0"><path d="M195 ${206 + 124} V ${206 + 24}" stroke="rgba(242,236,221,0.35)" stroke-width="1.2" stroke-dasharray="3 5" fill="none"></path></svg>
<div style="position: absolute; left: 0; right: 0; top: 520px; display: flex; flex-direction: column; align-items: center; gap: 14px; opacity: 0.25">${K.logo(TN.logoP, TN.logoS, 150)}</div>`;
  out.push(
    row('FirstSplashP5.dc.html', {
      title: 'Phase 5 — the splash, each theme’s body',
      css,
      phones: [
        { T: TS, caption: 'Sunrise · Every launch: the star-lattice sun rises into the middle as the wordmark settles beneath it, then Houna opens (about 3s, as today’s).', html: splash(TS) },
        { T: TD, caption: 'Dusk · The evening sun, the same way.', html: splash(TD) },
        { T: TN, caption: 'Night · The crescent bowl, the mark resting in it.', html: splash(TN) },
        { T: TN, caption: 'Into Home (“Sun & moon”) · The body glides up to its place on Home as Home comes in round it and the wordmark fades: one body, never two. Classic, and the first run, simply fade.', html: handoff },
      ],
    }),
  );
})();

/* ── 2 · The first breath: shown once, before anything is asked ── */
(() => {
  const L = 24;
  const p = (s) => ((s / L) * 100).toFixed(2);
  const showKf = (name, a, b) => `@keyframes ${name} { 0%, ${p(a)}% { opacity: 0; transform: translateY(8px) } ${p(a + 0.8)}%, ${p(b - 0.6)}% { opacity: 1; transform: none } ${p(b)}%, 100% { opacity: 0 } }`;
  const css = `${showKf('t1', 0.3, 3.2)}
${showKf('t2', 3.4, 6.4)}
${showKf('t3', 6.4, 10.4)}
${showKf('t4', 10.4, 12.4)}
${showKf('t5', 12.4, 18.4)}
@keyframes tEnd { 0%, ${p(18.6)}% { opacity: 0; transform: translateY(10px) } ${p(19.6)}%, 100% { opacity: 1; transform: none } }
@keyframes orbLife { 0%, ${p(6)}% { opacity: 0; transform: scale(0.55) } ${p(6.6)}% { opacity: 1; transform: scale(0.6) } ${p(10.4)}% { transform: scale(1) } ${p(12.4)}% { transform: scale(1) } ${p(18.4)}% { transform: scale(0.6) } ${p(19.4)}%, 100% { opacity: 1; transform: scale(0.6) } }`;
  const hue = K.rgbOf(TN.hue.glow);
  const orb = (style) => `<div aria-hidden="true" style="position: absolute; left: ${195 - 120}px; top: ${340 - 120}px; width: 240px; height: 240px; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.32) 0%, rgba(${hue},0.16) 45%, rgba(${hue},0.26) 100%); border: 1px solid rgba(${hue},0.45); box-shadow: 0 0 40px rgba(${hue},0.25); ${style}">${K.pressedMark(86, '#2E6F76')}</div>`;
  const top = (ar) => `<div style="position: absolute; left: 16px; right: 16px; top: 56px; height: 44px; display: flex; align-items: center; justify-content: space-between">
<span style="display: flex; padding: 3px; border-radius: 999px; background: rgba(242,236,221,0.06); border: 1px solid rgba(242,236,221,0.12)"><span style="padding: 6px 12px; border-radius: 999px; background: ${ar ? 'transparent' : M.moonlight}; color: ${ar ? M.mist : M.midnight}; font-size: 13px; font-weight: 600">English</span><span style="padding: 6px 12px; border-radius: 999px; background: ${ar ? M.moonlight : 'transparent'}; color: ${ar ? M.midnight : M.mist}; font-family: ${K.F.arBody}; font-size: 13px; font-weight: 600">العربية</span></span>
<span style="font-size: 14px; color: ${M.mist}">${ar ? 'ليس الآن' : 'Not now'}</span>
</div>`;
  const line = (t, kf, ar) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; opacity: 0; animation: ${kf} ${L}s ease infinite; ${ar ? `font-family: ${K.F.arDisplay}; font-weight: 700;` : ''}">${t}</span>`;
  const text = (inner, ar) => `<div style="position: absolute; left: 32px; right: 32px; top: 560px; height: 100px; font-family: ${ar ? K.F.arDisplay : K.F.display}; font-size: ${ar ? 30 : 28}px; line-height: 1.35; color: ${M.moonlight}">${inner}</div>`;
  const still = (t, ar) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; ${ar ? 'font-weight: 700;' : ''}">${t}</span>`;
  const button = (t, style = '') => `<div style="position: absolute; left: 32px; right: 32px; top: 700px; ${style}"><span style="display: flex; height: 56px; border-radius: 999px; background: ${M.moonlight}; color: ${M.midnight}; font-size: 17px; font-weight: 600; align-items: center; justify-content: center">${t}</span></div>`;
  const ground = `<span style="position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 40%, rgba(${hue},0.14), rgba(11,16,38,0) 70%)"></span>${K.starfield(30, 390, 844, 101)}`;
  const playing = `${ground}${top(false)}
${orb(`opacity: 0; animation: orbLife ${L}s ease-in-out infinite`)}
${text(`${line('Welcome.', 't1')}${line('Before anything else,<br>let’s breathe once together.', 't2')}${line('Breathe in…', 't3')}${line('Hold, gently.', 't4')}${line('And all the way out.', 't5')}${line('That’s all Houna asks.', 'tEnd')}`)}
${button('Continue', `opacity: 0; animation: tEnd ${L}s ease infinite`)}`;
  const inFrame = `${ground}${top(false)}${orb('transform: scale(0.85)')}${text(still('Breathe in…'))}`;
  const endFrame = `${ground}${top(false)}${orb('transform: scale(0.6)')}${text(still('That’s all Houna asks.'))}${button('Continue')}`;
  const arEnd = `${ground}${top(true)}${orb('transform: scale(0.6)')}${text(still('هذا كل ما تطلبه هُنا.', true), true)}${button('<span style="font-family: ' + K.F.arBody + '">متابعة</span>')}`;
  out.push(
    row('FirstBreathP5.dc.html', {
      title: 'Phase 5 — one breath together, once',
      css,
      phones: [
        { T: TN, caption: 'The first run · Shown once, before anything is asked: a welcome, one guided breath (in 4, hold 2, out 6, timed in breathPatterns), then Continue to Home. Plays through.', html: playing },
        { T: TN, caption: 'Breathing in · The 4-7-8 glass orb with the pressed mark, filling as the words say. “Not now” skips at any moment; nothing is counted or asked.', html: inFrame },
        { T: TN, caption: 'The end · Continue opens Home, and the first run never shows again. With Reduce Motion the words come without the orb moving.', html: endFrame },
        { T: TN, ar: true, caption: 'Arabic · Choosing العربية at the top restarts in Arabic, as the language setting does, and the breath begins again.', html: arEnd },
      ],
    }),
  );
})();

module.exports = out;
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}`).join('\n'));
