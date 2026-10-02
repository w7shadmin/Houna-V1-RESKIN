// "Numbers": the figures that stand alone (Home's map count, Stats' streaks and ranks, Recap's big
// numbers) are in the display font today, Marcellus (Amiri in Arabic), whose 1 reads as an I. This
// board sets them side by side in four other faces, English and Arabic, on Night cards.
const fs = require('fs');
const P = __dirname + '/../project/';

const N = { ground: '#0B1026', card: 'rgba(242,236,221,0.045)', line: 'rgba(242,236,221,0.10)', text: '#F2ECDD', sec: '#B6BAD6', ter: '#8288AE', accent: '#6FD6CF' };
const OPTIONS = [
  { key: 'today', name: 'Today', note: 'Marcellus · Amiri Bold. The 1 reads as an I.', en: "font-family: 'Marcellus', serif; font-weight: 400", ar: "font-family: 'Amiri', serif; font-weight: 700" },
  { key: 'light', name: 'A · Figtree Light — chosen (English)', note: 'The body face, thin: as airy as Marcellus, figures all one width. Arabic: Plex Light.', en: "font-family: 'Figtree', sans-serif; font-weight: 300; font-variant-numeric: tabular-nums", ar: "font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 300" },
  { key: 'semi', name: 'B · Figtree SemiBold', note: 'The body face, strong: the numbers lead. Arabic: Plex SemiBold.', en: "font-family: 'Figtree', sans-serif; font-weight: 600; font-variant-numeric: tabular-nums", ar: "font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 600" },
  { key: 'mono', name: 'C · DM Mono', note: 'Matches the tracked labels above them. No Arabic digits of its own: Plex Medium.', en: "font-family: 'DM Mono', monospace; font-weight: 400; letter-spacing: -0.02em", ar: "font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 500" },
  { key: 'serif', name: 'D · DM Serif Display — its Arabic (Amiri) chosen', note: 'Keeps a serif beside the Marcellus titles, with a clear 1. Arabic: Amiri as today.', en: "font-family: 'DM Serif Display', serif; font-weight: 400", ar: "font-family: 'Amiri', serif; font-weight: 700" },
];

const mono = (t, color = N.ter) => `<span style="font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.14em; color: ${color}; white-space: nowrap">${t}</span>`;
const plexLabel = (t, color = N.ter) => `<span style="font-family: 'IBM Plex Sans Arabic', sans-serif; font-size: 13px; font-weight: 500; color: ${color}">${t}</span>`;
const card = (inner) => `<div style="background: ${N.card}; border: 1px solid ${N.line}; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 10px">${inner}</div>`;

const T = {
  en: { people: '1,204', peopleLine: 'people breathed and meditated with Houna this month', countries: 'IN 12 COUNTRIES', streakL: 'CURRENT STREAK', streak: '12', days: 'days', longestL: 'LONGEST', longest: '30', recapL: 'MINUTES BREATHING', recap: '47', unit: 'minutes', ranks: ['1', '2', '3'], names: ['noor', 'sami_07', 'you'] },
  ar: { people: '١٬٢٠٤', peopleLine: 'شخصًا تنفّسوا وتأملوا مع هُنا هذا الشهر', countries: 'في ١٢ دولة', streakL: 'السلسلة الحالية', streak: '١٢', days: 'يومًا', longestL: 'الأطول', longest: '٣٠', recapL: 'دقائق التنفس', recap: '٤٧', unit: 'دقيقة', ranks: ['١', '٢', '٣'], names: ['noor', 'sami_07', 'أنت'] },
};

function samples(o, lang) {
  const t = T[lang], ar = lang === 'ar', face = ar ? o.ar : o.en, lab = ar ? plexLabel : mono;
  const body = ar ? "font-family: 'IBM Plex Sans Arabic', sans-serif" : "font-family: 'Figtree', sans-serif";
  const num = (v, size, color = N.text) => `<span style="${face}; font-size: ${size}px; line-height: 1.1; color: ${color}">${v}</span>`;
  return `<div dir="${ar ? 'rtl' : 'ltr'}" style="display: flex; flex-direction: column; gap: 12px">
${card(`${lab(ar ? 'نتنفس معًا' : 'BREATHING TOGETHER')}<div style="display: flex; align-items: flex-end; gap: 12px">${num(t.people, 36, N.accent)}<span style="flex: 1; display: flex; flex-direction: column; gap: 4px; padding-bottom: 4px"><span style="${body}; font-size: 13px; line-height: 1.35; color: ${N.sec}">${t.peopleLine}</span>${lab(t.countries)}</span></div>`)}
${card(`<div style="display: flex; gap: 16px; align-items: flex-end"><div style="flex: 1; display: flex; flex-direction: column; gap: 6px">${lab(t.streakL)}<div style="display: flex; align-items: baseline; gap: 8px">${num(t.streak, 48)}<span style="${body}; font-size: 14px; color: ${N.sec}">${t.days}</span></div></div><div style="display: flex; flex-direction: column; gap: 6px">${lab(t.longestL)}${num(t.longest, 28)}</div></div>`)}
${card(`${lab(t.recapL)}<div style="display: flex; align-items: baseline; gap: 8px">${num(t.recap, 64)}<span style="${body}; font-size: 15px; color: ${N.sec}">${t.unit}</span></div>`)}
${card(t.ranks.map((r, i) => `<div style="display: flex; align-items: center; gap: 12px">${num(r, 20, i === 2 ? N.text : N.accent)}<span style="${body}; font-size: 14px; color: ${N.text}">${t.names[i]}</span></div>`).join(''))}
</div>`;
}

const COL = 300, GAP = 24;
const W = 64 * 2 + OPTIONS.length * COL + (OPTIONS.length - 1) * GAP;
const board = `<div style="width: ${W}px; box-sizing: border-box; padding: 64px; background: ${N.ground}; display: flex; flex-direction: column; gap: 32px; font-family: 'Figtree', sans-serif">
<div style="display: flex; flex-direction: column; gap: 12px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${N.accent}">HOUNA · NUMBERS</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 56px; line-height: 1; color: ${N.text}">A face for the numbers</h1>
<p style="margin: 0; max-width: 1100px; font-size: 16px; line-height: 1.5; color: ${N.sec}">The numbers that stand on their own (Home’s map count, the streaks and ranks on Stats, Recap’s big numbers, and the new Profile’s stats) use the display face today, and Marcellus’ 1 reads as an I. Titles keep Marcellus; only these numbers change, through one new font role, <span style="font-family: 'DM Mono', monospace; font-size: 14px">numeral</span>. English above, Arabic below.</p></div>
<div style="display: flex; gap: ${GAP}px">${OPTIONS.map((o) => `<div style="width: ${COL}px; display: flex; flex-direction: column; gap: 16px">
<div style="display: flex; flex-direction: column; gap: 6px; min-height: 76px"><span style="font-size: 17px; font-weight: 600; color: ${o.key === 'today' ? N.ter : N.text}">${o.name}</span><span style="font-size: 13px; line-height: 1.45; color: ${N.sec}">${o.note}</span></div>
${samples(o, 'en')}${samples(o, 'ar')}</div>`).join('')}</div>
</div>`;

fs.writeFileSync(P + 'Numbers.dc.html', `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Numbers — four faces</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Amiri:wght@700&amp;family=DM+Mono:wght@400;500&amp;family=DM+Serif+Display&amp;family=Figtree:wght@300;400;500;600&amp;family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:#0B1026}
</style>
</helmet>
${board}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${W},"height":1486}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`);
console.log('Numbers.dc.html', W);
