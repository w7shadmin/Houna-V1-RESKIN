import { createClient } from "npm:@supabase/supabase-js@2.45.4";

/**
 * houna-search-bundle — directory search's lists in one call (lib/directorySearch.ts).
 *
 *   GET /houna-search-bundle?lang=en|ar
 *     200 { professionals: { therapists, countries, online }, articles, podcasts, organizations,
 *           wellness, events, speakers }   (each exactly as houna-proxy's own list route returns it)
 *   GET /houna-search-bundle?lang=en|ar&country=<houna.org country id>
 *     200 { therapists, countries }   (every professional in that country: "near you")
 *
 * Why: building its search, a phone used to call houna-proxy once per list and per page of
 * professionals (~30 calls a language, ~60 with the other language's names), and Supabase counts
 * every invocation (500,000 a month on the free plan). Here each bundle is assembled from
 * houna-proxy's list routes once, kept in `houna_cache` (key `search_bundle:v<KEY_VERSION>:…`) for FRESH_HOURS,
 * and then served to every phone from that one row. Once stale, the old copy is still served at
 * once while a single caller rebuilds it in the background (a lock row keeps rebuilds from
 * overlapping), so a busy moment never has everyone waiting on houna.org (slow to the edge).
 *
 * `professionals.online` is the slugs of those houna.org lists as offering online sessions (its own
 * availability filter; no professional's record says so), for the app's "online" mark. It's read
 * from houna.org directly, not through houna-proxy: the edge runtime caps how many calls one request
 * makes to another function, and paging everyone already uses most of that.
 *
 * The lists come from houna-proxy itself, so the parsing stays in one place; the caller's own
 * Authorization is passed on (the gateway checks it, as it does for the app's direct calls).
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const PROXY = `${SUPABASE_URL}/functions/v1/houna-proxy`;

const KEY_VERSION = 3;
const FRESH_HOURS = 6;
/** A rebuild in progress holds this long before another caller may start one. */
const LOCK_MINUTES = 5;
/** Professionals come 15 to a page (20 pages in September 2026); the proxy's `lastPage` is always current + 1. */
const MAX_PAGES = 40;
const PAGE_BATCH = 5;
/** houna.org's numeric country ids, as houna-proxy accepts them. */
const COUNTRY_ID = /^\d{1,3}$/;

type Lang = "en" | "ar";
type Json = Record<string, unknown>;
type Auth = { authorization: string; apikey: string };

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function proxy(route: string, auth: Auth): Promise<Json> {
  const res = await fetch(`${PROXY}${route}`, { headers: { Authorization: auth.authorization, apikey: auth.apikey } });
  if (!res.ok) throw new Error(`${route}: ${res.status}`);
  return res.json();
}

/** Every professional (in a country), page after page until one brings no one new. */
async function allTherapists(lang: Lang, country: string, auth: Auth): Promise<Json> {
  const page = (p: number) => proxy(`/therapists?page=${p}&lang=${lang}&country=${country}&sort=name-ASC`, auth);
  const therapists: { slug: string }[] = [];
  const seen = new Set<string>();
  /** Adds a page's people not seen yet (a page can list someone twice); how many were new. */
  const add = (r: Json) => {
    let added = 0;
    for (const t of (r.therapists as { slug: string }[]) ?? []) {
      if (seen.has(t.slug)) continue;
      seen.add(t.slug);
      therapists.push(t);
      added++;
    }
    return added;
  };
  const first = await page(1);
  let more = add(first) > 0;
  let next = 2;
  while (more && next <= MAX_PAGES) {
    const pages = Array.from({ length: Math.min(PAGE_BATCH, MAX_PAGES - next + 1) }, (_, i) => next + i);
    next += pages.length;
    for (const r of await Promise.all(pages.map(page))) {
      if (add(r) === 0) more = false;
    }
  }
  return { therapists, countries: first.countries ?? [] };
}

