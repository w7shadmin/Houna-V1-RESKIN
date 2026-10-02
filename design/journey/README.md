# Houna UX journey canvas

The app's journey for the product showcase, on a Design canvas of its own:
https://claude.ai/artifact/VJ6Wy62u7pL2vFj2RPtgjj ("Houna — UX journey").
A cover, a journey map (every stage's goal, what Houna does, and how it
should feel, as a curve), then one board per stage with the real screens in
phone frames, joined by the step between them.

- The screens are captured from the web preview at 390 × 844 (2× for
  sharpness) with showcase mode on (`lib/showcase.ts`), then uploaded to the
  canvas as assets; `assets.json` maps each screen's name to its uploaded url.
  The captures themselves aren't kept in the repo.
- `scripts/make-journey.js` writes every board and `project/canvas.json`:
  `node design/journey/scripts/make-journey.js`. With `--local <dir>` it
  points the images at local files, for a preview before publishing.
- `project/`: a snapshot of the canvas's files. The live canvas is the source
  of truth; re-read it before publishing over it.

To change a screen: capture it again, upload it, update `assets.json`, run the
script and publish the boards that use it.
