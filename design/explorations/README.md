# Houna Explorations canvas

UI alternatives explored on a separate Design canvas,
https://claude.ai/artifact/KCBgx43XLQZxG3X1cS9mkS ("Houna Explorations"),
kept apart from the Houna Redesign canvas. Exploration only: nothing here
changes the app.

- `project/`: a snapshot of the canvas's files (one `*.dc.html` per board,
  plus `canvas.json`). The live canvas is the source of truth; re-read it
  before publishing over it.
- `scripts/`: the generators. `node design/explorations/scripts/make-layout.js`
  rebuilds every board and the layout (and reports overlaps).

| Script | Section |
| --- | --- |
| `kit.js` | Shared pieces: board wrapper, palettes and tones, breath timings (read from `constants/breathPatterns.ts`), moons in real phase, Hijri dates, the arch, eight-point star, mashrabiya, ring text, grain, glass, the logo |
| `icons.js` | Inline stroke icons |
| `make-intro.js` | 0 · Direction (`Main.dc.html`) |
| `make-meditate.js` | A · Meditation player |
| `make-breathe.js` | B · Breathing player |
| `make-bodies.js` | C · Suns and moons |
| `make-graphs.js` | D · Graphs |
| `make-account.js` | E · Account, badges and progress |
| `make-motion.js` | F · Motion and overlays |
| `make-firstrun.js` | G · First run |

The scenes' stills and footage are uploaded to the canvas as assets
(`kit.ASSET`); re-upload and update those ids if they're ever replaced.
Numbers are set in Figtree Light (Arabic-Indic in Amiri), never Marcellus.
