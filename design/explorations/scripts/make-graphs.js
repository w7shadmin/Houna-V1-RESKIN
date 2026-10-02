// D · Graphs: seven phones. Inspiration: Stardust's layered ridges and ring, Oura's arc gauge.
// Practice shows as light (days you practised glow; the rest simply rest), mood as colour (no
// scores, no streaks), questionnaires as reflections, never diagnoses. The data is illustrative.
const K = require('./kit.js');
const { icon } = require('./icons.js');
const N = K.T.night, D = K.T.dusk;
const M = K.NIGHT;
const out = [];
const DAY = 86400000;
const TONES = [N.tone.glow, N.tone.dusk, N.tone.dawn, N.tone.bloom];
const EX = ['4-7-8', 'Box', 'Five senses', 'Relaxation'];
const num = (t, size, color = M.moonlight, extra = '') => `<span style="font-family: ${K.F.body}; font-weight: 300; font-size: ${size}px; line-height: 1; color: ${color}; font-variant-numeric: tabular-nums; ${extra}">${t}</span>`;

/* Illustrative September: minutes per exercise per day, through today (the 27th). */
let seed = 17;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const TODAY_D = 27;
const MONTH = Array.from({ length: 30 }, (_, i) => {
  const d = i + 1;
  if (d > TODAY_D) return [0, 0, 0, 0];
  const rest = rnd() < 0.28;
  return rest ? [0, 0, 0, 0] : [Math.round(rnd() * 6), Math.round(rnd() * 5), rnd() < 0.3 ? Math.round(2 + rnd() * 4) : 0, rnd() < 0.35 ? Math.round(3 + rnd() * 5) : 0];
});
const totalOf = (a) => a.reduce((x, y) => x + y, 0);
const MONTH_TOTAL = MONTH.reduce((a, d) => a + totalOf(d), 0);

