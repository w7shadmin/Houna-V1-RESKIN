// "Houna — Account & badges (phase 6)": section E of the Explorations picks (design/explorations/PICKS.md)
// merged with the held Profile & badges plan (make-profile.js), in Sunrise, Dusk and Night, Arabic
// where layout changes. Decided 28 Sep: the badges are the nine skies set inside gems; Your sky sits
// on Profile beside the month in ridges; each badge says how many of Houna hold it.
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const { icon } = require('../../explorations/scripts/icons.js');
const { art, BADGES } = require('./make-profile.js');
const { data } = require('./make-graphs-phase.js');
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;
const out = [];

/* ── The example person: noor, a 12-day streak through Sunday 27 September ── */
const TODAY_D = 27;
// The graphs' September, with the last twelve days all practised (the streak).
const SEPT = data.SEPT.map((d, i) => (d && i + 1 > TODAY_D - 12 && d.every((x) => !x) ? [5, 0, 0, 0, 0, 0] : d));
const sum = (a) => a.reduce((x, y) => x + y, 0);
const PRACTISED = SEPT.map((d, i) => (d && sum(d) > 0 ? i + 1 : 0)).filter(Boolean);
/** The parts of practice this month has (for the ridges' key). */
const PARTS = [0, 1, 2, 3, 4, 5].filter((k) => SEPT.some((d) => d && d[k] > 0));
const MONTH_MIN = SEPT.reduce((a, d) => a + (d ? sum(d) : 0), 0);
const SESSIONS = SEPT.reduce((a, d) => a + (d ? d.filter((x) => x > 0).length : 0), 0);
const EARNED = new Set(['first_session', 'streak_3', 'streak_7', 'all_breathing']);
const HELD = { first_session: 64, streak_3: 38, streak_7: 21, all_breathing: 17, streak_14: 12, streak_30: 6, streak_100: 1, all_scenes: 9, all_skies: 14 };
const EARNED_ON = { first_session: 1, streak_3: 18, streak_7: 22, all_breathing: 9 };
const B = Object.fromEntries(BADGES.map((b) => [b.code, b]));
const ORDER = ['first_session', 'streak_3', 'streak_7', 'all_breathing', 'streak_14', 'streak_30', 'streak_100', 'all_scenes', 'all_skies'];
const HOW_AR = {
  streak_3: '٣ أيام متتالية', streak_7: '٧ أيام متتالية', streak_14: '١٤ يومًا متتاليًا', streak_30: '٣٠ يومًا متتاليًا', streak_100: '١٠٠ يوم متتالية',
  first_session: 'أول جلسة تنفّس أو تأمّل', all_breathing: 'تمارين التنفّس الأربعة', all_scenes: 'المشاهد الأربعة', all_skies: 'الشروق والغسق والنجوم',
};
const HOW_EN = {
  streak_3: '3 days in a row', streak_7: '7 days in a row', streak_14: '14 days in a row', streak_30: '30 days in a row', streak_100: '100 days in a row',
  first_session: 'Your first session', all_breathing: 'All four breathing exercises', all_scenes: 'All four meditation scenes', all_skies: 'The sunrise, the dusk and the starfield',
};

