// F · Motion and overlays: six phones, each one piece of the motion language on its own:
// glass over blur, a shared element that grows into its page, controls that step aside, words
// that arrive, glowing pills, and a tab glow that slides.
const K = require('./kit.js');
const { icon } = require('./icons.js');
const N = K.T.night, D = K.T.dusk, S = K.T.sunrise;
const M = K.NIGHT;
const out = [];
const EASE = 'cubic-bezier(.2,.9,.25,1)';

/* ── F1 · A glass sheet rises over the blurred screen ── */
(() => {
  const MOODS = [['Heavy', '#82A4EE'], ['Tense', '#F0B27A'], ['Flat', '#D2CBB9'], ['Calm', '#62D2C9'], ['Bright', '#F2C76B']];
  const chip = ([t, c], i) => `<button type="button" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; border: 0; background: none; color: ${M.mist}; font-size: 13.5px; cursor: pointer; opacity: {{io}}; transform: translateY({{iy}}px); transition: opacity 500ms ease {{d${i}}}, transform 600ms ${EASE} {{d${i}}}"><span style="width: 52px; height: 52px; border-radius: 999px; background: radial-gradient(circle at 40% 35%, #FFFFFF 0%, ${c} 55%); box-shadow: 0 0 16px ${c}"></span>${t}</button>`;
  const body = `
${K.starfield(40, 390, 500, 91)}
<span style="position: absolute; left: ${195 - 60}px; top: 130px">${K.moon(K.phaseOf(K.TODAY), 60, { lit: M.moonlight, dark: 'rgba(242,236,221,0.08)', glow: 'rgba(242,236,221,0.45)' })}</span>
<div style="position: absolute; left: 0; right: 0; top: 300px; display: flex; flex-direction: column; align-items: center; gap: 10px">${K.label("You're not alone", N.accent)}<span style="font-family: ${K.F.display}; font-size: 22px; color: ${M.moonlight}">One light among many.</span></div>
<button type="button" onClick="{{open}}" style="position: absolute; left: 60px; right: 60px; top: 420px; height: 56px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; color: ${M.moonlight}; font-size: 16px; font-weight: 500; cursor: pointer">How are you arriving?</button>
<span style="position: absolute; left: 16px; right: 16px; top: 520px; height: 180px; border-radius: 24px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1)"></span>
<button type="button" onClick="{{close}}" aria-label="Close" style="position: absolute; inset: 0; border: 0; padding: 0; background: rgba(11,16,38,0.45); backdrop-filter: blur({{blur}}px); -webkit-backdrop-filter: blur({{blur}}px); opacity: {{veil}}; pointer-events: {{pe}}; transition: opacity 500ms ease, backdrop-filter 600ms ease; cursor: pointer"></button>
<div role="dialog" aria-label="Check in" style="position: absolute; left: 0; right: 0; bottom: 0; height: 450px; border-radius: 30px 30px 0 0; background: rgba(18,26,62,0.82); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-top: 1px solid rgba(242,236,221,0.14); transform: translateY({{sy}}%); transition: transform 700ms ${EASE}; padding: 14px 24px 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 22px">
<span style="align-self: center; width: 40px; height: 5px; border-radius: 3px; background: rgba(242,236,221,0.25)"></span>
<div style="display: flex; flex-direction: column; gap: 8px; opacity: {{io}}; transform: translateY({{iy}}px); transition: opacity 500ms ease {{dt}}, transform 600ms ${EASE} {{dt}}">
${K.label('Check in', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 28px; color: ${M.moonlight}">How are you arriving?</span>
</div>
<div style="display: flex; gap: 4px">${MOODS.map(chip).join('')}</div>
<span style="font-size: 14.5px; line-height: 1.5; color: ${M.mist}; opacity: {{io}}; transition: opacity 500ms ease {{dn}}">The screen behind softens and dims while the sheet is up; the sheet itself is frosted glass, so the sky still shows through.</span>
<button type="button" onClick="{{close}}" style="height: 52px; border-radius: 999px; border: 0; background: ${M.moonlight}; color: ${M.midnight}; font-size: 16px; font-weight: 600; cursor: pointer; opacity: {{io}}; transition: opacity 500ms ease {{dn}}">Not now</button>
</div>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { open: true };
  }
  renderVals() {
    const o = this.state.open;
    const v = {
      sy: o ? 0 : 110, veil: o ? 1 : 0, blur: o ? 10 : 0, pe: o ? 'auto' : 'none',
      io: o ? 1 : 0, iy: o ? 0 : 18, dt: o ? '200ms' : '0ms', dn: o ? '600ms' : '0ms',
      open: () => this.setState({ open: true }), close: () => this.setState({ open: false }),
    };
    for (let i = 0; i < 5; i++) v['d' + i] = o ? (320 + i * 70) + 'ms' : '0ms';
    return v;
  }
}`;
  out.push(K.board('MotionSheet.dc.html', { title: 'Motion — a glass sheet over blur', root: `background: ${M.midnight}`, body, logic }));
})();

