# Picks from the Explorations canvas

Boards chosen on https://claude.ai/artifact/KCBgx43XLQZxG3X1cS9mkS to bring into
the app, one section at a time. Each is redrawn on the Houna Redesign canvas
(all three themes, Arabic where layout changes) before it's built. Size: S a
day or less, M a few days, L a week or more. Tick "Shipped" when it lands.

## A · Meditation player

| Board | Picked | Note | App surface it joins or replaces | Size | Shipped |
| --- | --- | --- | --- | --- | --- |
| Today — meditate hero (`MeditateToday`) | 27 Sep 2026 | Lives at the top of the Tanafas hub (decided 27 Sep) | The Tanafas hub's Meditate tab: the chosen scene's sky drifting behind a large title and a glowing play ring | L | 27 Sep 2026 (phase 2) |
| Scenes — arch gallery (`MeditateArches`) | 27 Sep 2026 |  | Replaces the Meditate carousel's scene choice (`components/tanafas/PlayerFrame.tsx`, `SceneStage.tsx`, now deleted); arch-clipped photos via `react-native-svg` | M | 27 Sep 2026 (phase 2) |
| Meditate — minutes wheel (`MeditateMinutes`) | 27 Sep 2026 |  | Replaces the length chips on the hub (`MEDITATION_MINUTES`: 5 · 10 · 20 · no limit) | S | 27 Sep 2026 (phase 2) |
| اليوم — تأمل (`MeditateTodayAr`) | 27 Sep 2026 |  | Arabic of the Today hero | with the hero | 27 Sep 2026 (phase 2) |
| المشاهد — أقواس (`MeditateArchesAr`) | 27 Sep 2026 |  | Arabic of the arch gallery | with the gallery | 27 Sep 2026 (phase 2) |

Decided: the hero sits at the top of the Tanafas hub; the arch gallery and the
minutes wheel open from it (hero → scene → minutes → play).

## B · Breathing player

| Board | Picked | Note | App surface it joins or replaces | Size | Shipped |
| --- | --- | --- | --- | --- | --- |
| Breathe — glass orb, the word inside (`BreatheOrb`) | 27 Sep 2026 | 4-7-8's stage (decided 27 Sep) | A breathing stage beside `components/tanafas/BreatheStages.tsx`: the phase word inside the orb, drifting motes | M | 27 Sep 2026 (phase 2) |
| Breathe — the eight-point star (`BreatheStar`) | 27 Sep 2026 |  | Box breathing's stage (Steady mind): the breath traced on a square, the second square turning in at each hold | M | 27 Sep 2026 (phase 2) |
| Breathe — ridges of breath (`BreatheRidges`) | 27 Sep 2026 | Not an exercise stage: a graph on the user's profile instead (decided 27 Sep) | Moves to the profile (section E, after the reskin), with the ridges graph (D) | — |  |
| Breathe — orbit dot, box breathing (`BreatheOrbit`): background only | 27 Sep 2026 | Canvas note: "I like this background, to be used for other breathing activities or for dusk, etc" | The Midnight → violet → rose → dawn ground, for breathing sessions and/or the Dusk theme | S | 27 Sep 2026 (phase 2): behind every breathing session, all three themes |

Decided: 4-7-8 gets the orb, box breathing the star; grounding and muscle
relaxation keep today's stages. The ridges are a profile graph, not a stage.

## C · Suns and moons

