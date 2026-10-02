// The "Icon library" board (Night + Dusk; Sunrise is generated from Dusk by make-morning.js):
// every icon the app draws today — the canvas glyphs and the Lucide set — plus suggestions for
// features that don't have one yet, icon tiles in each tone, social marks and the topic animations.
const fs = require('fs');
const path = require('path');
const APP = __dirname + '/../../../';
const P = __dirname + '/../project/';
const LUCIDE = APP + 'node_modules/lucide-react-native/dist/esm/icons/';

/* ── Glyph sources ── */

/** A Lucide icon's SVG children, read from the installed package (same version the app ships). */
function lucide(file) {
  const src = fs.readFileSync(LUCIDE + file + '.js', 'utf8');
  const arr = /createLucideIcon\("[^"]+",\s*(\[[\s\S]*\])\);/.exec(src)[1];
  const nodes = new Function('return ' + arr)();
  return nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}></${tag}>`).join('');
}

/** The canvas glyphs, parsed from components/ui/CanvasIcon.tsx so the board matches the app. */
function canvasGlyphs() {
  const src = fs.readFileSync(APP + 'components/ui/CanvasIcon.tsx', 'utf8');
  const out = {};
  for (const m of src.matchAll(/case '(\w+)':([\s\S]*?)break;/g)) {
    const body = m[2];
    const filled = body.includes('fill={color}');
    out[m[1]] = {
      filled,
      svg: [...body.matchAll(/<(Path|Circle|Rect)([^>]*?)\/>/g)].map(([, tag, attrs]) => {
        const a = attrs.replace(/\{\.\.\.stroke\}/, '').replace(/fill=\{color\}/, '').replace(/=\{([\d.]+)\}/g, '="$1"').trim();
        return `<${tag.toLowerCase()} ${a}${filled ? ' fill="currentColor" stroke="none"' : ''}></${tag.toLowerCase()}>`;
      }).join(''),
    };
  }
  return out;
}
const CANVAS = canvasGlyphs();

/* ── Content ── */

const CANVAS_ICONS = [
  ['home', 'Tab · Home'], ['search', 'Tab · Directory'], ['tanafas', 'Raised Tanafas button'], ['events', 'Tab · Events'], ['more', 'Tab · More'],
  ['profile', 'Top bar · profile'], ['close', 'Close / end'], ['play', 'Begin'], ['pause', 'Pause'], ['back', 'Back (mirrors in RTL)'],
  ['chevron', 'Next / row link (mirrors)'], ['chevronStart', 'Previous (mirrors)'], ['arrow', 'Forward (mirrors)'], ['phone', 'Crisis pill'],
  ['journal', 'Journal'], ['info', 'Note'], ['shield', 'Safety / not a diagnosis'], ['reflection', 'Self-reflection tests'],
];

// [lucide file, name shown, where it's used]
const IN_APP = [
  ['Navigation & controls', [
    ['arrow-left', 'ArrowLeft', 'Detail back'], ['chevron-right', 'ChevronRight', 'More rows'], ['chevron-down', 'ChevronDown', 'Filters'],
    ['x', 'X', 'Dismiss'], ['check', 'Check', 'Confirm'], ['plus', 'Plus', 'New Voice'], ['sliders-horizontal', 'SlidersHorizontal', 'Filters'],
    ['arrow-up-down', 'ArrowUpDown', 'Sort events'], ['rotate-ccw', 'RotateCcw', 'Restart session'], ['rotate-cw', 'RotateCw', 'Retry'],
    ['maximize-2', 'Maximize2', 'Player full'], ['minimize-2', 'Minimize2', 'Player small'], ['download', 'Download', 'Export journal'], ['trash-2', 'Trash2', 'Delete'],
  ]],
  ['Media', [
    ['play', 'Play', 'Event video'], ['pause', 'Pause', 'Meditation'], ['video', 'Video', 'Virtual event'], ['headphones', 'Headphones', 'Podcasts · audio'],
    ['camera', 'Camera', 'Avatar photo'], ['image', 'Image', 'Voices photo'], ['image-plus', 'ImagePlus', 'Add photo'],
  ]],
  ['Directory & profiles', [
    ['users', 'Users', 'Professionals'], ['building-2', 'Building2', 'Organizations'], ['heart-pulse', 'HeartPulse', 'Wellness centers'],
    ['book-open', 'BookOpen', 'Articles'], ['newspaper', 'Newspaper', 'News'], ['brain', 'Brain', 'Topic fallback'], ['globe', 'Globe', 'Website'],
    ['map-pin', 'MapPin', 'Location'], ['mail', 'Mail', 'Email'], ['phone', 'Phone', 'Call'], ['languages', 'Languages', 'Languages spoken'],
    ['flag', 'Flag', 'Nationality'], ['award', 'Award', 'Credentials · badges'], ['calendar', 'Calendar', 'Event date'],
  ]],
  ['Community & account', [
    ['message-circle', 'MessageCircle', 'Voices'], ['sparkles', 'Sparkles', 'Coming soon · Voices'], ['hand-heart', 'HandHeart', 'Get involved'],
    ['heart-handshake', 'HeartHandshake', 'About'], ['bell', 'Bell', 'Notifications'], ['info', 'Info', 'About'], ['mail-check', 'MailCheck', 'Check your email'],
    ['circle-check', 'CheckCircle2', 'Submitted · done'],
  ]],
];

const SUGGESTED = [
  ['Appearance', 'For the Sunrise · Dusk · Night picker', [
    ['sunrise', 'Sunrise'], ['sunset', 'Dusk'], ['moon', 'Night'], ['sun-moon', 'Theme'],
  ]],
  ['Tanafas', 'Exercise and scene marks, instead of text alone', [
    ['wind', '4-7-8 breath'], ['square', 'Box breath', 'box'], ['leaf', 'Grounding'], ['hand', 'Tension release'], ['timer', 'Duration'],
    ['volume-2', 'Sound on'], ['volume-x', 'Sound off'], ['flame', 'Fire'], ['cloud-rain', 'Rain'], ['droplets', 'Creek'], ['waves', 'Ocean'], ['mountain-snow', 'Mountain'],
  ]],
  ['Mood & journal', 'Private, no streaks on mood', [
    ['smile', 'Good'], ['meh', 'Okay'], ['frown', 'Low'], ['pen-line', 'Write'], ['notebook-pen', 'New entry'], ['tag', 'Tag'],
    ['calendar-days', 'History'], ['lock', 'On this device'], ['file-down', 'Export'],
  ]],
  ['Progress', 'Exercise consistency only', [
    ['trophy', 'Badge'], ['medal', 'Milestone'], ['star', 'Favourite'], ['trending-up', 'Trend'], ['chart-column', 'Stats'], ['sprout', 'Growing'],
  ]],
  ['Support & safety', 'Never buried: crisis help stays one tap away', [
    ['life-buoy', 'Crisis help'], ['phone-call', 'Call a line'], ['message-square-heart', 'Talk to someone'], ['shield-check', 'Safe space'], ['hand-helping', 'Support'],
  ]],
  ['Community', 'Map, Voices and sharing', [
    ['map', 'Community map'], ['earth', 'Countries'], ['heart', 'Appreciate'], ['bookmark', 'Save'], ['share-2', 'Share'], ['send', 'Post'], ['user-plus', 'Claim alias'],
  ]],
  ['Settings', 'Profile and More', [
    ['settings', 'Settings'], ['bell-off', 'Mute'], ['bell-ring', 'Reminder'], ['alarm-clock', 'Reminder time'], ['eye', 'Show'], ['eye-off', 'Hide'],
    ['accessibility', 'Accessibility'], ['log-out', 'Sign out'],
  ]],
];

const SOCIAL = ['Website', 'Instagram', 'TikTok', 'Snapchat', 'WhatsApp', 'X', 'Facebook', 'YouTube', 'LinkedIn', 'Telegram', 'Threads', 'Pinterest'];
const SOCIAL_LUCIDE = { Website: 'globe', Instagram: 'instagram', Facebook: 'facebook', YouTube: 'youtube', LinkedIn: 'linkedin', X: 'twitter' };

const TOPICS = fs.readFileSync(APP + 'components/directory/LottieTopicIcon.tsx', 'utf8')
  .split('const LOTTIE_DAY')[0]
  .match(/^\s+'?([a-z-]+)'?: require/gm).map((m) => m.trim().replace(/'?: require$/, '').replace(/^'/, ''));

/* ── Themes ── */

const THEMES = {
  night: {
    file: 'Icons.dc.html', title: 'Icon library',
    ground: '#0B1026', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8990B5',
    card: 'rgba(242,236,221,0.045)', border: 'rgba(242,236,221,0.10)', ctrl: 'rgba(242,236,221,0.06)', ctrlBorder: 'rgba(242,236,221,0.12)',
    accent: '#6FD6CF', dashed: 'rgba(111,214,207,0.45)',
    tones: [['Glow', '#6FD6CF', '111,214,207'], ['Dawn', '#F2B880', '242,184,128'], ['Dusk', '#B3A7F5', '179,167,245'], ['Bloom', '#EA90A8', '234,144,168']],
    hounaGlow: '111,214,207',
  },
  day: {
    file: 'IconsDay.dc.html', title: 'Icon library (Day)',
    ground: '#F5F1E8', text: '#1B2140', sec: '#4A5078', ter: '#646A8E',
    card: '#FFFFFF', border: 'rgba(27,33,64,0.10)', ctrl: '#FFFFFF', ctrlBorder: 'rgba(27,33,64,0.12)',
    accent: '#237873', dashed: 'rgba(111,214,207,0.60)',
    // Dusk keeps the Nightlight tile fills and swaps only the icon to the deep variant.
    tones: [['Glow', '#237873', '111,214,207'], ['Dawn', '#A8621F', '242,184,128'], ['Dusk', '#6353C9', '179,167,245'], ['Bloom', '#B24B6B', '238,151,174']],
    hounaGlow: '111,214,207',
  },
};

/* ── Rendering ── */

const svg = (inner, size = 24, sw = 1.6) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

function board(T) {
  const label = (text, color = T.ter) => `<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${color}">${text}</span>`;
  const cell = (icon, name, note, { suggested = false } = {}) => `<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
<span style="width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: ${T.ctrl}; border: 1px ${suggested ? 'dashed' : 'solid'} ${suggested ? T.dashed : T.ctrlBorder}; color: ${T.text}">${icon}</span>
<span style="max-width: 100%; overflow-wrap: anywhere; font-size: 12.5px; font-weight: 600; line-height: 1.25; color: ${T.text}">${name}</span>
${note ? `<span style="font-size: 11.5px; line-height: 1.3; color: ${T.ter}">${note}</span>` : ''}
</div>`;
  const grid = (cells) => `<div style="display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 20px 12px">\n${cells.join('\n')}\n</div>`;
  const section = (eyebrow, title, desc, body) => `<section style="display: flex; flex-direction: column; gap: 20px; padding: 28px; border-radius: 24px; background: ${T.card}; border: 1px solid ${T.border}">
<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 24px">
<div style="display: flex; flex-direction: column; gap: 6px">
${label(eyebrow, T.accent)}
<h2 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 28px; line-height: 1.15; color: ${T.text}">${title}</h2>
</div>
<p style="margin: 0; max-width: 440px; font-size: 14px; line-height: 1.5; text-align: end; color: ${T.sec}">${desc}</p>
</div>
${body}
</section>`;

  const canvasCells = CANVAS_ICONS.map(([k, note]) => cell(svg(CANVAS[k].svg), k, note));
  const inApp = IN_APP.map(([group, items]) => `<div style="display: flex; flex-direction: column; gap: 14px">
${label(group.toUpperCase())}
${grid(items.map(([f, n, note]) => cell(svg(lucide(f), 24, 1.7), n, note)))}
</div>`).join('\n');
  const suggested = SUGGESTED.map(([group, why, items]) => `<div style="display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; align-items: baseline; gap: 12px">${label(group.toUpperCase())}<span style="font-size: 12.5px; color: ${T.ter}">${why}</span></div>
${grid(items.map(([f, note]) => cell(svg(lucide(f), 24, 1.7), f.replace(/(^|-)(\w)/g, (m, d, c) => c.toUpperCase()), note, { suggested: true })))}
</div>`).join('\n');

  const tileIcons = [['users', 'Professionals'], ['heart-pulse', 'Wellness'], ['book-open', 'Articles'], ['headphones', 'Podcasts'], ['calendar', 'Events']];
  const tones = T.tones.map(([name, fg, rgb]) => `<div style="display: flex; flex-direction: column; gap: 12px">
${label(name.toUpperCase())}
<div style="display: flex; gap: 10px">
${tileIcons.map(([f, n]) => `<span title="${n}" style="width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: rgba(${rgb},0.12); border: 1px solid rgba(${rgb},0.28); color: ${fg}">${svg(lucide(f), 24, 1.6)}</span>`).join('\n')}
</div>
</div>`).join('\n');

  const social = SOCIAL.map((s) => `<span style="display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px; border-radius: 999px; background: ${T.ctrl}; border: 1px solid ${T.ctrlBorder}; color: ${T.text}; font-size: 13.5px">${SOCIAL_LUCIDE[s] ? svg(lucide(SOCIAL_LUCIDE[s]), 18, 1.7) : ''}${s}</span>`).join('\n');
  const topics = TOPICS.map((t) => `<span style="display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 12px; background: rgba(${T.hounaGlow},0.10); border: 1px solid rgba(${T.hounaGlow},0.26); color: ${T.text}; font-size: 13px">${t.replace(/-/g, ' ')}</span>`).join('\n');

  const inAppCount = IN_APP.reduce((n, [, items]) => n + items.length, 0);
  const suggestedCount = SUGGESTED.reduce((n, [, , items]) => n + items.length, 0);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${T.title}</title>
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
<div style="width: 1280px; box-sizing: border-box; padding: 64px; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif; color: ${T.text}; display: flex; flex-direction: column; gap: 32px">