/** A smooth path through points (Catmull-Rom as cubic Béziers). */
function smooth(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
const replayBtn = (color, tint = '242,236,221') => `<button type="button" onClick="{{replay}}" aria-label="Replay" style="position: absolute; right: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass(tint, 0.08)}; display: flex; align-items: center; justify-content: center; color: ${color}; cursor: pointer">${icon('replay', 20)}</button>`;
const replayLogic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { n: 0 };
  }
  renderVals() {
    return { x: this.state.n % 2 ? 'B' : 'A', replay: () => this.setState({ n: this.state.n + 1 }) };
  }
}`;

/* ── D1 · Practice ridges (Stardust): the month as layered tone ridges, with today's line ── */
(() => {
  const X0 = 16, X1 = 374, BASE = 660, HMAX = 230;
  const xOf = (i) => X0 + (i / 29) * (X1 - X0);
  const ridge = (k) => {
    // A five-day moving average: the ridges swell with the weeks rather than spiking day to day.
    const avg = MONTH.map((_, i) => { const w = MONTH.slice(Math.max(0, i - 2), i + 3); return w.reduce((x, d) => x + d[k], 0) / w.length; });
    const pts = avg.map((v, i) => [xOf(i), BASE - (v / 4.5) * HMAX]);
    const line = smooth(pts);
    return `<path d="${line} L${X1} ${BASE} L${X0} ${BASE} Z" fill="url(#rg${k})" style="mix-blend-mode: screen"></path><path d="${line}" fill="none" stroke="${TONES[k]}" stroke-width="1.4" opacity="0.9"></path>`;
  };
  const tx = xOf(TODAY_D - 1);
  const css = ['A', 'B'].map((x) => `@keyframes reveal${x} { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }`).join('\n');
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(80% 50% at 50% 100%, #1A2150 0%, ${M.midnight} 70%)"></span>
${K.starfield(24, 390, 400, 51)}
${replayBtn(M.moonlight)}
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 8px">
${K.label('September', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 30px; color: ${M.moonlight}">Your month in breath</span>
<span style="display: flex; align-items: baseline; gap: 10px">${num(MONTH_TOTAL, 56)}<span style="font-size: 17px; color: ${M.mist}">minutes</span></span>
</div>
<div style="position: absolute; left: 24px; top: 262px; display: flex; flex-direction: column; gap: 4px">${EX.map((e, k) => K.label(e, TONES[k], 10.5)).join('')}</div>
<div style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; animation: reveal{{x}} 2.6s cubic-bezier(.3,.7,.3,1) both">
<svg width="390" height="844" viewBox="0 0 390 844" aria-hidden="true" style="position: absolute; inset: 0">
<defs>${TONES.map((c, k) => `<linearGradient id="rg${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0.55"></stop><stop offset="1" stop-color="${c}" stop-opacity="0.02"></stop></linearGradient>`).join('')}</defs>
${[1, 8, 15, 22, 29].map((d) => `<line x1="${xOf(d - 1)}" y1="360" x2="${xOf(d - 1)}" y2="${BASE}" stroke="rgba(242,236,221,0.08)"></line>`).join('')}
${[3, 2, 1, 0].map(ridge).join('')}
</svg>
</div>
<span style="position: absolute; left: ${tx}px; top: 380px; width: 1px; height: ${BASE - 380}px; background: ${M.moonlight}; opacity: 0.75"></span>
<span style="position: absolute; left: ${tx - 30}px; top: 356px; width: 60px; text-align: center">${K.label('Today', M.moonlight, 10.5)}</span>
<div style="position: absolute; left: 0; top: ${BASE + 10}px; width: 390px; height: 20px">${[1, 8, 15, 22, 29].map((d) => `<span style="position: absolute; left: ${xOf(d - 1) - 15}px; width: 30px; text-align: center; font-size: 12px; color: ${M.haze}; font-variant-numeric: tabular-nums">${d}</span>`).join('')}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 720px; padding: 16px; border-radius: 20px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); display: flex; justify-content: space-between; align-items: center">
<span style="font-size: 15px; color: ${M.mist}">Most often</span><span style="font-size: 15px; color: ${M.moonlight}">4-7-8, in the evenings</span>
</div>`;
  out.push(K.board('GraphRidges.dc.html', { title: 'Graphs — the month in ridges', root: `background: ${M.midnight}`, css, body, logic: replayLogic }));
})();

