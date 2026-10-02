// "Houna — UX journey" (https://claude.ai/artifact/VJ6Wy62u7pL2vFj2RPtgjj): the app's journey for the
// product showcase, stage by stage, with the real screens (captured from the web preview, showcase
// data on) in phone frames. `node design/journey/scripts/make-journey.js` writes every board and
// canvas.json from design/journey/assets.json (screen → uploaded asset url);
// `--local <dir>` points the images at local files instead, for a preview.
const fs = require('fs');
const path = require('path');
const K = require('../../explorations/scripts/kit.js');

const DIR = path.join(__dirname, '..', 'project');
fs.mkdirSync(DIR, { recursive: true });
const localAt = process.argv.indexOf('--local');
const LOCAL = localAt > 0 ? process.argv[localAt + 1] : null;
const ASSETS = LOCAL ? {} : JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets.json'), 'utf8'));
const src = (name) => (LOCAL ? `${LOCAL}/${name}.jpg` : ASSETS[name] || '');

const M = K.NIGHT;
const INK = '#0B1026';
const PANEL = 'rgba(242,236,221,0.045)';
const LINE = 'rgba(242,236,221,0.12)';
const TEAL = '#6FD6CF';
const out = [];

/** Each theme's board: Night's midnight, or Sunrise's mist ground, charcoal ink and dark turquoise. */
const LOOKS = {
  night: { ground: INK, text: M.moonlight, sub: M.mist, accent: TEAL, glow: 'rgba(111,214,207,0.08)', panel: PANEL, line: LINE, shadow: 'rgba(0,0,0,0.5)' },
  sunrise: { ground: '#F2F6F4', text: '#1D2B2A', sub: '#58595B', accent: '#196662', glow: 'rgba(249,169,128,0.22)', panel: '#FFFFFF', line: 'rgba(29,43,42,0.12)', shadow: 'rgba(29,43,42,0.22)' },
};
/** The screens that are one theme whatever the board (the skies and their scenes). */
const THEME_FIXED = new Set(['04-home-sunrise', '05-home-dusk', '06-starfield', '07-sunrise-scene', '08-dusk-scene']);
/** A screen in the board's theme: Sunrise's captures end in -s; Home at night becomes Home at sunrise. */
const inTheme = (name, theme) => (theme !== 'sunrise' || THEME_FIXED.has(name) ? name : name === '03-home-night' ? '04-home-sunrise' : `${name}-s`);

/* ── The phone: the app screen (390 × 844) at SCALE, in a frame with a plain top bezel ── */
const SCALE = 0.82;
const SW = Math.round(390 * SCALE), SH = Math.round(844 * SCALE);
const BEZEL = 11, TOP = 26, BOTTOM = 14;
const PW = SW + BEZEL * 2, PH = SH + TOP + BOTTOM;
const phone = (name, alt, { x = 0, y = 0, scale = 1, tilt = 0, shadow = 'rgba(0,0,0,0.5)' } = {}) => `
<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${PW}px; height: ${PH}px; transform-origin: 0 0; transform: scale(${scale}) rotate(${tilt}deg)">
  <div style="position: absolute; inset: 0; border-radius: 50px; background: linear-gradient(145deg, #3A3F4E 0%, #1B1E28 45%, #2A2E3B 100%); box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 30px 60px ${shadow}, inset 0 0 0 2px rgba(255,255,255,0.05)"></div>
  <span style="position: absolute; left: -3px; top: 150px; width: 3px; height: 56px; border-radius: 2px; background: #2A2E3B"></span>
  <span style="position: absolute; left: -3px; top: 220px; width: 3px; height: 56px; border-radius: 2px; background: #2A2E3B"></span>
  <span style="position: absolute; right: -3px; top: 190px; width: 3px; height: 84px; border-radius: 2px; background: #2A2E3B"></span>
  <span style="position: absolute; left: 50%; top: 11px; width: 52px; height: 5px; margin-left: -26px; border-radius: 3px; background: #0A0C12"></span>
  <span style="position: absolute; left: 50%; top: 9px; width: 9px; height: 9px; margin-left: 36px; border-radius: 999px; background: radial-gradient(circle at 35% 35%, #2B3550, #07080C)"></span>
  <div style="position: absolute; left: ${BEZEL}px; top: ${TOP}px; width: ${SW}px; height: ${SH}px; border-radius: 34px; overflow: hidden; background: ${INK}">
    <img src="${src(name)}" alt="${alt}" style="display: block; width: ${SW}px; height: ${SH}px; object-fit: cover">
  </div>
</div>`;