/* ── Themes and phones ── */
const THEMES = ['sunrise', 'dusk', 'night'].map((k) => ({ ...K.T[k], dark: k === 'night' }));
const [TS, TD, TN] = THEMES;
const DISC = { sunrise: K.DISCS.sunrise, dusk: K.DISCS.dusk, night: K.DISCS.teal };
const exColours = (T) => [T.tone.glow, T.tone.dusk, T.tone.dawn, T.tone.bloom, T.text, `rgba(${K.rgbOf(T.text)},0.5)`];
const PW = 390, PAD = 40, GAP = 40;
function row(file, { title, phones, css = '', logic, ph = 844 }) {
  const W = PAD * 2 + phones.length * PW + (phones.length - 1) * GAP, H = PAD + ph + 100;
  const body = phones
    .map((p, i) => {
      const [name, ...rest] = p.caption.split(' · ');
      return `<div${p.ar ? ' dir="rtl"' : ''} style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD}px; width: ${PW}px; height: ${ph}px; border-radius: 34px; overflow: hidden; background: ${p.T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35); font-family: ${p.ar ? K.F.arBody : K.F.body}; color: ${p.T.text}">${p.html}</div>
<div style="position: absolute; left: ${PAD + i * (PW + GAP)}px; top: ${PAD + ph + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${name}</span>${rest.length ? `<span style="font-size: 13px; line-height: 1.45; color: ${M.mist}">${rest.join(' · ')}</span>` : ''}</div>`;
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
const display = (t, size, T, ar) => `<span style="font-family: ${ar ? K.F.arDisplay : K.F.display}; ${ar ? 'font-weight: 700;' : ''} font-size: ${ar ? size + 2 : size}px; line-height: 1.25; color: ${T.text}">${t}</span>`;
const card = (T) => `background: ${T.card}; border: 1px solid ${T.line}; border-radius: 22px; box-sizing: border-box`;
const chevron = (T, ar) => `<span style="display: flex; color: ${T.ter}; ${ar ? 'transform: scaleX(-1)' : ''}">${icon('next', 18)}</span>`;
const backBtn = (T, ar) => `<span aria-label="${ar ? 'رجوع' : 'Back'}" style="position: absolute; ${ar ? 'right' : 'left'}: 16px; top: 56px; width: 48px; height: 48px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box; display: flex; align-items: center; justify-content: center; color: ${T.text}; ${ar ? 'transform: scaleX(-1)' : ''}">${icon('back', 20)}</span>`;
const topGlow = (T, rgb, cy = 22) => `<span aria-hidden="true" style="position: absolute; inset: 0; background: radial-gradient(70% 34% at 50% ${cy}%, rgba(${rgb},${T.dark ? 0.18 : 0.16}), rgba(0,0,0,0) 72%)"></span>`;
const nightStars = (T, h = 380, seedStart = 71) => (T.dark ? K.starfield(26, 390, h, seedStart) : '');
const badgeName = (code, ar) => (ar ? B[code].ar : B[code].en);

/* ── The gem: a badge's sky, set in lit glass ── */
const GLOW = { streak_3: '249,169,128', streak_7: '249,169,128', streak_14: '249,169,128', streak_30: '111,214,207', streak_100: '111,214,207', first_session: '111,214,207', all_breathing: '179,167,245', all_scenes: '143,155,240', all_skies: '234,144,168' };
/**
 * One badge: its sky (make-profile.js' art) in a sphere of glass, a highlight up and to the left, a
 * deeper edge low and to the right, a rim, and its own light round it. Locked: the same gem unlit,
 * the sky greyed and faint, no light.
 */
function gem(code, S, T, { locked = false, float = 0, delay = 0 } = {}) {
  const g = GLOW[code];
  const hl = `<span style="position: absolute; left: ${(S * 0.17).toFixed(1)}px; top: ${(S * 0.13).toFixed(1)}px; width: ${(S * 0.3).toFixed(1)}px; height: ${(S * 0.17).toFixed(1)}px; border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,${locked ? 0.45 : 0.85}), rgba(255,255,255,0)); transform: rotate(-30deg)"></span>`;
  return `<span role="img" aria-label="${B[code].en}${locked ? ', not yet' : ''}" style="position: relative; display: block; flex-shrink: 0; width: ${S}px; height: ${S}px; ${float ? `animation: float ${float}s ease-in-out ${delay}s infinite` : ''}">
${locked ? '' : `<span aria-hidden="true" style="position: absolute; left: ${-S * 0.35}px; top: ${-S * 0.35}px; width: ${S * 1.7}px; height: ${S * 1.7}px; border-radius: 999px; background: radial-gradient(closest-side, rgba(${g},${T.dark ? 0.42 : 0.34}), rgba(${g},0))"></span>`}
<span style="position: absolute; inset: 0; border-radius: 999px; overflow: hidden; ${locked ? `filter: grayscale(1); opacity: ${T.dark ? 0.3 : 0.38}` : ''}">${art(code, S)}</span>
<span aria-hidden="true" style="position: absolute; inset: 0; border-radius: 999px; background: radial-gradient(circle at 34% 26%, rgba(255,255,255,${locked ? 0.16 : 0.34}) 0%, rgba(255,255,255,0.08) 26%, rgba(255,255,255,0) 46%); box-shadow: inset ${(-S * 0.06).toFixed(1)}px ${(-S * 0.09).toFixed(1)}px ${(S * 0.16).toFixed(1)}px rgba(0,0,0,${locked ? 0.18 : 0.38}), inset 0 0 0 1px rgba(255,255,255,${locked ? (T.dark ? 0.14 : 0.5) : 0.42})${locked && !T.dark ? `, 0 0 0 1px ${T.line}` : ''}"></span>
${hl}
</span>`;
}
const pedestal = (w, T) => `<span aria-hidden="true" style="display: block; width: ${w}px; height: ${Math.round(w * 0.16)}px; border-radius: 50%; background: radial-gradient(closest-side, ${T.dark ? 'rgba(242,236,221,0.2)' : 'rgba(29,43,42,0.14)'}, rgba(0,0,0,0))"></span>`;
const FLOAT_CSS = `@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }`;

/* ── Small glyphs for the three numbers ── */
const glyph = {
  streak: (T) => K.moon(0.3, 13, { lit: T.tone.dawn, dark: `rgba(${K.rgbOf(T.tone.dawn)},0.14)`, glow: T.dark ? 'rgba(242,184,128,0.7)' : '' }),
  sessions: (T) => `<span style="display: block; width: 26px; height: 26px; border-radius: 999px; background: radial-gradient(circle at 34% 30%, rgba(255,255,255,0.95) 0%, rgba(${K.rgbOf(T.hue.glow)},0.55) 45%, rgba(${K.rgbOf(T.hue.glow)},0.8) 100%); box-shadow: 0 0 10px rgba(${K.rgbOf(T.hue.glow)},0.55)"></span>`,
  badges: (T) => `<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" style="display: block; overflow: visible; ${T.dark ? 'filter: drop-shadow(0 0 5px rgba(179,167,245,0.7))' : ''}"><polygon points="${K.star8(14, 14, 13)}" fill="${T.tone.dusk}"></polygon></svg>`,
};

/* ── Your sky: a star for each day practised this month, joined in order ── */
function skyPoints(w, h, ar) {
  let seed = 23;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return PRACTISED.map((d, i) => {
    const x = 18 + ((d - 1) / 29) * (w - 36);
    const y = h * 0.84 - (i / (PRACTISED.length - 1)) * h * 0.62 + Math.sin(i * 1.7) * h * 0.08 + (rnd() - 0.5) * h * 0.08;
    return { d, x: ar ? w - x : x, y };
  });
}
function skySvg(T, w, h, ar, { big = false } = {}) {
  const P = skyPoints(w, h, ar);
  const last = P[P.length - 1];
  const star = T.dark ? M.moonlight : T.text;
  const line = T.dark ? 'rgba(111,214,207,0.45)' : `rgba(${K.rgbOf(T.accent)},0.45)`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" style="display: block; overflow: visible">
<path d="${P.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')}" fill="none" stroke="${line}" stroke-width="1"></path>
${P.slice(0, -1).map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${big ? 3.6 : 2.6}" fill="${star}" style="filter: drop-shadow(0 0 ${big ? 5 : 3}px ${T.dark ? 'rgba(242,236,221,0.6)' : `rgba(${K.rgbOf(T.accent)},0.35)`})"></circle>`).join('')}
<circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="${big ? 7 : 5}" fill="${T.tone.glow}" style="filter: drop-shadow(0 0 ${big ? 10 : 7}px ${T.hue.glow}); transform-origin: ${last.x.toFixed(1)}px ${last.y.toFixed(1)}px; animation: newStar 4s ease-in-out infinite"></circle>
</svg>`;
}
const SKY_CSS = `@keyframes newStar { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.25); opacity: 0.8 } }`;

/* ── The month in ridges: minutes per part of practice, a seven-day average, today's line ── */
function smooth(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
let ridgeId = 0;
function ridgesSvg(T, w, h, ar) {
  const id = `rg${ridgeId++}`;
  const cols = exColours(T);
  const days = SEPT.map((d) => d || [0, 0, 0, 0, 0, 0]);
  const xOf = (i) => { const x = (i / 29) * w; return ar ? w - x : x; };
  const avg = (k) => days.map((_, i) => { const win = days.slice(Math.max(0, i - 3), Math.min(TODAY_D, i + 4)); return i + 1 > TODAY_D ? 0 : win.reduce((a, d) => a + d[k], 0) / win.length; });
  const series = [0, 1, 2, 3, 4, 5].map(avg);
  const max = Math.max(...series.flat());
  const base = h - 2;
  const ridge = (k) => {
    const pts = series[k].slice(0, TODAY_D).map((v, i) => [xOf(i), base - (v / max) * (h - 16)]);
    const line = smooth(pts);
    const end = xOf(TODAY_D - 1), start = xOf(0);
    return `<path d="${line} L${end.toFixed(1)} ${base} L${start.toFixed(1)} ${base} Z" fill="url(#${id}${k})" style="mix-blend-mode: ${T.dark ? 'screen' : 'multiply'}"></path><path d="${line}" fill="none" stroke="${cols[k]}" stroke-width="1.3" opacity="0.9"></path>`;
  };
  const tx = xOf(TODAY_D - 1);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" style="display: block; overflow: visible">
<defs>${cols.map((c, k) => `<linearGradient id="${id}${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="${T.dark ? 0.55 : 0.4}"></stop><stop offset="1" stop-color="${c}" stop-opacity="0.02"></stop></linearGradient>`).join('')}</defs>
${[1, 8, 15, 22, 29].map((d) => `<line x1="${xOf(d - 1).toFixed(1)}" y1="0" x2="${xOf(d - 1).toFixed(1)}" y2="${base}" stroke="${T.line}"></line>`).join('')}
${[5, 4, 3, 2, 1, 0].filter((k) => Math.max(...series[k]) > 0).map(ridge).join('')}
<line x1="${tx.toFixed(1)}" y1="0" x2="${tx.toFixed(1)}" y2="${base}" stroke="${T.text}" stroke-opacity="0.7"></line>
</svg>`;
}
const axis = (T, w, ar) => `<div style="position: relative; height: 16px">${[1, 8, 15, 22, 29].map((d) => { const x = ((d - 1) / 29) * w; return `<span style="position: absolute; ${ar ? 'right' : 'left'}: ${(x - 14).toFixed(1)}px; width: 28px; text-align: center; font-size: 11.5px; color: ${T.ter}; font-variant-numeric: tabular-nums">${n(d, ar)}</span>`; }).join('')}</div>`;

/* ── 1 · Profile: the Kufic ring, the numbers, the badges, your sky, the month in ridges ── */
const P_H = 1600;
function profile(T, { ar = false, guest = false } = {}) {
  const R = 88, cx = 195, cy = 196;
  const disc = DISC[T.key];
  const ringColor = T.dark ? 'rgba(242,236,221,0.72)' : `rgba(${K.rgbOf(T.accent)},0.78)`;
  const ring = K.ringText(`kr${T.key}${ar ? 'a' : ''}${guest ? 'g' : ''}`, R, 'هُنا · نتنفّس معًا · '.repeat(6), { font: K.F.arDisplay, size: 15, color: ringColor, weight: 700, pad: 16 });
  const stat = (g, v, en, arT) => `<div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px"><span style="height: 28px; display: flex; align-items: center">${g}</span>${bigNum(v, 32, T.text, ar)}${lab(ar ? arT : en, T.ter, ar, 10)}</div>`;
  const earned = ORDER.filter((c) => EARNED.has(c));
  const W = 358 - 32;
  const t = ar
    ? { since: 'السعودية · معنا منذ سبتمبر', badges: 'الشارات', of: `${K.ar(4)} من ${K.ar(9)}`, all: 'كلها', next: 'التالية', nextLine: 'الشمس · بقي يومان متتاليان', sky: 'سماؤك · سبتمبر', stars: `${K.ar(PRACTISED.length)} نجمة حتى الآن`, skyLine: 'نجمة لكل يوم مارست فيه. نجمة الليلة تنضمّ إليها.', month: 'سبتمبر', breath: 'شهرك في أنفاس', minutes: 'دقيقة', rows: ['نتائجي', 'ملخص سبتمبر', 'الإحصاءات والمتصدرون'], settings: 'تليها الإعدادات كما هي اليوم.' }
    : { since: 'Saudi Arabia · with Houna since September', badges: 'Badges', of: '4 of 9', all: 'See all', next: 'Next', nextLine: 'The sun · 2 more days in a row', sky: 'Your sky · September', stars: `${PRACTISED.length} stars so far`, skyLine: 'One for each day you practised. Tonight’s joins the rest.', month: 'September', breath: 'Your month in breath', minutes: 'minutes', rows: ['My results', 'Recap · September', 'Stats & leaderboard'], settings: 'Settings follow, as today.' };
  const identity = guest
    ? `<div style="position: absolute; left: 16px; right: 16px; top: 318px; ${card(T)}; padding: 20px; display: flex; flex-direction: column; gap: 10px; align-items: center; text-align: center">
${display(ar ? 'اختر اسمًا مستعارًا' : 'Claim an alias', 22, T, ar)}
<span style="font-size: 14px; line-height: 1.5; color: ${T.sec}">${ar ? 'لتجمع الشارات وتظهر في المتصدرين. لا حاجة لاسم حقيقي أو بريد.' : 'To collect badges and join the leaderboard. No real name or email needed.'}</span>
<span style="margin-top: 4px; padding: 12px 22px; border-radius: 999px; background: ${T.dark ? M.moonlight : T.text}; color: ${T.ground}; font-size: 15px; font-weight: 600">${ar ? 'اختر اسمك' : 'Claim a name'}</span>
</div>`
    : `<div style="position: absolute; left: 0; right: 0; top: 314px; display: flex; flex-direction: column; align-items: center; gap: 4px">
${display('noor', 34, T, false)}
<span style="font-size: 14.5px; color: ${T.sec}">${t.since}</span>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: 404px; display: flex">
${stat(glyph.streak(T), 12, 'Day streak', 'يومًا متتاليًا')}
${stat(glyph.sessions(T), SESSIONS, 'This month', 'جلسة هذا الشهر')}
${stat(glyph.badges(T), 4, 'Badges', 'شارات')}
</div>`;
  const badgesCard = guest
    ? ''
    : `<div style="position: absolute; left: 16px; right: 16px; top: 530px; height: 238px; ${card(T)}; padding: 16px">
<div style="display: flex; justify-content: space-between; align-items: center">${lab(t.badges, T.accent, ar)}<span style="display: flex; align-items: center; gap: 4px; font-size: 13.5px; color: ${T.sec}">${t.of} · ${t.all}${chevron(T, ar)}</span></div>
<div style="display: flex; justify-content: space-between; margin-top: 18px">${earned.map((c, i) => `<div style="width: 76px; display: flex; flex-direction: column; align-items: center; gap: 4px">${gem(c, 52, T, { float: 5 + i, delay: -i * 1.3 })}${pedestal(48, T)}<span style="font-size: 12px; text-align: center; color: ${T.text}">${badgeName(c, ar)}</span></div>`).join('')}</div>
<div style="height: 1px; background: ${T.line}; margin: 14px 0 12px"></div>
<div style="display: flex; align-items: center; gap: 12px">${gem('streak_14', 30, T, { locked: true })}<span style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 11px; color: ${T.ter}">${t.next}</span><span style="font-size: 14px; color: ${T.text}">${t.nextLine}</span></span></div>
</div>`;
  const skyTop = guest ? 520 : 788;
  const breathTop = skyTop + 268;
  const rowsTop = breathTop + 340;
  return `${topGlow(T, disc.glow, 12)}${nightStars(T)}
${backBtn(T, ar)}
<div aria-hidden="true" style="position: absolute; left: ${cx - R - 16}px; top: ${cy - R - 16}px; animation: spin 90s linear infinite">${ring}</div>
<div aria-hidden="true" style="position: absolute; left: ${cx - 54}px; top: ${cy - 54}px; width: 108px; height: 108px; border-radius: 999px; background: ${disc.stops}; box-shadow: 0 0 36px rgba(${disc.glow},0.5)">${K.pressedMark(56, disc.surface)}</div>
${identity}
${badgesCard}
<div style="position: absolute; left: 16px; right: 16px; top: ${skyTop}px; height: 248px; ${card(T)}; padding: 16px; overflow: hidden">
${T.dark ? `<span aria-hidden="true" style="position: absolute; inset: 0">${K.starfield(22, 358, 248, 91)}</span>` : ''}
<div style="position: relative; display: flex; justify-content: space-between; align-items: center">${lab(t.sky, T.accent, ar)}${chevron(T, ar)}</div>
<div style="position: relative; margin-top: 8px">${display(t.stars, 22, T, ar)}</div>
<div style="position: relative; margin-top: 10px">${skySvg(T, W, 140, ar)}</div>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: ${breathTop}px; height: 320px; ${card(T)}; padding: 16px">
${lab(t.month, T.accent, ar)}
<div style="margin-top: 8px">${display(t.breath, 22, T, ar)}</div>
<div style="margin-top: 6px; display: flex; align-items: baseline; gap: 6px">${bigNum(MONTH_MIN, 30, T.text, ar)}<span style="font-size: 13px; color: ${T.sec}">${t.minutes}</span></div>
<div style="margin-top: 14px">${ridgesSvg(T, W, 118, ar)}</div>
<div style="margin-top: 6px">${axis(T, W, ar)}</div>
<div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px 12px">${PARTS.map((k) => `<span style="display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${T.sec}"><span style="width: 8px; height: 8px; border-radius: 999px; background: ${exColours(T)[k]}"></span>${ar ? data.EX_AR[k] : data.EX[k]}</span>`).join('')}</div>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: ${rowsTop}px; ${card(T)}; overflow: hidden">${t.rows.map((r, i) => `<div style="min-height: 56px; padding: 0 16px; ${i < 2 ? `border-bottom: 1px solid ${T.line};` : ''} display: flex; align-items: center; gap: 12px"><span style="flex: 1; font-size: 15.5px; font-weight: 500; color: ${T.text}">${r}</span>${i === 0 ? `<span style="font-size: 13.5px; color: ${T.ter}">${n(6, ar)}</span>` : ''}${chevron(T, ar)}</div>`).join('')}</div>
<span style="position: absolute; left: 24px; right: 24px; top: ${rowsTop + 196}px; text-align: center; font-size: 13px; color: ${T.ter}">${t.settings}</span>`;
}
out.push(
  row('ProfileP6.dc.html', {
    title: 'Phase 6 — Profile: the Kufic ring',
    ph: P_H,
    css: FLOAT_CSS + '\n' + SKY_CSS,
    phones: [
      { T: TS, caption: 'Sunrise · The ring reads هُنا · نتنفّس معًا, “here · we breathe together”, turning slowly round the theme’s own body with the mark pressed in (no photo needed). Three numbers, then the badges you hold, lit in their gems; the next one waiting, unlit.', html: profile(TS) },
      { T: TD, caption: 'Dusk · Your sky: a star for each day practised this month, joined in order, tonight’s the brightest. Tap it for the whole sky. Then your month in breath: minutes by part of practice as ridges, today’s line.', html: profile(TD) },
      { T: TN, caption: 'Night · My results, Recap and Stats one tap away, as the held plan had them; the settings follow, unchanged.', html: profile(TN) },
      { T: TN, ar: true, caption: 'Arabic · The sky and the ridges run from the right, as the week’s arc does; the ring reads the same.', html: profile(TN, { ar: true }) },
      { T: TD, caption: 'Guest · The claim-an-alias card takes the name and the numbers; badges need an alias (they’re kept by Houna). Your sky and the ridges come from the phone’s own log, so Guests have them too.', html: profile(TD, { guest: true }) },
    ],
  }),
);

/* ── 2 · Badges: the page ── */
function badgesPage(T, { ar = false } = {}) {
  const earned = ORDER.filter((c) => EARNED.has(c)), ahead = ORDER.filter((c) => !EARNED.has(c));
  const held = (c) => (ar ? `يحملها ${K.ar(HELD[c])}٪ من هُنا` : `Held by ${HELD[c]}% of Houna`);
  const on = (c) => (ar ? `${K.ar(EARNED_ON[c])} سبتمبر` : `${EARNED_ON[c]} September`);
  const big = (c, i) => `<div style="flex-shrink: 0; width: 150px; display: flex; flex-direction: column; align-items: center; gap: 8px">
${gem(c, 104, T, { float: 5 + i, delay: -i * 1.3 })}${pedestal(96, T)}
<span style="font-size: 17px; font-weight: 600; color: ${T.text}">${badgeName(c, ar)}</span>
<span style="font-size: 12.5px; color: ${T.sec}">${on(c)}</span>
<span style="font-size: 12.5px; color: ${T.ter}">${held(c)}</span>
</div>`;
  const small = (c) => `<div style="display: flex; align-items: center; gap: 14px; padding: 9px 0">${gem(c, 44, T, { locked: true })}<span style="flex: 1; display: flex; flex-direction: column; gap: 2px"><span style="font-size: 15px; font-weight: 500; color: ${T.text}">${badgeName(c, ar)}</span><span style="font-size: 13px; color: ${T.sec}">${ar ? HOW_AR[c] : HOW_EN[c]}${c === 'streak_14' ? (ar ? ' · بقي يومان' : ' · 2 more days') : ''}</span></span><span style="font-size: 12px; color: ${T.ter}">${held(c).replace(/ of Houna| من هُنا/, '')}</span></div>`;
  return `${topGlow(T, '179,167,245', 26)}${nightStars(T, 300, 33)}
${backBtn(T, ar)}
<div style="position: absolute; left: 24px; right: 24px; top: 124px; display: flex; justify-content: space-between; align-items: baseline">${display(ar ? 'الشارات' : 'Badges', 32, T, ar)}<span style="font-size: 15px; color: ${T.sec}">${ar ? `${bigNum(4, 22, T.text, true)} من ${K.ar(9)}` : `${bigNum(4, 22, T.text, false)} of 9`}</span></div>
<div style="position: absolute; left: 0; right: 0; top: 160px; overflow: hidden"><div style="display: flex; gap: 4px; padding: 44px 8px 8px">${earned.map(big).join('')}</div></div>
<div style="position: absolute; left: 24px; right: 24px; top: 446px; display: flex; flex-direction: column">
${lab(ar ? 'ما زال أمامك' : 'Still ahead', T.ter, ar)}
<div style="margin-top: 6px; display: flex; flex-direction: column">${ahead.map(small).join('')}</div>
</div>`;
}
out.push(
  row('BadgesP6.dc.html', {
    title: 'Phase 6 — Badges: skies inside gems',
    css: FLOAT_CSS,
    phones: [
      { T: TS, caption: 'Sunrise · From Profile’s “See all”. The badges you hold float on their pedestals, each its own sky in a lit gem: when you earned it, and how many of Houna hold it (a percentage, never names). Swipe along them.', html: badgesPage(TS) },
      { T: TD, caption: 'Dusk · Still ahead: the same gems, unlit, with what each asks; a streak’s says how many days remain. Never a badge for mood or journaling.', html: badgesPage(TD) },
      { T: TN, caption: 'Night · The gems glow in their own light: the suns warm, the moons teal, the tones violet.', html: badgesPage(TN) },
      { T: TN, ar: true, caption: 'Arabic · The shelf starts from the right.', html: badgesPage(TN, { ar: true }) },
    ],
  }),
);

/* ── 3 · The nine gems, lit and unlit, in each theme ── */
(() => {
  const col = (T) => `<div style="width: 420px; box-sizing: border-box; padding: 28px 24px; border-radius: 28px; background: ${T.ground}; display: flex; flex-direction: column; gap: 18px">
${display(T.name, 24, T, false)}
${ORDER.map((c) => `<div style="display: flex; align-items: center; gap: 18px">${gem(c, 64, T)}${gem(c, 40, T, { locked: true })}<div style="display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${B[c].en} · <span style="font-family: ${K.F.arBody}; font-weight: 500">${B[c].ar}</span></span><span style="font-size: 12.5px; color: ${T.sec}">${HOW_EN[c]}</span></div></div>`).join('')}
</div>`;
  const W = 64 * 2 + 3 * 420 + 2 * 24;
  const body = `<div style="position: absolute; inset: 0; padding: 64px; box-sizing: border-box; display: flex; flex-direction: column; gap: 32px">
<div style="display: flex; flex-direction: column; gap: 12px">${K.label('Houna · badges', '#6FD6CF', 12)}
<span style="font-family: ${K.F.display}; font-size: 56px; line-height: 1; color: ${M.moonlight}">Nine skies, set in gems</span>
<span style="max-width: 1040px; font-size: 16px; line-height: 1.5; color: ${M.mist}">Each badge keeps its sky from the held plan (a spark at the horizon, the sun rising, the sun, the half moon, the full moon among stars; the first breath, every breath, every scene, every sky), set in a sphere of glass lit in its own colour and floating on a pedestal. Earned, at left; not yet, beside it: the same gem unlit, the sky greyed and faint.</span></div>
<div style="display: flex; gap: 24px">${THEMES.map(col).join('')}</div>
</div>`;
  out.push(K.board('GemsP6.dc.html', { title: 'Phase 6 — nine skies, set in gems', w: W, h: 1130, root: 'background: #070B1C', css: FLOAT_CSS, body, dir: DIR }));
})();

/* ── 4 · The unlock moment ── */
(() => {
  const PARTS = 14;
  const css = ['A', 'B'].map((x) => `
@keyframes veil${x} { from { opacity: 0 } to { opacity: 1 } }
@keyframes badge${x} { 0% { opacity: 0; transform: translateY(70px) scale(0.6) } 60% { opacity: 1; transform: translateY(-6px) scale(1.04) } 100% { opacity: 1; transform: none } }
@keyframes bloom${x} { 0% { opacity: 0; transform: scale(0.4) } 50% { opacity: 1 } 100% { opacity: 0.55; transform: scale(1.3) } }
@keyframes up${x} { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: none } }
${Array.from({ length: PARTS }, (_, i) => { const a = (i / PARTS) * 2 * Math.PI; const d = 110 + (i % 3) * 30; return `@keyframes p${i}${x} { 0% { opacity: 0; transform: translate(0,0) scale(1) } 20% { opacity: 1 } 100% { opacity: 0; transform: translate(${(Math.cos(a) * d).toFixed(0)}px, ${(Math.sin(a) * d).toFixed(0)}px) scale(0.3) } }`; }).join('\n')}`).join('') + `\n@keyframes ringTurn { to { transform: rotate(360deg) } }`;
  const unlock = (T, ar = false) => {
    const veil = T.dark ? 'rgba(11,16,38,0.62)' : `rgba(${K.rgbOf(T.ground)},0.7)`;
    const parts = Array.from({ length: PARTS }, (_, i) => `<span style="position: absolute; left: ${195 - 3}px; top: ${330 - 3}px; width: 6px; height: 6px; border-radius: 999px; background: ${[T.tone.dawn, T.dark ? M.moonlight : T.tone.glow, T.tone.bloom][i % 3]}; box-shadow: 0 0 8px ${T.hue.dawn}; animation: p${i}{{x}} 1.6s cubic-bezier(.2,.7,.3,1) 1s both"></span>`).join('');
    const tones = [T.tone.dawn, T.tone.bloom, T.tone.dusk, T.tone.glow, T.tone.dawn].join(', ');
    return `
<span style="position: absolute; left: 86px; top: 92px; width: 218px; height: 218px; border-radius: 999px; background: ${DISC[T.key].stops}; opacity: 0.55; filter: blur(10px)"></span>
<span style="position: absolute; left: 16px; right: 16px; top: 400px; height: 90px; border-radius: 22px; background: ${T.card}; border: 1px solid ${T.line}; filter: blur(3px)"></span>
<span style="position: absolute; left: 16px; right: 16px; top: 510px; height: 240px; border-radius: 22px; background: ${T.card}; border: 1px solid ${T.line}; filter: blur(3px)"></span>
<span style="position: absolute; inset: 0; background: ${veil}; animation: veil{{x}} 700ms ease both"></span>
<span style="position: absolute; left: 45px; top: 180px; width: 300px; height: 300px; border-radius: 999px; background: radial-gradient(closest-side, rgba(249,169,128,${T.dark ? 0.6 : 0.45}), rgba(249,169,128,0)); animation: bloom{{x}} 1.6s ease-out 0.9s both"></span>
${parts}
<div style="position: absolute; left: ${195 - 80}px; top: ${330 - 80}px; animation: badge{{x}} 1.1s cubic-bezier(.2,.8,.2,1) 0.5s both">${gem('streak_7', 160, T)}</div>
<div style="position: absolute; left: 0; right: 0; top: 470px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
<span style="animation: up{{x}} 700ms ease 1.6s both">${lab(ar ? 'شارة جديدة' : 'New badge', T.tone.dawn, ar)}</span>
<span style="animation: up{{x}} 700ms ease 1.8s both">${display(ar ? 'الشروق' : 'Sunrise', 40, T, ar)}</span>
<span style="font-size: 16px; line-height: 1.5; color: ${T.sec}; max-width: 280px; animation: up{{x}} 700ms ease 2s both">${ar ? 'سبعة أيام متتالية. أشرقت الشمس.' : 'Seven days in a row. The sun is up.'}</span>
<span style="font-size: 13px; color: ${T.ter}; animation: up{{x}} 700ms ease 2.1s both">${ar ? `يحملها ${K.ar(21)}٪ من هُنا` : 'Held by 21% of Houna'}</span>
</div>
<div style="position: absolute; left: 60px; right: 60px; top: 712px; height: 56px; animation: up{{x}} 700ms ease 2.3s both">
<span aria-hidden="true" style="position: absolute; inset: -2px; border-radius: 999px; overflow: hidden"><span style="position: absolute; left: 50%; top: 50%; width: 420px; height: 420px; margin: -210px 0 0 -210px; background: conic-gradient(${tones}); animation: ringTurn 5s linear infinite"></span></span>
<span style="position: absolute; inset: 0; border-radius: 999px; background: ${T.dark ? M.moonlight : T.text}; color: ${T.ground}; font-size: 17px; font-weight: 600; display: flex; align-items: center; justify-content: center">${ar ? 'جميل' : 'Lovely'}</span>
</div>`;
  };
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { n: 0 };
  }
  renderVals() {
    return { x: this.state.n % 2 ? 'B' : 'A', replay: () => this.setState({ n: this.state.n + 1 }) };
  }
}`;
  const b = row('UnlockP6.dc.html', {
    title: 'Phase 6 — the unlock moment',
    css,
    logic,
    phones: [
      { T: TS, caption: 'Sunrise · Shown once, when a badge is earned (after a session, or on opening Profile or Stats): the screen softens, the gem rises into a bloom of its light, the words arrive. “Lovely” closes it. Nothing else is asked.', html: unlock(TS) },
      { T: TD, caption: 'Dusk · The same moment, the light warm on a pale veil.', html: unlock(TD) },
      { T: TN, caption: 'Night · Under Reduce Motion the gem and words simply appear.', html: unlock(TN) },
      { T: TN, ar: true, caption: 'Arabic · Tap the board’s replay to see it again.', html: unlock(TN, true) },
    ],
  });
  // One replay button for the row, above the first phone.
  const fs = require('fs');
  const f = path.join(DIR, 'UnlockP6.dc.html');
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('<div style="position: absolute; left: 40px; top: 40px;', `<button type="button" onClick="{{replay}}" aria-label="Replay" style="position: absolute; left: ${PAD + 4 * PW + 3 * GAP - 48}px; top: 4px; width: 32px; height: 32px; border-radius: 999px; border: 1px solid rgba(242,236,221,0.2); background: rgba(242,236,221,0.08); color: ${M.moonlight}; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2">${icon('replay', 16)}</button>\n<div style="position: absolute; left: 40px; top: 40px;`));
  out.push(b);
})();

