// "Houna — Players (phase 2)": the picked player boards from the Explorations canvas
// (design/explorations/PICKS.md, sections A and B) on the Tanafas hub, in Sunrise, Dusk and Night.
// Decided 27 Sep: the Today hero is the hub's Meditate tab; the scene arches and the minutes wheel
// open from it as glass sheets; 4-7-8 gets the glass orb, box breathing the star; the orbit board's
// ground is offered as the breathing-session backdrop.
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const { icon } = require('../../explorations/scripts/icons.js');
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;
const EASE = 'cubic-bezier(.2,.9,.25,1)';
const IMG = { fire: '/_blob/7c99911711a722bf7be51333530fc3d5', rain: '/_blob/47b246ff9979484918668ac0d1eb12f8', forest: '/_blob/e173a53444705a10fd79abba02075afe' };
const F478 = K.BREATH.four78, BOX = K.BREATH.box;
const C478 = K.cycleOf(F478), CBOX = K.cycleOf(BOX);

const THEMES = ['sunrise', 'dusk', 'night'].map((k) => {
  const T = K.T[k];
  const dark = k === 'night';
  return {
    ...T,
    dark,
    action: { sunrise: '#196662', dusk: '#1B2140', night: M.moonlight }[k],
    onAction: dark ? M.midnight : '#FFFFFF',
    glassTint: dark ? '18,26,62' : '255,255,255',
    veil: dark ? '11,16,38' : '29,43,42',
    // How strongly a scene's photo shows through the hero: deep at night, a pale wash by day.
    wash: dark ? 'rgba(11,16,38,0.35)' : `rgba(${K.rgbOf(T.ground)},0.55)`,
  };
});
const PW = 390, PH = 844, PAD = 40, GAP = 40;
function trio(file, { title, phone, captions, css = '', logic, themes = THEMES, lang = 'en' }) {
  const W = PAD * 2 + themes.length * PW + (themes.length - 1) * GAP, H = PAD + PH + 76;
  const body = themes.map((T, i) => `<div${lang === 'ar' ? ' dir="rtl"' : ''} style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; background: ${T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); font-family: ${lang === 'ar' ? K.F.arBody : K.F.body}">${phone(T, i)}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${captions && captions[i] ? captions[i].split(' · ')[0] : T.name}</span>${captions && captions[i] && captions[i].includes(' · ') ? `<span style="font-size: 13px; color: ${M.mist}">${captions[i].split(' · ').slice(1).join(' · ')}</span>` : ''}</div>`).join('\n');
  return K.board(file, { title, w: W, h: H, root: 'background: #070B1C', css, body, logic, dir: DIR });
}

/* ── The hub's header: close · Breathe · Meditate · Discover (the glow under the chosen) · journal ── */
function header(T, selected, ar = false) {
  const tabs = ar ? ['تنفّس', 'تأمل', 'اكتشف'] : ['Breathe', 'Meditate', 'Discover'];
  const TW = 96, x0 = (390 - 3 * TW) / 2;
  const i = ['breathe', 'meditate', 'discover'].indexOf(selected);
  const gx = ar ? 390 - (x0 + TW * i + TW / 2) : x0 + TW * i + TW / 2;
  return `<span style="position: absolute; ${ar ? 'right' : 'left'}: 16px; top: 52px; width: 44px; height: 44px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: ${T.text}">${icon('close', 18)}</span>
<span aria-hidden="true" style="position: absolute; left: ${gx - 62}px; top: 40px; width: 124px; height: 68px; border-radius: 999px; background: radial-gradient(closest-side, rgba(${K.rgbOf(T.hue.glow)},${T.dark ? 0.34 : 0.3}), rgba(${K.rgbOf(T.hue.glow)},0))"></span>
<div style="position: absolute; left: ${x0}px; top: 52px; width: ${3 * TW}px; height: 44px; display: flex">${tabs.map((t, k) => `<span style="flex: 1; display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 600; color: ${k === i ? T.text : T.ter}">${t}</span>`).join('')}</div>
<span style="position: absolute; ${ar ? 'left' : 'right'}: 16px; top: 52px; width: 44px; height: 44px; border-radius: 999px; display: flex; align-items: center; justify-content: center; color: ${T.text}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2.5"></rect><path d="M9 8h6M9 12h6M9 16h3"></path></svg></span>`;
}

