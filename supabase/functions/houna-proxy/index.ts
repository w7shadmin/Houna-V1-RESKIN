import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CACHE_TTL_MINUTES = 20;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
};

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
    "&#039;": "'", "&rsquo;": "'", "&lsquo;": "'", "&ldquo;": '"',
    "&rdquo;": '"', "&nbsp;": " ", "&hellip;": "...", "&mdash;": "—",
    "&ndash;": "–", "&laquo;": "«", "&raquo;": "»",
  };
  return text.replace(/&[a-zA-Z0-9#]+;/g, (m) => entities[m] || m);
}

// Detail-page slugs are interpolated into both the cache key and the upstream URL.
// Constrain them so a caller cannot mint unlimited cache rows or walk upstream paths.
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

// Scheme allowlist for any URL that ends up in an href we emit.
const SAFE_URL_SCHEMES = ["http:", "https:", "mailto:", "tel:"];

function isSafeUrl(raw: string): boolean {
  const value = raw.trim();
  if (!value) return false;
  // Relative URLs are fine; they cannot carry a scheme.
  if (value.startsWith("/") || value.startsWith("#")) return true;
  try {
    return SAFE_URL_SCHEMES.includes(new URL(value, "https://houna.org").protocol);
  } catch {
    return false;
  }
}

// Allowlist-based HTML sanitizer for the one field we render as markup
// (event descriptions). Everything not explicitly permitted is removed:
// all scripting containers, all attributes except a safe-scheme href, and
// every event handler.
const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "small",
  "ul", "ol", "li", "span", "div", "a",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote",
]);

