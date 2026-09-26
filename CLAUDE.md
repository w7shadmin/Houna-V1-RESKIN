# Houna app

A bilingual (Arabic/English) mental wellness app built with Expo / React
Native. This file documents the **foundation** — the backend, data model,
navigation shape, and bilingual/RTL infrastructure that should stay stable —
separately from the **current skin** — today's specific colors, fonts, and
visual language, which exists to be replaced. Starting a visual redesign?
Read "Current skin" and "How to reskin" first. Extending features? Read
"Foundation" first.

## What this app is

Feature-level description, independent of how any of it is currently styled:

- Bilingual EN/AR throughout, full RTL support, every string routed through
  a central catalogue.
- Two account types: Guest (anonymous, device-only) and Alias (a claimed
  username, no real name or email required).
- A content directory of therapists, organizations, wellness centers, and
  articles, scraped and cached from an external site via a Supabase Edge
  Function proxy.
- Events and speaker listings.
- Tanafas: a bundle of breathing exercises, guided meditation with ambient
  audio/video scenes, and a private on-device journal with mood tracking.
- A lightweight social layer: streaks and badges for exercise consistency,
  an opt-in country-level community map, and Voices — a moderated
  community post/photo forum.
- Local and remote push notifications for reminders and broadcasts.

## Foundation — do not casually change

### Tech stack & commands

```
npx expo start          # dev server
npx tsc --noEmit         # typecheck — run before claiming work is done
npx expo install <pkg>   # always use this, not npm install, for Expo packages
```

Expo Router (file-based routing under `app/`), Supabase (Auth/Postgres/
Storage/Edge Functions) as the sole backend, `expo-sqlite` for the
on-device journal.

Windows note: Metro's watcher can crash with a "spawn UNKNOWN" error if
`node_modules` changes while it's running (e.g. mid-`npm install`). Restart
with `--max-workers 2` if this happens.

Changing the app icon or any native splash asset (`app.json`'s `icon`,
`android.adaptiveIcon`, or the `expo-splash-screen` plugin config) requires
`npx expo prebuild --clean` followed by reinstalling the Android dev client
— a plain JS reload won't pick up native asset changes.

**Adaptive icon**: `android.adaptiveIcon.foregroundImage` is
`assets/images/adaptive-icon.png` — the white mark alone on a transparent
canvas at ~46% of its width, over `backgroundColor`. Android's launcher
mask only shows the center ~66% of the foreground layer, so never point it
at the full-bleed `icon.png` (that crops the ring to the edge). Regenerate
the foreground from `icon.png` if the mark changes, keeping it inside the
~61% safe-zone circle.

### Supabase conventions

- **RLS everywhere.** Every table has row-level security; don't disable it
  as a shortcut.
- **`INSERT ... RETURNING` gotcha**: Postgres checks the SELECT policy on a
  freshly inserted row whenever `.select()` is chained after `.insert()`.
  If the caller's role has no SELECT policy on that table, the insert
  itself fails even though its `WITH CHECK` passed. Don't chain `.select()`
  onto an insert unless a SELECT policy actually exists for the caller.
- **Embedded-join RLS gotcha**: `.select('...,profiles(username)')`
  silently returns `null` for the joined field on any row the caller
  doesn't own, because `profiles` RLS only allows reading your own row.
  Don't rely on embedded joins across tables with owner-scoped RLS — write
  a `SECURITY DEFINER` RPC that pre-joins and returns only the safe fields
  instead (see `get_voice_feed`, `get_leaderboard`, `get_country_counts`
  for the pattern).
- **Storage buckets** follow an owner-folder-scoped convention:
  `{bucket}/{user_id}/{filename}`, public read, write restricted to the
  owning folder. `lib/storageUpload.ts`'s `uploadToBucket()` is the shared
  upload helper — use it for any new user-photo upload rather than
  re-inlining the fetch → arrayBuffer → upload → getPublicUrl sequence.
- **Key format**: this project has both legacy JWT-style keys (`eyJ...`)
  and new-format keys (`sb_publishable_...` / `sb_secret_...`). An Edge
  Function's auto-injected `SUPABASE_SERVICE_ROLE_KEY` env var is the new
  `sb_secret_...` format, not the legacy JWT — don't assume which format
  you're comparing against.