/* ── The Meditate hero: the chosen scene's photo, blurred and drifting, under a large title and a glowing play ring ── */
const SCENE = { fire: { en: 'Sit by<br>the fire', ar: 'اجلس<br>قرب النار', name: 'Fire', nameAr: 'نار' }, rain: { en: 'Listen to<br>the rain', ar: 'أنصت<br>للمطر', name: 'Rain', nameAr: 'مطر' } };
function hero(T, { ar = false, scene = 'fire' } = {}) {
  const S = SCENE[scene];
  const text = T.dark ? M.moonlight : T.text;
  const sub = T.dark ? M.mist : T.sec;
  const row = (label, value, top) => `<button type="button" style="position: absolute; left: 16px; right: 16px; top: ${top}px; height: 56px; border-radius: 18px; ${K.glass(T.dark ? '242,236,221' : '255,255,255', T.dark ? 0.07 : 0.6)}; display: flex; align-items: center; gap: 12px; padding: 0 16px; color: ${text}; font-family: inherit; font-size: 15.5px; cursor: pointer; text-align: start"><span style="color: ${sub}">${label}</span><span style="flex: 1; text-align: end; font-weight: 600">${value}</span><span style="color: ${sub}; ${ar ? 'transform: scaleX(-1)' : ''}">${icon('next', 18)}</span></button>`;
  return `
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 0; height: 640px; overflow: hidden">
<img src="${IMG[scene]}" alt="" style="position: absolute; left: -40px; top: -40px; width: 470px; height: 720px; object-fit: cover; filter: blur(28px) saturate(1.1); animation: heroDrift 18s ease-in-out infinite">
<span style="position: absolute; inset: 0; background: ${T.wash}"></span>
<span style="position: absolute; left: 0; right: 0; bottom: -2px; height: 322px; background: linear-gradient(180deg, rgba(${K.rgbOf(T.ground)},0) 0%, ${T.ground} 85%)"></span>
</div>
${header(T, 'meditate', ar)}
<div style="position: absolute; ${ar ? 'right' : 'left'}: 24px; top: 130px; display: flex; flex-direction: column; gap: 4px">
${ar ? K.arLabel(K.gregorian(K.TODAY, 'ar'), sub) : K.label(K.gregorian(K.TODAY, 'en'), sub)}
<span style="font-family: ${ar ? K.F.arDisplay : K.F.body}; font-weight: ${ar ? 700 : 300}; font-size: 20px; color: ${text}">${K.hijri(K.TODAY, ar ? 'ar' : 'en')}</span>
</div>
<div style="position: absolute; ${ar ? 'right' : 'left'}: 24px; top: 420px; width: 230px; display: flex; flex-direction: column; gap: 8px">
<span style="font-size: 15px; color: ${sub}">${ar ? 'تأمل · ١٠ دقائق' : 'Meditate · 10 min'}</span>
<span style="font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700; ' : 'text-transform: uppercase; '}font-size: ${ar ? 44 : 42}px; line-height: ${ar ? 1.3 : 1.02}; color: ${text}">${ar ? S.ar : S.en}</span>
</div>
<button type="button" aria-label="${ar ? 'ابدأ' : 'Begin'}" style="position: absolute; ${ar ? 'left' : 'right'}: 24px; top: 480px; width: 80px; height: 80px; border-radius: 999px; border: 1.5px solid ${text}; background: ${T.dark ? 'rgba(242,236,221,0.05)' : 'rgba(255,255,255,0.35)'}; box-shadow: 0 0 26px rgba(${K.rgbOf(T.hue.glow)},0.45); display: flex; align-items: center; justify-content: center; color: ${text}; animation: glowPulse 5s ease-in-out infinite; cursor: pointer">${icon('play', 26)}</button>
${row(ar ? 'المشهد' : 'Scene', ar ? S.nameAr : S.name, 640)}
${row(ar ? 'المدة' : 'Length', ar ? '١٠ دقائق' : '10 min', 708)}
<span style="position: absolute; left: 24px; right: 24px; top: 784px; text-align: center; font-size: 13px; color: ${T.ter}">${ar ? 'الفيديو والصوت يعملان · يمكنك تغييرهما أثناء الجلسة' : 'Video and sound on · change them during the session'}</span>`;
}
const HERO_CSS = `@keyframes heroDrift { 0%, 100% { transform: translate(0,0) scale(1.05) } 50% { transform: translate(-18px,14px) scale(1.12) } }`;
const out = [];

