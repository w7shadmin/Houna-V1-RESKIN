// "Round 3 — the mark in one spot": where the Houna mark sits on every screen that has it, today,
// measured on the web preview at 390×844 (the centre of the mark, or of the body or orb it's pressed
// into), against Home's spot; and what would move to put it there everywhere. Screenshots in
// project/img/r3/ (the preview at 1x; recapture if a screen changes).
const path = require('path');
const K = require('../../explorations/scripts/kit.js');
const DIR = path.join(__dirname, '..', 'project');
const M = K.NIGHT;
const ANCHOR = 199;
const PW = 390, PH = 844, PAD = 40, GAP = 40;
const TEAL = '#6FD6CF';

const SCREENS = [
  { img: 'home', y: 199, name: 'Home', note: 'The anchor: the mark, or the body it rests in, 199 below the top (on a phone, 199 below the status bar).' },
  { img: 'tanafas', y: 243, name: 'Tanafas · Breathe', note: 'The stage, and everything under it, up 44: more room above the play button. In a 4-7-8 session the mark stays put rather than lifting; the word sits a little lower in the orb.' },
  { img: 'profile', y: 168, name: 'Profile', note: 'The ring down 31: a little more air under the back button.' },
  { img: 'welcome', y: 348, name: 'The first breath', note: 'The orb up 149, the words just under it, Continue at the foot.' },
  { img: 'badge', y: 287, name: 'A new badge', note: 'The gem up 88; its words follow it.' },
  { img: 'starfield', y: 354, name: 'The starfield', note: 'The moon glides from Home’s spot down to 354. The question below.' },
  { img: 'sunrise', y: 354, name: 'The sunrise', note: 'The sun rises to 354 from below.' },
  { img: 'dusk', y: 464, name: 'The dusk', note: 'The sun sets down to 464: lower, as a setting sun.' },
];

const phone = (s, i) => {
  const x = PAD + i * (PW + GAP), d = s.y - ANCHOR;
  const delta = d === 0 ? 'anchor' : `${d > 0 ? d : -d} ${d > 0 ? 'lower' : 'higher'}`;
  return `<div style="position: absolute; left: ${x}px; top: ${PAD}px; width: ${PW}px; height: ${PH}px; border-radius: 34px; overflow: hidden; box-shadow: 0 0 0 1px rgba(242,236,221,0.12), 0 20px 50px rgba(0,0,0,0.35)">
<img src="img/r3/${s.img}.png" alt="${s.name}" style="position: absolute; inset: 0; width: ${PW}px; height: ${PH}px">
<span style="position: absolute; left: 0; right: 0; top: ${ANCHOR}px; height: 0; border-top: 1.5px dashed ${TEAL}; opacity: 0.9"></span>
${d !== 0 ? `<span style="position: absolute; left: 0; right: 0; top: ${s.y}px; height: 0; border-top: 1.5px solid #F2B880; opacity: 0.9"></span>
<span style="position: absolute; left: ${PW - 34}px; top: ${Math.min(s.y, ANCHOR)}px; width: 2px; height: ${Math.abs(d)}px; background: #F2B880"></span>` : ''}
<span style="position: absolute; left: ${195 - 7}px; top: ${s.y - 7}px; width: 14px; height: 14px; border-radius: 999px; border: 2px solid ${d === 0 ? TEAL : '#F2B880'}; box-sizing: border-box"></span>
<span style="position: absolute; left: 12px; top: ${ANCHOR - 26}px; padding: 3px 8px; border-radius: 999px; background: rgba(11,16,38,0.8); font-family: ${K.F.mono}; font-size: 11px; letter-spacing: 0.08em; color: ${TEAL}">199</span>
${d !== 0 ? `<span style="position: absolute; right: 12px; top: ${s.y + 6}px; padding: 3px 8px; border-radius: 999px; background: rgba(11,16,38,0.8); font-family: ${K.F.mono}; font-size: 11px; letter-spacing: 0.08em; color: #F2B880">${s.y} · ${delta}</span>` : ''}
</div>
<div style="position: absolute; left: ${x}px; top: ${PAD + PH + 18}px; width: ${PW}px; display: flex; flex-direction: column; gap: 4px"><span style="font-size: 15px; font-weight: 600; color: ${M.moonlight}">${s.name}</span><span style="font-size: 13px; line-height: 1.45; color: ${M.mist}">${s.note}</span></div>`;
};

const W = PAD * 2 + SCREENS.length * PW + (SCREENS.length - 1) * GAP;
const notesTop = PAD + PH + 150;
const note = (title, body, x, w) => `<div style="position: absolute; left: ${x}px; top: ${notesTop}px; width: ${w}px; box-sizing: border-box; padding: 24px; border-radius: 22px; background: rgba(242,236,221,0.045); border: 1px solid rgba(242,236,221,0.1); display: flex; flex-direction: column; gap: 10px"><span style="font-size: 17px; font-weight: 600; color: ${M.moonlight}">${title}</span><span style="font-size: 14.5px; line-height: 1.55; color: ${M.mist}">${body}</span></div>`;
const body = `${SCREENS.map(phone).join('\n')}
${note('The rule', 'One anchor: Home’s spot, 199 below the top of the screen (below the status bar on a phone). Wherever the mark is the centrepiece, the centre of the mark, or of the body, orb or gem it’s pressed into, sits on that line, horizontally centred. Sizes still differ (a small mark on Home, a large orb in 4-7-8); only the centre is shared, so moving between screens, it never jumps. The dashed teal line is the anchor; amber is where it sits today.', PAD, 3 * PW + 2 * GAP)}
${note('The scenes: a question', '<b style="color: #F2ECDD">1 · Stay on the anchor.</b> The moon and suns grow where Home’s body was and stay there; the sky arrives round them. The mark never moves at all from Home to the scene and back.<br><br><b style="color: #F2ECDD">2 · Keep their journey.</b> They leave the anchor and settle lower as today (the moon and the rising sun at 354, the setting sun at 464), the scenes being the one place the mark travels, because the journey is the point of them.', PAD + 3 * (PW + GAP), 3 * PW + 2 * GAP)}
${note('Everything else', 'Screens without the mark (the Directory, Events, More, Stats, Recap, the journal) are unchanged. The splash, when it’s switched on, would rise to the anchor too.', PAD + 6 * (PW + GAP), 2 * PW + GAP)}`;
const out = [K.board('MarkAnchorR3.dc.html', { title: 'Round 3 — the mark in one spot', w: W, h: notesTop + 290, root: 'background: #070B1C', body, dir: DIR })];
module.exports = out;
if (require.main === module) console.log(out.map((b) => `${b.file} ${b.w}×${b.h}`).join('\n'));
