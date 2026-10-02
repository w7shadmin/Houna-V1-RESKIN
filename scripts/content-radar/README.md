# Content radar (until the Houna Console has it)

Finds the latest content from the professionals, organizations and wellness centers listed on
houna.org, for the team to review and add to the site's Articles or Podcasts & webinars (the app
picks up what the site lists within about 6 hours). The Console's version is planned in
`docs/console/12-content-radar.md`.

```bash
node scripts/content-radar/1-inventory.mjs   # every listing's own links, from its houna.org page (~3 min)
node scripts/content-radar/2-latest.mjs      # each YouTube channel's and website's latest items
```

- `1-inventory.mjs` writes `inventory.json` (listings and their links) and `existing.json` (what the
  site's lists already hold); `2-latest.mjs` writes `latest.json`: each source, the listings that
  link it, and its newest items with dates. All three are gitignored.
- YouTube channels are read through their public RSS feed; websites through their RSS/Atom feed or
  their sitemap's dated post pages. Instagram, Facebook, X and LinkedIn can't be read without
  signing in: they're listed as `manual` for a person to check.
- Nothing is published: a person reviews the results (the first scan, 2 Oct 2026, is the Claude Doc
  "Houna — Content radar, first scan") and adds what fits to houna.org.
