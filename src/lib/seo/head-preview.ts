/**
 * "Exact rendered `<head>`" preview for the SEO editor (Phase 6 P6-A). Fetches the page from
 * the site's own origin with the mirror header (never recursive, never cached across
 * deploys) and returns the parsed head tags plus the raw HTML for citability scoring.
 * Pure parsing is exported separately so it can be unit-tested on fixture HTML.
 */
import { MIRROR_HEADER } from "@/lib/markdown/fetch-page";
import { parseAttributes } from "./sanitize-head";

export interface HeadEntry {
  tag: "title" | "meta" | "link" | "script" | "other";
  attrs: Record<string, string>;
  /** Text content for `<title>` and JSON-LD scripts. */
  text?: string;
}

export interface HeadSummary {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  hreflang: Record<string, string>;
  jsonLdTypes: string[];
}

export interface HeadPreview {
  status: number;
  entries: HeadEntry[];
  summary: HeadSummary;
  html: string;
}

const HEAD_TOKEN_RE =
  /<title\b[^>]*>([\s\S]*?)<\/title\s*>|<script\b([^>]*)>([\s\S]*?)<\/script\s*>|<(meta|link|base)\b([^>]*?)\/?>/gi;

/** Entity decoder for head text: the named entities Next emits plus numeric references. */
function decode(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function jsonLdTypes(json: unknown, into: string[]): void {
  if (Array.isArray(json)) {
    for (const item of json) jsonLdTypes(item, into);
    return;
  }
  if (!json || typeof json !== "object") return;
  const obj = json as Record<string, unknown>;
  const type = obj["@type"];
  if (typeof type === "string") into.push(type);
  else if (Array.isArray(type)) for (const t of type) if (typeof t === "string") into.push(t);
  if (Array.isArray(obj["@graph"])) jsonLdTypes(obj["@graph"], into);
}

/** Parse `<head>` out of a full document into entries and a summary. */
export function parseHead(html: string): { entries: HeadEntry[]; summary: HeadSummary } {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(html)?.[1] ?? html;
  const entries: HeadEntry[] = [];
  const summary: HeadSummary = { hreflang: {}, jsonLdTypes: [] };
  const warnings: string[] = [];

  for (const m of head.matchAll(HEAD_TOKEN_RE)) {
    const [, titleText, scriptAttrs, scriptBody, simpleTag, simpleAttrs] = m;
    if (titleText !== undefined) {
      const text = decode(titleText);
      entries.push({ tag: "title", attrs: {}, text });
      summary.title ??= text;
      continue;
    }
    if (scriptAttrs !== undefined) {
      const attrs = parseAttributes(scriptAttrs, warnings, "script");
      if ((attrs.type ?? "").toLowerCase() === "application/ld+json") {
        entries.push({ tag: "script", attrs, text: (scriptBody ?? "").trim() });
        try {
          jsonLdTypes(JSON.parse(scriptBody ?? ""), summary.jsonLdTypes);
        } catch {
          /* unparsable JSON-LD is still listed */
        }
      }
      continue;
    }
    if (simpleTag === undefined) continue;
    const tag = simpleTag.toLowerCase();
    const attrs = parseAttributes(simpleAttrs ?? "", warnings, tag);
    if (tag === "base") {
      entries.push({ tag: "other", attrs: { ...attrs, tag: "base" } });
      continue;
    }
    entries.push({ tag: tag as "meta" | "link", attrs });
    if (tag === "meta") {
      const name = (attrs.name ?? "").toLowerCase();
      const property = (attrs.property ?? "").toLowerCase();
      const content = decode(attrs.content ?? "");
      if (name === "description") summary.description ??= content;
      else if (name === "robots") summary.robots ??= content;
      else if (property === "og:title") summary.ogTitle ??= content;
      else if (property === "og:description") summary.ogDescription ??= content;
      else if (property === "og:image") summary.ogImage ??= content;
      else if (property === "og:type") summary.ogType ??= content;
      else if (name === "twitter:card" || property === "twitter:card")
        summary.twitterCard ??= content;
      else if (name === "twitter:title" || property === "twitter:title")
        summary.twitterTitle ??= content;
      else if (name === "twitter:description" || property === "twitter:description") {
        summary.twitterDescription ??= content;
      } else if (name === "twitter:image" || property === "twitter:image")
        summary.twitterImage ??= content;
    } else if (tag === "link") {
      const rel = (attrs.rel ?? "").toLowerCase();
      if (rel === "canonical") summary.canonical ??= attrs.href;
      else if (rel === "alternate" && attrs.hreflang && attrs.href) {
        summary.hreflang[attrs.hreflang] = attrs.href;
      }
    }
  }
  return { entries, summary };
}

/** Fetch a page from `origin` and parse its head. `status` ≠ 200 → empty entries. */
export async function fetchHeadPreview(origin: string, path: string): Promise<HeadPreview> {
  try {
    const response = await fetch(`${origin}${path}`, {
      headers: { [MIRROR_HEADER]: "1", accept: "text/html" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const html = await response.text();
    if (!response.ok) {
      return {
        status: response.status,
        entries: [],
        summary: { hreflang: {}, jsonLdTypes: [] },
        html,
      };
    }
    return { status: 200, ...parseHead(html), html };
  } catch (error) {
    console.error("[seo] head preview fetch failed:", error instanceof Error ? error.name : error);
    return { status: 0, entries: [], summary: { hreflang: {}, jsonLdTypes: [] }, html: "" };
  }
}
