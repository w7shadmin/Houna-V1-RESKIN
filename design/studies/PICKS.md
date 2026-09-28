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
| G · The Dusk sun | not yet | On Home and in its Tanafas scene; G0–G6, G7–G13, and G14–G17 (G13 + G7) | `components/sunrise/SunDisc.tsx`, `duskScene` in `constants/theme.ts`, `components/home/HomeBody.tsx` |  |
