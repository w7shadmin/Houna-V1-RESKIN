// The 8-point grid audit (CLAUDE.md "8-point grid"): lists every padding, margin and gap written as
// a number in app/ and components/ that isn't a multiple of 8, 4 or 12, and every grid(n) that
// doesn't land on one. `--fix` snaps each to the nearest allowed value (a tie goes to the smaller,
// which keeps layouts from growing, except a 2 or 3, which opens to 4). Sizes, radii, fonts, borders and positions aren't checked:
// the grid is for spacing. A line ending in `// grid-ok` is skipped (an optical offset kept on purpose).
//   node scripts/grid-audit.js [--fix]
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = ['app', 'components', 'hooks'];
const fix = process.argv.includes('--fix');

const allowed = (v) => {
  const a = Math.abs(v);
  return a === 0 || a === 4 || a === 12 || a % 8 === 0;
};
const snap = (v) => {
  if (allowed(v)) return v;
  const a = Math.abs(v);
  const options = [4, 12, ...Array.from({ length: 40 }, (_, k) => k * 8)].sort((x, y) => x - y);
  let best = options[0];
  for (const o of options) if (Math.abs(o - a) < Math.abs(best - a)) best = o;
  // A 2 or 3 between lines of text opens to 4 rather than closing to nothing.
  if (a > 1 && a < 4) best = 4;
  return Math.sign(v) * best;
};

const SPACING = /\b(padding|margin)(Top|Bottom|Left|Right|Horizontal|Vertical|Start|End|Block|Inline)?\s*:\s*(-?\d+(?:\.\d+)?)(?=\s*[,}\n])/g;
const GAPS = /\b(gap|rowGap|columnGap)\s*:\s*(\d+(?:\.\d+)?)(?=\s*[,}\n])/g;
// grid(n) only where it's spacing: sizes (icons, controls, radii, the tab bar's rows) may sit between.
const GRID = /\b((?:padding|margin)(?:Top|Bottom|Left|Right|Horizontal|Vertical|Start|End)?|gap|rowGap|columnGap)\s*:\s*grid\((\d+(?:\.\d+)?)\)/g;

const files = [];
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|js)$/.test(e.name) && !/\.test\./.test(e.name)) files.push(p);
  }
};
DIRS.forEach((d) => walk(path.join(ROOT, d)));

let total = 0;
const report = [];
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  let changed = false;
  lines.forEach((line, i) => {
    if (/grid-ok/.test(line)) return;
    let next = line.replace(SPACING, (m, kind, side, n) => {
      const v = Number(n);
      if (allowed(v)) return m;
      total++;
      const to = snap(v);
      report.push(`${path.relative(ROOT, file)}:${i + 1}  ${kind}${side || ''}: ${v} → ${to}`);
      return m.replace(n, String(to));
    });
    next = next.replace(GAPS, (m, kind, n) => {
      const v = Number(n);
      if (allowed(v)) return m;
      total++;
      const to = snap(v);
      report.push(`${path.relative(ROOT, file)}:${i + 1}  ${kind}: ${v} → ${to}`);
      return m.replace(n, String(to));
    });
    next = next.replace(GRID, (m, key, n) => {
      const v = Number(n) * 8;
      if (allowed(v)) return m;
      total++;
      const to = snap(v) / 8;
      report.push(`${path.relative(ROOT, file)}:${i + 1}  grid(${n}) = ${v} → grid(${to})`);
      return m.replace(`grid(${n})`, `grid(${to})`);
    });
    if (next !== line) {
      lines[i] = next;
      changed = true;
    }
  });
  if (fix && changed) fs.writeFileSync(file, lines.join('\n'));
}
console.log(report.join('\n'));
console.log(`\n${total} off the grid${fix ? ', snapped' : ''}.`);
