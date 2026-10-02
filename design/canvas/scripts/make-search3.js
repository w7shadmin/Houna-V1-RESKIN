// "Directory search — phase 3": the search screen's interface, four moments side by side in Night,
// with real directory data: before typing (recent searches, suggestions), results (highlighted
// matches, why each professional matched, filter chips with counts, Places), a corrected spelling,
// and nothing found. A storyboard to decide on before building; the app's own tokens apply per theme.
const fs = require('fs');
const P = __dirname + '/../project/';

// Decided: recent searches off (privacy on shared phones); the helper stays for reference.

const T = {
  ground: '#0B1026', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5', accent: '#6FD6CF',
  card: 'rgba(242,236,221,0.045)', line: 'rgba(242,236,221,0.10)', ctrl: 'rgba(242,236,221,0.08)',
  dawn: '#F2B880', dusk: '#B3A7F5', bloom: '#EA90A8', tab: '#0F1534',
};
const mono = "font-family: 'DM Mono', monospace";
const icon = (d, size = 18, color = 'currentColor', w = 1.7) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  search: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>',
  close: '<path d="M6 6l12 12M18 6 6 18"></path>',
  clock: '<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3"></path><path d="M3 12h15a3 3 0 1 1-3 3"></path><path d="M3 16h7"></path>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"></path><circle cx="12" cy="10" r="2.3"></circle>',
  chevron: '<path d="m9 6 6 6-6 6"></path>',
};
/** Text with the matched words lit in the accent. */
const hl = (s) => s.replace(/\[\[(.+?)\]\]/g, `<mark style="background: none; color: ${T.accent}">$1</mark>`);

const label = (text, action) => `<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 12px"><span style="${mono}; font-size: 11.5px; letter-spacing: 0.14em; color: ${T.ter}">${text}</span>${action ? `<span style="font-size: 13.5px; font-weight: 500; color: ${T.accent}">${action}</span>` : ''}</div>`;
const section = (...parts) => `<section style="display: flex; flex-direction: column; gap: 10px">${parts.join('')}</section>`;
const card = (inner, style = '') => `<div style="display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 20px; background: ${T.card}; border: 1px solid ${T.line}; ${style}">${inner}</div>`;

const bar = (value, { focused = true, placeholder = false } = {}) => `<div style="display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 8px 0 18px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${focused ? T.accent : 'rgba(242,236,221,0.14)'}; color: ${T.ter}">${icon(I.search, 20)}<span style="flex-grow: 1; font-size: 16px; color: ${placeholder ? T.ter : T.text}">${value}${focused ? `<span style="display: inline-block; width: 1.5px; height: 20px; margin-inline-start: 1px; vertical-align: -4px; background: ${T.accent}"></span>` : ''}</span>${placeholder ? '' : `<span style="width: 36px; height: 36px; border-radius: 999px; background: ${T.ctrl}; display: flex; align-items: center; justify-content: center; color: ${T.sec}">${icon(I.close, 14, 'currentColor', 2)}</span>`}</div>`;

const chips = (list) => `<div style="display: flex; gap: 8px; margin-inline-end: -20px; overflow: hidden">${list.map(([t, n, on]) => `<span style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 14px; border-radius: 999px; background: ${on ? T.text : 'rgba(242,236,221,0.06)'}; border: 1px solid ${on ? T.text : 'rgba(242,236,221,0.12)'}; color: ${on ? T.ground : T.text}; ${mono}; font-size: 11.5px; letter-spacing: 0.1em">${t}${n !== undefined ? `<span style="opacity: 0.6">${n}</span>` : ''}</span>`).join('')}</div>`;

const suggestion = (t) => `<span style="display: inline-flex; align-items: center; height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(242,236,221,0.14); font-size: 14px; color: ${T.text}">${t}</span>`;
const recent = (t) => `<div style="display: flex; align-items: center; gap: 12px; height: 44px; color: ${T.ter}">${icon(I.clock, 18)}<span style="flex-grow: 1; font-size: 15px; color: ${T.text}">${t}</span><span aria-label="Remove" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center">${icon(I.close, 14, T.ter, 2)}</span></div>`;

