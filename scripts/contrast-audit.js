// WCAG 2.1 contrast of every theme's text and icon tokens against its grounds, cards and tiles:
//   node scripts/contrast-audit.js          all pairs
//   node scripts/contrast-audit.js --fails  only those under 4.5:1 (text) or 3:1 (large text, icons)
// Tone 'fg' colours are icons and fills, which need 3:1; everything read as text needs 4.5:1.
// Sunrise's "mixed" and "turquoise" accents are client options that knowingly fall short.
const ts = require('typescript');
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'constants', 'theme.ts'), 'utf8');
const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 } }).outputText;
const m = { exports: {} }; new Function('module', 'exports', 'require', out)(m, m.exports, require);
const T = m.exports;
const parse = c => { if (c.startsWith('#')) { const n = parseInt(c.slice(1), 16); return [(n>>16)&255,(n>>8)&255,n&255,1]; } return c.slice(c.indexOf('(')+1,-1).split(',').map(Number).concat([1]).slice(0,4); };
const blend = (fg, bg) => { const [r,g,b,a] = parse(fg); const [R,G,B] = parse(bg); return [r*a+R*(1-a), g*a+G*(1-a), b*a+B*(1-a)]; };
const lum = ([r,g,b]) => { const f = v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
const ratio = (fg, bg, under) => { const B = under ? blend(bg, under) : parse(bg).slice(0,3); const bgHex = '#'+B.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''); const F = blend(fg, bgHex); const a = lum(F), b = lum(B); return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05); };
function report(name, c) {
  const surfaces = { background: [c.background], card: [c.card, c.background], surface: [c.surface] };
  const fgs = { text: c.text, textSecondary: c.textSecondary, textTertiary: c.textTertiary, placeholder: c.placeholder, primary: c.primary, accent: c.accent, danger: c.danger, tabBarInactive: c.tabBarInactive, tabBarActive: c.tabBarActive };
  for (const k of Object.keys(c.tones)) { fgs[`tones.${k}.text`] = c.tones[k].text; fgs[`tones.${k}.fg`] = c.tones[k].fg; }
  const rows = [];
  for (const [fk, fv] of Object.entries(fgs)) for (const [sk, [sv, under]] of Object.entries(surfaces)) {
    if (fk.startsWith('tabBar') && sk !== 'background') continue;
    const r = ratio(fv, sv, under); rows.push([`${fk} on ${sk}`, r]);
  }
  for (const k of Object.keys(c.tones)) rows.push([`tones.${k}.text on tone bg tile (over card)`, ratio(c.tones[k].text, c.tones[k].bg, flat(c.card, c.background))]);
  rows.push(['onAction on action (primary button)', ratio(c.onAction, c.action)]);
  rows.push(['onPrimary on primary', ratio(c.onPrimary, c.primary)]);
  rows.push(['onAccent on accent', ratio(c.onAccent, c.accent)]);
  rows.push(['onDanger on danger', ratio(c.onDanger, c.danger)]);
  rows.push(['onTabBarRaised on tabBarRaised', ratio(c.onTabBarRaised, c.tabBarRaised)]);
  rows.push(['text on control (secondary btn, over bg)', ratio(c.text, c.control, c.background)]);
  rows.push(['tabBarInactive on tabBarBackground', ratio(c.tabBarInactive, c.tabBarBackground)]);
  rows.push(['tabBarActive on tabBarBackground', ratio(c.tabBarActive, c.tabBarBackground)]);
  rows.push(['text on sheet', ratio(c.text, c.sheet)]);
  rows.push(['textSecondary on sheet', ratio(c.textSecondary, c.sheet)]);
  console.log(`\n=== ${name} ===`);
  const failsOnly = process.argv.includes('--fails');
  for (const [p, r] of rows) if (!failsOnly || r < 4.5) console.log(`${p.padEnd(48)} ${r.toFixed(2).padStart(6)}  ${r>=4.5?'AA':r>=3?'AA-large only':'FAIL'}`);
}
function flat(c, bg){ const B = blend(c,bg); return '#'+B.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''); }
report('Night', T.nightColors); report('Dusk (day)', T.dayColors);
for (const k of Object.keys(T.sunriseAccentColors)) report('Sunrise/'+k, T.sunriseAccentColors[k]);
