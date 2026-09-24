# Houna Reskin Brief

**This is the file to attach directly to a new Claude session's message**,
alongside your prompt describing the new visual direction and any
inspiration/reference images. Unlike `CLAUDE.md`, which only auto-loads
when a session is rooted in this project's folder, this file is meant to
travel with the request itself.

Read this file, then read `CLAUDE.md` (full architecture, screen inventory,
and a step-by-step "How to reskin" checklist) before touching any code.

## The one non-negotiable

Houna's brand identity — the name, the logo mark, the mission/voice — stays
fixed. Only the visual language is open: colors, type, component style,
spacing, layout. If the inspiration material you've been given conflicts
with keeping the brand identity intact, the brand identity wins; adapt the
new visual language around it, not the other way around.

If the brand name or voice genuinely is changing too — not just the look —
that's a bigger conversation than this brief covers. Stop and confirm that
explicitly before proceeding; don't infer it from an inspiration image.

## Kickoff procedure, in order

1. **Read the attached prompt and any document fully before opening a
   single inspiration image.** Understand what's being asked before
   forming a visual opinion from a picture.
2. **Verify the provenance of every piece of reference material before
   treating it as ground truth.** Don't assume a screenshot, a folder of
   images, or a linked site is "the current app" or "the target design"
   without confirming it. A prior session on this project lost real time
   treating screenshots from an unrelated reference prototype (in a
   sibling folder) as if they were this app — the mismatch was only caught
   by reading that prototype's own config file. Ask if you're not sure
   what a piece of reference material actually is.
3. **Extract exact values wherever a real source exists** — a design file,
   a config file, a live site's computed styles — rather than eyeballing
   colors or spacing off a screenshot. An earlier icon-color pass on this
   project went through several rounds of correction specifically because
   early attempts approximated values instead of deriving them exactly.
4. **Only then read `CLAUDE.md`** for the architecture and the existing
   "How to reskin" checklist, and start implementing.

## Pre-decided defaults

So you don't need to stop and ask about these — they're already decided:

- **Icon tiles**: two patterns currently coexist — `FlatIconTile.tsx`
  (flat pale background + saturated icon; used on 5 screens: Home's
  Professional Resources row, Directory hub, Tanafas hub, Breathing &
  Grounding list, Impact stats) and `GradientTile`/`IconTile3D` (glossy
  3D-bevel, forced-white icon; still used in the Directory topic-grid
  screen and Home's resources rail). Treat both as reusable infrastructure
  to re-theme, not something to freely replace screen-by-screen. Default
  to converging on **one** pattern for the new visual language, unless it
  has a real reason to keep two.
- **`components/ui/Button.tsx` / `Card.tsx`**: currently unused starter
  primitives — nothing in the app imports them yet. Build them out into
  real, adopted primitives as part of the reskin, rather than continuing
  to hand-roll one-off styles per screen.
- **Background meditation audio is functionality, not visuals** — it must
  keep working exactly as-is (plays while backgrounded/locked, Android
  confirmed working, iOS untested) regardless of how the meditation
  screen looks afterward. It can only be verified with an Android
  dev-client build on a real device — not Expo Go, not the web preview.
- **The two hardcoded-dark screens** (the splash intro and the meditation
  player) bypass the normal light-mode color tokens on purpose today.
  Decide deliberately whether the new visual language keeps that as a
  permanently-dark "focus mode" for just those two screens, or unifies
  them with everything else — don't carry it forward by default without
  a decision.
- **The pressed-state convention** (see `CLAUDE.md`'s Foundation section)
  — cards combining a border with a static tinted shadow must dim via
  opacity on press, never overlay a separate colored fill on top of the
  shadow. This was a real, just-fixed bug (a double-highlight effect); a
  new visual language is free to change what "pressed" looks like, but
  whatever it becomes, applying it should stay a single coherent change,
  not two colors fighting.
- **The Directory hub-first navigation fix** (also in `CLAUDE.md`'s
  Foundation section) is load-bearing, not stylistic — the back-button
  behavior on `professionals/`, `organizations/`, and `wellness-centers/`
  must keep working the same way after a layout change.

## Known drift to double-check, not trust blindly

`CLAUDE.md`'s "Current skin" section, under **Legacy icon-tile exception**,
still frames `OLD_MVP_ICON_HEX` as "safe to drop entirely" — written before
`FlatIconTile` became a real, 5-screen-adopted component. Dropping it now
means deciding the fate of an actively-used component (see "Icon tiles"
above), not deleting a few inline hex references. Verify this section
against the actual code before acting on it literally.

## Verification discipline — a hard rule, not a suggestion

- **Never declare a visual change done without running the dev server and
  looking at a live screenshot.** Code that "should" look right and code
  that's been visually confirmed are not the same thing.
- **Never approximate a color, font, or spacing value when an exact
  source is available.** This is the single most load-bearing lesson from
  this project's own icon-color work — it took several rounds of
  correction to learn it the first time.
- **Re-verify RTL after every layout change**, not just at the end.
  Reflow bugs show up specifically in the Arabic direction even when the
  English layout still looks fine — `CLAUDE.md`'s bilingual/RTL section
  has the mechanics.
- A redesign of the meditation screen specifically **cannot be verified in
  Expo Go or the web preview** — background audio only works in a native
  dev-client build. Don't call that screen done from a web screenshot.
