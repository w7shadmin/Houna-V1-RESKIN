// "Houna — Motion (phase 1)": the six picked motion pieces from the Explorations canvas
// (design/explorations/PICKS.md, section F), each drawn on the real screen it changes, in Sunrise,
// Dusk and Night side by side. One board per piece; taps work where they help.
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const { icon } = require('../../explorations/scripts/icons.js');
const { home } = require('./make-home-appearance.js');
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;
const EASE = 'cubic-bezier(.2,.9,.25,1)';
const IMG = { fire: '/_blob/7c99911711a722bf7be51333530fc3d5', rain: '/_blob/47b246ff9979484918668ac0d1eb12f8', forest: '/_blob/e173a53444705a10fd79abba02075afe' };

/* The three themes with what these boards need beyond kit.T: the primary action and its text, a sheet's glass, and Home's body. */
const THEMES = ['sunrise', 'dusk', 'night'].map((k) => {
  const T = K.T[k];
  return {
    ...T,
    action: { sunrise: '#196662', dusk: '#1B2140', night: M.moonlight }[k],
    onAction: k === 'night' ? M.midnight : '#FFFFFF',
    glassTint: k === 'night' ? '18,26,62' : '255,255,255',
    glassA: k === 'night' ? 0.8 : 0.78,
    veil: k === 'night' ? '11,16,38' : '29,43,42',
    disc: { sunrise: K.DISCS.sunrise, dusk: K.DISCS.dusk, night: K.DISCS.teal }[k],
    surface: k === 'night' ? 'rgba(242,236,221,0.06)' : '#FFFFFF',
  };
});

const PW = 390, PH = 844, PAD = 40, GAP = 40;
const W = PAD * 2 + 3 * PW + 2 * GAP, H = PAD + PH + 76;
/** One board: three phones (Sunrise, Dusk, Night) with a caption under each. */
function trio(file, { title, phone, captions, css = '', logic, lang = 'en' }) {
  const body = THEMES.map((T, i) => `<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; background: ${T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35)">${phone(T, i)}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${T.name}</span>${captions && captions[i] ? `<span style="font-size: 13px; color: ${M.mist}">${captions[i]}</span>` : ''}</div>`).join('\n');
  return K.board(file, { title, lang, w: W, h: H, root: `background: #070B1C`, css, body, logic, dir: DIR });
}
const homeWithBody = (T) => `${home(T, { hero: 'none' })}<span style="position: absolute; left: ${195 - 66}px; top: ${206 - 66}px; width: 132px; height: 132px; border-radius: 999px; background: ${T.disc.stops}; box-shadow: 0 0 30px rgba(${T.disc.glow},0.5)">${K.pressedMark(64, T.disc.surface)}</span>`;
const toggleLogic = (initial) => `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { open: ${initial} };
  }
  renderVals() {
    const o = this.state.open;
    return {
      sy: o ? 0 : 112, veil: o ? 1 : 0, blur: o ? 10 : 0, pe: o ? 'auto' : 'none', pe2: o ? 'none' : 'auto',
      io: o ? 1 : 0, iy: o ? 0 : 18, d1: o ? '220ms' : '0ms', d2: o ? '300ms' : '0ms', d3: o ? '380ms' : '0ms', d4: o ? '460ms' : '0ms',
      clip: o ? 'inset(0px 0px 0px 0px round 0px)' : '{{CLOSED}}', imgTop: o ? 0 : {{IMGTOP}}, imgH: o ? 380 : {{IMGH}}, cap: o ? 0 : 1, dim: o ? 0.2 : 1,
      open: () => this.setState({ open: true }), close: () => this.setState({ open: false }), toggle: () => this.setState({ open: !o }),
    };
  }
}`;
const out = [];

