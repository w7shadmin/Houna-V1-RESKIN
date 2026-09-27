// C · Suns and moons: eight phones. Inspiration: Moonly's gradient crescent, Hatch's grainy dome,
// Stardust's ring of moons; the hilal, the Hijri month, the khatam and the fanous are the woven
// Arabic references. Moons are in their real phase for each date (kit.phaseOf).
const K = require('./kit.js');
const { icon } = require('./icons.js');
const N = K.T.night, D = K.T.dusk, S = K.T.sunrise;
const M = K.NIGHT;
const out = [];
const DAY = 86400000;
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const hijriDay = (d) => +new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric' }).format(d);
const PHASE_NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
const phaseName = (f) => PHASE_NAMES[Math.floor(((f + 1 / 16) % 1) * 8)];
const num = (t, size, color = M.moonlight, extra = '') => `<span style="font-family: ${K.F.body}; font-weight: 300; font-size: ${size}px; line-height: 1; color: ${color}; font-variant-numeric: tabular-nums; ${extra}">${t}</span>`;

/* ── C1 · Crescent bowl (Moonly) as Home's body: the mark rests in the cup ── */
(() => {
  const css = `@keyframes bowlGlow { 0%,100% { filter: drop-shadow(0 0 18px rgba(242,184,128,0.35)) } 50% { filter: drop-shadow(0 0 34px rgba(242,184,128,0.6)) } }
@keyframes markFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }`;
  const body = `
${K.starfield(46, 390, 520, 5)}
<span style="position: absolute; left: 0; right: 0; top: 60px; display: flex; justify-content: center">${K.logo(N.logoP, N.logoS, 84)}</span>
<div aria-hidden="true" style="position: absolute; left: 75px; top: 190px; width: 240px; height: 240px; animation: bowlGlow 5s ease-in-out infinite">
<svg width="240" height="240" viewBox="0 0 240 240"><defs><radialGradient id="bowl" cx="50%" cy="72%" r="60%"><stop offset="0" stop-color="#FFD9A0"></stop><stop offset="0.55" stop-color="${N.tone.dawn}"></stop><stop offset="1" stop-color="#E4826A"></stop></radialGradient><mask id="cup"><rect width="240" height="240" fill="#fff"></rect><circle cx="120" cy="58" r="118" fill="#000"></circle></mask></defs><circle cx="120" cy="120" r="112" fill="url(#bowl)" mask="url(#cup)"></circle></svg>
</div>
<div aria-hidden="true" style="position: absolute; left: 175px; top: 318px; width: 40px; height: 40px; animation: markFloat 5s ease-in-out infinite">${K.mark(40, M.moonlight).replace('position: absolute; left: 50%; top: 50%;', 'position: absolute; left: 50%; top: 50%; opacity: 0.9;')}</div>
<div style="position: absolute; left: 0; right: 0; top: 470px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
${K.label("You're not alone", N.accent)}
<span style="font-family: ${K.F.display}; font-size: 22px; color: ${M.moonlight}">Rest here a while.</span>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: 580px; height: 150px; border-radius: 24px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between">
${K.label('Breathing together', M.haze)}
<div style="display: flex; align-items: flex-end; gap: 12px">${num('1,204', 36, N.tone.dawn)}<span style="font-size: 14px; line-height: 1.35; color: ${M.mist}">people breathed and meditated<br>with Houna this month</span></div>
</div>`;
  out.push(K.board('BodyCrescentBowl.dc.html', { title: 'Home — the crescent bowl', root: `background: ${M.midnight}`, css, body }));
})();

