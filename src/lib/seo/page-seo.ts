/**
 * Data-driven SEO resolution (Phase 6 P6-A). `resolvePageSeo(route)` finds the most specific
 * active `page_seo` row for a route (exact > longest literal prefix > fewest wildcards) and
 * `applyPageSeo(metadata, route)` merges it over the metadata a page built itself. DB-first
 * and memoised per request with `cache()`; with no database (or a failing one) the base
 * metadata is returned untouched, so a public page never depends on Supabase to render.
 *
 * Optional social templates (`site_documents` key `og_templates`) fill the OG/Twitter title
 * and description per content type before the page's own override wins.
 */
import type { Metadata } from "next";
import { and, eq, like, or } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/db";
import { pageSeo, type PageSeoRow, type RobotsDirectives } from "@/db/schema/seo";
import { normalisePath } from "@/lib/routes";
import { getSiteUrl } from "@/lib/site";
import { getOgTemplates, type OgTemplate, type OgTemplates } from "./documents";
import { pickMostSpecific } from "./route-pattern";
import { sanitizeHeadHtml, type HeadTag } from "./sanitize-head";

export type { PageSeoRow };

/** Every active override row, for the admin list and the resolver. */
export async function listPageSeoRows(): Promise<PageSeoRow[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(pageSeo).orderBy(pageSeo.routePattern);
}

/**
 * The most specific active override for `route`, or `null`. One query per request per
 * route: exact rows for this route plus every glob row (globs are few).
 */
export const resolvePageSeo = cache(async (route: string): Promise<PageSeoRow | null> => {
  const db = getDb();
  if (!db) return null;
  const r = normalisePath(route);
  try {
    const rows = await db
      .select()
      .from(pageSeo)
      .where(
        and(
          eq(pageSeo.isActive, true),
          or(eq(pageSeo.routePattern, r), like(pageSeo.routePattern, "%*%")),
        ),
      );
    return pickMostSpecific(rows, r, (row) => row.routePattern);
  } catch (error) {
    console.error("[seo] page_seo lookup failed:", error instanceof Error ? error.name : error);
    return null;
  }
});

/** Content type used to pick a social template. */
export type ContentType = "home" | "geo" | "service" | "article" | "glossary" | "page";

export function contentTypeForRoute(route: string): ContentType {
  const r = normalisePath(route);
  if (r === "/") return "home";
  if (r.startsWith("/astrologer/") || r.startsWith("/vastu-consultant/")) return "geo";
  if (r.startsWith("/services/")) return "service";
  if (/^\/learn\/[^/]+\/[^/]+$/.test(r)) return "article";
  if (r.startsWith("/glossary/")) return "glossary";
  return "page";
}

/** Apply the resolved override (and templates) to `metadata`. Never throws. */
export async function applyPageSeo(metadata: Metadata, route: string): Promise<Metadata> {
  const [row, templates] = await Promise.all([resolvePageSeo(route), getOgTemplates()]);
  if (!row && !templates) return metadata;
  return mergePageSeo(metadata, row, { siteUrl: getSiteUrl(), route, templates });
}

// --- pure merge ------------------------------------------------------------------------------

export interface MergeContext {
  siteUrl: string;
  route: string;
  templates?: OgTemplates | null;
}

type Obj = Record<string, unknown>;

const asObject = (value: unknown): Obj =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : {};

function absoluteTitle(meta: Metadata): string | undefined {
  const t = meta.title;
  if (typeof t === "string") return t;
  if (t && typeof t === "object" && "absolute" in t && typeof t.absolute === "string") {
    return t.absolute;
  }
  if (t && typeof t === "object" && "default" in t && typeof t.default === "string") {
    return t.default;
  }
  return undefined;
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "").trim();
}

/** Robots directives → the Next `robots` object; only set keys are emitted. */
export function robotsFromRow(row: Pick<PageSeoRow, "robots" | "noindex" | "nofollow">) {
  const d: RobotsDirectives = row.robots ?? {};
  const out: NonNullable<Exclude<Metadata["robots"], string>> = {};
  const index = d.index ?? (row.noindex ? false : undefined);
  const follow = d.follow ?? (row.nofollow ? false : undefined);
  if (index !== undefined) out.index = index;
  if (follow !== undefined) out.follow = follow;
  if (d.noarchive) out.noarchive = true;
  if (d.nosnippet) out.nosnippet = true;
  if (typeof d.maxSnippet === "number") out["max-snippet"] = d.maxSnippet;
  if (d.maxImagePreview) out["max-image-preview"] = d.maxImagePreview;
  return out;
}

/** OG image URL for a row: explicit URL, else the generated image with `og_text`. */
export function ogImageForRow(row: PageSeoRow, siteUrl: string, route: string): string | null {
  if (row.ogImageUrl) return row.ogImageUrl;
  if (row.ogText) {
    const kind = /vastu/.test(route) ? "vastu" : "astrologer";
    return `${siteUrl}/api/og?${new URLSearchParams({ title: row.ogText, kind }).toString()}`;
  }
  return null;
}

