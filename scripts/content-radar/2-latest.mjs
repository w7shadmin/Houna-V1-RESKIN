// Step 2 (after 1-inventory.mjs): each source's latest content. YouTube channels through their public RSS feed; websites
// through their RSS/Atom feed (from <link rel=alternate>, /feed, /rss.xml…) or, failing that, the
// sitemap's dated pages that look like posts. Instagram, Facebook, X and LinkedIn can't be read
// without signing in: they're listed for a person to check. Writes latest.json.
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const inv = JSON.parse(fs.readFileSync(path.join(here, 'inventory.json'), 'utf8'));
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', 'Accept-Language': 'en-US,en;q=0.9' };
const get = async (u, ms = 25000) => { const r = await fetch(u, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(ms) }); return { ok: r.ok, status: r.status, url: r.url, text: r.ok ? await r.text() : '' }; };
const dec = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<[^>]+>/g, '').trim();

// Sources, each with the listings that link it.
const sources = new Map();
for (const item of inv) for (const l of item.links) {
  if (!['youtube', 'website', 'podcast', 'blog', 'instagram', 'facebook', 'x', 'tiktok', 'linkedin'].includes(l.type)) continue;
  if (/apps\.apple\.com|play\.google\.com/.test(l.url)) continue;
  let key = l.url.toLowerCase().replace(/\/(videos|shorts|featured)$/, '').replace(/\?.*$/, '');
  if (l.type === 'website' || l.type === 'blog') key = new URL(l.url).origin.toLowerCase();
  if (!sources.has(key)) sources.set(key, { type: l.type, url: l.type === 'website' ? new URL(l.url).origin : l.url.replace(/\/(videos|shorts|featured)$/, ''), listings: [] });
  const s = sources.get(key);
  if (!s.listings.some((x) => x.name === item.name)) s.listings.push({ kind: item.kind, name: item.name, id: item.id });
}

async function youtube(s) {
  let id = (s.url.match(/channel\/(UC[\w-]{20,})/) || [])[1];
  let channel = '';
  if (!id) {
    const page = await get(s.url);
    id = (page.text.match(/"(?:channelId|externalId)":"(UC[\w-]{20,})"/) || page.text.match(/channel\/(UC[\w-]{20,})/) || [])[1];
  }
  if (!id) return { error: 'channel id not found' };
  const feed = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  if (!feed.ok) return { error: `feed ${feed.status}` };
  channel = dec((feed.text.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  const items = [...feed.text.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 6).map(([, e]) => ({
    title: dec((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''),
    url: (e.match(/<link rel="alternate" href="([^"]+)"/) || [])[1],
    date: ((e.match(/<published>([^<]+)<\/published>/) || [])[1] || '').slice(0, 10),
    kind: /\/shorts\//.test(e) ? 'short' : 'video',
  }));
  return { channel, items };
}

function parseFeed(xml) {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/g)].map((m) => m[0]);
  return blocks.slice(0, 6).map((b) => ({
    title: dec((b.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || ''),
    url: dec((b.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || (b.match(/<link[^>]+href="([^"]+)"/) || [])[1] || ''),
    date: (() => { const d = (b.match(/<(pubDate|published|updated|dc:date)>([^<]+)</) || [])[2]; const t = d ? new Date(d) : null; return t && !isNaN(t) ? t.toISOString().slice(0, 10) : ''; })(),
    kind: 'post',
  })).filter((x) => x.title && x.url);
}
async function website(s) {
  const home = await get(s.url).catch((e) => ({ ok: false, status: String(e.message || e).slice(0, 40), text: '' }));
  if (!home.ok) return { error: `site ${home.status}` };
  const alt = [...home.text.matchAll(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]+href="([^"]+)"/g)].map((m) => new URL(m[1], home.url).href).filter((u) => !/comments/.test(u));
  const guesses = [...alt, '/feed', '/blog/feed', '/rss.xml', '/feed.xml', '/blog/rss.xml', '/blogs/news.atom', '/ar/feed'].map((u) => new URL(u, s.url).href);
  for (const u of [...new Set(guesses)]) {
    try {
      const f = await get(u, 15000);
      if (f.ok && /<(rss|feed)\b/.test(f.text)) { const items = parseFeed(f.text); if (items.length) return { feed: u, items }; }
    } catch {}
  }
  // The sitemap's dated post-like pages, newest first.
  for (const sm of ['/sitemap.xml', '/sitemap_index.xml', '/post-sitemap.xml']) {
    try {
      const f = await get(new URL(sm, s.url).href, 15000);
      if (!f.ok) continue;
      const subs = [...f.text.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => /post|blog|article|news/.test(u)).slice(0, 2);
      let xml = f.text;
      for (const u of subs) { const g = await get(u, 15000).catch(() => null); if (g?.ok) xml += g.text; }
      const urls = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?/g)]
        .map((m) => ({ url: m[1], date: (m[2] || '').slice(0, 10) }))
        .filter((x) => /\/(blog|blogs|post|posts|article|articles|news|insights)\//i.test(x.url) && x.date)
        .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
        .map((x) => ({ title: decodeURIComponent(x.url.replace(/\/$/, '').split('/').pop()).replace(/[-_]/g, ' '), url: x.url, date: x.date, kind: 'post', titleFromUrl: true }));
      if (urls.length) return { sitemap: sm, items: urls };
    } catch {}
  }
  return { items: [], note: 'no feed or dated posts found' };
}

const list = [...sources.values()];
const out = [];
let i = 0;
async function worker() {
  while (i < list.length) {
    const s = list[i++];
    let r;
    try {
      r = s.type === 'youtube' ? await youtube(s) : s.type === 'website' || s.type === 'blog' ? await website(s) : { manual: true };
    } catch (e) { r = { error: String(e.message || e).slice(0, 60) }; }
    out.push({ ...s, ...r });
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
fs.writeFileSync(path.join(here, 'latest.json'), JSON.stringify(out, null, 1));
for (const s of out.filter((x) => !x.manual)) console.log(s.type, '|', s.channel || s.url, '|', s.listings.map((l) => l.name).slice(0, 2).join('; '), s.listings.length > 2 ? `+${s.listings.length - 2}` : '', '|', s.error || s.note || `${s.items.length} items, newest ${s.items[0]?.date}`);
console.log('manual (social) sources:', out.filter((x) => x.manual).length);