/* ── 1 · The mood check-in as a glass sheet over Home ── */
(() => {
  const moods = ['#82A4EE', '#D2CBB9', '#62D2C9', '#9BD67E', '#F2C76B'];
  const phone = (T) => {
    const dark = T.key === 'night';
    const item = (inner, d) => `<div style="opacity: {{io}}; transform: translateY({{iy}}px); transition: opacity 500ms ease {{${d}}}, transform 600ms ${EASE} {{${d}}}">${inner}</div>`;
    return `${homeWithBody(T)}
<button type="button" onClick="{{open}}" aria-label="Check in" style="position: absolute; left: 16px; top: 22px; width: 44px; height: 44px; border-radius: 999px; border: 0; background: none; cursor: pointer; pointer-events: {{pe2}}"></button>
<span style="position: absolute; left: 70px; top: 34px; font-size: 12px; color: ${T.accent}; opacity: {{dim}}; transition: opacity 300ms ease">← tap to check in</span>
<button type="button" onClick="{{close}}" aria-label="Close" style="position: absolute; inset: 0; border: 0; padding: 0; background: rgba(${T.veil},${dark ? 0.45 : 0.18}); backdrop-filter: blur({{blur}}px); -webkit-backdrop-filter: blur({{blur}}px); opacity: {{veil}}; pointer-events: {{pe}}; transition: opacity 500ms ease, backdrop-filter 600ms ease; cursor: pointer"></button>
<div role="dialog" aria-label="Check in" style="position: absolute; left: 0; right: 0; bottom: 0; height: 520px; border-radius: 30px 30px 0 0; ${K.glass(T.glassTint, T.glassA, 26)}; border-bottom: 0; transform: translateY({{sy}}%); transition: transform 700ms ${EASE}; padding: 14px 24px 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px">
<span style="align-self: center; width: 40px; height: 5px; border-radius: 3px; background: ${dark ? 'rgba(242,236,221,0.25)' : 'rgba(29,43,42,0.18)'}"></span>
${item(`<span style="display: block; font-family: ${K.F.display}; font-size: 26px; line-height: 1.2; color: ${T.text}">How are you feeling right now?</span>`, 'd1')}
${item(`<div style="display: flex; justify-content: center"><span style="width: 118px; height: 118px; border-radius: 999px; background: radial-gradient(circle at 40% 35%, #FFFFFF 0%, #62D2C9 55%, #1F7A74 100%); box-shadow: 0 0 40px rgba(98,210,201,0.55)"></span></div>`, 'd2')}
${item(`<div style="display: flex; flex-direction: column; gap: 10px"><div style="position: relative; height: 8px; border-radius: 4px; background: linear-gradient(90deg, ${moods.join(', ')})"><span style="position: absolute; left: 56%; top: -9px; width: 26px; height: 26px; border-radius: 999px; background: #FFFFFF; box-shadow: 0 2px 10px rgba(0,0,0,0.25)"></span></div><div style="display: flex; justify-content: space-between; font-size: 13.5px; color: ${T.sec}"><span>Heavier</span><span>Lighter</span></div></div>`, 'd3')}
${item(`<div style="display: flex; flex-direction: column; gap: 12px"><span style="height: 48px; border-radius: 16px; background: ${dark ? 'rgba(242,236,221,0.06)' : 'rgba(29,43,42,0.05)'}; display: flex; align-items: center; padding: 0 16px; font-size: 15px; color: ${T.ter}">What's on your mind?</span><button type="button" onClick="{{close}}" style="height: 54px; border-radius: 999px; border: 0; background: ${T.action}; color: ${T.onAction}; font-size: 16.5px; font-weight: 600; cursor: pointer">Save to journal</button></div>`, 'd4')}
</div>`;
  };
  out.push(trio('MotionPhaseSheet.dc.html', {
    title: 'Motion — the check-in as a glass sheet', phone,
    captions: ['The screen softens and dims; the sheet is frosted, so Home shows through.', 'Items arrive one after another as the sheet settles.', 'Tap outside or Save and it sinks back.'],
    logic: toggleLogic(true).replace("'{{CLOSED}}'", "''").replace('{{IMGTOP}}', '0').replace('{{IMGH}}', '0'),
  }));
})();

/* ── 2 · An event card grows into its page ── */
(() => {
  const y0 = 196, CH = 176;
  const closed = `inset(${y0}px 16px ${PH - y0 - CH}px 16px round 24px)`;
  const EV = [{ img: IMG.forest, tag: 'Workshop · 3 Oct', title: 'Breathing for sleep' }, { img: IMG.rain, tag: 'Talk · 10 Oct', title: 'Anxiety at work' }, { img: IMG.fire, tag: 'Circle · 17 Oct', title: 'Grief, gently' }];
  const phone = (T) => {
    const dark = T.key === 'night';
    const card = (e, k) => `<div style="position: absolute; left: 16px; right: 16px; top: ${y0 + k * (CH + 14)}px; height: ${CH}px; border-radius: 24px; overflow: hidden; opacity: {{dim}}; transition: opacity 400ms ease"><img src="${e.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,16,38,0) 35%, rgba(11,16,38,0.82) 100%)"></span><div style="position: absolute; left: 18px; bottom: 16px; display: flex; flex-direction: column; gap: 4px">${K.label(e.tag, 'rgba(255,255,255,0.8)', 10.5)}<span style="font-size: 19px; font-weight: 600; color: #FFFFFF">${e.title}</span></div></div>`;
    const e = EV[0];
    return `
<div style="position: absolute; left: 20px; top: 64px; display: flex; flex-direction: column; gap: 14px; opacity: {{dim}}; transition: opacity 400ms ease"><span style="font-family: ${K.F.display}; font-size: 32px; color: ${T.text}">Events</span>
<span style="display: flex; gap: 8px">${['All', 'Workshops', 'Talks'].map((c, i) => `<span style="height: 36px; padding: 0 14px; border-radius: 999px; display: flex; align-items: center; font-size: 14px; ${i === 0 ? `background: ${T.action}; color: ${T.onAction}` : `background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; color: ${T.sec}`}">${c}</span>`).join('')}</span></div>
${EV.map(card).join('')}
<button type="button" onClick="{{toggle}}" aria-label="Open ${e.title}" style="position: absolute; left: 16px; right: 16px; top: ${y0}px; height: ${CH}px; border: 0; background: none; border-radius: 24px; cursor: pointer; pointer-events: {{pe2}}"></button>
<div style="position: absolute; inset: 0; background: ${T.ground}; clip-path: {{clip}}; transition: clip-path 800ms ${EASE}; pointer-events: {{pe}}">
<div style="position: absolute; left: 0; right: 0; top: {{imgTop}}px; height: {{imgH}}px; transition: top 800ms ${EASE}, height 800ms ${EASE}"><img src="${e.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover"><span style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,16,38,0) 45%, ${T.ground} 100%)"></span></div>
<div style="position: absolute; left: 34px; top: ${y0 + CH - 60}px; display: flex; flex-direction: column; gap: 4px; opacity: {{cap}}; transition: opacity 250ms ease">${K.label(e.tag, 'rgba(255,255,255,0.8)', 10.5)}<span style="font-size: 19px; font-weight: 600; color: #FFFFFF">${e.title}</span></div>
<div style="position: absolute; left: 24px; right: 24px; top: 400px; display: flex; flex-direction: column; gap: 12px; opacity: {{io}}; transform: translateY({{iy}}px); transition: opacity 500ms ease {{d3}}, transform 600ms ${EASE} {{d3}}">
${K.label(e.tag, T.accent)}
<span style="font-family: ${K.F.display}; font-size: 32px; color: ${T.text}">${e.title}</span>
<span style="font-size: 15px; line-height: 1.55; color: ${T.sec}">Online · 40 min. [EVENT DESCRIPTION FROM HOUNA.ORG]</span>
<button type="button" style="margin-top: 10px; height: 54px; border-radius: 999px; border: 0; background: ${T.action}; color: ${T.onAction}; font-size: 16.5px; font-weight: 600; cursor: pointer">Save my place</button>
</div>
<button type="button" onClick="{{toggle}}" aria-label="Back" style="position: absolute; left: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('11,16,38', 0.35)}; display: flex; align-items: center; justify-content: center; color: #FFFFFF; cursor: pointer; opacity: {{io}}; transition: opacity 400ms ease {{d3}}">${icon('back', 20)}</button>
</div>`;
  };
  out.push(trio('MotionPhaseCard.dc.html', {
    title: 'Motion — an event card grows into its page', phone,
    captions: ['Tap the first card: the photo stays put and becomes the page’s header.', 'The rest of the list fades back; nothing jumps.', 'Back shrinks it into its card again.'],
    logic: toggleLogic(false).replace("'{{CLOSED}}'", JSON.stringify(closed)).replace('{{IMGTOP}}', y0).replace('{{IMGH}}', CH),
  }));
})();

/* ── 3 · Controls step aside during a breathing session ── */
(() => {
  const L = 12;
  const css = `@keyframes chromeAway { 0%, 22% { opacity: 1 } 32%, 80% { opacity: 0 } 88%, 100% { opacity: 1 } }
@keyframes touch { 0%, 78% { opacity: 0; transform: scale(0.4) } 82% { opacity: 0.8; transform: scale(1) } 90%, 100% { opacity: 0; transform: scale(1.6) } }
@keyframes calmOrb { 0%, 100% { transform: scale(0.72) } 50% { transform: scale(1) } }
@keyframes w1 { 0%, 45% { opacity: 1 } 50%, 95% { opacity: 0 } 100% { opacity: 1 } }
@keyframes w2 { 0%, 45% { opacity: 0 } 50%, 95% { opacity: 1 } 100% { opacity: 0 } }`;
  const phone = (T) => {
    const dark = T.key === 'night';
    const dots = Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * 2 * Math.PI - Math.PI / 2; const s = 2.5 + 3 * Math.sin((i / 28) * Math.PI); return `<span style="position: absolute; left: ${(195 + 150 * Math.cos(a) - s / 2).toFixed(1)}px; top: ${(380 + 150 * Math.sin(a) - s / 2).toFixed(1)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: ${T.tone.glow}; opacity: ${(0.3 + 0.7 * Math.sin((i / 28) * Math.PI)).toFixed(2)}"></span>`; }).join('');
    return `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 45%, rgba(${K.rgbOf(T.hue.glow)},${dark ? 0.18 : 0.14}), rgba(0,0,0,0) 70%)"></span>
