// "Houna — Home: suns and moons (phase 3)": the picked boards from the Explorations canvas
// (design/explorations/PICKS.md, section C) on Home, in Sunrise, Dusk and Night.
// Decided 27 Sep: the crescent bowl is Night's Home body ("Sun & moon"), the mark lifting out of the
// cup to become the starfield's moon; the star-lattice sun is Sunrise's sun on Home and in its scene;
// Home's header gains the Hijri date (the hilal on the evening a month begins), which opens the month
// of moons as a glass sheet; the sky clock is a scene of its own.
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const { home } = require('./make-home-appearance.js');
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;
const S = K.T.sunrise, D = K.T.dusk, N = K.T.night;
const TODAY = K.TODAY; // 27 Sep 2026, 16 Rabiʻ II 1448
const DAY = 86400000;
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const hijriDay = (d) => +new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric' }).format(d);
const hijriMonth = (d, lang = 'en', year = false) =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-GB-u-ca-islamic-umalqura', { month: 'long', ...(year ? { year: 'numeric' } : {}) })
    .format(d)
    .replace(/ AH$/, '')
    .replace(/ هـ$/, '');
const greg = (d, lang = 'en') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);

/* ── Moon phases, named (lib/moonPhase.ts's eighths) ── */
const PHASES = {
  en: ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'],
  ar: ['محاق', 'هلال متزايد', 'تربيع أول', 'أحدب متزايد', 'بدر', 'أحدب متناقص', 'تربيع أخير', 'هلال متناقص'],
};
const phaseName = (f, lang = 'en') => PHASES[lang][Math.floor(((f + 1 / 16) % 1) * 8)];

/* ── This Hijri month: its first day, its nights, and the evening the next begins ── */
const START = addDays(TODAY, -(hijriDay(TODAY) - 1));
const NIGHTS = [];
for (let i = 0; i < 31; i++) {
  const d = addDays(START, i);
  if (i >= 29 && hijriDay(d) === 1) break;
  NIGHTS.push({ d, f: K.phaseOf(d), h: hijriDay(d) });
}
const NEXT_FIRST = addDays(START, NIGHTS.length);
const TONIGHT = hijriDay(TODAY) - 1;
const NEW_IN = (() => {
  for (let i = 1; i < 31; i++) {
    const f = K.phaseOf(addDays(TODAY, i));
    if (f < 0.034 || f > 0.966) return i;
  }
  return 0;
})();

/* ── Themes: Home's tokens (make-home-appearance) with the tones ── */
const THEMES = ['sunrise', 'dusk', 'night'].map((k) => {
  const T = K.T[k];
  return { ...T, dark: k === 'night', veil: k === 'night' ? '11,16,38' : '29,43,42', sheet: k === 'night' ? 'rgba(18,26,62,0.82)' : 'rgba(255,255,255,0.78)' };
});
const [TS, TD, TN] = THEMES;
const PW = 390, PH = 844, PAD = 40, GAP = 40;
/** Phones side by side, a caption under each ("Name · note"). */
function row(file, { title, phones, css = '', logic }) {
  const W = PAD * 2 + phones.length * PW + (phones.length - 1) * GAP, H = PAD + PH + 100;
  const body = phones
    .map((p, i) => {
      const [name, ...rest] = p.caption.split(' · ');
      return `<div${p.ar ? ' dir="rtl"' : ''} style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; background: ${p.T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); font-family: ${p.ar ? K.F.arBody : K.F.body}">${p.html}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${name}</span>${rest.length ? `<span style="font-size: 13px; color: ${M.mist}">${rest.join(' · ')}</span>` : ''}</div>`;
    })
    .join('\n');
  return K.board(file, { title, w: W, h: H, root: 'background: #070B1C', css, body, logic, dir: DIR });
}

