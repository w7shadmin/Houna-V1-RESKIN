// "Profile & badges": the signed-in Profile revamped, the badges each drawn as their own sky body
// (a journey through the day for streaks; four more for exploring), and "My results", where saved
// questionnaire results can be found again. Writes a clickable Profile (Night), a badge sheet (all
// nine, three themes, earned and locked), My results (Night), and a storyboard with notes.
const fs = require('fs');
const { DISCS, pressedMark } = require('./pressed-kit.js');
const { THEMES } = require('./make-home-appearance.js');
const P = __dirname + '/../project/';

const T3 = Object.fromEntries(THEMES.map((T) => [T.key, T]));
/** The four practice tones (Night hues: the badges are lit bodies, the same in every theme). */
const TONE = { glow: '#6FD6CF', dusk: '#B3A7F5', dawn: '#F2B880', bloom: '#EA90A8' };
const SCENE = { fire: '#F0A868', rain: '#7FA2EC', creek: '#63CFC7', ocean: '#8F9BF0' };

/* ── The badges ── */
const BADGES = [
  { code: 'streak_3', group: 'streak', days: 3, en: 'First light', ar: 'أول الضوء', howEn: 'Practise 3 days in a row', howAr: 'مارس ٣ أيام متتالية' },
  { code: 'streak_7', group: 'streak', days: 7, en: 'Sunrise', ar: 'الشروق', howEn: 'Practise 7 days in a row', howAr: 'مارس ٧ أيام متتالية' },
  { code: 'streak_14', group: 'streak', days: 14, en: 'The sun', ar: 'الشمس', howEn: 'Practise 14 days in a row', howAr: 'مارس ١٤ يوماً متتالياً' },
  { code: 'streak_30', group: 'streak', days: 30, en: 'Half moon', ar: 'نصف القمر', howEn: 'Practise 30 days in a row', howAr: 'مارس ٣٠ يوماً متتالياً' },
  { code: 'streak_100', group: 'streak', days: 100, en: 'Full moon', ar: 'البدر', howEn: 'Practise 100 days in a row', howAr: 'مارس ١٠٠ يوم متتالية' },
  { code: 'first_session', group: 'explore', en: 'First breath', ar: 'النَّفَس الأول', howEn: 'Finish your first breathing or meditation session', howAr: 'أنهِ أول جلسة تنفس أو تأمل' },
  { code: 'all_breathing', group: 'explore', en: 'Every breath', ar: 'كل الأنفاس', howEn: 'Try all four breathing exercises', howAr: 'جرّب تمارين التنفس الأربعة' },
  { code: 'all_scenes', group: 'explore', en: 'Every scene', ar: 'كل المشاهد', howEn: 'Meditate with all four scenes', howAr: 'تأمّل مع المشاهد الأربعة' },
  { code: 'all_skies', group: 'explore', en: 'Every sky', ar: 'كل السماوات', howEn: 'Visit the sunrise, the dusk and the starfield from Home', howAr: 'زر الشروق والغسق والسماء المرصعة بالنجوم من الرئيسية' },
];
/** The example person: a 12-day streak, so First light and Sunrise are earned; two explorer badges. */
const EARNED = new Set(['streak_3', 'streak_7', 'first_session', 'all_breathing']);

const abs = (l, t, w, h, extra = '') => `position: absolute; left: ${l}px; top: ${t}px; width: ${w}px; height: ${h}px; ${extra}`;
const circle = (cx, cy, d, extra) => `<span style="${abs(cx - d / 2, cy - d / 2, d, d, `border-radius: 999px; ${extra}`)}"></span>`;
/** The pressed mark, centred at (cx, cy) in a medal of size S. */
const markAt = (S, cx, cy, size, surface) => `<span style="${abs(cx - size / 2, cy - size / 2, size, size)}">${pressedMark(size, surface)}</span>`;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const stars = (S, n, bottom = 0.7) => Array.from({ length: n }, () => circle(rnd() * S, rnd() * S * bottom, 1 + rnd() * 1.4, `background: rgba(242,236,221,${(0.4 + rnd() * 0.5).toFixed(2)})`)).join('');

/**
 * One badge's art, S px round: each a small sky. Streaks walk through the day (a spark at the
 * horizon, the sun rising, the sun, the half moon, the full moon among stars); the explorer badges
 * gather what they celebrate (the breathing orb, the four breaths' tones, the four scenes, three skies).
 */
