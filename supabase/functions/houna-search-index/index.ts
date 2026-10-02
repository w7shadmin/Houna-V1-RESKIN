import { createClient } from "npm:@supabase/supabase-js@2.45.4";

/**
 * houna-search-index — what the app's directory search needs to know about
 * each professional beyond their list card: where they are, their languages,
 * who they work with, their organization and their specialties. These live
 * only on each professional's own houna.org page, so reading them is ~290
 * page loads: done here, at most once a day per language, and served to every
 * phone as one small file.
 *
 *   GET /houna-search-index?lang=en|ar
 *   200 { builtAt, lang, professionals: [{ slug, info, specialties }] }
 *   202 { building: true, done, total }   (the first build is still running)
 *
 * Kept in houna-proxy's `houna_cache` table (key `search_index:v1:<lang>`).
 * houna.org answers the edge slowly, so a build is done in steps: each call
 * that finds the index missing or over a day old takes one step in the
 * background (up to 100 s, progress saved after every batch of pages) and
 * answers at once, with the old index if there is one. A lock row keeps steps
 * from overlapping. The page parsing mirrors houna-proxy's `extractTherapists`
 * and `extractTherapistDetail` (supabase/functions/houna-proxy/index.ts); keep
 * them in step. Unlike the
 * proxy, it pages the list until a page brings no one new: houna.org's pager
 * only links the next page, so the proxy's `lastPage` is always current + 1.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const INDEX_VERSION = 1;
const FRESH_HOURS = 24;
/** One build step's work, well inside the Edge Function's 150 s limit; the lock outlives it. */
const STEP_SECONDS = 100;
const LOCK_SECONDS = 130;
/** An abandoned build's progress is dropped after this, and the next one starts over. */
const BUILD_KEEP_MINUTES = 24 * 60;
const MAX_PAGES = 40;
/** houna.org pages fetched at once: gentle on the site. */
const CONCURRENCY = 6;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

type Lang = "en" | "ar";

interface ProfessionalFacts {
  slug: string;
  /** The page's info fields, labels in the page's language: location, languages, organizations, work with. */
  info: Record<string, string>;
  specialties: string | null;
}

/* ── Parsing (as houna-proxy) ── */

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
    "&#039;": "'", "&rsquo;": "'", "&lsquo;": "'", "&ldquo;": '"',
    "&rdquo;": '"', "&nbsp;": " ", "&hellip;": "...", "&mdash;": "—",
    "&ndash;": "–", "&laquo;": "«", "&raquo;": "»",
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (m) => entities[m] || m);
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<img[^>]*>/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
}

/**
 * houna-proxy's slug check, plus an optional leading hyphen: a few houna.org
 * addresses begin with one ("-dina-al-waheab"), which the proxy's own check
 * (and so its profile route) rejects.
 */
