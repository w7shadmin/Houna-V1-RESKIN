# Houna Features Brief

What each new feature from the redesign canvas needs underneath the UI.
Designs: https://claude.ai/artifact/EMxmwt7o1Uq6kx32BdAUA7 (Night row on
top, Day row below — every screen exists in both). Read `RESKIN_BRIEF.md`
and `CLAUDE.md` first; everything here must also respect `CLAUDE.md`'s
Safety and Journal/privacy requirements.

Facts this brief relies on (verified in code before writing it):

- `lib/usageTracking.ts` → `recordTanafasSession(kind, startedAt, endedAt)`
  inserts into Supabase `tanafas_sessions` (`user_id, kind, started_at,
  completed_at, duration_seconds`) **only for signed-in Alias users**, and
  only when a session ends. Guests have no breathing/meditation history
  anywhere — nothing is stored on-device either.
- Nervous System Reset (Wim Hof) never calls `recordTanafasSession` — it
  doesn't use the shared `PhaseBreathingSession` shell.
- The journal (`lib/journal.ts`, expo-sqlite, on-device, Guests and Aliases
  alike) stores `id, date, created_at, updated_at, text, mood`. Moods are
  six tags; `MOOD_VALUES` orders them heavy→light: frustrated 1, anxious 2,
  sad 3, tired 4, neutral 5, calm 6.
- `mood_pings` (`lib/moodPings.ts`) stores `mood_tag, ping_date` with no
  user id — the pattern to copy for anonymous counting.
- `lib/countries.ts` has 197 countries with lat/lon; `profiles.country`
  holds an ISO alpha-2 code (opt-in via the profile country picker).