function art(code, S) {
  const c = S / 2;
  const sun = DISCS.sunrise, dusk = DISCS.dusk, moon = DISCS.teal;
  switch (code) {
    case 'streak_3': // First light: pre-dawn, a spark on the horizon
      return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(180deg, #1B2350 0%, #3A3470 52%, #D98C7A 84%, #F7C79A 100%)')}"></span>
${stars(S, 5, 0.45)}
${circle(c, S * 0.8, S * 0.5, 'background: radial-gradient(circle, rgba(255,236,200,0.95) 0%, rgba(255,210,160,0.5) 30%, rgba(255,200,150,0) 70%)')}
<span style="${abs(0, S * 0.8, S, 1, 'background: rgba(255,236,210,0.8)')}"></span>
<span style="${abs(0, S * 0.8 + 1, S, S * 0.2, 'background: rgba(40,34,80,0.55)')}"></span>`;
    case 'streak_7': // Sunrise: half the sun above the horizon, short rays
      return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(180deg, #7A76C0 0%, #E9A9A6 55%, #FFD9A8 100%)')}"></span>
<span style="${abs(0, 0, S, S * 0.66, 'overflow: hidden')}">
${circle(c, S * 0.66, S * 0.9, 'background: repeating-conic-gradient(from 0deg, rgba(255,236,200,0.55) 0deg 4deg, rgba(255,236,200,0) 4deg 22deg); -webkit-mask-image: radial-gradient(circle, #000 34%, transparent 62%); mask-image: radial-gradient(circle, #000 34%, transparent 62%)')}
${circle(c, S * 0.66, S * 0.5, `background: ${sun.stops}; box-shadow: 0 0 10px rgba(${sun.glow},0.7)`)}
</span>
<span style="${abs(0, S * 0.66, S, S * 0.34, 'background: linear-gradient(180deg, #8A6A9E 0%, #5A4A86 100%)')}"></span>
<span style="${abs(0, S * 0.66, S, 1, 'background: rgba(255,240,220,0.9)')}"></span>`;
    case 'streak_14': // The sun: whole, in a morning sky, the mark pressed in
      return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(180deg, #A9D8EE 0%, #DDEFF2 60%, #FBEBD6 100%)')}"></span>
${circle(c, c, S * 0.92, 'background: repeating-conic-gradient(from 0deg, rgba(255,214,160,0.6) 0deg 4deg, rgba(255,214,160,0) 4deg 20deg); -webkit-mask-image: radial-gradient(circle, #000 36%, transparent 64%); mask-image: radial-gradient(circle, #000 36%, transparent 64%)')}
${circle(c, c, S * 0.56, `background: ${sun.stops}; box-shadow: 0 0 12px rgba(${sun.glow},0.8)`)}
${markAt(S, c, c, S * 0.3, sun.surface)}`;
    case 'streak_30': // Half moon: night, the right half lit
      return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(180deg, #0B1026 0%, #1A2150 100%)')}"></span>
${stars(S, 7)}
${circle(c, c, S * 0.56, `background: ${moon.stops}; box-shadow: 0 0 12px rgba(${moon.glow},0.55)`)}
${markAt(S, c, c, S * 0.3, moon.surface)}
${circle(c, c, S * 0.56, 'background: linear-gradient(90deg, rgba(11,16,38,0.74) 50%, rgba(11,16,38,0) 50%)')}`;
    case 'streak_100': // Full moon among stars, its faint ring
      return `<span style="${abs(0, 0, S, S, 'background: radial-gradient(circle at 50% 50%, #1D2560 0%, #0B1026 75%)')}"></span>
${stars(S, 14, 1)}
${circle(c, c, S * 0.84, 'border: 1px solid rgba(214,232,236,0.28); box-sizing: border-box')}
${circle(c, c, S * 0.56, `background: ${moon.stops}; box-shadow: 0 0 16px rgba(${moon.glow},0.7)`)}
${markAt(S, c, c, S * 0.3, moon.surface)}`;
    case 'first_session': // First breath: the glassy breathing orb
      return `<span style="${abs(0, 0, S, S, `background: radial-gradient(circle, rgba(111,214,207,0.28) 0%, rgba(111,214,207,0.06) 70%), #10183A`)}"></span>
${circle(c, c, S * 0.58, `background: radial-gradient(circle at 34% 30%, rgba(255,255,255,0.8) 0%, rgba(185,236,232,0.55) 40%, rgba(111,214,207,0.5) 100%); box-shadow: 0 0 14px rgba(111,214,207,0.5)`)}
${markAt(S, c, c, S * 0.3, TONE.glow)}`;
    case 'all_breathing': // Every breath: the four exercises' tones round the mark
      return `<span style="${abs(0, 0, S, S, 'background: #10183A')}"></span>
${[['glow', 0, -1], ['dusk', 1, 0], ['dawn', 0, 1], ['bloom', -1, 0]].map(([k, dx, dy]) => circle(c + dx * S * 0.24, c + dy * S * 0.24, S * 0.26, `background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, ${TONE[k]} 60%); box-shadow: 0 0 8px ${TONE[k]}`)).join('')}
${markAt(S, c, c, S * 0.22, '#9FA6CC')}`;
    case 'all_scenes': // Every scene: the four scenes' colours in one round
      return `<span style="${abs(0, 0, S, S, 'background: #10183A')}"></span>
${circle(c, c, S * 0.62, `background: conic-gradient(${SCENE.fire} 0 25%, ${SCENE.rain} 0 50%, ${SCENE.creek} 0 75%, ${SCENE.ocean} 0); box-shadow: 0 0 12px rgba(160,170,230,0.45)`)}
${circle(c, c, S * 0.62, 'background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%)')}
${markAt(S, c, c, S * 0.3, '#8C8FC0')}`;
    case 'all_skies': // Every sky: morning sun, evening sun and moon along an arc
      return `<span style="${abs(0, 0, S, S, 'background: linear-gradient(90deg, #BFE0EE 0%, #E9A9A6 50%, #1A2150 100%)')}"></span>
${circle(S * 0.22, S * 0.6, S * 0.26, `background: ${sun.stops}; box-shadow: 0 0 8px rgba(${sun.glow},0.8)`)}
${circle(S * 0.5, S * 0.4, S * 0.26, `background: ${dusk.stops}; box-shadow: 0 0 8px rgba(${dusk.glow},0.8)`)}
${circle(S * 0.78, S * 0.6, S * 0.26, `background: ${moon.stops}; box-shadow: 0 0 8px rgba(${moon.glow},0.8)`)}`;
  }
  return '';
}
/** A badge as a medal: its art in a round frame; earned ones glow, locked ones are a faint silhouette. */
const medal = (b, S, T, earned) => `<span role="img" aria-label="${b.en}${earned ? '' : ', locked'}" style="position: relative; display: inline-block; flex-shrink: 0; width: ${S}px; height: ${S}px; border-radius: 999px; overflow: hidden; box-shadow: 0 0 0 1px ${earned ? 'rgba(255,255,255,0.25)' : T.line}${earned ? `, 0 0 16px rgba(111,214,207,0.25)` : ''}; ${earned ? '' : 'filter: grayscale(1); opacity: 0.32'}">${art(b.code, S)}</span>`;

/* ── Shared chrome ── */
const mono = (T, text, color = T.ter) => `<span style="white-space: nowrap; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.14em; color: ${color}">${text}</span>`;
const chevron = (T) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${T.ter}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"></path></svg>`;
const back = (T) => `<span aria-label="Back" style="width: 44px; height: 44px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}; box-sizing: border-box"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${T.text}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"></path></svg></span>`;
const cardStyle = (T) => `background: ${T.card}; border: 1px solid ${T.line}; border-radius: 20px; box-sizing: border-box`;
const row = (T, label, detail, last) => `<div style="display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 16px; ${last ? '' : `border-bottom: 1px solid ${T.line}`}"><span style="flex: 1; font-size: 15px; font-weight: 500; color: ${T.text}">${label}</span>${detail ? `<span style="font-size: 13.5px; color: ${T.ter}">${detail}</span>` : ''}${chevron(T)}</div>`;
const segmented = (T, opts, on) => `<span style="display: flex; gap: 2px; padding: 3px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}">${opts.map((o, i) => `<span style="padding: 5px 11px; border-radius: 999px; font-size: 12.5px; font-weight: 600; ${i === on ? `background: ${T.accent}; color: ${T.ground}` : `color: ${T.sec}`}">${o}</span>`).join('')}</span>`;

/** The Profile page. `detail` is the badge-detail card's HTML (holes in the prototype). */
function profile(T, { medals, detail }) {
  const streakRow = BADGES.filter((b) => b.group === 'streak');
  const exploreRow = BADGES.filter((b) => b.group === 'explore');
  const stat = (n, label) => `<div style="flex: 1; ${cardStyle(T)}; padding: 14px 12px; display: flex; flex-direction: column; gap: 4px; align-items: center"><span style="font-family: 'Figtree', sans-serif; font-weight: 300; font-size: 26px; color: ${T.text}">${n}</span>${mono(T, label)}</div>`;
  return `<div style="position: relative; width: 390px; min-height: 1320px; box-sizing: border-box; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif; color: ${T.text}; padding: 20px 20px 40px; display: flex; flex-direction: column; gap: 20px; overflow: hidden">
<span aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 360px; background: radial-gradient(60% 55% at 50% 28%, ${T.key === 'night' ? 'rgba(111,214,207,0.20)' : 'rgba(59,170,167,0.14)'}, rgba(0,0,0,0) 72%)"></span>
${T.stars ? `<span aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 300px">${stars(390, 24, 0.75)}</span>` : ''}
<div style="position: relative; display: flex; align-items: center; justify-content: space-between">${back(T)}<span style="font-size: 16px; font-weight: 600">Profile</span><span style="width: 44px"></span></div>

<div style="position: relative; display: flex; flex-direction: column; align-items: center; gap: 10px; padding-top: 4px">
<span style="position: relative; width: 96px; height: 96px; border-radius: 999px; background: ${DISCS.teal.stops}; box-shadow: 0 0 0 4px ${T.ground}, 0 0 0 5px rgba(111,214,207,0.5), 0 0 40px rgba(111,214,207,0.35); display: flex; align-items: center; justify-content: center; font-family: 'Marcellus', serif; font-size: 40px; color: #0B1026">N</span>
<span style="font-family: 'Marcellus', serif; font-size: 30px; color: ${T.text}">noor</span>
<span style="font-size: 14px; color: ${T.sec}">Saudi Arabia · <span style="color: ${T.accent}; font-weight: 500">Edit</span></span>
</div>

<div style="position: relative; display: flex; gap: 8px">${stat('12', 'DAY STREAK')}${stat('4<span style="font-size: 17px; color: ' + T.ter + '">/9</span>', 'BADGES')}${stat('18', 'THIS MONTH')}</div>

<div style="position: relative; ${cardStyle(T)}; padding: 18px 16px; display: flex; flex-direction: column; gap: 16px">
<div style="display: flex; justify-content: space-between; align-items: baseline">${mono(T, 'YOUR SKY', T.accent)}<span style="font-size: 12.5px; color: ${T.ter}">Streaks</span></div>
<div style="position: relative; display: flex; justify-content: space-between; align-items: center">
<span aria-hidden="true" style="position: absolute; left: 24px; right: 24px; top: 50%; height: 1px; background: repeating-linear-gradient(90deg, ${T.ter} 0 3px, rgba(0,0,0,0) 3px 7px); opacity: 0.6"></span>
${streakRow.map((b, i) => medals(b, 50, i)).join('')}
</div>
<div style="display: flex; justify-content: space-between; padding: 0 12px">${streakRow.map((b) => `<span style="width: 26px; text-align: center; font-size: 12px; color: ${EARNED.has(b.code) ? T.text : T.ter}">${b.days}</span>`).join('')}</div>
<div style="height: 1px; background: ${T.line}"></div>
<div style="display: flex; justify-content: space-between; align-items: baseline">${mono(T, 'EXPLORING', T.accent)}<span style="font-size: 12.5px; color: ${T.ter}">Try something new</span></div>
<div style="display: flex; justify-content: space-between">${exploreRow.map((b, i) => `<div style="width: 76px; display: flex; flex-direction: column; align-items: center; gap: 6px">${medals(b, 50, 5 + i)}<span style="font-size: 11.5px; text-align: center; color: ${EARNED.has(b.code) ? T.text : T.ter}">${b.en}</span></div>`).join('')}</div>
${detail}
</div>

<div style="position: relative; ${cardStyle(T)}">${row(T, 'My results', '6')}${row(T, 'Recap · September', '')}${row(T, 'Stats & leaderboard', '', true)}</div>

<div style="position: relative; display: flex; flex-direction: column; gap: 8px">${mono(T, 'SETTINGS')}
<div style="${cardStyle(T)}">
<div style="display: flex; align-items: center; justify-content: space-between; min-height: 56px; padding: 0 16px; border-bottom: 1px solid ${T.line}"><span style="font-size: 15px; font-weight: 500">Language</span>${segmented(T, ['English', 'العربية'], 0)}</div>
<div style="display: flex; align-items: center; justify-content: space-between; min-height: 56px; padding: 0 16px; border-bottom: 1px solid ${T.line}"><span style="font-size: 15px; font-weight: 500">Appearance</span>${segmented(T, ['Sunrise', 'Dusk', 'Night'], ['sunrise', 'dusk', 'night'].indexOf(T.key))}</div>
${row(T, 'Notifications', '')}${row(T, 'Export journal', '', true)}
</div></div>
<span style="position: relative; align-self: center; font-size: 15px; font-weight: 500; color: ${T.sec}; padding: 8px">Sign out</span>
</div>`;
}
/** The badge-detail card for one badge (literal). */
const detailCard = (T, b) => {
  const earned = EARNED.has(b.code);
  const note = earned ? `Earned · ${b.code === 'streak_3' ? '3 Sep' : b.code === 'streak_7' ? '7 Sep' : '1 Sep'}` : b.code === 'streak_14' ? `${b.howEn} · 2 more days` : b.howEn;
  return `<div style="display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 16px; background: ${T.ctrl}; border: 1px solid ${T.ctrlLine}">${medal(b, 60, T, earned)}<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15.5px; font-weight: 600; color: ${T.text}">${b.en}</span><span style="font-size: 13px; line-height: 1.4; color: ${T.sec}">${note}</span></div></div>`;
};

const fonts = `<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@300;400;500;600&amp;family=IBM+Plex+Sans+Arabic:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">`;
const page = (title, body, w, h, script = 'class Component extends DCLogic {\n  renderVals() {\n    return {};\n  }\n}') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
${fonts}
<style>
body{margin:0;background:#0B1026;font-family:'Figtree',system-ui,sans-serif;color:#F2ECDD}
</style>
</helmet>
${body}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
${script}
</script>
</body>
</html>
`;

/* ── Board 1: Profile (Night, clickable: tap a badge to see it) ── */
const N = T3.night;
const protoMedals = (b, S, k) => `<button type="button" onClick="{{pick${k}}}" aria-label="${b.en}" style="padding: 0; border: 0; background: none; border-radius: 999px; cursor: pointer; outline: {{ring${k}}}; outline-offset: 3px">${medal(b, S, N, EARNED.has(b.code))}</button>`;
const protoDetail = BADGES.map((b, k) => `<div style="display: {{show${k}}}">${detailCard(N, b)}</div>`).join('');
fs.writeFileSync(P + 'ProfileRevamp.dc.html', page('Profile — revamp (tap a badge)', profile(N, { medals: protoMedals, detail: protoDetail }), 390, 1320, `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 2 };
  }
  renderVals() {
    const vals = {};
    for (let k = 0; k < ${BADGES.length}; k++) {
      vals['show' + k] = k === this.state.sel ? 'block' : 'none';
      vals['ring' + k] = k === this.state.sel ? '2px solid ${N.accent}' : '0';
      vals['pick' + k] = () => this.setState({ sel: k });
    }
    return vals;
  }
}`));

/* ── Board 2: the badge sheet ── */
const sheetW = 64 * 2 + 3 * 400 + 2 * 24;
const sheetCol = (T) => `<div style="width: 400px; box-sizing: border-box; padding: 24px; border-radius: 24px; background: ${T.ground}; display: flex; flex-direction: column; gap: 20px">
<span style="font-family: 'Marcellus', serif; font-size: 24px; color: ${T.text}">${T.name}</span>
${BADGES.map((b) => `<div style="display: flex; align-items: center; gap: 14px">${medal(b, 64, T, true)}${medal(b, 40, T, false)}<div style="display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${b.en} · <span style="font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 500">${b.ar}</span></span><span style="font-size: 12.5px; color: ${T.sec}">${b.howEn}</span></div></div>`).join('')}
</div>`;
const sheet = `<div style="width: ${sheetW}px; box-sizing: border-box; padding: 64px; background: #0B1026; display: flex; flex-direction: column; gap: 32px">
<div style="display: flex; flex-direction: column; gap: 12px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: #6FD6CF">HOUNA · BADGES</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 56px; line-height: 1; color: #F2ECDD">Nine badges, nine skies</h1>
<p style="margin: 0; max-width: 1000px; font-size: 16px; line-height: 1.5; color: #B6BAD6">Streaks walk through a day: a spark on the horizon (3 days), the sun rising (7), the sun (14), the half moon (30), the full moon among stars (100). Four more celebrate exploring: the first session, every breathing exercise, every meditation scene, and every sky. Each is drawn from the app’s own bodies (the suns, the teal moon, the breathing orb, the tones), the mark pressed in. Earned: lit, at left. Locked: a faint grey silhouette, beside it. Never a badge for mood or journaling.</p></div>
<div style="display: flex; gap: 24px">${['sunrise', 'dusk', 'night'].map((k) => sheetCol(T3[k])).join('')}</div>
</div>`;
fs.writeFileSync(P + 'Badges.dc.html', page('Badges — nine skies', sheet, sheetW, 1186));

/* ── Board 3: My results (Night) ── */
const RESULTS = [
  { title: 'Mood (PHQ-8)', date: '24 Sep', band: 'Mild', saved: true },
  { title: 'Wellbeing (WHO-5)', date: '21 Sep', band: 'Good wellbeing' },
  { title: 'Anxiety (GAD-7)', date: '12 Sep', band: 'Moderate' },
  { title: 'Attention & focus (ASRS-5)', date: '8 Sep', band: '11 of 24' },
  { title: 'Mood (PHQ-8)', date: '2 Sep', band: 'Moderate' },
  { title: 'Childhood experiences (ACE)', date: '28 Aug', band: 'Some difficult experiences' },
];
function myResults(T, { empty = false } = {}) {
  const tile = `<span style="flex-shrink: 0; width: 40px; height: 40px; border-radius: 12px; background: rgba(179,167,245,0.12); border: 1px solid rgba(179,167,245,0.3); display: flex; align-items: center; justify-content: center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B3A7F5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path></svg></span>`;
  const list = RESULTS.map((r, i) => `<div role="button" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; ${i < RESULTS.length - 1 ? `border-bottom: 1px solid ${T.line}` : ''}">${tile}<div style="flex: 1; display: flex; flex-direction: column; gap: 3px"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${r.title}</span><span style="font-size: 12.5px; color: ${T.ter}">${r.date}${r.saved ? ' · Saved to profile' : ''}</span></div><span style="padding: 3px 10px; border-radius: 999px; border: 1px solid ${T.line}; font-size: 12px; color: ${T.sec}; white-space: nowrap">${r.band}</span>${chevron(T)}</div>`).join('');
  return `<div style="position: relative; width: 390px; height: 844px; box-sizing: border-box; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif; color: ${T.text}; padding: 20px; display: flex; flex-direction: column; gap: 20px">
<div>${back(T)}</div>
<div style="display: flex; flex-direction: column; gap: 8px">${mono(T, 'YOUR REFLECTIONS', T.accent)}<span style="font-family: 'Marcellus', serif; font-size: 32px; color: ${T.text}">My results</span><span style="font-size: 14px; line-height: 1.5; color: ${T.sec}">Every questionnaire you’ve taken. They stay on this phone unless you save them to your profile.</span></div>
${empty
    ? `<div style="${cardStyle(T)}; padding: 28px 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center"><span style="font-size: 15.5px; font-weight: 600">No results yet</span><span style="font-size: 13.5px; line-height: 1.5; color: ${T.sec}">Short questionnaires in Discover help you understand yourself a little better.</span><span style="margin-top: 4px; padding: 10px 18px; border-radius: 999px; background: ${T.accent}; color: ${T.ground}; font-size: 14px; font-weight: 600">Go to Discover</span></div>`
    : `<div style="${cardStyle(T)}">${list}</div><span style="font-size: 12.5px; color: ${T.ter}; text-align: center">Press and hold a result to delete it.</span>`}
</div>`;
}
fs.writeFileSync(P + 'MyResults.dc.html', page('My results', myResults(N), 390, 844));

/* ── Board 4: storyboard ── */
const S = 0.6;
const phone = (inner, h = 844) => `<div style="width: ${390 * S}px; height: ${h * S}px; border-radius: 28px; overflow: hidden; box-shadow: 0 0 0 1px rgba(242,236,221,0.10), 0 16px 40px rgba(0,0,0,0.35)"><div style="transform: scale(${S}); transform-origin: 0 0">${inner}</div></div>`;
const cap = (t, note) => `<span style="font-size: 15px; font-weight: 600; color: #F2ECDD">${t}</span>${note ? `<span style="font-size: 13px; line-height: 1.5; color: #B6BAD6">${note}</span>` : ''}`;
const frame = (inner, t, note, h) => `<div style="display: flex; flex-direction: column; gap: 8px; width: ${390 * S}px">${phone(inner, h)}${cap(t, note)}</div>`;
const still = (T) => profile(T, { medals: (b, sz) => medal(b, sz, T, EARNED.has(b.code)), detail: detailCard(T, BADGES[2]) });
const NOTES = [
  ['The Profile page', 'Who you are (avatar, alias, country), three numbers (streak, badges, sessions this month), your badges, then three rows: My results, Recap, and Stats & leaderboard. Settings sit below. Guests keep the claim-an-alias card in place of the identity and the numbers.'],
  ['Your sky', 'The streak badges sit on a dotted path, first light to full moon, so the next one is always in view. Tapping any badge shows its name and how to earn it (“Practise 14 days in a row · 2 more days”).'],
  ['Exploring', 'Four badges for trying things: a first session, all four breathing exercises, all four meditation scenes, and the three skies from Home. Worked out from the on-device session log; awarded to Aliases like the streak badges.'],
  ['My results', 'One tap from Profile, never on the Profile page itself (shared phones). Every questionnaire, newest first, with its date and a quiet band; tap to reopen, press and hold to delete (with a confirm). Each Discover card also says when you last took it.'],
  ['Leaderboard', 'Stays on Stats, one tap away. A ranking on Home can feel like pressure, would show usernames to anyone glancing at the phone, and is empty for Guests; Home keeps the map as the shared, non-competitive signal.'],
  ['The radar chart', 'Only for reflections with three or more traits (a Big Five later, say). None of the six screeners: each is one total, and putting mood, anxiety and trauma on one radar would suggest they compare.'],
];
const storyW = 64 * 2 + 4 * 234 + 3 * 28;
const story = `<div style="width: ${storyW}px; box-sizing: border-box; padding: 64px; background: #0B1026; display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 12px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: #6FD6CF">HOUNA · PROFILE</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 56px; line-height: 1; color: #F2ECDD">Profile, badges and your results</h1></div>
<div style="display: flex; gap: 28px">${frame(still(T3.night), 'Night', '', 1320)}${frame(still(T3.dusk), 'Dusk', '', 1320)}${frame(still(T3.sunrise), 'Sunrise', '', 1320)}${frame(myResults(N, { empty: true }), 'My results · empty', 'Points to Discover.')}</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">${NOTES.map(([t, b]) => `<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 18px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.10)"><span style="font-size: 15px; font-weight: 600; color: #F2ECDD">${t}</span><span style="font-size: 13.5px; line-height: 1.55; color: #B6BAD6">${b}</span></div>`).join('')}</div>
</div>`;
fs.writeFileSync(P + 'ProfileStory.dc.html', page('Profile — storyboard & notes', story, storyW, 1513));

/* ── Board 5: Home fitting one screen ──
 * Geometry measured from the app at 375×812 (web, no insets): the card 363–669 with its map 154 tall,
 * the crisis pill 681–725, and the raised Tanafas button's top at 724 (tab bar 748). The trim: the
 * map cropped to 72°N–44°S (the Arctic, the far southern tips and empty ocean go; it keeps its full
 * width), the card's inner gaps 12 → 8, and the screen's top padding 16 → 8. */
const dotsSrc = fs.readFileSync(__dirname + '/../../../constants/worldDots.ts', 'utf8');
const PACKED = JSON.parse(dotsSrc.match(/const PACKED[^=]*=\s*(\[[^\]]*\])/)[1]);
const RADII = [0, 0.38, 0.55, 0.68];
let DOTS = '';
for (let i = 0; i < PACKED.length; i += 3) {
  const x = PACKED[i] / 10, y = PACKED[i + 1] / 10, r = RADII[PACKED[i + 2]];
  DOTS += `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}
