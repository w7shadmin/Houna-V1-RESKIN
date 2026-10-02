// B · Breathing player: eight phones, each a different way to see a breath. Timings come from
// constants/breathPatterns.ts (4-7-8 and box), so every loop paces like the app. Inspiration:
// TIDE's glass orb and alarm ring, Hatch's grainy dome, Stardust's ridges; the star, the
// mashrabiya and the arch are the woven Arabic geometry.
const K = require('./kit.js');
const { icon } = require('./icons.js');
const N = K.T.night, D = K.T.dusk, S = K.T.sunrise;
const M = K.NIGHT;
const F478 = K.BREATH.four78, BOX = K.BREATH.box;
const C478 = K.cycleOf(F478), CBOX = K.cycleOf(BOX);
const out = [];

/** Opacity keyframes that show something only between two fractions of a cycle. */
function windowKf(name, a, b, fade = 1.2) {
  const A = a * 100, B = b * 100;
  if (A === 0) return `@keyframes ${name} { 0% { opacity: 0 } ${fade}% { opacity: 1 } ${(B - fade).toFixed(2)}% { opacity: 1 } ${B.toFixed(2)}% { opacity: 0 } 100% { opacity: 0 } }`;
  if (B >= 100) return `@keyframes ${name} { 0% { opacity: 0 } ${A.toFixed(2)}% { opacity: 0 } ${(A + fade).toFixed(2)}% { opacity: 1 } ${(100 - fade).toFixed(2)}% { opacity: 1 } 100% { opacity: 0 } }`;
  return `@keyframes ${name} { 0% { opacity: 0 } ${A.toFixed(2)}% { opacity: 0 } ${(A + fade).toFixed(2)}% { opacity: 1 } ${(B - fade).toFixed(2)}% { opacity: 1 } ${B.toFixed(2)}% { opacity: 0 } 100% { opacity: 0 } }`;
}
/** The phase words of a pattern, stacked, each shown during its phase. */
function phaseWords(prefix, phases, words, style) {
  const total = K.cycleOf(phases);
  let t = 0;
  const css = [], html = [];
  phases.forEach((p, i) => {
    css.push(windowKf(`${prefix}${i}`, t / total, (t + p.s) / total));
    html.push(`<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; animation: ${prefix}${i} ${total}s linear infinite">${words[i]}</span>`);
    t += p.s;
  });
  return { css: css.join('\n'), html: `<span style="position: relative; display: block; ${style}">${html.join('')}</span>` };
}
const WORDS478 = ['Breathe in', 'Hold', 'Breathe out'];
const WORDSBOX = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];
const endBtn = (color, tint = '242,236,221') => `<button type="button" aria-label="End" style="position: absolute; left: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass(tint, 0.1)}; display: flex; align-items: center; justify-content: center; color: ${color}; cursor: pointer">${icon('close', 20)}</button>`;