| Board | Picked | Note | App surface it joins or replaces | Size | Shipped |
| --- | --- | --- | --- | --- | --- |
| Home — the crescent bowl (`BodyCrescentBowl`) | 27 Sep 2026 |  | A Home body (`components/home/HomeBody.tsx`): the dawn-gradient crescent cup with the mark resting in it | M | 27 Sep 2026 (phase 3) |
| Home header — hilal and the Hijri date (`BodyHilal`) | 27 Sep 2026 |  | Home's header: tonight's moon named in the Hijri calendar (Umm al-Qura via `Intl`), the hilal on the evening a month begins; reuses `lib/moonPhase.ts` | M | 27 Sep 2026 (phase 3) |
| The month of moons (`BodyMonthRing`) | 27 Sep 2026 |  | New: the Hijri month's nights in their real phases, tap a night; could open from the Home header, or join the Graphs moon calendar | M | 27 Sep 2026 (phase 3): from Home’s date; practised nights glow since phase 4 |
| Sunrise — the star-lattice sun (`BodyStarSun`) | 27 Sep 2026 |  | Sunrise's sun: turning eight-point stars round `SunDisc` (`components/sunrise/`), Home and/or the Sunrise scene | M | 27 Sep 2026 (phase 3) |
| The sky clock (`BodySkyClock`) | 27 Sep 2026 |  | New: one sky from dawn to night with the bodies crossing | M | 27 Sep 2026 (phase 3): long press on Home’s body for now |

Decided 27 Sep:
- The crescent bowl is Night's Home body ("Sun & moon" style), in place of
  tonight's moon there; the real-phase moon stays in the starfield, which the
  mark, lifting out of the cup, becomes on the way.
- The star-lattice sun is Sunrise's sun everywhere: Home and the Houna
  sunrise scene.
- The sky clock is a scene of its own, like the starfield, counted as a
  Tanafas visit; it never changes the chosen theme.
- The month of moons opens from Home's Hijri date (the hilal pick), as a
  glass sheet.

## D · Graphs

| Board | Picked | Note | App surface it joins or replaces | Size | Shipped |
| --- | --- | --- | --- | --- | --- |
| Graphs — the month in ridges (`GraphRidges`) | 27 Sep 2026 | "Take the graph you made for ridges of breath and add it": draw these ridges in the Breathe ridges' look (tall translucent tone ridges, screen-blended, faint grid, labelled layers). Lives on the user's profile (decided 27 Sep) | The user's profile: minutes per exercise over the month, with today's line (built with section E, after the reskin) | M |  |
| Graphs — September by moonlight (`GraphMoonCalendar`) | 27 Sep 2026 |  | Stats or Recap: the month as real moons, practised days lit, the rest dim (no "missed"); pairs with the month of moons (C) | M | 28 Sep 2026 (phase 4): a Recap slide |
| Graphs — the week as an arc (`GraphGauge`) | 27 Sep 2026 |  | Stats (`app/account/stats.tsx`): the week's minutes as a large Figtree Light numeral on an arc segmented by exercise; the Arabic board (`GraphGaugeAr`) shows its RTL | M | 28 Sep 2026 (phase 4): opens Stats |
| Breathe — ridges of breath (`BreatheRidges`), as a graph | 27 Sep 2026 | Also picked in B as a breathing stage | Its ridge style carried into the graphs above | with the ridges graph |  |

Decided 28 Sep: the moon calendar is a Recap slide (the month's story, so
Guests get it too, from the on-device log); the week's arc opens Stats, above
the streak; and the nights practised glow in Home's month of moons (C), a tap
saying how many minutes. The ridges wait for the profile (E).

## E · Account, badges and progress (built after the reskin)