/** The step between two screens: an arrow and what the person does. */
const STEP_W = 128;
const step = (x, y, text, look = LOOKS.night) => `
<div style="position: absolute; left: ${x}px; top: ${y}px; width: ${STEP_W}px; display: flex; flex-direction: column; align-items: center; gap: 10px">
  <svg width="96" height="18" viewBox="0 0 96 18" aria-hidden="true"><path d="M2 9 H88" stroke="${look.accent}" stroke-width="1.6" stroke-dasharray="4 5" fill="none"></path><path d="M82 3 L90 9 L82 15" stroke="${look.accent}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"></path></svg>
  <span style="font-size: 13px; line-height: 1.4; color: ${look.sub}; text-align: center">${text}</span>
</div>`;

/** A stage: its header (number, name, the person's goal, what Houna does, how it should feel), then its screens in a row. */
const PAD = 72;
const HEADER = 250;
function stage(file, { n, name, goal, does, feel, screens, lang = 'en', theme = 'night' }) {
  const look = LOOKS[theme];
  const count = screens.length;
  const W = PAD * 2 + count * PW + (count - 1) * STEP_W;
  const H = PAD + HEADER + PH + 150 + PAD;
  const top = PAD + HEADER;
  const phones = screens
    .map((s, i) => {
      const x = PAD + i * (PW + STEP_W);
      const cap = `<div style="position: absolute; left: ${x}px; top: ${top + PH + 24}px; width: ${PW}px; display: flex; flex-direction: column; gap: 6px"><span style="font-size: 16px; font-weight: 600; color: ${look.text}">${s.title}</span><span style="font-size: 13.5px; line-height: 1.5; color: ${look.sub}">${s.note}</span></div>`;
      const arrow = i < count - 1 && s.then ? step(x + PW, top + PH / 2 - 30, s.then, look) : '';
      return phone(inTheme(s.shot, theme), s.title, { x, y: top, shadow: look.shadow }) + cap + arrow;
    })
    .join('');
  const col = (label, text) => `<div style="display: flex; flex-direction: column; gap: 8px; max-width: 420px">${K.label(label, look.accent, 11)}<span style="font-size: 16px; line-height: 1.55; color: ${look.text}">${text}</span></div>`;
  const themeTag = theme === 'sunrise' ? ` · Sunrise` : '';
  const body = `
<span aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 0; height: 600px; background: radial-gradient(60% 100% at 20% 0%, ${look.glow}, rgba(0,0,0,0) 70%)"></span>
<div style="position: absolute; left: ${PAD}px; top: ${PAD}px; right: ${PAD}px; display: flex; gap: 64px; align-items: flex-start">
  <div style="display: flex; flex-direction: column; gap: 12px; min-width: 360px">
    ${K.label(`Stage ${n}${themeTag}`, look.accent, 12)}
    <h1 style="margin: 0; font-family: ${K.F.display}; font-weight: 400; font-size: 52px; line-height: 1.05; color: ${look.text}">${name}</h1>
  </div>
  <div style="display: flex; gap: 48px; padding-top: 6px">${col('The person wants', goal)}${col('Houna', does)}${col('How it should feel', feel)}</div>
</div>
${phones}`;
  out.push(K.board(file, { title: `${n} · ${name}${themeTag}`, lang, w: W, h: H, root: `background: ${look.ground}`, body, dir: DIR }));
}