<div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 12px">
${label('HOUNA · ICONS', T.accent)}
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${T.text}">Icon library</h1>
<p style="margin: 0; max-width: 700px; font-size: 17px; line-height: 1.5; color: ${T.sec}">Every icon the app draws today, and the ones worth adding. One family throughout: 24px, round caps and joins, a 1.6–1.7 stroke, in the text colour, or in a tone inside a tile. Directional glyphs mirror in Arabic.</p>
</div>
<div style="display: flex; gap: 24px">
<div style="display: flex; align-items: center; gap: 10px"><span style="width: 28px; height: 28px; border-radius: 9px; background: ${T.ctrl}; border: 1px solid ${T.ctrlBorder}"></span><span style="font-size: 13px; color: ${T.sec}">In the app (${CANVAS_ICONS.length + inAppCount})</span></div>
<div style="display: flex; align-items: center; gap: 10px"><span style="width: 28px; height: 28px; border-radius: 9px; background: ${T.ctrl}; border: 1px dashed ${T.dashed}"></span><span style="font-size: 13px; color: ${T.sec}">Suggested (${suggestedCount})</span></div>
</div>
</div>

${section('CANVAS GLYPHS', 'Drawn from the canvas', 'The tab bar and core controls. Their exact paths live in <code>components/ui/CanvasIcon.tsx</code>; add a new one by copying it from a board.', grid(canvasCells))}

