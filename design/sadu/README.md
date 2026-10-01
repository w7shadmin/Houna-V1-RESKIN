# Houna — Sadu

Al Sadu weaving brought into Houna, explored as variants on a Design canvas of its own,
https://claude.ai/artifact/RKWjRt6u5F82cUzjFBZBHF ("Houna — Sadu"). Exploration only: nothing here
changes the app. Picks go to `PICKS.md`, then to the Houna Redesign canvas and the app.

- `scripts/sadu-kit.js`: the motifs as woven cells (Hubub seeds, Dealla ribs, Eein eye, Dhurs al-Khail
  horse teeth, Uwairjan facing triangles, the Shajarah tree, plus checkers, lozenges and seed lines),
  drawn as straight bands, as stitches (`bead`), or wrapped into rings; the theme palettes; and simple
  silhouettes of Kuwait Towers, Liberation Tower, the Grand Mosque, a boom, a zubaidi and a camel.
- `scripts/make-sadu.js` writes every board and `project/canvas.json`:
  `node design/sadu/scripts/make-sadu.js`. It reuses the Explorations kit and the app's own values
  (`constants/kuficRing.ts`, the scene colours).
- `project/`: a snapshot of the canvas's files. The live canvas is the source of truth; re-read it
  before publishing over it.

| Row | Board | The question |
| --- | --- | --- |
| 0 | `Main.dc.html` | Direction, the motifs and the palettes |
| H | `H-inspiration.dc.html` | From the inspiration images: stitches, checkered teeth, the star medallion, the Towers in the diamond, upright bands, a weathered poster |
| A | `A-rays.dc.html` | The sun's rays, woven |
| B | `B-breathing.dc.html` | Breathing, woven (the loom, the eye, a band round the orb, box breathing, the shuttle) |
| C | `C-words.dc.html` | Words round the sun and moon |
| D | `D-splash.dc.html` | Splash intros for Sunrise and Dusk |
| E | `E-scenes.dc.html` | The Tanafas scenes, a few Kuwaiti landmarks |
| F | `F-app.dc.html` | Around the app (tab bar, headers, loading, Recap, badges, Home) |
| G | `G-night.dc.html` | Night |

Motif names follow published research on Kuwaiti Al Sadu; confirm the drawings and any Arabic names
with the Sadu House (AlSadu Society, alsadu.org.kw) before anything ships.
