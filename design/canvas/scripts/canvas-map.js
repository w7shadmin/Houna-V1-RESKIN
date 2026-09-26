// Swap the canvas Home boards' capital-dot map for the app's Natural Earth land silhouette.
const fs = require('fs');
const path = require('path');
const S = __dirname;
const ROOT = path.join(S, 'artifact-files/6c340ced-e262-4594-a939-a62c32d71304/project');
const data = JSON.parse(fs.readFileSync(path.join(S, 'map-data.json'), 'utf8'));

const W = 318;
const K = W / data.width; // px per map unit
const H = +(data.height * K).toFixed(1);
const LAND = { night: 'rgba(242,236,221,0.14)', day: 'rgba(27,33,64,0.10)' };

for (const file of ['Main.dc.html', 'HomeDay.dc.html', 'HomeAr.dc.html', 'HomeArDay.dc.html']) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const day = file.includes('Day');

  // Markup: the 118px dot box → the land silhouette with lit markers over it.
  const boxRe = /<div aria-hidden="true"( dir="ltr")? style="position: relative; width: 318px; height: 118px; overflow: hidden">\n<sc-for list="\{\{map\}\}" as="m" hint-placeholder-count="197">\n<span [^\n]*<\/span>\n<\/sc-for>\n<\/div>/;
  if (!boxRe.test(s)) throw new Error('map markup not found in ' + file);
  s = s.replace(
    boxRe,
    (_, dir) =>
      `<div aria-hidden="true"${dir ?? ''} style="position: relative; width: ${W}px; height: ${H}px">\n` +
      `<svg width="${W}" height="${H}" viewBox="0 0 ${data.width} ${data.height}" style="position: absolute; top: 0; left: 0"><path d="${data.path}" fill="${day ? LAND.day : LAND.night}" fill-rule="evenodd"></path></svg>\n` +
      `<sc-for list="{{map}}" as="m" hint-placeholder-count="16">\n` +
      `<span style="position: absolute; left: {{m.x}}px; top: {{m.y}}px; width: 5px; height: 5px; border-radius: 999px; background: {{accent}}; box-shadow: 0 0 8px {{accent}}"></span>\n` +
      `</sc-for>\n</div>`,
  );

  // Script: capital dots → the app's snapped marker positions.
  const dotsRe = /const MAPDOTS = \[.*?\];\n/s;
  if (!dotsRe.test(s)) throw new Error('MAPDOTS not found in ' + file);
  s = s.replace(
    dotsRe,
    `// Lit countries on the land silhouette: the app's own positions (constants/worldDots.ts snapToLand), in its ${data.width} × ${data.height} frame.\n` +
      `const MARKERS = ${JSON.stringify(data.markers)};\nconst K = ${K};\n`,
  );
  const mapRe = /    const map = MAPDOTS\.map\(\(\[code, x, y\]\) => \{\n[\s\S]*?\n    \}\);\n/;
  if (!mapRe.test(s)) throw new Error('map computation not found in ' + file);
  s = s.replace(
    mapRe,
    `    const map = MARKERS.filter(([code]) => shown.includes(code)).map(([code, x, y]) => ({ x: (x * K - 2.5).toFixed(1), y: (y * K - 2.5).toFixed(1) }));\n`,
  );

  fs.writeFileSync(p, s);
  console.log(file, 'ok', s.length);
}