${dots}
<div aria-hidden="true" style="position: absolute; left: ${195 - 110}px; top: ${380 - 110}px; width: 220px; height: 220px; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,${dark ? 0.32 : 0.8}), rgba(${K.rgbOf(T.hue.glow)},0.2) 60%, rgba(${K.rgbOf(T.hue.glow)},0.32)); border: 1px solid rgba(${K.rgbOf(T.hue.glow)},0.45); animation: calmOrb 8s ease-in-out infinite">${K.pressedMark(70, T.hue.glow)}</div>
<div style="position: absolute; left: 0; right: 0; top: 590px; height: 40px; font-family: ${K.F.display}; font-size: 26px; color: ${T.text}"><span style="position: absolute; inset: 0; text-align: center; animation: w1 8s ease infinite">Breathe in</span><span style="position: absolute; inset: 0; text-align: center; opacity: 0; animation: w2 8s ease infinite">Breathe out</span></div>
<div style="position: absolute; inset: 0; animation: chromeAway ${L}s ease infinite">
<span style="position: absolute; left: 16px; top: 52px; width: 44px; height: 44px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; display: flex; align-items: center; justify-content: center; color: ${T.text}; box-sizing: border-box">${icon('close', 18)}</span>
<span style="position: absolute; left: 0; right: 0; top: 62px; display: flex; justify-content: center; gap: 22px; font-size: 15px; font-weight: 600"><span style="color: ${T.text}; border-bottom: 2px solid ${T.accent}; padding-bottom: 8px">Breathe</span><span style="color: ${T.ter}">Meditate</span><span style="color: ${T.ter}">Discover</span></span>
<div style="position: absolute; left: 0; right: 0; top: 670px; display: flex; flex-direction: column; align-items: center; gap: 14px">
<span style="font-size: 14px; color: ${T.sec}">Round 2 of 4 · 1:12 left</span>
<span style="width: 68px; height: 68px; border-radius: 999px; border: 1.5px solid ${T.text}; display: flex; align-items: center; justify-content: center; color: ${T.text}">${icon('pause', 22, 2)}</span>
</div>
</div>
<span aria-hidden="true" style="position: absolute; left: ${195 - 40}px; top: 480px; width: 80px; height: 80px; border-radius: 999px; border: 2px solid ${T.accent}; animation: touch ${L}s ease-out infinite"></span>`;
  };
  out.push(trio('MotionPhaseControls.dc.html', {
    title: 'Motion — controls step aside during practice', phone, css,
    captions: ['After three seconds of stillness the header, round and pause fade.', 'Only the orb and the phase word stay.', 'A touch anywhere brings them back (the ring shows it).'],
  }));
})();

/* ── 4 · Words that arrive: Home's line, English letter by letter, Arabic word by word ── */
(() => {
  const css = ['A', 'B'].map((x) => `@keyframes letter${x} { from { opacity: 0; filter: blur(6px); transform: translateY(8px) } to { opacity: 1; filter: blur(0); transform: none } }`).join('\n');
  const LINES = { sunrise: 'Small pauses, taken together, change a day.', dusk: 'أنت نورٌ بين أنوارٍ كثيرة.', night: 'You are one light among many.' };
  const phone = (T) => {
    const ar = T.key === 'dusk';
    let i = 0;
    const text = LINES[T.key];
    const line = ar
      ? text.split(' ').map((w, j) => `<span style="display: inline-block; animation: letter{{x}} 900ms ease ${300 + j * 260}ms both">${w}</span>`).join(' ')
      : text.split(' ').map((w) => `<span style="white-space: nowrap">${[...w].map((ch) => `<span style="display: inline-block; animation: letter{{x}} 700ms ease ${300 + i++ * 40}ms both">${ch}</span>`).join('')}</span>`).join(' ');
    return `${homeWithBody(T)}
