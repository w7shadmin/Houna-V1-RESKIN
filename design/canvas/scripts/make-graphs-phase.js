// "Houna — Graphs (phase 4)": the picked graph boards from the Explorations canvas
// (design/explorations/PICKS.md, section D) on the app's own screens, in Sunrise, Dusk and Night.
// Decided 28 Sep: the moon calendar is a Recap slide (the month's story, for Guests too); the week's
// arc opens Stats, above the streak; the nights practised glow in Home's month of moons.
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const { home } = require('./make-home-appearance.js');
const { icon } = require('../../explorations/scripts/icons.js');
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;
const TODAY = K.TODAY; // Sun 27 Sep 2026
const DAY = 86400000;
const addDays = (d, n) => new Date(d.getTime() + n * DAY);

/* ── Practice, as the on-device log would have it: minutes per exercise per day of September ── */
// Exercises in their tones: 4-7-8 glow, box dusk, five senses dawn, muscle relaxation bloom; then
// meditation, and Tanafas (the starfield, sunrise, dusk and sky clock visits).
const EX = ['4-7-8', 'Box breathing', 'Five senses', 'Muscle relaxation', 'Meditation', 'Tanafas'];
const EX_AR = ['٤-٧-٨', 'التنفّس المربّع', 'الحواس الخمس', 'الاسترخاء العضلي', 'التأمل', 'تنفّس'];
let seed = 5;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const SEPT = Array.from({ length: 30 }, (_, i) => {
  if (i + 1 > 27) return null; // still to come
  if (rnd() < 0.38) return [0, 0, 0, 0, 0, 0]; // a quiet day
  return [rnd() < 0.5 ? 4 + Math.round(rnd() * 6) : 0, rnd() < 0.4 ? 4 + Math.round(rnd() * 8) : 0, rnd() < 0.15 ? 5 : 0, rnd() < 0.12 ? 11 : 0, rnd() < 0.3 ? 10 : 0, rnd() < 0.25 ? 2 + Math.round(rnd() * 3) : 0];
});
const sum = (a) => a.reduce((x, y) => x + y, 0);
// This week: Mon 21 – Sun 27 Sep; last week before it.
const WEEK = [0, 1, 2, 3, 4, 5].map((k) => sum(SEPT.slice(20, 27).map((d) => d[k])));
const LAST_WEEK = sum(SEPT.slice(13, 20).map(sum));

/* ── Themes and phones ── */
const THEMES = ['sunrise', 'dusk', 'night'].map((k) => {
  const T = K.T[k];
  return { ...T, dark: k === 'night', sheet: k === 'night' ? 'rgba(18,26,62,0.82)' : 'rgba(255,255,255,0.78)', veil: k === 'night' ? '11,16,38' : '29,43,42' };
});
const [TS, TD, TN] = THEMES;
/** Each exercise's colour in a theme: the four tones, then meditation in ink, Tanafas in half-ink. */
const exColours = (T) => [T.tone.glow, T.tone.dusk, T.tone.dawn, T.tone.bloom, T.text, `rgba(${K.rgbOf(T.text)},0.5)`];
const PW = 390, PH = 844, PAD = 40, GAP = 40;
function row(file, { title, phones, css = '', logic }) {
  const W = PAD * 2 + phones.length * PW + (phones.length - 1) * GAP, H = PAD + PH + 100;
  const body = phones
    .map((p, i) => {
      const [name, ...rest] = p.caption.split(' · ');
      return `<div${p.ar ? ' dir="rtl"' : ''} style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; background: ${p.bg || p.T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); font-family: ${p.ar ? K.F.arBody : K.F.body}">${p.html}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${name}</span>${rest.length ? `<span style="font-size: 13px; color: ${M.mist}">${rest.join(' · ')}</span>` : ''}</div>`;
    })
    .join('\n');
  return K.board(file, { title, w: W, h: H, root: 'background: #070B1C', css, body, logic, dir: DIR });
}
const lab = (t, color, ar, size) => (ar ? K.arLabel(t, color, (size || 11) + 2) : K.label(t, color, size || 11));
const n = (v, ar) => (ar ? K.ar(v) : String(v));
const bigNum = (v, size, color, ar) =>
  ar
    ? `<span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: ${Math.round(size * 0.9)}px; line-height: 1.15; color: ${color}">${K.ar(v)}</span>`
    : `<span style="font-family: ${K.F.body}; font-weight: 300; font-size: ${size}px; line-height: 1; color: ${color}; font-variant-numeric: tabular-nums">${v}</span>`;