/* ── C2 · Grain dome sunrise (Hatch) ── */
(() => {
  const css = `@keyframes domeRise { 0% { transform: translateY(120px) } 60%,100% { transform: translateY(0) } }
@keyframes speck { 0% { opacity: 0 } 60%,100% { opacity: 1 } }`;
  const specks = Array.from({ length: 160 }, (_, i) => { const a = Math.PI + (i / 160) * Math.PI + ((i * 7) % 5) * 0.01; const rr = 150 + ((i * 37) % 90); return `<span style="position: absolute; left: ${(195 + rr * Math.cos(a)).toFixed(0)}px; top: ${(460 + rr * Math.sin(a)).toFixed(0)}px; width: 2px; height: 2px; border-radius: 999px; background: rgba(249,169,128,${(0.2 + (i % 6) * 0.1).toFixed(2)})"></span>`; }).join('');
  const body = `
<span style="position: absolute; inset: 0; background: linear-gradient(180deg, ${M.midnight} 0%, #1B2350 55%, #3A3470 100%)"></span>
<div aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 460px; overflow: hidden">
<span style="position: absolute; inset: 0; animation: speck 9s ease-out infinite alternate">${specks}</span>
<span style="position: absolute; left: 70px; top: 335px; width: 250px; height: 250px; border-radius: 999px; background: radial-gradient(circle at 50% 35%, #FFF9F1 0%, #FFE9D3 45%, #FBC8A3 80%, #F9A980 100%); overflow: hidden; animation: domeRise 9s ease-out infinite alternate">${K.grain('dm', 0.4, 1.4)}</span>
</div>
<span style="position: absolute; left: 0; right: 0; top: 460px; height: 1px; background: rgba(242,236,221,0.35)"></span>
<span style="position: absolute; left: 0; right: 0; top: 461px; bottom: 0; background: linear-gradient(180deg, #151B3F 0%, ${M.midnight} 70%)"></span>
<div style="position: absolute; left: 24px; top: 70px; display: flex; flex-direction: column; gap: 8px">
${K.label(K.gregorian(K.TODAY, 'en'), M.mist)}
<span style="font-family: ${K.F.display}; font-size: 34px; line-height: 1.15; color: ${M.moonlight}">Good morning.<br>The day is yours.</span>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 520px; display: flex; flex-direction: column; gap: 12px">
<span style="font-size: 16px; line-height: 1.5; color: ${M.mist}">A grainy dome that comes up slowly while Home opens, for Sunrise mornings, with the day's first breath one tap away.</span>
<button type="button" style="height: 56px; border-radius: 999px; border: 0; background: ${M.moonlight}; color: ${M.midnight}; font-size: 17px; font-weight: 600; cursor: pointer">Take a morning breath</button>
</div>`;
  out.push(K.board('BodyGrainDome.dc.html', { title: 'Sunrise — grain dome', root: `background: ${M.midnight}`, css, body }));
})();