/* ── B1 · Glass orb with the word inside (TIDE) ── */
(() => {
  const words = phaseWords('w', F478, ['Inhale', 'Hold', 'Exhale'], 'width: 200px; height: 40px; font-weight: 300; font-size: 30px; color: #FFFFFF');
  const css = `${K.breathKeyframes('orb', F478, (f) => `transform: scale(${f ? 1 : 0.6})`)}
${K.breathKeyframes('halo', F478, (f) => `transform: scale(${f ? 1.25 : 0.7}); opacity: ${f ? 0.9 : 0.35}`)}
@keyframes rise { from { transform: translateY(0); opacity: 0 } 15% { opacity: 0.8 } to { transform: translateY(-360px); opacity: 0 } }
${words.css}`;
  const motes = Array.from({ length: 16 }, (_, i) => `<span style="position: absolute; left: ${(i * 53 + 17) % 390}px; top: ${560 + ((i * 97) % 220)}px; width: ${1.5 + (i % 3)}px; height: ${1.5 + (i % 3)}px; border-radius: 999px; background: rgba(242,236,221,0.7); animation: rise ${12 + (i % 5) * 3}s linear ${-i * 1.7}s infinite"></span>`).join('');
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(90% 60% at 50% 45%, rgba(111,214,207,0.20) 0%, rgba(11,16,38,0) 70%), linear-gradient(180deg, #0E1834 0%, ${M.midnight} 100%)"></span>
${motes}
${endBtn(M.moonlight)}
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center">${K.label('Anxiety relief · 4-7-8', M.mist)}</span>
<span aria-hidden="true" style="position: absolute; left: ${195 - 190}px; top: ${400 - 190}px; width: 380px; height: 380px; border-radius: 999px; background: radial-gradient(closest-side, rgba(111,214,207,0.35), rgba(111,214,207,0)); animation: halo ${C478}s linear infinite"></span>
<div aria-hidden="true" style="position: absolute; left: ${195 - 125}px; top: ${400 - 125}px; width: 250px; height: 250px; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.32) 0%, rgba(185,236,232,0.16) 38%, rgba(111,214,207,0.12) 70%, rgba(111,214,207,0.22) 100%); box-shadow: inset 0 0 40px rgba(217,250,246,0.25), 0 0 40px rgba(111,214,207,0.25); border: 1px solid rgba(217,250,246,0.35); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: orb ${C478}s linear infinite"></div>
<div style="position: absolute; left: 95px; top: 380px">${words.html}</div>
<div style="position: absolute; left: 0; right: 0; top: 680px; display: flex; flex-direction: column; align-items: center; gap: 8px">
<span style="font-size: 16px; color: ${M.mist}">Round 2 of 4</span>
<span style="display: flex; gap: 6px">${[1, 1, 0, 0].map((f) => `<span style="width: 22px; height: 3px; border-radius: 2px; background: ${f ? N.tone.glow : 'rgba(242,236,221,0.18)'}"></span>`).join('')}</span>
</div>`;
  out.push(K.board('BreatheOrb.dc.html', { title: 'Breathe — glass orb, the word inside', root: `background: ${M.midnight}`, css, body }));
})();

/* ── B2 · Orbit dot: one lap per box breath, a big light countdown (TIDE alarm) ── */
(() => {
  const R = 148;
  const tickCss = `@keyframes tick { 0% { opacity: 1 } 6.1% { opacity: 1 } 6.25% { opacity: 0 } 100% { opacity: 0 } }
@keyframes quarter { 0% { opacity: 1 } 24.2% { opacity: 1 } 25% { opacity: 0 } 100% { opacity: 0 } }`;
  const numbers = Array.from({ length: CBOX }, (_, k) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; animation: tick ${CBOX}s linear ${-(CBOX - k) % CBOX}s infinite">${4 - (k % 4)}</span>`).join('');
  const phases = WORDSBOX.map((w, k) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; animation: quarter ${CBOX}s linear ${-(CBOX - 4 * k) % CBOX}s infinite">${w}</span>`).join('');
  const body = `
<span style="position: absolute; inset: 0; background: linear-gradient(180deg, ${M.midnight} 0%, #1E2350 42%, #4A3E73 70%, #A77A7A 90%, ${N.tone.dawn} 100%)"></span>
${endBtn(M.moonlight)}
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center">${K.label('Steady mind · box', M.mist)}</span>
<svg width="${2 * R + 40}" height="${2 * R + 40}" viewBox="0 0 ${2 * R + 40} ${2 * R + 40}" aria-hidden="true" style="position: absolute; left: ${195 - R - 20}px; top: ${380 - R - 20}px"><circle cx="${R + 20}" cy="${R + 20}" r="${R}" fill="none" stroke="rgba(242,236,221,0.28)" stroke-width="1"></circle>${[0, 90, 180, 270].map((a) => `<line x1="${R + 20}" y1="${20 - 5}" x2="${R + 20}" y2="${20 + 5}" stroke="rgba(242,236,221,0.5)" stroke-width="1.2" transform="rotate(${a} ${R + 20} ${R + 20})"></line>`).join('')}</svg>
<span aria-hidden="true" style="position: absolute; left: ${195 - R - 20}px; top: ${380 - R - 20}px; width: ${2 * R + 40}px; height: ${2 * R + 40}px; animation: spin ${CBOX}s linear infinite"><span style="position: absolute; left: ${R + 20 - 7}px; top: ${20 - 7}px; width: 14px; height: 14px; border-radius: 999px; background: #FFFFFF; box-shadow: 0 0 16px 4px rgba(255,255,255,0.65)"></span></span>
<span aria-hidden="true" style="position: absolute; left: 95px; top: 300px; width: 200px; height: 110px; font-weight: 300; font-size: 104px; color: #FFFFFF; font-variant-numeric: tabular-nums">${numbers}</span>
<span aria-hidden="true" style="position: absolute; left: 95px; top: 420px; width: 200px; height: 30px; font-size: 19px; color: ${M.mist}">${phases}</span>
<div style="position: absolute; left: 0; right: 0; top: 650px; display: flex; flex-direction: column; align-items: center; gap: 6px">
<span style="font-size: 20px; font-weight: 500; color: #FFFFFF">Four sides, four counts</span>
<span style="font-size: 15px; color: rgba(242,236,221,0.75)">The light makes one lap each breath</span>
</div>
<button type="button" style="position: absolute; left: 105px; right: 105px; top: 736px; height: 56px; border-radius: 999px; ${K.glass('255,255,255', 0.18)}; color: #FFFFFF; font-size: 17px; font-weight: 500; cursor: pointer">Pause</button>`;
  out.push(K.board('BreatheOrbit.dc.html', { title: 'Breathe — orbit dot, box breathing', root: `background: ${M.midnight}`, css: tickCss, body }));
})();

/* ── B3 · Star breath: box breathing traced on a square; at the holds a second square turns in, making the eight-point star every other round ── */
(() => {
  const cx = 195, cy = 390, r = 132, half = r / Math.SQRT2;
  const tl = [cx - half, cy - half];
  const perim = `M${tl[0]} ${tl[1]} H${cx + half} V${cy + half} H${cx - half} Z`;
  const T2 = CBOX * 2;
  const pct = (s) => ((s / T2) * 100).toFixed(2);
  const turn = `@keyframes turn { 0% { transform: rotate(0deg) } ${pct(4)}% { transform: rotate(0deg) } ${pct(8)}% { transform: rotate(22.5deg) } ${pct(12)}% { transform: rotate(22.5deg) } ${pct(16)}% { transform: rotate(45deg) } ${pct(20)}% { transform: rotate(45deg) } ${pct(24)}% { transform: rotate(67.5deg) } ${pct(28)}% { transform: rotate(67.5deg) } 100% { transform: rotate(90deg) } }
@keyframes starLit { 0%, ${pct(14)}% { opacity: 0 } ${pct(16)}% { opacity: 0.9 } ${pct(20)}% { opacity: 0.9 } ${pct(22)}%, 100% { opacity: 0 } }
@keyframes trace { from { offset-distance: 0% } to { offset-distance: 100% } }`;
  const words = phaseWords('s', BOX, WORDSBOX, 'width: 240px; height: 32px; font-family: ' + K.F.display + '; font-size: 26px; color: ' + M.moonlight);
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 46%, rgba(179,167,245,0.16), rgba(11,16,38,0) 70%)"></span>
${endBtn(M.moonlight)}
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center">${K.label('Steady mind · star', M.mist)}</span>
<svg width="390" height="780" viewBox="0 0 390 780" aria-hidden="true" style="position: absolute; left: 0; top: 0; overflow: visible">
<polygon points="${K.star8(cx, cy, r)}" fill="rgba(179,167,245,0.22)" stroke="${N.tone.dusk}" stroke-width="1.5" style="animation: starLit ${T2}s linear infinite"></polygon>
<polygon points="${K.squarePts(cx, cy, r, 45)}" fill="none" stroke="rgba(242,236,221,0.5)" stroke-width="1.2"></polygon>
<g style="transform-origin: ${cx}px ${cy}px; animation: turn ${T2}s ease-in-out infinite"><polygon points="${K.squarePts(cx, cy, r, 45)}" fill="none" stroke="${N.tone.dusk}" stroke-width="1.2" opacity="0.8"></polygon></g>
</svg>
<span aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 14px; height: 14px; offset-anchor: center; border-radius: 999px; background: #FFFFFF; box-shadow: 0 0 18px 5px rgba(179,167,245,0.8); offset-path: path('${perim}'); offset-rotate: 0deg; animation: trace ${CBOX}s linear infinite"></span>
${K.mark(40, N.tone.dusk).replace('position: absolute; left: 50%; top: 50%;', `position: absolute; left: ${cx}px; top: ${cy}px; opacity: 0.8;`)}
<div style="position: absolute; left: 75px; top: 610px">${words.html}</div>
<span style="position: absolute; left: 40px; right: 40px; top: 660px; text-align: center; font-size: 15px; line-height: 1.5; color: ${M.mist}">Along the square as you breathe. At each hold the second square turns in, and every other round they meet as the star.</span>`;
  out.push(K.board('BreatheStar.dc.html', { title: 'Breathe — the eight-point star', root: `background: ${M.midnight}`, css: `${turn}\n${words.css}`, body }));
})();

/* ── B4 · Mashrabiya bloom: the lattice opens as you breathe in and light falls through ── */
(() => {
  const S = 78, cols = 6, rows = 7, x0 = (390 - cols * S) / 2 + S / 2, y0 = 120;
  let g = '';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = x0 + i * S - S / 2 + S / 2, y = y0 + j * S;
    g += `<polygon points="${K.star8(x, y, S * 0.36)}"></polygon>`;
    g += `<path d="M${x - S / 2} ${y} H${x - S * 0.4} M${x + S * 0.4} ${y} H${x + S / 2} M${x} ${y - S / 2} V${y - S * 0.4} M${x} ${y + S * 0.4} V${y + S / 2}"></path>`;
  }
  const css = `${K.breathKeyframes('latW', F478, (f) => `stroke-width: ${f ? 3 : 16}px`)}
${K.breathKeyframes('light', F478, (f) => `opacity: ${f ? 1 : 0.35}; transform: scale(${f ? 1.08 : 0.9})`)}
${K.breathKeyframes('pool', F478, (f) => `opacity: ${f ? 0.85 : 0.2}; transform: scaleX(${f ? 1 : 0.7})`)}
.lat polygon, .lat path { fill: none; stroke: #0A0E22; stroke-linejoin: round; animation: latW ${C478}s linear infinite }`;
  const words = phaseWords('m', F478, WORDS478, `width: 240px; height: 32px; font-family: ${K.F.display}; font-size: 26px; color: ${M.moonlight}`);
  const body = `
<span style="position: absolute; left: -40px; top: 60px; width: 470px; height: 640px; background: radial-gradient(closest-side, rgba(242,184,128,0.95) 0%, rgba(234,144,168,0.55) 45%, rgba(11,16,38,0) 100%); animation: light ${C478}s linear infinite"></span>
<svg class="lat" width="390" height="680" viewBox="0 0 390 680" aria-hidden="true" style="position: absolute; left: 0; top: 0">
<rect x="0" y="0" width="390" height="${y0 - S / 2}" fill="#0A0E22"></rect><rect x="0" y="${y0 + (rows - 0.5) * S}" width="390" height="200" fill="#0A0E22"></rect>
<rect x="0" y="0" width="${x0 - S / 2}" height="680" fill="#0A0E22"></rect><rect x="${x0 + (cols - 0.5) * S}" y="0" width="200" height="680" fill="#0A0E22"></rect>
${g}
</svg>
<span style="position: absolute; left: 40px; right: 40px; top: 690px; height: 60px; border-radius: 999px; background: radial-gradient(closest-side, rgba(242,184,128,0.6), rgba(242,184,128,0)); animation: pool ${C478}s linear infinite"></span>
${endBtn(M.moonlight)}
<div style="position: absolute; left: 75px; top: 740px">${words.html}</div>`;
  out.push(K.board('BreatheLattice.dc.html', { title: 'Breathe — mashrabiya bloom', root: `background: #0A0E22`, css: css + '\n' + words.css, body }));
})();

/* ── B5 · Arch light (Sunrise): light rises inside a mihrab arch, glows through the hold, sinks ── */
(() => {
  const W = 230, H = 340, x = (390 - W) / 2, y = 170;
  const css = `${K.breathKeyframes('fill', F478, (f) => `transform: translateY(${f ? 0 : 100}%)`)}
${K.breathKeyframes('shine', F478, (f) => `opacity: ${f ? 0.9 : 0}`)}`;
  const words = phaseWords('a', F478, WORDS478, `width: 240px; height: 32px; font-family: ${K.F.display}; font-size: 26px; color: ${S.text}`);
  const body = `
${endBtn(S.text, '29,43,42')}
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center">${K.label('Anxiety relief · 4-7-8', S.sec)}</span>
<span aria-hidden="true" style="position: absolute; left: ${x - 60}px; top: ${y - 40}px; width: ${W + 120}px; height: ${H + 80}px; background: radial-gradient(closest-side, rgba(59,170,167,0.3), rgba(59,170,167,0)); animation: shine ${C478}s linear infinite"></span>
<div aria-hidden="true" style="position: absolute; left: ${x}px; top: ${y}px; width: ${W}px; height: ${H}px; ${K.archClip(W, H)}; background: #E6F2EF">
<span style="position: absolute; inset: 0; background: linear-gradient(180deg, #CFF1EE 0%, #3BAAA7 70%, #196662 100%); animation: fill ${C478}s linear infinite"></span>
${K.grain('ag', 0.12)}
</div>
<svg width="${W + 10}" height="${H + 10}" viewBox="-5 -5 ${W + 10} ${H + 10}" aria-hidden="true" style="position: absolute; left: ${x - 5}px; top: ${y - 5}px; overflow: visible"><path d="${K.archPath(W, H)}" fill="none" stroke="${S.accent}" stroke-width="1.5"></path><path d="${K.archPath(W - 24, H - 12, 12, 12)}" fill="none" stroke="${S.accent}" stroke-width="0.8" opacity="0.5"></path></svg>
${K.mark(44, '#FFFFFF').replace('position: absolute; left: 50%; top: 50%;', `position: absolute; left: 195px; top: ${y + 110}px; opacity: 0.85;`)}
<span style="position: absolute; left: 60px; right: 60px; top: ${y + H}px; height: 1px; background: rgba(29,43,42,0.18)"></span>
<div style="position: absolute; left: 75px; top: 560px">${words.html}</div>
<span style="position: absolute; left: 0; right: 0; top: 610px; text-align: center; font-size: 15px; color: ${S.sec}">In for 4, hold for 7, out for 8</span>
<button type="button" style="position: absolute; left: 24px; right: 24px; top: 756px; height: 56px; border-radius: 999px; border: 1.5px solid ${S.accent}; background: none; color: ${S.accent}; font-size: 17px; font-weight: 600; cursor: pointer">Pause</button>`;
  out.push(K.board('BreatheArch.dc.html', { title: 'Breathe — arch light (Sunrise)', root: `background: ${S.ground}`, css: css + '\n' + words.css, body }));
})();

/* ── B6 · Horizon breath (Hatch, Dusk): a grainy dome sun rises and sets with the breath ── */
(() => {
  const css = `${K.breathKeyframes('sunUp', BOX, (f) => `transform: translateY(${f ? 0 : 150}px)`)}
${K.breathKeyframes('skyUp', BOX, (f) => `opacity: ${f ? 1 : 0.2}`)}`;
  const words = phaseWords('h', BOX, WORDSBOX, `width: 240px; height: 32px; font-family: ${K.F.display}; font-size: 26px; color: ${D.text}`);
  const specks = Array.from({ length: 90 }, (_, i) => { const a = (i * 137.5 * Math.PI) / 180, rr = 120 + ((i * 29) % 70); return `<span style="position: absolute; left: ${(195 + rr * Math.cos(a)).toFixed(0)}px; top: ${(330 + rr * Math.sin(a) * 0.9).toFixed(0)}px; width: 2px; height: 2px; border-radius: 999px; background: rgba(168,98,31,${(0.15 + (i % 5) * 0.06).toFixed(2)})"></span>`; }).join('');
  const body = `
<span style="position: absolute; inset: 0; background: linear-gradient(180deg, ${D.ground} 0%, #F7E7D3 55%, #F2D2B6 100%)"></span>
<span style="position: absolute; left: 0; right: 0; top: 0; height: 470px; background: radial-gradient(60% 50% at 50% 100%, rgba(242,184,128,0.55), rgba(242,184,128,0)); animation: skyUp ${CBOX}s linear infinite"></span>
${endBtn(D.text, '27,33,64')}
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center">${K.label('Steady mind · box', D.sec)}</span>
<div aria-hidden="true" style="position: absolute; left: 0; top: 150px; width: 390px; height: 320px; overflow: hidden">
<div style="position: absolute; left: 0; top: 0; width: 390px; height: 320px; animation: sunUp ${CBOX}s linear infinite">
<span style="position: absolute; inset: 0">${specks.replace(/top: (\d+)px/g, (m, v) => `top: ${v - 150}px`)}</span>
<span style="position: absolute; left: 75px; top: 60px; width: 240px; height: 240px; border-radius: 999px; background: radial-gradient(circle at 50% 40%, #FFF6EA 0%, #FFE3C4 45%, #F5B08A 100%); overflow: hidden">${K.grain('hz', 0.35, 1.3)}</span>
</div>
</div>
<span style="position: absolute; left: 0; right: 0; top: 470px; height: 1.5px; background: rgba(27,33,64,0.55)"></span>
<span style="position: absolute; left: 0; right: 0; top: 471px; bottom: 0; background: linear-gradient(180deg, #E9D9C4 0%, ${D.ground} 60%)"></span>
<div style="position: absolute; left: 75px; top: 540px">${words.html}</div>
<span style="position: absolute; left: 40px; right: 40px; top: 590px; text-align: center; font-size: 15px; line-height: 1.5; color: ${D.sec}">The sun comes up as you breathe in and rests on the horizon as you breathe out.</span>
<button type="button" style="position: absolute; left: 24px; right: 24px; top: 756px; height: 56px; border-radius: 999px; border: 0; background: ${D.text}; color: ${D.ground}; font-size: 17px; font-weight: 600; cursor: pointer">Pause</button>`;
  out.push(K.board('BreatheHorizon.dc.html', { title: 'Breathe — horizon (Dusk)', root: `background: ${D.ground}`, css: `${css}\n${words.css}`, body }));
})();

/* ── B7 · Breath ridges (Stardust): each breath swells a ridge, then it settles behind the next ── */
(() => {
  const TONES = [N.tone.glow, N.tone.dusk, N.tone.dawn, N.tone.bloom];
  const P4 = C478 * 4;
  const s = (sec) => ((sec / P4) * 100).toFixed(2);
  const css = `@keyframes ridge { 0% { transform: scaleY(0.12); opacity: 0.95 } ${s(4)}% { transform: scaleY(1); opacity: 1 } ${s(11)}% { transform: scaleY(1); opacity: 1 } ${s(19)}% { transform: scaleY(0.6); opacity: 0.7 } 70% { transform: scaleY(0.6); opacity: 0.22 } 99% { transform: scaleY(0.55); opacity: 0.05 } 100% { transform: scaleY(0.12); opacity: 0.95 } }`;
  const words = phaseWords('r', F478, WORDS478, `width: 240px; height: 32px; font-family: ${K.F.display}; font-size: 26px; color: ${M.moonlight}`);
  const ridge = (c, k) => { const px = 90 + k * 70; return `<path d="M-20 560 C${px - 120} 560 ${px - 60} 250 ${px} 250 S${px + 150} 560 ${px + 260} 560 Z" fill="${c}" fill-opacity="0.55" stroke="${c}" stroke-width="1.2" style="transform-origin: 0 560px; mix-blend-mode: screen; animation: ridge ${P4}s linear ${-(3 - k) * C478}s infinite"></path>`; };
  const body = `
${endBtn(M.moonlight)}
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center">${K.label('Anxiety relief · 4-7-8', M.mist)}</span>
<svg width="390" height="600" viewBox="0 0 390 600" aria-hidden="true" style="position: absolute; left: 0; top: 60px">
${Array.from({ length: 9 }, (_, i) => `<line x1="${24 + i * 43}" y1="200" x2="${24 + i * 43}" y2="560" stroke="rgba(242,236,221,0.07)"></line>`).join('')}
<defs><linearGradient id="rf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${M.midnight}" stop-opacity="0"></stop><stop offset="1" stop-color="${M.midnight}" stop-opacity="1"></stop></linearGradient></defs>
${TONES.map(ridge).join('')}
<rect x="0" y="480" width="390" height="90" fill="url(#rf)"></rect>
</svg>
<div style="position: absolute; left: 24px; top: 150px; display: flex; flex-direction: column; gap: 4px">${['This breath', 'One ago', 'Two ago', 'Three ago'].map((t, k) => K.label(t, [N.tone.bloom, N.tone.dawn, N.tone.dusk, N.tone.glow][k], 10.5)).join('')}</div>
<div style="position: absolute; left: 75px; top: 650px">${words.html}</div>
<span style="position: absolute; left: 0; right: 0; top: 700px; text-align: center; font-size: 15px; color: ${M.mist}">Each breath leaves a ridge. The newest is the brightest.</span>`;
  out.push(K.board('BreatheRidges.dc.html', { title: 'Breathe — ridges of breath', root: `background: ${M.midnight}`, css: css + '\n' + words.css, body }));
})();

/* ── B8 · Pattern picker (Arabic): each exercise's rhythm as a proportional ring ── */
(() => {
  const EX = [
    { title: 'تمرين تهدئة القلق', sub: 'تقنية التنفس ٤-٧-٨', segs: [[4, 'شهيق', N.tone.glow], [7, 'احتفاظ', N.tone.dusk], [8, 'زفير', N.tone.dawn]], total: 'نفَس واحد: ١٩ ثانية', tone: N.tone.glow },
    { title: 'تمرين ثبات العقل', sub: 'تقنية التنفس المربّع ٤×٤', segs: [[4, 'شهيق', N.tone.glow], [4, 'احتفاظ', N.tone.dusk], [4, 'زفير', N.tone.dawn], [4, 'احتفاظ', N.tone.dusk]], total: 'نفَس واحد: ١٦ ثانية', tone: N.tone.dusk },
    { title: 'تمرين تهدئة الذعر', sub: 'تمرين الحواس ٥-٤-٣-٢-١', segs: [[5, 'انظر', N.tone.dawn], [4, 'المس', N.tone.dawn], [3, 'اسمع', N.tone.dawn], [2, 'شمّ', N.tone.dawn], [1, 'تذوّق', N.tone.dawn]], total: 'خمس خطوات بلا عجلة', tone: N.tone.dawn },
    { title: 'تحرير التوتر', sub: 'الاسترخاء العضلي التدريجي', segs: [[5, 'شدّ', N.tone.bloom], [7, 'إرخاء', N.tone.dusk]], total: 'لكل مجموعة: ١٢ ثانية', tone: N.tone.bloom },
  ];
  const ring = (segs, R, sw, gap) => {
    const C = 2 * Math.PI * R, sum = segs.reduce((a, s) => a + s[0], 0);
    let off = 0;
    return segs.map(([n, , c]) => { const len = (n / sum) * C - gap; const el = `<circle cx="${R + sw}" cy="${R + sw}" r="${R}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${(C - len).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}"></circle>`; off += (n / sum) * C; return el; }).join('');
  };
  const big = (e, k) => `<div aria-hidden="{{h${k}}}" style="position: absolute; inset: 0; opacity: {{o${k}}}; transform: scale({{z${k}}}); transition: opacity 500ms ease, transform 600ms cubic-bezier(.3,1.2,.5,1)">
<svg width="232" height="232" viewBox="0 0 232 232" style="position: absolute; left: 79px; top: 0; transform: rotate(-90deg) scaleY(-1)">${ring(e.segs, 104, 8, 10)}</svg>
<div style="position: absolute; left: 79px; top: 0; width: 232px; height: 232px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center">
<span style="font-family: ${K.F.arDisplay}; font-size: 22px; font-weight: 700; color: ${M.moonlight}">${e.segs.map((s) => K.ar(s[0])).join(' · ')}</span>
<span style="font-size: 13.5px; color: ${M.mist}; max-width: 150px">${e.total}</span>
</div>
<div style="position: absolute; left: 20px; right: 20px; top: 252px; display: flex; justify-content: center; flex-wrap: wrap; gap: 8px 16px">${e.segs.map(([n, w, c]) => `<span style="display: flex; align-items: center; gap: 6px; font-size: 14px; color: ${M.mist}"><span style="width: 8px; height: 8px; border-radius: 999px; background: ${c}"></span>${w} ${K.ar(n)}</span>`).join('')}</div>
</div>`;
  const row = (e, k) => `<button type="button" onClick="{{pick${k}}}" aria-pressed="{{p${k}}}" style="width: 100%; min-height: 72px; padding: 12px 16px; border-radius: 20px; border: 1px solid {{b${k}}}; background: {{bg${k}}}; display: flex; align-items: center; gap: 14px; cursor: pointer; text-align: right; transition: background 400ms ease, border-color 400ms ease">
<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true" style="flex-shrink: 0; transform: rotate(-90deg) scaleY(-1)">${ring(e.segs, 18, 4, 3)}</svg>
<span style="flex: 1; display: flex; flex-direction: column; gap: 3px"><span style="font-size: 16px; font-weight: 600; color: ${M.moonlight}">${e.title}</span><span style="font-size: 13.5px; color: ${M.mist}">${e.sub}</span></span>
</button>`;
  const body = `
<span style="position: absolute; right: 24px; top: 60px">${K.arLabel('تنفّس', N.accent)}</span>
<span style="position: absolute; right: 24px; left: 24px; top: 88px; font-family: ${K.F.arDisplay}; font-size: 30px; color: ${M.moonlight}">إيقاع كل تمرين</span>
<div style="position: absolute; left: 0; right: 0; top: 150px; height: 300px">${EX.map(big).join('')}</div>
<div style="position: absolute; left: 20px; right: 20px; top: 470px; display: flex; flex-direction: column; gap: 8px">${EX.map(row).join('')}</div>
`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 0 };
  }
  renderVals() {
    const s = this.state.sel;
    const v = {};
    for (let k = 0; k < 4; k++) {
      v['o' + k] = s === k ? 1 : 0;
      v['z' + k] = s === k ? 1 : 0.92;
      v['h' + k] = s === k ? 'false' : 'true';
      v['p' + k] = s === k ? 'true' : 'false';
      v['b' + k] = s === k ? 'rgba(242,236,221,0.35)' : 'rgba(242,236,221,0.08)';
      v['bg' + k] = s === k ? 'rgba(242,236,221,0.08)' : 'rgba(242,236,221,0.03)';
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(K.board('BreathePatternsAr.dc.html', { title: 'تنفّس — إيقاع كل تمرين', lang: 'ar', root: `background: ${M.midnight}`, body, logic }));
})();

module.exports = out;
if (require.main === module) console.log(out.map((b) => b.file).join('\n'));
