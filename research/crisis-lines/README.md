# MENA crisis lines

Emergency numbers, crisis and suicide lines, and mental-health, child, violence, addiction and
refugee support lines across 18 Arab countries, researched on 29 September 2026. Every line has the
sources it was confirmed on and a confidence rating:

- **V (Verified):** on an official or operator page that is current.
- **L (Likely):** on a reputable recent source that isn't the operator's own, or official but with
  older or disputed details.
- **U (Uncertain):** old, conflicting, or found only on aggregator lists.

Each country also lists numbers to **avoid** (dead, COVID-era, relabelled or made up), so they
aren't added back by mistake.

## Files

- `data.json`: the research, the source of truth.
- `template.html` and `build.js`: `node research/crisis-lines/build.js` writes
  `mena-crisis-lines.html`, a searchable directory for reviewers. It's published at
  https://claude.ai/artifact/8Ua625YAWHcC2Nfziz9tHc (private; share it from the page).

## What the app shows

`lib/crisisLines.ts` (the crisis screen, `app/crisis.tsx`) carries a hand-picked subset with
Arabic hours and areas:

- lines rated **V** that someone in distress can call: left out are information and complaint
  lines (UNHCR info lines, labour complaints, general health enquiries), app- and chat-only services
  (mentioned in a line's `extra` where they belong to it), and smaller duplicates (Bahrain's other
  family centres, Lebanon's ABAAD men's line). `data.json` has them all;
- **emergency numbers rated L**.

Everything rated U, and every non-emergency L line, stays out until the review team has phoned it.
`lib/crisisLines.test.ts` holds the app to that rule.

## Keeping it right

1. Phone each L and U line during its stated hours; note what answered.
2. Change the rating in `data.json` with the source, and rebuild the page.
3. When a line becomes V (or an emergency number L), add it to `lib/crisisLines.ts` with its source.
4. Recheck everything every six months, sooner for Gaza, Sudan, Yemen, Syria and Libya, where lines
   depend on networks and funding. Update `CRISIS_CHECKED_ON`.

A clinician should review the crisis and support lines before release.
