// A · Meditation player: nine phones. Inspiration: Open's daily hero and minutes wheel, TIDE's
// arched scene gallery and alarm ring, Hatch's grainy cards.
const K = require('./kit.js');
const { icon } = require('./icons.js');
const N = K.T.night, D = K.T.dusk;
const M = K.NIGHT;
const out = [];

/* ── A1 / A8 · Today hero (Open), a layer per tab that crossfades while the glow slides ── */
function today(lang) {
  const isAr = lang === 'ar';
  const disp = isAr ? K.F.arDisplay : K.F.display;
  const tabs = isAr ? ['تأمل', 'تنفّس', 'يوميات', 'اكتشف'] : ['Meditate', 'Breathe', 'Journal', 'Discover'];
  const LAYERS = [
    { blobs: [K.SCENES.fire.c, K.SCENES.fire.lo, N.tone.dawn], eyebrow: isAr ? 'تأمل · نار · ١٠ دقائق' : 'Meditate · Fire · 10 min', title: isAr ? 'اجلس<br>قرب النار' : 'Sit by<br>the fire' },
    { blobs: [N.tone.glow, K.NIGHT.teal, N.tone.dusk], eyebrow: isAr ? 'تهدئة القلق · ٣ دقائق' : 'Anxiety relief · 3 min', title: isAr ? 'تنفّس<br>٤ · ٧ · ٨' : 'Breathe<br>4 · 7 · 8' },
    { blobs: [N.tone.bloom, N.tone.dusk, '#B24B6B'], eyebrow: isAr ? 'يوميات · على هذا الهاتف' : 'Journal · on this phone', title: isAr ? 'اكتب<br>سطرًا واحدًا' : 'Write<br>one line' },
    { blobs: [N.tone.dusk, K.SCENES.ocean.c, K.SCENES.ocean.lo], eyebrow: isAr ? 'اكتشف · ستة تأملات' : 'Discover · six reflections', title: isAr ? 'اعرف<br>نفسك' : 'Know<br>yourself' },
  ];
  const blob = (c, l, t, s, anim, dur, a = 0.85) => `<span style="position: absolute; left: ${l}px; top: ${t}px; width: ${s}px; height: ${s}px; border-radius: 999px; background: radial-gradient(circle, ${c} 0%, rgba(${K.rgbOf(c)},0) 68%); opacity: ${a}; filter: blur(30px); animation: ${anim} ${dur}s ease-in-out infinite"></span>`;
  const layer = (L, k) => `<div aria-hidden="{{h${k}}}" style="position: absolute; inset: 0; opacity: {{o${k}}}; transition: opacity 900ms ease">
${blob(L.blobs[0], -60, 40, 420, 'drift', 16)}${blob(L.blobs[1], 120, 260, 380, 'drift2', 19, 0.7)}${blob(L.blobs[2], 60, 420, 300, 'drift', 23, 0.6)}
<span style="position: absolute; left: 0; right: 0; bottom: 0; height: 520px; background: linear-gradient(180deg, rgba(11,16,38,0) 0%, rgba(11,16,38,0.75) 45%, ${M.midnight} 78%)"></span>
<div style="position: absolute; ${isAr ? 'right' : 'left'}: 24px; top: 520px; width: 250px; display: flex; flex-direction: column; gap: 8px">
<span style="font-family: ${isAr ? K.F.arBody : K.F.body}; font-size: 15px; color: ${M.mist}">${L.eyebrow}</span>
<span style="font-family: ${disp}; font-size: ${isAr ? 46 : 44}px; line-height: ${isAr ? 1.25 : 1.02}; color: ${M.moonlight}; ${isAr ? '' : 'text-transform: uppercase; letter-spacing: 0.01em'}">${L.title}</span>
</div>
</div>`;
  const TAB_W = 88;
  const tabBtn = (t, k) => `<button type="button" onClick="{{pick${k}}}" style="position: relative; width: ${TAB_W}px; height: 48px; border: 0; background: none; cursor: pointer; font-family: ${isAr ? K.F.arBody : K.F.body}; font-size: ${isAr ? 16 : 15.5}px; font-weight: 500; color: {{c${k}}}; transition: color 400ms ease">${t}</button>`;
  const glowSide = isAr ? 'right' : 'left';
  const body = `
${LAYERS.map(layer).join('\n')}
<div style="position: absolute; ${isAr ? 'right' : 'left'}: 24px; top: 64px; display: flex; flex-direction: column; gap: 6px">
${isAr ? K.arLabel(K.gregorian(K.TODAY, 'ar'), M.mist) : K.label(K.gregorian(K.TODAY, 'en'), M.mist)}
<span style="font-family: ${isAr ? K.F.arDisplay : K.F.body}; font-weight: ${isAr ? 700 : 300}; font-size: 22px; color: ${M.moonlight}">${K.hijri(K.TODAY, lang)}</span>
</div>
<button type="button" aria-label="${isAr ? 'التذكيرات' : 'Reminders'}" style="position: absolute; ${isAr ? 'left' : 'right'}: 20px; top: 64px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.08)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('bell', 20)}</button>
<button type="button" aria-label="${isAr ? 'ابدأ' : 'Play'}" style="position: absolute; ${isAr ? 'left' : 'right'}: 24px; top: 600px; width: 80px; height: 80px; border-radius: 999px; border: 1.5px solid ${M.moonlight}; background: rgba(242,236,221,0.04); box-shadow: 0 0 24px rgba(242,236,221,0.35), inset 0 0 18px rgba(242,236,221,0.18); display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer; animation: glowPulse 5s ease-in-out infinite">${icon('play', 26)}</button>
<span aria-hidden="true" style="position: absolute; ${glowSide}: {{gx}}px; top: 736px; width: 120px; height: 64px; border-radius: 999px; background: radial-gradient(closest-side, rgba(242,236,221,0.28), rgba(242,236,221,0)); transition: ${glowSide} 520ms cubic-bezier(.3,1.3,.5,1)"></span>
<div role="tablist" style="position: absolute; ${isAr ? 'right' : 'left'}: 20px; top: 744px; display: flex">${tabs.map(tabBtn).join('')}</div>
<span style="position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: rgba(242,236,221,0.06)"></span>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { tab: 0 };
  }
  renderVals() {
    const t = this.state.tab;
    const v = { gx: 20 + ${TAB_W} * t - 16 };
    for (let k = 0; k < 4; k++) {
      v['o' + k] = t === k ? 1 : 0;
      v['h' + k] = t === k ? 'false' : 'true';
      v['c' + k] = t === k ? '${M.moonlight}' : '${M.haze}';
      v['pick' + k] = () => this.setState({ tab: k });
    }
    return v;
  }
}`;
  return K.board(isAr ? 'MeditateTodayAr.dc.html' : 'MeditateToday.dc.html', { title: isAr ? 'اليوم — تأمل' : 'Today — meditate hero', lang, root: `background: ${M.midnight}`, body, logic });
}