/** Slugs of the professionals houna.org lists under "online sessions", page after page until one brings no one new. */
async function onlineSlugs(lang: Lang): Promise<string[]> {
  const seen = new Set<string>();
  for (let p = 1; p <= MAX_PAGES; p++) {
    const url = `https://houna.org/${lang}/therapists?availability=online&page=${p}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; HounaApp)", Accept: "text/html" } });
    if (!res.ok) throw new Error(`online page ${p}: ${res.status}`);
    const html = await res.text();
    let added = 0;
    for (const m of html.matchAll(/\/therapists\/([A-Za-z0-9][A-Za-z0-9._-]{0,127})(?=["'?#])/g)) {
      if (!seen.has(m[1])) {
        seen.add(m[1]);
        added++;
      }
    }
    if (added === 0) break;
  }
  return [...seen];
}

/** One language's lists. A list that fails keeps the previous bundle's copy; with none, the build fails. */
async function bundle(lang: Lang, auth: Auth, prev: Json | null): Promise<Json> {
  const q = `?lang=${lang}`;
  const parts: [string, () => Promise<Json>][] = [
    [
      "professionals",
      async () => {
        const [all, online] = await Promise.all([allTherapists(lang, "", auth), onlineSlugs(lang).catch(() => null)]);
        const before = ((prev?.professionals as Json | undefined)?.online as string[] | undefined) ?? [];
        return { ...all, online: online ?? before };
      },
    ],
    ["articles", () => proxy(`/articles${q}`, auth)],
    ["podcasts", () => proxy(`/podcasts${q}`, auth)],
    ["organizations", () => proxy(`/organizations${q}`, auth)],
    ["wellness", () => proxy(`/wellness-centers${q}`, auth)],
    ["events", () => proxy(`/events${q}`, auth)],
    ["speakers", () => proxy(`/speakers${q}`, auth)],
  ];
  const results = await Promise.allSettled(parts.map(([, load]) => load()));
  const out: Json = {};
  results.forEach((r, i) => {
    const name = parts[i][0];
    if (r.status === "fulfilled") out[name] = r.value;
    else if (prev?.[name] !== undefined) out[name] = prev[name];
    else throw new Error(`${name}: ${r.reason}`);
  });
  return out;
}

/** The kept copy when fresh; when stale, the stale copy at once and one background rebuild; when none, a build. */
async function kept(key: string, build: (prev: Json | null) => Promise<Json>): Promise<Json> {
  const { data: row } = await supabase.from("houna_cache").select("data, expires_at").eq("cache_key", key).maybeSingle();
  if (row && new Date(row.expires_at) > new Date()) return row.data as Json;

  const rebuild = async () => {
    const data = await build((row?.data as Json) ?? null);
    await supabase.from("houna_cache").upsert({
      cache_key: key,
      data,
      expires_at: new Date(Date.now() + FRESH_HOURS * 3600 * 1000).toISOString(),
    });
    return data;
  };
  if (!row) return rebuild();

  const lockKey = `${key}:lock`;
  const { data: lock } = await supabase.from("houna_cache").select("expires_at").eq("cache_key", lockKey).maybeSingle();
  if (!lock || new Date(lock.expires_at) <= new Date()) {
    await supabase.from("houna_cache").upsert({
      cache_key: lockKey,
      data: {},
      expires_at: new Date(Date.now() + LOCK_MINUTES * 60 * 1000).toISOString(),
    });
    const work = rebuild()
      .catch((e) => console.error("houna-search-bundle rebuild", key, e instanceof Error ? e.message : e))
      .finally(() => supabase.from("houna_cache").delete().eq("cache_key", lockKey));
    // @ts-ignore EdgeRuntime is the Supabase edge runtime's global.
    EdgeRuntime.waitUntil(work);
  }
  return row.data as Json;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" });

  const params = new URL(req.url).searchParams;
  const lang: Lang = params.get("lang") === "ar" ? "ar" : "en";
  const country = params.get("country") ?? "";
  if (country && !COUNTRY_ID.test(country)) return json(400, { error: "Bad request" });
  const auth: Auth = {
    authorization: req.headers.get("Authorization") ?? "",
    apikey: req.headers.get("apikey") ?? "",
  };

  try {
    const data = country
      ? await kept(`search_bundle:v${KEY_VERSION}:${lang}:country:${country}`, () => allTherapists(lang, country, auth))
      : await kept(`search_bundle:v${KEY_VERSION}:${lang}`, (prev) => bundle(lang, auth, prev));
    return json(200, data);
  } catch (e) {
    console.error("houna-search-bundle", lang, country, e instanceof Error ? e.message : e);
    return json(500, { error: "Unable to load this content right now." });
  }
});
