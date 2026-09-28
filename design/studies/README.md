# Houna Design studies canvas

Visual questions explored as variants on a Design canvas of their own,
https://claude.ai/artifact/5DqkLLhgEWF1bS4vFcf7EL ("Houna — Design studies"),
apart from the Houna Redesign and Explorations canvases. Exploration only:
nothing here changes the app. Picks go to `PICKS.md`, then to the Redesign
canvas and the app, as the Explorations picks did.

- `project/`: a snapshot of the canvas's files (one `*.dc.html` per board, plus
  `canvas.json`). The live canvas is the source of truth; re-read it before
  publishing over it.
- `scripts/make-studies.js` rebuilds every board and the layout (and reports
  overlaps): `node design/studies/scripts/make-studies.js`. It reuses the
  Explorations kit (`design/explorations/scripts/kit.js`), the canvas helpers
  (`make-appicons.js`, `map-data.json`) and the app's own values
  (`constants/kuficRing.ts`, the theme's scene colours).

| Row | Board(s) | The question |
| --- | --- | --- |
| 0 | `Main.dc.html` | Direction |
| A | `A-sunglow.dc.html` | The Sunrise scene's glow: the lattice and the light as one |
| B | `B-suns.dc.html` | Two different suns for Sunrise and Dusk |
| C | `C-kufic.dc.html` | Classic Home with the Kufic ring in place of the dots |
| D | `D-date.dc.html` | A calmer place for Home's Hijri date |
| E | `E-imprint-night.dc.html`, `E-imprint-day.dc.html` | The mark imprinted on plain pages |
| F | `F-moon.dc.html`, `F-moon-close.dc.html` | A new moon for Night |
| G | `G-dusk-home.dc.html`, `G-dusk-scene.dc.html`, `G-dusk-home-2.dc.html`, `G-dusk-scene-2.dc.html`, `G-dusk-combo-home.dc.html`, `G-dusk-combo-scene.dc.html` | The Dusk sun, on Home and in its Tanafas scene (one column per variant; G0–G6, G7–G13, then G14–G17, G13 + G7) |