${section('LUCIDE · IN USE', 'The rest of the set', 'From Lucide (lucide-react-native), grouped by where they appear.', `<div style="display: flex; flex-direction: column; gap: 28px">\n${inApp}\n</div>`)}

${section('ICON TILES', 'Tones', 'An icon in a tile: the tone at 12% for the fill and 28% for the border, with the icon in the tone itself.', `<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px">\n${tones}\n</div>`)}

${section('SUGGESTED', 'Worth adding', 'Also from Lucide, so they match what’s already there. Each has a feature waiting for it.', `<div style="display: flex; flex-direction: column; gap: 28px">\n${suggested}\n</div>`)}

${section('BRAND & MOTION', 'Social marks and topic animations', 'Social links use the platforms’ own marks (Font Awesome 6 Brands), in one colour. Shown with Lucide’s version where one exists. Directory topics play a small Lottie animation each, with Brain as the fallback.', `<div style="display: flex; flex-direction: column; gap: 14px">
${label('SOCIAL LINKS')}
<div style="display: flex; flex-wrap: wrap; gap: 8px">
${social}
</div>
${label('ANIMATED TOPICS (' + TOPICS.length + ')')}
<div style="display: flex; flex-wrap: wrap; gap: 8px">
${topics}
</div>
</div>`)}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1280,"height":3944}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
}

for (const T of Object.values(THEMES)) fs.writeFileSync(P + T.file, board(T));
console.log('canvas glyphs', Object.keys(CANVAS).length, '| topics', TOPICS.length);