- `lib/hounaApi.ts` fetches everything through the `houna-proxy` Edge
  Function, which scrapes houna.org. No text search exists anywhere.
  `fetchTherapists`, `fetchOrganizations`, `fetchWellnessCenters` accept a
  country filter. The Edge Function's source is **not in this repo** — the
  only copy is an old version in `C:\Users\Tariq\Desktop\Claude Houna\reference\old-mvp\supabase\functions\houna-proxy\`
  (outside this project).
- No chart library is installed; `react-native-svg` is.
  `components/journal/MoodTrendChart.tsx` is a hand-drawn SVG chart — the
  pattern to copy.

---

## 1. Home (one screen, no scroll)

Canvas: "Home — English" / "Home — Arabic". Top bar: mood check-in button
(left), wordmark, Profile button (right). The mark with its ring, "You're
not alone", a rotating line, a community card (dot map + counter with
24H / WEEK / MONTH that auto-rotates and is tappable), a small crisis
button, tab bar. The Tanafas card, Explore resources and Professional
resources rows leave Home (all still reachable from the tabs).

- **Crisis button stays on Home.** `CLAUDE.md` Safety: crisis resources must
  never be buried. It needs a real destination (a crisis-lines screen by
  country) — not built yet.
- **Language toggle** moves off Home into Profile (More keeps its copy).
- **Rotating lines**: the canvas copy is draft (EN + AR). Put final lines in
  the string catalogue, never hardcoded.
- **Map**: plot `lib/countries.ts` coordinates (equirectangular) as faint
  dots; light up countries with activity in the selected period. Extend
  `components/community/WorldMap.tsx` rather than writing a second map.

**Backend needed:**

1. `get_community_activity(period text)` — `SECURITY DEFINER` RPC (same
   pattern as `get_country_counts`) returning `{ total_sessions,
   total_people, countries: [{country, count}] }` for `'24h' | 'week' |
   'month'`, joining `tanafas_sessions` to `profiles.country`. Return only
   aggregates — never user ids.
2. `activity_pings` table (no user id, like `mood_pings`): `kind, country
   (nullable), pinged_at`, inserted on every session start for Guests and
   Aliases, so the counter isn't Alias-only. Fold it into the RPC.
3. Make Nervous System Reset record sessions (it's missing today).

## 2. Mood check-in — "Houna bloom"

Canvas: "Mood check-in — Houna bloom" and "Houna bloom — mood states".

- Opened from the Home top-left button. The button shows a **soft amber
  dot only when today has no entry** (`getTodayEntry()` exists). Never a
  count, never a streak, never red — `CLAUDE.md` forbids guilt mechanics on
  mood.
- The figure is the Houna mark: ring, two leaves, head. Heavier moods fold
  and droop the leaves and cool the colour; lighter moods open them like a
  bloom. It breathes on a slow ~6s scale/glow loop.
- A slider snaps across the **existing six moods in `MOOD_VALUES` order**.
  No data-model change: the journal, mood history and "you're not alone"
  count keep working as-is. Save calls the existing `logMoodForToday`.
- Build one `MoodBloom` component (react-native-svg + Reanimated) used by
  both the Home button (tiny, static) and the check-in sheet; the Journal
  screen can reuse it at the top.
- Bloom parameters used on the canvas (leaf rotation in degrees about the
  leaf base; negative = open):

  | Mood | Colour | Leaf fold | Head y |
  |---|---|---|---|
  | frustrated | #EA90A8 | 30 | 74 |
  | anxious | #F0B27A | 20 | 71 |
  | sad | #82A4EE | 12 | 78 |
  | tired | #AE9FF2 | 4 | 72 |
  | neutral | #D2CBB9 | -6 | 66 |
  | calm | #62D2C9 | -22 | 62 |

- Copy must stay accurate: "Saved privately in your journal on this
  phone" is fine; never claim it "never leaves the device" (OS backups).

## 3. Unified directory search

Canvas: "Directory search". One search bar; results grouped Topic →
Articles → Professionals near you → Podcasts → Organizations & wellness
centres, with type filter chips. A crisis line stays at the bottom of
results.

- **Phase 1 (in-app):** fetch all list endpoints (articles, podcasts,
  professionals pages, organizations, wellness centres) plus the 17 local
  topics in `constants/homeStrings.ts` (`resourcesRail.topics`, EN + AR),
  normalise to `{type, title, subtitle, slug/id, text}`, filter
  client-side (case/diacritic-insensitive, Arabic-aware), cache in memory
  for the session. Professionals are paginated — decide a sane cap.
- **Phase 2:** a `search` route in `houna-proxy`. Recover its current
  source first (it isn't in this repo).
- **"Near you":** use `profiles.country`; for Guests or no country, ask once
  (or show all). Pass it through the existing country filters.
- Result names on the canvas are placeholders on purpose — never imply a
  real professional treats a condition unless the data says so.

## 4. Lottie topic illustrations

The 17 files in `assets/lottie/` are loaded by
`components/directory/LottieTopicIcon.tsx` (`LOTTIE_MAP`). Recoloured copies
already exist in `assets/lottie/night/` and `assets/lottie/day/`; the
originals are untouched. All colours are static fills/strokes (no animated
colours or gradients), and every one was matched.

| Old | Where | Night | Day |
|---|---|---|---|
| #196662 #3D8582 #247F7C #256E6A | outlines | #F2ECDD | #237873 |
| #55E5DA #5EE6DC | mint accent | #6FD6CF | #62D2C9 |
| #20C4F4 #43CFF5 #44CFF6 #56D6F4 | sky accent | #86A9F0 | #82A4EE |
| #F9E555 | yellow | #F2D98A | #F0C35A |
| #F37B83 | coral | #EE97AE | #EA90A8 |
| #F48058 | orange | #F2B880 | #F0B27A |
| #E9FAF9 | pale fill | #173A45 | #EEF3F1 |
| #FFFFFF (fill) | light fill | #1E2A5A | #FFFFFF |
| #FFFFFF (stroke) | highlights | #F2ECDD | #FFFFFF |

To do in the build: make `LottieTopicIcon` pick the `night/` or `day/` file
by the active theme, and eyeball each animation on a real card in both
themes (the recolour was done by table, not reviewed frame by frame).

## 5. Tanafas — Discover (psychometrics foundation)

Canvas: Tanafas "Discover" tab, "Self-reflection — question", "Self-
reflection — results", Profile "Your traits".

- **Test definitions are data, not code.** One JSON file per test, e.g.
  `constants/psychometrics/<id>.json`:

  ```json
  {
    "id": "example-test",
    "version": 1,
    "title": { "en": "", "ar": "" },
    "description": { "en": "", "ar": "" },
    "source": { "citation": "", "licence": "", "url": "" },
    "scale": { "min": 1, "max": 5, "labels": { "en": ["Strongly disagree", "…"], "ar": ["…"] } },
    "traits": [{ "key": "traitA", "label": { "en": "", "ar": "" }, "description": { "en": "", "ar": "" } }],
    "items": [{ "id": "q1", "text": { "en": "", "ar": "" }, "trait": "traitA", "reverse": false }],
    "scoring": { "method": "mean", "bands": [{ "max": 2.5, "label": { "en": "Lower", "ar": "" } }] }
  }
  ```

  Only add tests whose licence permits app use, and use their official
  Arabic translation where one exists — don't machine-translate validated
  items.
- **Scoring** is a pure function `scoreTest(def, answers) → { [traitKey]:
  { raw, normalised0to1, band } }`, handling reverse-scored items. Unit
  test it.
- **Radar chart:** a `RadarChart` component in react-native-svg (copy
  `MoodTrendChart.tsx`'s approach), N axes from the test's traits, 3 grid
  rings. Also used small on Profile.
- **Storage:** results stay **on-device by default** (same store family as
  the journal). "Save to my profile" is an explicit opt-in that writes to a
  new `psychometric_results` table (`user_id, test_id, version, scores
  jsonb, taken_at`) with RLS: owner can select/insert/delete their own rows,
  nobody else can read them. This is sensitive health-adjacent data — no
  SELECT policy for anyone but the owner, and never join it into any
  public RPC.
- **Disclaimer, before and after every test:** "This is not a diagnosis —
  it's a gentle look inward. For a real assessment, or if anything here
  worries you, talk to a mental health professional." The results screen's
  primary action is **Find a professional** → `/directory/professionals`.
- If a future test screens for risk (e.g. self-harm items), it must surface
  crisis resources immediately on a concerning answer — design that before
  adding any such test.

## 6. Recap ("Houna Wrapped")

Canvas: Profile "Your recap" card → "Recap (tap through)". Story slides:
intro · minutes breathing + go-to exercise · minutes meditating + favourite
scene · days journalled · emotional landscape (mood blooms sized by
frequency) · "breathed alongside [N] people in [K] countries" · share card.
Monthly recap, plus a yearly one.

- **Needs a local session log** so Guests get a recap too: an on-device
  `sessions` table (same expo-sqlite db family as the journal) written on
  every session end — `id, kind, exercise_or_scene, started_at,
  duration_seconds`. `recordTanafasSession` keeps writing to Supabase for
  Aliases as today; the local log is written for everyone.
- Wim Hof must write to the log too (see §1).
- Mood slide is **descriptive only** — proportions, no score, no "better /
  worse than last month", no streaks. Copy on the canvas: "Every feeling
  counted. None of them was wrong."
- Community slide uses the §1 RPC.
- More slide ideas: time of day you most often come back; calmest weekday;
  first time you tried something new; badges earned; topics read most in
  the Directory (needs view tracking); longest session ("your quietest
  moment").
- Share card must never include journal text or mood details by default.

## 7. Profile entry point

Home top-right opens Profile (canvas "Profile"). It gathers: avatar,
username, country; the recap card; "Your traits"; the exercise streak
(`lib/streaks.ts` — exercise only, never mood); settings: Language,
Appearance (System / Night / Day), Notifications, Community map, Export my
journal (required by `CLAUDE.md`), Sign out. Guests see a sign-in / create
alias card instead of traits, recap and streak (canvas has a `guest` tweak
that shows it). The More tab's account card becomes secondary.

## 8. Theme (Night + Day)

Ship both. Night tokens are on the canvas's "Nightlight" sheet, Day tokens
on "Daylight". Add both token sets to `constants/theme.ts`, choose by the
system colour scheme with the Profile override persisted locally. The two
"hardcoded-dark" screens in `CLAUDE.md` (splash, meditation player) should
move onto tokens as part of this.