/* ── A2 / A9 · Arch gallery (TIDE): scenes in mihrab arches over the chosen scene, blurred ── */
const GALLERY = [
  { key: 'fire', en: 'Fire', ar: 'نار', img: K.ASSET.fireJpg },
  { key: 'rain', en: 'Rain', ar: 'مطر', img: K.ASSET.rainJpg },
  { key: 'forest', en: 'Creek', ar: 'جدول', img: K.ASSET.forestJpg },
  { key: 'ocean', en: 'Ocean', ar: 'محيط', grad: `linear-gradient(180deg, ${K.SCENES.ocean.hi} 0%, ${K.SCENES.ocean.c} 46%, ${K.SCENES.ocean.lo} 100%)` },
  { key: 'sky', en: 'Night sky', ar: 'سماء الليل', grad: `radial-gradient(circle at 60% 30%, #2A3570 0%, ${M.nightfall} 45%, ${M.midnight} 100%)`, stars: true },
  { key: 'dunes', en: 'Desert dusk', ar: 'غروب الصحراء', grad: `linear-gradient(180deg, ${N.tone.dusk} 0%, ${N.tone.bloom} 45%, ${N.tone.dawn} 70%, #A8621F 100%)`, dunes: true },
];
function archFace(g, w, h, idp) {
  const inner = g.img
    ? `<img src="${g.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover">`
    : `<span style="position: absolute; inset: 0; background: ${g.grad}"></span>${g.stars ? `<span style="position: absolute; inset: 0">${K.starfield(14, w, h * 0.7, 3)}</span><span style="position: absolute; left: ${w * 0.56}px; top: ${h * 0.2}px">${K.moon(0.2, 11, { lit: M.moonlight, dark: 'rgba(242,236,221,0.08)', glow: 'rgba(242,236,221,0.6)' })}</span>` : ''}${g.dunes ? `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" style="position: absolute; inset: 0"><circle cx="${w * 0.35}" cy="${h * 0.55}" r="${w * 0.14}" fill="#FFE9D3" opacity="0.9"></circle><path d="M0 ${h * 0.68} Q${w * 0.35} ${h * 0.56} ${w * 0.7} ${h * 0.7} T${w} ${h * 0.66} V${h} H0 Z" fill="#C7794A" opacity="0.85"></path><path d="M0 ${h * 0.82} Q${w * 0.45} ${h * 0.7} ${w} ${h * 0.84} V${h} H0 Z" fill="#8A4A2A"></path></svg>` : ''}`;
  return `<span style="position: absolute; inset: 0; ${K.archClip(w, h)}">${inner}${K.grain(idp + g.key, 0.1)}</span>`;
}
function gallery(lang) {
  const isAr = lang === 'ar';
  const W = 104, H = 152, GAP = 16;
  const x0 = (390 - (3 * W + 2 * GAP)) / 2;
  const bg = (g, k) => `<div aria-hidden="true" style="position: absolute; inset: -40px; opacity: {{bg${k}}}; transition: opacity 900ms ease">${g.img ? `<img src="${g.img}" alt="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(34px) saturate(0.9); transform: scale(1.15)">` : `<span style="position: absolute; inset: 0; background: ${g.grad}; filter: blur(30px)"></span>`}</div>`;
  const cell = (g, k) => {
    const col = k % 3, row = Math.floor(k / 3);
    const x = isAr ? 390 - x0 - W - col * (W + GAP) : x0 + col * (W + GAP);
    const y = 294 + row * (H + 58);
    return `<button type="button" onClick="{{pick${k}}}" aria-label="${isAr ? g.ar : g.en}" aria-pressed="{{p${k}}}" style="position: absolute; left: ${x}px; top: ${y}px; width: ${W}px; height: ${H + 40}px; padding: 0; border: 0; background: none; cursor: pointer">
<span style="position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform: scale({{s${k}}}); transition: transform 500ms cubic-bezier(.3,1.3,.5,1)">
${archFace(g, W, H, 'g' + lang)}
<svg width="${W + 8}" height="${H + 8}" viewBox="-4 -4 ${W + 8} ${H + 8}" aria-hidden="true" style="position: absolute; left: -4px; top: -4px; overflow: visible; opacity: {{sel${k}}}; transition: opacity 400ms ease"><path d="${K.archPath(W, H)}" fill="none" stroke="${M.moonlight}" stroke-width="2.5"></path></svg>
<span aria-hidden="true" style="position: absolute; left: ${W / 2 - 14}px; top: ${H / 2 - 10}px; display: flex; gap: 4px; align-items: flex-end; height: 22px; opacity: {{sel${k}}}; transition: opacity 400ms ease">${[0, 1, 2, 3].map((b) => `<span style="width: 3px; height: 22px; border-radius: 2px; background: ${M.moonlight}; transform-origin: bottom; animation: bars ${0.8 + b * 0.17}s ease-in-out ${-b * 0.3}s infinite"></span>`).join('')}</span>
</span>
<span style="position: absolute; left: -8px; right: -8px; top: ${H + 12}px; text-align: center; font-family: ${isAr ? K.F.arBody : K.F.body}; font-size: 15px; font-weight: 500; color: {{c${k}}}; transition: color 400ms ease; white-space: nowrap">${isAr ? g.ar : g.en}</span>
</button>`;
  };
  const chip = (ic, a, b) => `<span style="height: 44px; padding: 0 16px; border-radius: 16px; ${K.glass('242,236,221', 0.08)}; display: flex; align-items: center; gap: 10px; color: ${M.moonlight}; font-size: 15px">${icon(ic, 18)}<span>${a}</span><span style="color: ${M.haze}">${b}</span></span>`;
  const body = `
${GALLERY.map(bg).join('')}
<span style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,16,38,0.55) 0%, rgba(11,16,38,0.35) 40%, rgba(11,16,38,0.85) 100%)"></span>
<button type="button" aria-label="${isAr ? 'إغلاق' : 'Close'}" style="position: absolute; ${isAr ? 'left' : 'right'}: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.14)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('close', 20)}</button>
<div style="position: absolute; ${isAr ? 'right' : 'left'}: 24px; top: 116px; display: flex; flex-direction: column; gap: 10px">
${isAr ? K.arLabel('المشاهد', N.accent) : K.label('Scenes', N.accent)}
<span style="font-family: ${isAr ? K.F.arDisplay : K.F.display}; font-size: ${isAr ? 34 : 32}px; line-height: 1.15; color: ${M.moonlight}">${isAr ? 'اختر مكانًا<br>للراحة' : 'Choose a place<br>to rest'}</span>
</div>
<div style="position: absolute; ${isAr ? 'right' : 'left'}: 24px; top: 224px; display: flex; gap: 10px">${isAr ? chip('timer', 'المؤقت', '١٠ د') + chip('sound', 'الصوت', 'يعمل') : chip('timer', 'Timer', '10 min') + chip('sound', 'Sound', 'On')}</div>
${GALLERY.map(cell).join('\n')}
<button type="button" style="position: absolute; left: 24px; right: 24px; top: 756px; height: 56px; border-radius: 999px; border: 0; background: ${M.moonlight}; color: ${M.midnight}; font-family: ${isAr ? K.F.arBody : K.F.body}; font-size: 17px; font-weight: 600; box-shadow: 0 0 32px rgba(242,236,221,0.25); cursor: pointer">${isAr ? 'ابدأ في {{name}}' : 'Begin with {{name}}'}</button>`;
  const names = GALLERY.map((g) => (isAr ? g.ar : g.en));
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 1 };
  }
  renderVals() {
    const s = this.state.sel;
    const names = ${JSON.stringify(names)};
    const v = { name: names[s] };
    for (let k = 0; k < 6; k++) {
      v['bg' + k] = s === k ? 1 : 0;
      v['sel' + k] = s === k ? 1 : 0;
      v['s' + k] = s === k ? 1.04 : 1;
      v['p' + k] = s === k ? 'true' : 'false';
      v['c' + k] = s === k ? '${M.moonlight}' : '${M.haze}';
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  return K.board(isAr ? 'MeditateArchesAr.dc.html' : 'MeditateArches.dc.html', { title: isAr ? 'المشاهد — أقواس' : 'Scenes — arch gallery', lang, root: `background: ${M.midnight}`, body, logic });
}

/* ── A3 · Arch expand: the tapped arch becomes the full-screen player (the clip path interpolates) ── */
function archExpand() {
  const W = 108, H = 164, GAP = 14;
  const x0 = (390 - (3 * W + 2 * GAP)) / 2, y0 = 330;
  const rainX = x0 + W + GAP;
  const closed = K.archPath(W, H, rainX, y0);
  const open = K.archPath(1000, 1000, -305, -100);
  const faces = [GALLERY[0], GALLERY[1], GALLERY[2]];
  const cells = faces.map((g, k) => `<div aria-hidden="true" style="position: absolute; left: ${x0 + k * (W + GAP)}px; top: ${y0}px; width: ${W}px; height: ${H}px; opacity: {{dim}}; transition: opacity 500ms ease">${archFace(g, W, H, 'x')}</div>`).join('');
  const body = `
<span style="position: absolute; inset: 0; background: radial-gradient(120% 60% at 50% 20%, ${M.nightfall} 0%, ${M.midnight} 70%)"></span>
<div style="position: absolute; left: 24px; top: 120px; display: flex; flex-direction: column; gap: 10px; opacity: {{dim}}; transition: opacity 500ms ease">
${K.label('Tonight', N.accent)}
<span style="font-family: ${K.F.display}; font-size: 32px; line-height: 1.15; color: ${M.moonlight}">Where would you<br>like to be?</span>
</div>
${cells}
<button type="button" onClick="{{toggle}}" aria-label="Open Rain" style="position: absolute; left: ${rainX}px; top: ${y0}px; width: ${W}px; height: ${H}px; border: 0; padding: 0; background: none; cursor: pointer"></button>
<span style="position: absolute; left: 0; right: 0; top: ${y0 + H + 20}px; display: flex; justify-content: center; gap: ${GAP + 34}px; font-size: 15px; color: ${M.mist}; opacity: {{dim}}; transition: opacity 500ms ease"><span>Fire</span><span style="color: ${M.moonlight}">Rain</span><span>Creek</span></span>
<span style="position: absolute; left: 0; right: 0; top: 620px; text-align: center; font-size: 14px; color: ${M.haze}; opacity: {{dim}}; transition: opacity 500ms ease">Tap Rain</span>
<div style="position: absolute; inset: 0; clip-path: path('{{clip}}'); transition: clip-path 900ms cubic-bezier(.22,.9,.25,1); pointer-events: {{pe}}">
<video src="${K.ASSET.rainMp4}" poster="${K.ASSET.rainJpg}" autoplay="" muted="" loop="" playsinline="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover"></video>
<span style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,16,38,0.35) 0%, rgba(11,16,38,0.1) 40%, rgba(11,16,38,0.8) 100%)"></span>
<div style="position: absolute; inset: 0; opacity: {{ui}}; transition: opacity 500ms ease {{uiDelay}}">
<button type="button" onClick="{{toggle}}" aria-label="Close" style="position: absolute; left: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.14)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('close', 20)}</button>
<div style="position: absolute; left: 0; right: 0; top: 540px; display: flex; flex-direction: column; align-items: center; gap: 10px">
${K.label('Meditate', M.mist)}
<span style="font-family: ${K.F.display}; font-size: 48px; color: ${M.moonlight}">Rain</span>
<span style="font-weight: 300; font-size: 40px; color: ${M.moonlight}; font-variant-numeric: tabular-nums">10:00</span>
</div>
<button type="button" aria-label="Play" style="position: absolute; left: 155px; top: 710px; width: 80px; height: 80px; border-radius: 999px; border: 1.5px solid ${M.moonlight}; background: rgba(242,236,221,0.06); box-shadow: 0 0 24px rgba(242,236,221,0.35); display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('play', 26)}</button>
</div>
</div>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { open: false };
  }
  renderVals() {
    const o = this.state.open;
    return {
      clip: o ? ${JSON.stringify(open)} : ${JSON.stringify(closed)},
      pe: o ? 'auto' : 'none',
      ui: o ? 1 : 0,
      uiDelay: o ? '450ms' : '0ms',
      dim: o ? 0 : 1,
      toggle: () => this.setState({ open: !o }),
    };
  }
}`;
  return K.board('MeditateArchExpand.dc.html', { title: 'Scenes — arch expands to player', root: `background: ${M.midnight}`, body, logic });
}

/* ── A4 · Minutes wheel (Open) ── */
function minutes() {
  const OPTS = [{ n: '5', u: 'min' }, { n: '10', u: 'min' }, { n: '20', u: 'min' }, { n: '∞', u: 'open' }];
  const ROW = 76, TOP = 236, VIEW = 380;
  const item = (o, k) => `<button type="button" onClick="{{pick${k}}}" style="height: ${ROW}px; width: 100%; border: 0; background: none; cursor: pointer; display: flex; align-items: baseline; justify-content: center; gap: 10px; color: ${M.moonlight}; opacity: {{op${k}}}; transform: scale({{sc${k}}}); transition: opacity 500ms ease, transform 500ms cubic-bezier(.3,1.2,.5,1)"><span style="font-weight: 300; font-size: 52px; line-height: ${ROW}px; font-variant-numeric: tabular-nums">${o.n}</span><span style="font-size: 26px; font-weight: 300; opacity: {{uo${k}}}; transition: opacity 400ms ease">${o.u}</span></button>`;
  const tile = (a, b) => `<div style="flex: 1; height: 76px; border-radius: 20px; background: rgba(242,236,221,0.06); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px"><span style="font-size: 13.5px; color: ${M.haze}">${a}</span><span style="font-size: 17px; color: ${M.moonlight}">${b}</span></div>`;
  const body = `
<button type="button" aria-label="Back" style="position: absolute; left: 12px; top: 56px; width: 48px; height: 48px; border: 0; background: none; color: ${M.moonlight}; display: flex; align-items: center; justify-content: center; cursor: pointer">${icon('backLong', 24, 1.4)}</button>
<div style="position: absolute; left: 90px; top: 58px; display: flex; gap: 28px; font-size: 16.5px">
<span style="padding: 12px 4px; color: ${M.haze}">Breathe</span>
<span style="padding: 12px 4px; color: ${M.moonlight}; border-bottom: 1.5px solid ${M.moonlight}">Meditate</span>
</div>
<div style="position: absolute; left: 0; right: 0; top: ${TOP}px; height: ${VIEW}px; overflow: hidden; -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%); mask-image: linear-gradient(180deg, transparent 0%, #000 30%, #000 70%, transparent 100%)">
<div style="position: absolute; left: 0; right: 0; top: 0; transform: translateY({{ty}}px); transition: transform 600ms cubic-bezier(.25,1.1,.4,1)">${OPTS.map(item).join('')}</div>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 636px; display: flex; gap: 10px">${tile('Start &amp; end', 'Chime')}${tile('Sound', 'Rain')}${tile('Screen', 'Dim')}</div>
<button type="button" aria-label="Play" style="position: absolute; left: 150px; top: 736px; width: 90px; height: 90px; border-radius: 999px; border: 1.5px solid ${M.moonlight}; background: none; color: ${M.moonlight}; display: flex; align-items: center; justify-content: center; cursor: pointer">${icon('play', 30)}</button>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 1 };
  }
  renderVals() {
    const s = this.state.sel;
    const v = { ty: ${(VIEW - ROW) / 2} - s * ${ROW} };
    for (let k = 0; k < ${OPTS.length}; k++) {
      const d = Math.abs(k - s);
      v['op' + k] = d === 0 ? 1 : d === 1 ? 0.45 : 0.2;
      v['sc' + k] = d === 0 ? 1.12 : 0.9;
      v['uo' + k] = d === 0 ? 1 : 0;
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  return K.board('MeditateMinutes.dc.html', { title: 'Meditate — minutes wheel', root: `background: #06091A`, body, logic });
}

/* ── A5 · Playing, controls away: the ring and its orbiting dot stay; the controls step aside ── */
function playing() {
  const R = 136, C = 2 * Math.PI * R;
  const body = `
<video src="${K.ASSET.forestMp4}" poster="${K.ASSET.forestJpg}" autoplay="" muted="" loop="" playsinline="" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(3px) brightness(0.62) saturate(0.9); transform: scale(1.04)"></video>
<span style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 45%, rgba(11,16,38,0.1) 0%, rgba(11,16,38,0.55) 70%)"></span>
<button type="button" onClick="{{wake}}" aria-label="Show controls" style="position: absolute; inset: 0; border: 0; background: none; cursor: pointer"></button>
<div aria-hidden="true" style="position: absolute; left: ${195 - R - 14}px; top: ${400 - R - 14}px; width: ${2 * R + 28}px; height: ${2 * R + 28}px; pointer-events: none">
<svg width="${2 * R + 28}" height="${2 * R + 28}" viewBox="0 0 ${2 * R + 28} ${2 * R + 28}" style="position: absolute; inset: 0; transform: rotate(-90deg)"><circle cx="${R + 14}" cy="${R + 14}" r="${R}" fill="none" stroke="rgba(242,236,221,0.22)" stroke-width="1.2"></circle><circle cx="${R + 14}" cy="${R + 14}" r="${R}" fill="none" stroke="${M.moonlight}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" style="animation: ringFill 60s linear infinite"></circle></svg>
<span style="position: absolute; inset: 0; animation: spin 60s linear infinite"><span style="position: absolute; left: ${R + 14 - 6}px; top: 8px; width: 12px; height: 12px; border-radius: 999px; background: ${M.moonlight}; box-shadow: 0 0 14px 3px rgba(242,236,221,0.7)"></span></span>
</div>
<div style="position: absolute; left: 0; right: 0; top: 344px; display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none">
<span style="font-weight: 300; font-size: 72px; line-height: 1; color: ${M.moonlight}; font-variant-numeric: tabular-nums">{{time}}</span>
<span style="font-size: 15px; color: ${M.mist}">remaining</span>
</div>
<div style="position: absolute; inset: 0; pointer-events: none; opacity: {{chrome}}; transition: opacity 900ms ease">
<button type="button" onClick="{{wake}}" aria-label="End session" style="pointer-events: {{pe}}; position: absolute; left: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.14)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('close', 20)}</button>
<span style="position: absolute; left: 0; right: 0; top: 70px; text-align: center">${K.label('Creek · 10 min', M.moonlight)}</span>
<div style="position: absolute; left: 0; right: 0; top: 700px; display: flex; justify-content: center; align-items: center; gap: 36px">
<button type="button" onClick="{{wake}}" aria-label="Sound" style="pointer-events: {{pe}}; width: 52px; height: 52px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('sound', 20)}</button>
<button type="button" onClick="{{wake}}" aria-label="Pause" style="pointer-events: {{pe}}; width: 80px; height: 80px; border-radius: 999px; border: 1.5px solid ${M.moonlight}; background: rgba(242,236,221,0.06); display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('pause', 26, 2)}</button>
<button type="button" onClick="{{wake}}" aria-label="Timer" style="pointer-events: {{pe}}; width: 52px; height: 52px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('timer', 20)}</button>
</div>
</div>
<span style="position: absolute; left: 0; right: 0; top: 796px; text-align: center; font-size: 13px; color: ${M.mist}; opacity: {{hint}}; transition: opacity 900ms ease; pointer-events: none">Tap anywhere for controls</span>`;
  const css = `@keyframes ringFill { from { stroke-dashoffset: ${C.toFixed(1)} } to { stroke-dashoffset: 0 } }`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { shown: true, left: 462 };
  }
  componentDidMount() {
    this.hideSoon();
    this.tick = setInterval(() => this.setState({ left: this.state.left > 0 ? this.state.left - 1 : 600 }), 1000);
  }
  componentWillUnmount() {
    clearTimeout(this.timer);
    clearInterval(this.tick);
  }
  hideSoon() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.setState({ shown: false }), 3000);
  }
  renderVals() {
    const s = this.state.left;
    const mm = Math.floor(s / 60), ss = s % 60;
    return {
      time: mm + ':' + (ss < 10 ? '0' : '') + ss,
      chrome: this.state.shown ? 1 : 0,
      hint: this.state.shown ? 0 : 0.8,
      pe: this.state.shown ? 'auto' : 'none',
      wake: () => { this.setState({ shown: true }); this.hideSoon(); },
    };
  }
}`;
  return K.board('MeditatePlaying.dc.html', { title: 'Meditate — playing, controls step aside', root: `background: ${M.midnight}`, css, body, logic });
}

/* ── A6 · Grain cards (Hatch), in Dusk ── */
function cards() {
  const CW = 272, CH = 420, GAP = 18;
  const x0 = (390 - CW) / 2;
  const scene = (k) => {
    const w = CW - 28, h = CH - 110;
    if (k === 0) return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><linearGradient id="dz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${N.tone.dusk}"></stop><stop offset="0.55" stop-color="${N.tone.bloom}"></stop><stop offset="1" stop-color="${N.tone.dawn}"></stop></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#dz)"></rect><circle cx="${w * 0.62}" cy="${h * 0.5}" r="34" fill="#FFF3E4"></circle><path d="M0 ${h * 0.62} Q${w * 0.3} ${h * 0.5} ${w * 0.55} ${h * 0.62} T${w} ${h * 0.58} V${h} H0 Z" fill="#E4826A"></path><path d="M0 ${h * 0.76} Q${w * 0.5} ${h * 0.62} ${w} ${h * 0.8} V${h} H0 Z" fill="#A8621F"></path><path d="M0 ${h * 0.9} Q${w * 0.4} ${h * 0.8} ${w} ${h * 0.92} V${h} H0 Z" fill="#6E3A1C"></path></svg>`;
    if (k === 1) return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><defs><linearGradient id="oz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${M.midnight}"></stop><stop offset="0.6" stop-color="${M.nightfall}"></stop><stop offset="1" stop-color="#1B2A5E"></stop></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#oz)"></rect><circle cx="${w * 0.7}" cy="${h * 0.24}" r="22" fill="${M.moonlight}"></circle><circle cx="${w * 0.7 + 9}" cy="${h * 0.24 - 5}" r="20" fill="${M.midnight}"></circle><rect x="0" y="${h * 0.62}" width="${w}" height="${h * 0.38}" fill="#0E1638"></rect>${[0, 1, 2, 3, 4].map((i) => `<rect x="${w * 0.66 - 10 - i * 3}" y="${h * 0.66 + i * 14}" width="${26 + i * 6}" height="2" rx="1" fill="${M.moonlight}" opacity="${0.5 - i * 0.08}"></rect>`).join('')}</svg>`;
    if (k === 2) return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect width="${w}" height="${h}" fill="${K.SCENES.ocean.lo}"></rect>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M0 ${h * 0.25 + i * 42} Q${w * 0.25} ${h * 0.25 + i * 42 - 22} ${w * 0.5} ${h * 0.25 + i * 42} T${w} ${h * 0.25 + i * 42} V${h} H0 Z" fill="${['#39439E', '#4A55B8', '#5E6AD0', '#7582E4', '#8F9BF0', '#B6BEF7'][i]}" opacity="0.92"></path>`).join('')}</svg>`;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><rect width="${w}" height="${h}" fill="${K.SCENES.rain.lo}"></rect>${[[0.3, 0.3, 30, N.tone.dawn], [0.7, 0.45, 42, K.SCENES.rain.c], [0.45, 0.7, 26, N.tone.bloom], [0.8, 0.2, 18, K.SCENES.rain.hi]].map(([x, y, r, c]) => `<circle cx="${w * x}" cy="${h * y}" r="${r}" fill="${c}" opacity="0.45" filter="blur(6px)"></circle>`).join('')}${Array.from({ length: 22 }, (_, i) => `<rect x="${(i * 37) % w}" y="${(i * 53) % (h - 60)}" width="1.5" height="${22 + (i % 4) * 10}" rx="1" fill="${K.SCENES.rain.hi}" opacity="0.55"></rect>`).join('')}</svg>`;
  };
  const CARDS = [
    { tag: 'Unwind', name: 'Desert at dusk' },
    { tag: 'Sleep', name: 'Night oasis' },
    { tag: 'Settle', name: 'Slow sea' },
    { tag: 'Focus', name: 'Rain on glass' },
  ];
  const card = (c, k) => `<button type="button" onClick="{{pick${k}}}" aria-label="${c.name}" style="flex-shrink: 0; width: ${CW}px; height: ${CH}px; padding: 12px; border-radius: 30px; border: 3px solid {{b${k}}}; background: ${D.card}; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; cursor: pointer; text-align: left; transform: scale({{s${k}}}); transition: transform 500ms ease, border-color 400ms ease">
<span style="padding: 4px 4px 0; font-family: ${K.F.mono}; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: ${D.text}">${c.tag}</span>
<span style="position: relative; flex: 1; border-radius: 20px; overflow: hidden; display: block">${scene(k)}${K.grain('cg' + k, 0.22, 1.1)}
<span style="position: absolute; left: 16px; right: 16px; bottom: 14px; display: flex; align-items: center; justify-content: space-between; color: #FFFFFF"><span style="font-size: 21px; font-weight: 600">${c.name}</span>${icon('play', 26)}</span></span>
</button>`;
  const dot = (k) => `<button type="button" onClick="{{pick${k}}}" aria-label="Card ${k + 1}" style="width: 28px; height: 28px; border: 0; background: none; display: flex; align-items: center; justify-content: center; cursor: pointer"><span style="width: 9px; height: 9px; border-radius: 999px; background: ${D.text}; opacity: {{d${k}}}; transition: opacity 400ms ease"></span></button>`;
  const body = `
<button type="button" style="position: absolute; left: 12px; top: 52px; height: 44px; padding: 0 10px; border: 0; background: none; display: flex; align-items: center; gap: 6px; color: ${D.text}; font-size: 17px; cursor: pointer">${icon('back', 22)}Back</button>
<div style="position: absolute; left: 32px; right: 32px; top: 120px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center">
<span style="font-family: ${K.F.display}; font-size: 28px; color: ${D.text}">Choose a sound to drift with</span>
<span style="font-size: 15.5px; line-height: 1.45; color: ${D.sec}">Each one loops gently for as long as you need.</span>
</div>
<div style="position: absolute; left: 0; top: 250px; display: flex; gap: ${GAP}px; transform: translateX({{tx}}px); transition: transform 650ms cubic-bezier(.25,1,.35,1)">${CARDS.map(card).join('')}</div>
<div style="position: absolute; left: 0; right: 0; top: 690px; display: flex; justify-content: center; gap: 2px">${CARDS.map((_, k) => dot(k)).join('')}</div>
<span style="position: absolute; left: 0; right: 0; top: 730px; text-align: center; font-size: 15px; color: ${D.sec}">You can change this at any time.</span>
<button type="button" style="position: absolute; left: 24px; right: 24px; top: 766px; height: 56px; border-radius: 999px; border: 0; background: ${D.accent}; color: #FFFFFF; font-size: 17px; font-weight: 600; cursor: pointer">Choose {{name}}</button>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { sel: 0 };
  }
  renderVals() {
    const s = this.state.sel;
    const names = ${JSON.stringify(CARDS.map((c) => c.name))};
    const v = { tx: ${x0} - s * ${CW + GAP}, name: names[s] };
    for (let k = 0; k < 4; k++) {
      v['b' + k] = s === k ? '${D.text}' : 'rgba(27,33,64,0.10)';
      v['s' + k] = s === k ? 1 : 0.94;
      v['d' + k] = s === k ? 1 : 0.22;
      v['pick' + k] = () => this.setState({ sel: k });
    }
    return v;
  }
}`;
  return K.board('MeditateCards.dc.html', { title: 'Meditate — grain cards (Dusk)', root: `background: ${D.ground}`, body, logic });
}