<span style="position: absolute; left: 0; right: 0; top: 290px; height: 100px; background: ${T.ground}"></span>
${T.stars ? `<span style="position: absolute; left: 0; right: 0; top: 290px; height: 100px">${K.starfield(6, 390, 100, 5)}</span>` : ''}
<div ${ar ? 'dir="rtl" ' : ''}style="position: absolute; left: 24px; right: 24px; top: 298px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
${ar ? K.arLabel('لست وحدك', T.accent, 13) : K.label("● You're not alone", T.accent, 11.5)}
<span ${ar ? 'lang="ar" ' : ''}style="font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700; ' : ''}font-size: ${ar ? 22 : 20}px; line-height: 1.35; color: ${T.text}">${line}</span>
</div>
<button type="button" onClick="{{replay}}" aria-label="Replay" style="position: absolute; right: 16px; top: 80px; height: 40px; padding: 0 14px; border-radius: 999px; border: 1px solid ${T.ctrlLine}; background: ${T.ctrl}; color: ${T.text}; font-size: 13.5px; display: flex; align-items: center; gap: 6px; cursor: pointer; z-index: 2">${icon('replay', 16)}Replay</button>`;
  };
  out.push(trio('MotionPhaseWords.dc.html', {
    title: 'Motion — Home’s line arrives', phone, css,
    captions: ['Latin arrives letter by letter.', 'Arabic arrives word by word: its letters join, so they can’t come one at a time.', 'Each new line of the rotation arrives the same way.'],
    logic: `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { n: 0 };
  }
  renderVals() {
    return { x: this.state.n % 2 ? 'B' : 'A', replay: () => this.setState({ n: this.state.n + 1 }) };
  }
}`,
  }));
})();

/* ── 5 · One glowing pill per screen, for the step that matters ── */
(() => {
  const css = `@keyframes ringTurn { to { transform: rotate(360deg) } }
