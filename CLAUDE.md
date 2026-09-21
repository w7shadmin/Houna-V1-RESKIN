# Houna app

Native mobile app for Houna (houna.org), a mental health nonprofit serving the
Arab world. Expo / React Native, bilingual Arabic and English.

Being rebuilt from a completed Vite/React web MVP. That MVP is a **working
reference implementation** — port from it rather than reinventing. It lives at
`../reference/old-mvp/` (start with `claude --add-dir ../reference`).

## Reference documents

In `../reference/docs/`:

- `houna-build-notes.md` — foundations, feature scope, storage decisions
- `houna-port-reference.md` — exact timings, strings, and structures from the
  old MVP
- `houna-colour-palette.md` — the official brand palette

**Precedence:** build-notes wins on colour. port-reference wins on behaviour,
timings and structure. Both beat anything in `Houna_Expo_Rebuild_Plan.docx`,
which is outdated.

## Commands

```
npx expo start          # dev server
npx tsc --noEmit        # typecheck — run before claiming work is done
npx expo install <pkg>  # always use this, not npm install, for Expo packages
```

## Brand — do not improvise these

**Primary:** White `#FFFFFF`, Turquoise `#3BAAA7`, Dark Turquoise `#196662`,
Broken White `#EFF0EE`, Grey 30 `#BCBEC0`, Grey 50 `#939598`,
Grey 80 `#58595B`, Black `#000000`

**Secondary (accents only, never large surfaces):** Yellow `#FFF200`,
Raspberry `#F37B83`, Light Cyan `#20C4F4`, Peach `#F9A980`

The logo's Arabic wordmark is `#525052` — part of the artwork, not a token.

Fonts: **Inter** for Latin UI, **Scheherazade New** for Arabic. Never
Scheherazade for Latin body text.

Card shadows are tinted with the brand turquoise, not neutral grey:
`0 2px 12px rgba(59,170,167,0.08)`. Content caps at 430px.

The old MVP's palette had several **wrong** values (`#1A7452`, `#FF59A6`,
`#59FFFF`, `#FF9980`, and a gold). When porting, take structure and layout
from it but colour from the palette above.

## Theme

**Light mode only.** Dark mode has been removed. Do not add dark variants,
`prefers-color-scheme` handling, or `useColorScheme` branches.

Two deliberate exceptions, hardcoded dark regardless of theme: the splash
screen and the meditation player.

## Bilingual and RTL

Arabic is a first-class language, not an afterthought. Every screen must work
in both directions.

- All user-facing strings go through the string catalogue. Never hardcode
  English in a component.
- Use `paddingStart`/`paddingEnd`, `marginStart`/`marginEnd`, `start`/`end`.
  **Never** `left`/`right` for layout.
- Let `flexDirection: 'row'` auto-reverse. Don't manually reorder arrays based
  on `isRTL` — that double-reverses.
- `isRTL` should only be used where the framework genuinely can't help:
  choosing a font family, and flipping directional icons like chevrons.
- All numbers render as Arabic-Indic numerals (٠-٩) in Arabic, via the shared
  helper.
- Arabic plural agreement matters: numbers 3–10 take the plural. ٣ دقائق,
  not ٣ دقيقة.
- Do not machine-translate. Arabic strings already exist in the old MVP for
  most screens — port them.

## Architecture notes

- Navigation: Home | Directory | [Tanafas] | Events | More.
  Tanafas is **not a tab** — it's a raised centre button opening a modal. It
  never shows an active state.
- Tanafas contains breathing exercises, meditation, and journal + mood.
- The breathing session shell is a **reusable component**. Exercises are phase
  configs passed into it. Never hardcode one exercise's timings into the shell.

## Journal and mood

On-device only, `expo-sqlite`. Not tied to an account, not synced.

No PIN or biometric lock for the MVP — accounts and their security come after
launch.

Entries carry a UUID and an `updatedAt` timestamp even though nothing syncs
yet, so sync can be added later rather than rebuilt.

Provide an export. A local-only journal with no export means a lost phone is
total data loss.

Never write copy claiming the journal "never leaves your device" — it is
included in the phone's normal OS backup.

## Safety requirements — not preferences

This is a mental health app. Some of its users are in distress.

**Wim Hof / Nervous System Reset** must show a full-screen safety warning
before every session, acknowledged explicitly. Do not persist the
acknowledgement across sessions. The breath-retention timer counts **up** and
must never auto-advance at the target, never pressure the user to continue,
and never add streaks or personal bests. The user ends the hold themselves.

Do not bury crisis resources behind generic labels or deep navigation.

Do not add streaks or guilt mechanics to mood logging.

## Working style

- Read the relevant old-MVP file before building a screen that exists there.
- Run `npx tsc --noEmit` before reporting work complete.
- When something in the reference docs conflicts with what's in the code, say
  so rather than silently picking one.
