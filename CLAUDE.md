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

**Known follow-up, not resolved**: `assets/images/icon.png`'s mark was
recentered and `android.adaptiveIcon` was added (`foregroundImage` set to
the same full `icon.png`), but the on-device launcher icon still doesn't
look right. Unconfirmed but worth checking first: Android's adaptive-icon
mask only shows the center ~66% of the foreground layer as a safe zone —
using the full icon (background circle + mark, no extra padding) as
`foregroundImage` is a common way to get it cropped unevenly by the
launcher. A dedicated foreground-only asset with proper safe-zone padding
would likely fix it.

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

- **Wim Hof / Nervous System Reset**
  (`app/tanafas/breathing/nervous-system-reset.tsx`) must show a
  full-screen safety warning before every session, acknowledged
  explicitly, never persisted across sessions. The breath-retention timer
  counts **up**, never auto-advances at a target, never pressures
  continuation, and has no streaks or personal bests. The user ends the
  hold themselves.
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

Cards that combine a border with `shadows.card` (an always-visible
turquoise-tinted shadow/elevation) must dim the whole card via
`pressed && { opacity: 0.85 }` on press, never overlay a separate
`colors.cardPressed` background fill. Overlaying a new-colored fill on top
of a shadow/border that stays static reads as two competing highlights
instead of one. Plain bordered buttons/chips without `shadows.card` can
still use the `cardPressed` background-overlay pattern — it only breaks
when combined with a static tinted shadow.

### The breathing session shell

`components/breathing/PhaseBreathingSession.tsx` is a reusable component;
each exercise (`app/tanafas/breathing/*.tsx`) passes in a phase-timing
config. Never hardcode one exercise's timings into the shell itself.

## Current skin — the part to replace for a new visual direction

Everything below is today's specific visual choice, not a requirement. A
reskin is free to change all of it.

**Brand palette** (`constants/theme.ts`): White `#FFFFFF`, Turquoise
`#3BAAA7`, Dark Turquoise `#196662`, Broken White `#EFF0EE`, Grey 30/50/80,
Black; accents Yellow, Raspberry, Light Cyan, Peach. Card shadows tinted
turquoise (`shadows.card`/`cardLg`/`tab`). Content caps at 430px
(`layout.maxContentWidth`).

**Fonts**: Inter for Latin UI, Scheherazade New for Arabic
(`latinFontFamily`/`arabicFontFamily` in `theme.ts`) — swap both if
changing the type system; keeping distinct Latin/Arabic families is a
reasonable choice to preserve even in a reskin, whatever the specific fonts
become.

**Logo**: `components/Logo.tsx`, used in exactly 2 places (splash, entry
screen). Swapping the logo replaces the whole asset, not a color.

**Two hardcoded-dark exceptions**: the splash screen
(`components/SplashIntro*.tsx`) and the meditation player
(`app/tanafas/meditation/*.tsx`) use `palette.turquoise` /
`palette.turquoiseDark` / plain white/black directly, bypassing the
light-mode-only `colors` token surface. Decide deliberately whether a new
skin keeps this pattern (a permanently-dark "focus mode" for these two
screens) or unifies them with the rest of the light UI.

**Legacy icon-tile exception**: `OLD_MVP_ICON_HEX` (`lib/color.ts`) is a
small hardcoded hex set used only for topic icon tiles, in
`app/(tabs)/index.tsx`, `app/(tabs)/directory/index.tsx`,
`app/tanafas/index.tsx`, and `app/tanafas/breathing/index.tsx`. It predates
the current token system and isn't part of the brand palette — safe to
drop entirely in a reskin, replacing it with tokens from `theme.ts` or a
new palette.

**Known inconsistency, not fixed here**: about 6 screens hand-roll their
own loading/error state instead of the shared `LoadingState`/`ErrorState`/
`InlineError` components (`components/directory/AsyncState.tsx`) used in
~13 others. Cosmetic only — worth normalizing next time one of those
screens is touched, not urgent enough on its own to justify a
wide-reaching pass.

## How to reskin

1. Update `constants/theme.ts`'s `palette`/`colors`/`shadows` — this alone
   recolors nearly the entire app, since virtually every screen consumes
   tokens rather than hardcoded values.
2. Decide on new `latinFontFamily`/`arabicFontFamily` values and update the
   font-loading setup (`app/_layout.tsx`) to match.
3. Review the two hardcoded-dark exceptions (splash, meditation player) and
   decide whether that pattern still fits the new visual direction.
4. Drop `OLD_MVP_ICON_HEX` (`lib/color.ts`) and its call sites in favor of
   the new token system.
5. Swap `components/Logo.tsx`'s asset.
6. If the brand name or voice is changing — not just the colors — update
   the copy in `constants/*Strings.ts` too. The brand name and tone are
   woven into full sentences, not isolated as a single swappable token.
7. For anything structurally different (not just color/font/spacing), use
   `components/ui/Button.tsx` and `components/ui/Card.tsx` as the starting
   primitives rather than hand-rolling new one-off styles per screen.
8. Re-verify RTL after any layout change — reflow bugs show up specifically
   in the Arabic direction even when the English layout still looks fine.