function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Drop scripting/embedding containers along with their contents.
  let out = html.replace(
    /<(script|style|iframe|object|embed|form|svg|math|link|meta|base|template|noscript)\b[\s\S]*?<\/\1\s*>/gi,
    "",
  );
  // Drop the same as self-closing/unclosed tags.
  out = out.replace(
    /<\/?(script|style|iframe|object|embed|form|svg|math|link|meta|base|template|noscript)\b[^>]*>/gi,
    "",
  );
  // Drop comments, which can hide conditional markup.
  out = out.replace(/<!--[\s\S]*?-->/g, "");

  // Rebuild every remaining tag from the allowlist, discarding all attributes
  // except a validated href on anchors.
  out = out.replace(
    /<\s*(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_full, closing: string, rawName: string, attrs: string) => {
      const name = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return "";
      if (closing) return `</${name}>`;
      if (name === "br") return "<br>";

      if (name === "a") {
        const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
        const href = hrefMatch ? (hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? "") : "";
        if (href && isSafeUrl(href)) {
          const safeHref = href.trim().replace(/"/g, "&quot;");
          return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer nofollow">`;
        }
        return "<a>";
      }

      return `<${name}>`;
    },
  );

  return out.trim();
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html.replace(/<img[^>]*>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function extractTherapists(html: string) {
  const therapists: Array<{
    name: string; role: string; summary: string;
    profileUrl: string; slug: string; imageUrl: string | null;
  }> = [];

  // Match therapist cards in both English (houna.org/therapists/) and Arabic (houna.org/ar/therapists/) layouts.
  const cardRegex = /<a[^>]+href="(https:\/\/houna\.org\/(?:ar\/)?therapists\/[^"]+)"[^>]*class="text-decoration-none">([\s\S]*?)<\/a>\s*<\/div>/g;
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(html)) !== null) {
    const profileUrl = match[1];
    const cardHtml = match[2];
    const slug = profileUrl.split("/therapists/")[1]?.split(/[?#]/)[0] || "";

    const imgMatch = cardHtml.match(/<img[^>]+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const nameMatch = cardHtml.match(/<h4[^>]*class="[^"]*name-base[^"]*"[^>]*>([\s\S]*?)<\/h4>/);
    const name = nameMatch ? stripTags(nameMatch[1]) : "";

    const roleMatch = cardHtml.match(/<div[^>]*class="[^"]*occupation-base[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const role = roleMatch ? stripTags(roleMatch[1]) : "";

    const summaryMatch = cardHtml.match(/<div[^>]*class="[^"]*summary-base[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const summary = summaryMatch ? stripTags(summaryMatch[1]) : "";

    if (name) {
      therapists.push({ name, role, summary, profileUrl, slug, imageUrl });
    }
  }
  return therapists;
}

function extractOrganizations(html: string) {
  const orgs: Array<{
    name: string; summary: string;
    profileUrl: string; id: string; imageUrl: string | null;
  }> = [];

  const cardRegex = /<a[^>]+href="(https:\/\/houna\.org\/(?:ar\/)?organizations\/\d+)"[^>]*class="text-decoration-none">([\s\S]*?)<\/a>\s*<\/div>/g;
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(html)) !== null) {
    const profileUrl = match[1];
    const cardHtml = match[2];
    const id = profileUrl.split("/organizations/")[1]?.split(/[?#]/)[0] || "";

    const imgMatch = cardHtml.match(/<img[^>]+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const nameMatch = cardHtml.match(/<h4[^>]*class="[^"]*name-base[^"]*"[^>]*>([\s\S]*?)<\/h4>/);
    const name = nameMatch ? stripTags(nameMatch[1]) : "";

    const summaryMatch = cardHtml.match(/<div[^>]*class="[^"]*summary-base[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const summary = summaryMatch ? stripTags(summaryMatch[1]) : "";

    if (name) {
      orgs.push({ name, summary, profileUrl, id, imageUrl });
    }
  }
  return orgs;
}

function extractWellnessCenters(html: string) {
  const centers: Array<{
    name: string; summary: string; services: string[];
    profileUrl: string; id: string; imageUrl: string | null;
  }> = [];

  const cardRegex = /<a[^>]+href="(https:\/\/houna\.org\/(?:ar\/)?wellness-center\/\d+)"[^>]*class="text-decoration-none">([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(html)) !== null) {
    const profileUrl = match[1];
    const cardHtml = match[2];
    const id = profileUrl.split("/wellness-center/")[1]?.split(/[?#]/)[0] || "";

    const imgMatch = cardHtml.match(/<img[^>]+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const nameMatch = cardHtml.match(/<h4[^>]*class="[^"]*name-base[^"]*"[^>]*>([\s\S]*?)<\/h4>/);
    const name = nameMatch ? stripTags(nameMatch[1]) : "";

    const summaryMatch = cardHtml.match(/<div[^>]*class="[^"]*summary-base[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const summary = summaryMatch ? stripTags(summaryMatch[1]) : "";

    const services = summary
      .split(/,|\band\b/i)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (name) {
      centers.push({ name, summary, services, profileUrl, id, imageUrl });
    }
  }
  return centers;
}

function extractWellnessCenterCountries(html: string) {
  const countries: Array<{ value: string; label: string }> = [];
  const selectMatch = html.match(/<select[^>]*name="country"[^>]*>([\s\S]*?)<\/select>/);
  if (selectMatch) {
    const optionRegex = /<option value="([^"]*)"\s*>([^<]+)<\/option>/g;
    let optMatch: RegExpExecArray | null;
    while ((optMatch = optionRegex.exec(selectMatch[1])) !== null) {
      countries.push({ value: optMatch[1], label: optMatch[2].trim() });
    }
  }
  return countries;
}

function extractWellnessCenterDetail(html: string) {
  const imgMatch = html.match(/<img[^>]+src="(https:\/\/houna\.org\/storage\/wellness-centers\/[^"]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : null;

  const nameMatch = html.match(/<h4[^>]*class="dark-green bold[^"]*"[^>]*>\s*([\s\S]*?)<\/h4>/);
  const name = nameMatch ? stripTags(nameMatch[1]) : "";

  const summaryMatch = html.match(/<div class="light grey mb-4">([\s\S]*?)<\/div>/);
  const summary = summaryMatch ? stripTags(summaryMatch[1]) : "";

  const info: Record<string, string> = {};
  const infoRegex = /<div class="green pb-2"><label[^>]*class="text-uppercase dark-green bold">([^:]+):\s*<\/label>([\s\S]*?)<\/div>/g;
  let infoMatch: RegExpExecArray | null;
  while ((infoMatch = infoRegex.exec(html)) !== null) {
    const key = infoMatch[1].trim().toLowerCase();
    let value = stripTags(infoMatch[2]);
    if (key === "website") {
      const linkMatch = infoMatch[2].match(/<a[^>]+href="([^"]+)"/);
      value = linkMatch ? linkMatch[1] : value;
    }
    if (value) info[key] = value;
  }

  const profileMatch = html.match(/<div class="tab-pane fade show active" id="profile"[\s\S]*?>([\s\S]*?)<\/div>\s*<\/div>/);
  const fullBio = profileMatch ? stripTags(profileMatch[1]) : summary;

  const contacts: { type: string; value: string; href: string }[] = [];
  const contactRegex = /<a\s+href="([^"]+)"[^>]*data-hover="([^"]*)"[^>]*class="[^"]*btn-green[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let contactMatch: RegExpExecArray | null;
  while ((contactMatch = contactRegex.exec(html)) !== null) {
    const href = contactMatch[1];
    const dataHover = contactMatch[2];
    const label = stripTags(contactMatch[3]).toLowerCase();
    if (label.includes("call") || href.startsWith("tel:")) {
      contacts.push({ type: "phone", value: dataHover || href.replace("tel:", ""), href });
    } else if (label.includes("email") || href.includes("email-protection")) {
      contacts.push({ type: "email", value: dataHover, href });
    }
  }

  const socials: { platform: string; url: string }[] = [];
  const socialRegex = /<a\s+href="(https:\/\/(?:www\.)?(?:twitter|facebook|instagram|youtube|linkedin|tiktok)\.com[^"]+)"[^>]*>/g;
  let socialMatch: RegExpExecArray | null;
  const seenSocials = new Set<string>();
  while ((socialMatch = socialRegex.exec(html)) !== null) {
    const url = socialMatch[1];
    if (seenSocials.has(url)) continue;
    seenSocials.add(url);
    let platform = "link";
    if (url.includes("twitter")) platform = "twitter";
    else if (url.includes("facebook")) platform = "facebook";
    else if (url.includes("instagram")) platform = "instagram";
    else if (url.includes("youtube")) platform = "youtube";
    else if (url.includes("linkedin")) platform = "linkedin";
    else if (url.includes("tiktok")) platform = "tiktok";
    if (!url.includes("hounainitiative")) {
      socials.push({ platform, url });
    }
  }

  const services = summary
    .split(/,|\band\b/i)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return { name, summary, fullBio, services, imageUrl, info, contacts, socials };
}

function extractArticles(html: string) {
  const articles: Array<{
    title: string;
    blurb: string;
    url: string;
    isExternal: boolean;
    sourceDomain: string;
    imageUrl: string | null;
  }> = [];

  const cardPattern = /<div class="card h-100">([\s\S]*?)(?=<div class=" col-sm-4|<div class="row|$)/g;
  let cardMatch: RegExpExecArray | null;
  while ((cardMatch = cardPattern.exec(html)) !== null) {
    const card = cardMatch[1];

    const imgMatch = card.match(/<img[^>]+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const titleMatch = card.match(/<h5 class="card-title">([\s\S]*?)<\/h5>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";

    const blurbMatch = card.match(/<p class="card-text">([\s\S]*?)<\/p>/);
    const blurb = blurbMatch ? stripTags(blurbMatch[1]) : "";

    const linkMatch = card.match(/<a[^>]+href="([^"]+)"[^>]*class="tag[^"]*"[^>]*>[\s\S]*?<\/a>/i);
    const url = linkMatch ? linkMatch[1] : "";

    const isExternal = !url.startsWith("/") && !url.includes("houna.org");

    let sourceDomain = "";
    if (url) {
      try {
        sourceDomain = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        sourceDomain = "";
      }
    }

    if (title && url) {
      articles.push({ title, blurb, url, isExternal, sourceDomain, imageUrl });
    }
  }
  return articles;
}

function extractEvents(html: string) {
  const events: Array<{
    title: string;
    date: string;
    description: string;
    status: string;
    slug: string;
    imageUrl: string | null;
    isVirtual: boolean;
  }> = [];

  const cardPattern = /<a href="(https:\/\/houna\.org\/events\/([^"]+))" class="text-decoration-none">([\s\S]*?)<\/a>/g;
  let cardMatch: RegExpExecArray | null;
  while ((cardMatch = cardPattern.exec(html)) !== null) {
    const url = cardMatch[1];
    const slug = cardMatch[2];
    const card = cardMatch[3];

    const imgMatch = card.match(/<img[^>]+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const titleMatch = card.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";

    const dateMatch = card.match(/<div class="grey mb-2 fs-5[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const date = dateMatch ? stripTags(dateMatch[1]) : "";

    const descMatch = card.match(/<div class="light grey mb-2 max-lines">([\s\S]*?)<\/div>/);
    const description = descMatch ? stripTags(descMatch[1]) : "";

    const tagDivs = card.match(/<div class="tags-event[\s\S]*?<\/div>\s*<\/div>/);
    const tags = tagDivs
      ? (tagDivs[0].match(/<div[^>]*text-white[^>]*>([^<]+)<\/div>/g) || []).map(t =>
          t.replace(/<[^>]+>/g, "").trim()
        )
      : [];

    const isEnded = tags.some(t => t.toLowerCase() === "ended");
    const status = isEnded ? "ended" : "upcoming";
    const isVirtual = title.toLowerCase().includes("online") ||
      tags.some(t => t.toLowerCase() === "virtual");

    if (title) {
      events.push({ title, date, description, status, slug, imageUrl, isVirtual });
    }
  }
  return events;
}

function extractEventDetail(html: string) {
  const titleMatch = html.match(/<h4[^>]*class="dark-green bold[^"]*"[^>]*>\s*([\s\S]*?)<\/h4>/);
  const title = titleMatch ? stripTags(titleMatch[1]) : "";

  const dateMatch = html.match(/<div class="grey mb-2 fs-5 bold">([\s\S]*?)<\/div>/);
  const date = dateMatch ? stripTags(dateMatch[1]) : "";

  const descMatch = html.match(/<div class="light grey mb-4">([\s\S]*?)<\/div>\s*<div/);
  // Rendered as markup on the event detail screen, so it must be sanitized here.
  const description = descMatch ? sanitizeHtml(descMatch[1]) : "";

  const imgMatch = html.match(/<img[^>]+src="(https:\/\/houna\.org\/storage\/event\/[^"]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : null;

  const info: Record<string, string> = {};
  const infoRegex = /<label[^>]*class="text-uppercase dark-green bold"[^>]*>([^<]+?):\s*<\/label>([\s\S]*?)<\/div>/g;
  let infoMatch: RegExpExecArray | null;
  while ((infoMatch = infoRegex.exec(html)) !== null) {
    const key = infoMatch[1].trim().toLowerCase();
    const value = stripTags(infoMatch[2]);
    if (value && key !== "free" && !key.includes("seats")) info[key] = value;
  }

  const youtubeEmbeds: string[] = [];
  const ytRegex = /<iframe[^>]+src="(https:\/\/www\.youtube\.com\/embed\/[^"]+)"/g;
  let ytMatch: RegExpExecArray | null;
  while ((ytMatch = ytRegex.exec(html)) !== null) {
    youtubeEmbeds.push(ytMatch[1]);
  }

  return { title, date, description, imageUrl, info, youtubeEmbeds };
}

function extractSpeakers(html: string) {
  const speakers: Array<{
    name: string;
    role: string;
    bio: string;
    slug: string;
    imageUrl: string | null;
  }> = [];

  const cardPattern = /<a href="(https:\/\/houna\.org\/speakers\/([^"]+))" class="text-decoration-none">([\s\S]*?)<\/a>/g;
  let cardMatch: RegExpExecArray | null;
  while ((cardMatch = cardPattern.exec(html)) !== null) {
    const slug = cardMatch[2];
    const card = cardMatch[3];

    const imgMatch = card.match(/<img[^>]+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const nameMatch = card.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
    const name = nameMatch ? stripTags(nameMatch[1]) : "";

    const roleMatch = card.match(/<div class="grey mb-2 fs-5">([\s\S]*?)<\/div>/);
    const role = roleMatch ? stripTags(roleMatch[1]) : "";

    const bioMatch = card.match(/<div class="light grey mb-2[^"]*">([\s\S]*?)<\/div>/);
    const bio = bioMatch ? stripTags(bioMatch[1]) : "";

    if (name) {
      speakers.push({ name, role, bio, slug, imageUrl });
    }
  }
  return speakers;
}

function extractSpeakerDetail(html: string) {
  const titleMatch = html.match(/<h4[^>]*class="dark-green bold[^"]*"[^>]*>\s*([\s\S]*?)<\/h4>/);
  const name = titleMatch ? stripTags(titleMatch[1]) : "";

  const roleMatch = html.match(/<div class="grey mb-2 fs-5">([\s\S]*?)<\/div>/);
  const role = roleMatch ? stripTags(roleMatch[1]) : "";

  const imgMatch = html.match(/<img[^>]+src="(https:\/\/houna\.org\/storage\/speaker\/[^"]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : null;

  const bioMatch = html.match(/<div class="light grey mb-4">([\s\S]*?)<\/div>/);
  const bio = bioMatch ? stripTags(bioMatch[1]) : "";

  const info: Record<string, string> = {};
  const infoRegex = /<label[^>]*class="text-uppercase dark-green bold"[^>]*>([^<]+?):\s*<\/label>([\s\S]*?)<\/div>/g;
  let infoMatch: RegExpExecArray | null;
  while ((infoMatch = infoRegex.exec(html)) !== null) {
    const key = infoMatch[1].trim().toLowerCase();
    const value = stripTags(infoMatch[2]);
    if (value) info[key] = value;
  }

  const socials: { platform: string; url: string }[] = [];
  const socialRegex = /<a\s+href="(https:\/\/(?:www\.)?(?:twitter|facebook|instagram|youtube|linkedin|tiktok)\.com[^"]+)"[^>]*>/g;
  let socialMatch: RegExpExecArray | null;
  const seenSocials = new Set<string>();
  while ((socialMatch = socialRegex.exec(html)) !== null) {
    const url = socialMatch[1];
    if (seenSocials.has(url)) continue;
    seenSocials.add(url);
    let platform = "link";
    if (url.includes("twitter")) platform = "twitter";
    else if (url.includes("facebook")) platform = "facebook";
    else if (url.includes("instagram")) platform = "instagram";
    else if (url.includes("youtube")) platform = "youtube";
    else if (url.includes("linkedin")) platform = "linkedin";
    else if (url.includes("tiktok")) platform = "tiktok";
    if (!url.includes("hounainitiative")) {
      socials.push({ platform, url });
    }
  }

  return { name, role, bio, imageUrl, info, socials };
}