These join the held Profile & badges plan (the Redesign canvas's "Profile &
badges" row) and are built together once the reskin is done.

| Board | Picked | Note | App surface it joins or replaces | Size | Shipped |
| --- | --- | --- | --- | --- | --- |
| Profile — the Kufic ring (`AccountProfile`) | 27 Sep 2026 |  | The signed-in Profile (`app/profile.tsx`): هُنا · نتنفّس معًا turning round the avatar, three glowing stats; its Arabic version (`AccountProfileAr`) shows the RTL | L |  |
| Badges — lit objects on pedestals (`AccountGems`) | 27 Sep 2026 | "Held by [N]% of Houna" needs an aggregate count from Supabase (a SECURITY DEFINER RPC) | The badge shelf / Stats badges (`app/account/stats.tsx`); the objects are the badges' art | M |  |
| Badges — the unlock moment (`AccountUnlock`) | 27 Sep 2026 |  | New: the overlay shown when a badge is earned (after `checkAndAwardBadges` in `lib/streaks.ts`) | M |  |
| Progress — the week in moons (`AccountWeekOrbit`) | 27 Sep 2026 | Streaks count practice only, never mood | Stats' streak card: the streak as a large numeral over the week's real moons | M |  |
| Progress — your sky (`AccountSky`) | 27 Sep 2026 |  | New: a star per practice day this month, on Profile or Recap | M |  |

Open question for the build: the gems and the Redesign canvas's "sky journey"
badge art (Badges — nine skies) are two looks for the same badges. Choose one,
or let the gems be the lit, 3D form of the sky-journey art.

## F · Motion and overlays (all six; built first, the others reuse them)

| Board | Picked | Note | App surface it joins or replaces | Size | Shipped |
| --- | --- | --- | --- | --- | --- |
| Motion — a glass sheet over blur (`MotionSheet`) | 27 Sep 2026 | Keep the Houna bloom orbs and the slider | A `GlassSheet` primitive in `components/ui/` (`expo-blur` + Animated): the mood check-in and other sheets rise over a softened, dimmed screen; items arrive staggered | M | 27 Sep 2026 |
| Motion — a card grows into its page (`MotionCardExpand`) | 27 Sep 2026 |  | A shared-element expand for cards → their page (events, directory, the arch → player in A) | L | 27 Sep 2026 |
| Motion — controls step aside (`MotionControlsAway`) | 27 Sep 2026 |  | A hook beside `hooks/useCalmLoop.ts`: controls fade after 3 s of stillness during practice, a touch brings them back; Reduce Motion aware | S | 27 Sep 2026 |
| Motion — words that arrive (`MotionWords`) | 27 Sep 2026 |  | A text primitive: Latin letter by letter, Arabic word by word (its letters join) | S | 27 Sep 2026 |
| Motion — glowing pills, three themes (`MotionPills`) | 27 Sep 2026 |  | A `Button.tsx` variant: the tone-gradient ring and soft glow; pressed state dims, one change (the pressed-state convention) | S | 27 Sep 2026 |
| Motion — the tab glow slides (`MotionTabs`) | 27 Sep 2026 | Glow style chosen | The tab and segmented controls: the glow (Open), line and pill styles, one chosen at build time | S | 27 Sep 2026 |

## G · First run

| Board | Picked | Note | App surface it joins or replaces | Size | Shipped |
| --- | --- | --- | --- | --- | --- |
| First run — the splash (`FirstSplash`) | 27 Sep 2026 |  | The animated splash (`components/SplashIntro.tsx`): the crescent bowl rising, the wordmark settling under it | M | Built 28 Sep 2026, not switched on (`SPLASH` in `app/_layout.tsx`) |
| First run — one breath together (`FirstBreath`) | 27 Sep 2026 |  | New: shown once, before anything is asked; a guided breath, then Continue (persisted locally) | M | 28 Sep 2026 (phase 5) |

Decided 28 Sep: the splash replaces today's (`SplashIntro`) on every launch,
with each theme's own body rising (Night's crescent bowl, Sunrise's star-lattice
sun, Dusk's evening sun) and the wordmark settling beneath; on "Sun & moon" it
hands over to Home's body. The first breath, shown once, carries a small
English · العربية switch at the top.

Later on 28 Sep: the first breath approved and built; the splash is built but
waits, with today's still playing, until it's decided.

## Build order

1. F · Motion foundations (all six).
2. A + B · The meditation and breathing players.
3. C · Home's bodies and headers.
4. D · Graphs.
5. G · First run.
6. After the reskin: E · Account, badges and progress, with the Profile & badges plan.
