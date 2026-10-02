const fs = require('fs');
const dir = __dirname + '/../project/';

const MOODS = [
  ['angry', 'Angry', 'غاضب', '#E36F5E', '#FFE1DA', 'rgba(227,111,94,0.42)', 38, 76, 0.4],
  ['anxious', 'Anxious', 'قلق', '#F0B27A', '#FFEEDC', 'rgba(240,178,122,0.42)', 24, 72, 0.48],
  ['sad', 'Sad', 'حزين', '#82A4EE', '#E2EBFF', 'rgba(130,164,238,0.42)', 12, 78, 0.55],
  ['neutral', 'Neutral', 'محايد', '#D2CBB9', '#FFFFFF', 'rgba(210,203,185,0.34)', -6, 66, 0.7],
  ['calm', 'Calm', 'هادئ', '#62D2C9', '#E4FBF7', 'rgba(98,210,201,0.48)', -18, 63, 0.85],
  ['hopeful', 'Hopeful', 'متفائل', '#9BD67E', '#EEF9E4', 'rgba(155,214,126,0.44)', -26, 60, 0.95],
  ['joyful', 'Joyful', 'مبتهج', '#F2C76B', '#FFF3D6', 'rgba(242,199,107,0.46)', -34, 57, 1],
];
const line = (withAr) => ([id, label, ar, c, hi, glow, fold, hy, ringO], i, all) =>
  `  { id: '${id}', label: '${label}', ${withAr ? `ar: '${ar}', ` : ''}c: '${c}', hi: '${hi}', glow: '${glow}', fold: ${fold}, hy: ${hy}, ringO: ${ringO} }${i < all.length - 1 ? ',' : ''}`;
const blooms = (withAr) => `const BLOOMS = [\n${MOODS.map(line(withAr)).join('\n')}\n];`;

function edit(file, withAr, pairs) {
  let s = fs.readFileSync(dir + file, 'utf8');
  const a = s.indexOf('const BLOOMS = [');
  const b = s.indexOf('];', a) + 2;
  if (a < 0) throw new Error('no BLOOMS in ' + file);
  s = s.slice(0, a) + blooms(withAr) + s.slice(b);
  for (const [from, to] of pairs) {
    if (!s.includes(from)) throw new Error(`miss in ${file}: ${from}`);
    s = s.split(from).join(to);
  }
  fs.writeFileSync(dir + file, s);
}
for (const f of ['MoodStates.dc.html', 'MoodStatesDay.dc.html']) {
  edit(f, true, [
    ['repeat(8, minmax(0, 1fr))', 'repeat(7, minmax(0, 1fr))'],
    ['hint-placeholder-count="8"', 'hint-placeholder-count="7"'],
    ['STEP {{b.step}} OF 8', 'STEP {{b.step}} OF 7'],
  ]);
}
for (const f of ['CheckIn.dc.html', 'CheckInDay.dc.html']) {
  edit(f, false, [
    ['min="1" max="8"', 'min="1" max="7"'],
    ['hint-placeholder-count="8"', 'hint-placeholder-count="7"'],
    ['this.state = { v: 7 };', 'this.state = { v: 5 };'],
  ]);
}
console.log('ok');