function extractPodcasts(html: string) {
  const podcasts: Array<{
    title: string;
    description: string;
    host: string;
    url: string;
    sourceDomain: string;
    imageUrl: string | null;
  }> = [];

  const parts = html.split('col-sm-3 mb-4');
  for (let i = 1; i < parts.length; i++) {
    const card = parts[i].slice(0, 2000);

    const titleMatch = card.match(/<h5 class="card-title">([\s\S]*?)<\/h5>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";

    const blurbMatch = card.match(/<p class="card-text">([\s\S]*?)<\/p>/);
    const description = blurbMatch ? stripTags(blurbMatch[1]) : "";

    const imgMatch = card.match(/<img[^>]+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const linkMatch = card.match(/<a[^>]+href="([^"]+)"[^>]*class="tag[^"]*"[^>]*>([\s\S]*?)<\/a>/);
    const rawUrl = linkMatch ? linkMatch[1] : "";
    const linkText = linkMatch ? stripTags(linkMatch[2]) : "";

    // Only include podcasts: "Listen" / "أستمع" action = podcast, "Watch" / "شاهد" = webinar
    const linkLower = linkText.toLowerCase();
    if (!linkLower.includes("listen") && !linkText.includes("\u0623\u0633\u062a\u0645\u0639")) continue;

    // Filter out broken links where href is the link text itself
    const url = rawUrl.startsWith("http") ? rawUrl : "";

    let sourceDomain = "";
    if (url) {
      try {
        sourceDomain = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        sourceDomain = "";
      }
    }

    // Extract host/guest from title if present (after "|")
    let host = "";
    const pipeMatch = title.match(/\|\s*(.+)$/);
    if (pipeMatch) host = pipeMatch[1].trim();

    if (title) {
      podcasts.push({ title, description, host, url, sourceDomain, imageUrl });
    }
  }
  return podcasts;
}

function extractAbout(html: string, lang: 'en' | 'ar' = 'en') {
  // Extract the three intro sections — heading text differs by language
  const youAreHounaPatterns = lang === 'ar'
    ? /\u0623\u0646\u062a \u0647\u0646\u0627"<\/h1>\s*<p class="light">\s*([\s\S]*?)\s*<\/p>/
    : /YOU ARE HOUNA"<\/h1>\s*<p class="light">\s*([\s\S]*?)\s*<\/p>/;
  const youAreHounaMatch = html.match(youAreHounaPatterns);
  const youAreHouna = youAreHounaMatch ? stripTags(youAreHounaMatch[1]) : "";

  const visionPattern = lang === 'ar'
    ? /\u0631\u0624\u064a\u062a\u0646\u0627<\/h1>\s*<p class="light grey">([\s\S]*?)<\/p>/
    : /OUR VISION<\/h1>\s*<p class="light grey">([\s\S]*?)<\/p>/;
  const visionMatch = html.match(visionPattern);
  const vision = visionMatch ? stripTags(visionMatch[1]) : "";

  const missionPattern = lang === 'ar'
    ? /\u0645\u0647\u0645\u062a\u0646\u0627<\/h1>\s*<p class="light grey">([\s\S]*?)<\/p>/
    : /OUR MISSION<\/h1>\s*<p class="light grey">([\s\S]*?)<\/p>/;
  const missionMatch = html.match(missionPattern);
  const mission = missionMatch ? stripTags(missionMatch[1]) : "";

  // Extract team members with their section (Founder, Advisor, team)
  const members: Array<{
    name: string;
    role: string;
    bio: string;
    profileId: string;
    imageUrl: string | null;
    section: string;
  }> = [];

  // Find section headings and their positions
  const sectionRegex = /<h1 class=" green text-uppercase bold pb-3">([^<]+)<\/h1>/g;
  const sections: { name: string; pos: number }[] = [];
  let secMatch: RegExpExecArray | null;
  while ((secMatch = sectionRegex.exec(html)) !== null) {
    const rawName = secMatch[1].trim().toLowerCase();
    // Normalize Arabic section names to the English keys the frontend uses
    const sectionName = lang === 'ar'
      ? (rawName.includes('\u0645\u0624\u0633\u0633') ? 'founder'
         : rawName.includes('\u0645\u0633\u062a\u0634\u0627\u0631') ? 'advisor'
         : rawName.includes('\u0641\u0631\u064a\u0642') ? 'team'
         : rawName)
      : rawName;
    sections.push({ name: sectionName, pos: secMatch.index });
  }

  // Split by team card pattern
  const cardSplit = html.split(/<div class="col-lg-3 col-md-4 col-sm-6 col-12/);
  for (let i = 1; i < cardSplit.length; i++) {
    const card = cardSplit[i].slice(0, 1500);
    const cardPos = html.indexOf('<div class="col-lg-3 col-md-4 col-sm-6 col-12' + cardSplit[i]);

    const imgMatch = card.match(/<img[^>]+src="([^"]+)"/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const nameMatch = card.match(/<h5 class="card-title[^"]*">([\s\S]*?)<\/h5>/);
    const name = nameMatch ? stripTags(nameMatch[1]) : "";

    const roleMatch = card.match(/<div class="grey mb-2 fs-6[^"]*">([\s\S]*?)<\/div>/);
    const role = roleMatch ? stripTags(roleMatch[1]) : "";

    const bioMatch = card.match(/<p class="card-text max-lines">([\s\S]*?)<\/p>/);
    const bio = bioMatch ? stripTags(bioMatch[1]) : "";

    const linkMatch = card.match(/href="https:\/\/houna\.org\/profile\/team\/(\d+)"/);
    const profileId = linkMatch ? linkMatch[1] : "";

    // Determine section by position
    let section = "team";
    for (let s = sections.length - 1; s >= 0; s--) {
      if (cardPos >= sections[s].pos) {
        section = sections[s].name;
        break;
      }
    }

    if (name) {
      members.push({ name, role, bio, profileId, imageUrl, section });
    }
  }

  return { youAreHouna, vision, mission, members };
}

function extractProfileDetail(html: string, storagePath: string) {
  const titleMatch = html.match(/<h4[^>]*class="dark-green bold[^"]*"[^>]*>\s*([\s\S]*?)<\/h4>/);
  const name = titleMatch ? stripTags(titleMatch[1]) : "";

  const roleMatch = html.match(/<div class="grey mb-2 fs-5">([\s\S]*?)<\/div>/);
  const role = roleMatch ? stripTags(roleMatch[1]) : "";

  const imgRegex = new RegExp(`<img[^>]+src="(https://houna\\.org/storage/${storagePath}/[^"]+)"`);
  const imgMatch = html.match(imgRegex);
  const imageUrl = imgMatch ? imgMatch[1] : null;

  const bioMatch = html.match(/<div class="light grey mb-4">([\s\S]*?)<\/div>/);
  const bio = bioMatch ? stripTags(bioMatch[1]) : "";

  const info: Record<string, string> = {};
  const infoRegex = /<label[^>]*class="text-uppercase dark-green bold"[^>]*>([^<]+?):\s*<\/label>([\s\S]*?)<\/div>/g;
  let infoMatch: RegExpExecArray | null;
  while ((infoMatch = infoRegex.exec(html)) !== null) {
    const key = infoMatch[1].trim().toLowerCase();
    const value = stripTags(infoMatch[2]);
    if (value) info[key] = value;
  }

  const socials: { platform: string; url: string }[] = [];
  const socialRegex = /<a\s+href="(https:\/\/(?:www\.)?(?:twitter|facebook|instagram|youtube|linkedin|tiktok)\.com[^"]+)"[^>]*>/g;
  let socialMatch: RegExpExecArray | null;
  const seenSocials = new Set<string>();
  while ((socialMatch = socialRegex.exec(html)) !== null) {
    const url = socialMatch[1];
    if (seenSocials.has(url)) continue;
    seenSocials.add(url);
    let platform = "link";
    if (url.includes("twitter")) platform = "twitter";
    else if (url.includes("facebook")) platform = "facebook";
    else if (url.includes("instagram")) platform = "instagram";
    else if (url.includes("youtube")) platform = "youtube";
    else if (url.includes("linkedin")) platform = "linkedin";
    else if (url.includes("tiktok")) platform = "tiktok";
    if (!url.includes("hounainitiative")) {
      socials.push({ platform, url });
    }
  }

  return { name, role, bio, imageUrl, info, socials };
}

