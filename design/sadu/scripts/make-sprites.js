// Pixel sprites for the Sadu canvas's pixel-art rows: the real outlines (the Houna mark, the wordmark,
// Kuwait Towers, Liberation Tower, a boom, a fish, a camel, the map) sampled cell by cell in headless
// Chrome, so the pixel versions keep their true shapes. Writes sprites.json beside this file.
// Run: node make-sprites.js > steps.json, then the scratchpad cdp.mjs on it, saving its eval output.
const K = require('../../explorations/scripts/kit.js');
const S = require('./sadu-kit.js');
const MAP = require('../../canvas/scripts/map-data.json');
const svg = (w, h, inner, vb = `0 0 ${w} ${h}`) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${inner}</svg>`;
const markSvg = (n) => K.mark(n * 8, '#000').replace(/style="[^"]*"/, '').replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
const logoSvg = (w) => K.logo('#000', '#000', w * 8).replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(/style="[^"]*"/, '');
const list = {
  mark11: { cw: 11, ch: 11, svg: markSvg(11) },
  mark13: { cw: 13, ch: 13, svg: markSvg(13) },
  mark17: { cw: 17, ch: 17, svg: markSvg(17) },
  mark23: { cw: 23, ch: 23, svg: markSvg(23) },
  logo40: { cw: 40, ch: 19, svg: logoSvg(40) },
  towers: { cw: 40, ch: 64, svg: svg(320, 512, S.kuwaitTowers(170, 512, 480, { fill: '#000' })) },
  towersSmall: { cw: 22, ch: 34, svg: svg(176, 272, S.kuwaitTowers(94, 272, 256, { fill: '#000' })) },
  towersTiny: { cw: 13, ch: 16, svg: svg(104, 128, S.kuwaitTowers(56, 128, 124, { fill: '#000' })) },
  liberation: { cw: 10, ch: 70, svg: svg(80, 560, S.liberationTower(40, 560, 550, '#000')) },
  dhow: { cw: 26, ch: 22, svg: svg(208, 176, S.dhow(0, 172, 208, '#000', '#000')) },
  fish: { cw: 12, ch: 7, svg: svg(96, 56, S.fish(0, 28, 96, '#000')) },
  camel: { cw: 12, ch: 10, svg: svg(96, 80, S.camel(0, 78, 94, '#000')) },
  map: { cw: 62, ch: 31, svg: svg(496, 248, `<path d="${MAP.path}" fill="#000" fill-rule="evenodd"></path>`, `0 0 ${MAP.width} ${MAP.height}`) },
};
const expr = `(async () => {
  const L = ${JSON.stringify(list)};
  const out = {};
  for (const [k, s] of Object.entries(L)) {
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.svg);
    await img.decode();
    const c = document.createElement('canvas'); c.width = s.cw * 8; c.height = s.ch * 8;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const rows = [];
    for (let y = 0; y < s.ch; y++) { let r = ''; for (let x = 0; x < s.cw; x++) { let a = 0; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) a += d[((y * 8 + j) * c.width + x * 8 + i) * 4 + 3]; r += a / 64 / 255 > 0.42 ? '#' : '.'; } rows.push(r); }
    out[k] = rows;
  }
  return JSON.stringify(out);
})()`;
console.log(JSON.stringify([{ nav: 'about:blank' }, { eval: expr }]));
