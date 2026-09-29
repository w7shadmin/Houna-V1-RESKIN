// Builds mena-crisis-lines.html (the reviewable directory) from data.json and template.html:
//   node research/crisis-lines/build.js
// Publish the result to the same artifact (see README) after changing the data.
const fs = require('fs');
const path = require('path');
const here = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(here, 'data.json'), 'utf8'));
const kinds = new Set(data.kinds);
let n = 0;
for (const c of data.countries) {
  for (const l of c.lines) {
    n++;
    if (!kinds.has(l.kind) || !'VLU'.includes(l.conf) || !l.nums.length || !l.src.length) throw new Error(`${c.code} ${l.name}`);
  }
}
const script = `window.COUNTRIES = ${JSON.stringify(data.countries)};`;
const tpl = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
fs.writeFileSync(path.join(here, 'mena-crisis-lines.html'), tpl.replace('/*DATA*/', () => script));
console.log(`${data.countries.length} countries, ${n} lines`);