function extractLastPage(html: string, currentPage: number, lang: 'en' | 'ar' = 'en'): number {
  const langPrefix = lang === 'ar' ? 'ar' : 'en';
  // Try multiple patterns the site may use for pagination links
  const patterns = [
    new RegExp(`href="https:\/\/houna\.org\/${langPrefix}\/therapists\?page=(\d+)"`, 'g'),
    new RegExp(`href="\/${langPrefix}\/therapists\?page=(\d+)"`, 'g'),
    /href="https:\/\/houna\.org\/therapists\?page=(\d+)"/g,
    /href="\/therapists\?page=(\d+)"/g,
  ];
  const allPages: number[] = [];
  for (const pattern of patterns) {
    let m: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(html)) !== null) {
      allPages.push(parseInt(m[1], 10));
    }
  }
  if (allPages.length > 0) {
    return Math.max(...allPages);
  }

  // Fallback: check for a "Next" button/link — if present, there is at least
  // one more page after the current one. Increment by 1 as a conservative estimate.
  // The frontend will keep loading until a page returns zero results.
  const hasNextButton = /<a[^>]*rel="next"[^>]*>/i.test(html)
    || /aria-label="Next[^"]*"/i.test(html)
    || /class="[^"]*page-link[^"]*"[^>]*>\s*&rsaquo;/i.test(html);
  if (hasNextButton) {
    return currentPage + 1;
  }

  return 1;
}

