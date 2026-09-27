// Builds every board, then lays them out on the canvas: the intro on top, then one titled row per
// section, and checks nothing overlaps. Run: node design/explorations/scripts/make-layout.js
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, '..', 'project');

const intro = require('./make-intro.js');
const SECTIONS = [
  ['titleMeditate', 'A · Meditation player', require('./make-meditate.js')],
  ['titleBreathe', 'B · Breathing player', require('./make-breathe.js')],
  ['titleBodies', 'C · Suns and moons', require('./make-bodies.js')],
  ['titleGraphs', 'D · Graphs', require('./make-graphs.js')],
  ['titleAccount', 'E · Account, badges and progress', require('./make-account.js')],
  ['titleMotion', 'F · Motion and overlays', require('./make-motion.js')],
  ['titleFirst', 'G · First run', require('./make-firstrun.js')],
];

// Keep what's already on the live canvas (its createdOnFiles, any notes the user added).
const indexPath = path.join(OUT, 'canvas.json');
const prev = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : null;
const index = prev || { v: 3, createdOnFiles: { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, 'Z') }, title: 'Houna Explorations', launch: { view: 'canvas' }, pages: [], notes: {}, designSystems: [] };
index.boards = {};
index.order = [];

const add = (b, x, y) => {
  index.boards[b.file] = { x, y, w: b.w, h: b.h, title: b.title, ...(b.interactive ? { is_interactive: true } : {}) };
  index.order.push(b.file);
};
add(intro[0], 0, 0);
let y = intro[0].h + 120 + 260;
for (const [id, title, boards] of SECTIONS) {
  let x = 0;
  for (const b of boards) { add(b, x, y); x += b.w + 80; }
  index.notes[id] = { kind: 'title1', x: 0, y: y - 260, text: title, maxW: x - 80 };
  y += 844 + 120 + 260;
}

const B = Object.entries(index.boards);
for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
  const [a, p] = B[i], [c, q] = B[j];
  if (p.x < q.x + q.w && q.x < p.x + p.w && p.y < q.y + q.h && q.y < p.y + p.h) console.log('OVERLAP', a, c);
}
const onDisk = fs.readdirSync(OUT).filter((f) => f.endsWith('.dc.html'));
const stray = onDisk.filter((f) => !index.boards[f]);
if (stray.length) console.log('Not on the canvas:', stray.join(', '));
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
const big = onDisk.map((f) => [f, fs.statSync(path.join(OUT, f)).size]).sort((a, b) => b[1] - a[1])[0];
console.log(`${index.order.length} boards, largest ${big[0]} ${(big[1] / 1024).toFixed(0)} KB`);