- **Google sign-in requires dashboard setup, not just code**: the Google
  provider must be enabled in the Supabase dashboard (Authentication →
  Providers → Google) with a client ID/secret. It's currently disabled on
  this project, which produces an `"Unsupported provider: provider is not
  enabled"` error at sign-in — that's a project setting, not a bug in
  `components/account/GoogleButton.tsx` or the auth call.

### Bilingual & RTL infrastructure

The *mechanism* is foundation; the *copy* is content, and belongs to
whichever skin is using it.

- All user-facing strings go through the string catalogue
  (`constants/*Strings.ts`, assembled in `constants/strings.ts`). Never
  hardcode a string in a component.
- Use `paddingStart`/`paddingEnd`, `marginStart`/`marginEnd`, `start`/`end`.
  **Never** `left`/`right` for layout.
- Let `flexDirection: 'row'` auto-reverse. Don't manually reorder arrays
  based on `isRTL` — that double-reverses.
- `isRTL` (from `useLanguage()`) is only needed where the framework
  genuinely can't help: choosing a font family, and flipping directional
  icons (chevrons, back arrows).
- All numbers render as Arabic-Indic numerals (٠-٩) in Arabic via
  `lib/arabicNumerals.ts`'s `arabicNumber()`; plural forms go through
  `arabicPlural()`, which enforces Arabic agreement — 0/1/2/3–10/11+ each
  take a different form (٣ دقائق, not ٣ دقيقة).
- Direction switching (`contexts/LanguageContext.tsx`) uses
  `I18nManager.forceRTL()` plus a native reload (`expo-updates`, with a
  `DevSettings.reload()` fallback for Expo Go, and a visible restart
  prompt if both fail) on native, and `document.documentElement.dir` on
  web. Test any change to this file on both platforms — a fix that only
  reloads correctly on web can silently leave native mid-transition.

### Safety requirements — not preferences

This is a mental health app; some users are in distress. These hold
regardless of visual skin:

- **Breath retention (Wim Hof / "Nervous System Reset") was removed** after
  device testing. If any breath-hold exercise is ever reintroduced, it must
  show a full-screen safety warning before every session, acknowledged
  explicitly, never persisted across sessions; its retention timer counts
  **up**, never auto-advances at a target, never pressures continuation,
  and has no streaks or personal bests. The user ends the hold themselves.
- Crisis resources must never be buried behind a generic label or deep
  navigation.
- No streaks or guilt mechanics on mood logging (`lib/streaks.ts` tracks
  exercise-session consistency only, never mood).

### Journal & mood — privacy requirements

On-device only (`expo-sqlite`, `lib/journal.ts`), not tied to an account,
not synced. No PIN or biometric lock for the MVP.

- Entries carry a UUID and an `updatedAt` timestamp even though nothing
  syncs yet, so sync can be added later without a data migration.
- Must provide an export — a local-only journal with no export means a
  lost phone is total data loss.
- Never write copy claiming the journal "never leaves the device" — it's
  included in the phone's normal OS backup.

### Navigation shape

Home | Directory | [Tanafas] | Events | More. Tanafas is **not a tab** —
it's a raised center button opening a modal, and it never shows an active
state. This is information architecture, separable from how the tab bar is
*rendered* (icons, colors, the raised-button treatment).

**Hub-first navigation gotcha**: a nested tab's subpage (e.g.
`/directory/professionals`) can be entered two ways — via its own hub
(`/directory`) or via a shortcut link from elsewhere (e.g. Home's
"Professional Resources" row). `router.back()` from the subpage only
reliably returns to the hub for the first path; on the shortcut path, the
hub may not actually be in the navigation history (confirmed: pushing the
hub then the subpage in two `router.push` calls does **not** reliably
create two history entries — they can collapse into one, especially on
web, where `back()` maps to real browser history). The robust fix used
here: subpages that are conceptually always children of a hub
(`professionals/index.tsx`, `organizations/index.tsx`,
`wellness-centers/index.tsx`) have their back button call
`router.replace('/directory')` explicitly instead of `router.back()` —
deterministic regardless of entry point or platform.

### Pressed-state convention