function extractFilters(html: string) {
  const countries: Array<{ value: string; label: string }> = [];
  const countryRegex = /<select[^>]*name="country"[^>]*>([\s\S]*?)<\/select>/;
  const countryMatch = html.match(countryRegex);
  if (countryMatch) {
    const optionRegex = /<option value="(\d+)"\s*>([^<]+)<\/option>/g;
    let optMatch: RegExpExecArray | null;
    while ((optMatch = optionRegex.exec(countryMatch[1])) !== null) {
      countries.push({ value: optMatch[1], label: optMatch[2].trim() });
    }
  }
  return { countries };
}

function extractTherapistDetail(html: string) {
  const imgMatch = html.match(/<img[^>]+src="(https:\/\/houna\.org\/storage\/therapist\/[^"]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : null;

  const nameMatch = html.match(/<h4[^>]*class="dark-green bold mb-0"[^>]*>([\s\S]*?)<\/h4>/);
  const name = nameMatch ? stripTags(nameMatch[1]) : "";

  const roleMatch = html.match(/<div class="grey mb-2 fs-5">([\s\S]*?)<\/div>/);
  const role = roleMatch ? stripTags(roleMatch[1]) : "";

  const summaryMatch = html.match(/<div class="light grey mb-4">([\s\S]*?)<\/div>/);
  const summary = summaryMatch ? stripTags(summaryMatch[1]) : "";

  // Extract info fields (location, languages, organizations, work with)
  const info: Record<string, string> = {};
  const infoRegex = /<div class="green pb-2"><label[^>]*class="text-uppercase dark-green bold">([^:]+):\s*<\/label>([\s\S]*?)<\/div>/g;
  let infoMatch: RegExpExecArray | null;
  while ((infoMatch = infoRegex.exec(html)) !== null) {
    const key = infoMatch[1].trim().toLowerCase();
    const value = stripTags(infoMatch[2]);
    if (value) info[key] = value;
  }

  // Extract full profile bio
  const profileMatch = html.match(/<div class="tab-pane fade show active" id="profile"[\s\S]*?>([\s\S]*?)<\/div>/);
  const fullBio = profileMatch ? stripTags(profileMatch[1]) : summary;

  // Extract specialties
  const specialtiesMatch = html.match(/<div class="tab-pane fade" id="specialties"[\s\S]*?>([\s\S]*?)<\/div>/);
  const specialties = specialtiesMatch ? stripTags(specialtiesMatch[1]) : null;

  // Extract contact info
  const contacts: { type: string; value: string; href: string }[] = [];
  const contactRegex = /<a\s+href="([^"]+)"[^>]*data-hover="([^"]*)"[^>]*class="[^"]*btn-green[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let contactMatch: RegExpExecArray | null;
  while ((contactMatch = contactRegex.exec(html)) !== null) {
    const href = contactMatch[1];
    const dataHover = contactMatch[2];
    const label = stripTags(contactMatch[3]).toLowerCase();
    if (label.includes("call") || href.startsWith("tel:")) {
      contacts.push({ type: "phone", value: dataHover || href.replace("tel:", ""), href });
    } else if (label.includes("email") || href.includes("email-protection")) {
      contacts.push({ type: "email", value: dataHover, href });
    }
  }

  // Extract social links
  const socials: { platform: string; url: string }[] = [];
  const socialRegex = /<a\s+href="(https:\/\/(?:www\.)?(?:twitter|facebook|instagram|youtube|linkedin|tiktok)\.com[^"]+)"[^>]*>/g;
  let socialMatch: RegExpExecArray | null;
  while ((socialMatch = socialRegex.exec(html)) !== null) {
    const url = socialMatch[1];
    let platform = "link";
    if (url.includes("twitter")) platform = "twitter";
    else if (url.includes("facebook")) platform = "facebook";
    else if (url.includes("instagram")) platform = "instagram";
    else if (url.includes("youtube")) platform = "youtube";
    else if (url.includes("linkedin")) platform = "linkedin";
    else if (url.includes("tiktok")) platform = "tiktok";
    socials.push({ platform, url });
  }

  // Extract organization link if present
  const orgMatch = html.match(/href='(https:\/\/houna\.org\/organizations\/\d+)'[^>]*>([^<]+)<\/a>/);
  const organization = orgMatch ? { url: orgMatch[1], name: stripTags(orgMatch[2]) } : null;

  return { name, role, summary, fullBio, specialties, imageUrl, info, contacts, socials, organization };
}