/* ── 5 · Stats: the streak as the week in moons ── */
function statsStreak(T, { ar = false } = {}) {
  const DAY = 86400000;
  const days = Array.from({ length: 7 }, (_, i) => new Date(K.TODAY.getTime() - (6 - i) * DAY)); // Mon 21 – Sun 27
  const cx = 195, cy = 250, R = 150;
  const wk = ar ? ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const lit = T.dark ? M.moonlight : T.accent;
  const dot = (d, i) => {
    // The week runs along the arc from the start side; Arabic from the right.
    const deg = 170 - i * (160 / 6);
    const a = ((ar ? 180 - deg : deg) * Math.PI) / 180;
    const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
    const today = i === 6;
    return `<div style="position: absolute; left: ${(x - 22).toFixed(1)}px; top: ${(y - 22).toFixed(1)}px; width: 44px; display: flex; flex-direction: column; align-items: center; gap: 8px">
<span style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center">${today ? `<span style="position: absolute; inset: 0; border-radius: 999px; border: 1px solid ${T.dark ? 'rgba(242,236,221,0.4)' : T.ctrlLine}"></span>` : ''}${K.moon(K.phaseOf(d), 13, { lit, dark: `rgba(${K.rgbOf(lit)},0.1)`, glow: T.dark ? 'rgba(242,236,221,0.45)' : '' })}</span>
${lab(wk[i], today ? T.text : T.ter, ar, 11)}
</div>`;
  };
  const t = ar
    ? { title: 'ممارستك', days: 'أيام متتالية', line: 'أقمار هذا الأسبوع. كل قمر مضيء يوم مارست فيه.', longest: 'الأطول', badges: 'الشارات', of: `${K.ar(4)} من ${K.ar(9)}`, board: 'المتصدرون', note: 'السلسلة للتنفّس والتأمل فقط، لا للمزاج أبدًا.' }
    : { title: 'Your practice', days: 'days in a row', line: 'This week’s moons. Each one lit is a day you practised.', longest: 'Longest', badges: 'Badges', of: '4 of 9', board: 'Leaderboard', note: 'Streaks count breathing and meditation only, never mood.' };
  return `${topGlow(T, T.dark ? '242,236,221' : K.rgbOf(T.hue.dawn), 24)}
${backBtn(T, ar)}
<span style="position: absolute; left: 0; right: 0; top: 68px; text-align: center; font-size: 16px; font-weight: 600; color: ${T.text}">${t.title}</span>
<span style="position: absolute; left: 24px; right: 24px; top: 112px; height: 1px; background: repeating-linear-gradient(90deg, ${T.line} 0 4px, rgba(0,0,0,0) 4px 8px)"></span>
<span style="position: absolute; left: 0; right: 0; top: 96px; text-align: center; font-size: 11.5px; color: ${T.ter}">${ar ? '↑ قوس الأسبوع فوقها' : '↑ the week’s arc above'}</span>
<div style="position: absolute; left: 0; right: 0; top: 150px; display: flex; flex-direction: column; align-items: center; gap: 0">
${bigNum(12, 132, T.text, ar)}
<span style="font-family: ${ar ? K.F.arDisplay : K.F.display}; font-size: 22px; color: ${T.sec}">${t.days}</span>
</div>
<div style="position: absolute; left: 0; top: 0; width: 390px; height: 1px">${days.map(dot).join('')}</div>
<span style="position: absolute; left: 24px; right: 24px; top: 484px; text-align: center; font-size: 14px; line-height: 1.5; color: ${T.sec}">${t.line}</span>
<div style="position: absolute; left: 16px; right: 16px; top: 528px; ${card(T)}; padding: 16px 18px; display: flex; justify-content: space-between; align-items: center">${lab(t.longest, T.ter, ar)}${bigNum(30, 30, T.text, ar)}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 610px; ${card(T)}; padding: 12px 16px; display: flex; align-items: center; gap: 12px">${ORDER.filter((c) => EARNED.has(c)).map((c) => gem(c, 26, T)).join('')}<span style="flex: 1; font-size: 15px; font-weight: 500; color: ${T.text}">${t.badges}</span><span style="font-size: 13.5px; color: ${T.ter}">${t.of}</span>${chevron(T, ar)}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 692px; height: 140px; ${card(T)}; padding: 16px">${lab(t.board, T.ter, ar)}</div>
<span style="position: absolute; left: 24px; right: 24px; top: 808px; text-align: center; font-size: 12.5px; color: ${T.ter}"></span>`;
}
out.push(
  row('StreakP6.dc.html', {
    title: 'Phase 6 — Stats: the week in moons',
    phones: [
      { T: TS, caption: 'Sunrise · Below the week’s arc, the streak card becomes one large numeral over this week’s real moons, each lit on a day practised, today ringed; the longest beside it. This week’s minutes are already in the arc above.', html: statsStreak(TS) },
      { T: TD, caption: 'Dusk · The badges row gives way to the gems you hold, opening the badges page; the leaderboard follows as today. Streaks count breathing and meditation only, never mood.', html: statsStreak(TD) },
      { T: TN, caption: 'Night · The moons glow; a day not practised is a dim moon, never “missed”.', html: statsStreak(TN) },
      { T: TN, ar: true, caption: 'Arabic · The week runs from the right.', html: statsStreak(TN, { ar: true }) },
    ],
  }),
);