/* ── F2 · A card grows into its page (the shared element), clip-path inset ── */
(() => {
  const CARDS = [
    { img: K.ASSET.forestJpg, tag: 'Workshop · 3 Oct', title: 'Breathing for sleep', where: 'Online · 40 min' },
    { img: K.ASSET.rainJpg, tag: 'Talk · 10 Oct', title: 'Anxiety at work', where: 'Riyadh · 1 hr' },
    { img: K.ASSET.fireJpg, tag: 'Circle · 17 Oct', title: 'Grief, gently', where: 'Online · 1 hr' },
  ];
  const y0 = 150, H = 170, GAP = 16;
  const card = (c, k) => `<div style="position: absolute; left: 16px; right: 16px; top: ${y0 + k * (H + GAP)}px; height: ${H}px; border-radius: 24px; overflow: hidden; opacity: {{dim}}; transition: opacity 400ms ease"><img src="${c.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,16,38,0) 30%, rgba(11,16,38,0.85) 100%)"></span><div style="position: absolute; left: 18px; bottom: 16px; display: flex; flex-direction: column; gap: 4px">${K.label(c.tag, M.mist, 10.5)}<span style="font-size: 19px; font-weight: 600; color: #FFFFFF">${c.title}</span></div></div>`;
  const c0 = CARDS[0];
  const closed = `inset(${y0}px 16px ${844 - y0 - H}px 16px round 24px)`;
  const body = `
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 6px; opacity: {{dim}}; transition: opacity 400ms ease">${K.label('Events', N.accent)}<span style="font-family: ${K.F.display}; font-size: 30px; color: ${M.moonlight}">This month</span></div>
${CARDS.map(card).join('')}
<button type="button" onClick="{{toggle}}" aria-label="Open ${c0.title}" style="position: absolute; left: 16px; right: 16px; top: ${y0}px; height: ${H}px; border: 0; background: none; border-radius: 24px; cursor: pointer"></button>
<div style="position: absolute; inset: 0; background: ${M.midnight}; clip-path: {{clip}}; transition: clip-path 800ms ${EASE}; pointer-events: {{pe}}">
<div style="position: absolute; left: 0; right: 0; top: {{imgTop}}px; height: {{imgH}}px; transition: top 800ms ${EASE}, height 800ms ${EASE}"><img src="${c0.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,16,38,0) 40%, ${M.midnight} 100%)"></span></div>
<div style="position: absolute; left: 34px; top: ${y0 + H - 60}px; display: flex; flex-direction: column; gap: 4px; opacity: {{cap}}; transition: opacity 250ms ease">${K.label(c0.tag, M.mist, 10.5)}<span style="font-size: 19px; font-weight: 600; color: #FFFFFF">${c0.title}</span></div>
<div style="position: absolute; left: 24px; right: 24px; top: 380px; display: flex; flex-direction: column; gap: 12px; opacity: {{ui}}; transform: translateY({{uy}}px); transition: opacity 500ms ease {{ud}}, transform 600ms ${EASE} {{ud}}">
${K.label(c0.tag, N.accent)}
<span style="font-family: ${K.F.display}; font-size: 34px; color: ${M.moonlight}">${c0.title}</span>
<span style="font-size: 15.5px; line-height: 1.55; color: ${M.mist}">${c0.where}. [EVENT DESCRIPTION FROM HOUNA.ORG]</span>
<button type="button" style="margin-top: 12px; height: 56px; border-radius: 999px; border: 0; background: ${M.moonlight}; color: ${M.midnight}; font-size: 17px; font-weight: 600; cursor: pointer">Save my place</button>
</div>
<button type="button" onClick="{{toggle}}" aria-label="Back" style="position: absolute; left: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.16)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer; opacity: {{ui}}; transition: opacity 400ms ease {{ud}}">${icon('back', 20)}</button>
</div>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }
  renderVals() {
    const o = this.state.open;
    return {
      clip: o ? 'inset(0px 0px 0px 0px round 0px)' : '${closed}',
      pe: o ? 'auto' : 'none', dim: o ? 0.2 : 1, cap: o ? 0 : 1,
      imgTop: o ? 0 : ${y0}, imgH: o ? 380 : ${H},
      ui: o ? 1 : 0, uy: o ? 0 : 16, ud: o ? '420ms' : '0ms',
      toggle: () => this.setState({ open: !o }),
    };
  }
}`;
  out.push(K.board('MotionCardExpand.dc.html', { title: 'Motion — a card grows into its page', root: `background: ${M.midnight}`, body, logic }));
})();

