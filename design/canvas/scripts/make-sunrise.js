// The Home-mark sun scenes: Sunrise's and Dusk's counterparts to the Night starfield. Tapping Home's
// mark sets the day aside (Home's words, card, ring and tab bar fade) as the sky changes, and the
// mark glides to the middle, as the starfield's moon does, becoming a small sun on the way that
// breathes on Home's 5s rhythm, as the moon does. The only word is "Tanafas". Tapping the sun turns
// it back into the mark and brings Home back.
// - Sunrise ("Houna sunrise"): pre-dawn warming to morning; a pale-gold sun with short turning rays.
// - Dusk ("Houna dusk"): golden hour deepening to violet dusk; a low amber evening sun, no rays.
// Writes each theme's interactive prototype and a storyboard of its key moments with a build plan.
const fs = require('fs');
const { mark, halo } = require('./make-appicons.js');
const { DISCS, pressedMark } = require('./pressed-kit.js');
const P = __dirname + '/../project/';

/* ── Choreography: one table drives both the live CSS animations and the storyboard stills ── */
const HOME_Y = 85; // the mark's box (190px) top on Home, in screen px
const SUN_SCALE = 0.9; // a ~119px disc
/** Where the sun settles by default: centred a little above the middle, where the starfield's moon does. */
const MOON_SETTLE = 0.42;

/**
 * The choreography for a theme: Home's chrome fades as the first sky (skyA) comes in; the mark
 * glides down to where the sun settles (T.settle, a fraction of the screen's height), becoming
 * the sun, as the second sky (skyB) takes over; with T.stars, the first faint stars come out
 * once it has settled. And back: the sun glides up to the mark's spot, becoming the mark; the sky
 * goes, Home returns.
 */
function choreography(T) {
  const MID_Y = Math.round(844 * (T.settle || MOON_SETTLE) - 95);
  const keys = ['chrome', 'markHome', 'markSun', 'disc', 'skyA', 'skyB', ...(T.stars ? ['stars'] : [])];
  const tracks = {
    rise: { dur: 3.6, k: {
      chrome: [[0, 1], [0.12, 0], [1, 0]],
      skyA: [[0, 0], [0.15, 1], [0.35, 1], [0.8, 0], [1, 0]],
      skyB: [[0, 0], [0.3, 0], [1, 1]],
      stars: [[0, 0], [0.75, 0], [1, 1]],
      sunY: [[0, HOME_Y], [0.1, HOME_Y], [0.7, MID_Y], [1, MID_Y]],
      sunS: [[0, 1], [0.3, 1], [0.85, SUN_SCALE], [1, SUN_SCALE]],
      markHome: [[0, 1], [0.3, 1], [0.6, 0], [1, 0]],
      markSun: [[0, 0], [0.3, 0], [0.6, 1], [1, 1]],
      disc: [[0, 0], [0.3, 0], [0.85, 1], [1, 1]],
    } },
    set: { dur: 2.6, k: {
      chrome: [[0, 0], [0.65, 0], [1, 1]],
      skyA: [[0, 0], [0.25, 0.7], [0.5, 0.7], [0.8, 0], [1, 0]],
      skyB: [[0, 1], [0.3, 0], [1, 0]],
      stars: [[0, 1], [0.2, 0], [1, 0]],
      sunY: [[0, MID_Y], [0.15, MID_Y], [0.75, HOME_Y], [1, HOME_Y]],
      sunS: [[0, SUN_SCALE], [0.6, 1], [1, 1]],
      markHome: [[0, 0], [0.3, 0], [0.6, 1], [1, 1]],
      markSun: [[0, 1], [0.3, 1], [0.6, 0], [1, 0]],
      disc: [[0, 1], [0.45, 0], [1, 0]],
    } },
  };
  const home = { chrome: 1, sunY: HOME_Y, sunS: 1, markHome: 1, markSun: 0, disc: 0, skyA: 0, skyB: 0, stars: 0 };
  return { keys, tracks, home };
}