/* ── 6 · Your sky, opened from Profile ── */
function skyScreen(T, { ar = false } = {}) {
  const last = PRACTISED[PRACTISED.length - 1];
  const day = new Date(2026, 8, last);
  const date = new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory-nu-arab' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(day);
  const mins = sum(SEPT[last - 1]);
  return `${T.dark ? K.starfield(70, 390, 844, 81, '182,186,214') : ''}${topGlow(T, K.rgbOf(T.hue.glow), 60)}
${backBtn(T, ar)}
<div style="position: absolute; left: 24px; right: 24px; top: 124px; display: flex; flex-direction: column; gap: 8px">
${lab(ar ? 'سماؤك · سبتمبر' : 'Your sky · September', T.accent, ar)}
${display(ar ? `${K.ar(PRACTISED.length)} نجمة حتى الآن` : `${PRACTISED.length} stars so far`, 30, T, ar)}
<span style="font-size: 15px; line-height: 1.5; color: ${T.sec}">${ar ? 'نجمة لكل يوم مارست فيه، موصولة بالترتيب. نجمة الليلة تنضمّ إليها.' : 'One for each day you practised, joined in order. Tonight’s joins the rest.'}</span>
</div>
<div style="position: absolute; left: 16px; top: 300px">${skySvg(T, 358, 330, ar, { big: true })}</div>
<div style="position: absolute; left: 16px; right: 16px; top: 680px; ${card(T)}; padding: 16px 18px; display: flex; justify-content: space-between; align-items: center"><span style="font-size: 15.5px; color: ${T.text}">${date}</span><span style="font-size: 14px; color: ${T.sec}">${ar ? `${K.ar(mins)} دقيقة` : `${mins} min`}</span></div>
<span style="position: absolute; left: 24px; right: 24px; top: 762px; text-align: center; font-size: 13px; line-height: 1.5; color: ${T.ter}">${ar ? 'اضغط نجمة لترى يومها. يبدأ شهر جديد بسماء جديدة.' : 'Tap a star for its day. A new month begins a new sky.'}</span>`;
}
out.push(
  row('SkyP6.dc.html', {
    title: 'Phase 6 — Your sky',
    css: SKY_CSS,
    phones: [
      { T: TS, caption: 'Sunrise · Profile’s sky opened whole: a star for each day practised this month, joined in the order they came, tonight’s the brightest. Tap a star for its day and minutes. From the phone’s own log, so Guests have it too.', html: skyScreen(TS) },
      { T: TD, caption: 'Dusk · By day it’s a star chart: ink stars, the line in the theme’s teal.', html: skyScreen(TD) },
      { T: TN, caption: 'Night · Among the night’s own stars.', html: skyScreen(TN) },
      { T: TN, ar: true, caption: 'Arabic · The days run from the right.', html: skyScreen(TN, { ar: true }) },
    ],
  }),
);