const avatar = (initials, [hi, mid, lo]) => `<span style="flex-shrink: 0; width: 56px; height: 56px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 30% 25%, ${hi} 0, ${mid} 55%, ${lo} 100%); font-family: 'Marcellus', serif; font-size: 20px; color: ${T.ground}">${initials}</span>`;
const TEAL = ['#D9FAF6', '#6FD6CF', '#2E8F8A'], DAWN = ['#FFF1E0', '#F2B880', '#B9713A'], DUSK = ['#EEEAFF', '#B3A7F5', '#6A5CC4'];
/** A professional, with the line saying why they matched (from the daily index), matched words lit. */
const person = (initials, tone, name, role, why) => card(`${avatar(initials, tone)}<span style="flex-grow: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0"><span style="font-size: 15.5px; font-weight: 600; color: ${T.text}">${hl(name)}</span><span style="font-size: 13.5px; font-weight: 500; color: ${T.accent}">${role}</span><span style="display: flex; align-items: center; gap: 5px; font-size: 12.5px; line-height: 1.4; color: ${T.ter}">${icon(I.pin, 13)}<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">${hl(why)}</span></span></span>`);
const article = (title, source, tone) => card(`<span style="flex-shrink: 0; width: 64px; height: 64px; border-radius: 16px; background: radial-gradient(circle at 30% 25%, ${tone[0]} 0, ${tone[1]} 55%, ${tone[2]} 100%)"></span><span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; line-height: 1.35; color: ${T.text}">${hl(title)}</span><span style="${mono}; font-size: 10.5px; letter-spacing: 0.12em; color: ${T.ter}">ARTICLE · ${source.toUpperCase()}</span></span>`);
const exercise = (title, meta, tone) => card(`<span style="flex-shrink: 0; width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: ${tone}1F; border: 1px solid ${tone}40; color: ${tone}">${icon(I.wind, 24)}</span><span style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${hl(title)}</span><span style="${mono}; font-size: 10.5px; letter-spacing: 0.12em; color: ${T.ter}">${meta}</span></span>`);
const topic = (name, blurb, glow) => `<div style="display: flex; flex-direction: column; border-radius: 24px; overflow: hidden; background: ${T.card}; border: 1px solid rgba(242,236,221,0.12)"><span style="height: 96px; background: radial-gradient(60% 100% at 50% 110%, ${glow}, rgba(11,16,38,0) 70%), #10173A"></span><span style="display: flex; align-items: center; gap: 12px; padding: 14px 18px"><span style="flex-grow: 1; display: flex; flex-direction: column; gap: 4px"><span style="font-family: 'Marcellus', serif; font-size: 22px; color: ${T.text}">${hl(name)}</span><span style="font-size: 14px; line-height: 1.45; color: ${T.sec}">${blurb}</span></span><span style="font-size: 14px; font-weight: 500; color: ${T.accent}">Learn more</span></span></div>`;
const places = (orgs, centres) => `<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px">${[[orgs, T.dawn, orgs === 1 ? 'organization' : 'organizations'], [centres, T.dusk, centres === 1 ? 'wellness center' : 'wellness centers']].filter(([n]) => n > 0).map(([n, c, what]) => `<div style="display: flex; flex-direction: column; gap: 6px; padding: 14px; border-radius: 20px; background: ${T.card}; border: 1px solid ${T.line}"><span style="width: 10px; height: 10px; border-radius: 999px; background: ${c}"></span><span style="font-size: 14.5px; font-weight: 600; color: ${T.text}">${n} ${what}</span><span style="font-size: 12.5px; color: ${T.ter}">matching “trauma”</span></div>`).join('')}</div>`;
const crisis = `<div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 20px; background: rgba(242,184,128,0.08); border: 1px solid rgba(242,184,128,0.35)">${icon(I.phone, 18, T.dawn, 1.8)}<span style="font-size: 14px; color: ${T.text}">If you’re struggling right now, talk to someone today.</span></div>`;
const browseRow = (t, c) => card(`<span style="width: 10px; height: 10px; border-radius: 999px; background: ${c}; margin: 0 6px"></span><span style="flex-grow: 1; font-size: 15px; font-weight: 600; color: ${T.text}">${t}</span><span style="color: ${T.ter}">${icon(I.chevron, 18)}</span>`, 'padding: 14px 16px');