function extractOrgDetail(html: string) {
  const imgMatch = html.match(/<img[^>]+src="(https:\/\/houna\.org\/storage\/organizations\/[^"]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : null;

  const nameMatch = html.match(/<h4[^>]*class="dark-green bold[^"]*"[^>]*>\s*([\s\S]*?)<\/h4>/);
  const name = nameMatch ? stripTags(nameMatch[1]) : "";

  const summaryMatch = html.match(/<div class="light grey mb-4">([\s\S]*?)<\/div>/);
  const summary = summaryMatch ? stripTags(summaryMatch[1]) : "";

  // Extract info fields
  const info: Record<string, string> = {};
  const infoRegex = /<div class="green pb-2[^"]*"><label[^>]*class="text-uppercase dark-green bold">([^:]+):\s*<\/label>([\s\S]*?)<\/div>/g;
  let infoMatch: RegExpExecArray | null;
  while ((infoMatch = infoRegex.exec(html)) !== null) {
    const key = infoMatch[1].trim().toLowerCase();
    let value = stripTags(infoMatch[2]);
    if (key === "website") {
      const linkMatch = infoMatch[2].match(/<a[^>]+href="([^"]+)"/);
      value = linkMatch ? linkMatch[1] : value;
    }
    if (value) info[key] = value;
  }

  // Extract full profile
  const profileMatch = html.match(/id="profile"[^>]*>([\s\S]*?)<\/div>\s*<h4[^>]*class="dark-green bold[^"]*"/);
  const fullBio = profileMatch ? stripTags(profileMatch[1]) : summary;

  // Extract contact info (same as therapist)
  const contacts: { type: string; value: string; href: string }[] = [];
  const contactRegex = /<a\s+href="([^"]+)"[^>]*data-hover="([^"]*)"[^>]*class="[^"]*btn-green[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let contactMatch: RegExpExecArray | null;
  while ((contactMatch = contactRegex.exec(html)) !== null) {
    const href = contactMatch[1];
    const dataHover = contactMatch[2];
    const label = stripTags(contactMatch[3]).toLowerCase();
    if (label.includes("call") || href.startsWith("tel:")) {
      contacts.push({ type: "phone", value: dataHover || href.replace("tel:", ""), href });
    } else if (label.includes("email") || href.includes("email-protection")) {
      contacts.push({ type: "email", value: dataHover, href });
    }
  }

  // Extract social links
  const socials: { platform: string; url: string }[] = [];
  const socialRegex = /<a\s+href="(https:\/\/(?:www\.)?(?:twitter|facebook|instagram|youtube|linkedin|tiktok)\.com[^"]+)"[^>]*>/g;
  let socialMatch: RegExpExecArray | null;
  while ((socialMatch = socialRegex.exec(html)) !== null) {
    const url = socialMatch[1];
    let platform = "link";
    if (url.includes("twitter")) platform = "twitter";
    else if (url.includes("facebook")) platform = "facebook";
    else if (url.includes("instagram")) platform = "instagram";
    else if (url.includes("youtube")) platform = "youtube";
    else if (url.includes("linkedin")) platform = "linkedin";
    socials.push({ platform, url });
  }

  // Extract website link from info section
  const websiteMatch = html.match(/<a[^>]+href="(https?:\/\/(?!houna\.org|\/cdn-cgi)[^"]+)"[^>]*target="_blank"/);
  const website = websiteMatch ? websiteMatch[1] : null;

  // Extract roster of therapists
  const roster: Array<{
    name: string; role: string; summary: string;
    profileUrl: string; slug: string; imageUrl: string | null;
  }> = [];
  const rosterRegex = /<div class="col-sm-4 mb-5">([\s\S]*?)<\/div>\s*(?=<div class="col-sm-4 mb-5">|<\/div>\s*<\/div>\s*<\/section>)/g;
  let rosterMatch: RegExpExecArray | null;
  while ((rosterMatch = rosterRegex.exec(html)) !== null) {
    const block = rosterMatch[1];
    const imgM = block.match(/<img[^>]+src="([^"]+)"/);
    const nameM = block.match(/<h4[^>]*class="dark-green bold mt-4"[^>]*>([\s\S]*?)<\/h4>/);
    const roleM = block.match(/<div class="grey mb-2 fs-5">([\s\S]*?)<\/div>/);
    const summaryM = block.match(/<div class="light grey mb-2">([\s\S]*?)<\/div>/);
    const linkM = block.match(/<a\s+href="(https:\/\/houna\.org\/(?:ar\/)?therapists\/[^"]+)"/);
    if (nameM && linkM) {
      roster.push({
        name: stripTags(nameM[1]),
        role: roleM ? stripTags(roleM[1]) : "",
        summary: summaryM ? stripTags(summaryM[1]) : "",
        profileUrl: linkM[1],
        slug: linkM[1].split("/therapists/")[1]?.split(/[?#]/)[0] || "",
        imageUrl: imgM ? imgM[1] : null,
      });
    }
  }

  return { name, summary, fullBio, imageUrl, info, contacts, socials, website, roster };
}