const out = [];

/* ── 1 · Recap: September by moonlight ── */
(() => {
  const RECAP_GROUND = { sunrise: '#F2F6F4', dusk: '#F5F1E8', night: '#0B1026' };
  const first = new Date('2026-09-01T12:00:00');
  const lead = first.getDay();
  const CW = 48, x0 = (390 - 7 * CW) / 2, y0 = 300, RH = 62;
  const detailEn = [], detailAr = [];
  const WD = { en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] };
  const fmt = (d, ar) => new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  SEPT.forEach((p, i) => {
    const d = addDays(first, i);
    const t = p ? sum(p) : 0, main = p ? p.indexOf(Math.max(...p)) : 0;
    detailEn.push(!p ? `${fmt(d)} · still to come` : t ? `${fmt(d)} · ${t} minutes, mostly ${EX[main]}` : `${fmt(d)} · a quiet day`);
    detailAr.push(!p ? `${fmt(d, true)} · لم يأتِ بعد` : t ? `${fmt(d, true)} · ${K.ar(t)} دقيقة، أكثرها ${EX_AR[main]}` : `${fmt(d, true)} · يوم هادئ`);
  });
  const phone = (T, ar = false) => {
    const sfx = ar ? 'Ar' : '';
    const text = T.text, soft = T.sec;
    const cells = SEPT.map((p, i) => {
      const d = addDays(first, i);
      const future = !p, lit = p && sum(p) > 0;
      const col = (lead + i) % 7, rowN = Math.floor((lead + i) / 7);
      const x = ar ? 390 - x0 - (col + 1) * CW : x0 + col * CW;
      const moon = K.moon(K.phaseOf(d), 13, lit
        ? { lit: T.dark ? M.moonlight : T.accent, dark: `rgba(${K.rgbOf(text)},0.08)`, glow: `rgba(${K.rgbOf(T.hue.glow)},${T.dark ? 0.6 : 0.5})` }
        : { lit: `rgba(${K.rgbOf(text)},${future ? 0.08 : 0.2})`, dark: `rgba(${K.rgbOf(text)},0.04)` });
      return `<button type="button" onClick="{{pick${i}}}" aria-label="${fmt(d, ar)}" ${future ? 'disabled=""' : ''} style="position: absolute; left: ${x}px; top: ${y0 + rowN * RH}px; width: ${CW}px; height: ${RH}px; border: 0; padding: 0; background: none; cursor: ${future ? 'default' : 'pointer'}; display: flex; flex-direction: column; align-items: center; gap: 5px">
<span style="position: relative; width: 26px; height: 26px; margin-top: 6px"><span style="position: absolute; inset: -5px; border-radius: 999px; border: 1.5px solid ${text}; opacity: {{r${i}}}; transition: opacity 300ms ease"></span>${moon}</span>
<span style="font-size: 12px; color: ${lit ? text : T.ter}; opacity: ${future ? 0.45 : 1}; font-variant-numeric: tabular-nums">${n(i + 1, ar)}</span>
</button>`;
    }).join('');
    const segs = Array.from({ length: 6 }, (_, k) => `<span style="flex: 1; height: 3px; border-radius: 2px; background: ${k <= 3 ? text : `rgba(${K.rgbOf(text)},0.22)`}"></span>`).join('');
    return `<span style="position: absolute; inset: 0; background: radial-gradient(90% 50% at 50% 30%, rgba(${K.rgbOf(T.hue.dusk)},${T.dark ? 0.3 : 0.22}), rgba(0,0,0,0) 70%)"></span>
<div style="position: absolute; left: 16px; right: 16px; top: 56px; display: flex; gap: 4px">${segs}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 72px; height: 44px; display: flex; align-items: center; justify-content: space-between">${lab(ar ? 'حصاد هُنا · سبتمبر' : 'Houna recap · September', soft, ar)}<span style="width: 44px; height: 44px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: ${text}">${icon('close', 16)}</span></div>
<div style="position: absolute; left: 24px; right: 24px; top: 150px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
${lab(ar ? 'على ضوء القمر' : 'By moonlight', T.tone.dusk, ar)}
<span style="font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700;' : ''} font-size: ${ar ? 30 : 30}px; color: ${text}">${ar ? 'سبتمبر على ضوء القمر' : 'September by moonlight'}</span>
<span style="font-size: 14.5px; line-height: 1.5; color: ${soft}">${ar ? 'قمر كل ليلة كما كان. الليالي التي تمرّنت فيها تتوهج، والباقي يستريح.' : 'Each night’s real moon. The ones you practised glow; the rest simply rest.'}</span>
</div>
<div style="position: absolute; left: ${x0}px; top: 276px; width: ${7 * CW}px; display: flex">${WD[ar ? 'ar' : 'en'].map((w) => `<span style="width: ${CW}px; text-align: center">${lab(w, T.ter, ar, 10)}</span>`).join('')}</div>
${cells}
<div style="position: absolute; left: 16px; right: 16px; top: 634px; min-height: 60px; padding: 14px 16px; border-radius: 20px; background: ${T.dark ? 'rgba(242,236,221,0.07)' : '#FFFFFF'}; border: 1px solid ${T.line}; box-sizing: border-box; display: flex; align-items: center; font-size: 15px; line-height: 1.4; color: ${text}">{{detail${sfx}}}</div>
<span style="position: absolute; left: 24px; right: 24px; top: 716px; text-align: center; font-size: 13.5px; color: ${T.ter}">${ar ? 'لا سلسلة تخسرها هنا: القمر المعتم ليلة راحة فحسب.' : 'No streak to lose here: a dark moon is just a night off.'}</span>
<span style="position: absolute; left: 0; right: 0; top: 790px; text-align: center">${lab(ar ? 'المس للمتابعة' : 'Tap to continue', T.ter, ar, 10)}</span>`;
  };
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 26 };
  }
  renderVals() {
    const en = ${JSON.stringify(detailEn)}, ar = ${JSON.stringify(detailAr)};
    const s = this.state.sel, v = { detail: en[s], detailAr: ar[s] };
    for (let k = 0; k < 30; k++) {
      v['r' + k] = k === s ? 1 : 0;
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(
    row('GraphsMoonlight.dc.html', {
      title: 'Phase 4 — Recap: the month by moonlight',
      logic,
      phones: [
        { T: TS, bg: RECAP_GROUND.sunrise, caption: 'Sunrise · A new Recap slide after breathing and meditation: the month’s nights as their real moons, the ones practised lit.', html: phone(TS) },
        { T: TD, bg: RECAP_GROUND.dusk, caption: 'Dusk · Tap a moon (on any phone) for that day’s minutes and what they were mostly; taps elsewhere still move the story on.', html: phone(TD) },
        { T: TN, bg: RECAP_GROUND.night, caption: 'Night · Unpractised nights are dim, never marked missed; days still to come are fainter and can’t be tapped.', html: phone(TN) },
        { T: TN, bg: RECAP_GROUND.night, ar: true, caption: 'Arabic · The week runs right to left; Arabic-Indic numerals.', html: phone(TN, true) },
      ],
    }),
  );
})();