/* ── 1 · The Meditate tab is the hero ── */
out.push(trio('PlayersHero.dc.html', {
  title: 'Players — the Meditate tab as a hero', css: HERO_CSS, phone: (T) => hero(T),
  captions: ['Sunrise · The scene’s own photo, softened into the sky; by day a pale wash keeps it light.', 'Dusk · Tap Scene or Length and they open as glass sheets over the hero.', 'Night · Play starts the full-screen player, as today.'],
}));

/* ── 2 · Choosing a scene: the arches, in a glass sheet over the hero ── */
(() => {
  const SC = [{ key: 'fire', name: 'Fire', img: IMG.fire }, { key: 'rain', name: 'Rain', img: IMG.rain }, { key: 'forest', name: 'Creek', img: IMG.forest }, { key: 'ocean', name: 'Ocean', grad: `linear-gradient(180deg, ${K.SCENES.ocean.hi} 0%, ${K.SCENES.ocean.c} 46%, ${K.SCENES.ocean.lo} 100%)` }];
  const W = 114, H = 162, GAPX = 28;
  const x0 = (390 - 2 * W - GAPX) / 2;
  const phone = (T) => {
    const text = T.dark ? M.moonlight : T.text;
    const cell = (s, k) => {
      const x = x0 + (k % 2) * (W + GAPX), y = 350 + Math.floor(k / 2) * (H + 46);
      return `<button type="button" onClick="{{pick${k}}}" aria-label="${s.name}" style="position: absolute; left: ${x}px; top: ${y}px; width: ${W}px; height: ${H + 36}px; border: 0; padding: 0; background: none; cursor: pointer">
<span style="position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform: scale({{s${k}}}); transition: transform 500ms cubic-bezier(.3,1.3,.5,1)">
<span style="position: absolute; inset: 0; ${K.archClip(W, H)}">${s.img ? `<img src="${s.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover">` : `<span style="position: absolute; inset: 0; background: ${s.grad}"></span>`}</span>
<svg width="${W + 8}" height="${H + 8}" viewBox="-4 -4 ${W + 8} ${H + 8}" aria-hidden="true" style="position: absolute; left: -4px; top: -4px; overflow: visible; opacity: {{sel${k}}}; transition: opacity 400ms ease"><path d="${K.archPath(W, H)}" fill="none" stroke="${text}" stroke-width="2.5"></path></svg>
<span aria-hidden="true" style="position: absolute; left: ${W / 2 - 14}px; top: ${H / 2 - 11}px; display: flex; gap: 4px; align-items: flex-end; height: 22px; opacity: {{sel${k}}}; transition: opacity 400ms ease">${[0, 1, 2, 3].map((b) => `<span style="width: 3px; height: 22px; border-radius: 2px; background: #FFFFFF; transform-origin: bottom; animation: bars ${0.8 + b * 0.17}s ease-in-out ${-b * 0.3}s infinite"></span>`).join('')}</span>
</span>
<span style="position: absolute; left: 0; right: 0; top: ${H + 10}px; text-align: center; font-size: 15px; font-weight: {{w${k}}}; color: ${text}">${s.name}</span>
</button>`;
    };
    return `${hero(T, { scene: 'fire' })}
<span style="position: absolute; inset: 0; background: rgba(${T.veil},${T.dark ? 0.45 : 0.18}); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px)"></span>
<div role="dialog" aria-label="Choose a scene" style="position: absolute; left: 0; right: 0; bottom: 0; height: 620px; border-radius: 30px 30px 0 0; ${K.glass(T.glassTint, T.dark ? 0.8 : 0.78, 26)}; border-bottom: 0">
<span style="position: absolute; left: 175px; top: 12px; width: 40px; height: 5px; border-radius: 3px; background: ${T.dark ? 'rgba(242,236,221,0.25)' : 'rgba(29,43,42,0.18)'}"></span>
<div style="position: absolute; left: 24px; top: 36px; display: flex; flex-direction: column; gap: 6px">${K.label('Scene', T.accent)}<span style="font-family: ${K.F.display}; font-size: 28px; color: ${text}">Choose a scene</span></div>
</div>
${SC.map(cell).join('')}
<button type="button" style="position: absolute; left: 24px; right: 24px; top: 776px; height: 52px; border-radius: 999px; border: 0; background: ${T.action}; color: ${T.onAction}; font-size: 16.5px; font-weight: 600; cursor: pointer">Choose {{name}}</button>`;
  };
  out.push(trio('PlayersScenes.dc.html', {
    title: 'Players — choosing a scene (arches, glass sheet)', css: HERO_CSS, phone,
    captions: ['Sunrise · The app’s four scenes in mihrab arches; the chosen one outlined, its sound playing (the bars).', 'Dusk · Tap an arch to choose it; the hero’s sky becomes that scene when the sheet closes.', 'Night · The sheet is the phase-1 glass sheet.'],
    logic: `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 0 };
  }
  renderVals() {
    const s = this.state.sel, names = ${JSON.stringify(SC.map((x) => x.name))};
    const v = { name: names[s] };
    for (let k = 0; k < 4; k++) {
      v['sel' + k] = s === k ? 1 : 0;
      v['s' + k] = s === k ? 1.04 : 1;
      v['w' + k] = s === k ? 600 : 400;
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`,
  }));
})();