/* ── C3 · Hilal and the Hijri date as Home's header: tonight, and the evening a month begins ── */
(() => {
  let first = K.TODAY;
  for (let i = 1; i < 40; i++) { const d = addDays(K.TODAY, i); if (hijriDay(d) === 1) { first = d; break; } }
  const eve = addDays(first, -1);
  const states = [
    { d: K.TODAY, f: K.phaseOf(K.TODAY), line: 'Tonight', note: `${phaseName(K.phaseOf(K.TODAY))} over the Gulf` },
    { d: first, f: 0.035, line: 'The new crescent', note: `Seen at sunset on ${new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(eve)}: a month begins` },
  ];
  const layer = (s, k) => `<div aria-hidden="{{h${k}}}" style="position: absolute; inset: 0; opacity: {{o${k}}}; transition: opacity 900ms ease">
<span style="position: absolute; left: ${195 - 60}px; top: 150px">${K.moon(s.f, 60, { lit: M.moonlight, dark: 'rgba(242,236,221,0.06)', glow: 'rgba(242,236,221,0.45)' })}</span>
<div style="position: absolute; left: 0; right: 0; top: 310px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
${K.label(s.line, N.accent)}
<span style="font-family: ${K.F.arDisplay}; font-size: 34px; font-weight: 700; color: ${M.moonlight}" lang="ar">${K.hijri(s.d, 'ar').replace(/ هـ$/, '')}</span>
<span style="font-weight: 300; font-size: 20px; color: ${M.moonlight}">${K.hijri(s.d, 'en')}</span>
<span style="max-width: 280px; font-size: 14px; line-height: 1.45; color: ${M.mist}">${s.note}</span>
</div>
</div>`;
  const body = `
${K.starfield(40, 390, 520, 9)}
<span style="position: absolute; left: 0; right: 0; top: 64px; display: flex; justify-content: center">${K.logo(N.logoP, N.logoS, 72)}</span>
${states.map(layer).join('')}
<div role="group" aria-label="Which evening" style="position: absolute; left: 60px; right: 60px; top: 520px; height: 48px; padding: 4px; border-radius: 999px; ${K.glass('242,236,221', 0.06)}; display: flex; box-sizing: border-box">
<button type="button" onClick="{{show0}}" style="flex: 1; border: 0; border-radius: 999px; background: {{bg0}}; color: {{c0}}; font-size: 15px; font-weight: 500; cursor: pointer; transition: background 400ms ease, color 400ms ease">Tonight</button>
<button type="button" onClick="{{show1}}" style="flex: 1; border: 0; border-radius: 999px; background: {{bg1}}; color: {{c1}}; font-size: 15px; font-weight: 500; cursor: pointer; transition: background 400ms ease, color 400ms ease">New month</button>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: 600px; padding: 16px; border-radius: 24px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); display: flex; flex-direction: column; gap: 6px">
${K.label('Home header', M.haze)}
<span style="font-size: 14.5px; line-height: 1.5; color: ${M.mist}">Home's moon, named in the Hijri calendar. On the evening a month begins, the header shows the hilal instead: the thin first crescent at sunset.</span>
</div>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { s: 0 };
  }
  renderVals() {
    const s = this.state.s, v = {};
    for (let k = 0; k < 2; k++) {
      v['o' + k] = s === k ? 1 : 0;
      v['h' + k] = s === k ? 'false' : 'true';
      v['bg' + k] = s === k ? '${M.moonlight}' : 'transparent';
      v['c' + k] = s === k ? '${M.midnight}' : '${M.mist}';
      v['show' + k] = () => this.setState({ s: k });
    }
    return v;
  }
}`;
  out.push(K.board('BodyHilal.dc.html', { title: 'Home header — hilal and the Hijri date', root: `background: ${M.midnight}`, body, logic }));
})();