const ease = (x) => x * x * (3 - 2 * x);
function at(track, t) {
  for (let i = 1; i < track.length; i++) {
    const [t0, v0] = track[i - 1], [t1, v1] = track[i];
    if (t <= t1) return v0 + (v1 - v0) * ease(t1 === t0 ? 1 : (t - t0) / (t1 - t0));
  }
  return track[track.length - 1][1];
}
const sunTransform = (y, s) => `translateY(${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
const gradient = ({ colors, stops }) => `linear-gradient(180deg, ${colors.map((c, i) => `${c} ${Math.round(stops[i] * 100)}%`).join(', ')})`;

function keyframes(C) {
  let css = '';
  for (const [phase, { k }] of Object.entries(C.tracks)) {
    for (const key of C.keys) css += `@keyframes ${phase}-${key}{${k[key].map(([t, v]) => `${(t * 100).toFixed(1)}%{opacity:${v}}`).join('')}}\n`;
    const times = [...new Set([...k.sunY, ...k.sunS].map(([t]) => t))].sort((a, b) => a - b);
    css += `@keyframes ${phase}-sun{${times.map((t) => `${(t * 100).toFixed(1)}%{transform:${sunTransform(at(k.sunY, t), at(k.sunS, t))}}`).join('')}}\n`;
  }
  return css;
}

/* ── The themes ── */
const THEMES = {
  sunrise: {
    title: 'Houna sunrise', mode: 'SUNRISE MODE', themeName: 'Sunrise', file: 'Sunrise.dc.html', story: 'SunriseStory.dc.html',
    openLabel: 'Breathe with the sunrise', route: 'app/sunrise.tsx', session: 'sunrise',
    // Home (Sunrise), simplified.
    ground: '#F2F6F4', text: '#1D2B2A', sec: '#58595B', ter: '#6D6F72', line: 'rgba(29,43,42,0.10)', lineSoft: 'rgba(29,43,42,0.08)', lineCtrl: 'rgba(29,43,42,0.12)',
    accent: '#196662', ringA: '#196662', ringB: '#0A91BB', tabOn: '#196662', raised: '#196662', crisis: '249,169,128',
    markHome: '#3BAAA7', markHalo: '59,170,167',
    // The scene.
    skyA: { colors: ['#274A5E', '#4F7A86', '#C99A8A', '#F2B38F'], stops: [0, 0.42, 0.8, 1] },
    skyB: { colors: ['#A9DDE0', '#DDF1EF', '#FCE7D8', '#FBC9A6'], stops: [0, 0.38, 0.74, 1] },
    disc: 'radial-gradient(circle at 50% 45%, #FFF9F1 0%, #FFE9D3 52%, #FBC8A3 82%, #F9A980 100%)',
    haloRgb: '249,169,128', glowRgb: '249,169,128', rays: true, markSun: '#196662', word: '#58595B',
    frames: [
      [0, 'Home, Sunrise', 'Tap the mark.'],
      [0.2, 'The day steps back', 'Home’s words, card, ring and tab bar fade, and the sky deepens to pre-dawn.'],
      [0.55, 'Becoming the sun', 'The mark glides to the middle, as the starfield’s moon does; a pale-gold disc and its rays grow in behind it as the sky warms.'],
      [1, 'Breathe', 'The sun breathes as the starfield’s moon does: its glow and short rays swell on the in-breath and mostly fade on the out, the disc and mark still. “Tanafas” shows for three seconds. Tap the sun to go back.'],
    ],
    intro: 'Sunrise’s counterpart to the Night starfield. Tapping Home’s mark sets the day aside, the sky deepens to pre-dawn, and the mark glides to the middle, as the starfield’s moon does, becoming a small yellow sun as the morning warms. Tap the sun to come back. The prototype beside this board plays it.',
    plan: [
      ['Same handoff as the starfield', 'Home opens <code>app/sunrise.tsx</code> as a transparent modal over the tabs, and its chrome and the tab bar fade through the shared <code>chrome</code> value in <code>StarfieldContext</code>. The sun is drawn at the mark’s measured spot, glides to the middle as the moon does, and back again on return.'],
      ['Sunrise theme only', 'In Sunrise, Home’s mark opens the sunrise; in Night, the starfield; Dusk gets its own (see Houna dusk).'],
      ['New pieces', '<code>components/sunrise/</code>: <code>SunDisc</code> (the pale-gold disc around <code>MarkHalo</code>’s mark, with its edge halo and short turning rays breathing on the shared 5s <code>breath</code>, as the moon’s halo does) and <code>SkyWash</code> (pre-dawn crossfading to morning). Held still under Reduce Motion; tap the sun, or Back, to return.'],
      ['Counts as breathing', 'A visit counts like the starfield’s: time from the sun appearing until it’s tapped, into Recap, streaks and the leaderboard (a <code>sunrise</code> session, titled Tanafas).'],
    ],
  },
  dusk: {
    title: 'Houna dusk', mode: 'DUSK MODE', themeName: 'Dusk', file: 'DuskScene.dc.html', story: 'DuskStory.dc.html', storyHeight: 1603,
    openLabel: 'Breathe with the dusk', route: 'app/sunrise.tsx', session: 'dusk',
    // Home (Dusk), simplified.
    ground: '#F5F1E8', text: '#1B2140', sec: '#4A5078', ter: '#646A8E', line: 'rgba(27,33,64,0.10)', lineSoft: 'rgba(27,33,64,0.08)', lineCtrl: 'rgba(27,33,64,0.12)',
    accent: '#237873', ringA: '#237873', ringB: '#6353C9', tabOn: '#1B2140', raised: '#1B2140', crisis: '242,184,128',
    markHome: '#3BAAA7', markHalo: '59,170,167',
    // The scene: golden hour as the day steps back, deepening to violet dusk; a low amber sun.
    skyA: { colors: ['#FBE6C8', '#F7CFA0', '#F0B08A', '#E8978A'], stops: [0, 0.4, 0.78, 1] },
    skyB: { colors: ['#2E2A5C', '#5A4E9A', '#A785B0', '#EFA07E'], stops: [0, 0.4, 0.76, 1] },
    disc: 'radial-gradient(circle at 50% 45%, #FFF3E4 0%, #FFD9B3 50%, #F5B08A 80%, #E4826A 100%)',
    haloRgb: '236,140,110', glowRgb: '242,160,120', rays: false, markSun: '#237873', word: '#1B2140',
    // A setting sun rests lower than the moon and the sunrise (0.42); set to MOON_SETTLE to match them.
    settle: 0.55,
    stars: true,
    shootingStars: true,
    frames: [
      [0, 'Home, Dusk', 'Tap the mark.'],
      [0.2, 'The day steps back', 'Home’s words, card, ring and tab bar fade, and the light turns to golden hour.'],
      [0.55, 'Becoming the evening sun', 'The mark glides down, as the starfield’s moon does, but settles lower, as a setting sun would; an amber disc grows in behind it as the sky deepens to violet.'],
      [1, 'Breathe', 'The evening sun breathes as the starfield’s moon does: its soft glow swells on the in-breath and mostly fades on the out, the disc and mark still. No rays: an evening sun is a glow. The first faint stars come out high in the violet, with the starfield’s shooting stars now and then, a nod to Night next door. “Tanafas” shows for three seconds. Tap the sun to go back.'],
    ],
    intro: 'Dusk’s counterpart to the Night starfield and the Houna sunrise: the evening between them. Tapping Home’s mark sets the day aside, the light turns to golden hour, and the mark glides down, as the starfield’s moon does, settling low as a setting sun and becoming an amber sun, as the sky deepens to violet dusk and the first stars come out. Tap the sun to come back. The prototype beside this board plays it.',
    plan: [
      ['One scene, two skies', 'Built on the sunrise: <code>app/sunrise.tsx</code> becomes the sun scene for both themes, reading its skies and sun from the theme (<code>sunriseScene</code> / a new <code>duskScene</code> in <code>theme.ts</code>). Same handoff, glide, breath and return; nothing new to wire.'],
      ['Dusk theme only', 'Night: the starfield. Sunrise: the sunrise. Dusk: this. Every theme’s mark now opens a scene.'],
      ['One change to SunDisc', '<code>SunDisc</code> takes the sun’s colours and whether it has rays: Dusk’s is an amber disc, a rose-amber halo and a warm sunglow, breathing on the shared 5s <code>breath</code>, with no rays.'],
      ['Counts as breathing', 'A visit counts like the others: a <code>dusk</code> session, titled Tanafas in Recap, into streaks and the leaderboard.'],
      ['Decided', 'The mark stays inside the sun, in deep teal. The first faint stars come out once it settles. The sun settles lower than the moon and the sunrise (55% down the screen, not 42%); if that doesn’t feel right, it’s one value to bring it back in line with them.'],
    ],
  },
};

/* ── The scene ── */
// live: CSS animations switched by DC state holes. still: every value fixed at rise time t.
function scene(T, { live, t = 0 }) {
  const C = choreography(T);
  const v = (key) => (live ? C.home[key] : at(C.tracks.rise.k[key], t));
  const op = (key) => `opacity: ${(+v(key)).toFixed(3)}${live ? `; animation: {{a_${key}}}` : ''}`;
  const sunStyle = live ? `transform: ${sunTransform(HOME_Y, 1)}; animation: {{a_sun}}` : `transform: ${sunTransform(at(C.tracks.rise.k.sunY, t), at(C.tracks.rise.k.sunS, t))}`;
  const breath = live ? 'animation: {{a_breath}}' : '';
  const glow = live ? 'animation: {{a_glow}}' : '';
  const word = live ? 'opacity: 0; animation: {{a_word}}' : `opacity: ${t >= 1 ? 1 : 0}`;

  // Home's chrome, simplified: top bar, ring, words, community card, crisis pill, tab bar.
  const N = 28, R = 86;
  const ring = Array.from({ length: N }, (_, i) => {
    const tt = i / N, a = tt * Math.PI * 2 - Math.PI / 2, s = 2.5 + 4 * Math.sin(tt * Math.PI);
    return `<span style="position: absolute; left: ${(195 + R * Math.cos(a) - s / 2).toFixed(1)}px; top: ${(HOME_Y + 95 + R * Math.sin(a) - s / 2).toFixed(1)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: ${i < N / 2 ? T.ringA : T.ringB}; opacity: ${(0.22 + 0.78 * Math.sin(tt * Math.PI)).toFixed(2)}"></span>`;
  }).join('');
  const tab = (label, on) => `<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; font-weight: ${on ? 600 : 400}; color: ${on ? T.tabOn : T.ter}"><span style="width: 22px; height: 22px; border-radius: 6px; border: 1.6px solid currentColor; box-sizing: border-box"></span>${label}</span>`;
  const chrome = `<div aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; pointer-events: none; ${op('chrome')}">
<span style="position: absolute; left: 16px; top: 16px; width: 44px; height: 44px; border-radius: 999px; background: #FFFFFF; border: 1px solid ${T.lineCtrl}; box-sizing: border-box"></span>
<span style="position: absolute; left: 0; right: 0; top: 26px; text-align: center; font-family: 'Marcellus', serif; font-size: 22px; color: #3BAAA7">houna</span>
<span style="position: absolute; right: 16px; top: 16px; width: 44px; height: 44px; border-radius: 999px; background: #FFFFFF; border: 1px solid ${T.lineCtrl}; box-sizing: border-box"></span>
${ring}
<div style="position: absolute; left: 0; right: 0; top: 292px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center">
<span style="font-family: 'DM Mono', monospace; font-size: 11.5px; letter-spacing: 0.16em; color: ${T.accent}">● YOU'RE NOT ALONE</span>
<span style="font-family: 'Marcellus', serif; font-size: 20px; color: ${T.text}">You are one light among many.</span>
</div>
<div style="position: absolute; left: 16px; right: 16px; top: 372px; height: 226px; border-radius: 24px; background: #FFFFFF; border: 1px solid ${T.line}; box-sizing: border-box; padding: 16px; display: flex; flex-direction: column; gap: 12px">
<span style="font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 0.14em; color: ${T.ter}">BREATHING TOGETHER</span>
<span style="flex: 1; border-radius: 14px; background: radial-gradient(circle at 30% 40%, ${T.line} 1.2px, transparent 1.6px) 0 0 / 9px 9px"></span>
<span style="font-size: 13px; color: ${T.sec}">people breathed with Houna this month</span>
</div>
<span style="position: absolute; left: 50%; top: 620px; transform: translateX(-50%); padding: 10px 18px; border-radius: 999px; background: rgba(${T.crisis},0.08); border: 1px solid rgba(${T.crisis},0.4); font-size: 13px; color: ${T.text}; white-space: nowrap">Need to talk now?</span>
<div style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; background: #FFFFFF; border-top: 1px solid ${T.lineSoft}; display: flex; align-items: flex-start; padding-top: 12px">
${tab('Home', true)}${tab('Directory')}<span style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11px; color: ${T.ter}"><span style="margin-top: -30px; width: 56px; height: 56px; border-radius: 999px; background: ${T.raised}; box-shadow: 0 0 0 6px ${T.ground}, 0 0 32px rgba(59,170,167,0.45)"></span>Tanafas</span>${tab('Events')}${tab('More')}
</div>
</div>`;

  // The sun: a disc holding the mark, both still and crisp. Around it, breathing the way the
  // starfield's moon does (the shared 5s breath): a halo joined to the disc's edge, in three
  // slightly oval layers turning at their own pace, and (Sunrise only) short rays, swelling out on
  // the in-breath and mostly fading on the out-breath; behind, a wide, faint sunglow breathing with them.
  const HALO = 240, ls = (1 - Math.pow(1 - 0.6, 1 / 3)).toFixed(3);
  const haloLayers = [0, 1, 2].map((k) => `<span style="position: absolute; left: 0; top: 0; width: ${HALO}px; height: ${HALO}px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${T.haloRgb},0) 51.5%, rgba(${T.haloRgb},${ls}) 58%, rgba(${T.haloRgb},0) 100%); animation: halo-l${k} 120s linear infinite"></span>`).join('');
  const rays = T.rays
    ? `<span style="position: absolute; left: -95px; top: -95px; width: 380px; height: 380px; border-radius: 999px; background: repeating-conic-gradient(from 0deg, rgba(255,222,190,0.45) 0deg 3deg, rgba(255,222,190,0) 3deg 15deg); -webkit-mask-image: radial-gradient(circle, #000 26%, transparent 64%); mask-image: radial-gradient(circle, #000 26%, transparent 64%); animation: rays 120s linear infinite"></span>\n`
    : '';
  const sun = `<div ${live ? 'role="button" aria-label="{{sunLabel}}" onClick="{{toggle}}" ' : ''}style="position: absolute; left: 100px; top: 0; width: 190px; height: 190px; cursor: pointer; ${sunStyle}">
<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; ${op('disc')}">
<span style="position: absolute; left: -115px; top: -115px; width: 420px; height: 420px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${T.glowRgb},0.28) 20%, rgba(${T.glowRgb},0) 100%); ${glow}"></span>
<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; ${breath}">
${rays}<div style="position: absolute; left: ${(190 - HALO) / 2}px; top: ${(190 - HALO) / 2}px; width: ${HALO}px; height: ${HALO}px">${haloLayers}</div>
</div>
<span style="position: absolute; left: 29px; top: 29px; width: 132px; height: 132px; border-radius: 999px; background: ${T.disc}; box-shadow: 0 0 14px rgba(${T.glowRgb},0.45)"></span>
</div>
<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; ${op('markHome')}">${halo(190, 70, T.markHalo, 0.5)}${mark(70, T.markHome)}</div>
<div style="position: absolute; left: 0; top: 0; width: 190px; height: 190px; ${op('markSun')}">${T.pressed ? pressedMark(70, DISCS[T.pressed].surface) : mark(70, T.markSun)}</div>
</div>`;

  return `<div style="position: relative; width: 390px; height: 844px; overflow: hidden; background: ${T.ground}; font-family: 'Figtree', system-ui, sans-serif">
<span aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; background: ${gradient(T.skyA)}; ${op('skyA')}"></span>
<span aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; background: ${gradient(T.skyB)}; ${op('skyB')}"></span>
${T.shootingStars ? `<div aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; ${op('stars')}">${SHOOTING}</div>` : ''}
${T.stars ? `<div aria-hidden="true" style="position: absolute; left: 0; top: 0; width: 390px; height: 844px; ${op('stars')}">${firstStars()}</div>` : ''}
${sun}
${chrome}
<span aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 56px; text-align: center; font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.3em; color: ${T.word}; ${word}">TANAFAS</span>
</div>`;
}

/** The starfield's far-off shooting stars (Dusk), behind the first stars and the sun. */
const SHOOTING = "<span style=\"position: absolute; left: 420px; top: 90px; width: 150px; height: 1.5px; border-radius: 999px; transform-origin: 0 50%; background: linear-gradient(90deg, rgba(242,236,221,0.95), rgba(242,236,221,0)); box-shadow: 0 0 6px rgba(242,236,221,0.5); opacity: 0; animation: shoot 11s ease-out 1.5s infinite\"></span>\n<span style=\"position: absolute; left: -160px; top: 520px; width: 130px; height: 1.5px; border-radius: 999px; transform-origin: 100% 50%; background: linear-gradient(270deg, rgba(242,236,221,0.9), rgba(242,236,221,0)); box-shadow: 0 0 6px rgba(242,236,221,0.45); opacity: 0; animation: shoot-b 11s ease-out 7s infinite\"></span>";

/** Dusk's first stars: a faint few, high in the violet, each twinkling slowly on its own phase. */
function firstStars() {
  let seed = 23;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 26 }, (_, i) => {
    const s = rnd() < 0.8 ? 1 + rnd() * 0.8 : 1.8 + rnd() * 0.6;
    const o = 0.3 + rnd() * 0.4;
    return `<span style="position: absolute; left: ${(12 + rnd() * 366).toFixed(0)}px; top: ${(18 + Math.pow(rnd(), 1.4) * 300).toFixed(0)}px; width: ${s.toFixed(1)}px; height: ${s.toFixed(1)}px; border-radius: 999px; background: rgba(245,241,232,${o.toFixed(2)}); box-shadow: 0 0 ${(s * 2).toFixed(1)}px rgba(245,241,232,0.35); animation: twinkle 9s ease-in-out ${(-((i * 0.37) % 1) * 9).toFixed(2)}s infinite"></span>`;
  }).join('');
}

// The moon's breath: 5s, from out (0) to in (1) and back, easing like a sine.
const css = (C) => `${keyframes(C)}@keyframes breath{0%{transform:scale(0.95);opacity:0.2}50%{transform:scale(1.1);opacity:1}100%{transform:scale(0.95);opacity:0.2}}
@keyframes sunglow{0%{transform:scale(0.92);opacity:0.3}50%{transform:scale(1.08);opacity:1}100%{transform:scale(0.92);opacity:0.3}}
@keyframes rays{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes halo-l0{from{transform:rotate(0deg) scale(1.04,0.96)}to{transform:rotate(360deg) scale(1.04,0.96)}}
@keyframes halo-l1{from{transform:rotate(45deg) scale(0.96,1.04)}to{transform:rotate(-315deg) scale(0.96,1.04)}}
@keyframes halo-l2{from{transform:rotate(100deg) scale(1.03,0.97)}to{transform:rotate(820deg) scale(1.03,0.97)}}
@keyframes shoot{0%{opacity:0;transform:translate(0,0) rotate(-24deg)}2%{opacity:1}14%{opacity:0.9}18%{opacity:0;transform:translate(-560px,250px) rotate(-24deg)}100%{opacity:0;transform:translate(-560px,250px) rotate(-24deg)}}
@keyframes shoot-b{0%{opacity:0;transform:translate(0,0) rotate(20deg)}2%{opacity:1}14%{opacity:0.9}18%{opacity:0;transform:translate(540px,196px) rotate(20deg)}100%{opacity:0;transform:translate(540px,196px) rotate(20deg)}}
@keyframes twinkle{0%{opacity:0.35}50%{opacity:1}100%{opacity:0.35}}
@keyframes word{0%{opacity:0;transform:translateY(4px)}15%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion: reduce){*{animation-duration:0.01s!important;animation-delay:0s!important;animation-iteration-count:1!important}}`;

const head = (T, title, extra = '') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&amp;family=Figtree:wght@400;500;600&amp;family=Marcellus&amp;display=swap" rel="stylesheet">
<style>
body{margin:0;background:${T.ground};font-family:'Figtree',system-ui,sans-serif;color:${T.text}}
${css(choreography(T))}
${extra}
</style>
</helmet>`;

function build(T) {
  /* ── Interactive prototype ── */
  const C = choreography(T);
  const RISE = C.tracks.rise.dur;
  const live = `${head(T, T.title)}
${scene(T, { live: true })}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":844}}'>
class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.state = { phase: 'home' };
  }
  renderVals() {
    const phase = this.state.phase;
    const dur = { rise: ${RISE}, set: ${C.tracks.set.dur} }[phase];
    const vals = {};
    for (const k of ${JSON.stringify([...C.keys, 'sun'])}) vals['a_' + k] = phase === 'home' ? 'none' : phase + '-' + k + ' ' + dur + 's ease-in-out forwards';
    return Object.assign(vals, {
      a_breath: phase === 'rise' ? 'breath 5s ease-in-out ${RISE}s infinite' : 'none',
      a_glow: phase === 'rise' ? 'sunglow 5s ease-in-out ${RISE}s infinite' : 'none',
      a_word: phase === 'rise' ? 'word 4.5s ease-in-out ${RISE + 0.2}s forwards' : 'none',
      sunLabel: phase === 'rise' ? 'Back to Home' : '${T.openLabel}',
      toggle: () => this.setState({ phase: phase === 'rise' ? 'set' : 'rise' })
    });
  }
}
</script>
</body>
</html>
`;
  fs.writeFileSync(P + T.file, live);

  if (!T.story) return console.log(T.file, (live.length / 1024).toFixed(0) + 'KB');

  /* ── Storyboard ── */
  const S = 0.6;
  const frame = ([t, title, note], i) => `<div style="display: flex; flex-direction: column; gap: 14px; width: ${390 * S}px">
<div style="position: relative; width: ${390 * S}px; height: ${844 * S}px; border-radius: 28px; overflow: hidden; box-shadow: 0 10px 30px rgba(29,43,42,0.15)"><div style="transform: scale(${S}); transform-origin: 0 0">${scene(T, { live: false, t })}</div></div>
<div style="display: flex; align-items: baseline; gap: 8px"><span style="font-family: 'DM Mono', monospace; font-size: 12px; color: ${T.accent}">${i + 1}</span><span style="font-size: 16px; font-weight: 600; color: ${T.text}">${title}</span></div>
<span style="font-size: 13px; line-height: 1.5; color: ${T.sec}">${note}</span>
</div>`;
  const WIDTH = 64 * 2 + T.frames.length * 390 * S + (T.frames.length - 1) * 36;
  const story = `${head(T, `${T.title} — storyboard`, `code{font-family:'DM Mono',monospace;font-size:0.9em;color:${T.accent}}`)}
<div style="width: ${WIDTH}px; box-sizing: border-box; padding: 64px; background: ${T.ground}; display: flex; flex-direction: column; gap: 40px">
<div style="display: flex; flex-direction: column; gap: 12px">
<span style="font-family: 'DM Mono', monospace; font-size: 12px; letter-spacing: 0.16em; color: ${T.accent}">HOUNA · ${T.mode}</span>
<h1 style="margin: 0; font-family: 'Marcellus', serif; font-weight: 400; font-size: 64px; line-height: 1; color: ${T.text}">${T.title}</h1>
<p style="margin: 0; font-size: 17px; line-height: 1.5; color: ${T.sec}">${T.intro}</p>
</div>
<div style="display: flex; gap: 36px">
${T.frames.map(frame).join('\n')}
</div>
<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px">
${T.plan.map(([t, b]) => `<div style="display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 20px; background: #FFFFFF; border: 1px solid ${T.line}"><span style="font-size: 15px; font-weight: 600; color: ${T.text}">${t}</span><span style="font-size: 13.5px; line-height: 1.55; color: ${T.sec}">${b}</span></div>`).join('\n')}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${WIDTH},"height":${T.storyHeight || 1378}}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`;
  fs.writeFileSync(P + T.story, story);
  console.log(T.file, (live.length / 1024).toFixed(0) + 'KB ·', T.story, (story.length / 1024).toFixed(0) + 'KB · width', WIDTH);
}

// The pressed-logo alternative: the same scenes, the mark pressed into the sun (canvas only, to compare).
THEMES.sunrisePressed = { ...THEMES.sunrise, title: 'Houna sunrise — pressed logo', file: 'SunrisePressed.dc.html', story: null, pressed: 'sunrise' };
THEMES.duskPressed = { ...THEMES.dusk, title: 'Houna dusk — pressed logo', file: 'DuskPressed.dc.html', story: null, pressed: 'dusk' };

for (const T of Object.values(THEMES)) build(T);
