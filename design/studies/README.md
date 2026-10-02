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
  overlaps): `node design/studies/scripts/make-studies.js`. Rows H and I are drawn
  in `scripts/study-hi.js`, rows J and K in `scripts/study-jk.js`, which it calls. It reuses the
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
| H | `H-moods.dc.html`, `H-moods-ar.dc.html` | Recap’s moods slide, “Your emotional landscape”: six new ways to draw the month’s feelings (H1–H6) beside today’s orbs (H0), in Night; four in Arabic |
| I | `I-i0-today.dc.html` … `I-i5-the-mark-lit.dc.html` | The nine badges and Profile’s three number icons: five directions (I1–I5) beside today’s gems (I0), each in Night and Sunrise or Dusk, earned and not yet |
| J | `J-suns-1.dc.html`, `J-suns-2.dc.html`, `J-suns-close.dc.html` | A glass sun for Sunrise: the moon's glass given to the sun, eight ways (J1–J8) beside today's disc (J0), in the morning scene and on Home, then all nine close |
| K | `K-rays-1.dc.html`, `K-rays-2.dc.html` | The sun's rays: nine other geometries (K1–K9) in today's lines-of-light style beside today's eight-point stars (K0); any J sun takes any K rays |