/* ── F3 · Controls step aside during practice, and come back to a touch ── */
(() => {
  const L = 12;
  const css = `@keyframes chromeAway { 0%, 22% { opacity: 1 } 32%, 80% { opacity: 0 } 88%, 100% { opacity: 1 } }
@keyframes touch { 0%, 78% { opacity: 0; transform: scale(0.4) } 82% { opacity: 0.8; transform: scale(1) } 90%, 100% { opacity: 0; transform: scale(1.6) } }
@keyframes calmOrb { 0%, 100% { transform: scale(0.7) } 50% { transform: scale(1) } }
@keyframes hintSwap { 0%, 22% { opacity: 0 } 32%, 76% { opacity: 1 } 82%, 100% { opacity: 0 } }`;
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 45%, rgba(179,167,245,0.18), rgba(11,16,38,0) 70%)"></span>
<div aria-hidden="true" style="position: absolute; left: ${195 - 115}px; top: ${400 - 115}px; width: 230px; height: 230px; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3), rgba(179,167,245,0.2) 60%, rgba(179,167,245,0.3)); border: 1px solid rgba(244,240,255,0.35); animation: calmOrb 8s ease-in-out infinite"></div>
<div style="position: absolute; inset: 0; animation: chromeAway ${L}s ease infinite">
<button type="button" aria-label="End" style="position: absolute; left: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}">${icon('close', 20)}</button>
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center">${K.label('Steady mind · box', M.mist)}</span>
<div style="position: absolute; left: 0; right: 0; top: 700px; display: flex; justify-content: center; gap: 36px">
<span style="width: 52px; height: 52px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}">${icon('sound', 20)}</span>
<span style="width: 72px; height: 72px; margin-top: -10px; border-radius: 999px; border: 1.5px solid ${M.moonlight}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}">${icon('pause', 24, 2)}</span>
<span style="width: 52px; height: 52px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}">${icon('timer', 20)}</span>
</div>
</div>
<span aria-hidden="true" style="position: absolute; left: ${195 - 40}px; top: 590px; width: 80px; height: 80px; border-radius: 999px; border: 2px solid rgba(242,236,221,0.7); animation: touch ${L}s ease-out infinite"></span>
<span style="position: absolute; left: 0; right: 0; top: 780px; text-align: center; font-size: 13.5px; color: ${M.haze}; animation: hintSwap ${L}s ease infinite">Nothing but the breath</span>
<span style="position: absolute; left: 40px; right: 40px; top: 640px; text-align: center; font-size: 14px; line-height: 1.5; color: ${M.mist}; animation: hintSwap ${L}s ease infinite">The controls step aside after three seconds; a touch anywhere brings them back.</span>`;
  out.push(K.board('MotionControlsAway.dc.html', { title: 'Motion — controls step aside', root: `background: ${M.midnight}`, css, body }));
})();

/* ── F4 · Words that arrive: Latin letter by letter, Arabic word by word (its letters join) ── */
(() => {
  const EN = 'Take a slow breath with us.';
  const AR = 'خذ نفسًا بطيئًا معنا.';
  const css = ['A', 'B'].map((x) => `@keyframes letter${x} { from { opacity: 0; filter: blur(6px); transform: translateY(8px) } to { opacity: 1; filter: blur(0); transform: none } }`).join('\n');
  let i = 0;
  const en = EN.split(' ').map((w) => `<span style="white-space: nowrap">${[...w].map((ch) => `<span style="display: inline-block; animation: letter{{x}} 700ms ease ${(i++ * 45)}ms both">${ch}</span>`).join('')}</span>`).join(' ');
  const start = i * 45 + 500;
  const arw = AR.split(' ').map((w, j) => `<span style="display: inline-block; animation: letter{{x}} 900ms ease ${start + j * 260}ms both">${w}</span>`).join(' ');
  const body = `
<button type="button" onClick="{{replay}}" aria-label="Replay" style="position: absolute; right: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.08)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('replay', 20)}</button>
<div style="position: absolute; left: 32px; right: 32px; top: 200px; display: flex; flex-direction: column; gap: 14px">
${K.label('Latin · letter by letter', M.haze)}
<span style="font-family: ${K.F.display}; font-size: 38px; line-height: 1.25; color: ${M.moonlight}">${en}</span>
</div>
<div dir="rtl" style="position: absolute; left: 32px; right: 32px; top: 440px; display: flex; flex-direction: column; gap: 14px">
${K.arLabel('العربية · كلمة كلمة', M.haze)}
<span lang="ar" style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 42px; line-height: 1.5; color: ${M.moonlight}">${arw}</span>
</div>
<span style="position: absolute; left: 32px; right: 32px; top: 660px; font-size: 14.5px; line-height: 1.55; color: ${M.mist}">Arabic letters join, so they can't arrive one at a time; whole words fade and sharpen in, a little slower.</span>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { n: 0 };
  }
  renderVals() {
    return { x: this.state.n % 2 ? 'B' : 'A', replay: () => this.setState({ n: this.state.n + 1 }) };
  }
}`;
  out.push(K.board('MotionWords.dc.html', { title: 'Motion — words that arrive', root: `background: ${M.midnight}`, css, body, logic }));
})();

/* ── F5 · Glowing pills in each theme, with the pressed state (dim, one change) ── */
(() => {
  const css = `@keyframes ringTurn { to { transform: rotate(360deg) } }