/* ── A7 · Ending: the ring closes into a bloom, then the minutes ── */
function ending() {
  const R = 120, C = 2 * Math.PI * R;
  const css = ['A', 'B'].map((x) => `
@keyframes close${x} { from { stroke-dashoffset: ${(C * 0.18).toFixed(1)} } to { stroke-dashoffset: 0 } }
@keyframes bloom${x} { 0% { transform: scale(0.6); opacity: 0 } 40% { opacity: 0.9 } 100% { transform: scale(1.6); opacity: 0 } }
@keyframes ringOut${x} { 0%,55% { opacity: 1; transform: scale(1) } 100% { opacity: 0; transform: scale(1.12) } }
@keyframes rise${x} { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }`).join('');
  const body = `
<img src="${K.ASSET.forestJpg}" alt="" style="position: absolute; inset: -30px; width: calc(100% + 60px); height: calc(100% + 60px); object-fit: cover; filter: blur(40px) brightness(0.45); opacity: 0.8">
<span style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 42%, rgba(11,16,38,0.1), ${M.midnight} 78%)"></span>
<button type="button" onClick="{{replay}}" aria-label="Replay" style="position: absolute; right: 20px; top: 56px; width: 48px; height: 48px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; display: flex; align-items: center; justify-content: center; color: ${M.moonlight}; cursor: pointer">${icon('replay', 20)}</button>
<span style="position: absolute; left: ${195 - 180}px; top: ${330 - 180}px; width: 360px; height: 360px; border-radius: 999px; background: radial-gradient(closest-side, rgba(111,214,207,0.55), rgba(111,214,207,0)); animation: bloom{{x}} 2.4s ease-out 1.1s both"></span>
<svg width="${2 * R + 20}" height="${2 * R + 20}" viewBox="0 0 ${2 * R + 20} ${2 * R + 20}" aria-hidden="true" style="position: absolute; left: ${195 - R - 10}px; top: ${330 - R - 10}px; animation: ringOut{{x}} 2.2s ease-in 0s both"><g transform="rotate(-90 ${R + 10} ${R + 10})"><circle cx="${R + 10}" cy="${R + 10}" r="${R}" fill="none" stroke="rgba(242,236,221,0.2)" stroke-width="1.2"></circle><circle cx="${R + 10}" cy="${R + 10}" r="${R}" fill="none" stroke="${M.moonlight}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" style="animation: close{{x}} 1.2s ease-in-out both"></circle></g></svg>
<div style="position: absolute; left: 0; right: 0; top: 250px; display: flex; flex-direction: column; align-items: center; gap: 4px">
<span style="font-weight: 300; font-size: 120px; line-height: 1; color: ${M.moonlight}; animation: rise{{x}} 900ms ease 1.9s both">10</span>
<span style="font-family: ${K.F.display}; font-size: 24px; color: ${M.moonlight}; animation: rise{{x}} 900ms ease 2.2s both">minutes of stillness</span>
<span style="margin-top: 12px; animation: rise{{x}} 900ms ease 2.5s both">${K.label('Creek · ' + K.hijri(K.TODAY, 'en'), M.mist)}</span>
</div>
<div style="position: absolute; left: 24px; right: 24px; top: 690px; display: flex; flex-direction: column; gap: 12px; animation: rise{{x}} 900ms ease 3s both">
<button type="button" style="height: 56px; border-radius: 999px; ${K.glass('242,236,221', 0.1)}; color: ${M.moonlight}; font-size: 16.5px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer">${icon('pen', 18)}Write a line about it</button>
<button type="button" style="height: 56px; border-radius: 999px; border: 0; background: ${M.moonlight}; color: ${M.midnight}; font-size: 16.5px; font-weight: 600; cursor: pointer">Done</button>
</div>`;
  const logic = `class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { n: 0 };
  }
  renderVals() {
    return { x: this.state.n % 2 ? 'B' : 'A', replay: () => this.setState({ n: this.state.n + 1 }) };
  }
}`;
  return K.board('MeditateEnd.dc.html', { title: 'Meditate — the ring closes into a bloom', root: `background: ${M.midnight}`, css, body, logic });
}

out.push(today('en'), gallery('en'), archExpand(), minutes(), playing(), cards(), ending(), today('ar'), gallery('ar'));
module.exports = out;
if (require.main === module) console.log(out.map((b) => b.file).join('\n'));
