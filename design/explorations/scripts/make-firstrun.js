// G · First run: four phones. Inspiration: TIDE's footage opening with a spaced wordmark,
// Moonly's quiet splash. Then one shared breath before anything is asked of you.
const K = require('./kit.js');
const { icon } = require('./icons.js');
const N = K.T.night;
const M = K.NIGHT;
const out = [];

/* ── G1 / G4 · The opening: real footage, a spaced wordmark, one clear way in ── */
function opening(lang) {
  const isAr = lang === 'ar';
  const video = isAr ? K.ASSET.rainMp4 : K.ASSET.forestMp4;
  const poster = isAr ? K.ASSET.rainJpg : K.ASSET.forestJpg;
  const body = `
<video src="${video}" poster="${poster}" autoplay="" muted="" loop="" playsinline="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7) saturate(0.9)"></video>
<span style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,16,38,0.35) 0%, rgba(11,16,38,0.15) 35%, rgba(11,16,38,0.55) 65%, rgba(11,16,38,0.92) 100%)"></span>
<div style="position: absolute; left: 0; right: 0; top: 190px; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center">
${isAr
    ? `<span lang="ar" style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 76px; line-height: 1.2; color: #FFFFFF; animation: fadeUp 1.4s ease 0.3s both">هُنا</span>
<span style="font-family: ${K.F.body}; font-weight: 300; font-size: 18px; letter-spacing: 0.6em; color: rgba(255,255,255,0.8); animation: fadeIn 1.4s ease 0.9s both">HOUNA</span>`
    : `<span style="font-family: ${K.F.body}; font-weight: 300; font-size: 46px; letter-spacing: 0.5em; margin-left: 0.5em; color: #FFFFFF; animation: fadeUp 1.4s ease 0.3s both">HOUNA</span>
<span lang="ar" style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 30px; color: rgba(255,255,255,0.8); animation: fadeIn 1.4s ease 0.9s both">هُنا</span>`}
<span style="max-width: 280px; font-size: ${isAr ? 18 : 17}px; line-height: 1.6; color: rgba(255,255,255,0.78); animation: fadeIn 1.4s ease 1.4s both">${isAr ? 'مكان هادئ لتتنفّس، وتستريح، وتعود' : 'A quiet place to breathe, rest and come back to.'}</span>
</div>
<div style="position: absolute; left: 32px; right: 32px; top: 680px; display: flex; flex-direction: column; align-items: center; gap: 18px; animation: fadeUp 1.2s ease 2s both">
<button type="button" style="width: 100%; height: 58px; border-radius: 999px; border: 0; background: #FFFFFF; color: ${M.midnight}; font-size: 17px; font-weight: 600; cursor: pointer">${isAr ? 'ابدأ' : 'Start'}</button>
<button type="button" style="height: 44px; padding: 0 12px; border: 0; background: none; color: rgba(255,255,255,0.85); font-size: 16px; cursor: pointer">${isAr ? 'لدي اسم مستعار' : 'I already have an alias'}</button>
</div>`;
  return K.board(isAr ? 'FirstOpeningAr.dc.html' : 'FirstOpening.dc.html', { title: isAr ? 'البداية — مشهد حي' : 'First run — the opening', lang, root: `background: ${M.midnight}`, body });
}

/* ── G2 · The splash (Moonly): the crescent bowl rises, the wordmark settles under it ── */
(() => {
  const L = 7;
  const css = `@keyframes bowlIn { 0% { opacity: 0; transform: translateY(30px) scale(0.92) } 25%, 82% { opacity: 1; transform: none } 100% { opacity: 0; transform: none } }
@keyframes wordIn { 0%, 18% { opacity: 0; transform: translateY(8px) } 38%, 82% { opacity: 1; transform: none } 100% { opacity: 0 } }
@keyframes glowBreath { 0%, 100% { opacity: 0.4 } 50% { opacity: 0.8 } }`;
  const body = `
<span aria-hidden="true" style="position: absolute; left: 45px; top: 200px; width: 300px; height: 300px; border-radius: 999px; background: radial-gradient(closest-side, rgba(242,184,128,0.35), rgba(242,184,128,0)); animation: glowBreath 4s ease-in-out infinite"></span>
<div aria-hidden="true" style="position: absolute; left: 95px; top: 250px; width: 200px; height: 200px; animation: bowlIn ${L}s ease infinite">
<svg width="200" height="200" viewBox="0 0 200 200"><defs><radialGradient id="sb" cx="50%" cy="75%" r="60%"><stop offset="0" stop-color="#FFD9A0"></stop><stop offset="0.55" stop-color="${N.tone.dawn}"></stop><stop offset="1" stop-color="#E4826A"></stop></radialGradient><mask id="sm"><rect width="200" height="200" fill="#fff"></rect><circle cx="100" cy="46" r="98" fill="#000"></circle></mask></defs><circle cx="100" cy="100" r="94" fill="url(#sb)" mask="url(#sm)"></circle></svg>
</div>
<div style="position: absolute; left: 0; right: 0; top: 610px; display: flex; flex-direction: column; align-items: center; gap: 14px; animation: wordIn ${L}s ease infinite">
${K.logo('#C9CDD8', '#8990B5', 150)}
${K.label('Breathe · rest · return', M.haze, 11)}
</div>`;
  out.push(K.board('FirstSplash.dc.html', { title: 'First run — the splash', root: `background: #121524`, css, body }));
})();

