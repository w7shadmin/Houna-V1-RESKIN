// Hand edits on top of the generated Morning row: the system sheet's heading, palette and first-app tile tones.
const fs = require('fs');
const P = __dirname + '/../project/';
const f = P + 'SystemMorning.dc.html';
let s = fs.readFileSync(f, 'utf8');
const swap = (a, b) => { if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 60)); s = s.replace(a, b); };

swap('<title>Nightlight design system (Morning)</title>', '<title>Morning design system</title>');
s = s.replace(/>(Daylight|Dusk)<\/h1>/, '>Morning</h1>');
swap(/The same steady light (by day|at dusk)[^<]*<em/.exec(s)[0],
  'Houna\u2019s original colours, rebalanced for the new screens \u2014 mist and paper, Houna turquoise, and the peach, raspberry and sky of the brand, warmed by the tones of the first app\u2019s icons. <em');
swap(/<\/em> still at the center\./.exec(s)[0], '</em> still at the center.');

// Palette with names and roles.
s = s.replace(/const swatches = \[[\s\S]*?\];/, `const swatches = [
      { name: 'Mist', hex: '#F2F6F4', role: 'Ground \u2014 between Broken White and the first app\u2019s page' },
      { name: 'Paper', hex: '#FFFFFF', role: 'Cards, sheets, tab bar' },
      { name: 'Charcoal', hex: '#1D2B2A', role: 'Primary text \u2014 black, tinted toward teal' },
      { name: 'Dark Turquoise', hex: '#196662', role: 'Primary actions, active tab, accent text' },
      { name: 'Turquoise', hex: '#3BAAA7', role: 'Logo, glows, selected borders' },
      { name: 'Grey 80', hex: '#58595B', role: 'Secondary text' },
      { name: 'Stone', hex: '#6D6F72', role: 'Tertiary text, inactive icons' },
      { name: 'Coral', hex: '#E8582C', role: 'Peach, deepened for icons & warmth \u2014 text #BF4729' },
      { name: 'Sky', hex: '#0A91BB', role: 'Light Cyan, deepened for icons \u2014 text #08799B' }
    ];`);

// Second row of icon tiles: the first app's tones, deepened where needed so each icon holds 3:1 on its tile.
const tile = (bg, border, fg, svg, label) =>
  `<span title="${label}" style="width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; background: ${bg}; border: 1px solid ${border}; color: ${fg}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg></span>`;
const firstApp = [
  tile('#E8F4F0', 'rgba(28,116,84,0.22)', '#1C7454', '<circle cx="9" cy="8" r="3.5"></circle><path d="M2.5 20a6.5 6.5 0 0 1 13 0"></path><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 20a6.5 6.5 0 0 0-3-5.5"></path>', 'Fern \u2014 directory'),
  tile('#E8FAFA', 'rgba(12,140,140,0.22)', '#0C8C8C', '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"></path><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"></path>', 'Aqua \u2014 articles'),
  tile('#FFE4EF', 'rgba(214,58,130,0.22)', '#D63A82', '<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"></path>', 'Pink \u2014 podcasts'),
  tile('#FFF6DA', 'rgba(154,114,8,0.22)', '#9A7208', '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path>', 'Gold \u2014 links'),
].join('\n');
swap('<span style="margin-top: 10px; font-size: 13px; color: #6D6F72">Mood orbs</span>',
  `<span style="margin-top: 10px; font-size: 13px; color: #6D6F72">From the first Houna app</span>\n<div style="display: flex; gap: 12px">\n${firstApp}\n</div>\n<span style="margin-top: 10px; font-size: 13px; color: #6D6F72">Orb tones</span>`);
fs.writeFileSync(f, s);
console.log('SystemMorning done');
{
  let t = fs.readFileSync(f, 'utf8');
  t = t.replace('width: 1280px; height: 1180px;', 'width: 1280px; height: 1270px;').replace('"$preview":{"width":1280,"height":1180}', '"$preview":{"width":1280,"height":1270}');
  fs.writeFileSync(f, t);
  // The light Nightlight row is called Dusk in the app now.
  const d = P + 'SystemDay.dc.html';
  let u = fs.readFileSync(d, 'utf8');
  u = u.replace('>Daylight</h1>', '>Dusk</h1>').replace('The same steady light by day', 'The same steady light at dusk');
  fs.writeFileSync(d, u);
}
{
  // Morning offered as a fourth appearance, and chosen, on its own Profile board.
  const pf = P + 'ProfileMorning.dc.html';
  let p = fs.readFileSync(pf, 'utf8');
  p = p.replace("this.state = { theme: 'system' };", "this.state = { theme: 'morning' };")
    .replace("{ id: 'day', label: 'Day' }", "{ id: 'day', label: 'Dusk' },\n      { id: 'morning', label: 'Morning' }")
    .replace("{ id: 'day', label: 'Dusk' }\n", "{ id: 'day', label: 'Dusk' },\n      { id: 'morning', label: 'Morning' }\n");
  fs.writeFileSync(pf, p);
}
{
  // Four choices don't fit beside the label: stack them under it on this board.
  const pf = P + 'ProfileMorning.dc.html';
  let p = fs.readFileSync(pf, 'utf8');
  p = p.replace('<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 60px; padding: 0 16px; border-bottom: 1px solid rgba(29,43,42,0.08)">\n<span style="font-size: 15px; font-weight: 500; color: #1D2B2A">Appearance</span>',
    '<div style="display: flex; flex-direction: column; align-items: stretch; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(29,43,42,0.08)">\n<span style="font-size: 15px; font-weight: 500; color: #1D2B2A">Appearance</span>')
    .replace('<div role="radiogroup" aria-label="Appearance" style="display: flex; gap: 4px;', '<div role="radiogroup" aria-label="Appearance" style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px;')
    .replace('hint-placeholder-count="3">\n<button type="button" role="radio"', 'hint-placeholder-count="4">\n<button type="button" role="radio"');
  if (!p.includes('repeat(4, minmax(0, 1fr)); gap: 4px;')) throw new Error('appearance row not restyled');
  fs.writeFileSync(pf, p);
}

