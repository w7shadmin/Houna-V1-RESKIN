const fs = require('fs');
const dir = __dirname + '/../project/';
function edit(file, pairs) {
  let s = fs.readFileSync(dir + file, 'utf8');
  for (const [from, to] of pairs) {
    if (!s.includes(from)) throw new Error(`miss in ${file}: ${from.slice(0, 80)}`);
    s = s.split(from).join(to);
  }
  fs.writeFileSync(dir + file, s);
}
const ANGRY = "  { id: 'angry', label: 'Angry', AR c: '#E36F5E', hi: '#FFE1DA', glow: 'rgba(227,111,94,0.42)', fold: 38, hy: 76, ringO: 0.4 },\n";
const JOYFUL = ",\n  { id: 'joyful', label: 'Joyful', AR c: '#F2C76B', hi: '#FFF3D6', glow: 'rgba(242,199,107,0.46)', fold: -32, hy: 58, ringO: 1 }\n];";
const bloomPairs = (withAr) => [
  ['const BLOOMS = [\n', 'const BLOOMS = [\n' + ANGRY.replace('AR ', withAr ? "ar: 'غاضب', " : '')],
  ["ringO: 0.9 }\n];", 'ringO: 0.9 }' + JOYFUL.replace('AR ', withAr ? "ar: 'مبتهج', " : '')],
];
for (const f of ['MoodStates.dc.html', 'MoodStatesDay.dc.html']) {
  edit(f, [
    ...bloomPairs(true),
    ['grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 16px', 'grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 12px'],
    ['hint-placeholder-count="6"', 'hint-placeholder-count="8"'],
    ['gap: 12px; padding: 20px 10px 22px; border-radius: 24px', 'gap: 10px; padding: 18px 6px 20px; border-radius: 22px'],
    ['width: 150px; height: 150px; display: flex', 'width: 120px; height: 120px; display: flex'],
    ['width: 150px; height: 150px; border-radius: 999px', 'width: 120px; height: 120px; border-radius: 999px'],
    ['<svg class="breathe" width="120" height="120"', '<svg class="breathe" width="100" height="100"'],
    ["font-family: 'Marcellus', serif; font-size: 22px", "font-family: 'Marcellus', serif; font-size: 18px; text-align: center"],
    ["font-weight: 700; font-size: 20px", "font-weight: 700; font-size: 18px"],
    ['STEP {{b.step}} OF 6', 'STEP {{b.step}} OF 8'],
  ]);
}
for (const f of ['CheckIn.dc.html', 'CheckInDay.dc.html']) {
  edit(f, [
    ...bloomPairs(false),
    ['min="1" max="6"', 'min="1" max="8"'],
    ['hint-placeholder-count="6"', 'hint-placeholder-count="8"'],
    ['this.state = { v: 6 };', 'this.state = { v: 7 };'],
  ]);
}
console.log('ok');