/* ── G3 · The first breath: before any question, one breath together ── */
(() => {
  const L = 24;
  const p = (s) => ((s / L) * 100).toFixed(2);
  const showKf = (name, a, b) => `@keyframes ${name} { 0%, ${p(a)}% { opacity: 0; transform: translateY(8px) } ${p(a + 0.8)}%, ${p(b - 0.6)}% { opacity: 1; transform: none } ${p(b)}%, 100% { opacity: 0 } }`;
  const css = `${showKf('t1', 0.3, 3.2)}
${showKf('t2', 3.4, 6.4)}
${showKf('t3', 6.4, 10.4)}
${showKf('t4', 10.4, 12.4)}
${showKf('t5', 12.4, 17.4)}
@keyframes tEnd { 0%, ${p(17.6)}% { opacity: 0; transform: translateY(10px) } ${p(18.6)}%, 100% { opacity: 1; transform: none } }
@keyframes orbLife { 0%, ${p(6)}% { opacity: 0; transform: scale(0.55) } ${p(6.6)}% { opacity: 1; transform: scale(0.6) } ${p(10.4)}% { transform: scale(1) } ${p(12.4)}% { transform: scale(1) } ${p(17.4)}% { transform: scale(0.6) } ${p(18.4)}%, 100% { opacity: 1; transform: scale(0.6) } }`;
  const line = (t, kf, style = '') => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; opacity: 0; animation: ${kf} ${L}s ease infinite; ${style}">${t}</span>`;
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 42%, rgba(111,214,207,0.14), rgba(11,16,38,0) 70%)"></span>
${K.starfield(30, 390, 844, 101)}
<div aria-hidden="true" style="position: absolute; left: ${195 - 120}px; top: ${360 - 120}px; width: 240px; height: 240px; border-radius: 999px; background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.32), rgba(185,236,232,0.14) 40%, rgba(111,214,207,0.24) 100%); border: 1px solid rgba(217,250,246,0.35); box-shadow: 0 0 50px rgba(111,214,207,0.3); opacity: 0; animation: orbLife ${L}s ease-in-out infinite">${K.pressedMark(90, '#9FE3DD')}</div>
<div style="position: absolute; left: 32px; right: 32px; top: 560px; height: 90px; font-family: ${K.F.display}; font-size: 28px; line-height: 1.3; color: ${M.moonlight}">
${line('Welcome.', 't1')}${line("Before anything else,<br>let's breathe once together.", 't2')}${line('Breathe in…', 't3')}${line('Hold, gently.', 't4')}${line('And all the way out.', 't5')}${line('That’s all Houna asks.', 'tEnd')}
</div>
<div style="position: absolute; left: 32px; right: 32px; top: 700px; display: flex; flex-direction: column; gap: 12px; opacity: 0; animation: tEnd ${L}s ease infinite">
<button type="button" style="height: 56px; border-radius: 999px; border: 0; background: ${M.moonlight}; color: ${M.midnight}; font-size: 17px; font-weight: 600; cursor: pointer">Continue</button>
</div>`;
  out.push(K.board('FirstBreath.dc.html', { title: 'First run — one breath together', root: `background: ${M.midnight}`, css, body }));
})();

out.unshift(opening('en'));
out.push(opening('ar'));
module.exports = out;
if (require.main === module) console.log(out.map((b) => b.file).join('\n'));
