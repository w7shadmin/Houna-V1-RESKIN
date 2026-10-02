// Step 1 of the content scan: every professional's, organization's and wellness center's own links,
// read from their houna.org pages. Writes inventory.json: [{ kind, id, name, links: [{ type, url }] }].
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const env = Object.fromEntries(fs.readFileSync(path.join(here, '..', '..', '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]));
const SUPA = env.EXPO_PUBLIC_SUPABASE_URL, KEY = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', Accept: 'text/html,*/*' };

const bundle = await (await fetch(`${SUPA}/functions/v1/houna-search-bundle?lang=en`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })).json();
const pros = bundle.professionals.therapists.map((t) => ({ kind: 'professional', id: t.slug, name: t.name, url: `https://houna.org/en/therapists/${t.slug}` }));
const orgs = bundle.organizations.organizations.map((o) => ({ kind: 'organization', id: String(o.id), name: o.name, url: `https://houna.org/en/organizations/${o.id}` }));
const wells = bundle.wellness.centers.map((c) => ({ kind: 'wellness', id: String(c.id), name: c.name, url: `https://houna.org/en/wellness-center/${c.id}` }));
const existing = { articles: bundle.articles.articles.map((a) => ({ url: a.url, title: a.title })), podcasts: bundle.podcasts.podcasts.map((p) => ({ url: p.url, title: p.title, host: p.host })) };
fs.writeFileSync(path.join(here, 'existing.json'), JSON.stringify(existing, null, 1));

const HOUNA = ['houna.org', 'hounainitiative', 'UCgqcVmqDZOTzRGixRzRgK0Q', 'fonts.g', 'googleapis', 'gstatic', 'w3.org', 'schema.org', 'jsdelivr', 'cloudflare', 'unpkg', 'google.com/maps', 'goo.gl/maps', 'maps.app.goo.gl', 'wa.me', 'api.whatsapp'];
const type = (u) => {
  const h = u.toLowerCase();
  if (/youtube\.com|youtu\.be/.test(h)) return 'youtube';
  if (/instagram\.com/.test(h)) return 'instagram';
  if (/linkedin\.com/.test(h)) return 'linkedin';
  if (/(twitter|x)\.com\//.test(h)) return 'x';
  if (/facebook\.com/.test(h)) return 'facebook';
  if (/tiktok\.com/.test(h)) return 'tiktok';
  if (/spotify\.com|podcasts\.apple|anghami|simplecast|omny|podbean|buzzsprout|anchor\.fm|soundcloud/.test(h)) return 'podcast';
  if (/medium\.com|substack\.com|blogspot|wordpress\.com/.test(h)) return 'blog';
  return 'website';
};
async function links(item) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(item.url, { headers: UA, signal: AbortSignal.timeout(40000) });
      const html = await r.text();
      const set = new Map();
      for (const m of html.matchAll(/href="(https?:\/\/[^"#\s]+)"/g)) {
        const u = m[1].replace(/&amp;/g, '&').replace(/\/+$/, '');
        if (HOUNA.some((h) => u.includes(h))) continue;
        if (/\.(css|js|png|jpe?g|svg|webp|ico|woff2?)(\?|$)/i.test(u)) continue;
        set.set(u.toLowerCase(), { type: type(u), url: u });
      }
      return [...set.values()];
    } catch (e) {
      if (attempt) return [{ type: 'error', url: String(e.message || e).slice(0, 80) }];
    }
  }
}
const all = [...pros, ...orgs, ...wells];
const out = [];
let i = 0;
async function worker() {
  while (i < all.length) {
    const item = all[i++];
    out.push({ ...item, links: await links(item) });
    if (out.length % 25 === 0) console.log(out.length, '/', all.length);
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
fs.writeFileSync(path.join(here, 'inventory.json'), JSON.stringify(out, null, 1));
const count = (t) => out.filter((o) => o.links.some((l) => l.type === t)).length;
console.log('done', out.length, { website: count('website'), youtube: count('youtube'), podcast: count('podcast'), blog: count('blog'), instagram: count('instagram'), linkedin: count('linkedin'), errors: count('error') });
console.log('existing', existing.articles.length, 'articles', existing.podcasts.length, 'podcasts');