{
  // Tanafas tags are small text: they take the text step of their tone.
  const tf = P + 'TanafasMorning.dc.html';
  let t = fs.readFileSync(tf, 'utf8');
  t = t.replace('tagText: fg,', "tagText: ({ '#E8582C': '#BF4729', '#0A91BB': '#08799B' })[fg] || fg,");
  if (!t.includes("'#E8582C': '#BF4729'")) throw new Error('Tanafas tag text not patched');
  fs.writeFileSync(tf, t);
}
{
  // The row is Sunrise in the app: rename it on the canvas (file names stay *Morning.dc.html).
  for (const f of fs.readdirSync(P).filter((n) => /Morning\.dc\.html$/.test(n))) {
    let t = fs.readFileSync(P + f, 'utf8');
    t = t.replace(/\(Morning\)/g, '(Sunrise)').replace('<title>Morning design system</title>', '<title>Sunrise design system</title>').replace('>Morning</h1>', '>Sunrise</h1>');
    if (f === 'ProfileMorning.dc.html') {
      t = t.replace("{ id: 'system', label: 'System' },\n", '')
        .replace("this.state = { theme: 'morning' };", "this.state = { theme: 'sunrise' };")
        .replace(/\{ id: 'night', label: 'Night' \},\n\s*\{ id: 'day', label: 'Dusk' \},\n\s*\{ id: 'morning', label: 'Morning' \}/, "{ id: 'sunrise', label: 'Sunrise' },\n      { id: 'day', label: 'Dusk' },\n      { id: 'night', label: 'Night' }")
        .replace('grid-template-columns: repeat(4, minmax(0, 1fr))', 'grid-template-columns: repeat(3, minmax(0, 1fr))')
        .replace('hint-placeholder-count="4">\n<button type="button" role="radio"', 'hint-placeholder-count="3">\n<button type="button" role="radio"');
      if (!t.includes("{ id: 'sunrise', label: 'Sunrise' }")) throw new Error('profile options');
    }
    fs.writeFileSync(P + f, t);
  }
  // Night and Dusk Profile boards: the same three choices, in the same order.
  for (const f of ['Profile.dc.html', 'ProfileDay.dc.html']) {
    let t = fs.readFileSync(P + f, 'utf8');
    t = t.replace(/\{ id: 'system', label: 'System' \},\n\s*\{ id: 'night', label: 'Night' \},\n\s*\{ id: 'day', label: 'Dusk' \}/, "{ id: 'sunrise', label: 'Sunrise' },\n      { id: 'day', label: 'Dusk' },\n      { id: 'night', label: 'Night' }")
      .replace("this.state = { theme: 'system' };", `this.state = { theme: '${f === 'Profile.dc.html' ? 'night' : 'day'}' };`);
    fs.writeFileSync(P + f, t);
  }
}
{
  // Sunrise only: Home's mark opens the Houna sunrise, as Night's opens the starfield.
  for (const [f, label] of [['HomeMorning.dc.html', 'Breathe with the sunrise'], ['HomeArMorning.dc.html', 'تنفّس مع الشروق']]) {
    let t = fs.readFileSync(P + f, 'utf8');
    if (t.includes('href="Sunrise.dc.html"')) continue;
    // Generated from Dusk's Home, whose mark opens the Houna dusk: point it at the sunrise instead.
    t = t.replace(/<a href="DuskScene.dc.html" aria-label="[^"]*"/, `<a href="Sunrise.dc.html" aria-label="${label}"`);
    t = t.replace('<div aria-hidden="true" style="position: relative; width: 190px; height: 190px">',
      `<a href="Sunrise.dc.html" aria-label="${label}" style="display: block; position: relative; width: 190px; height: 190px">`);
    t = t.replace(/(<img src="[^"]+" alt="" style="position: absolute; left: 60px; top: 60px; width: 70px; height: 70px">)\n<\/div>/, '$1\n</a>');
    if (!t.includes('href="Sunrise.dc.html"') || !/height: 70px">\n<\/a>/.test(t)) throw new Error('sunrise link not placed in ' + f);
    fs.writeFileSync(P + f, t);
  }
}