/* ── C4 · Month of moons (Stardust ring): the Hijri month's 30 nights in their real phases ── */
(() => {
  const today = hijriDay(K.TODAY);
  const start = addDays(K.TODAY, -(today - 1));
  const days = Array.from({ length: 30 }, (_, i) => { const d = addDays(start, i); return { i, d, f: K.phaseOf(d), h: hijriDay(d) }; });
  const R = 146, cx = 195, cy = 360;
  const toneAt = (i) => [N.tone.dusk, N.tone.glow, M.moonlight, N.tone.dawn, N.tone.bloom][Math.min(4, Math.floor((i / 30) * 5))];
  const moonBtn = (x, k) => {
    const a = (-90 + (k / 30) * 360) * (Math.PI / 180);
    const px = cx + R * Math.cos(a), py = cy + R * Math.sin(a);
    return `<button type="button" onClick="{{pick${k}}}" aria-label="${K.hijri(x.d, 'en')}" style="position: absolute; left: ${(px - 16).toFixed(1)}px; top: ${(py - 16).toFixed(1)}px; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 999px; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center">
<span style="position: absolute; inset: 0; border-radius: 999px; border: 1.5px solid ${M.moonlight}; opacity: {{r${k}}}; transition: opacity 300ms ease"></span>
${K.moon(x.f, 9, { lit: toneAt(k), dark: 'rgba(242,236,221,0.09)' })}
</button>`;
  };
  const nextNew = (() => { let n = 0; for (let i = 1; i < 31; i++) { const f = K.phaseOf(addDays(K.TODAY, i)); if (f < 0.034 || f > 0.966) { n = i; break; } } return n; })();
  const info = days.map((x) => ({ day: K.hijri(x.d, 'en'), phase: phaseName(x.f), greg: new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(x.d) }));
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(60% 40% at 50% 43%, #1A2150 0%, ${M.midnight} 70%)"></span>
${K.starfield(30, 390, 844, 21)}
<div style="position: absolute; left: 24px; top: 60px; display: flex; flex-direction: column; gap: 6px">
${K.label('The month', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 30px; color: ${M.moonlight}">${new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', { month: 'long' }).format(K.TODAY)} <span style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 26px; color: ${M.mist}" lang="ar">${new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { month: 'long' }).format(K.TODAY)}</span></span>
</div>
${days.map(moonBtn).join('')}
<div style="position: absolute; left: ${cx - 100}px; top: ${cy - 70}px; width: 200px; height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center">
${K.label('{{phase}}', M.mist)}
<span style="font-weight: 300; font-size: 44px; line-height: 1; color: ${M.moonlight}">{{day}}</span>
<span style="font-size: 14px; color: ${M.haze}">{{greg}}</span>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 560px; display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; justify-content: space-between; align-items: baseline"><span style="font-size: 16px; color: ${M.moonlight}">New moon in <span style="font-weight: 300; font-size: 22px">${nextNew}</span> days</span>${K.label('Tonight · ' + phaseName(K.phaseOf(K.TODAY)), M.haze, 10)}</div>
<span style="font-size: 14.5px; line-height: 1.5; color: ${M.mist}">Every night of the Hijri month, in the phase it will have. Tap one to see it; tonight has the ring. Nights you practised could glow brighter (see Graphs).</span>
</div>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: ${today - 1} };
  }
  renderVals() {
    const info = ${JSON.stringify(info)};
    const s = this.state.sel, v = { day: info[s].day, phase: info[s].phase, greg: info[s].greg };
    for (let k = 0; k < 30; k++) {
      v['r' + k] = k === s ? 1 : (k === ${today - 1} ? 0.3 : 0);
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  out.push(K.board('BodyMonthRing.dc.html', { title: 'The month of moons', root: `background: ${M.midnight}`, body, logic }));
})();

/* ── C5 · Star-lattice sun (Sunrise): the rays are khatam geometry, turning slowly ── */
(() => {
  const cx = 195, cy = 340;
  const ring = (r, rot, sw, color, op) => `<polygon points="${K.star8(cx, cy, r, rot)}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="${op}"></polygon>`;
  const css = `.turnA { transform-origin: ${cx}px ${cy}px; animation: spin 90s linear infinite } .turnB { transform-origin: ${cx}px ${cy}px; animation: spinBack 120s linear infinite }
@keyframes sunBreath { 0%,100% { transform: scale(1) } 50% { transform: scale(1.03) } }`;
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(70% 45% at 50% 40%, #FFF3E6 0%, ${S.ground} 70%)"></span>
<svg width="390" height="700" viewBox="0 0 390 700" aria-hidden="true" style="position: absolute; left: 0; top: 0">
<g class="turnA">${ring(160, 0, 1, S.tone.dawn, 0.35)}${ring(128, 22.5, 1, S.hue.dawn, 0.5)}</g>
<g class="turnB">${ring(196, 11.25, 0.8, S.tone.dawn, 0.2)}${ring(100, 0, 1.2, S.hue.dawn, 0.6)}</g>
</svg>
<div aria-hidden="true" style="position: absolute; left: ${cx - 66}px; top: ${cy - 66}px; width: 132px; height: 132px; border-radius: 999px; background: ${K.DISCS.sunrise.stops}; box-shadow: 0 0 40px rgba(${K.DISCS.sunrise.glow},0.6); animation: sunBreath 5s ease-in-out infinite">${K.pressedMark(64, K.DISCS.sunrise.surface)}</div>
<span style="position: absolute; left: 0; right: 0; top: 60px; display: flex; justify-content: center">${K.logo(S.logoP, S.logoS, 72)}</span>
<div style="position: absolute; left: 24px; right: 24px; top: 580px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
${K.label('Houna sunrise', S.accent)}
<span style="font-family: ${K.F.display}; font-size: 24px; color: ${S.text}">A sun woven from stars</span>
<span style="font-size: 15px; line-height: 1.5; color: ${S.sec}">Four eight-point stars turn in opposite directions, so the rays never quite settle: slow enough to watch, never enough to hurry you.</span>
</div>`;
  out.push(K.board('BodyStarSun.dc.html', { title: 'Sunrise — the star-lattice sun', root: `background: ${S.ground}`, css, body }));
})();

/* ── C6 · Sky clock: dawn, day, dusk and night in one loop, the bodies crossing ── */
(() => {
  const L = 28; // seconds
  const layerKf = (name, on) => `@keyframes ${name} { ${on.map(([t, o]) => `${t}% { opacity: ${o} }`).join(' ')} }`;
  const css = `${layerKf('skyDawn', [[0, 1], [18, 1], [28, 0], [90, 0], [100, 1]])}
${layerKf('skyDay', [[0, 0], [18, 0], [28, 1], [42, 1], [52, 0], [100, 0]])}
${layerKf('skyDusk', [[0, 0], [42, 0], [52, 1], [64, 1], [74, 0], [100, 0]])}
${layerKf('skyNight', [[0, 0], [64, 0], [74, 1], [90, 1], [100, 0]])}
@keyframes sunArc { 0% { transform: rotate(-40deg) } 66% { transform: rotate(40deg) } 100% { transform: rotate(40deg) } }
@keyframes sunShow { 0% { opacity: 1 } 62% { opacity: 1 } 68% { opacity: 0 } 96% { opacity: 0 } 100% { opacity: 1 } }
@keyframes moonArc { 0% { transform: rotate(-40deg) } 60% { transform: rotate(-40deg) } 100% { transform: rotate(22deg) } }
@keyframes moonShow { 0% { opacity: 0 } 64% { opacity: 0 } 72% { opacity: 1 } 94% { opacity: 1 } 100% { opacity: 0 } }
${layerKf('wDawn', [[0, 1], [20, 1], [25, 0], [95, 0], [100, 1]])}
${layerKf('wDay', [[0, 0], [22, 0], [27, 1], [45, 1], [50, 0], [100, 0]])}
${layerKf('wDusk', [[0, 0], [47, 0], [52, 1], [67, 1], [72, 0], [100, 0]])}
${layerKf('wNight', [[0, 0], [70, 0], [75, 1], [93, 1], [98, 0], [100, 0]])}`;
  const sky = (bg, name) => `<span style="position: absolute; inset: 0; background: ${bg}; animation: ${name} ${L}s linear infinite"></span>`;
  const word = (t, name, color) => `<span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: ${K.F.display}; font-size: 28px; color: ${color}; opacity: 0; animation: ${name} ${L}s linear infinite">${t}</span>`;
  const body = `
${sky(`linear-gradient(180deg, #F9D7C0 0%, ${S.hue.dawn} 55%, #F3E3D3 100%)`, 'skyDawn')}
${sky(`linear-gradient(180deg, #D8EEF2 0%, ${S.ground} 60%, #FFFFFF 100%)`, 'skyDay')}
${sky(`linear-gradient(180deg, ${D.tone.dusk} 0%, #B67AA0 45%, ${N.tone.dawn} 85%)`, 'skyDusk')}
${sky(`linear-gradient(180deg, ${M.midnight} 0%, ${M.nightfall} 60%, #1C2452 100%)`, 'skyNight')}
<span style="position: absolute; inset: 0; animation: skyNight ${L}s linear infinite">${K.starfield(40, 390, 520, 13)}</span>
<div aria-hidden="true" style="position: absolute; left: 195px; top: 760px; width: 0; height: 0; animation: sunArc ${L}s ease-in-out infinite"><span style="position: absolute; left: -44px; top: -464px; width: 88px; height: 88px; border-radius: 999px; background: ${K.DISCS.sunrise.stops}; box-shadow: 0 0 40px rgba(249,169,128,0.7); animation: sunShow ${L}s linear infinite"></span></div>
<div aria-hidden="true" style="position: absolute; left: 195px; top: 760px; width: 0; height: 0; animation: moonArc ${L}s ease-in-out infinite"><span style="position: absolute; left: -38px; top: -438px; animation: moonShow ${L}s linear infinite">${K.moon(K.phaseOf(K.TODAY), 38, { lit: M.moonlight, dark: 'rgba(242,236,221,0.08)', glow: 'rgba(242,236,221,0.5)' })}</span></div>
<svg width="390" height="300" viewBox="0 0 390 300" aria-hidden="true" style="position: absolute; left: 0; top: 544px"><path d="M0 30 Q100 0 200 22 T390 14 V300 H0 Z" fill="rgba(11,16,38,0.55)"></path><path d="M0 70 Q140 36 260 64 T390 58 V300 H0 Z" fill="rgba(11,16,38,0.8)"></path></svg>
<div aria-hidden="true" style="position: absolute; left: 0; right: 0; top: 650px; height: 40px">${word('Dawn', 'wDawn', '#FFFFFF')}${word('Day', 'wDay', '#FFFFFF')}${word('Dusk', 'wDusk', '#FFFFFF')}${word('Night', 'wNight', M.moonlight)}</div>
<span style="position: absolute; left: 32px; right: 32px; top: 710px; text-align: center; font-size: 14.5px; line-height: 1.5; color: rgba(242,236,221,0.85)">One sky through the day: Home could follow the hour, and the theme you picked stays yours.</span>`;
  out.push(K.board('BodySkyClock.dc.html', { title: 'The sky clock', root: `background: ${M.midnight}`, css, body }));
})();

/* ── C7 · Lantern moon (Ramadan): a fanous of lattice glowing under the crescent ── */
(() => {
  const css = `@keyframes flicker { 0%,100% { opacity: 0.85 } 20% { opacity: 1 } 40% { opacity: 0.78 } 60% { opacity: 0.95 } 80% { opacity: 0.82 } }
@keyframes swing { 0%,100% { transform: rotate(-2.5deg) } 50% { transform: rotate(2.5deg) } }`;
  const lx = 195, ly = 300;
  let panes = '';
  for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) panes += `<polygon points="${K.star8(lx - 22 + i * 44, 284 + j * 44, 16)}" fill="none" stroke="#2A1E14" stroke-width="3"></polygon>`;
  const body = `
${K.starfield(50, 390, 844, 31)}
<span style="position: absolute; left: 238px; top: 70px">${K.moon(0.1, 34, { lit: '#FFE3B8', dark: 'rgba(242,236,221,0.05)', glow: 'rgba(242,184,128,0.7)' })}</span>
<span style="position: absolute; left: ${lx - 150}px; top: ${ly - 60}px; width: 300px; height: 360px; background: radial-gradient(closest-side, rgba(242,184,128,0.45), rgba(242,184,128,0)); animation: flicker 3.2s ease-in-out infinite"></span>
<div aria-hidden="true" style="position: absolute; left: ${lx - 70}px; top: 150px; width: 140px; height: 330px; transform-origin: 70px 0; animation: swing 6s ease-in-out infinite">
<svg width="140" height="330" viewBox="${lx - 70} 150 140 330" style="overflow: visible">
<line x1="${lx}" y1="150" x2="${lx}" y2="200" stroke="${M.mist}" stroke-width="1.2"></line>
<circle cx="${lx}" cy="206" r="6" fill="none" stroke="#C7A06A" stroke-width="2"></circle>
<path d="M${lx - 34} 250 L${lx} 212 L${lx + 34} 250 Z" fill="#8A6A3E"></path>
<rect x="${lx - 52}" y="250" width="104" height="160" rx="10" fill="#FFD9A0" style="animation: flicker 3.2s ease-in-out infinite"></rect>
<rect x="${lx - 52}" y="250" width="104" height="160" rx="10" fill="none" stroke="#8A6A3E" stroke-width="4"></rect>
${panes}
<path d="M${lx - 40} 410 L${lx + 40} 410 L${lx + 24} 438 L${lx - 24} 438 Z" fill="#8A6A3E"></path>
</svg>
</div>
<div style="position: absolute; left: 0; right: 0; top: 540px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
<span lang="ar" style="font-family: ${K.F.arDisplay}; font-weight: 700; font-size: 40px; color: #FFE3B8">رمضان كريم</span>
<span style="font-family: ${K.F.display}; font-size: 20px; color: ${M.moonlight}">A gentle Ramadan for you</span>
<span style="max-width: 300px; font-size: 14.5px; line-height: 1.5; color: ${M.mist}">A seasonal Home: the lantern's lattice is the same eight-point star as the breathing boards, lit from inside.</span>
</div>`;
  out.push(K.board('BodyLantern.dc.html', { title: 'Ramadan — lantern moon', root: `background: ${M.midnight}`, css, body }));
})();

/* ── C8 · Glass eclipse: a pane of glass drifts across the teal moon; its ring lights as they meet ── */
(() => {
  const css = `@keyframes paneDrift { 0% { transform: translateX(-230px) } 45%,55% { transform: translateX(0) } 100% { transform: translateX(230px) } }
@keyframes corona { 0%,35% { opacity: 0; transform: scale(0.9) } 50% { opacity: 1; transform: scale(1.08) } 65%,100% { opacity: 0; transform: scale(0.9) } }`;
  const body = `
${K.starfield(40, 390, 844, 41)}
<span aria-hidden="true" style="position: absolute; left: ${195 - 130}px; top: ${360 - 130}px; width: 260px; height: 260px; border-radius: 999px; background: radial-gradient(closest-side, rgba(111,214,207,0) 58%, rgba(111,214,207,0.75) 64%, rgba(111,214,207,0) 100%); animation: corona 12s ease-in-out infinite"></span>
<div aria-hidden="true" style="position: absolute; left: ${195 - 80}px; top: ${360 - 80}px; width: 160px; height: 160px; border-radius: 999px; background: ${K.DISCS.teal.stops}; box-shadow: 0 0 30px rgba(111,214,207,0.45)">${K.pressedMark(78, K.DISCS.teal.surface)}</div>
<div aria-hidden="true" style="position: absolute; left: ${195 - 84}px; top: ${360 - 84}px; width: 168px; height: 168px; border-radius: 999px; ${K.glass('11,16,38', 0.35, 10)}; box-shadow: inset 0 0 30px rgba(242,236,221,0.12); animation: paneDrift 12s ease-in-out infinite"></div>
<div style="position: absolute; left: 24px; right: 24px; top: 600px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
${K.label('Houna moon', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 24px; color: ${M.moonlight}">An eclipse of glass</span>
<span style="font-size: 15px; line-height: 1.5; color: ${M.mist}">A frosted pane crosses the moon; where they meet, its ring lights. A loading or waiting state that still feels like breathing.</span>
</div>`;
  out.push(K.board('BodyGlassEclipse.dc.html', { title: 'Houna moon — glass eclipse', root: `background: ${M.midnight}`, css, body }));
})();

module.exports = out;
if (require.main === module) console.log(out.map((b) => b.file).join('\n'));