/* ── 3 · Choosing a length: the minutes wheel, in a glass sheet ── */
(() => {
  const OPTS = [{ n: '5', u: 'min' }, { n: '10', u: 'min' }, { n: '20', u: 'min' }, { n: '∞', u: 'no limit' }];
  const ROW = 70, VIEW = 280;
  const phone = (T) => {
    const text = T.dark ? M.moonlight : T.text;
    const item = (o, k) => `<button type="button" onClick="{{pick${k}}}" style="height: ${ROW}px; width: 100%; border: 0; background: none; cursor: pointer; display: flex; align-items: baseline; justify-content: center; gap: 10px; color: ${text}; opacity: {{op${k}}}; transform: scale({{sc${k}}}); transition: opacity 500ms ease, transform 500ms cubic-bezier(.3,1.2,.5,1)"><span style="font-weight: 300; font-size: 50px; line-height: ${ROW}px; font-variant-numeric: tabular-nums">${o.n}</span><span style="font-size: 22px; font-weight: 300; opacity: {{uo${k}}}; transition: opacity 400ms ease">${o.u}</span></button>`;
    return `${hero(T)}
<span style="position: absolute; inset: 0; background: rgba(${T.veil},${T.dark ? 0.45 : 0.18}); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px)"></span>
<div role="dialog" aria-label="Choose a length" style="position: absolute; left: 0; right: 0; bottom: 0; height: 520px; border-radius: 30px 30px 0 0; ${K.glass(T.glassTint, T.dark ? 0.8 : 0.78, 26)}; border-bottom: 0">
<span style="position: absolute; left: 175px; top: 12px; width: 40px; height: 5px; border-radius: 3px; background: ${T.dark ? 'rgba(242,236,221,0.25)' : 'rgba(29,43,42,0.18)'}"></span>
<div style="position: absolute; left: 24px; top: 36px; display: flex; flex-direction: column; gap: 6px">${K.label('Length', T.accent)}<span style="font-family: ${K.F.display}; font-size: 28px; color: ${text}">How long?</span></div>
<div style="position: absolute; left: 0; right: 0; top: 116px; height: ${VIEW}px; overflow: hidden; -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 28%, #000 72%, transparent 100%); mask-image: linear-gradient(180deg, transparent 0%, #000 28%, #000 72%, transparent 100%)">
<div style="position: absolute; left: 0; right: 0; top: 0; transform: translateY({{ty}}px); transition: transform 600ms cubic-bezier(.25,1.1,.4,1)">${OPTS.map(item).join('')}</div>
</div>
<button type="button" style="position: absolute; left: 24px; right: 24px; top: 424px; height: 52px; border-radius: 999px; border: 0; background: ${T.action}; color: ${T.onAction}; font-size: 16.5px; font-weight: 600; cursor: pointer">Done</button>
</div>`;
  };
  out.push(trio('PlayersMinutes.dc.html', {
    title: 'Players — choosing a length (minutes wheel)', css: HERO_CSS, phone,
    captions: ['Sunrise · Today’s four lengths (5 · 10 · 20 · no limit) on a wheel; tap one to bring it to the middle.', 'Dusk · Numbers in Figtree Light.', 'Night · Done sinks the sheet; the hero shows the new length.'],
    logic: `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 1 };
  }
  renderVals() {
    const s = this.state.sel;
    const v = { ty: ${(VIEW - ROW) / 2} - s * ${ROW} };
    for (let k = 0; k < ${OPTS.length}; k++) {
      const d = Math.abs(k - s);
      v['op' + k] = d === 0 ? 1 : d === 1 ? 0.45 : 0.2;
      v['sc' + k] = d === 0 ? 1.12 : 0.9;
      v['uo' + k] = d === 0 ? 1 : 0;
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`,
  }));
})();

