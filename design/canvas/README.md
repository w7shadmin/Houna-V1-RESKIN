# Houna Redesign canvas

The design canvas lives at https://claude.ai/artifact/EMxmwt7o1Uq6kx32BdAUA7
("Houna Redesign"). This folder holds what builds it, so the work can carry on
from any machine:

- `project/`: a snapshot of the canvas's files (one `*.dc.html` per board,
  plus `canvas.json`, the board positions), and the four SVG assets beside it.
  The live canvas is the source of truth. Before editing a board or
  `canvas.json`, re-read the live copy (the canvas re-saves `canvas.json` when
  boards are moved, and a publish over a newer version is rejected).
- `scripts/`: Node scripts that generate or patch boards in `project/`.

## Scripts

Run from anywhere with `node design/canvas/scripts/<name>.js`. They read the
app's own files (the logo paths, `CanvasIcon`, `lucide-react-native` in
`node_modules`) so the canvas matches the code.

Generators (build a board from scratch; safe to re-run):

| Script | Board |
| --- | --- |
| `make-appicons.js` | App icon — every option (also exports the mark and halo helpers) |
| `make-gcc.js` | App icon — GCC editions |
| `make-icons.js` | Icon library (Night, Dusk, Sunrise) |
| `make-sunrise.js` | Houna sunrise / dusk scenes and storyboards, and their pressed versions |
| `make-pressed.js` | Pressed logo — side by side |
| `make-moons.js` | Houna moon — concepts |
| `make-moonphase.js` | Houna moon — real phases |
| `pressed-kit.js` | Shared pieces: the discs and the pressed mark |

Patchers (edit existing boards in place; read before re-running, they aren't
all idempotent): `make-starfield.js`, `make-tanafas.js`, `make-morning.js` +
`finish-morning.js` (the Sunrise row from the Night boards), `canvas-map.js`
(`map-data.json`), `canvas-moods.js`, `canvas-moods7.js`.

`preview-moonphase.js <offsets…>` writes static previews of the moon-phase
board to the app's `public/` for the Expo web preview. Delete `public/`
afterwards.

## Publishing

Publish with Claude's Artifact tool as an update to the canvas URL, with
`root` set to this folder, `file_path` set to `project/Main.dc.html`, and the
changed boards and `canvas.json` listed in `files` (e.g.
`"project/MoonPhases.dc.html": "project/MoonPhases.dc.html"`). When adding a
board, give it a spot in `canvas.json` that overlaps no other board.