.pill:active { opacity: 0.85 }`;
  const pill = (T, label) => `<div style="position: relative; height: 58px">
<span aria-hidden="true" style="position: absolute; left: -6px; right: -6px; top: 4px; bottom: -10px; border-radius: 999px; background: linear-gradient(90deg, ${T.hue.glow}, ${T.hue.dusk}, ${T.hue.dawn}, ${T.hue.bloom}); filter: blur(16px); opacity: ${T.key === 'night' ? 0.45 : 0.35}; animation: glowPulse 5s ease-in-out infinite"></span>
<span aria-hidden="true" style="position: absolute; inset: -2px; border-radius: 999px; overflow: hidden"><span style="position: absolute; left: 50%; top: 50%; width: 460px; height: 460px; margin: -230px 0 0 -230px; background: conic-gradient(${T.tone.glow}, ${T.tone.dusk}, ${T.tone.dawn}, ${T.tone.bloom}, ${T.tone.glow}); animation: ringTurn 5s linear infinite"></span></span>
<button type="button" class="pill" style="position: absolute; inset: 0; border-radius: 999px; border: 0; background: ${T.action}; color: ${T.onAction}; font-size: 17px; font-weight: 600; cursor: pointer">${label}</button>
</div>`;
  const quiet = (T, label) => `<button type="button" class="pill" style="height: 52px; border-radius: 999px; border: 1px solid ${T.ctrlLine}; background: ${T.ctrl}; color: ${T.text}; font-size: 16px; cursor: pointer">${label}</button>`;
  const SCREENS = {
    sunrise: { eyebrow: 'Discover · WHO-5', title: 'How have you been<br>over the last two weeks?', body: 'Five statements, about two minutes. A reflection, not a diagnosis.', main: 'Begin', second: 'Not now' },
    dusk: { eyebrow: 'Anxiety relief · 4-7-8', title: 'Three minutes<br>to slow down', body: 'In for 4, hold for 7, out for 8. Stop whenever you like.', main: 'Start breathing', second: 'Change length' },
    night: { eyebrow: 'Welcome', title: 'That’s all<br>Houna asks.', body: 'One breath at a time, whenever you need it.', main: 'Continue', second: 'I already have an alias' },
  };
  const phone = (T) => {
    const S = SCREENS[T.key];
    return `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 40% at 50% 30%, rgba(${K.rgbOf(T.hue.glow)},${T.key === 'night' ? 0.14 : 0.1}), rgba(0,0,0,0) 70%)"></span>
