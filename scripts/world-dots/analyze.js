// Step 1 of 2 for constants/worldDots.ts (then run generate.js).
// Land mask from the "isolated world map" art (white land on blue-grey),
// then connected components so continents' extremes can be matched to
// real coordinates to recover the projection. Input: work/land.png — the
// Freepik "Isolated world map minimal style" JPG (7001×4001) downscaled to
// 2800px wide (jimp can't decode the full-size JPG).
const Jimp = require('jimp-compact');
// Working folder holding land.png (the source art downscaled to 2800px wide; not
// committed — Freepik's license forbids redistributing it). Mask files land here too.
const path = require('path');
const dir = path.resolve(process.env.WORLD_DOTS_WORKDIR || path.join(__dirname, 'work')) + path.sep;

(async () => {
  const img = await Jimp.read(dir + 'land.png');
  const { width: W, height: H, data } = img.bitmap;
  const land = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    land[i] = r > 240 && g > 240 && b > 240 ? 1 : 0;
  }
  // sample background colour
  console.log('bg sample', data[0], data[1], data[2]);
  const label = new Int32Array(W * H);
  const comps = [];
  let next = 1;
  const stack = [];
  for (let s = 0; s < W * H; s++) {
    if (!land[s] || label[s]) continue;
    let area = 0, x0 = W, x1 = 0, y0 = H, y1 = 0;
    stack.push(s); label[s] = next;
    while (stack.length) {
      const p = stack.pop();
      const x = p % W, y = (p / W) | 0;
      area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      for (const q of [p - 1, p + 1, p - W, p + W]) {
        if (q >= 0 && q < W * H && land[q] && !label[q] && Math.abs((q % W) - x) <= 1) {
          label[q] = next; stack.push(q);
        }
      }
    }
    comps.push({ id: next, area, x0, x1, y0, y1 });
    next++;
  }
  comps.sort((a, b) => b.area - a.area);
  console.log('image', W, H, 'components', comps.length);
  for (const c of comps.slice(0, 14)) console.log(JSON.stringify(c));
  require('fs').writeFileSync(dir + 'mask.json', JSON.stringify({ W, H }));
  require('fs').writeFileSync(dir + 'mask.bin', Buffer.from(land));
})();