Pressing a card or control dims it — `pressed && { opacity: 0.85 }` — as
one coherent change (`components/ui/Card.tsx`, `Button.tsx`). Never overlay
a second colour fill on top of a surface that also has a static border or
glow: two highlights read as competing. Plain chips may use the
`colors.cardPressed` fill instead (`Chip.tsx`), since they have nothing
else lit.

### The breathing session shell

Breathing exercises run in place on the Tanafas hub, not on screens of
their own: `components/tanafas/BreathePlayers.tsx` has one player per kind
(timed phases, five-senses grounding, muscle relaxation), and the timed
player's `useBreathCycle` is the reusable phase state machine. Every
exercise's timings live in `constants/breathPatterns.ts`. Never hardcode one
exercise's timings into a player. Meditation lengths are chosen on the hub
too (`MEDITATION_MINUTES`, passed as the `minutes` route param), so the
full-screen player starts straight away. Every breathing and meditation
session ends with `lib/sessionEndAlert.ts`'s gentle buzz.

## Current skin — Night / Dusk / Sunrise

Designed on the canvas at https://claude.ai/artifact/EMxmwt7o1Uq6kx32BdAUA7
(Night row = primary, Dusk row = the light theme once called Daylight,
Sunrise row = Houna's original brand palette). The scripts that generate its
boards, and a snapshot of its files, are in `design/canvas/` (see its README;
re-read the live canvas before publishing). Everything below is today's
visual choice, not a requirement; take values from the canvas, never by eye.

**Themes** (`constants/theme.ts`): `nightColors` / `dayColors` (Dusk; still
`day` in code) / `sunriseColors`, built from the sheet swatches
(`nightPalette`, `dayPalette`, `sunrisePalette`). There's no "follow the
phone" option: the theme is the person's pick in Profile / More →
Appearance (Sunrise · Dusk · Night, `APPEARANCE_OPTIONS`), persisted
locally, Night until they choose. **Read tokens with `useTheme()`** — there
is no static `colors` export; a theme switch re-renders in place. `isNight`
is for Night-only features (the starfield, Home's stars, status bar); for
colours, branch on tokens, not on the scheme. A tone (`colors.tones.*`) has
`fg` (icons, fills), `text` (labels, links, tags — deeper where `fg` is too
light to read, as Sunrise's coral and sky are) and `hue` (the light colour
for glows and tinted fills); don't reach for `nightPalette` hues for glows. Cards are border-only (no drop shadows);
light comes from glows (`shadows.glow`, `raisedButtonShadow`, `ScreenGlow`).
Content caps at 430px (`layout.maxContentWidth`).

**Fonts** (`latinFontFamily` / `arabicFontFamily`, via `useLanguage().fonts`):
Figtree body + Marcellus display + DM Mono tracked-caps labels for Latin;
IBM Plex Sans Arabic body + Amiri display for Arabic, whose labels are
untracked Plex (`fonts.labelTracked` is false).

**8-point grid**: sizes, gaps and paddings are multiples of 8, with 4 and
12 (`grid(0.5)`, `grid(1.5)`) for tight inner spacing — `grid(n)` /
`spacing` in `theme.ts`. Screen side padding is 16 (`layout.screenPadding`),
not the canvas's 20. `TabBar` is the reference: 64 above the inset (8 · 24
icon · 4 · 20 label · 8), raised button 56 sharing the icons' bottom edge.
Spacing is on the grid everywhere except About and Voices; snap those when
touched.

**Android nav bar**: the tab bar runs edge-to-edge under the system
buttons. RN 0.81 re-enables the nav-bar contrast scrim at startup (a dark
band in Night), so `plugins/withNavigationBarContrastOff.js` turns it off
in `MainActivity` — `app.json`'s `enforceContrast` alone isn't enough.

**Primitives** (`components/ui/`): `Button`, `IconButton`, `Chip`, `Card`,
`IconTile` (the one tile pattern: glow / dawn / dusk / bloom tones), `Label`,
`TabBar`, `CanvasIcon` (canvas stroke icons; use `DirectionalIcon` for ones
that mirror in RTL), `Orb`, `ScreenGlow`. Build new UI from these.

**Logo**: `components/Logo.tsx` (`variant="themed"` recolours the official
artwork's fills from `colors.logo`; paths untouched) and `HounaMark.tsx`
(the pin alone). The splash intro uses the same tokens.

**Meditation player — permanent dark focus mode, decided**: its chrome sits
over full-screen video, so `components/meditation/MeditationPlayer.tsx`
uses Nightlight Midnight/Moonlight in both themes (`FOCUS`). Its background
audio can only be verified in an Android dev-client build.

**Native splash**: `app.json` has Daybreak and Midnight (`dark`) grounds;
needs `npx expo prebuild --clean` + reinstalling the dev client to apply,
like `userInterfaceStyle: "automatic"`.

**Legacy, still to migrate**: the old `palette` export and older styling
(`shadows.card`, `primaryLightest`) remain on About, More's leftovers, Voices
and `ComingSoon`. Move them onto the primitives and tokens when touched, then
delete `palette`.

**Account screens** (`app/account/*`) are built from
`components/account/AccountKit.tsx`: `AccountScreen` (back button, tracked
eyebrow, display title), `Field`, `FormMessage`, `OrDivider`, `SwitchLink`,
`SettingsGroup`/`SettingsRow` and `ThemedSwitch`. Use these for any new
account or settings screen.

**Houna starfield** (Night only): tapping Home's mark fades Home's chrome
and the tab bar (`contexts/StarfieldContext.tsx`, one shared `chrome`
value) and hands the mark to `app/starfield.tsx`, a transparent modal that
draws its moon at the measured spot (`x`/`y` params), then glides it to the
middle over a turning, twinkling sky with shooting stars
(`components/starfield/`), the mark becoming the moon on the way: a small
solid teal disc about the mark's size with the mark pressed in
(`MoonDisc`), its halo joined to the disc's edge (`EdgeHalo`). The moon is
in tonight's real phase (`lib/moonPhase.ts`, from the date alone: offline, no
permissions), lit on the right while waxing as seen from the Gulf, the dark part
in earthshine with the mark just visible. The lit shape is two clipping windows
over whole faces (a half-disc slid sideways, a round window squeezed across), so
the pressed mark never distorts and the breath animates natively: the lit part
swells a little on the in-breath, never past the quarter line, and the halo
follows the light (full on full-moon nights). On full-moon nights only (the
"full" eighth of the cycle, three or four nights a month) a wide, faint ring
circles it too (the canvas "Moon halo" concept). Canvas: "Houna moon — real
phases", option B. The moon fades as one layer (`needsOffscreenAlphaCompositing`):
Android otherwise fades its stacked faces separately and it seems to sweep
through phases. The only word is "Tanafas"; tapping the
moon or Back reverses it. Home's mark is `components/starfield/MarkHalo.tsx`
(dot ring, edge halo, 5s breath), and it crossfades into the moon mid-glide;
ambient loops use `hooks/useCalmLoop.ts` (focus- and Reduce-Motion-aware).
Every visit counts as a breathing session (`starfield`, titled Tanafas in
Recap): the foreground time from arrival until the moon is tapped, with the
app-wide 10s minimum (`MIN_SESSION_SECONDS`), into Recap, streaks and the
leaderboard.

**Houna sunrise and Houna dusk** (Sunrise and Dusk; the starfield's
counterparts, canvas "Houna sunrise" / "Houna dusk"): the same handoff from
Home's mark, to `app/sunrise.tsx` / `app/dusk.tsx`, thin wrappers round one
scene (`components/sunrise/SunScene.tsx`) that reads a `SunScene` from
`theme.ts` (`sunriseScene` / `duskScene`). A first sky comes in as Home steps
back (pre-dawn; golden hour), and the mark glides down as the moon does to
where that sun settles (`settle`: the moon's 0.42; Dusk's lower 0.55, a
setting sun), becoming a small sun (`SunDisc`: pale-gold with short turning
rays; amber with none; the mark pressed into it) as the second sky takes over (morning; violet dusk,
where `FirstStars` then come out, with the starfield's `ShootingStars`
now and then). The disc and mark stay still; the edge
halo, rays and wide sunglow breathe on the shared clock exactly as the
moon's halo does. Counted as `sunrise` / `dusk` sessions, titled Tanafas in
Recap. Every theme's mark now opens a scene. All three share
`hooks/useBreathingScene.ts` (the measured handoff, visit counting,
keep-awake / hidden bars / Back); keep one animation per value inside a
parallel, or stopping one stops all. The web preview may only paint frames
on demand, so JS-driven animations there can look stuck mid-way; that's the
preview, not the scene.

**Tanafas player**: the Breathe and Meditate carousels share
`components/tanafas/PlayerFrame.tsx` (stage, title row, tag, description,
tiles, round button). Pressing play on a breathing exercise keeps the
layout and fades each slot over to the session (round, phase, time left).
The stage (`BreatheStages.tsx`) is a ring of dots around a translucent,
glassy orb that inflates and deflates (box breathing: a square of dots
around a rounded-square orb), with the Houna mark pressed into its middle
(one even shape a shade deeper than the orb, scaling with it: `components/ui/PressedMark.tsx`, the
one pressed mark the orbs, the suns and the moon share); the screen glow breathes with it.
The dots move on Home's clock (`StarfieldContext`), rippling like its ring;
a ring also turns (not while grounding lights it, never the square, whose
corners the bead follows), and none take Home's 5s breath, which would
fight the exercise's own pace.
Nothing is drawn over the orb: grounding's count is in its prompt, muscle
relaxation's countdown in its Tense / Release label. Tones: 4-7-8 glow, box
dusk, five senses dawn, muscle relaxation bloom (a fourth tone, the mood palette's rose, so neighbours in the carousel never share a colour). Meditate's stage
(`SceneStage.tsx`) plays the scene's footage muted inside its orb, cropped
to `videoFocus` in `components/meditation/scenes.ts`; the plain orb shows
for scenes without footage.

**Directory pages** are all in the canvas language now: list pages use
`components/directory/PageHeader.tsx`; the professional / organization /
wellness-center pages share `components/directory/ProfileKit.tsx` (from the
canvas "Professional profile" artboard) with data cleanup in
`lib/directoryProfile.ts` — the scraped socials include Houna's own footer
accounts (filtered by `ownSocials`), info labels arrive in the page's
language (mapped by `profileFacts`), and text can carry HTML entities.
Events (list, event, speaker) uses the same pieces; event dates go through
`lib/eventDate.ts` (the site sends "19/05/2026, 19:00 pm").

**Known web-only quirks (native is fine)**: react-native-web resolves
`start`/`end` offsets as LTR even in Arabic; lucide icons with an RTL flip
transform draw off-screen on web (use `DirectionalIcon`).

**SVG gradient gotcha (native only)**: react-native-svg drops a `<Stop>`'s
`stopColor` alpha on the phone and uses `stopOpacity` alone, so an
`rgba(...)` stop (e.g. from `alpha()`) draws fully opaque there while web
draws it translucent. Always spread `lib/svgStop.ts`'s `stopProps(color,
opacity?)` into a `<Stop>` rather than passing an rgba `stopColor`.

**RTL gotcha for measured positions (native only)**: in Arabic, Android
swaps `left`/`right` style offsets too (RN's `swapLeftAndRightInRTL`), so
anything placed by measured, physical screen pixels (e.g. the starfield's
moon, handed over from `measureInWindow`) lands mirrored. Such scenes set
`direction: 'ltr'` on their root (native only; web never swaps and rejects the
style), as `app/starfield.tsx` does. The web preview can't show this bug.

**Known inconsistency, not fixed here**: about 6 screens hand-roll their
own loading/error state instead of the shared `LoadingState`/`ErrorState`/
`InlineError` components (`components/directory/AsyncState.tsx`) used in
~13 others. Cosmetic only — worth normalizing next time one of those
screens is touched.

## How to reskin

1. Update `nightPalette` / `dayPalette` / `sunrisePalette` and the
   `nightColors` / `dayColors` / `sunriseColors` token sets in
   `constants/theme.ts` — every screen reads them through `useTheme()`.
2. Change `latinFontFamily` / `arabicFontFamily` and the font loading in
   `app/_layout.tsx` together.
3. Re-decide the meditation player's focus mode (`FOCUS`) and the native
   splash colours in `app.json`.
4. Keep the logo artwork; recolour it only through `colors.logo`.
5. If the brand name or voice is changing — not just the colors — update
   the copy in `constants/*Strings.ts` too. The brand name and tone are
   woven into full sentences, not isolated as a single swappable token.
6. Restyle `components/ui/*` first; screens compose those primitives.
7. Re-verify RTL after any layout change — reflow bugs show up specifically
   in the Arabic direction even when the English layout still looks fine.