/* ══════════ The stages ══════════ */
const STAGES = [
  {
    file: 'S1-arrive.dc.html', n: 1, name: 'Arrive',
    goal: 'To feel something before being asked for anything.',
    does: 'One guided breath comes first: no sign-up, no questions. Then Home, where others are breathing too.',
    feel: 'Curious, then settled.',
    screens: [
      { shot: '01-welcome', title: 'A welcome', note: 'Shown once, before anything is asked. English or العربية, one tap.', then: 'Begin' },
      { shot: '02-first-breath', title: 'The first breath', note: 'One slow breath on the glass orb: in 4, hold 2, out 6. Nothing is counted; “Not now” skips.', then: 'Continue' },
      { shot: '03-home-night', title: 'Home', note: 'The moon in tonight’s phase, the Hijri date, and a map of the people breathing with Houna.' },
    ],
  },
  {
    file: 'S2-sky.dc.html', n: 2, name: 'Choose a sky',
    goal: 'To make it feel like theirs.',
    does: 'Three skies, Sunrise, Dusk and Night; the wordmark is the switch. Each sky’s body opens a breathing scene of its own.',
    feel: 'Personal, and a little magical.',
    screens: [
      { shot: '04-home-sunrise', title: 'Sunrise', note: 'Houna’s original palette: a pale sun in a turning star lattice.', then: 'Tap the sun' },
      { shot: '07-sunrise-scene', title: 'Breathe with the sunrise', note: 'The sun stays and grows as the morning sky comes in. The lattice breathes on a 5-second rhythm.', then: 'Back, then the logo' },
      { shot: '05-home-dusk', title: 'Dusk', note: 'The evening sun: a ring of light with هُنا · نتنفّس معًا turning round it.', then: 'Tap the sun' },
      { shot: '08-dusk-scene', title: 'Breathe with the dusk', note: 'A violet evening; the first stars come out, and now and then a shooting star.', then: 'Back, then the logo' },
      { shot: '03-home-night', title: 'Night', note: 'A pearl glass moon in tonight’s real phase, worked out on the phone, offline.', then: 'Tap the moon' },
      { shot: '06-starfield', title: 'The starfield', note: 'The same moon, whole, as a turning sky gathers round it. Every visit counts as practice.' },
    ],
  },
  {
    file: 'S3-breathe.dc.html', n: 3, name: 'Breathe',
    goal: 'To calm down, now.',
    does: 'Five exercises in Tanafas, each with its own stage. A gentle countdown, then the screen goes quiet: the bars hide and the controls step aside.',
    feel: 'Held, never rushed.',
    screens: [
      { shot: '10-breathe-478', title: '4-7-8', note: 'A glass orb with the mark pressed in. Pattern and length on tiles; one round button.', then: 'Swipe' },
      { shot: '11-breathe-sigh', title: 'The physiological sigh', note: 'Two breaths in, one long breath out. Two lines to rise to.', then: 'Play' },
      { shot: '12-countdown', title: 'A countdown', note: '3, 2, 1, and “Settle in. Breathe as you are.” Stopping here counts nothing.', then: 'It begins' },
      { shot: '13-inhale', title: 'In session', note: 'The orb fills and its rim lights through the hold. Each phase is spoken to screen readers.', then: 'Another day' },
      { shot: '14-box', title: 'Box breathing', note: 'A bead traces a square; through each hold a second square turns until they make the eight-point star.' },
    ],
  },
  {
    file: 'S4-meditate.dc.html', n: 4, name: 'Meditate',
    goal: 'To take ten minutes somewhere else.',
    does: 'Four scenes with sound and video, any length, chosen in place on glass sheets. The player is a dark, quiet focus mode.',
    feel: 'Away, and safe to be away.',
    screens: [
      { shot: '15-meditate', title: 'Meditate', note: 'Today’s date, Gregorian and Hijri, a line to sit with, and the scene drifting behind.', then: 'Scene' },
      { shot: '16-scene-sheet', title: 'Choose a scene', note: 'Fire, rain, forest, ocean: each in its own light. Choosing is starting.', then: 'Length' },
      { shot: '17-length', title: 'How long?', note: 'A wheel from 3 to 60 minutes, no limit, or any length with Custom.', then: 'Begin' },
      { shot: '18-player', title: 'The player', note: 'Full screen; the controls fade after a few seconds of stillness. A gentle buzz at the end.' },
    ],
  },
  {
    file: 'S5-reflect.dc.html', n: 5, name: 'Reflect',
    goal: 'To understand how they feel.',
    does: 'A mood check-in in a glass sheet, a private journal on the phone (exported as a PDF), and short self-reflection questionnaires, with “not a diagnosis” said first.',
    feel: 'Honest, private, never judged.',
    screens: [
      { shot: '19-checkin', title: 'Check in', note: 'Over Home, softened behind glass. A mood and a few words. No streaks on mood, ever.', then: 'Journal' },
      { shot: '20-journal', title: 'The journal', note: 'On this phone only, not tied to an account; entries and mood insights. Export it as a PDF any time.', then: 'Discover' },
      { shot: '22-discover', title: 'Discover', note: 'Five short questionnaires, each with an official Arabic version.', then: 'Open one' },
      { shot: '23-test-intro', title: 'Before you begin', note: 'Not a diagnosis, first. Then what it is, and where it comes from.', then: 'Begin' },
      { shot: '24-test-question', title: 'One question at a time', note: 'The instrument’s own words. Leaving never asks “are you sure?”.' },
    ],
  },
  {
    file: 'S6-support.dc.html', n: 6, name: 'Find support',
    goal: 'To reach a real person.',
    does: 'A directory of therapists, organisations and centres, searched on the phone in either language, and events to join. Crisis help is one tap from Home.',
    feel: 'Not alone, and not lost.',
    screens: [
      { shot: '26-directory', title: 'The directory', note: 'Professionals, organisations, wellness centres, articles, podcasts, events.', then: 'Search' },
      { shot: '27-search', title: 'Search that understands', note: '“Sad” finds depression; English finds Arabic. The query never leaves the phone.', then: 'Professionals' },
      { shot: '28-professionals', title: 'Professionals', note: 'Who they help, where, and in which languages.', then: 'Open one' },
      { shot: '29-professional', title: 'A profile', note: 'Specialties, languages and ways to get in touch.', then: 'Events' },
      { shot: '30-events', title: 'Events', note: 'Talks and workshops, in person and online.', then: 'Open one' },
      { shot: '31-event', title: 'An event', note: 'The card’s photo flies up into the page.', then: 'Any time' },
      { shot: '32-crisis', title: 'Need to talk now?', note: 'Always one tap from Home, never behind a menu.' },
    ],
  },
  {
    file: 'S7-practice.dc.html', n: 7, name: 'See the practice',
    goal: 'To see it adding up, without pressure.',
    does: 'Your sky and your month in breath on Profile, the month in moons, a monthly Recap, badges, and for an Alias, weekly stats and a gentle leaderboard. Streaks count practice, never mood.',
    feel: 'Proud, quietly.',
    screens: [
      { shot: '33-profile', title: 'Profile', note: 'The theme’s own body, or a photo. No scores here: shared phones.', then: 'Scroll' },
      { shot: '34-profile-graphs', title: 'Your sky, your month', note: 'A star for each day practised; the month’s minutes as ridges, one colour per practice.', then: 'The date on Home' },
      { shot: '35-month', title: 'The month in moons', note: 'Every night of the Hijri month in its phase; the nights practised glow.', then: 'Recap' },
      { shot: '37-recap-2', title: 'Recap', note: 'The month as a story, a slide at a time: the minutes breathed, the favourite exercise.', then: 'Tap' },
      { shot: '45-recap-4', title: 'By moonlight', note: 'The month’s nights as real moons; the days practised glow, the rest simply rest.', then: 'Badges' },
      { shot: '39-badges', title: 'Badges', note: 'Streak badges and ones for exploring, each a small sky in glass, with how many hold it.' },
    ],
  },
  {
    file: 'S8-arabic.dc.html', n: 8, name: 'In Arabic', lang: 'en',
    goal: 'To feel it was made in their language.',
    does: 'Everything in Arabic and English, laid out right to left, with Arabic type and Arabic-Indic numerals, and Arabic plural agreement.',
    feel: 'At home.',
    screens: [
      { shot: '42-home-ar', title: 'الرئيسية', note: 'Home in Arabic: the same sky, read right to left.', then: 'Tanafas' },
      { shot: '43-breathe-ar', title: 'تنفّس', note: 'The exercises in the first person plural: we breathe together.', then: 'Directory' },
      { shot: '44-directory-ar', title: 'الدليل', note: 'Search in Arabic finds English entries too.' },
    ],
  },
];
STAGES.forEach((s) => stage(s.file, s));
/** Each stage again in Sunrise, beside its Night board (Choose a sky already shows every theme). */
const sunriseFile = (file) => file.replace('.dc.html', '-sunrise.dc.html');
const TWINNED = STAGES.filter((s) => s.n !== 2);
TWINNED.forEach((s) => stage(sunriseFile(s.file), { ...s, theme: 'sunrise' }));