const Y_TOP = 2.0016178935776012, SCALE = 31.830988618379067;
const mapY = (lat) => (Y_TOP - 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * (lat * Math.PI) / 180))) * SCALE;
const CROP = [mapY(72), mapY(-44)];
const litAt = (lat, lon) => [((lon + 169) / 360) * 200, mapY(lat)];
const LIT = [[24, 45], [25, 55], [30, 31], [51, 0], [40, -100], [24, 54], [31, 36]]; // Saudi, UAE, Egypt, UK, US, Oman, Jordan
const worldMap = (T, w, cropped) => {
  const [y0, y1] = cropped ? CROP : [0, 99.4];
  const h = (w * (y1 - y0)) / 200;
  return { h, html: `<svg width="${w}" height="${h.toFixed(1)}" viewBox="0 ${y0.toFixed(2)} 200 ${(y1 - y0).toFixed(2)}" aria-hidden="true"><path d="${DOTS}" fill="${T.line.replace(/[\d.]+\)$/, '0.32)')}"></path>${LIT.map(([la, lo]) => { const [x, y] = litAt(la, lo); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="${T.accent}" opacity="0.25"></circle><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.3" fill="${T.accent}"></circle>`; }).join('')}</svg>` };
};
const { home } = require('./make-home-appearance.js');
function homeFit(T, H, trimmed) {
  const pad = trimmed ? 8 : 16, gap = trimmed ? 8 : 12;
  const cardTop = trimmed ? 355 : 363, inner = 390 - 32 - 32;
  const map = worldMap(T, inner, trimmed);
  const cardH = 16 + 36 + gap + map.h + gap + 54 + 16;
  const pillTop = cardTop + cardH + 12, tabTop = H - 64, raisedTop = tabTop - 24;
  const clear = raisedTop - (pillTop + 44);
  const chip = (t, on) => `<span style="height: 28px; padding: 0 12px; border-radius: 999px; display: flex; align-items: center; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.08em; ${on ? `background: ${T.accent}; color: ${T.ground}` : `color: ${T.sec}`}">${t}</span>`;
  return `<div style="position: relative; width: 390px; height: ${H}px; overflow: hidden; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif">