const SLUG_PATTERN = /^-?[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

/** The professionals' slugs on one list page. */
function extractSlugs(html: string): string[] {
  const slugs: string[] = [];
  const cardRegex = /<a[^>]+href="https:\/\/houna\.org\/(?:ar\/)?therapists\/([^"?#]+)[^"]*"[^>]*class="text-decoration-none">/g;
  let m: RegExpExecArray | null;
  while ((m = cardRegex.exec(html)) !== null) if (SLUG_PATTERN.test(m[1])) slugs.push(m[1]);
  return slugs;
}

/** A professional's page: its info fields and specialties. */
function extractFacts(html: string): Omit<ProfessionalFacts, "slug"> {
  const info: Record<string, string> = {};
  const infoRegex = /<div class="green pb-2"><label[^>]*class="text-uppercase dark-green bold">([^:]+):\s*<\/label>([\s\S]*?)<\/div>/g;
  let m: RegExpExecArray | null;
  while ((m = infoRegex.exec(html)) !== null) {
    const value = stripTags(m[2]);
    if (value) info[m[1].trim().toLowerCase()] = value;
  }
  const specialtiesMatch = html.match(/<div class="tab-pane fade" id="specialties"[\s\S]*?>([\s\S]*?)<\/div>/);
  const specialties = specialtiesMatch ? stripTags(specialtiesMatch[1]) || null : null;
  return { info, specialties };
}

/* ── Building ── */

async function page(url: string): Promise<string> {
  const resp = await fetch(url, { headers: BROWSER_HEADERS });
  if (!resp.ok) throw new Error(`${url}: ${resp.status}`);
  return resp.text();
}

/** A build in progress, saved after every batch so a step cut short loses nothing. */
interface BuildState {
  startedAt: string;
  /** Every professional's slug, once the list has been paged through. */
  slugs: string[];
  listDone: boolean;
  nextPage: number;
  professionals: ProfessionalFacts[];
}

/**
 * One step of a build: the list first, then each professional's page, a batch
 * at a time, saving progress after each batch, until done or `deadline`.
 * Returns the finished index, or null if there's more to do.
 */
async function step(lang: Lang, deadline: number): Promise<Index | null> {
  const state: BuildState = ((await read(buildKey(lang)))?.data as BuildState | undefined) ?? {
    startedAt: new Date().toISOString(),
    slugs: [],
    listDone: false,
    nextPage: 1,
    professionals: [],
  };
  const save = () => write(buildKey(lang), state, BUILD_KEEP_MINUTES);
  const started = Date.now();
  let loaded = 0;

  // Every slug: page on until a page brings no one new.
  const listBase = `https://houna.org/${lang}/therapists?sort=name-ASC&page=`;
  const seen = new Set(state.slugs);
  while (!state.listDone && Date.now() < deadline) {
    const pages = Array.from({ length: Math.min(CONCURRENCY, MAX_PAGES - state.nextPage + 1) }, (_, i) => state.nextPage + i);
    const found = await Promise.all(pages.map((n) => page(listBase + n).then(extractSlugs)));
    loaded += pages.length;
    let fresh = 0;
    for (const list of found) {
      for (const slug of list) {
        if (!seen.has(slug)) {
          seen.add(slug);
          state.slugs.push(slug);
          fresh++;
        }
      }
    }
    state.nextPage += pages.length;
    // Past the end: an empty page, pages repeating people already seen, or the cap.
    if (fresh === 0 || found.some((list) => list.length === 0) || state.nextPage > MAX_PAGES) state.listDone = true;
    await save();
  }

  // Each one's page (the proxy's detail URL: no /en prefix in English).
  const detailBase = lang === "ar" ? "https://houna.org/ar/therapists/" : "https://houna.org/therapists/";
  while (state.listDone && state.professionals.length < state.slugs.length && Date.now() < deadline) {
    const batch = state.slugs.slice(state.professionals.length, state.professionals.length + CONCURRENCY);
    const facts = await Promise.all(
      batch.map(async (slug) => {
        try {
          return { slug, ...extractFacts(await page(detailBase + slug)) };
        } catch {
          return { slug, info: {}, specialties: null };
        }
      }),
    );
    loaded += batch.length;
    state.professionals.push(...facts);
    await save();
  }
  console.log(`houna-search-index ${lang}: ${loaded} pages in ${Date.now() - started}ms; ${state.professionals.length}/${state.slugs.length} professionals`);

  if (!state.listDone || state.professionals.length < state.slugs.length) return null;

  // Done. houna.org down or its markup changed: keep serving the last good index rather than an empty one.
  await supabase.from("houna_cache").delete().eq("cache_key", buildKey(lang));
  const readable = state.professionals.filter((p) => Object.keys(p.info).length > 0).length;
  if (state.slugs.length === 0 || readable < state.slugs.length / 2) {
    throw new Error(`Only ${readable} of ${state.slugs.length} professional pages could be read`);
  }
  return { builtAt: new Date().toISOString(), lang, professionals: state.professionals };
}

/* ── Serving ── */

type Index = { builtAt: string; lang: Lang; professionals: ProfessionalFacts[] };

const indexKey = (lang: Lang) => `search_index:v${INDEX_VERSION}:${lang}`;
const buildKey = (lang: Lang) => `search_index_build:v${INDEX_VERSION}:${lang}`;
const lockKey = (lang: Lang) => `search_index_lock:v${INDEX_VERSION}:${lang}`;

async function read(key: string) {
  const { data } = await supabase.from("houna_cache").select("data, expires_at").eq("cache_key", key).maybeSingle();
  return data as { data: unknown; expires_at: string } | null;
}

async function write(key: string, data: unknown, minutes: number) {
  await supabase.from("houna_cache").upsert({
    cache_key: key,
    data,
    expires_at: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
  });
}

/** Takes the build lock unless another step holds it. It outlives one step, so a step cut off can't hold it for long. */
async function lock(lang: Lang): Promise<boolean> {
  const held = await read(lockKey(lang));
  if (held && new Date(held.expires_at) > new Date()) return false;
  await write(lockKey(lang), { at: new Date().toISOString() }, LOCK_SECONDS / 60);
  return true;
}

/** One build step in the background; the finished index replaces the old one. */
function runStep(lang: Lang) {
  const work = (async () => {
    try {
      const index = await step(lang, Date.now() + STEP_SECONDS * 1000);
      if (index) await write(indexKey(lang), index, FRESH_HOURS * 60);
    } catch (e) {
      console.error("houna-search-index build step failed", e);
    } finally {
      await supabase.from("houna_cache").delete().eq("cache_key", lockKey(lang));
    }
  })();
  // @ts-ignore EdgeRuntime is the Supabase edge runtime's global.
  EdgeRuntime.waitUntil(work);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    const lang: Lang = new URL(req.url).searchParams.get("lang") === "ar" ? "ar" : "en";
    const cached = await read(indexKey(lang));
    const fresh = cached && new Date(cached.expires_at) > new Date();

    // Missing or over a day old: take the next build step in the background (unless one is running).
    if (!fresh && (await lock(lang))) runStep(lang);

    // An old index is still served while the new one is built.
    if (cached) return json(cached.data);
    const progress = (await read(buildKey(lang)))?.data as BuildState | undefined;
    return json({ building: true, done: progress?.professionals.length ?? 0, total: progress?.slugs.length ?? 0 }, 202);
  } catch (e) {
    console.error("houna-search-index", e);
    return json({ error: "Search index unavailable" }, 500);
  }
});