/* ── 7 · My results (the held plan's, in every theme) ── */
const RESULTS = [
  { en: 'Mood (PHQ-8)', ar: 'المزاج (PHQ-8)', date: [24, 'Sep'], band: ['Mild', 'خفيف'], saved: true },
  { en: 'Wellbeing (WHO-5)', ar: 'الرفاه (WHO-5)', date: [21, 'Sep'], band: ['Good wellbeing', 'رفاه جيد'] },
  { en: 'Anxiety (GAD-7)', ar: 'القلق (GAD-7)', date: [12, 'Sep'], band: ['Moderate', 'متوسط'] },
  { en: 'Attention & focus (ASRS-5)', ar: 'الانتباه والتركيز (ASRS-5)', date: [8, 'Sep'], band: ['11 of 24', '١١ من ٢٤'] },
  { en: 'Mood (PHQ-8)', ar: 'المزاج (PHQ-8)', date: [2, 'Sep'], band: ['Moderate', 'متوسط'] },
  { en: 'Childhood experiences (ACE)', ar: 'تجارب الطفولة (ACE)', date: [28, 'Aug'], band: ['Some difficult experiences', 'بعض التجارب الصعبة'] },
];
function myResults(T, { ar = false, empty = false } = {}) {
  const tile = `<span style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 12px; background: ${T.tone.dusk}1F; border: 1px solid ${T.tone.dusk}4D; display: flex; align-items: center; justify-content: center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${T.tone.dusk}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path></svg></span>`;
  const month = (m) => (ar ? (m === 'Sep' ? 'سبتمبر' : 'أغسطس') : m);
  const list = RESULTS.map((r, i) => `<div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; ${i < RESULTS.length - 1 ? `border-bottom: 1px solid ${T.line}` : ''}">${tile}<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${ar ? r.ar : r.en}</span><span style="font-size: 12.5px; color: ${T.ter}">${n(r.date[0], ar)} ${month(r.date[1])}${r.saved ? (ar ? ' · محفوظة في ملفك' : ' · Saved to profile') : ''}</span></div><span style="flex-shrink: 0; max-width: 110px; padding: 3px 10px; border-radius: 999px; border: 1px solid ${T.line}; font-size: 12px; color: ${T.sec}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">${r.band[ar ? 1 : 0]}</span>${chevron(T, ar)}</div>`).join('');
  return `${backBtn(T, ar)}
<div style="position: absolute; left: 20px; right: 20px; top: 124px; display: flex; flex-direction: column; gap: 8px">${lab(ar ? 'تأمّلاتك' : 'Your reflections', T.accent, ar)}${display(ar ? 'نتائجي' : 'My results', 32, T, ar)}<span style="font-size: 14px; line-height: 1.5; color: ${T.sec}">${ar ? 'كل استبيان أجبته. تبقى على هذا الهاتف ما لم تحفظها في ملفك.' : 'Every questionnaire you’ve taken. They stay on this phone unless you save them to your profile.'}</span></div>
<div style="position: absolute; left: 16px; right: 16px; top: 280px">
${empty
    ? `<div style="${card(T)}; padding: 28px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center"><span style="font-size: 15.5px; font-weight: 600; color: ${T.text}">${ar ? 'لا نتائج بعد' : 'No results yet'}</span><span style="font-size: 13.5px; line-height: 1.5; color: ${T.sec}">${ar ? 'استبيانات قصيرة في «اكتشف» تساعدك على فهم نفسك أكثر قليلًا.' : 'Short questionnaires in Discover help you understand yourself a little better.'}</span><span style="margin-top: 4px; padding: 10px 18px; border-radius: 999px; background: ${T.dark ? M.moonlight : T.text}; color: ${T.ground}; font-size: 14px; font-weight: 600">${ar ? 'اذهب إلى «اكتشف»' : 'Go to Discover'}</span></div>`
    : `<div style="${card(T)}; overflow: hidden">${list}</div><span style="display: block; margin-top: 12px; font-size: 12.5px; color: ${T.ter}; text-align: center">${ar ? 'اضغط مطوّلًا على نتيجة لحذفها.' : 'Press and hold a result to delete it.'}</span>`}
</div>`;
}
out.push(
  row('ResultsP6.dc.html', {
    title: 'Phase 6 — My results',
    phones: [
      { T: TS, caption: 'Sunrise · One tap from Profile, never on the Profile page itself (shared phones). Every questionnaire, newest first, with its date and a quiet band; tap to reopen, press and hold to delete (with a confirm).', html: myResults(TS) },
      { T: TD, caption: 'Dusk · Empty: points to Discover.', html: myResults(TD, { empty: true }) },
      { T: TN, caption: 'Night · Saved to profile only when the person chose to.', html: myResults(TN) },
      { T: TN, ar: true, caption: 'Arabic · The instruments keep their names; the bands are the published ones.', html: myResults(TN, { ar: true }) },
    ],
  }),
);

module.exports = out;
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}${b.interactive ? ' (interactive)' : ''}`).join('\n'));
