// Static previews of MoonPhases.dc.html at several day offsets: runs the board's renderVals with a
// stub DCLogic and fills the holes, into the app's public/zz-moon-<offset>.html (delete public/ afterwards).
const fs = require('fs');
const P = __dirname + '/../project/MoonPhases.dc.html';
const src = fs.readFileSync(P, 'utf8');
const script = src.match(/data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];
const body = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1].replace(/<\/?helmet>/g, '');
const Component = new Function('DCLogic', script + '\nreturn Component;')(class { constructor(p) { this.props = p; } setState() {} });
fs.mkdirSync(__dirname + '/../../../public', { recursive: true });
for (const offset of process.argv.slice(2).map(Number)) {
  const c = new Component({});
  c.state = { offset };
  const vals = c.renderVals();
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${body.replace(/\{\{(\w+)\}\}/g, (_, k) => (typeof vals[k] === 'function' ? '' : String(vals[k])))}</body></html>`;
  fs.writeFileSync(`${__dirname}/../../../public/zz-moon-${offset}.html`, html);
  console.log(offset, vals.phaseName, vals.pct + '%', vals.dateLabel, 'full in', vals.toFull, 'new in', vals.toNew);
}