/* ── D2 · Moon calendar: September in real phases; days you practised glow ── */
(() => {
  const first = new Date('2026-09-01T12:00:00');
  const lead = first.getDay();
  const CW = 50, x0 = (390 - 7 * CW) / 2, y0 = 250, RH = 70;
  const detail = [];
  const cells = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(first.getTime() + i * DAY);
    const p = MONTH[i], t = totalOf(p), future = i + 1 > TODAY_D;
    const col = (lead + i) % 7, row = Math.floor((lead + i) / 7);
    const f = K.phaseOf(d);
    const lit = t > 0;
    const main = p.indexOf(Math.max(...p));
    const date = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
    detail.push(future ? `${date} · still to come` : lit ? `${date} · ${t} minutes, mostly ${EX[main]}` : `${date} · a quiet day`);
    return `<button type="button" onClick="{{pick${i}}}" aria-label="${date}" ${future ? 'disabled=""' : ''} style="position: absolute; left: ${x0 + col * CW}px; top: ${y0 + row * RH}px; width: ${CW}px; height: ${RH}px; border: 0; padding: 0; background: none; cursor: ${future ? 'default' : 'pointer'}; display: flex; flex-direction: column; align-items: center; gap: 6px">
<span style="position: relative; width: 30px; height: 30px; margin-top: 6px"><span style="position: absolute; inset: -5px; border-radius: 999px; border: 1.5px solid ${M.moonlight}; opacity: {{r${i}}}; transition: opacity 300ms ease"></span>${K.moon(f, 15, lit ? { lit: M.moonlight, dark: 'rgba(242,236,221,0.08)', glow: 'rgba(242,236,221,0.55)' } : { lit: `rgba(242,236,221,${future ? 0.08 : 0.2})`, dark: 'rgba(242,236,221,0.04)' })}</span>
<span style="font-size: 12.5px; color: ${lit ? M.moonlight : M.haze}; opacity: ${future ? 0.45 : 1}; font-variant-numeric: tabular-nums">${i + 1}</span>
</button>`;
  }).join('');
  const body = `
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 8px">
${K.label('Your practice', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 30px; color: ${M.moonlight}">September by moonlight</span>
<span style="font-size: 15px; line-height: 1.5; color: ${M.mist}">Each night's real moon. The ones you practised glow; the rest simply rest.</span>
</div>
<div style="position: absolute; left: ${x0}px; top: 218px; width: ${7 * CW}px; display: flex">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w) => `<span style="width: ${CW}px; text-align: center">${K.label(w, M.haze, 11)}</span>`).join('')}</div>
${cells}
<div style="position: absolute; left: 16px; right: 16px; top: 640px; min-height: 64px; padding: 16px; border-radius: 20px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); box-sizing: border-box; display: flex; align-items: center; font-size: 15.5px; color: ${M.moonlight}">{{detail}}</div>
<span style="position: absolute; left: 24px; right: 24px; top: 730px; font-size: 13.5px; color: ${M.haze}">No streak to lose here: a dark moon is just a night off.</span>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: ${TODAY_D - 1} };
  }
  renderVals() {
    const detail = ${JSON.stringify(detail)};
    const s = this.state.sel, v = { detail: detail[s] };
    for (let k = 0; k < 30; k++) {
      v['r' + k] = k === s ? 1 : 0;
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(K.board('GraphMoonCalendar.dc.html', { title: 'Graphs — September by moonlight', root: `background: ${M.midnight}`, body, logic }));
})();

/* ── D3 / D7 · Arc gauge (Oura): the week's minutes, segmented by exercise ── */
function gauge(lang) {
  const isAr = lang === 'ar';
  const WEEK = [18, 14, 6, 9];
  const total = totalOf(WEEK);
  const cx = 195, cy = 360, R = 138, START = 150, SWEEP = 240, GAP = 5;
  const pt = (deg, r = R) => { const a = (deg * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const arc = (a0, a1, r = R) => { const [x0, y0] = pt(a0, r), [x1, y1] = pt(a1, r); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  let a = START;
  const segs = WEEK.map((m, k) => { const span = (m / total) * SWEEP; const d = arc(a + GAP / 2, a + span - GAP / 2); const len = ((span - GAP) / 360) * 2 * Math.PI * R; const el = `<path d="${d}" fill="none" stroke="${TONES[k]}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)}" style="animation: draw{{x}} 900ms cubic-bezier(.3,.7,.3,1) ${k * 250}ms both; --len: ${len.toFixed(1)}px"></path>`; a += span; return el; });
  const [kx, ky] = pt(START + SWEEP);
  const names = isAr ? ['٤-٧-٨', 'التنفس المربّع', 'الحواس الخمس', 'الاسترخاء'] : EX;
  const n = (v) => (isAr ? K.ar(v) : v);
  const bigNum = (t, size, color = M.moonlight) => isAr ? `<span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: ${size * 0.9}px; line-height: 1.1; color: ${color}">${t}</span>` : num(t, size, color);
  const css = ['A', 'B'].map((x) => `@keyframes draw${x} { from { stroke-dashoffset: var(--len) } to { stroke-dashoffset: 0 } }`).join('\n') + `\n@keyframes knob { from { opacity: 0 } to { opacity: 1 } }`;
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(90% 55% at 50% 0%, #13304A 0%, ${M.midnight} 60%)"></span>
${replayBtn(M.moonlight).replace('right: 20px', isAr ? 'left: 20px' : 'right: 20px')}
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center; font-size: 17px; color: ${M.moonlight}">${isAr ? 'تنفّسك هذا الأسبوع' : 'Your breathing this week'}</span>
<svg width="390" height="560" viewBox="0 0 390 560" aria-hidden="true" style="position: absolute; left: 0; top: 0${isAr ? '; transform: scaleX(-1)' : ''}">
<path d="${arc(START, START + SWEEP)}" fill="none" stroke="rgba(242,236,221,0.08)" stroke-width="10" stroke-linecap="round"></path>
${segs.join('')}
<circle cx="${kx.toFixed(1)}" cy="${ky.toFixed(1)}" r="8" fill="${M.midnight}" stroke="${M.moonlight}" stroke-width="3" style="animation: knob 400ms ease 1.3s both"></circle>
</svg>
<div style="position: absolute; left: 0; right: 0; top: ${cy - 90}px; display: flex; flex-direction: column; align-items: center; gap: 10px">
${isAr ? K.arLabel('هذا الأسبوع', N.accent, 14) : K.label('This week', N.accent)}
${bigNum(n(total), 112)}
<span style="font-family: ${isAr ? K.F.arDisplay : K.F.display}; font-size: 22px; color: ${M.mist}">${isAr ? 'دقيقة' : 'minutes'}</span>
</div>
<div style="position: absolute; left: 0; right: 0; top: 540px; display: flex; flex-direction: column; align-items: center; gap: 6px">
${isAr ? K.arLabel('الأسبوع الماضي', M.haze, 13) : K.label('Last week', M.haze)}
${bigNum(n(38), 40, M.mist)}
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 650px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">${WEEK.map((m, k) => `<div style="padding: 12px 14px; border-radius: 16px; background: rgba(242,236,221,0.045); display: flex; align-items: center; gap: 10px"><span style="width: 8px; height: 8px; border-radius: 999px; background: ${TONES[k]}; box-shadow: 0 0 8px ${TONES[k]}"></span><span style="flex: 1; font-size: 14px; color: ${M.mist}">${names[k]}</span><span style="${isAr ? `font-family: ${K.F.arBody}; font-weight: 500` : 'font-weight: 300'}; font-size: 18px; color: ${M.moonlight}">${n(m)}</span></div>`).join('')}</div>`;
  return K.board(isAr ? 'GraphGaugeAr.dc.html' : 'GraphGauge.dc.html', { title: isAr ? 'هذا الأسبوع — مقياس' : 'Graphs — the week as an arc', lang, root: `background: ${M.midnight}`, css, body, logic: replayLogic });
}