/* ── Home, as the app draws it (make-home-appearance's `home`), in English or Arabic ── */
const CX = 195, CY = 206;
function homeScreen(T, ar = false) {
  const h = home(T, { rtl: ar, hero: 'none' });
  if (!ar) return h;
  return h
    .replace("● YOU'RE NOT ALONE", '● لست وحدك')
    .replace("font-family: 'DM Mono', monospace; font-size: 11.5px; letter-spacing: 0.16em;", `font-family: ${K.F.arBody}; font-size: 14px;`)
    .replace('You are one light among many.', 'أنت نورٌ بين أنوارٍ كثيرة.')
    .replace("font-family: 'Marcellus', serif; font-size: 20px;", `font-family: ${K.F.arDisplay}; font-size: 22px;`)
    .replace('BREATHING TOGETHER', 'نتنفّس معاً')
    .replace("font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.14em;", `font-family: ${K.F.arBody}; font-size: 13px;`)
    .replace('people breathed with Houna this month', 'أشخاص تنفّسوا وتأمّلوا مع هُنا هذا الشهر')
    .replace('Need to talk now?', 'تحتاج إلى التحدث الآن؟')
    .replace(/font-family: 'Figtree', system-ui, sans-serif/, `font-family: ${K.F.arBody}`)
    .replace(/>Home</, '>الرئيسية<')
    .replace(/>Directory</, '>الدليل<')
    .replace(/>Tanafas</, '>تنفّس<')
    .replace(/>Events</, '>الفعاليات<')
    .replace(/>More</, '>المزيد<');
}

/* ── The bodies, in the mark's 190px box on Home ── */
const box = (inner, style = '') => `<div aria-hidden="true" style="position: absolute; left: ${CX - 95}px; top: ${CY - 95}px; width: 190px; height: 190px; ${style}">${inner}</div>`;
const edgeHalo = (rgb, a, r) => `<span style="position: absolute; left: -25px; top: -25px; width: 240px; height: 240px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${rgb},0) ${(((r - 3) / 120) * 100).toFixed(1)}%, rgba(${rgb},${a}) ${(((r + 4) / 120) * 100).toFixed(1)}%, rgba(${rgb},0) 100%); animation: breath 5s ease-in-out infinite"></span>`;
const discAt = (size, d) => `<span style="position: absolute; left: ${95 - size / 2}px; top: ${95 - size / 2}px; width: ${size}px; height: ${size}px; border-radius: 999px; background: ${d.stops}; box-shadow: 0 0 14px rgba(${d.glow},0.45)"></span>`;

/** Night: the crescent bowl, dawn-lit, the mark resting in its hollow and floating a little on the breath. */
function bowl(id, { lift = 0, cup = 1, markOpacity = 0.9 } = {}) {
  return box(
    `<svg width="190" height="190" viewBox="0 0 240 240" style="position: absolute; inset: 0; opacity: ${cup}; animation: bowlGlow 5s ease-in-out infinite; overflow: visible"><defs><radialGradient id="bowl${id}" cx="50%" cy="72%" r="60%"><stop offset="0" stop-color="#FFD9A0"></stop><stop offset="0.55" stop-color="${N.tone.dawn}"></stop><stop offset="1" stop-color="#E4826A"></stop></radialGradient><mask id="cup${id}"><rect width="240" height="240" fill="#fff"></rect><circle cx="120" cy="58" r="118" fill="#000"></circle></mask></defs><circle cx="120" cy="120" r="112" fill="url(#bowl${id})" mask="url(#cup${id})"></circle></svg>
<div style="position: absolute; left: ${95 - 16}px; top: ${117 - 16 - lift}px; width: 32px; height: 32px; animation: markFloat 5s ease-in-out infinite">${K.mark(32, M.moonlight, { style: `opacity: ${markOpacity}` })}</div>`,
  );
}
/** Sunrise: the star-lattice sun: four eight-point stars turning in pairs, opposite ways, round the pale-gold disc. */
// The stars' radii, in disc radii: close round the disc on Home (clear of the logo and the date),
// wider in the scene, where the sky is empty (the Explorations board's).
const LATTICE = { home: [2.0, 1.6, 2.3, 1.3], scene: [3.08, 2.46, 3.77, 1.92] };
function starSun(disc = 104, { where = 'home' } = {}) {
  const r = disc / 2, c = 170;
  const [a1, a2, b1, b2] = LATTICE[where];
  const ring = (k, rot, sw, color, op) => `<polygon points="${K.star8(c, c, r * k, rot)}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="${op}"></polygon>`;
  const lattice = `<svg width="340" height="340" viewBox="0 0 340 340" aria-hidden="true" style="position: absolute; left: ${95 - 170}px; top: ${95 - 170}px; overflow: visible">
<g class="turnA">${ring(a1, 0, 1, S.tone.dawn, 0.35)}${ring(a2, 22.5, 1, S.hue.dawn, 0.5)}</g>
<g class="turnB">${ring(b1, 11.25, 0.8, S.tone.dawn, 0.2)}${ring(b2, 0, 1.2, S.hue.dawn, 0.6)}</g>
</svg>`;
  return `${lattice}${edgeHalo(K.DISCS.sunrise.glow, 0.5, r)}${discAt(disc, K.DISCS.sunrise)}<div style="position: absolute; inset: 0">${K.pressedMark(disc * 0.56, K.DISCS.sunrise.surface)}</div>`;
}
const duskSun = () => `${edgeHalo(K.DISCS.dusk.glow, 0.55, 52)}${discAt(104, K.DISCS.dusk)}<div style="position: absolute; inset: 0">${K.pressedMark(58, K.DISCS.dusk.surface)}</div>`;

