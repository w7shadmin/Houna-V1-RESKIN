// The pressed-logo alternative's pieces, shared by the starfield, sunrise and dusk boards and the
// side-by-side board: a solid lit disc, the Houna mark pressed into it (the breathing orb's recipe
// from components/tanafas/BreatheStages.tsx), and a halo joined to the disc's edge.
const { mark } = require('./make-appicons.js');

const MIDNIGHT = [11, 16, 38];
const rgb = (hex) => [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16));

/** The breathing orb's `pressed`: the surface colour deepened with 25% Midnight (drawn at 0.7 as one layer). */
function pressedFill(surface) {
  const c = rgb(surface).map((v, k) => Math.round(MIDNIGHT[k] * 0.25 + v * 0.75));
  return `rgb(${c.join(',')})`;
}

/**
 * The mark pressed into a surface: one even shape a shade deeper than the surface, a hollow in
 * the same material (no offset edge copies, which drew the top of the ring thicker). Centred in its box.
 */
function pressedMark(size, surface) {
  // Solid, faded as one layer: the pin overlaps the ring, and a translucent fill would double up there.
  return mark(size, pressedFill(surface), { style: 'opacity: 0.7' });
}

/** The discs: centre-to-rim stops, the surface the mark is pressed into, and the halo's colour. */
const DISCS = {
  sunrise: { stops: 'radial-gradient(circle at 50% 45%, #FFF9F1 0%, #FFE9D3 52%, #FBC8A3 82%, #F9A980 100%)', surface: '#FBC8A3', glow: '249,169,128' },
  dusk: { stops: 'radial-gradient(circle at 50% 45%, #FFF3E4 0%, #FFD9B3 50%, #F5B08A 80%, #E4826A 100%)', surface: '#F5B08A', glow: '236,140,110' },
  // The solid teal orb Profile's avatar uses.
  teal: { stops: 'radial-gradient(circle at 50% 45%, #D9FAF6 0%, #6FD6CF 55%, #2E8F8A 100%)', surface: '#6FD6CF', glow: '111,214,207' },
  // Moonlight: white to Moonlight to a warm grey rim.
  silver: { stops: 'radial-gradient(circle at 50% 45%, #FFFFFF 0%, #F2ECDD 52%, #CFC8B8 100%)', surface: '#E4DDCB', glow: '242,236,221' },
};

const DISC = 132; // in the mark's 190px box, as the suns
/** A solid disc, centred in a 190px box. */
function disc(d, style = '') {
  return `<span style="position: absolute; left: ${(190 - DISC) / 2}px; top: ${(190 - DISC) / 2}px; width: ${DISC}px; height: ${DISC}px; border-radius: 999px; background: ${d.stops}; box-shadow: 0 0 14px rgba(${d.glow},0.45); ${style}"></span>`;
}

/**
 * The halo joined to the disc's edge (three slightly oval layers, turning), 240px, centred in a
 * 190px box; `animation` lets it breathe (the canvas's halo-l0..2 and a breath keyframe).
 */
function discHalo(d, breath = '', turning = true) {
  const H = 240, ls = (1 - Math.pow(1 - 0.6, 1 / 3)).toFixed(3);
  const layer = (k) => `<span style="position: absolute; left: 0; top: 0; width: ${H}px; height: ${H}px; border-radius: 999px; background: radial-gradient(circle closest-side, rgba(${d.glow},0) 51.5%, rgba(${d.glow},${ls}) 58%, rgba(${d.glow},0) 100%);${turning ? ` animation: halo-l${k} 120s linear infinite` : ''}"></span>`;
  return `<div style="position: absolute; left: ${(190 - H) / 2}px; top: ${(190 - H) / 2}px; width: ${H}px; height: ${H}px; ${breath}">${[0, 1, 2].map(layer).join('')}</div>`;
}

module.exports = { DISCS, DISC, disc, discHalo, pressedMark, pressedFill };
