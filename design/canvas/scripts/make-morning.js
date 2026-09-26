// Generates the Morning row from the Dusk (Day) boards by mapping every colour onto the original Houna palette.
const fs = require('fs');
const P = __dirname + '/../project/';

const INK_TEXT = '#1D2B2A';   // Charcoal — body text
const ACTION = '#196662';     // Dark Turquoise — primary actions
const GROUND = '#F2F6F4';     // Mist
const ON_ACTION = '#FFFFFF';
// Peach and Light Cyan from the brand PDF, deepened only as far as icons need (3:1 on their tinted
// tiles), in the hue of the first app's Events icon and of Light Cyan itself. Small text in those
// colours takes a deeper step of the same hue, to stay readable (4.5:1).
const CORAL = '#E8582C', CORAL_TEXT = '#BF4729';
const SKY = '#0A91BB', SKY_TEXT = '#08799B';

// Plain one-to-one swaps (case-insensitive hex).
const SIMPLE = {
  '#FBF8F2': '#FAFCFB',
  '#4A5078': '#58595B', '#646A8E': '#6D6F72',
  '#237873': '#196662',
  '#6FD6CF': '#5CC2BE', '#2E8F8A': '#196662', '#D9FAF6': '#DDF5F3', '#A8EDE8': '#A6E3E0',
  '#A8621F': CORAL, '#F2B880': '#F9A980', '#FFF1E0': '#FFF1EA', '#B9713A': CORAL,
  '#6353C9': SKY, '#B3A7F5': '#20C4F4', '#EEEAFF': '#E4F6FD', '#6A5CC4': SKY,
  '#86A9F0': '#5FB08E', '#E3ECFF': '#E8F4F0', '#3D5DB0': '#1C7454',
  '#EE97AE': '#F37B83', '#FFE6EE': '#FFE7EA', '#B24B6B': '#C2475A',
  '#A9ADC4': '#BCBEC0', '#CBC7BD': '#C9CDCB', '#EEF3F1': '#E6F2EF', '#CFF6F2': '#D8F2EF',
};
const RGBA = {
  '27,33,64': '29,43,42',
  '245,241,232': '242,246,244',
  '111,214,207': '59,170,167',
  '242,184,128': '249,169,128',
  '179,167,245': '32,196,244',
  '134,169,240': '95,176,142',
  '238,151,174': '243,123,131',
};

function mapInk(src) {
  // Action contexts: backgrounds, borders, and JS on/bg/border/c values.
  return src
    .replace(/(aria-current="page" style="[^"]*?color: )#1B2140/g, `$1${ACTION}`)
    .replace(/(border-bottom: 2px solid )#1B2140/g, `$1${ACTION}`)
    .replace(/(background(?:-color)?\s*:\s*)#1B2140/gi, `$1${ACTION}`)
    .replace(/(border[a-z-]*\s*:\s*[^;"]*?)#1B2140/gi, `$1${ACTION}`)
    .replace(/((?:\bon|\bbg|\bborder|\bc)\s*[:=]\s*(?:[^,'"]*\?\s*)?)'#1B2140'/g, `$1'${ACTION}'`)
    .replace(/#1B2140/gi, INK_TEXT);
}
function mapGround(src) {
  return src
    .replace(/((?:^|[^-\w])color\s*:\s*)#F5F1E8/gi, `$1${ON_ACTION}`)
    .replace(/((?:\bink|\bfg)\s*[:=]\s*(?:[^,'"]*\?\s*)?)'#F5F1E8'/g, `$1'${ON_ACTION}'`)
    .replace(/#F5F1E8/gi, GROUND);
}

function morning(src) {
  // Text set in the Dusk accents (labels, links) → the text steps; icons, fills and tones use the icon steps below.
  src = src.replace(/(color:\s*)#A8621F(?=[^">]*">(?!<svg))/gi, `$1${CORAL_TEXT}`)
    .replace(/(color:\s*)#6353C9(?=[^">]*">(?!<svg))/gi, `$1${SKY_TEXT}`);
  let out = mapInk(src);
  out = mapGround(out);
  for (const [a, b] of Object.entries(SIMPLE)) out = out.replace(new RegExp(a, 'gi'), b);
  out = out.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,/g, (m, r, g, b) => {
    const k = `${r},${g},${b}`;
    return RGBA[k] ? `rgba(${RGBA[k]},` : m;
  });
  out = out.replace('a:hover{color:#A6E3E0}', 'a:hover{color:#3BAAA7}');
  out = out.replace(/([A-Za-z]+)Day\.dc\.html/g, '$1Morning.dc.html');
  out = out.replace(/\(Day\)/g, '(Morning)');
  return out;
}

module.exports = { morning };
if (require.main === module) {
const files = fs.readdirSync(P).filter((f) => /Day\.dc\.html$/.test(f));
const leftovers = new Map();
for (const f of files) {
  const out = morning(fs.readFileSync(P + f, 'utf8'));
  fs.writeFileSync(P + f.replace('Day.dc.html', 'Morning.dc.html'), out);
  for (const h of out.match(/#[0-9A-Fa-f]{6}\b/g) || []) leftovers.set(h.toUpperCase(), (leftovers.get(h.toUpperCase()) || 0) + 1);
}
console.log('wrote', files.length);
console.log([...leftovers].sort((a, b) => b[1] - a[1]).map(([h, n]) => `${h}×${n}`).join('  '));
}