/* ══════════ The journey map: every stage, at a glance ══════════ */
function journeyMap(file, theme) {
  const look = LOOKS[theme];
  const TEAL = look.accent, PANEL = look.panel, LINE = look.line, INK = look.ground;
  const M = { moonlight: look.text, mist: look.sub };
  const COLW = 300, GAP = 24, W = PAD * 2 + STAGES.length * COLW + (STAGES.length - 1) * GAP, H = 1300;
  // How it should feel along the way: a gentle climb, a dip where reflection gets real, then support.
  const FEEL = [0.35, 0.62, 0.72, 0.8, 0.58, 0.74, 0.88, 0.84];
  const curveTop = 930, curveH = 200;
  const pts = FEEL.map((f, i) => [PAD + i * (COLW + GAP) + COLW / 2, curveTop + curveH * (1 - f)]);
  const d = pts.map((p, i) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const q = pts[i - 1], mx = (q[0] + p[0]) / 2;
    return `C ${mx} ${q[1]}, ${mx} ${p[1]}, ${p[0]} ${p[1]}`;
  }).join(' ');
  const cols = STAGES.map((s, i) => {
    const x = PAD + i * (COLW + GAP);
    const thumb = s.screens[s.screens.length > 2 ? 1 : 0];
    return `
<div style="position: absolute; left: ${x}px; top: 250px; width: ${COLW}px; height: 590px; border-radius: 22px; background: ${PANEL}; border: 1px solid ${LINE}; box-sizing: border-box; padding: 22px; display: flex; flex-direction: column; gap: 12px">
  ${K.label(`Stage ${s.n}`, TEAL, 11)}
  <span style="font-family: ${K.F.display}; font-size: 28px; color: ${M.moonlight}">${s.name}</span>
  <span style="font-size: 14px; line-height: 1.5; color: ${M.moonlight}">${s.goal}</span>
  <span style="font-size: 13px; line-height: 1.5; color: ${M.mist}">${s.does}</span>
</div>
${phone(inTheme(thumb.shot, theme), thumb.title, { x: x + COLW / 2 - (PW * 0.34) / 2, y: 580, scale: 0.34, shadow: look.shadow })}
<span style="position: absolute; left: ${x}px; top: ${curveTop + curveH + 28}px; width: ${COLW}px; text-align: center; font-size: 14px; color: ${M.moonlight}">${s.feel}</span>`;
  }).join('');
  const body = `
<span aria-hidden="true" style="position: absolute; inset: 0; background: radial-gradient(50% 60% at 50% 0%, ${look.glow}, rgba(0,0,0,0) 70%)"></span>
<div style="position: absolute; left: ${PAD}px; top: ${PAD}px; display: flex; flex-direction: column; gap: 12px">
  ${K.label(`Houna · the journey map${theme === 'sunrise' ? ' · Sunrise' : ''}`, TEAL, 12)}
  <h1 style="margin: 0; font-family: ${K.F.display}; font-weight: 400; font-size: 56px; color: ${M.moonlight}">Eight moments, one calm thread</h1>
</div>
${cols}
<div style="position: absolute; left: ${PAD}px; top: ${curveTop - 36}px">${K.label('How it should feel', TEAL, 11)}</div>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true" style="position: absolute; inset: 0; pointer-events: none">
  <line x1="${PAD}" y1="${curveTop + curveH}" x2="${W - PAD}" y2="${curveTop + curveH}" stroke="${LINE}"></line>
  <path d="${d}" fill="none" stroke="${TEAL}" stroke-width="2.5" stroke-linecap="round"></path>
  ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="7" fill="${INK}" stroke="${TEAL}" stroke-width="2.5"></circle>`).join('')}