function extractResources(html: string, lang: 'en' | 'ar' = 'en') {
  const bannerMatch = html.match(/<section class="banner">\s*<img[^>]+src="([^"]+)"/);
  const bannerImage = bannerMatch ? bannerMatch[1] : "https://houna.org/storage/articles/1780495395converted_image.png";

  const headingEn = html.match(/MENTAL HEALTH IS NOT A DESTINATION BUT A JOURNEY/i);
  const headingAr = html.match(/الصحة النفسية ليست[\s\S]*?رحلة/i);
  const heading = lang === 'ar'
    ? (headingAr ? stripTags(headingAr[0]) : "")
    : (headingEn ? "MENTAL HEALTH IS NOT A DESTINATION BUT A JOURNEY" : "");

  const topics: Array<{
    title: string;
    description: string;
    slug: string;
    url: string;
  }> = [];

  const cardRegex = /<a[^>]+href="(https:\/\/houna\.org\/(?:ar\/)?resources\/[^"]+)"[^>]*class="text-center[^"]*mh-item[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(html)) !== null) {
    const url = match[1];
    const cardHtml = match[2];
    const slug = url.split("/resources/")[1]?.split(/[?#]/)[0] || "";

    const titleMatch = cardHtml.match(/<h4[^>]*>([\s\S]*?)<\/h4>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";

    const descMatch = cardHtml.match(/<div class="light grey mb-2">([\s\S]*?)<\/div>/);
    const description = descMatch ? stripTags(descMatch[1]) : "";

    if (title) {
      topics.push({ title, description, slug, url });
    }
  }

  // Extract "Important Articles" section — heading differs by language
  const headingPattern = lang === 'ar'
    ? /مقالات هامة[\s\S]*?<div class="row">([\s\S]*?)<\/div>\s*<\/section>/
    : /Important Articles[\s\S]*?<div class="row">([\s\S]*?)<\/div>\s*<\/section>/;
  const articlesSectionMatch = html.match(headingPattern);
  const importantArticles: Array<{
    title: string;
    blurb: string;
    url: string;
    imageUrl: string | null;
    sourceDomain: string;
  }> = [];

  if (articlesSectionMatch) {
    const section = articlesSectionMatch[1];
    const articleCardRegex = /<a[^>]+target="_blank"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    let artMatch: RegExpExecArray | null;
    while ((artMatch = articleCardRegex.exec(section)) !== null) {
      const url = artMatch[1];
      const card = artMatch[2];

      const imgMatch = card.match(/<img[^>]+src="([^"]+)"/);
      const imageUrl = imgMatch ? imgMatch[1] : null;

      const titleMatch = card.match(/<h5 class="card-title">([\s\S]*?)<\/h5>/);
      const title = titleMatch ? stripTags(titleMatch[1]) : "";

      const blurbMatch = card.match(/<p class="card-text">([\s\S]*?)<\/p>/);
      const blurb = blurbMatch ? stripTags(blurbMatch[1]) : "";

      let sourceDomain = "";
      try {
        sourceDomain = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        sourceDomain = "";
      }

      if (title && url) {
        importantArticles.push({ title, blurb, url, imageUrl, sourceDomain });
      }
    }
  }

  return { bannerImage, heading, topics, importantArticles };
}

function extractResourceDetail(html: string) {
  // Extract breadcrumb topic name (last breadcrumb item)
  const breadcrumbMatch = html.match(/<li class="breadcrumb-item[^"]*"\s*aria-current="page">([\s\S]*?)<\/li>/);
  const title = breadcrumbMatch ? stripTags(breadcrumbMatch[1]) : "";

  // Extract all tab sections dynamically
  const sections: Array<{
    id: string;
    label: string;
    heading: string;
    content: string;
  }> = [];

  // Get section labels from sidebar
  const labelRegex = /<a[^>]*id="([^"]+)-tab"[^>]*class="[^"]*subnav-item[^"]*text-uppercase[^"]*"[^>]*>\s*([^<]+?)\s*<\/a>/g;
  const labels: Record<string, string> = {};
  let labelMatch: RegExpExecArray | null;
  while ((labelMatch = labelRegex.exec(html)) !== null) {
    labels[labelMatch[1]] = labelMatch[2].trim();
  }

  // Get section content panels
  const panelRegex = /<div class="py-4" id="([^"]+)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="py-4" id=|<\/div>\s*<\/div>\s*<\/section>)/g;
  let panelMatch: RegExpExecArray | null;
  while ((panelMatch = panelRegex.exec(html)) !== null) {
    const id = panelMatch[1];
    const rawContent = panelMatch[2];

    const headingMatch = rawContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const heading = headingMatch ? stripTags(headingMatch[1]) : labels[id] || id;

    // Strip the leading <h1> from content so it doesn't duplicate the heading shown above
    const contentWithoutH1 = rawContent.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/, "");
    const content = sanitizeHtml(contentWithoutH1);

    if (content) {
      sections.push({
        id,
        label: labels[id] || id,
        heading,
        content,
      });
    }
  }

  return { title, sections };
}

function extractCardList(html: string, imagePathPrefix: string) {
  const items: Array<{
    title: string;
    description: string;
    imageUrl: string | null;
    url: string | null;
  }> = [];

  const cardRegex = /<div class=" col-sm-4 mb-4">([\s\S]*?)(?=<div class=" col-sm-4 mb-4">|<div class="row my-3">\s*<\/div>)/g;
  let match: RegExpExecArray | null;
  while ((match = cardRegex.exec(html)) !== null) {
    const card = match[1];

    const imgMatch = card.match(/<img[^>]+src="([^"]+)"[^>]*card-img-top/);
    const imageUrl = imgMatch ? imgMatch[1] : null;

    const titleMatch = card.match(/<h5 class="card-title">([\s\S]*?)<\/h5>/);
    const title = titleMatch ? stripTags(titleMatch[1]) : "";

    const descMatch = card.match(/<p class="card-text">([\s\S]*?)<\/p>/);
    const description = descMatch ? stripTags(descMatch[1]) : "";

    const linkMatch = card.match(/<a[^>]+href="([^"]+)"[^>]*>/);
    const url = linkMatch ? linkMatch[1] : null;

    if (title) {
      items.push({ title, description, imageUrl, url });
    }
  }

  return items;
}