/* ── Home's Hijri date: under the logo, tonight's moon beside it; the hilal on the evening a month begins ── */
function dateChip(T, { ar = false, hilal = false } = {}) {
  const lit = T.dark ? M.moonlight : T.accent;
  const f = hilal ? 0.07 : K.phaseOf(TODAY);
  const glyph = K.moon(f, 7, { lit, dark: T.dark ? 'rgba(242,236,221,0.16)' : `rgba(${K.rgbOf(T.accent)},0.16)`, glow: hilal ? `rgba(${K.rgbOf(T.hue.glow)},0.8)` : '' });
  const date = hilal
    ? ar ? `الهلال · ${hijriMonth(NEXT_FIRST, 'ar')}` : `The new crescent · ${hijriMonth(NEXT_FIRST)}`
    : ar ? `${K.hijri(TODAY, 'ar').replace(/ هـ$/, '')} · ${phaseName(f, 'ar')}` : `${K.hijri(TODAY)} · ${phaseName(f)}`;
  const [a, b] = date.split(' · ');
  return `<span style="position: absolute; left: 50%; top: 80px; transform: translateX(-50%); height: 28px; padding: 0 12px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; gap: 8px; white-space: nowrap; font-size: ${ar ? 13 : 12.5}px; color: ${T.text}">${glyph}<span style="font-weight: 600">${a}</span><span style="color: ${T.sec}">${b}</span></span>`;
}

const BASE = `@keyframes breath{0%{transform:scale(0.95);opacity:0.35}50%{transform:scale(1.06);opacity:1}100%{transform:scale(0.95);opacity:0.35}}
@keyframes bowlGlow { 0%,100% { filter: drop-shadow(0 0 16px rgba(242,184,128,0.35)) } 50% { filter: drop-shadow(0 0 30px rgba(242,184,128,0.6)) } }
@keyframes markFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
@keyframes spinCW { to { transform: rotate(360deg) } }
@keyframes spinCCW { to { transform: rotate(-360deg) } }
.turnA { transform-origin: 170px 170px; animation: spinCW 90s linear infinite }
.turnB { transform-origin: 170px 170px; animation: spinCCW 120s linear infinite }`;

const out = [];

/* ── 1 · Night: the crescent bowl on Home, and the handoff to the starfield ── */
(() => {
  const handoff = `<div style="position: absolute; inset: 0; background: ${M.midnight}">${K.starfield(70, 390, 844, 3)}</div>
${bowl('h', { lift: 70, cup: 0.25, markOpacity: 0 })}
<div aria-hidden="true" style="position: absolute; left: ${CX - 30}px; top: ${CY + 22 - 30 - 92}px; width: 60px; height: 60px">
<span style="position: absolute; inset: -18px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${K.DISCS.teal.glow},0) 60%, rgba(${K.DISCS.teal.glow},0.45) 72%, rgba(${K.DISCS.teal.glow},0) 100%)"></span>
<span style="position: absolute; inset: 0; border-radius: 999px; background: ${K.DISCS.teal.stops}; opacity: 0.55"></span>
${K.mark(40, M.moonlight, { style: 'opacity: 0.55' })}
</div>
<svg aria-hidden="true" width="390" height="844" style="position: absolute; inset: 0"><path d="M195 ${CY + 22} C 195 ${CY - 20}, 195 ${CY - 60}, 195 ${CY - 70}" stroke="rgba(242,236,221,0.35)" stroke-width="1.2" stroke-dasharray="3 5" fill="none"></path></svg>
<span style="position: absolute; left: 0; right: 0; top: 720px; text-align: center">${K.label('Tanafas', M.mist)}</span>`;
  out.push(
    row('BodiesNight.dc.html', {
      title: 'Phase 3 — Night: the crescent bowl',
      css: BASE,
      phones: [
        { T: TN, caption: 'Night · Home’s body is the crescent bowl, lit like dawn; the mark rests in its hollow, floating a little on the 5s breath.', html: `${homeScreen(TN)}${dateChip(TN)}${bowl('a')}` },
        { T: TN, caption: 'Tap · Home steps back and the cup fades; the mark lifts out and glides up, becoming tonight’s moon on the way (as Classic’s mark does). Back reverses it.', html: handoff },
        { T: TN, ar: true, caption: 'Arabic · The bowl and sky don’t mirror; the Hijri date reads right to left.', html: `${homeScreen(TN, true)}${dateChip(TN, { ar: true })}${bowl('b')}` },
      ],
    }),
  );
})();