/* ── 2 · Stats: the week as an arc ── */
(() => {
  const css = ['A', 'B'].map((x) => `@keyframes draw${x} { from { stroke-dashoffset: var(--len) } to { stroke-dashoffset: 0 } }`).join('\n') + '\n@keyframes knob { from { opacity: 0 } to { opacity: 1 } }';
  const phone = (T, ar = false) => {
    const total = sum(WEEK);
    const cx = 195, cy = 330, R = 118, START = 150, SWEEP = 240, GAPD = 5;
    const pt = (deg, r = R) => { const a = (deg * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
    const arc = (a0, a1) => { const [x0, y0] = pt(a0), [x1, y1] = pt(a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
    const cols = exColours(T);
    let a = START;
    const segs = WEEK.map((m, k) => {
      if (!m) return '';
      const span = (m / total) * SWEEP;
      const d = arc(a + GAPD / 2, a + span - GAPD / 2);
      const len = ((span - GAPD) / 360) * 2 * Math.PI * R;
      a += span;
      return `<path d="${d}" fill="none" stroke="${cols[k]}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)}" style="animation: drawA 900ms cubic-bezier(.3,.7,.3,1) ${k * 200}ms both; --len: ${len.toFixed(1)}px"></path>`;
    }).join('');
    const [kx, ky] = pt(START + SWEEP);
    const legend = WEEK.map((m, k) => (m ? `<div style="padding: 10px 12px; border-radius: 14px; background: ${T.dark ? 'rgba(242,236,221,0.045)' : '#FFFFFF'}; border: 1px solid ${T.line}; display: flex; align-items: center; gap: 8px"><span style="width: 8px; height: 8px; border-radius: 999px; background: ${cols[k]}"></span><span style="flex: 1; font-size: 13.5px; color: ${T.sec}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${(ar ? EX_AR : EX)[k]}</span><span style="${ar ? `font-family: ${K.F.arBody}; font-weight: 500` : 'font-weight: 300'}; font-size: 17px; color: ${T.text}">${n(m, ar)}</span></div>` : '')).join('');
    const back = `<span style="position: absolute; ${ar ? 'right' : 'left'}: 16px; top: 56px; width: 44px; height: 44px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: ${T.text}; ${ar ? 'transform: scaleX(-1)' : ''}">${icon('back', 20)}</span>`;
    return `<span style="position: absolute; inset: 0; background: radial-gradient(90% 45% at 50% 20%, rgba(${K.rgbOf(T.hue.glow)},${T.dark ? 0.16 : 0.12}), rgba(0,0,0,0) 70%)"></span>
${back}
<div style="position: absolute; left: 16px; right: 16px; top: 116px; display: flex; flex-direction: column; gap: 6px">${lab(ar ? 'الحساب' : 'Account', T.ter, ar)}<span style="font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700;' : ''} font-size: 30px; color: ${T.text}">${ar ? 'ممارستك' : 'Your practice'}</span></div>
<svg width="390" height="480" viewBox="0 0 390 480" aria-hidden="true" style="position: absolute; left: 0; top: 0${ar ? '; transform: scaleX(-1)' : ''}">
<path d="${arc(START, START + SWEEP)}" fill="none" stroke="rgba(${K.rgbOf(T.text)},0.08)" stroke-width="10" stroke-linecap="round"></path>
${segs}
<circle cx="${kx.toFixed(1)}" cy="${ky.toFixed(1)}" r="7" fill="${T.ground}" stroke="${T.text}" stroke-width="3" style="animation: knob 400ms ease 1.3s both"></circle>
</svg>
<div style="position: absolute; left: 0; right: 0; top: ${cy - 76}px; display: flex; flex-direction: column; align-items: center; gap: 8px">
${lab(ar ? 'هذا الأسبوع' : 'This week', T.tone.glow, ar)}
${bigNum(total, 88, T.text, ar)}
<span style="font-family: ${ar ? K.F.arDisplay : K.F.display}; font-size: 20px; color: ${T.sec}">${ar ? 'دقيقة' : 'minutes'}</span>
</div>
<div style="position: absolute; left: 0; right: 0; top: ${cy + 92}px; display: flex; justify-content: center; align-items: baseline; gap: 8px">${lab(ar ? 'الأسبوع الماضي' : 'Last week', T.ter, ar)}<span style="${ar ? `font-family: ${K.F.arBody}; font-weight: 500` : 'font-weight: 300'}; font-size: 20px; color: ${T.sec}">${n(LAST_WEEK, ar)}</span></div>
<div style="position: absolute; left: 16px; right: 16px; top: 470px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">${legend}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 640px; height: 180px; border-radius: 24px; background: rgba(${K.rgbOf(T.hue.glow)},0.12); border: 1px solid rgba(${K.rgbOf(T.hue.glow)},0.28); box-sizing: border-box; padding: 20px; display: flex; gap: 20px">
<div style="flex: 1; display: flex; flex-direction: column; gap: 4px">${lab(ar ? 'السلسلة الحالية' : 'Current streak', T.ter, ar)}${bigNum(4, 56, T.text, ar)}<span style="font-size: 15px; color: ${T.sec}">${ar ? '٤ أيام' : '4 days'}</span></div>
<span style="width: 1px; background: rgba(${K.rgbOf(T.hue.glow)},0.28)"></span>
<div style="display: flex; flex-direction: column; gap: 4px">${lab(ar ? 'الأطول' : 'Longest', T.ter, ar)}${bigNum(9, 32, T.text, ar)}</div>
</div>`;
  };
  out.push(
    row('GraphsWeekArc.dc.html', {
      title: 'Phase 4 — Stats: the week as an arc',
      css,
      phones: [
        { T: TS, caption: 'Sunrise · Stats opens with the week: its minutes large on an arc, split by exercise in their tones (meditation in ink, Tanafas visits in half-ink).', html: phone(TS) },
        { T: TD, caption: 'Dusk · Last week beneath for scale, no arrow or verdict; the parts that week are listed with their minutes.', html: phone(TD) },
        { T: TN, caption: 'Night · The streak, badges and leaderboard follow as today. Titled “Your practice” now that it leads with more than the streak.', html: phone(TN) },
        { T: TN, ar: true, caption: 'Arabic · The arc fills from the right; Arabic-Indic numerals in Amiri.', html: phone(TN, true) },
      ],
    }),
  );
})();

/* ── 3 · Home's month of moons, with the nights practised ── */
(() => {
  const R = 118, cy = 500, sheetTop = 262;
  const phone = (T, ar = false) => {
    const tones = [T.tone.dusk, T.tone.glow, T.dark ? M.moonlight : T.text, T.tone.dawn, T.tone.bloom];
    const DAYS = Array.from({ length: 30 }, (_, i) => addDays(TODAY, i - 15)); // 1 Rabiʻ II = 12 Sep
    const practised = (k) => { const g = 11 + k; return g < 27 && SEPT[g] && sum(SEPT[g]) > 0 ? sum(SEPT[g]) : 0; };
    const moons = DAYS.map((d, k) => {
      const a = (-90 + (k / 30) * 360) * (Math.PI / 180);
      const px = 195 + (ar ? -1 : 1) * R * Math.cos(a), py = cy + R * Math.sin(a);
      const m = practised(k);
      const glow = m ? `<span style="position: absolute; inset: -4px; border-radius: 999px; background: radial-gradient(closest-side, rgba(${K.rgbOf(T.hue.glow)},${T.dark ? 0.55 : 0.45}), rgba(${K.rgbOf(T.hue.glow)},0))"></span>` : '';
      return `<span style="position: absolute; left: ${(px - 16).toFixed(1)}px; top: ${(py - 16).toFixed(1)}px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center">${glow}<span style="position: absolute; inset: 0; border-radius: 999px; border: 1.5px solid ${T.text}; opacity: ${k === 15 ? 0.3 : k === 9 ? 1 : 0}"></span><span style="position: relative">${K.moon(K.phaseOf(d), 8, { lit: tones[Math.min(4, Math.floor((k / 30) * 5))], dark: `rgba(${K.rgbOf(T.text)},0.1)` })}</span></span>`;
    }).join('');
    const sel = DAYS[9];
    return `${home(T, { rtl: ar, hero: 'none' })}
<span style="position: absolute; inset: 0; background: rgba(${T.veil},${T.dark ? 0.45 : 0.16}); backdrop-filter: blur(6px)"></span>
<div style="position: absolute; left: 0; right: 0; top: ${sheetTop}px; bottom: 0; border-radius: 30px 30px 0 0; background: ${T.sheet}; backdrop-filter: blur(24px); border: 1px solid ${T.line}; border-bottom: 0">
<span style="position: absolute; left: 175px; top: 12px; width: 40px; height: 5px; border-radius: 3px; background: rgba(${K.rgbOf(T.text)},0.25)"></span>
<div style="position: absolute; ${ar ? 'right' : 'left'}: 24px; top: 34px; display: flex; flex-direction: column; gap: 6px">${lab(ar ? 'الشهر' : 'The month', T.tone.glow, ar)}<span style="font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700;' : ''} font-size: 28px; color: ${T.text}">${ar ? 'ربيع الآخر ١٤٤٨' : 'Rabiʻ II 1448'}</span></div>
</div>
${moons}
<div style="position: absolute; left: 105px; top: ${cy - 70}px; width: 180px; height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center">
${lab(ar ? 'تربيع أول' : 'First quarter', T.sec, ar)}
${bigNum(10, 44, T.text, ar)}
<span style="font-size: 14px; color: ${T.sec}">${ar ? 'الأحد، ٢١ سبتمبر' : 'Sunday, September 21'}</span>
<span style="display: flex; align-items: center; gap: 6px; font-size: 13.5px; color: ${T.tone.glow}"><span style="width: 7px; height: 7px; border-radius: 999px; background: ${T.hue.glow}; box-shadow: 0 0 8px ${T.hue.glow}"></span>${ar ? `${K.ar(sum(SEPT[20]))} دقيقة من التمرّن` : `${sum(SEPT[20])} minutes practised`}</span>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 668px; display: flex; flex-direction: column; gap: 10px">
<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px"><span style="font-size: 16px; color: ${T.text}">${ar ? 'المحاق بعد ١٤ يوماً' : 'New moon in 14 days'}</span>${lab(ar ? 'الليلة · بدر' : 'Tonight · Full moon', T.ter, ar, 10)}</div>
<span style="font-size: 14px; line-height: 1.5; color: ${T.sec}">${ar ? 'كل ليالي الشهر الهجري بأطوارها. المس ليلة لتراها؛ الليلة محاطة بحلقة، والليالي التي تمرّنت فيها تتوهّج.' : 'Every night of the Hijri month in its phase. Tap one to see it; tonight has the ring, and the nights you practised glow.'}</span>
</div>`;
  };
  out.push(
    row('GraphsMonthGlow.dc.html', {
      title: 'Phase 4 — the month of moons, nights practised',
      phones: [
        { T: TS, caption: 'Sunrise · Home’s month of moons (phase 3), unchanged, with a soft glow behind each night practised.', html: phone(TS) },
        { T: TN, caption: 'Night · Tapping a practised night adds its minutes under the date; other nights look exactly as before.', html: phone(TN) },
        { T: TN, ar: true, caption: 'Arabic · The ring counter-clockwise, as before.', html: phone(TN, true) },
      ],
    }),
  );
})();

module.exports = out;
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}${b.interactive ? ' (interactive)' : ''}`).join('\n'));