.pill:active { opacity: 0.85 }`;
  const panel = (T, label, ar, top) => `<div style="position: absolute; left: 0; right: 0; top: ${top}px; height: 260px; background: ${T.ground}; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 0 32px; box-sizing: border-box">
${K.label(T.name, T.ter)}
<div style="position: relative; height: 58px">
<span aria-hidden="true" style="position: absolute; inset: -2px; border-radius: 999px; overflow: hidden; filter: blur(0.3px)"><span style="position: absolute; left: 50%; top: 50%; width: 460px; height: 460px; margin: -230px 0 0 -230px; background: conic-gradient(${T.tone.glow}, ${T.tone.dusk}, ${T.tone.dawn}, ${T.tone.bloom}, ${T.tone.glow}); animation: ringTurn 5s linear infinite"></span></span>
<span aria-hidden="true" style="position: absolute; left: -6px; right: -6px; top: 4px; bottom: -10px; border-radius: 999px; background: linear-gradient(90deg, ${T.hue.glow}, ${T.hue.dusk}, ${T.hue.dawn}, ${T.hue.bloom}); filter: blur(16px); opacity: 0.45; animation: glowPulse 5s ease-in-out infinite"></span>
<button type="button" class="pill" style="position: absolute; inset: 0; border-radius: 999px; border: 0; background: ${T.key === 'night' ? M.moonlight : T.accent}; color: ${T.key === 'night' ? M.midnight : '#FFFFFF'}; font-size: 17px; font-weight: 600; cursor: pointer">${label}</button>
</div>
<button type="button" class="pill" style="height: 52px; border-radius: 999px; border: 1px solid ${T.ctrlLine}; background: ${T.ctrl}; color: ${T.text}; font-family: ${K.F.arBody}; font-size: 16px; cursor: pointer">${ar}</button>
</div>`;
  const body = `${panel(N, 'Continue', 'متابعة', 40)}${panel(D, 'Begin', 'ابدأ', 310)}${panel(S, 'Save', 'حفظ', 580)}`;
  out.push(K.board('MotionPills.dc.html', { title: 'Motion — glowing pills, three themes', root: `background: ${M.midnight}`, css, body }));
})();

/* ── F6 · The tab glow slides; three ways, one selection ── */
(() => {
  const TABS = ['Meditate', 'Breathe', 'Journal', 'Discover'];
  const TW = 86, X0 = (390 - 4 * TW) / 2;
  const tabs = (row) => TABS.map((t, k) => `<button type="button" onClick="{{pick${k}}}" style="position: relative; width: ${TW}px; height: 48px; border: 0; background: none; font-size: 15.5px; font-weight: 500; color: {{c${k}}}; transition: color 400ms ease; cursor: pointer">${t}</button>`).join('');
  const row = (top, name, indicator) => `<div style="position: absolute; left: 0; right: 0; top: ${top}px; height: 140px">