</svg>`;
  out.push(K.board(file, { title: `The journey map${theme === 'sunrise' ? ' · Sunrise' : ''}`, w: W, h: H, root: `background: ${INK}`, body, dir: DIR }));
}
journeyMap('Map.dc.html', 'night');
journeyMap('Map-sunrise.dc.html', 'sunrise');

/* ══════════ The cover ══════════ */
(() => {
  const W = 1600, H = 1000;
  const body = `
<span aria-hidden="true" style="position: absolute; inset: 0; background: radial-gradient(45% 60% at 72% 40%, rgba(111,214,207,0.12), rgba(11,16,38,0) 70%), radial-gradient(40% 50% at 10% 100%, rgba(179,167,245,0.10), rgba(11,16,38,0) 70%)"></span>
${K.starfield(70, W, H, 5)}
<div style="position: absolute; left: 96px; top: 150px; width: 620px; display: flex; flex-direction: column; gap: 24px">
  <div style="width: 150px">${K.logo('#6FD6CF', '#F2ECDD', 150)}</div>
  ${K.label('The UX journey · product showcase', TEAL, 13)}
  <h1 style="margin: 0; font-family: ${K.F.display}; font-weight: 400; font-size: 76px; line-height: 1.02; color: ${M.moonlight}">Here, we breathe together</h1>
  <p style="margin: 0; font-size: 19px; line-height: 1.6; color: ${M.mist}">A bilingual mental wellness app for the Gulf and the Arab world: breathing and meditation under your own sky, a private journal, gentle self-reflection, and a way to real support, one tap away.</p>
  <div style="display: flex; flex-wrap: wrap; gap: 10px">${STAGES.map((s) => `<span style="padding: 8px 14px; border-radius: 999px; border: 1px solid ${LINE}; font-size: 14px; color: ${M.moonlight}">${s.n} · ${s.name}</span>`).join('')}</div>