const tabbar = `<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; background: ${T.tab}; border-top: 1px solid rgba(242,236,221,0.08); display: flex; align-items: flex-start; padding-top: 12px">${['Home', 'Directory', '', 'Events', 'More'].map((t, i) => i === 2 ? `<span style="flex: 1; display: flex; justify-content: center"><span style="margin-top: -30px; width: 56px; height: 56px; border-radius: 999px; background: ${T.text}; box-shadow: 0 0 0 6px ${T.ground}, 0 0 30px rgba(111,214,207,0.4)"></span></span>` : `<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; font-size: 11px; font-weight: ${i === 1 ? 600 : 400}; color: ${i === 1 ? T.text : T.ter}"><span style="width: 22px; height: 22px; border-radius: 6px; border: 1.6px solid currentColor; box-sizing: border-box"></span>${t}</span>`).join('')}</div>`;

const screen = (body) => `<div style="position: relative; width: 390px; height: 844px; overflow: hidden; border-radius: 36px; background: ${T.ground}; box-shadow: 0 0 0 1px rgba(242,236,221,0.10), 0 24px 60px rgba(0,0,0,0.45)"><div style="display: flex; flex-direction: column; gap: 18px; padding: 20px 20px 110px">
<div style="display: flex; flex-direction: column; gap: 6px"><span style="${mono}; font-size: 12px; letter-spacing: 0.16em; color: ${T.accent}">DIRECTORY</span><span style="font-family: 'Marcellus', serif; font-size: 30px; line-height: 1.1; color: ${T.text}">What are you looking for?</span></div>
${body}
</div>${tabbar}</div>`;

const FRAMES = [
  {
    title: 'Before you type',
    note: 'Tapping the box shows where to start: a few topics and one exercise to try, then the directory to browse. Nothing anyone searched for is kept: no recent searches, by decision, for privacy on shared phones.',
    body: [
      bar('Topics, people, exercises, events', { placeholder: true }),
      section(label('TRY A TOPIC'), `<div style="display: flex; flex-wrap: wrap; gap: 8px">${['Anxiety', 'Depression', 'ADHD', 'Autism', 'Eating Disorders', 'Abuse'].map(suggestion).join('')}</div>`),
      section(label('BREATHE NOW'), exercise('Anxiety Relief Breathing', '4-7-8 BREATHING · 1–5 MIN', T.accent)),
      section(label('BROWSE'), browseRow('Mental Health Professionals', T.accent), browseRow('Organizations', T.dawn)),
    ],
  },
  {
    title: 'Why each result',
    note: 'The words that matched are lit. Professionals say why they came up: the specialty that matched first, then where they are and their languages, from the daily index. The chips count each kind; kinds with nothing are hidden, and Places (organizations and wellness centers) gets its own.',
    body: [
      bar('trauma'),
      chips([['ALL', 41, true], ['PROFESSIONALS', 39], ['ARTICLES', 1], ['PLACES', 1]]),
      section(label('ARTICLES'), article('The Unseen Wounds: Understanding Vicarious [[Trauma]] in First Responders', 'fm.clinic', DUSK)),
      section(label('PROFESSIONALS · 39', 'See all'),
        person('AA', TEAL, 'Abrar Abdullah', 'Psychotherapist', '[[Trauma]] and trauma based therapy · Saudi Arabia · Arabic &amp; English'),
        person('AF', DAWN, 'Aisha Fakhro', 'Counselor and Somatic Educator', 'Anxiety, [[trauma]], relationships · Bahrain · English &amp; Arabic'),
        person('AD', DUSK, 'Angela Daaboul', 'Psychotherapist', '[[Trauma]], anxiety, young adults · Bahrain · English &amp; Arabic')),
      section(label('PLACES · 1'), places(1, 0)),
    ],
  },
  {
    title: 'A spelling put right',
    note: 'When every match came through a corrected spelling, the screen says so, lighting the word it read, with a way back to exactly what was typed. Typing on replaces it; nothing is ever silently rewritten.',
    body: [
      bar('anxeity'),
      `<div style="display: flex; flex-direction: column; gap: 2px; font-size: 14.5px; color: ${T.sec}"><span>Showing results for <strong style="font-weight: 600; color: ${T.accent}">anxiety</strong></span><span style="font-size: 13.5px; color: ${T.ter}">Search for <span style="text-decoration: underline">anxeity</span> instead</span></div>`,
      chips([['ALL', 64, true], ['TOPICS', 1], ['TANAFAS', 2], ['PROFESSIONALS', 58], ['ARTICLES', 1]]),
      section(label('TOPIC'), topic('[[Anxiety]]', 'Excessive worry affecting daily life', 'rgba(111,214,207,0.45)')),
      section(label('TANAFAS'), exercise('[[Anxiety]] Relief Breathing', '4-7-8 BREATHING TECHNIQUE', T.accent)),
    ],
  },
  {
    title: 'Nothing found',
    note: 'Never a dead end: a gentle line, a few topics to try, and the directory to browse. The crisis line stays, as on every search.',
    body: [
      bar('hijama'),
      `<div style="display: flex; flex-direction: column; gap: 6px; padding: 4px 2px"><span style="font-size: 17px; font-weight: 600; color: ${T.text}">Nothing matched “hijama”.</span><span style="font-size: 14.5px; line-height: 1.5; color: ${T.sec}">Try another word, one of these topics, or browse the directory.</span></div>`,
      `<div style="display: flex; flex-wrap: wrap; gap: 8px">${['Holistic Wellbeing', 'Anxiety', 'Depression'].map(suggestion).join('')}</div>`,
      crisis,
      section(label('BROWSE'), browseRow('Mental Health Professionals', T.accent), browseRow('Organizations', T.dawn), browseRow('Wellness Centers', T.dusk)),
    ],
  },
];