<span style="position: absolute; left: ${195 - 70}px; top: 170px; width: 140px; height: 140px; border-radius: 999px; background: ${T.disc.stops}; box-shadow: 0 0 34px rgba(${T.disc.glow},0.5)">${K.pressedMark(68, T.disc.surface)}</span>
<div style="position: absolute; left: 28px; right: 28px; top: 360px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center">
${K.label(S.eyebrow, T.accent)}
<span style="font-family: ${K.F.display}; font-size: 30px; line-height: 1.2; color: ${T.text}">${S.title}</span>
<span style="font-size: 15.5px; line-height: 1.5; color: ${T.sec}">${S.body}</span>
</div>
<div style="position: absolute; left: 28px; right: 28px; top: 668px; display: flex; flex-direction: column; gap: 14px">${pill(T, S.main)}${quiet(T, S.second)}</div>`;
  };
  out.push(trio('MotionPhasePill.dc.html', {
    title: 'Motion — one glowing pill per screen', phone, css,
    captions: ['Discover: starting a reflection.', 'Tanafas: starting a session.', 'First run: the way in. Pressing dims it, one change, as every control does.'],
  }));
})();

/* ── 6 · The Tanafas tabs: three styles, tap to compare ── */
(() => {
  const TABS = ['Breathe', 'Meditate', 'Discover'];
  const TW = 100, X0 = (390 - 3 * TW) / 2;
  const phone = (T) => {
    const tabs = (id) => TABS.map((t, k) => `<button type="button" onClick="{{pick${k}}}" style="position: relative; width: ${TW}px; height: 44px; border: 0; background: none; font-size: 15px; font-weight: 600; color: {{${id}${k}${T.key}}}; transition: color 400ms ease; cursor: pointer">${t}</button>`).join('');
    const row = (top, name, ind, id = 'c') => `<div style="position: absolute; left: 0; right: 0; top: ${top}px; height: 120px">