/* Phase words shown in turn across a breath (keyframes named per cycle length). */
function wordKeyframes(words, cycle) {
  let t = 0;
  return words.map((w, i) => { const a = (t / cycle) * 100, b = ((t + w.s) / cycle) * 100; t += w.s; const f = 1.2; return a === 0 ? `@keyframes ph${i}_${Math.round(cycle)} { 0% { opacity: 0 } ${f}% { opacity: 1 } ${(b - f).toFixed(2)}% { opacity: 1 } ${b.toFixed(2)}% { opacity: 0 } 100% { opacity: 0 } }` : `@keyframes ph${i}_${Math.round(cycle)} { 0% { opacity: 0 } ${a.toFixed(2)}% { opacity: 0 } ${(a + f).toFixed(2)}% { opacity: 1 } ${(Math.min(b, 100) - f).toFixed(2)}% { opacity: 1 } ${Math.min(b, 100).toFixed(2)}% { opacity: 0 }${b < 100 ? ' 100% { opacity: 0 }' : ''} }`; }).join('\n');
}

/* ── 4 · 4-7-8: the glass orb, the word inside ── */
(() => {
  const words = F478.map((p) => ({ s: p.s, label: { inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out' }[p.key] }));
  const inner = F478.map((p) => ({ s: p.s, label: { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' }[p.key] }));
  const css = `${K.breathKeyframes('orb478', F478, (f) => `transform: scale(${f ? 1 : 0.6})`)}
${K.breathKeyframes('halo478', F478, (f) => `transform: scale(${f ? 1.2 : 0.7}); opacity: ${f ? 0.9 : 0.35}`)}
@keyframes mote { from { transform: translateY(0); opacity: 0 } 15% { opacity: 0.7 } to { transform: translateY(-300px); opacity: 0 } }
${wordKeyframes(inner, C478)}`;
  const phone = (T) => {
    const hue = K.rgbOf(T.hue.glow);
    const motes = Array.from({ length: 12 }, (_, i) => `<span style="position: absolute; left: ${(i * 53 + 23) % 390}px; top: ${420 + ((i * 97) % 160)}px; width: ${1.5 + (i % 3)}px; height: ${1.5 + (i % 3)}px; border-radius: 999px; background: ${T.dark ? 'rgba(242,236,221,0.7)' : `rgba(${hue},0.6)`}; animation: mote ${12 + (i % 5) * 3}s linear ${-i * 1.7}s infinite"></span>`).join('');
    let t = 0;
    const innerWords = inner.map((w, i) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; animation: ph${i}_${Math.round(C478)} ${C478}s linear infinite">${w.label}</span>`).join('');
    return `
<span style="position: absolute; inset: 0; background: radial-gradient(90% 55% at 50% 36%, rgba(${hue},${T.dark ? 0.2 : 0.16}) 0%, rgba(0,0,0,0) 70%)"></span>
${motes}
${header(T, 'breathe')}
<span aria-hidden="true" style="position: absolute; left: ${195 - 170}px; top: ${320 - 170}px; width: 340px; height: 340px; border-radius: 999px; background: radial-gradient(closest-side, rgba(${hue},0.32), rgba(${hue},0)); animation: halo478 ${C478}s linear infinite"></span>
<div aria-hidden="true" style="position: absolute; left: ${195 - 120}px; top: ${320 - 120}px; width: 240px; height: 240px; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,${T.dark ? 0.32 : 0.85}) 0%, rgba(${hue},0.16) 45%, rgba(${hue},0.26) 100%); box-shadow: inset 0 0 40px rgba(255,255,255,${T.dark ? 0.2 : 0.5}), 0 0 40px rgba(${hue},0.25); border: 1px solid rgba(${hue},0.45); animation: orb478 ${C478}s linear infinite"></div>
<div style="position: absolute; left: 95px; top: 300px; width: 200px; height: 40px; font-weight: 300; font-size: 30px; color: ${T.dark ? '#FFFFFF' : T.text}">${innerWords}</div>
<div style="position: absolute; left: 0; right: 0; top: 520px; display: flex; flex-direction: column; align-items: center; gap: 10px">
<span style="font-family: ${K.F.display}; font-size: 26px; color: ${T.dark ? M.moonlight : T.text}">Anxiety Relief Breathing</span>
${K.label('Round 2 of 10', T.ter, 11)}
</div>
<div style="position: absolute; left: 55px; right: 55px; top: 660px; display: flex; flex-direction: column; align-items: center; gap: 10px"><span style="width: 100%; height: 4px; border-radius: 2px; background: ${T.line}"><span style="display: block; width: 38%; height: 100%; border-radius: 2px; background: ${T.tone.glow}"></span></span>${K.label('1:52 left', T.ter, 11)}</div>
<span style="position: absolute; left: 155px; top: 730px; width: 80px; height: 80px; border-radius: 999px; background: ${T.action}; box-shadow: 0 0 36px rgba(${hue},0.35); display: flex; align-items: center; justify-content: center; color: ${T.onAction}">${icon('pause', 26, 2)}</span>`;
  };
  out.push(trio('PlayersOrb.dc.html', {
    title: 'Players — 4-7-8 with the glass orb', css, phone,
    captions: ['Sunrise · The phase word sits inside the orb as it fills and empties (4 · 7 · 8).', 'Dusk · The exercise’s title and round sit below; the controls step aside (phase 1).', 'Night · Motes drift up; the glow breathes with the orb.'],
  }));
})();

/* ── 5 · Box breathing: the star ── */
(() => {
  const cx = 195, cy = 320, r = 124, half = r / Math.SQRT2;
  const perim = `M${cx - half} ${cy - half} H${cx + half} V${cy + half} H${cx - half} Z`;
  const T2 = CBOX * 2, pct = (s) => ((s / T2) * 100).toFixed(2);
  const words = BOX.map((p) => ({ s: p.s, label: { inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out' }[p.key] }));
  const css = `@keyframes turnBox { 0% { transform: rotate(0deg) } ${pct(4)}% { transform: rotate(0deg) } ${pct(8)}% { transform: rotate(22.5deg) } ${pct(12)}% { transform: rotate(22.5deg) } ${pct(16)}% { transform: rotate(45deg) } ${pct(20)}% { transform: rotate(45deg) } ${pct(24)}% { transform: rotate(67.5deg) } ${pct(28)}% { transform: rotate(67.5deg) } 100% { transform: rotate(90deg) } }
@keyframes starOn { 0%, ${pct(14)}% { opacity: 0 } ${pct(16)}% { opacity: 0.9 } ${pct(20)}% { opacity: 0.9 } ${pct(22)}%, 100% { opacity: 0 } }
@keyframes traceBox { from { offset-distance: 0% } to { offset-distance: 100% } }
${wordKeyframes(words, CBOX)}`;
  const phone = (T) => {
    const tone = T.tone.dusk, hue = K.rgbOf(T.hue.dusk);
    const text = T.dark ? M.moonlight : T.text;
    let t = 0;
    const ws = words.map((w, i) => `<span style="position: absolute; inset: 0; display: flex; justify-content: center; opacity: 0; animation: ph${i}_${Math.round(CBOX)} ${CBOX}s linear infinite">${w.label}</span>`).join('');
    return `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 38%, rgba(${hue},${T.dark ? 0.18 : 0.14}), rgba(0,0,0,0) 70%)"></span>
${header(T, 'breathe')}
<svg width="390" height="640" viewBox="0 0 390 640" aria-hidden="true" style="position: absolute; left: 0; top: 0; overflow: visible">
<polygon points="${K.star8(cx, cy, r)}" fill="rgba(${hue},0.2)" stroke="${tone}" stroke-width="1.5" style="animation: starOn ${T2}s linear infinite"></polygon>
<polygon points="${K.squarePts(cx, cy, r, 45)}" fill="none" stroke="${T.dark ? 'rgba(242,236,221,0.5)' : 'rgba(29,43,42,0.35)'}" stroke-width="1.2"></polygon>
<g style="transform-origin: ${cx}px ${cy}px; animation: turnBox ${T2}s ease-in-out infinite"><polygon points="${K.squarePts(cx, cy, r, 45)}" fill="none" stroke="${tone}" stroke-width="1.2" opacity="0.85"></polygon></g>
</svg>
<span aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 14px; height: 14px; border-radius: 999px; background: ${T.dark ? '#FFFFFF' : tone}; box-shadow: 0 0 16px 5px rgba(${hue},0.75); offset-anchor: center; offset-path: path('${perim}'); offset-rotate: 0deg; animation: traceBox ${CBOX}s linear infinite"></span>
${K.mark(40, tone).replace('position: absolute; left: 50%; top: 50%;', `position: absolute; left: ${cx}px; top: ${cy}px; opacity: 0.8;`)}
<div style="position: absolute; left: 0; right: 0; top: 500px; height: 36px; font-family: ${K.F.display}; font-size: 27px; color: ${text}">${ws}</div>
<div style="position: absolute; left: 0; right: 0; top: 548px; display: flex; flex-direction: column; align-items: center; gap: 8px"><span style="font-size: 15px; color: ${T.sec}">Steady Mind Breathing</span>${K.label('Round 3 of 12', T.ter, 11)}</div>
<div style="position: absolute; left: 55px; right: 55px; top: 660px; display: flex; flex-direction: column; align-items: center; gap: 10px"><span style="width: 100%; height: 4px; border-radius: 2px; background: ${T.line}"><span style="display: block; width: 24%; height: 100%; border-radius: 2px; background: ${tone}"></span></span>${K.label('2:16 left', T.ter, 11)}</div>
<span style="position: absolute; left: 155px; top: 730px; width: 80px; height: 80px; border-radius: 999px; background: ${T.action}; box-shadow: 0 0 36px rgba(${hue},0.35); display: flex; align-items: center; justify-content: center; color: ${T.onAction}">${icon('pause', 26, 2)}</span>`;
  };
  out.push(trio('PlayersStar.dc.html', {
    title: 'Players — box breathing with the star', css, phone,
    captions: ['Sunrise · The light traces the square: in along the top, hold down the side, out along the bottom, hold up the other.', 'Dusk · At each hold the second square turns in; every other round they meet as the eight-point star.', 'Night · Box breathing’s own tone (dusk violet).'],
  }));
})();

/* ── 6 · The orbit board's ground as the breathing-session backdrop ── */
(() => {
  const GROUND = {
    night: `linear-gradient(180deg, ${M.midnight} 0%, #1E2350 42%, #4A3E73 70%, #A77A7A 90%, ${K.TONES.night.dawn} 100%)`,
    dusk: `linear-gradient(180deg, ${K.T.dusk.ground} 0%, #EFE3EE 42%, #E8C9D6 70%, #F2C9A8 90%, #F2B880 100%)`,
    sunrise: `linear-gradient(180deg, ${K.T.sunrise.ground} 0%, #E7F0F3 40%, #F3DCD8 72%, #F9C8AE 90%, #F9A980 100%)`,
  };
  const css = `${K.breathKeyframes('orbB', F478, (f) => `transform: scale(${f ? 1 : 0.6})`)}`;
  const phone = (T) => {
    const hue = K.rgbOf(T.hue.glow);
    return `<span style="position: absolute; inset: 0; background: ${GROUND[T.key]}"></span>
${header(T, 'breathe')}
<div aria-hidden="true" style="position: absolute; left: ${195 - 120}px; top: ${320 - 120}px; width: 240px; height: 240px; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,${T.dark ? 0.3 : 0.85}) 0%, rgba(${hue},0.16) 45%, rgba(${hue},0.26) 100%); border: 1px solid rgba(${hue},0.45); animation: orbB ${C478}s linear infinite"></div>
<div style="position: absolute; left: 0; right: 0; top: 540px; display: flex; flex-direction: column; align-items: center; gap: 10px">
<span style="font-family: ${K.F.display}; font-size: 26px; color: ${T.dark ? M.moonlight : T.text}">Anxiety Relief Breathing</span>
${K.label('Round 2 of 10', T.dark ? M.mist : T.sec, 11)}
</div>
<span style="position: absolute; left: 155px; top: 730px; width: 80px; height: 80px; border-radius: 999px; background: ${T.dark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)'}; border: 1px solid ${T.dark ? 'rgba(255,255,255,0.35)' : 'rgba(29,43,42,0.12)'}; backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; color: ${T.dark ? '#FFFFFF' : T.text}">${icon('pause', 26, 2)}</span>`;
  };
  out.push(trio('PlayersBackdrop.dc.html', {
    title: 'Players — the dawn backdrop for breathing sessions', css, phone,
    captions: ['Sunrise · The orbit board’s fall of light, in Sunrise’s colours: sky blue into peach.', 'Dusk · Cream through rose into apricot.', 'Night · As on the orbit board: midnight, violet, rose, dawn.'],
  }));
})();

/* ── 7 · Arabic: the hero and the scene sheet, Night ── */
(() => {
  const N = THEMES[2];
  const ar = [N, N];
  out.push(trio('PlayersArabic.dc.html', {
    title: 'Players — Arabic hero and scenes (Night)', css: HERO_CSS, themes: ar, lang: 'ar',
    captions: ['Arabic, Fire · The date and title set from the right, the title in Amiri; the play ring moves to the left.', 'Arabic, Rain · Numbers in Arabic-Indic; the rows’ chevrons point left.'],
    phone: (T, i) => i === 0 ? hero(T, { ar: true, scene: 'fire' }) : hero(T, { ar: true, scene: 'rain' }),
  }));
})();

module.exports = out;
module.exports.helpers = { header, hero, THEMES, IMG, HERO_CSS };
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}`).join('\n'));