</div>
${phone('04-home-sunrise', 'Home at sunrise', { x: 820, y: 170, scale: 0.86, tilt: -6 })}
${phone('03-home-night', 'Home at night', { x: 1060, y: 110, scale: 0.98 })}
${phone('05-home-dusk', 'Home at dusk', { x: 1330, y: 190, scale: 0.86, tilt: 6 })}`;
  out.push(K.board('Main.dc.html', { title: 'Houna — the UX journey', w: W, h: H, root: `background: ${INK}`, body, dir: DIR }));
})();

/* ── The canvas: the cover and the map on top, then a row per stage ── */
const byFile = Object.fromEntries(out.map((b) => [b.file, b]));
// The cover, then the map in Night and Sunrise side by side; then each stage, Night then Sunrise.
const ROWS = [['Main.dc.html', 'Map.dc.html', 'Map-sunrise.dc.html'], ...STAGES.map((s) => (s.n === 2 ? [s.file] : [s.file, sunriseFile(s.file)]))];
const boards = {}, order = [], notes = {};
let y = 0;
ROWS.forEach((files, r) => {
  let x = 0, h = 0;
  for (const f of files) {
    const b = byFile[f];
    boards[f] = { x, y, w: b.w, h: b.h, title: b.title };
    order.push(f);
    x += b.w + 80;
    h = Math.max(h, b.h);
  }
  y += h + 120;
});
const indexPath = path.join(DIR, 'canvas.json');
const prev = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : null;
fs.writeFileSync(indexPath, JSON.stringify({
  v: 3,
  createdOnFiles: prev?.createdOnFiles ?? { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') },
  title: 'Houna — UX journey',
  launch: { view: 'canvas' },
  pages: [],
  boards,
  order,
  notes,
  designSystems: [],
}, null, 2) + '\n');
console.log(out.map((b) => `${b.file} ${b.w}×${b.h}`).join('\n'));
