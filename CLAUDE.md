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
- **Google sign-in is dashboard setup, not just code** (enabled 29 Sep 2026): one **Web** OAuth
  client in Google Cloud (Google Auth Platform, published, scopes openid/email/profile only, no
  logo, so no Google review), its redirect URI Supabase's
  `https://jzvwbfvimjdjlikseqec.supabase.co/auth/v1/callback`, its ID and secret in Authentication →
  Providers → Google (nonce checks on). The app signs in through the browser on every platform
  (`signInWithOAuth` + PKCE), so no Android or iOS client is needed; the app's return address
  (`houna://`, and the web preview's localhost) must be in Authentication → URL Configuration →
  Redirect URLs, or Google lands people on the website. `"Unsupported provider: provider is not
  enabled"` means the provider was switched off, not a bug in `GoogleButton.tsx`.

### Security baseline (pre-release audit, 28 Sep 2026)

Keep these when changing anything nearby:

- **Release signing**: Android releases are signed with Houna's own upload key, never the public
  debug key (`plugins/withReleaseSigning.js`). The keystore and passwords live outside the repo
  (`D:/houna-keys/`, wired through `~/.gradle/gradle.properties`, `HOUNA_UPLOAD_*`). A machine
  without them builds with the debug key and a loud Gradle warning: never share that build.
  Losing the key means testers must uninstall (and lose their journal) to update. The package
  name is still `com.anonymous.houna`, to change once the domain is bought (a new app for
  Android, same key).
- **Permissions**: only what's used. `app.json` `blockedPermissions` strips microphone, camera,
  draw-over-apps and legacy storage (the picker uses Android's photo picker); on iOS the plugins
  declare no microphone or camera (`microphonePermission: false`, `cameraPermission: false`), so the
  photo library is the only usage string.
- **Database** (`supabase/migrations/20260928160000_security_hardening.sql`):
  - sessions: 0–8h, `completed_at` after `started_at`, inserted within a day of starting, never
    overlapping one another (`refuse_overlapping_session`), so the leaderboard can't be forged;
  - badges: only the app's codes;
  - `get_leaderboard`: signed-in only;
  - storage: images only (5 MB avatars, 10 MB Voices), no public listing (public links still work),
    and `image_url` / `avatar_url` must point into the owner's own folder.
- **Directory proxy**: only the filter values the app sends (`AVAILABILITY`, `SORTS`, small numeric
  ids, pages 1–60), slugs validated on every detail route, expired cache rows purged. Add a new
  filter value to both `constants/directoryStrings.ts` and the proxy.
- **Sign-in**: PKCE (`flowType: 'pkce'`, `exchangeCodeForSession`), so a redirect caught by another
  app registering `houna://` is useless. Passwords at least 8; sign-up doesn't confirm which emails
  have an account. Sign-out removes this phone's push token.
- **Links and images from outside**: scraped links open only through `safeUrl` (http(s), mailto,
  tel), including links inside articles (`RenderHTML`'s `renderersProps`); an image handed over in a
  deep link loads only from houna.org (`trustedImageUrl`); route slugs are encoded
  (`encodeURIComponent`) before reaching the proxy.

### iOS parity

Every Android-specific change needs its iOS counterpart. What's in place (checked by
`npx expo config --type introspect`: Expo can't generate the iOS project on Windows, so nothing
here has run on an iPhone yet; builds go through EAS Build, testers through TestFlight):

- `ios.infoPlist.UIBackgroundModes: ["audio"]`: meditation keeps playing locked (Android's
  lock-screen player). expo-audio's own option for it would add Android microphone services.
- `ios.requireFullScreen`: iPad stays portrait, as Android tablets do; without it Apple requires
  every orientation.
- `ios.privacyManifests`: the required-reason APIs, no tracking. `ITSAppUsesNonExemptEncryption:
  false` (HTTPS only).
- `locales/` (`app.json` `locales`): the iOS permission prompt in both languages. It also makes
  iOS treat the app as Arabic-localized, so its own sheets and pickers follow an Arabic phone. Don't
  set expo-localization's `supportsRTL`: on iOS it re-forces the direction from the phone's
  language at launch, over the person's choice in the app.
- Photos: `lib/photoAccess.ts`'s `canPickPhotos()`. iOS's picker needs no permission, so it doesn't
  ask there.
- Already equal: the blur (`experimentalBlurMethod` is Android's; iOS blurs natively), the
  session-end haptic, `KeyboardSafeView`, the `direction: 'ltr'` fix for measured offsets (iOS
  swaps left/right in RTL too), and iOS's edge swipe back (it works under `animation: 'fade'`,
  sliding during the gesture; the scenes turn it off). The icon is opaque, as iOS requires.
- Not needed: the nav-bar plugin and `NavigationBar` calls (iOS has no nav bar); ATS (every
  image is `https://houna.org`; `http` links open in the browser, which ATS doesn't cover).
- Still to do: `ios.bundleIdentifier` (with the domain, alongside the Android package); Apple
  Developer account, EAS credentials and an APNs key for push; Sign in with Apple
  before the App Store (Apple requires it wherever Google sign-in is offered, which it now is); optionally hiding the home indicator in immersive sessions (a native module).

### Capacity (Supabase free plan, 29 Sep 2026)

About a thousand people a day before the free plan's limits bind, more now that search is one
call; Pro ($25/month: backups, no pausing after a quiet week, 2M function calls) takes it to
several thousand. What keeps it there, and must stay that way:

- **Function calls** (500,000 a month) are the first limit: anything a phone fetches from an Edge
  Function often (every open, every search) is bundled and kept on the phone, as directory search
  is (`houna-search-bundle`, below).
- **The community figures are computed once and shared** (`stats_cache`, migration
  `20260929180000_stats_cache.sql`): `get_community_activity`, `get_leaderboard` and
  `get_badge_shares` keep their result for 2 minutes (10 for badge shares) instead of recounting
  every session on each Home open, and `tanafas_sessions` is indexed on `started_at`. A new
  figure over all users follows the same pattern. The functions write, so call them with POST
  (supabase-js `rpc()`'s default), never `{ get: true }`.
- **Email sign-up needs its own email service before launch.** Confirmation is on and Supabase's
  built-in sender only mails the project's team (a few an hour): set up custom SMTP (Resend,
  Postmark) once the domain exists, or switch confirmation off.

### Deleting an Alias

Account settings → Delete my Alias (a quiet link under Sign out) opens `app/account/delete.tsx`:
what goes, what stays on the phone (the journal, mood check-ins and Recap's practice were never
the Alias's), and the Alias name typed to confirm (capitals don't matter; a password wouldn't cover
Google accounts). `AuthContext.deleteAlias` calls the `delete-account` Edge Function
(`supabase/functions/delete-account`), which deletes only the caller, from their token: their
`avatars/` and `voices/` folders first (storage doesn't cascade; it stops there if that fails),
then the auth user, and every table follows by `ON DELETE CASCADE`. **Any new table holding a
person's data must reference `auth.users` (or `profiles`) with `ON DELETE CASCADE`, and any new
owner-folder bucket must be added to the function's `BUCKETS`**, or deleting leaves it behind.
Immediate, no grace period. Afterwards Profile shows the guest card with "Your Alias has been
deleted" (`deleted=1`).

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
- **Crisis numbers are researched data, never typed from memory.** The crisis screen
  (`app/crisis.tsx`) shows one country's lines from `lib/crisisLines.ts`: the country chosen there
  (kept as `houna-crisis-country`), else the Alias's, else the phone's region, else it asks. Its
  emergency numbers sit inside the "in danger" card; then crisis and support lines (or a plain
  "no confirmed line" that points back to them), children, violence, addiction, refugees and
  migrant workers. Only lines rated Verified, plus emergency numbers rated Likely, from
  `research/crisis-lines/` (18 MENA countries, every line sourced, with numbers to avoid; see its
  README), and `lib/crisisLines.test.ts` enforces it. A review team is phoning the rest. Numbers in
  Arabic go through the screen's `shownNumber`: Arabic-Indic digit groups separated by spaces
  otherwise swap places even inside a left-to-right isolate.
- No streaks or guilt mechanics on mood logging (`lib/streaks.ts` tracks
  exercise-session consistency only, never mood).

### Journal & mood — privacy requirements

On-device only (`expo-sqlite`, `lib/journal.ts`), not tied to an account,
not synced. No PIN or biometric lock for the MVP.

- Entries carry a UUID and an `updatedAt` timestamp even though nothing
  syncs yet, so sync can be added later without a data migration.
- Must provide an export — a local-only journal with no export means a
  lost phone is total data loss. It's a PDF anyone can open (`lib/journalExport.ts`, via
  `hooks/useJournalExport.ts`: dated entries with their mood, in the reader's language and
  direction, printed by `expo-print` and shared through the system sheet); where `expo-print`
  isn't built in (a dev client from before it, the web) the same page goes out as an HTML file.
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
untracked Plex (`fonts.labelTracked` is false). Numbers that stand alone
(Home's count, Stats' streaks and ranks, Recap's big number) use
`fonts.numeral`: Figtree Light in Latin, since Marcellus' 1 reads as an I;
Amiri Bold in Arabic, as before (canvas "Numbers — four faces").

**8-point grid**: sizes, gaps and paddings are multiples of 8, with 4 and
12 (`grid(0.5)`, `grid(1.5)`) for tight inner spacing — `grid(n)` /
`spacing` in `theme.ts`. Screen side padding is 16 (`layout.screenPadding`),
not the canvas's 20. `TabBar` is the reference: 64 above the inset (8 · 24
icon · 4 · 20 label · 8), raised button 56 sharing the icons' bottom edge.
Spacing is on the grid everywhere (Round 4, About and Voices included; `spacing.xxs` is gone):
run `node scripts/grid-audit.js` before committing layout work; it lists any padding, margin or
gap (numbers, or `grid(n)`) off the grid, and `--fix` snaps them (a tie to the smaller; a 2 or 3
opens to 4). A line marked `// grid-ok` is skipped. Sizes aren't audited: components keep their
designed sizes (the 52 pill button, the 44 round icon buttons, the 250 stage).

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

**Scene video framing**: a scene's video covers the screen, unless it sets
`videoFrame: { kind: 'base' }` (`components/meditation/scenes.ts`): its whole width,
resting on the bottom edge, its top fading into `ground` above. Fire does: its
9:16 footage is framed tight, and covering a tall phone cut a fifth off each side.

**Meditation player — permanent dark focus mode, decided**: its chrome sits
over full-screen video, so `components/meditation/MeditationPlayer.tsx`
uses Nightlight Midnight/Moonlight in both themes (`FOCUS`). Its background
audio can only be verified in an Android dev-client build.

**Native splash**: `app.json` has Daybreak and Midnight (`dark`) grounds;
needs `npx expo prebuild --clean` + reinstalling the dev client to apply,
like `userInterfaceStyle: "automatic"`. This is Android's launch screen,
shown the moment the icon is tapped, before the animated splash
(`components/SplashIntro.tsx`, which is separate and unchanged by it; its
possible successor, `BodySplash`, is under "First run"). Its
image is the mark alone (`assets/images/splash-mark.png` teal,
`splash-mark-dark.png` glow; never the full-bleed `icon.png`, which draws as a
teal box), centred on a transparent square: Android scales the whole picture
to ~107dp (a 160dp icon box × 2/3, whatever `imageWidth` says), so the ring
fills 42% of it, about the size of the animated splash's "o" (iOS gets
`imageWidth: 107` to match). Regenerate both images from `adaptive-icon.png`
if the mark changes.

**Legacy, still to migrate**: the old `palette` export and older styling
(`shadows.card`, `primaryLightest`) remain on About, More's leftovers, Voices
and `ComingSoon`. Move them onto the primitives and tokens when touched, then
delete `palette`.

**Account screens** (`app/account/*`) are built from
`components/account/AccountKit.tsx`: `AccountScreen` (back button, tracked
eyebrow, display title), `Field`, `FormMessage`, `OrDivider`, `SwitchLink`,
`SettingsGroup`/`SettingsRow` and `ThemedSwitch`. Use these for any new
account or settings screen. `app/account/username.tsx` is both the one-time
claim at sign-up and, once a name exists, the rename (Your Alias → Username;
`AuthContext.changeUsername`, an update under `profiles_update_own`). Nothing
else stores a copy of the name: Voices and the leaderboard read it from
`profiles`. Availability is case-insensitive, so a change of case only is
allowed as the person's own name. Renames are limited to two in any 30 days,
in the database, not the app: a trigger on `profiles` logs each change to
`username_changes` (RLS on, no policies) and refuses a third with
`username_change_limit`; `get_username_change_allowance()` tells the screen
how many are left and when the next frees up. Claiming at sign-up doesn't
count.

**Houna starfield** (Night only): tapping Home's mark fades Home's chrome
and the tab bar (`contexts/StarfieldContext.tsx`, one shared `chrome`
value) and hands the mark to `app/starfield.tsx`, a transparent modal that
draws its moon at the measured spot (`x`/`y` params), then glides it to the
middle over a turning, twinkling sky with shooting stars
(`components/starfield/`), the mark becoming the moon on the way: a small
pearl glass moon about the mark's size with the mark pressed in
(`MoonDisc`, Design studies "F4"), its halo joined to the disc's edge (`EdgeHalo`). The moon is
in tonight's real phase (`lib/moonPhase.ts`, from the date alone: offline, no
permissions), lit on the right while waxing as seen from the Gulf, the dark part
in earthshine with the mark just visible. The lit shape is two clipping windows
over whole faces (a half-disc slid sideways, a round window squeezed across), so
the pressed mark never distorts and the breath animates natively: the lit part
swells a little on the in-breath, never past the quarter line, and the halo
follows the light (full on full-moon nights). On full-moon nights only (the
"full" eighth of the cycle, three or four nights a month) a wide, faint ring
circles it too (the canvas "Moon halo" concept), coming out slowly in the starfield once the sky is
in (its own `ring` value, 2.8s, growing from 0.85; never on Home, so it can't pop). Canvas: "Houna moon — real
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
back (pre-dawn; golden hour), and the sun arrives by the scene's `entrance`.
Dusk `glide`s: the mark becomes the sun where it is (since Round 3 nothing travels: the
moon and both suns settle on the mark's anchor, Home's own spot, `ay`, in `useSceneFrame`).
Sunrise `rise`s (canvas "Houna sunrise — from below"): the mark fades where it
is, a `horizon` glow gathers along the bottom edge, and the sun comes up through
it from below the screen to the anchor, a touch larger while low, and sinks back on the way
out; but from "Sun & moon" (`fromBody`) Home's sun is already there, so it stays and grows
into the scene's, its lattice or words drawing out as it does (`SunDisc`'s `home`, 1 → 0; one
sun fading while another rose read as a glitch, and on Android the fading copy's glow was cut
square by its layer). Either way, a small sun (`SunDisc`: Sunrise's pale-gold, its rays a star
lattice, four eight-point stars from `lib/khatam.ts` turning in pairs opposite
ways, 90s and 120s a lap, drawn closer on Home by `HOME_LATTICE`, the mark pressed into it, and
no glow, on Home or in its scene (`sunGlow: false`); Dusk's a ring of light, below) as the
second sky takes over (morning; violet dusk, where `FirstStars` then come out through the
violet, most high up, thinning and fading toward the warm horizon, drifting slowly left to right
at the pace of the starfield's turning sky, with the starfield's `ShootingStars` now and
then). The disc and mark stay still; the edge
halo, rays and wide sunglow (where the scene has them) breathe on the shared clock exactly as
the moon's halo does. Dusk's sun (Design studies "G15", `duskScene.ring`) is a ring of light,
clear inside, the mark in amber in its middle, its halo breathing just outside, and the Kufic
words (`KuficRing`, هُنا · نتنفّس معًا) turning round it: gold in the scene, a lighter amber on
Home (`wordsHome`), crossfading as Home hands it over. The starfield's sky (`StarSky`) is
sized to reach the screen's farthest corner from the moon (`reach`), so the bottom has stars
too. Counted as `sunrise` / `dusk` sessions, titled Tanafas in
Recap. Every theme's mark now opens a scene. All three share
`hooks/useBreathingScene.ts` (the measured handoff, visit counting,
keep-awake / hidden bars / Back); keep one animation per value inside a
parallel, or stopping one stops all. The web preview may only paint frames
on demand, so JS-driven animations there can look stuck mid-way; that's the
preview, not the scene. A long-running web dev server can stall sending the
compressed bundle (the page stays blank with no error, though `curl` without
`Accept-Encoding` gets it at once): restart the server.

**Two Home styles, both kept while the client decides** (More → Appearance →
Home: "Sun & moon" · "Classic"; `HomeStyle` in `contexts/ThemeContext.tsx`,
persisted as `houna-home-style`, "Sun & moon" until changed). In both, the
wordmark is the appearance toggle (`components/home/AppearanceToggle.tsx`, a
strip of sun · setting sun · moon above it, the current one lit, tapping moves
to the next in `APPEARANCE_OPTIONS` order). Classic is the mark in its ring,
as above. "Sun & moon" (canvas "Home — appearance"): the mark and its ring of
dots give way to the theme's own body, alone (`components/home/HomeBody.tsx`:
the scene's sun at `HOME_SUN_SCALE`, or Night's moon, in the mark's box so
nothing round it moves). Night's is the starfield's own pearl moon in tonight's phase
(`MoonDisc` at `HOME_MOON_SCALE`, 1.25, as large as the suns; it replaced the crescent bowl, 28 Sep
2026, so the moon on Home and the starfield's are one), without the full-moon ring, which would
crowd the date (`ringOpacity`; the starfield fades it in with its sky). A change sets the current body, whole, past the right edge;
with the sky empty the colours crossfade, and once the old colours have nearly
gone the next body rises in whole from beyond the left edge (`startSkyChange`). Those directions are physical (the sky
doesn't mirror in Arabic); Reduce Motion fades the bodies in place. Home then
passes `body=1` to the scene, Night's too, and the scene (`fromBody` from `useSceneFrame`)
starts with that body whole instead of turning the mark into it (the starfield keeps the moon at
`HOME_MOON_SCALE` then: the same moon, never swapped or resized, the sky gathering round it). When one
style is chosen, delete the other and the setting.

**Home's Hijri date and the month of moons** (canvas "Phase 3 — Home: the Hijri
date" / "the month of moons"): under the logo, `components/home/HijriDate.tsx`
shows tonight's moon (`MoonGlyph`, real phase), the Hijri date and the phase's
name. `lib/hijri.ts` counts (Umm al-Qura through `Intl`, the tabular calendar,
within two days, where the engine lacks it; names in `t.home.hijri`); the Hijri
day turns at sunset, taken as 6 pm (`currentHijri`), and on the evening a month
begins the date shows the hilal, glowing, and the new month. Tapping it opens
`app/month.tsx`, a `GlassSheet` over Home (transparent modal; Back waits for the
sheet to sink, `onHidden`) holding `MonthRing`: every night of the month in its
phase round a ring from the 1st (counter-clockwise in Arabic), tap one for its
phase and date, tonight faintly ringed, and the days to the next new moon. The
nights practised glow softly behind their moons, and a tap on one says its minutes.

**Home's map** sits straight on the sky, with its periods and count (canvas "Round 2 — Home's map
without its card"): the card's box went, its padding stayed, so nothing on Home moved.

**Graphs** (phase 4, canvas "Houna — Graphs (phase 4)"), all from the phone's own
session log (`lib/sessionLog.ts`: breathing and meditation only, so mood never
counts) through `lib/practice.ts` (tested): the parts of practice
(`PRACTICE_GROUPS`: the four exercises in their tones, meditation, and `tanafas`,
Home's sky visits; short names in `t.tanafas.practiceGroups`), minutes by part,
the week (Monday to Monday, as the leaderboard's) and each day practised.
- Stats (`app/account/stats.tsx`, titled "Your practice") opens with
  `components/stats/WeekArc.tsx`: this week's minutes large on an arc split by
  part (meditation in ink, Tanafas in half-ink), drawn once as it opens (JS-driven:
  SVG strokes can't take the native driver), last week beneath with no arrow or
  verdict, then the parts. Mirrored in Arabic, so it fills from the right.
- Recap's month has a moonlight slide after meditation, when there's practice
  (`components/recap/MoonCalendar.tsx`): the month's nights as real moons, the
  days practised lit and glowing, the rest dim, never "missed", days to come
  fainter. Its moons sit above Recap's tap zones (`bodyAbove`, `box-none`), so a
  tap on a moon picks that day and anywhere else moves the story on.

**First run** (phase 5, canvas "Houna — First run (phase 5)"):
- The first breath, `app/welcome.tsx`: shown once, before anything is asked
  (`app/index.tsx` sends a launch there until `lib/firstRun.ts` says it's been
  seen, finished or skipped; so an existing install meets it once too). A
  welcome, then one guided breath on 4-7-8's `OrbStage` (no word inside), timed
  by `FIRST_BREATH` in `breathPatterns.ts` (in 4, hold 2, out 6), each line
  said to screen readers as it arrives, then Continue to Home. Nothing is
  counted. "Not now" skips at any moment. The English · العربية switch calls
  `setLanguage`, so native restarts in the other language and the breath begins
  again (the web re-renders: the breath is keyed on the language). It waits for
  the animated splash to lift (`hooks/useIntroDone.ts`). Under Reduce Motion
  the words come and the orb stays at rest. Strings in
  `constants/firstRunStrings.ts` (`t.firstRun`); the Arabic breathes in the
  first person plural, as the exercises do.
- The splash, each theme's body (`components/splash/BodySplash.tsx`): built,
  **not switched on** while the client decides (`SPLASH` in `app/_layout.tsx`,
  'intro' today). The theme's body (`Body` from `HomeBody.tsx`) rises into the
  middle, the wordmark and "Breathe · rest · return" settle beneath, about 3s;
  on "Sun & moon" it then glides to Home's body (`homeBody`, Home's measured
  mark or body in `StarfieldContext`) while Home's own steps aside
  (`haloHidden`) until it lands; Classic, the first run (no Home beneath) and
  Reduce Motion fade. When one splash is chosen, delete the other and `SPLASH`.
  `useCalmLoop` works outside a screen for it (always "focused" there).

**Account & badges** (phase 6, canvas "Houna — Account & badges (phase 6)"; the
Explorations' section E with the held Profile & badges plan):
- Profile (`app/profile.tsx`): the theme's own body (its disc, the mark pressed in; Night's is
  the pearl moon in tonight's phase, `MoonDisc` at `AVATAR / MOON_DISC`, no full-moon ring) or the
  person's photo, on the anchor in the room the Kufic ring had (`AVATAR_BOX`; the ring came off
  Profile on 28 Sep 2026). The ring itself (`components/profile/KuficRing.tsx`, هُنا · نتنفّس معًا)
  lives on in Classic Home (C1 below): one baked outline (`constants/kuficRing.ts`, from
  `design/canvas/scripts/make-kufic-ring.js`: HarfBuzz shapes Amiri Bold and sets each glyph on
  the circle), because react-native-svg's textPath doesn't join Arabic. Then, for an Alias: three numbers (the phone's
  practice streak, sessions this month, badges) and the badges card (gems held,
  the next streak badge unlit with the days to go), opening `app/account/badges.tsx`.
  For everyone, from the phone's own log (`hooks/useMonthPractice.ts`): Your sky
  (`components/profile/YourSky.tsx`, a star per day practised this month, placed by
  its date so it keeps its place, joined in order, the newest pulsing; whole in
  `app/your-sky.tsx`, tap a star for its day) and Your month in breath
  (`components/profile/MonthRidges.tsx`: minutes by part of practice as ridges, a
  seven-day average through today, `smoothed` in `lib/practice.ts`). Then My
  results, Recap and Stats as rows, and the settings. Both graphs run from the
  right in Arabic (physical offsets, `direction: 'ltr'` on native).
- The badges (`lib/badges.ts`, tested): five streak badges (3, 7, 14, 30, 100 days,
  a journey through the day) and four for exploring (the first session, all four
  breathing exercises, all four scenes, the sunrise + dusk + starfield visits), from
  the server streak and the on-device log. Aliases only: `badges_earned` keeps
  them. `hooks/useBadgeCheck.ts` awards what's due when Home, Profile, Stats or the
  badges page come into focus (so a badge arrives on returning from a session;
  never while the splash is up; one check at a time) and opens the unlock moment,
  `app/badge.tsx` (a transparent modal: the screen behind blurred, the gem rising
  into its light with sparks, the words arriving, "Lovely" to the next or out;
  still under Reduce Motion). Each is drawn by `components/badges/BadgeGem.tsx`:
  its sky in a sphere of glass lit in its own colour; locked, the same greyed.
  "Held by N% of Houna" comes from `get_badge_shares()` (SECURITY DEFINER, counts
  over `profiles`, never names; migration `20260928120000_badge_shares.sql`).
- Stats: the streak card is now the week in moons (`components/stats/WeekMoons.tsx`:
  the streak large over this week's real moons, lit on days practised, today
  ringed, days to come faint, never "missed"), the longest beneath, and a badges
  row opening the badges page. Part colours are shared (`practiceColours`).

**The sky clock** (canvas "Phase 3 — the sky clock") was removed on 28 Sep 2026, with its long press on
Home's mark or body. Sessions already logged as `sky` still count as Tanafas in Recap and practice.

**Sunrise's accent, three ways, while it's decided** (More → Appearance →
Sunrise accent, shown in Sunrise only; `SunriseAccent` in `constants/theme.ts`,
persisted as `houna-sunrise-accent`, Dark until changed): `dark`, Dark
Turquoise throughout as designed; `mixed`, the logo turquoise where there's no
text (the raised Tanafas button, the glow tone's icons) and Dark Turquoise for
text and anything carrying white text; `turquoise`, the logo turquoise
throughout, which falls short of contrast minimums (2.6:1 on the ground, 2.8:1
under white text). `ThemeContext` picks `sunriseAccentColors[sunriseAccent]`
for Sunrise. When one is chosen, keep it as `sunriseColors` and delete the
rest and the setting.

**Theme changes crossfade** (from Home's logo, More and Profile alike, and
the Sunrise accent): `ThemeContext`'s `crossfade` captures the screen (`react-native-view-shot`'s
`captureScreen`), lays the picture over the whole app, switches the colours
underneath once it's drawn, then fades it out over `THEME_FADE_MS`; it
resolves once the new colours are in place. The module is native, so a dev
client built before it was added (or the web) just switches at once: it's
loaded lazily, because its import throws when the native side is missing.

**Design studies picks** (https://claude.ai/artifact/5DqkLLhgEWF1bS4vFcf7EL, `design/studies/`,
picks in its `PICKS.md`):
- A2: Sunrise's star lattice is lines of light: each star a soft, blurred line in the pale `core`
  colour (react-native-svg's `FeGaussianBlur`) over a crisp one in the deeper coral (so it reads on
  the pale morning), breathing deeply: 0.94 → 1.08 in size, 0.3 → 1 in light (`Lattice` in
  `SunDisc.tsx`; Home's small lattice too).
- B0: the suns keep today's colours.
- C1: Classic Home's ring is the Kufic words, turning (`MarkHalo`'s `kufic` colour; `KuficRing` takes a
  `size`); the dots remain only where `kufic` is left out.
- D1: Home's Hijri date is one quiet line under the wordmark, no chip, in the chip's 28 of height so
  the body stays on the anchor (`HijriDate`).
- E4: plain pages carry the mark as a soft glow of the glow colour behind the header, fixed, never
  scrolling (`components/ui/PageMarkGlow.tsx`): the Directory hub and its list pages, Events, More,
  the journal, and, through `markGlow` on `DetailScreen` / `AccountScreen`, About, Contact, Get
  involved and Notifications; never Discover. `HounaMarkShape` through a 10px blur with the mark
  itself faintly over it (at the study's 22px it read as a cloud and went unseen), each drawn in a
  solid fill and faded as a layer: the mark's ring and figure overlap at the top, and a translucent
  fill doubled up there, drawing the top thicker.
- F4 and F2: the moon is see-through pearl glass (`MoonDisc`; Night Home's and Profile's
  too): a clear white highlight, thinning through the middle so the night and its stars show through,
  gathering at a pearly rim, with a faint sheen of teal, lavender and rose turning inside it on the
  clock's `turn` (`Sheen`). The unlit part is solid (the same pearl with the night over it at 0.82),
  and the glass is never drawn over it: a crescent draws its lit half, then the dark half and the
  terminator's ellipse on top; a gibbous or full moon draws the whole glass, then the dark lune on
  top, a thick ring (`lune`) whose hole is the terminator's ellipse, squeezed by the same native
  `scaleX` and clipped to the far half of the disc, so the breath still swells it natively.
- Sunrise's sun has no glow, on Home or in its scene (`sunGlow: false`): the disc and its lattice alone.
- G15: Dusk's sun is the ring of light with the Kufic words round it (above, under the sunrise and dusk).

**The mark in one spot** (canvas "Round 3 — the mark in one spot"): `layout.markAnchor` (199)
is where the centre of the Houna mark, or of the body, orb or gem it's pressed into, sits below
the top inset, horizontally centred, on every screen where it's the centrepiece, so it never
jumps between them. Home draws it there; the Tanafas stage is pinned to it (`STAGE_TOP` in
`PlayerFrame`, from the hub's header; 4-7-8's mark no longer lifts in a session, its word sits
lower, `WORD_DROP`), and so are Profile's ring, the first breath's orb, a new badge's gem and the
scenes' moon and suns (they grow where Home's body was, or are it, as Night's moon is). Measure any new screen against it on the web
preview at 390×844 (the centre at 199 with no inset).

**Motion** (phase 1 of the Explorations picks, `design/explorations/PICKS.md`;
canvas "Houna — Motion (phase 1)"):
- The mood check-in is a glass sheet: `app/check-in.tsx` is a transparent
  modal (`app/_layout.tsx`), so the screen behind stays, softened by
  `expo-blur` (Android uses `experimentalBlurMethod="dimezisBlurView"`) and
  dimmed. The sheet rises on one `enter` value, its parts (`Arrive`) fading up
  in turn on it, and sinks back on close, save, a tap outside or Back
  (`beforeRemove`), or when dragged down by its top (the grabber, title and
  bloom). It fits one screen, no scrolling: the bloom takes what room the rest
  leaves (`BLOOM_MIN`–`BLOOM_MAX` round `FIXED_HEIGHT`), Close sits beside the title.
- Drag down to close: `hooks/useDragToClose.ts` (core PanResponder, no native
  module; only a downward, mostly vertical move claims the touch, so taps,
  sliders and sideways swipes still work). The check-in uses it, and so does the
  Tanafas hub, which is now a transparent modal (`app/_layout.tsx`) so Home shows
  behind as it's dragged: the hub paints its own ground, and `app/tanafas/_layout.tsx`
  gives its stack a transparent navigation background (the web otherwise paints
  React Navigation's grey under every screen). Never during a breathing session or
  with a glass sheet open.
- Event cards grow into their page: a card measures its photo
  (`measureInWindow`) and passes it as params; `events/[slug].tsx`, a
  transparent modal, flies the photo to its cover (layout animated with
  Reanimated on the UI thread, so the page loading underneath can't stutter it;
  on a `direction: 'ltr'` layer, native only), fades its ground up round it and
  shrinks back on Back. The flyer and cover keep the card's own photo (`img`),
  already loaded, so nothing swaps mid-flight. Without params, or with Reduce
  Motion, it just fades.
- Controls step aside during practice: `hooks/useControlsAway.ts` (after 3s of
  stillness; a touch brings them back; never while a screen reader is on,
  checked on native only because react-native-web always reports one; no fade
  under Reduce Motion). The meditation player uses it, and so do the Tanafas
  hub's timed and muscle-relaxation sessions: `BreathePlayer` reports
  `onSessionActive`, and the hub passes `away` on to `PlayerFrame`. Grounding
  needs taps, so its controls never hide. The hub wakes on any touch or click
  (`onStartShouldSetResponderCapture` returning false).
- Words that arrive: `components/ui/ArrivingText.tsx`, Latin letter by
  letter, Arabic word by word because its letters join; screen readers get
  the whole line, and it holds still under Reduce Motion. Used for Home's
  rotating line.
- One glowing pill per screen, for the step that matters: `Button`
  `variant="glow"`, a turning ring of the four tones (`expo-linear-gradient`)
  over a pulsing haze. Used on Discover's Begin.
- The Tanafas tabs are `components/ui/GlowTabs.tsx`: a glow springs under the
  chosen tab, placed by measured physical offsets. The tabs share the room between the close
  and journal buttons equally, a label shrinking a little if it must (at 360 wide they pushed
  the journal button off the screen). Check new layouts at 360 wide as well as 390.

**Tanafas player**: the Breathe carousel is
`components/tanafas/PlayerFrame.tsx` (stage, title row, tag, description,
tiles, round button), in `BREATHE_ORDER` (4-7-8, the physiological sigh, box, five senses, muscle
relaxation). Its scroll view reaches up under the hub's header (`UNDER_HEADER`, its content padded
down by as much), so a full orb's glow fades into the sky rather than being cut straight where the
scroll view began. Pressing play on a breathing exercise keeps the
layout and fades each slot over to the session (round, phase, time left).
Each exercise has its stage (`BreatheStages.tsx`; canvas "Houna — Players
(phase 2)"). 4-7-8's is `OrbStage`: a large glass orb, no dots, the Houna
mark pressed into it (lit with the rim, as the others'; it stays on the anchor, the phase word
beneath it in the orb), a halo breathing with it (kept within
the stage, or a short screen's scroll view cuts it straight) and motes rising
past it, all the motes from one minute-long loop (`sawtooth`); its title and
round sit beneath, and each phase is announced to screen readers
(`announceForAccessibility`). Box breathing's is `StarStage`: a bead traces
a square, one side a phase; a second square turns 22.5° through each hold
(`useHoldTurns` counts them, 0 → 4 then round again unseen), and at two the
squares make the eight-point star, which lights; it rests as the star. The mark is
pressed into its middle (`STAR_MARK`, the size 4-7-8's rests at, the same centre), and
through every hold the squares' edges and the mark light in the tone (`full`), as
the orbs' rims do.
Grounding and muscle relaxation keep `BreathStage`: a ring of dots around a translucent,
glassy orb that inflates and deflates, with the Houna mark pressed into its middle
(one even shape a shade deeper than the orb, scaling with it: `components/ui/PressedMark.tsx`, the
one pressed mark the orbs, the suns and the moon share); the screen glow breathes with it.
While the player says the orb is `full`, its rim and the mark are lit in the tone's colour
(`full`; 4-7-8's orb lights its rim the same way): through the hold at the top of 4-7-8, briefly as
each tense begins after a release, and briefly as grounding's orb opens full; grounding's
orb then gives a little at each step (`GROUNDING_STEP_DEFLATE`). The players say when, rather
than the stage watching `breath`: a native-driven value reports back unevenly near the top.
The dots move on Home's clock (`StarfieldContext`), rippling like its ring;
a ring also turns (not while grounding lights it), and none take Home's
5s breath, which would fight the exercise's own pace.
Nothing is drawn over the orb: grounding's count is in its prompt, muscle
relaxation's countdown in its Tense / Release label. Tones: 4-7-8 glow, box
dusk, five senses dawn, muscle relaxation bloom (a fourth tone, the mood palette's rose, so neighbours in the carousel never share a colour), the physiological sigh tide (a fifth: sky blue in Night and Dusk, late-morning gold in Sunrise, whose blue is its dusk tone).
The physiological sigh (canvas "Round 2 — the physiological sigh") is the fifth exercise, run by
the timed player: in 2 (to `fill` 0.8), a short top-up of 1 (`topup`, to full), out 6, no hold,
so the breath-retention safeguards don't apply. Its stage, `SighStage`, is 4-7-8's glass orb with
two lines to rise to (dashed, where the first breath stops; the outer ring, which lights with the
mark as the glass meets it, read from `breath` itself); its words sit beneath, as box's do. It's a
part of practice of its own (`physiologicalSigh`), and "Every breath" now asks for all five.
Every breathing exercise starts with a countdown (canvas "Round 2 — a countdown"):
`components/tanafas/Countdown.tsx` counts `COUNTDOWN_SECONDS` (3) where the phase word will be,
"Settle in. Breathe as you are." beneath, a thin ring in the tone drawing down round the stage
(`CountdownRing` always wraps the stage, so it never remounts), then calls the player's own start.
The session's look (ground, full screen) begins with it; its button stops it, before anything is
counted. Each number is said to a screen reader; under Reduce Motion the ring holds still.
While any breathing session is on, running or paused, the hub lays the
orbit board's fall of light behind it (`colors.sessionGround`, midnight or
the theme's ground down to dawn; `BreathePlayer` reports `onInSession`), and
goes truly full screen: the status and navigation bars hide, the screen stays
awake, and the header keeps only its icons (the tabs fade: switching would end
the session). The hub pads by `useSteadyInsets`, the largest insets seen, so
hiding the bars doesn't jump the layout.

**Meditate hero** (canvas "Players — the Meditate tab as a hero"): the hub's
Meditate tab is `components/tanafas/MeditateHero.tsx`: the chosen scene's
still, blurred and slowly drifting behind today's date (Gregorian, then Hijri
from `lib/hijri.ts`: Umm al-Qura via `Intl`, left out where the calendar is
missing), a line to sit with (`sceneLines`), and a glowing play ring that
opens the full-screen player. Its Scene and Length rows open
`components/ui/GlassSheet.tsx` (the check-in's glass, for choices made in
place, and dragged down to close, `useDragToClose` over the whole sheet): `ScenePicker` and
`MinutesWheel` (a wheel that scrolls and settles on a row: `MEDITATION_MINUTES`, 3 to 60 minutes and no
limit, then Custom, which sets 1 to 120 minutes with − and +, `MEDITATION_CUSTOM_RANGE`). On the web a short drag that ends on a row can still pick it (the browser's click
follows the pointer with the sheet); on the phone the drag takes the touch from the row. The scene sheet (canvas "Round 2 — the scene
sheet") is being tried two ways, `SCENE_SHEET` in `ScenePicker.tsx`: 'rows' (option C, on: each
scene a row, a round window of it, its name and line, the chosen row lit in its scene's light)
and 'window' (option A: the chosen scene large in a mihrab arch, the four as round windows
beneath). Either way its button begins it ("Begin by the fire": the hub opens the player once
the sheet has sunk, `onHidden`), so choosing and starting are one step. When one is chosen,
delete the other and the switch. On the web preview a click outside
the app's frame dismisses the hub modal (`GO_BACK`): that's the preview.

**Discover questionnaires** (phase one: short, free screeners with Arabic
versions; longer or restricted ones wait for phase two, with professionals on
board): PHQ-8, GAD-7, WHO-5, ASRS-5 and PCL-5, one JSON each in `constants/psychometrics/`. A
test's intro puts the not-a-diagnosis warning first, then its description and instructions, then
its source.
Tests are registered in `index.ts`. Scoring (`lib/psychometrics/score.ts`) is `mean`
(trait reflections), `sum` (the screeners' totals; `multiplier` makes WHO-5 a
percentage) or `count` (items at or above their `threshold`; unused since ASRS
v1.1 gave way to ASRS-5), with the published cut-offs as bands; a band can say
what it means (`description`) and flag `concern`, which puts "Talk to someone
now" (→ `/crisis`) on the results screen. PHQ-8, not PHQ-9: PHQ-9's self-harm
question needs a crisis flow first (`screensForRisk` is refused). Items and
answer labels are the instruments' own words: English official, Arabic only
from official or validated translations, never translated here; a test whose
Arabic isn't in yet is `arabicPending` (English shows; development builds
only). PHQ-8's Arabic is the official PHQ-9 "Arabic for Tunisia"
(phqscreeners), questions 1–8; GAD-7's the official "Arabic for Tunisia" too
(one misspelling corrected); PCL-5's is Ibrahim et al. 2018, spelling
normalised; WHO-5's is the 1999 Hillerød translation WHO republishes (with its
disclaimer; spelling and one agreement fixed); ASRS-5's is the Saudi ADHD
Society's (Eshraq) standardised version, scored as its permission-free 0–24
total with no cut-off (the weighted cut-offs need NYU's permission). Licences:
PHQ/GAD free (Pfizer); ASRS-5 free as a plain total, NYU licence for cut-offs
or commercial use; PCL-5 public domain; WHO-5 CC BY-NC-SA (non-commercial, with
WHO's translation disclaimer). Profile shows no scores at all (shared phones):
every result is one tap away in My results (`app/results.tsx`).

**Directory pages** are all in the canvas language now: list pages use
`components/directory/PageHeader.tsx`; the professional / organization /
wellness-center pages share `components/directory/ProfileKit.tsx` (from the
canvas "Professional profile" artboard) with data cleanup in
`lib/directoryProfile.ts` — the scraped socials include Houna's own footer
accounts (filtered by `ownSocials`), info labels arrive in the page's
language (mapped by `profileFacts`), and text can carry HTML entities.
Events (list, event, speaker) uses the same pieces; event dates go through
`lib/eventDate.ts` (the site sends "19/05/2026, 19:00 pm").

**Directory search** runs on the device (`lib/directorySearch.ts` loads the
lists; queries never leave the phone): `lib/searchText.ts` (folding, word
forms: English endings, Arabic attached letters), `lib/searchRank.ts`
(weighted fields, prefix/typo matching, each word weighed by its rarity,
every-word matches first) and `lib/searchConcepts.ts`, the bilingual meaning
map ("sad" → depression, English ↔ Arabic; content, edit freely). It covers
the directory lists, events and speakers, the topics, and Tanafas' exercises
and scenes (a result opens `/tanafas` with `tab` + `exercise`/`scene`). The
lists come in **one call per language** (`fetchSearchBundle`, the
`houna-search-bundle` Edge Function: it assembles houna-proxy's own list routes,
every page of professionals included, keeps the result in `houna_cache` for 6
hours and serves everyone that copy, a stale one at once while one caller
rebuilds it in the background; `?country=` gives one country's professionals for
"near you"). A search used to cost ~60 proxy calls a phone a day, the free plan's
first limit; now it's three at most (this language, the other one's names, the
profiles). A new list for search goes in the bundle, not a call of its own.
They're saved on the phone as one copy (AsyncStorage, `directory-search:v2:bundle:*`,
older versions' keys cleared: used as is under a day old, shown while refreshing
up to two weeks), and each item also carries its name in the other language
(`aliases`), loaded after.
Professionals also carry what their own page says (location, languages, who
they work with, specialties: `facts`), from the `houna-search-index` Edge
Function (`supabase/functions/houna-search-index`), which reads every
professional's houna.org page in background steps (houna.org is slow to the
edge: a full build is ~5 min) and serves one file per language, rebuilt daily
into `houna_cache`. `supabase/functions/houna-proxy` is the proxy's source,
recovered from the old MVP (the dashboard can't export it); deploying it
replaces the live proxy, so test it side by side first. Both are Deno, so
`tsconfig.json` excludes `supabase/functions`. The screen (canvas "Directory
search — phase 3"): `SearchIndex.query` returns what matched (`lit`, lit in
titles by `LitText`) and a corrected spelling ("Showing results for …", with
an exact-search way back); professionals show `whyLine` (the matched
specialty first, then location and languages; `lib/searchHighlight.ts`);
chips count each kind and hide empty ones, Places included; suggestions show
once the box is tapped and when nothing matched. No recent searches: decided,
for privacy on shared phones. A search
that sounds like a crisis (`lib/crisisIntent.ts`, draft word lists awaiting
clinical review) puts a crisis card first. **Proxy gotcha**: `/therapists`'
`lastPage` is always the current page + 1, never the real last page, so
page until one comes back empty (the search once stopped at 30 of 286).

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