<div style="position: absolute; left: 0; top: ${pad - 16}px; width: 390px; height: 304px; overflow: hidden">${home(T, { hero: 'classic' })}</div>
<div style="position: absolute; left: 0; right: 0; top: ${pad + 290}px; display: flex; flex-direction: column; align-items: center; gap: 12px"><span style="font-family: 'DM Mono', monospace; font-size: 11.5px; letter-spacing: 0.16em; color: ${T.accent}">● YOU'RE NOT ALONE</span><span style="font-family: 'Marcellus', serif; font-size: 20px; line-height: 25px; color: ${T.text}">You are one light among many.</span></div>
<div style="position: absolute; left: 16px; top: ${cardTop}px; width: 358px; height: ${cardH.toFixed(0)}px; ${cardStyle(T)}; border-radius: 24px; padding: 16px; display: flex; flex-direction: column; gap: ${gap}px">
<div style="height: 36px; display: flex; align-items: center; justify-content: space-between">${mono(T, 'BREATHING TOGETHER')}<span style="display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: ${T.ctrl}">${chip('24H')}${chip('WEEK')}${chip('MONTH', true)}</span></div>
${map.html}
<div style="height: 54px; display: flex; align-items: flex-end; gap: 12px"><span style="font-family: 'Figtree', sans-serif; font-weight: 300; font-size: 36px; line-height: 36px; color: ${T.text}">1,204</span><span style="flex: 1; display: flex; flex-direction: column; gap: 4px; padding-bottom: 4px"><span style="font-size: 14px; line-height: 18px; color: ${T.sec}">people breathed and meditated with Houna this month</span>${mono(T, 'IN 12 COUNTRIES')}</span></div>
</div>
<span style="position: absolute; left: 50%; top: ${pillTop.toFixed(0)}px; height: 44px; transform: translateX(-50%); padding: 0 16px; display: flex; align-items: center; border-radius: 999px; background: rgba(${T.crisis},0.08); border: 1px solid rgba(${T.crisis},0.4); font-size: 14px; color: ${T.text}; white-space: nowrap; box-sizing: border-box">Need to talk now?</span>
<div style="position: absolute; left: 0; right: 0; top: ${tabTop}px; height: 64px; background: ${T.tab}; border-top: 1px solid ${T.tabLine}"></div>
<span style="position: absolute; left: 167px; top: ${raisedTop}px; width: 56px; height: 56px; border-radius: 999px; background: ${T.raised}; box-shadow: 0 0 0 6px ${T.ground}, 0 0 32px rgba(59,170,167,0.45)"></span>
<span style="position: absolute; left: 0; right: 0; top: ${raisedTop}px; border-top: 1px dashed ${clear < 8 ? '#F07A7A' : T.accent}"></span>
<span style="position: absolute; right: 12px; top: ${raisedTop - 22}px; font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.1em; color: ${clear < 8 ? '#F07A7A' : T.accent}">${clear < 0 ? `OVERLAP ${-clear.toFixed(0)}` : `CLEAR ${clear.toFixed(0)}`}</span>
</div>`;
}
const fitW = 64 * 2 + 4 * 390 + 3 * 32;
const fitCap = (t, note) => `<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 16px; font-weight: 600; color: #F2ECDD">${t}</span><span style="font-size: 13.5px; line-height: 1.5; color: #B6BAD6">${note}</span></div>`;
const fit = `<div style="width: ${fitW}px; box-sizing: border-box; padding: 64px; background: #0B1026; display: flex; flex-direction: column; gap: 32px">
<div style="display: flex; flex-direction: column; gap: 12px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: #6FD6CF">HOUNA · HOME</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 56px; line-height: 1; color: #F2ECDD">Home on one screen</h1>
<p style="margin: 0; max-width: 1100px; font-size: 16px; line-height: 1.5; color: #B6BAD6">At 812 tall the crisis pill runs into the raised Tanafas button. The map is cropped to where people live (72°N to 44°S: the Arctic, the far southern tips and empty ocean go), keeping its full width; the card’s inner gaps go from 12 to 8 and the top padding from 16 to 8. About 53 points back, the same in both Home styles. The dashed line is the top of the raised button.</p></div>
<div style="display: flex; gap: 32px; align-items: flex-start">
<div style="display: flex; flex-direction: column; gap: 12px">${homeFit(N, 812, false)}${fitCap('Today · 812', 'Map 154 tall, pill on the button.')}</div>
<div style="display: flex; flex-direction: column; gap: 12px">${homeFit(N, 812, true)}${fitCap('Trimmed · 812', 'Map cropped to 117, full width.')}</div>
<div style="display: flex; flex-direction: column; gap: 12px">${homeFit(T3.dusk, 844, true)}${fitCap('Trimmed · 844 · Dusk', '')}</div>
<div style="display: flex; flex-direction: column; gap: 12px">${homeFit(T3.sunrise, 844, true)}${fitCap('Trimmed · 844 · Sunrise', '')}</div>
</div></div>`;
fs.writeFileSync(P + 'HomeFit.dc.html', page('Home — one screen', fit, fitW, 1207));
console.log('ProfileRevamp, Badges, MyResults, ProfileStory written');
module.exports = { art, BADGES, EARNED };