const NOTES = [
  ['No recent searches', 'Decided: searches aren’t remembered at all, so nothing someone looked for can be seen later by anyone else holding the phone. Queries never leave the phone either.'],
  ['Suggestions', 'A few of the directory’s topics and one Tanafas exercise, in the app’s language. Tapping a topic searches it; the exercise opens Tanafas at that exercise.'],
  ['Highlights and “why”', 'The matched words are lit in the accent, in titles and in the professional’s line, which leads with what matched (a specialty, or who they work with), then location and languages. Nothing new to load: it’s the daily index the search already uses.'],
  ['Chips with counts', 'Each kind shows how many matched; kinds with none are hidden, so the chips never lead to an empty list. A Places chip lists organizations and wellness centers in full.'],
  ['Corrected spelling', '“Showing results for anxiety” only when every match came through a correction, with “Search for anxeity instead” to see exactly what was typed.'],
  ['Arabic and themes', 'Everything mirrors in Arabic (right to left, Arabic numerals in the counts) and takes each theme’s own tokens; shown here in Night.'],
];

const W = 64 * 2 + FRAMES.length * 390 + (FRAMES.length - 1) * 40;
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Directory search — phase 3</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
</style>
</helmet>
<div style="width: ${W}px; box-sizing: border-box; padding: 64px; background: ${T.ground}; display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 12px">
<span style="${mono}; font-size: 12px; letter-spacing: 0.16em; color: ${T.accent}">HOUNA · DIRECTORY</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${T.text}">Directory search — phase 3</h1>
<p style="margin: 0; max-width: 980px; font-size: 17px; line-height: 1.5; color: ${T.sec}">The search screen’s interface, built on phases 1 and 2 (forgiving matching, the bilingual meaning map, the daily professional index). Four moments, with real directory data: before typing, a result list, a corrected spelling, and nothing found.</p>
</div>
<div style="display: flex; gap: 40px; align-items: flex-start">
${FRAMES.map((f, i) => `<div style="display: flex; flex-direction: column; gap: 14px; width: 390px">
${screen(f.body.join('\n'))}
<div style="display: flex; align-items: baseline; gap: 8px"><span style="${mono}; font-size: 12px; color: ${T.accent}">${i + 1}</span><span style="font-size: 17px; font-weight: 600; color: ${T.text}">${f.title}</span></div>
<span style="font-size: 13.5px; line-height: 1.55; color: ${T.sec}">${f.note}</span>
</div>`).join('\n')}
</div>
<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
${NOTES.map(([t, b]) => `<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 18px; background: ${T.card}; border: 1px solid ${T.line}"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${t}</span><span style="font-size: 13.5px; line-height: 1.55; color: ${T.sec}">${b}</span></div>`).join('\n')}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${W},"height":1640}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
fs.writeFileSync(P + 'SearchPhase3.dc.html', html);
console.log('SearchPhase3.dc.html', (html.length / 1024).toFixed(0) + 'KB · width', W);
