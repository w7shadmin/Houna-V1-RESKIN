# Picks from the Design studies canvas

Variants chosen on https://claude.ai/artifact/5DqkLLhgEWF1bS4vFcf7EL, one row
per question. Each pick is redrawn on the Houna Redesign canvas (all three
themes, Arabic where layout changes) before it's built. Tick "Shipped" when it
lands.

| Study | Picked | Note | App surface | Shipped |
| --- | --- | --- | --- | --- |
| A · The Sunrise scene's glow | 28 Sep 2026: A2 | Lines of light | `components/sunrise/SunDisc.tsx` (`Lattice`), `SunScene.tsx` | 28 Sep 2026 |
| B · Two different suns | 28 Sep 2026: B0 | Keep today's suns; nothing to build | `sunriseScene` / `duskScene` in `constants/theme.ts` (and Home's bodies, which share them) | — (kept) |
| C · Classic Home, the Kufic ring | 28 Sep 2026: C1 | Profile's ring, turning | `components/starfield/MarkHalo.tsx` (the dot ring), `components/profile/KuficRing.tsx` | 28 Sep 2026 |
| D · A calmer Home date | 28 Sep 2026: D1 | A quiet line under the wordmark | `components/home/HijriDate.tsx`, `app/(tabs)/index.tsx` | 28 Sep 2026 |
| E · The mark on plain pages | 28 Sep 2026: E4 | A glow in its shape |  The Directory and Events screens (a shared background component) | 28 Sep 2026 |
| F · A new moon | 28 Sep 2026: F4 + F2 | See-through pearl glass (F4's glass, F2's pearl), and on Night Home in place of the bowl | `components/starfield/MoonDisc.tsx` | 28 Sep 2026 |
| G · The Dusk sun | 28 Sep 2026: G15 | The ring of light, the words round it; the words lighter on Home | `components/sunrise/SunDisc.tsx`, `duskScene` in `constants/theme.ts`, `components/home/HomeBody.tsx` | 28 Sep 2026 |
| H · Your emotional landscape (Recap’s moods) | Open | H0 today’s orbs; H1 constellations; H2 the landscape (hills); H3 a nebula; H4 the month of moons, in feeling; H5 woven (zellige tiles); H6 the month’s light (aurora). Also open: whether the slide names the feelings (a legend) | `app/recap.tsx` (slide `moods`), `constants/moods.ts`, `constants/recapStrings.ts` | — |
| I · Badges and Profile’s icons | Open | I0 today’s gems; I1 pearl moons (renames Sunrise → Crescent, The sun → Waxing); I2 constellations; I3 khatam medallions; I4 an orrery; I5 the mark, lit. Badges and icons can be picked separately | `components/badges/BadgeGem.tsx`, `lib/badges.ts`, `constants/badgeStrings.ts`, `app/profile.tsx` (the stat glyphs) | — |
| J · A glass sun for Sunrise | Open | J0 today; J1 gold glass; J2 dewdrop; J3 opal; J4 lens; J5 lantern; J6 frosted; J7 pearl and turquoise; J8 etched glass | `components/sunrise/SunDisc.tsx`, `sunriseScene` in `constants/theme.ts`, `components/home/HomeBody.tsx` | — |
| K · The sun's rays | Open | K0 today; K1 twelve-point rosette; K2 khatam in its octagon; K3 six-fold; K4 interlaced circles; K5 sixteen-point sunburst; K6 shamsa petals; K7 three in one; K8 ten-fold girih; K9 beads of light | `Lattice` in `components/sunrise/SunDisc.tsx`, `lib/khatam.ts` | — |