/** Pure merge: base metadata + templates + row. Exported for tests. */
export function mergePageSeo(base: Metadata, row: PageSeoRow | null, ctx: MergeContext): Metadata {
  const out: Metadata = { ...base };
  const baseTitle = absoluteTitle(base) ?? "";
  const baseDescription = base.description ?? "";

  // 1. Social templates per content type (only fields the template sets).
  const template: OgTemplate | undefined = ctx.templates?.[contentTypeForRoute(ctx.route)];
  if (template && (template.title || template.description)) {
    const vars = { title: baseTitle, description: baseDescription, brand: "Astrologer Kavita" };
    const og = asObject(base.openGraph);
    const tw = asObject(base.twitter);
    const title = template.title ? fillTemplate(template.title, vars) : undefined;
    const description = template.description ? fillTemplate(template.description, vars) : undefined;
    out.openGraph = {
      ...og,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    } as Metadata["openGraph"];
    out.twitter = {
      ...tw,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    } as Metadata["twitter"];
  }
  if (!row) return out;

  // 2. Title / description / canonical.
  if (row.title) out.title = { absolute: row.title };
  if (row.metaDescription) out.description = row.metaDescription;
  const alternates = asObject(base.alternates);
  const languages: Record<string, string> = {
    ...(asObject(alternates.languages) as Record<string, string>),
    ...(row.hreflang ?? {}),
  };
  const head = sanitizeHeadHtml(row.customHeadHtml);
  let canonical = row.canonicalUrl ?? (alternates.canonical as string | undefined);
  const other: Record<string, string> = { ...(asObject(base.other) as Record<string, string>) };
  const ogFromHead: Obj = {};
  const twFromHead: Obj = {};
  for (const tag of head.tags) {
    if (tag.kind === "link") {
      const rel = (tag.attrs.rel ?? "").toLowerCase();
      if (rel === "canonical") canonical = tag.attrs.href;
      else if (rel === "alternate" && tag.attrs.hreflang && tag.attrs.href) {
        languages[tag.attrs.hreflang] = tag.attrs.href;
      }
    } else if (tag.kind === "meta") {
      const content = tag.attrs.content ?? "";
      const property = (tag.attrs.property ?? "").toLowerCase();
      if (tag.attrs.name && !property) other[tag.attrs.name] = content;
      else if (property === "og:title") ogFromHead.title = content;
      else if (property === "og:description") ogFromHead.description = content;
      else if (property === "og:image") ogFromHead.images = [content];
      else if (property === "og:type") ogFromHead.type = content;
      else if (property === "og:locale") ogFromHead.locale = content;
      else if (property === "og:site_name") ogFromHead.siteName = content;
      else if (property === "twitter:card") twFromHead.card = content;
      else if (property === "twitter:title") twFromHead.title = content;
      else if (property === "twitter:description") twFromHead.description = content;
      else if (property === "twitter:image") twFromHead.images = [content];
      else if (property) other[property] = content;
    }
  }
  out.alternates = {
    ...alternates,
    ...(canonical ? { canonical } : {}),
    ...(Object.keys(languages).length ? { languages } : {}),
  } as Metadata["alternates"];
  if (Object.keys(other).length) out.other = other;

  // 3. Robots.
  const robots = robotsFromRow(row);
  if (Object.keys(robots).length) {
    const baseRobots = typeof base.robots === "object" && base.robots ? base.robots : {};
    out.robots = { ...baseRobots, ...robots };
  }

  // 4. Open Graph / Twitter.
  const og = asObject(out.openGraph);
  const image = ogImageForRow(row, ctx.siteUrl, ctx.route);
  const ogTitle = row.ogTitle ?? row.title ?? undefined;
  const ogDescription = row.ogDescription ?? row.metaDescription ?? undefined;
  out.openGraph = {
    ...og,
    ...ogFromHead,
    ...(ogTitle ? { title: ogTitle } : {}),
    ...(ogDescription ? { description: ogDescription } : {}),
    ...(row.ogType ? { type: row.ogType } : {}),
    ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    ...(canonical ? { url: canonical } : {}),
  } as Metadata["openGraph"];
  const tw = asObject(out.twitter);
  const twImage = row.twitterImageUrl ?? image;
  out.twitter = {
    ...tw,
    ...twFromHead,
    ...(row.twitterCard ? { card: row.twitterCard } : {}),
    ...((row.twitterTitle ?? ogTitle) ? { title: row.twitterTitle ?? ogTitle } : {}),
    ...((row.twitterDescription ?? ogDescription)
      ? { description: row.twitterDescription ?? ogDescription }
      : {}),
    ...(twImage ? { images: [twImage] } : {}),
  } as Metadata["twitter"];

  return out;
}

/**
 * Head tags the Metadata API cannot express — JSON-LD blocks and `<link>` rels other than
 * canonical/alternate — rendered in the body by `<PageSeoExtras>` (React hoists `<link>`).
 */
export function pageSeoExtras(row: PageSeoRow | null): HeadTag[] {
  if (!row) return [];
  const extras: HeadTag[] = sanitizeHeadHtml(row.customHeadHtml).tags.filter((tag) => {
    if (tag.kind === "jsonld") return true;
    if (tag.kind === "link") {
      const rel = (tag.attrs.rel ?? "").toLowerCase();
      return rel !== "canonical" && rel !== "alternate";
    }
    return false;
  });
  if (row.structuredDataOverrides && Object.keys(row.structuredDataOverrides).length) {
    extras.push({ kind: "jsonld", json: row.structuredDataOverrides });
  }
  return extras;
}