<span style="position: absolute; left: 24px; top: 0">${K.label(name, T.ter)}</span>${ind}
<div style="position: absolute; left: ${X0}px; top: 40px; display: flex">${tabs(id)}</div></div>`;
    const glow = `<span aria-hidden="true" style="position: absolute; left: {{gx}}px; top: 28px; width: 130px; height: 68px; border-radius: 999px; background: radial-gradient(closest-side, rgba(${K.rgbOf(T.hue.glow)},${T.key === 'night' ? 0.35 : 0.3}), rgba(${K.rgbOf(T.hue.glow)},0)); transition: left 520ms cubic-bezier(.3,1.3,.5,1)"></span>`;
    const line = `<span aria-hidden="true" style="position: absolute; left: {{lx}}px; top: 84px; width: {{lw}}px; height: 2px; border-radius: 2px; background: ${T.accent}; transition: left 420ms ${EASE}, width 420ms ${EASE}"></span>`;
    const pillBg = `<span aria-hidden="true" style="position: absolute; left: ${X0 - 4}px; top: 36px; width: ${3 * TW + 8}px; height: 52px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box"></span><span aria-hidden="true" style="position: absolute; left: {{px}}px; top: 40px; width: ${TW}px; height: 44px; border-radius: 999px; background: ${T.key === 'night' ? 'rgba(242,236,221,0.14)' : T.action}; box-shadow: 0 0 16px rgba(${K.rgbOf(T.hue.glow)},0.3); transition: left 480ms cubic-bezier(.3,1.2,.5,1)"></span>`;
    return `
<span style="position: absolute; left: 16px; top: 52px; width: 44px; height: 44px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; display: flex; align-items: center; justify-content: center; color: ${T.text}; box-sizing: border-box">${icon('close', 18)}</span>
<span style="position: absolute; left: 24px; top: 120px; font-family: ${K.F.display}; font-size: 28px; color: ${T.text}">Tanafas</span>
${row(190, 'Glow (Open)', glow)}${row(340, 'Line (today, sliding)', line)}${row(490, 'Pill', pillBg, 'p')}
<span style="position: absolute; left: 24px; right: 24px; top: 660px; font-size: 14.5px; line-height: 1.5; color: ${T.sec}">Tap a tab in any row: all three follow, in every theme. The pill's selected fill follows the theme's action colour.</span>`;
  };
  const cols = Object.fromEntries(THEMES.map((T) => [T.key, [T.text, T.ter, T.key === 'night' ? M.moonlight : '#FFFFFF']]));
  const LW = [58, 66, 64];
  out.push(trio('MotionPhaseTabs.dc.html', {
    title: 'Motion — the Tanafas tabs, three styles', phone,
    captions: ['', '', ''],
    logic: `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { t: 1 };
  }
  renderVals() {
    const t = this.state.t, lw = ${JSON.stringify(LW)}, cols = ${JSON.stringify(cols)};
    const v = { gx: ${X0} + ${TW} * t + ${TW / 2} - 65, px: ${X0} + ${TW} * t, lw: lw[t], lx: ${X0} + ${TW} * t + (${TW} - lw[t]) / 2 };
    for (let k = 0; k < 3; k++) {
      v['pick' + k] = () => this.setState({ t: k });
      for (const key of Object.keys(cols)) { v['c' + k + key] = t === k ? cols[key][0] : cols[key][1]; v['p' + k + key] = t === k ? cols[key][2] : cols[key][1]; }
    }
    return v;
  }
}`,
  }));
})();

module.exports = out;
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}`).join('\n'));