/* ── D4 · Reflections over time (Dusk): WHO-5 across its published bands, as soft strata ── */
(() => {
  const TAKES = [['12 Jun', 44], ['3 Jul', 52], ['24 Jul', 48], ['14 Aug', 60], ['4 Sep', 56], ['25 Sep', 68]];
  const X0 = 40, X1 = 350, Y0 = 250, Y1 = 560;
  const yOf = (v) => Y1 - (v / 100) * (Y1 - Y0);
  const xOf = (i) => X0 + (i / (TAKES.length - 1)) * (X1 - X0);
  const pts = TAKES.map(([, v], i) => [xOf(i), yOf(v)]);
  const css = ['A', 'B'].map((x) => `@keyframes line${x} { from { stroke-dashoffset: 600 } to { stroke-dashoffset: 0 } } @keyframes dot${x} { from { opacity: 0; transform: scale(0.4) } to { opacity: 1; transform: none } }`).join('\n');
  const body = `
${replayBtn(D.text, '27,33,64')}
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 8px">
${K.label('My results · WHO-5', D.accent)}
<span style="font-family: ${K.F.display}; font-size: 28px; line-height: 1.2; color: ${D.text}">Your wellbeing,<br>as you've reflected it</span>
</div>
<svg width="390" height="620" viewBox="0 0 390 620" aria-hidden="true" style="position: absolute; left: 0; top: 0">
<rect x="${X0 - 16}" y="${yOf(100)}" width="${X1 - X0 + 32}" height="${yOf(48) - yOf(100)}" rx="14" fill="${K.HUES.dusk.glow}" opacity="0.14"></rect>
<rect x="${X0 - 16}" y="${yOf(48)}" width="${X1 - X0 + 32}" height="${yOf(0) - yOf(48)}" rx="14" fill="${K.HUES.dusk.dawn}" opacity="0.16"></rect>
<path d="${smooth(pts)}" fill="none" stroke="${D.text}" stroke-width="2" stroke-linecap="round" stroke-dasharray="600" style="animation: line{{x}} 1.8s ease both"></path>
${pts.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === pts.length - 1 ? 7 : 5}" fill="${i === pts.length - 1 ? D.accent : D.ground}" stroke="${D.text}" stroke-width="2" style="transform-origin: ${x.toFixed(1)}px ${y.toFixed(1)}px; animation: dot{{x}} 400ms ease ${0.3 + i * 0.25}s both"></circle>`).join('')}
</svg>
<span style="position: absolute; left: ${X1 - 150}px; top: ${yOf(100) + 10}px; width: 160px; text-align: right; font-size: 13px; color: ${D.accent}">Good wellbeing</span>
<span style="position: absolute; left: ${X1 - 150}px; top: ${yOf(0) - 28}px; width: 160px; text-align: right; font-size: 13px; color: #A8621F">Lower wellbeing</span>
<span style="position: absolute; left: ${pts[5][0] - 50}px; top: ${pts[5][1] - 44}px; width: 60px; text-align: right; font-weight: 300; font-size: 26px; color: ${D.text}">68%</span>
<div style="position: absolute; left: 0; top: ${Y1 + 14}px; width: 390px">${TAKES.map(([t], i) => `<span style="position: absolute; left: ${xOf(i) - 26}px; width: 52px; text-align: center; font-size: 12px; color: ${D.ter}; font-variant-numeric: tabular-nums">${t}</span>`).join('')}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 624px; padding: 16px; border-radius: 20px; background: #FFFFFF; border: 1px solid ${D.line}; display: flex; flex-direction: column; gap: 6px">
<span style="font-size: 15px; line-height: 1.5; color: ${D.sec}">Each point is a time you chose to reflect. A reflection, not a diagnosis; only you can see it.</span>
</div>
<button type="button" style="position: absolute; left: 24px; right: 24px; top: 740px; height: 56px; border-radius: 999px; border: 0; background: ${D.accent}; color: #FFFFFF; font-size: 17px; font-weight: 600; cursor: pointer">Reflect again</button>`;
  out.push(K.board('GraphReflections.dc.html', { title: 'Graphs — reflections over time (Dusk)', root: `background: ${D.ground}`, css, body, logic: replayLogic }));
})();

/* ── D5 · Mood tide: a fortnight of moods as one flowing band of colour ── */
(() => {
  const MOOD = { angry: '#E36F5E', anxious: '#F0B27A', sad: '#82A4EE', neutral: '#D2CBB9', calm: '#62D2C9', hopeful: '#9BD67E', joyful: '#F2C76B' };
  const DAYS = ['anxious', 'anxious', 'sad', null, 'neutral', 'calm', 'calm', 'hopeful', null, 'sad', 'neutral', 'calm', 'joyful', 'calm'];
  const X0 = 20, X1 = 370;
  const xOf = (i) => X0 + (i / (DAYS.length - 1)) * (X1 - X0);
  const stops = DAYS.map((m, i) => `<stop offset="${(i / (DAYS.length - 1)).toFixed(3)}" stop-color="${m ? MOOD[m] : '#3A4270'}"></stop>`).join('');
  const wave = (amp, phase, y) => { const pts = Array.from({ length: 15 }, (_, i) => [X0 - 20 + i * 29, y + Math.sin(i * 0.9 + phase) * amp]); return smooth(pts); };
  const band = (yTop, yBot, a, ph) => `${wave(a, ph, yTop)} L${X1 + 20} ${yBot} L${X0 - 20} ${yBot} Z`;
  const css = `@keyframes tide { 0%,100% { transform: translateX(0) } 50% { transform: translateX(-10px) } } @keyframes tide2 { 0%,100% { transform: translateX(-6px) } 50% { transform: translateX(6px) } }`;
  const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const body = `
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 8px">
${K.label('Journal', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 30px; color: ${M.moonlight}">Your fortnight in colour</span>
<span style="font-size: 15px; line-height: 1.5; color: ${M.mist}">One band of the moods you logged. No scores, no streaks; days you didn't write are simply grey.</span>
</div>
<svg width="390" height="300" viewBox="0 0 390 300" aria-hidden="true" style="position: absolute; left: 0; top: 250px; overflow: visible">
<defs><linearGradient id="md" x1="${X0}" y1="0" x2="${X1}" y2="0" gradientUnits="userSpaceOnUse">${stops}</linearGradient><filter id="soft"><feGaussianBlur stdDeviation="6"></feGaussianBlur></filter></defs>
<g style="animation: tide 9s ease-in-out infinite"><path d="${band(70, 230, 14, 0)}" fill="url(#md)" opacity="0.35" filter="url(#soft)"></path></g>
<g style="animation: tide2 11s ease-in-out infinite"><path d="${band(100, 200, 10, 1.4)}" fill="url(#md)" opacity="0.9"></path></g>
${DAYS.map((m, i) => (m ? `<circle cx="${xOf(i).toFixed(1)}" cy="60" r="3" fill="${MOOD[m]}"></circle>` : '')).join('')}
</svg>
<div style="position: absolute; left: 0; top: 520px; width: 390px; height: 20px">${week.map((w, i) => `<span style="position: absolute; left: ${xOf(i) - 10}px; width: 20px; text-align: center">${K.label(w, M.haze, 10.5)}</span>`).join('')}</div>
<div style="position: absolute; left: 20px; right: 20px; top: 590px; display: flex; flex-wrap: wrap; gap: 8px">${Object.entries(MOOD).map(([k, c]) => `<span style="height: 32px; padding: 0 12px; border-radius: 999px; background: rgba(242,236,221,0.05); display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: ${M.mist}"><span style="width: 10px; height: 10px; border-radius: 999px; background: ${c}"></span>${k[0].toUpperCase() + k.slice(1)}</span>`).join('')}</div>
<span style="position: absolute; left: 24px; right: 24px; top: 710px; font-size: 13.5px; line-height: 1.5; color: ${M.haze}">The dots above the band are the days you wrote something. Your journal is stored on this phone.</span>`;
  out.push(K.board('GraphMoodTide.dc.html', { title: 'Graphs — mood tide', root: `background: ${M.midnight}`, css, body }));
})();

/* ── D6 · Community constellations: countries as stars, joined into one sky ── */
(() => {
  const C = [['Saudi Arabia', 24, 45, 412], ['United Arab Emirates', 24, 54, 188], ['Kuwait', 29.3, 47.9, 96], ['Qatar', 25.3, 51.2, 74], ['Bahrain', 26, 50.5, 41], ['Oman', 21, 57, 52], ['Egypt', 26, 30, 88], ['Jordan', 31, 36, 60], ['United Kingdom', 54, -2, 70], ['United States', 39, -98, 64], ['Canada', 56, -106, 21], ['Germany', 51, 10, 38], ['Malaysia', 4, 102, 29], ['Australia', -25, 134, 17]];
  const total = C.reduce((a, c) => a + c[3], 0);
  const X0 = 20, W = 350, Y0 = 250, H = 250;
  const P = C.map(([name, lat, lon, n]) => ({ name, n, x: X0 + ((lon + 130) / 290) * W, y: Y0 + ((62 - lat) / 95) * H, r: 2 + Math.sqrt(n) / 3.2 }));
  // Prim's minimum spanning tree: every country joined to the sky by its nearest neighbour.
  const inTree = [0], edges = [];
  while (inTree.length < P.length) {
    let best = null;
    for (const a of inTree) for (let b = 0; b < P.length; b++) if (!inTree.includes(b)) { const d = Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y); if (!best || d < best[2]) best = [a, b, d]; }
    edges.push(best); inTree.push(best[1]);
  }
  const star = (p, k) => `<button type="button" onClick="{{pick${k}}}" aria-label="${p.name}" style="position: absolute; left: ${(p.x - 22).toFixed(1)}px; top: ${(p.y - 22).toFixed(1)}px; width: 44px; height: 44px; border: 0; padding: 0; background: none; cursor: pointer"><span style="position: absolute; left: ${22 - p.r}px; top: ${22 - p.r}px; width: ${2 * p.r}px; height: ${2 * p.r}px; border-radius: 999px; background: {{c${k}}}; box-shadow: 0 0 ${p.r * 3}px {{g${k}}}; transition: background 400ms ease; animation: twinkle ${(3 + (k % 4)).toFixed(1)}s ease-in-out ${-k * 0.7}s infinite"></span></button>`;
  const body = `
${K.starfield(60, 390, 844, 61, '182,186,214')}
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 10px">
${K.label('Breathing together', N.accent)}
<span style="display: flex; align-items: baseline; gap: 10px">${num(total.toLocaleString('en-US'), 52)}<span style="font-size: 15px; line-height: 1.35; color: ${M.mist}">people this month,<br>in ${C.length} countries</span></span>
</div>
<div style="position: absolute; left: 24px; top: 178px; height: 40px; padding: 4px; border-radius: 999px; ${K.glass('242,236,221', 0.06)}; display: flex; gap: 2px; box-sizing: border-box">${['24h', 'Week', 'Month'].map((t, i) => `<span style="padding: 0 14px; display: flex; align-items: center; border-radius: 999px; font-size: 13.5px; ${i === 2 ? `background: ${M.moonlight}; color: ${M.midnight}` : `color: ${M.mist}`}">${t}</span>`).join('')}</div>
<svg width="390" height="844" viewBox="0 0 390 844" aria-hidden="true" style="position: absolute; inset: 0">${edges.map(([a, b]) => `<line x1="${P[a].x.toFixed(1)}" y1="${P[a].y.toFixed(1)}" x2="${P[b].x.toFixed(1)}" y2="${P[b].y.toFixed(1)}" stroke="rgba(111,214,207,0.35)" stroke-width="1" stroke-dasharray="2 4"></line>`).join('')}</svg>
${P.map(star).join('')}
<div style="position: absolute; left: 16px; right: 16px; top: 580px; padding: 18px; border-radius: 22px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); display: flex; justify-content: space-between; align-items: center">
<span style="font-size: 16px; color: ${M.moonlight}">{{name}}</span><span style="font-weight: 300; font-size: 26px; color: ${N.tone.glow}">{{count}}</span>
</div>
<span style="position: absolute; left: 24px; right: 24px; top: 670px; font-size: 14px; line-height: 1.5; color: ${M.mist}">An alternative to the dot map: each country a star, sized by how many breathed there, joined into one constellation. Only countries, never people.</span>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 0 };
  }
  renderVals() {
    const P = ${JSON.stringify(P.map((p) => [p.name, p.n.toLocaleString('en-US')]))};
    const s = this.state.sel, v = { name: P[s][0], count: P[s][1] };
    for (let k = 0; k < P.length; k++) {
      v['c' + k] = k === s ? '${N.tone.glow}' : '${M.moonlight}';
      v['g' + k] = k === s ? 'rgba(111,214,207,0.9)' : 'rgba(242,236,221,0.5)';
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(K.board('GraphConstellation.dc.html', { title: 'Graphs — community constellation', root: `background: ${M.midnight}`, body, logic }));
})();

out.splice(2, 0, gauge('en'));
out.push(gauge('ar'));
module.exports = out;
if (require.main === module) console.log(out.map((b) => b.file).join('\n'));