<span style="position: absolute; left: 24px; top: 0">${K.label(name, M.haze)}</span>
${indicator}
<div style="position: absolute; left: ${X0}px; top: 50px; display: flex">${tabs()}</div>
</div>`;
  const glow = `<span aria-hidden="true" style="position: absolute; left: {{gx}}px; top: 40px; width: 120px; height: 68px; border-radius: 999px; background: radial-gradient(closest-side, rgba(242,236,221,0.3), rgba(242,236,221,0)); transition: left 520ms cubic-bezier(.3,1.3,.5,1)"></span>`;
  const line = `<span aria-hidden="true" style="position: absolute; left: {{lx}}px; top: 96px; width: {{lw}}px; height: 2px; border-radius: 2px; background: ${M.moonlight}; transition: left 420ms ${EASE}, width 420ms ${EASE}"></span>`;
  const pill = `<span aria-hidden="true" style="position: absolute; left: ${X0 - 4}px; top: 46px; width: ${4 * TW + 8}px; height: 56px; border-radius: 999px; background: rgba(242,236,221,0.06)"></span><span aria-hidden="true" style="position: absolute; left: {{px}}px; top: 50px; width: ${TW}px; height: 48px; border-radius: 999px; background: rgba(242,236,221,0.14); box-shadow: 0 0 18px rgba(111,214,207,0.25); transition: left 480ms cubic-bezier(.3,1.2,.5,1)"></span>`;
  const body = `
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 6px">${K.label('Motion', N.accent)}<span style="font-family: ${K.F.display}; font-size: 30px; color: ${M.moonlight}">Where you are</span></div>
${row(170, 'Glow (Open)', glow)}${row(340, 'Line', line)}${row(510, 'Pill', pill)}
<span style="position: absolute; left: 24px; right: 24px; top: 690px; font-size: 14.5px; line-height: 1.5; color: ${M.mist}">Tap any row: all three follow. The glow overshoots a touch and settles, like a breath out.</span>`;
  const LW = [60, 56, 52, 64];
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { t: 0 };
  }
  renderVals() {
    const t = this.state.t, lw = ${JSON.stringify(LW)};
    const v = { gx: ${X0} + ${TW} * t + ${TW / 2} - 60, px: ${X0} + ${TW} * t, lw: lw[t], lx: ${X0} + ${TW} * t + (${TW} - lw[t]) / 2 };
    for (let k = 0; k < 4; k++) {
      v['c' + k] = t === k ? '${M.moonlight}' : '${M.haze}';
      v['pick' + k] = () => this.setState({ t: k });
    }
    return v;
  }
}`;
  out.push(K.board('MotionTabs.dc.html', { title: 'Motion — the tab glow slides', root: `background: ${M.midnight}`, body, logic }));
})();

module.exports = out;
if (require.main === module) console.log(out.map((b) => b.file).join('\n'));