/* ── 2 · The Hijri date on Home, all three themes, and the evening a month begins ── */
(() => {
  out.push(
    row('BodiesDate.dc.html', {
      title: 'Phase 3 — Home: the Hijri date',
      css: BASE,
      phones: [
        { T: TS, caption: 'Sunrise · Under the logo: tonight’s moon, the Hijri date and the phase’s name. Tap it for the month.', html: `${homeScreen(TS)}${dateChip(TS)}${box(starSun())}` },
        { T: TD, caption: 'Dusk · The same, over the evening sun.', html: `${homeScreen(TD)}${dateChip(TD)}${box(duskSun())}` },
        { T: TN, caption: 'Night · From sunset the Hijri day has turned, so the date moves on at maghrib (from 6 pm).', html: `${homeScreen(TN)}${dateChip(TN)}${bowl('c')}` },
        { T: TN, caption: `The evening a month begins · ${greg(addDays(NEXT_FIRST, -1))}: the hilal, glowing, and the new month’s name.`, html: `${homeScreen(TN)}${dateChip(TN, { hilal: true })}${bowl('d')}` },
      ],
    }),
  );
})();

/* ── 3 · The month of moons, a glass sheet from the date ── */
(() => {
  const R = 118, cy = 500, sheetTop = 262;
  const tones = (T) => [T.tone.dusk, T.tone.glow, T.dark ? M.moonlight : T.text, T.tone.dawn, T.tone.bloom];
  const phone = (T, ar = false) => {
    const sfx = ar ? 'Ar' : '';
    const n = NIGHTS.length;
    const moons = NIGHTS.map((x, k) => {
      const a = (-90 + (k / n) * 360) * (Math.PI / 180);
      const px = 195 + (ar ? -1 : 1) * R * Math.cos(a), py = cy + R * Math.sin(a);
      const lit = tones(T)[Math.min(4, Math.floor((k / n) * 5))];
      return `<button type="button" onClick="{{pick${k}}}" aria-label="${K.hijri(x.d, ar ? 'ar' : 'en')}" style="position: absolute; left: ${(px - 16).toFixed(1)}px; top: ${(py - 16).toFixed(1)}px; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 999px; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center">
<span style="position: absolute; inset: 0; border-radius: 999px; border: 1.5px solid ${T.text}; opacity: {{r${k}}}; transition: opacity 300ms ease"></span>
${K.moon(x.f, 8, { lit, dark: T.dark ? 'rgba(242,236,221,0.1)' : `rgba(${K.rgbOf(T.text)},0.1)` })}
</button>`;
    }).join('');
    const title = ar
      ? `<span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 30px; color: ${T.text}">${hijriMonth(TODAY, 'ar', true)}</span>`
      : `<span style="font-family: ${K.F.display}; font-size: 28px; color: ${T.text}">${hijriMonth(TODAY, 'en', true)} <span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 22px; color: ${T.sec}" lang="ar">${hijriMonth(TODAY, 'ar')}</span></span>`;
    return `${homeScreen(T, ar)}${dateChip(T, { ar })}${T.key === 'night' ? bowl('m' + sfx) : T.key === 'dusk' ? box(duskSun()) : box(starSun())}
<span style="position: absolute; inset: 0; background: rgba(${T.veil},${T.dark ? 0.45 : 0.16}); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px)"></span>
<div style="position: absolute; left: 0; right: 0; top: ${sheetTop}px; bottom: 0; border-radius: 30px 30px 0 0; background: ${T.sheet}; backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid ${T.line}; border-bottom: 0">
<span style="position: absolute; left: 175px; top: 12px; width: 40px; height: 5px; border-radius: 3px; background: ${T.dark ? 'rgba(242,236,221,0.25)' : 'rgba(29,43,42,0.25)'}"></span>
<div style="position: absolute; ${ar ? 'right' : 'left'}: 24px; top: 34px; display: flex; flex-direction: column; gap: 6px">${ar ? K.arLabel('الشهر', T.tone.glow) : K.label('The month', T.tone.glow)}${title}</div>
</div>
${moons}
<div style="position: absolute; left: ${195 - 90}px; top: ${cy - 62}px; width: 180px; height: 124px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center">
${ar ? `<span style="font-size: 13px; font-weight: 500; color: ${T.sec}">{{phase${sfx}}}</span>` : K.label(`{{phase${sfx}}}`, T.sec)}
<span style="font-family: ${ar ? K.F.arDisplay : K.F.body}; font-weight: ${ar ? 700 : 300}; font-size: ${ar ? 46 : 44}px; line-height: 1; color: ${T.text}">{{day${sfx}}}</span>
<span style="font-size: 14px; color: ${T.sec}">{{greg${sfx}}}</span>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 668px; display: flex; flex-direction: column; gap: 10px">
<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px"><span style="font-size: 16px; color: ${T.text}">${ar ? `المحاق بعد <span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 22px">${K.ar(NEW_IN)}</span> ${NEW_IN >= 3 && NEW_IN <= 10 ? 'أيام' : 'يوماً'}` : `New moon in <span style="font-weight: 300; font-size: 22px">${NEW_IN}</span> days`}</span>${ar ? K.arLabel(`الليلة · ${phaseName(K.phaseOf(TODAY), 'ar')}`, T.ter, 12) : K.label(`Tonight · ${phaseName(K.phaseOf(TODAY))}`, T.ter, 10)}</div>
<span style="font-size: 14px; line-height: 1.5; color: ${T.sec}">${ar ? 'كل ليالي الشهر الهجري بأطوارها. المس ليلة لتراها؛ الليلة محاطة بحلقة.' : 'Every night of the Hijri month in its phase. Tap one to see it; tonight has the ring.'}</span>
</div>`;
  };
  const info = NIGHTS.map((x) => ({
    day: String(x.h), dayAr: K.ar(x.h),
    phase: phaseName(x.f), phaseAr: phaseName(x.f, 'ar'),
    greg: greg(x.d), gregAr: greg(x.d, 'ar'),
  }));
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: ${TONIGHT} };
  }
  renderVals() {
    const info = ${JSON.stringify(info)};
    const s = this.state.sel, x = info[s];
    const v = { day: x.day, phase: x.phase, greg: x.greg, dayAr: x.dayAr, phaseAr: x.phaseAr, gregAr: x.gregAr };
    for (let k = 0; k < ${NIGHTS.length}; k++) {
      v['r' + k] = k === s ? 1 : (k === ${TONIGHT} ? 0.3 : 0);
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(
    row('BodiesMonth.dc.html', {
      title: 'Phase 3 — the month of moons',
      css: BASE,
      logic,
      phones: [
        { T: TS, caption: 'Sunrise · Tapping the date opens the month as a glass sheet over Home: every night in its real phase, clockwise from the 1st.', html: phone(TS) },
        { T: TD, caption: 'Dusk · Tap a night (on any phone) to see its phase and date in the middle; tonight keeps a faint ring.', html: phone(TD) },
        { T: TN, caption: 'Night · The moons take the tones in turn through the month; the count to the next new moon below.', html: phone(TN) },
        { T: TN, ar: true, caption: 'Arabic · The ring runs counter-clockwise from the 1st, as the text reads; numbers in Arabic-Indic.', html: phone(TN, true) },
      ],
    }),
  );
})();

/* ── 4 · Sunrise: the star-lattice sun, on Home and in the scene ── */
(() => {
  const sky = 'linear-gradient(180deg, #A9DDE0 0%, #DDF1EF 38%, #FCE7D8 74%, #FBC9A6 100%)';
  const scene = `<span style="position: absolute; inset: 0; background: ${sky}"></span>
<div aria-hidden="true" style="position: absolute; left: ${195 - 95}px; top: ${Math.round(844 * 0.42) - 95}px; width: 190px; height: 190px; transform: scale(1.25)">${starSun(104, { where: 'scene' })}</div>
<span style="position: absolute; left: 0; right: 0; top: 720px; text-align: center">${K.label('Tanafas', S.sec)}</span>`;
  out.push(
    row('BodiesStarSun.dc.html', {
      title: 'Phase 3 — Sunrise: the star-lattice sun',
      css: BASE,
      phones: [
        { T: TS, caption: 'Home · Sunrise’s sun keeps its disc and pressed mark; its rays are now four eight-point stars, two turning each way (90s and 120s a lap).', html: `${homeScreen(TS)}${dateChip(TS)}${box(starSun())}` },
        { T: TS, caption: 'Houna sunrise · The same sun rises into the morning sky; the stars turn on, slow enough to watch, never enough to hurry you.', html: scene },
      ],
    }),
  );
})();

/* ── 5 · The sky clock: a scene of its own ── */
(() => {
  const L = 28;
  const kf = (name, on) => `@keyframes ${name} { ${on.map(([t, o]) => `${t}% { opacity: ${o} }`).join(' ')} }`;
  const SKY = {
    dawn: 'linear-gradient(180deg, #274A5E 0%, #4F7A86 42%, #C99A8A 80%, #F2B38F 100%)',
    day: 'linear-gradient(180deg, #A9DDE0 0%, #DDF1EF 38%, #FCE7D8 74%, #FBC9A6 100%)',
    dusk: 'linear-gradient(180deg, #2E2A5C 0%, #5A4E9A 40%, #A785B0 76%, #EFA07E 100%)',
    night: `linear-gradient(180deg, ${M.midnight} 0%, ${M.nightfall} 60%, #1C2452 100%)`,
  };
  const css = `${BASE}
${kf('skyDawn', [[0, 1], [18, 1], [28, 0], [90, 0], [100, 1]])}
${kf('skyDay', [[0, 0], [18, 0], [28, 1], [42, 1], [52, 0], [100, 0]])}
${kf('skyDusk', [[0, 0], [42, 0], [52, 1], [64, 1], [74, 0], [100, 0]])}
${kf('skyNight', [[0, 0], [64, 0], [74, 1], [90, 1], [100, 0]])}
@keyframes sunArc { 0% { transform: rotate(-40deg) } 66% { transform: rotate(40deg) } 100% { transform: rotate(40deg) } }
@keyframes sunShow { 0% { opacity: 1 } 62% { opacity: 1 } 68% { opacity: 0 } 96% { opacity: 0 } 100% { opacity: 1 } }
@keyframes moonArc { 0% { transform: rotate(-40deg) } 60% { transform: rotate(-40deg) } 100% { transform: rotate(22deg) } }
@keyframes moonShow { 0% { opacity: 0 } 64% { opacity: 0 } 72% { opacity: 1 } 94% { opacity: 1 } 100% { opacity: 0 } }
${kf('wDawn', [[0, 1], [20, 1], [25, 0], [95, 0], [100, 1]])}
${kf('wDay', [[0, 0], [22, 0], [27, 1], [45, 1], [50, 0], [100, 0]])}
${kf('wDusk', [[0, 0], [47, 0], [52, 1], [67, 1], [72, 0], [100, 0]])}
${kf('wNight', [[0, 0], [70, 0], [75, 1], [93, 1], [98, 0], [100, 0]])}`;
  const hills = `<svg width="390" height="300" viewBox="0 0 390 300" aria-hidden="true" style="position: absolute; left: 0; top: 544px"><path d="M0 30 Q100 0 200 22 T390 14 V300 H0 Z" fill="rgba(11,16,38,0.55)"></path><path d="M0 70 Q140 36 260 64 T390 58 V300 H0 Z" fill="rgba(11,16,38,0.82)"></path></svg>`;
  const sun = (style) => `<span style="position: absolute; left: -44px; top: -464px; width: 88px; height: 88px; border-radius: 999px; background: ${K.DISCS.sunrise.stops}; box-shadow: 0 0 40px rgba(249,169,128,0.7); ${style}"><span style="position: absolute; inset: 0">${K.pressedMark(48, K.DISCS.sunrise.surface)}</span></span>`;
  const moonAt = (style) => `<span style="position: absolute; left: -38px; top: -438px; ${style}">${K.moon(K.phaseOf(TODAY), 38, { lit: M.moonlight, dark: 'rgba(242,236,221,0.08)', glow: 'rgba(242,236,221,0.5)' })}</span>`;
  const pivot = (inner, style) => `<div aria-hidden="true" style="position: absolute; left: 195px; top: 760px; width: 0; height: 0; ${style}">${inner}</div>`;
  const words = (ar) => (ar ? { dawn: 'الفجر', day: 'النهار', dusk: 'الغروب', night: 'الليل' } : { dawn: 'Dawn', day: 'Day', dusk: 'Dusk', night: 'Night' });
  const word = (t, anim, ar) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: ${ar ? K.F.arDisplay : K.F.display}; font-size: ${ar ? 30 : 28}px; ${ar ? 'font-weight: 700;' : ''} color: ${M.moonlight}; ${anim ? `opacity: 0; animation: ${anim} ${L}s linear infinite` : ''}">${t}</span>`;
  const sub = (t, ar) => `<span style="position: absolute; left: 32px; right: 32px; top: 702px; text-align: center">${ar ? K.arLabel(t, M.mist, 13) : K.label(t, M.mist, 11)}</span>`;
  const playing = `${['dawn', 'day', 'dusk', 'night'].map((k, i) => `<span style="position: absolute; inset: 0; background: ${SKY[k]}; animation: ${['skyDawn', 'skyDay', 'skyDusk', 'skyNight'][i]} ${L}s linear infinite"></span>`).join('')}
<span style="position: absolute; inset: 0; animation: skyNight ${L}s linear infinite">${K.starfield(40, 390, 520, 13)}</span>
${pivot(sun(`animation: sunShow ${L}s linear infinite`), `animation: sunArc ${L}s ease-in-out infinite`)}
${pivot(moonAt(`animation: moonShow ${L}s linear infinite`), `animation: moonArc ${L}s ease-in-out infinite`)}
${hills}
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 646px; height: 40px">${['dawn', 'day', 'dusk', 'night'].map((k, i) => word(words(false)[k], ['wDawn', 'wDay', 'wDusk', 'wNight'][i])).join('')}</div>
${sub('Today, from dawn', false)}`;
  const place = (inner, x, y) => `<div aria-hidden="true" style="position: absolute; left: ${x}px; top: ${y}px; width: 0; height: 0"><div style="position: absolute; left: 0; top: 0; transform: translate(0, 0)">${inner}</div></div>`;
  const held = (k, { at, ar = false, time, rise }) => `<span style="position: absolute; inset: 0; background: ${SKY[k]}"></span>
${k === 'night' ? K.starfield(46, 390, 520, 17) : ''}
${k === 'night' ? place(moonAt('left: -38px; top: -38px'), at.x, at.y) : place(sun('left: -44px; top: -44px'), at.x, at.y)}
${hills}
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 646px; height: 40px">${word(words(ar)[k], '', ar)}</div>
${sub(`${time} · ${rise}`, ar)}`;
  out.push(
    row('BodiesSky.dc.html', {
      title: 'Phase 3 — the sky clock',
      css,
      phones: [
        { T: TN, caption: 'Opening · Long-press Home’s sun or moon (or the screen reader’s “Today’s sky” action): the day plays from dawn to now in about 20 seconds.', html: playing },
        { T: TN, caption: 'Then it holds at the hour · Here 5:50 pm: the sun low over the western hills, the sky turning violet. The sky moves with the clock while it’s open; your theme is untouched.', html: held('dusk', { at: { x: 300, y: 540 }, time: '5:50 PM', rise: 'Sunset 6:02 PM' }) },
        { T: TN, ar: true, caption: 'Arabic, 9:30 pm · Tonight’s moon in its real phase over the hills; the sky doesn’t mirror. Every visit counts as a Tanafas session, like the starfield.', html: held('night', { at: { x: 250, y: 260 }, ar: true, time: '٩:٣٠ م', rise: 'الشروق ٦:٠٤ ص' }) },
      ],
    }),
  );
})();

module.exports = out;
// The bodies, for the boards that follow (phase 5's splash).
module.exports.helpers = { bowl, starSun, duskSun, box, homeScreen, BASE };
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}${b.interactive ? ' (interactive)' : ''}`).join('\n'));