async function fetchCached(key: string, fetcher: () => Promise<Response>): Promise<{ data: unknown; fromCache: boolean }> {
  const { data: cached } = await supabase
    .from("houna_cache")
    .select("data, expires_at")
    .eq("cache_key", key)
    .maybeSingle();

  if (cached && new Date(cached.expires_at) > new Date()) {
    return { data: cached.data, fromCache: true };
  }

  const response = await fetcher();
  if (!response.ok) {
    if (cached) return { data: cached.data, fromCache: true };
    throw new Error(`Upstream returned ${response.status}`);
  }
  const data = await response.json();

  await supabase.from("houna_cache").upsert({
    cache_key: key,
    data,
    expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString(),
  });

  return { data, fromCache: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/houna-proxy/, "");
    const params = url.searchParams;

    // Route: /therapists?page=N&availability=X&profession=Y&country=Z&sort=S&lang=en|ar
    if (path === "/therapists") {
      const page = params.get("page") || "1";
      const availability = params.get("availability") || "";
      const profession = params.get("profession") || "";
      const country = params.get("country") || "";
      const sort = params.get("sort") || "name-ASC";
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";

      const cacheKey = `therapists:${lang}:${page}:${availability}:${profession}:${country}:${sort}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const fetchUrl = new URL(`https://houna.org${langPrefix}/therapists`);
        fetchUrl.searchParams.set("page", page);
        if (availability) fetchUrl.searchParams.set("availability", availability);
        if (profession) fetchUrl.searchParams.set("profession", profession);
        if (country) fetchUrl.searchParams.set("country", country);
        if (sort) fetchUrl.searchParams.set("sort", sort);

        const resp = await fetch(fetchUrl.toString(), { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch therapists: ${resp.status}`);
        const html = await resp.text();

        const therapists = extractTherapists(html);
        const lastPage = extractLastPage(html, parseInt(page, 10), lang);
        const { countries } = extractFilters(html);

        return new Response(JSON.stringify({
          therapists,
          currentPage: parseInt(page, 10),
          lastPage,
          countries,
        }), { headers: { "Content-Type": "application/json" } });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /therapists/:slug — detail
    const therapistMatch = path.match(/^\/therapists\/([^/]+)$/);
    if (therapistMatch) {
      const slug = therapistMatch[1];
      if (!isValidSlug(slug)) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `therapist_detail:${lang}:${slug}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "";
        const resp = await fetch(`https://houna.org${langPrefix}/therapists/${slug}`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch therapist detail: ${resp.status}`);
        const html = await resp.text();
        const detail = extractTherapistDetail(html);
        return new Response(JSON.stringify(detail), { headers: { "Content-Type": "application/json" } });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /organizations — list (scraped from therapists page, clinic tab)
    if (path === "/organizations") {
      const page = params.get("page") || "1";
      const country = params.get("country") || "";
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `organizations:${lang}:${page}:${country}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const fetchUrl = new URL(`https://houna.org${langPrefix}/therapists`);
        fetchUrl.searchParams.set("page", page);
        if (country) fetchUrl.searchParams.set("organization_country", country);

        const resp = await fetch(fetchUrl.toString(), { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch organizations: ${resp.status}`);
        const html = await resp.text();

        // Extract the organizations section (id="clinic" tab)
        const clinicMatch = html.match(/<div class="tab-pane fade[^"]*" id="clinic"[\s\S]*?<div class="row py-5 bg-white[^"]*">([\s\S]*?)<\/div>\s*<\/div>/);
        const orgHtml = clinicMatch ? clinicMatch[1] : html;
        const orgs = extractOrganizations(orgHtml);

        // Orgs don't have pagination — all on one page
        return new Response(JSON.stringify({
          organizations: orgs,
          currentPage: 1,
          lastPage: 1,
        }), { headers: { "Content-Type": "application/json" } });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /organizations/:id — detail
    const orgMatch = path.match(/^\/organizations\/(\d+)$/);
    if (orgMatch) {
      const id = orgMatch[1];
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `org_detail:${lang}:${id}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "";
        const resp = await fetch(`https://houna.org${langPrefix}/organizations/${id}`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch organization detail: ${resp.status}`);
        const html = await resp.text();
        const detail = extractOrgDetail(html);
        return new Response(JSON.stringify(detail), { headers: { "Content-Type": "application/json" } });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /wellness-centers?country=Z
    if (path === "/wellness-centers") {
      const country = params.get("country") || "";
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `wellness_centers:${lang}:${country}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const fetchUrl = new URL(`https://houna.org${langPrefix}/wellness-center`);
        if (country) fetchUrl.searchParams.set("country", country);

        const resp = await fetch(fetchUrl.toString(), { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch wellness centers: ${resp.status}`);
        const html = await resp.text();

        const centers = extractWellnessCenters(html);
        const countries = extractWellnessCenterCountries(html);

        return new Response(JSON.stringify({
          centers,
          countries,
        }), { headers: { "Content-Type": "application/json" } });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /wellness-centers/:id — detail
    const wellnessMatch = path.match(/^\/wellness-centers\/(\d+)$/);
    if (wellnessMatch) {
      const id = wellnessMatch[1];
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `wellness_center_detail:${lang}:${id}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/wellness-center/${id}`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch wellness center detail: ${resp.status}`);
        const html = await resp.text();
        const detail = extractWellnessCenterDetail(html);
        return new Response(JSON.stringify(detail), { headers: { "Content-Type": "application/json" } });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /articles
    if (path === "/articles") {
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `articles:${lang}:all`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/articles`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch articles: ${resp.status}`);
        const html = await resp.text();
        const articles = extractArticles(html);
        return new Response(JSON.stringify({ articles }), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /events
    if (path === "/events") {
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `events:${lang}:all`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/events`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch events: ${resp.status}`);
        const html = await resp.text();
        const events = extractEvents(html);
        return new Response(JSON.stringify({ events }), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /events/:slug — detail
    const eventMatch = path.match(/^\/events\/([^/]+)$/);
    if (eventMatch) {
      const slug = eventMatch[1];
      if (!isValidSlug(slug)) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `event_detail:${lang}:${slug}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/events/${slug}`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch event detail: ${resp.status}`);
        const html = await resp.text();
        const detail = extractEventDetail(html);
        return new Response(JSON.stringify(detail), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /speakers
    if (path === "/speakers") {
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `speakers:${lang}:all`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/speakers`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch speakers: ${resp.status}`);
        const html = await resp.text();
        const speakers = extractSpeakers(html);
        return new Response(JSON.stringify({ speakers }), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /speakers/:slug — detail
    const speakerMatch = path.match(/^\/speakers\/([^/]+)$/);
    if (speakerMatch) {
      const slug = speakerMatch[1];
      if (!isValidSlug(slug)) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `speaker_detail:${lang}:${slug}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/speakers/${slug}`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch speaker detail: ${resp.status}`);
        const html = await resp.text();
        const detail = extractSpeakerDetail(html);
        return new Response(JSON.stringify(detail), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /podcasts
    if (path === "/podcasts") {
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `podcasts:${lang}:all`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/podcasts-webinars`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch podcasts: ${resp.status}`);
        const html = await resp.text();
        const podcasts = extractPodcasts(html);
        return new Response(JSON.stringify({ podcasts }), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /about
    if (path === "/about") {
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `about:${lang}:all`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/about`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch about: ${resp.status}`);
        const html = await resp.text();
        const about = extractAbout(html, lang);
        return new Response(JSON.stringify(about), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route: /profile/team/:id — team member detail
    const teamMatch = path.match(/^\/profile\/team\/(\d+)$/);
    if (teamMatch) {
      const id = teamMatch[1];
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `team_detail:${lang}:${id}`;

      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/profile/team/${id}`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch team member: ${resp.status}`);
        const html = await resp.text();
        const detail = extractProfileDetail(html, "team");
        return new Response(JSON.stringify(detail), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/resources") {
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `resources:${lang}:list`;
      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/resources`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch resources: ${resp.status}`);
        const html = await resp.text();
        const data = extractResources(html, lang);
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path.startsWith("/resources/")) {
      const slug = path.replace("/resources/", "");
      const lang = params.get("lang") === "ar" ? "ar" : "en" as "en" | "ar";
      const cacheKey = `resource_detail:${lang}:${slug}`;
      const result = await fetchCached(cacheKey, async () => {
        const langPrefix = lang === "ar" ? "/ar" : "/en";
        const resp = await fetch(`https://houna.org${langPrefix}/resources/${slug}`, { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch resource: ${resp.status}`);
        const html = await resp.text();
        const data = extractResourceDetail(html);
        return new Response(JSON.stringify(data), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/real-stories") {
      const result = await fetchCached("real_stories:all", async () => {
        const resp = await fetch("https://houna.org/en/real-stories", { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch real stories: ${resp.status}`);
        const html = await resp.text();
        const stories = extractCardList(html, "articles");
        return new Response(JSON.stringify({ stories }), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/support-groups") {
      const result = await fetchCached("support_groups:all", async () => {
        const resp = await fetch("https://houna.org/en/support-groups", { headers: BROWSER_HEADERS });
        if (!resp.ok) throw new Error(`Failed to fetch support groups: ${resp.status}`);
        const html = await resp.text();
        const groups = extractCardList(html, "supportGroup");
        return new Response(JSON.stringify({ groups }), {
          headers: { "Content-Type": "application/json" },
        });
      });

      return new Response(JSON.stringify(result.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    // Log the detail server-side; never return internal error text to the caller,
    // which would leak upstream URLs, status codes and database error detail.
    console.error("houna-proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Unable to load this content right now." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
