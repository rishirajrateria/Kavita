/**
 * Small HTML extractor for the SEO health crawler (Phase 6, P6-D). No DOM library: the checks
 * only need the `<head>` metadata, heading counts, link and image attributes, JSON-LD blocks
 * and a word count, all of which regex tokenising handles reliably on server-rendered HTML.
 * Pure — no I/O, no Next imports — so it is unit-tested on fixture strings.
 */
import { extractCanonical, extractDescription, extractMain } from "@/lib/markdown/html-to-markdown";
import { normalisePath } from "@/lib/routes";
import type { ParsedPage } from "./types";

const TAG_ATTR = (name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");

/** Value of one attribute of a tag's opening markup, entity-decoded; `null` when absent. */
export function attrValue(tag: string, name: string): string | null {
  const match = TAG_ATTR(name).exec(tag);
  if (!match) return null;
  return decodeEntities(match[2] ?? match[3] ?? match[4] ?? "");
}

export function hasAttr(tag: string, name: string): boolean {
  return new RegExp(`\\s${name}(\\s|=|>|/)`, "i").test(tag.replace(/\/?>$/, " >"));
}

export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&nbsp;", " ");
}

const BLOCK_STRIP = /<(script|style|noscript|template|svg|header|footer|nav)\b[\s\S]*?<\/\1\s*>/gi;

/** Visible text of an HTML fragment with chrome removed and whitespace collapsed. */
export function visibleText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(BLOCK_STRIP, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(text: string): number {
  return text ? text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
}

const STATIC_EXT =
  /\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|pdf|ics|xml|txt|md|json|woff2?|ttf|mp4|webm|mp3|zip)$/i;
const SKIP_PREFIXES = ["/admin", "/api", "/_next", "/booking/", "/design-system"];

/** Paths the crawler never fetches as pages: admin, APIs, build assets, files and token pages. */
export function isCrawlablePath(path: string): boolean {
  if (SKIP_PREFIXES.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p))) return false;
  return !STATIC_EXT.test(path);
}

/**
 * Resolve an `href` against the page and keep only same-origin page paths. Query strings and
 * fragments are dropped so `/faq?q=x` and `/faq#top` count as `/faq`.
 */
export function resolveInternalHref(href: string, origin: string, fromPath: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || /^(#|mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(trimmed)) return null;
  let url: URL;
  try {
    url = new URL(trimmed, `${origin}${fromPath}`);
  } catch {
    return null;
  }
  if (url.origin !== new URL(origin).origin) return null;
  return normalisePath(decodeURI(url.pathname));
}

function robotsNoindex(html: string): boolean {
  const re = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const name = attrValue(m[0], "name")?.toLowerCase();
    if (name !== "robots" && name !== "googlebot") continue;
    const content = attrValue(m[0], "content")?.toLowerCase() ?? "";
    if (/\bnoindex\b/.test(content)) return true;
  }
  return false;
}

function jsonLdTypes(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    for (const v of value) jsonLdTypes(v, out);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  const type = record["@type"];
  if (typeof type === "string") out.push(type);
  else if (Array.isArray(type)) for (const t of type) if (typeof t === "string") out.push(t);
  if (record["@graph"]) jsonLdTypes(record["@graph"], out);
}

/** Text of the first `<h1>`, tags stripped. */
function firstH1(html: string): string | null {
  const m = /<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i.exec(html);
  return m ? visibleText(m[1] ?? "") || null : null;
}

/** Extract everything the checks need from one rendered document. */
export function parsePage(html: string, origin: string, path: string): ParsedPage {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html)?.[1] ?? html;
  const titleRaw = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(head)?.[1];
  const title = titleRaw ? visibleText(titleRaw) || null : null;
  const description = extractDescription(head) ?? null;
  const canonical = extractCanonical(head) ?? null;

  const bodyNoTemplates = html.replace(/<(script|template|noscript)\b[\s\S]*?<\/\1\s*>/gi, " ");
  const h1Count = (bodyNoTemplates.match(/<h1\b[^>]*>/gi) ?? []).length;

  const links = new Set<string>();
  const anchorRe = /<a\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(bodyNoTemplates)) !== null) {
    const href = attrValue(m[0], "href");
    if (!href) continue;
    const resolved = resolveInternalHref(href, origin, path);
    if (resolved) links.add(resolved);
  }

  let imagesWithoutAlt = 0;
  const imgRe = /<img\b[^>]*>/gi;
  while ((m = imgRe.exec(bodyNoTemplates)) !== null) {
    const tag = m[0];
    if (hasAttr(tag, "alt")) continue;
    if (/\brole\s*=\s*["']?(presentation|none)/i.test(tag)) continue;
    if (/\baria-hidden\s*=\s*["']?true/i.test(tag)) continue;
    imagesWithoutAlt += 1;
  }

  const types: string[] = [];
  let jsonLdInvalid = 0;
  const ldRe =
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi;
  while ((m = ldRe.exec(html)) !== null) {
    const raw = (m[1] ?? "").trim();
    if (!raw) continue;
    try {
      jsonLdTypes(JSON.parse(raw), types);
    } catch {
      jsonLdInvalid += 1;
    }
  }

  return {
    title,
    description,
    canonical,
    noindex: robotsNoindex(head),
    h1Count,
    h1: firstH1(bodyNoTemplates),
    links: [...links],
    imagesWithoutAlt,
    jsonLdTypes: [...new Set(types)],
    jsonLdInvalid,
    words: countWords(visibleText(extractMain(html))),
  };
}

/** `<loc>` values of a sitemap or sitemap index. */
export function parseSitemapLocs(xml: string): string[] {
  const out: string[] = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) out.push(decodeEntities(m[1] ?? ""));
  return out;
}
